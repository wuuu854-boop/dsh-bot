import contextlib
import io
import importlib.util
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace

import icve_bank as bank
import icve_quiz as quiz
import icve_snapshot as snapshot


def question(text="哪一个选项是有效颜色？", labels=("A. 红色", "B. 绿色")):
    return {"text": text, "options": [{"text": label, "checked": False} for label in labels]}


def page(questions=None, current=1, ended=False):
    return {"schema": snapshot.SCHEMA, "capturedAt": datetime.now(timezone.utc).isoformat(),
            "tab": {"id": 1, "url": "https://mooc.icve.com.cn/course", "title": "课程"},
            "frames": [{"text": "课程正文", "questions": questions or [], "media": [
                {"kind": "video", "currentTime": current, "duration": 100, "paused": ended,
                 "ended": ended, "readyState": 4, "error": None}]}]}


class IcveTests(unittest.TestCase):
    def invoke_quiz(self, data, args, items=None):
        output = io.StringIO()
        with patch.object(quiz, "load_snapshot", return_value=data), patch.object(quiz, "load_bank", return_value={"items": items or []}), \
                patch.object(quiz, "click_option", return_value={"ok": True}) as click, \
                patch.object(quiz, "click_submit", return_value={"ok": True}) as submit, \
                patch("sys.argv", ["icve_quiz.py", "--snapshot", "fixture.json", *args]), contextlib.redirect_stdout(output):
            code = quiz.main()
        return code, json.loads(output.getvalue()), click.call_count, submit.call_count

    def test_option_reordering_uses_the_answer_text(self):
        q = question()
        data = {"items": []}
        quiz.add_bank_entry(data, q, [0])
        reordered = question(labels=("A. 绿色", "B. 红色"))
        selected = quiz.bank_options(reordered, quiz.bank_match(reordered, data))
        self.assertEqual([item["text"] for item in selected], ["B. 红色"])
        self.assertEqual(quiz.bank_options(q, {"answers": [0]}), [])

    def test_learning_keeps_operators_and_updates_reordered_questions(self):
        data = {"items": []}
        first = question("1. 下列哪一个值符合 x > 2？ A. 红色 B. 绿色")
        second = question("1. 下列哪一个值符合 x < 2？ A. 红色 B. 绿色")
        quiz.add_bank_entry(data, first, [0])
        quiz.add_bank_entry(data, second, [1])
        reordered = question("2. 下列哪一个值符合 x > 2？ A. 绿色 B. 红色", ("A. 绿色", "B. 红色"))
        quiz.add_bank_entry(data, reordered, [1])
        self.assertEqual(len(data["items"]), 2)
        self.assertEqual(quiz.bank_options(first, quiz.bank_match(first, data)), [first["options"][0]])
        self.assertEqual(quiz.bank_options(second, quiz.bank_match(second, data)), [second["options"][1]])

    def test_auto_and_manual_answers_cover_all_questions(self):
        first, second = question(), question("哪一种水果含有果核？", ("苹果", "香蕉"))
        data = {"items": []}
        quiz.add_bank_entry(data, first, [0])
        plan, missing = quiz.build_plan([first, second], data, [{"question": "2", "choices": ["B"]}], True)
        self.assertEqual(len(plan), 2)
        self.assertEqual(missing, [])
        _, missing = quiz.build_plan([first, second], data, [{"question": "2", "choice": "B"}], False)
        self.assertEqual(len(missing), 1)

    def test_compact_dry_run_omits_known_question_text(self):
        q = question()
        data = {"items": []}
        quiz.add_bank_entry(data, q, [0])
        code, out, clicks, submits = self.invoke_quiz(page([q]), ["--auto", "--dry-run"], data["items"])
        self.assertEqual((code, out["resolved"], clicks, submits), (0, 1, 0, 0))
        self.assertNotIn("plan", out)
        self.assertNotIn(q["text"], json.dumps(out, ensure_ascii=False))

    def test_empty_and_partial_pages_cannot_submit(self):
        truncated = page([question()])
        truncated["frames"][0]["questionsTruncated"] = True
        for data in (page(), {**page([question()]), "missingFrames": 1}, page([question()]), truncated):
            code, _, clicks, submits = self.invoke_quiz(data, ["--auto", "--submit"])
            self.assertNotEqual(code, 0)
            self.assertEqual((clicks, submits), (0, 0))

    def test_checked_options_are_not_toggled_again(self):
        q = question()
        q["options"][0]["checked"] = True
        data = {"items": []}
        quiz.add_bank_entry(data, q, [0])
        code, out, clicks, _ = self.invoke_quiz(page([q]), ["--auto"], data["items"])
        self.assertEqual((code, clicks, out["resolved"]), (0, 0, 1))

    def test_ambiguous_question_and_duplicate_options_are_rejected(self):
        q = question()
        self.assertIsNone(quiz.match_question([q, question()], "哪一个"))
        self.assertEqual(quiz.bank_options(question(labels=("A. 红色", "B. 红色")), {"answers": [0], "options": ["红色", "红色"]}), [])

    def test_exam_marker_after_long_text_is_seen(self):
        data = page([question()])
        data["frames"][0]["text"] = "课程内容" * 600 + "监考"
        code, out, clicks, submits = self.invoke_quiz(data, ["--auto", "--submit"])
        self.assertEqual(code, 2)
        self.assertTrue(out["blocked"])
        self.assertEqual((clicks, submits), (0, 0))

    def test_video_ticks_keep_revision_but_completion_changes_it(self):
        first = snapshot.course_view(page(current=1))
        later = snapshot.course_view(page(current=50))
        ended = snapshot.course_view(page(current=100, ended=True))
        self.assertEqual(first["revision"], later["revision"])
        self.assertNotEqual(first["revision"], ended["revision"])
        self.assertEqual(ended["phase"], "video-ended")

    def test_wait_reuses_local_reads_until_a_decision_changes(self):
        initial = snapshot.course_view(page())
        with patch.object(snapshot, "read_latest", side_effect=[page(current=2), page(ended=True)]), \
                patch.object(snapshot, "save_snapshot") as save, patch.object(snapshot.time, "sleep") as sleep:
            result = snapshot.wait_for_change(initial["revision"])
        self.assertTrue(result["changed"])
        self.assertEqual(sleep.call_count, 1)
        self.assertEqual(save.call_count, 1)

    def test_wait_timeout_distinguishes_playback_progress_from_a_stall(self):
        revision = snapshot.course_view(page())["revision"]
        for current, expected in ((40, True), (1, False)):
            clock = [0]
            with patch.object(snapshot, "read_latest", side_effect=lambda: page(current=min(current, 1 + clock[0]))), \
                    patch.object(snapshot.time, "monotonic", side_effect=lambda: clock[0]), \
                    patch.object(snapshot.time, "sleep", side_effect=lambda seconds: clock.__setitem__(0, clock[0] + seconds)):
                result = snapshot.wait_for_change(revision, timeout=60)
            self.assertFalse(result["changed"])
            self.assertEqual(result["progressed"], expected)

    def test_stale_download_is_not_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "dsh-icve-latest.json"
            data = page()
            data["capturedAt"] = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
            path.write_text(json.dumps(data), encoding="utf-8")
            with patch.object(snapshot, "find_download_snapshot", return_value=path):
                with self.assertRaises(ValueError):
                    snapshot.read_latest()

    def test_corrupt_bank_is_not_silently_replaced(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bank.json"
            path.write_text("{", encoding="utf-8")
            with patch.object(bank, "BANK_FILE", str(path)):
                with self.assertRaises(ValueError):
                    bank.load_bank()
            self.assertEqual(path.read_text(encoding="utf-8"), "{")

    def test_transient_download_read_is_retried_locally(self):
        data = page()
        for temporary in ("{", PermissionError("file is being replaced")):
            with patch.object(snapshot, "find_download_snapshot", return_value=Path("fixture.json")), \
                    patch.object(Path, "read_text", side_effect=[temporary, json.dumps(data)]), patch.object(snapshot.time, "sleep") as sleep:
                self.assertEqual(snapshot.read_latest()["tab"], data["tab"])
                self.assertEqual(sleep.call_count, 1)

    def test_document_or_media_replacement_changes_revision_but_buffer_ticks_do_not(self):
        first = page()
        first["frames"][0]["documentId"] = "document-1"
        first["frames"][0]["media"][0]["id"] = 1
        initial = snapshot.course_view(first)["revision"]
        first["frames"][0]["media"][0]["readyState"] = 3
        self.assertEqual(snapshot.course_view(first)["revision"], initial)
        first["frames"][0]["media"][0]["id"] = 2
        self.assertNotEqual(snapshot.course_view(first)["revision"], initial)
        first["frames"][0]["media"][0]["id"] = 1
        first["frames"][0]["documentId"] = "document-2"
        self.assertNotEqual(snapshot.course_view(first)["revision"], initial)

    def test_incomplete_frames_are_loading_not_playing(self):
        data = page()
        data["missingFrames"] = 1
        self.assertEqual(snapshot.course_view(data)["phase"], "loading")

    def test_five_minutes_of_playback_need_one_wait_result(self):
        clock = [0]
        revision = snapshot.course_view(page())["revision"]
        with patch.object(snapshot, "read_latest", side_effect=lambda: page(current=1 + clock[0])), \
                patch.object(snapshot.time, "monotonic", side_effect=lambda: clock[0]), \
                patch.object(snapshot.time, "sleep", side_effect=lambda seconds: clock.__setitem__(0, clock[0] + seconds)):
            result = snapshot.wait_for_change(revision)
        self.assertEqual(clock[0], 300)
        self.assertFalse(result["changed"])
        self.assertTrue(result["progressed"])

    def test_stalled_playback_returns_before_long_wait_deadline(self):
        clock = [0]
        revision = snapshot.course_view(page())["revision"]
        with patch.object(snapshot, "read_latest", side_effect=lambda: page(current=1 + min(clock[0], 20))), \
                patch.object(snapshot.time, "monotonic", side_effect=lambda: clock[0]), \
                patch.object(snapshot.time, "sleep", side_effect=lambda seconds: clock.__setitem__(0, clock[0] + seconds)):
            result = snapshot.wait_for_change(revision, timeout=300)
        self.assertEqual(clock[0], 65)
        self.assertTrue(result["stalled"])
        self.assertFalse(result["progressed"])

    def test_backward_seek_followed_by_playback_still_counts_as_progress(self):
        clock = [0]
        revision = snapshot.course_view(page(current=100))["revision"]
        with patch.object(snapshot, "read_latest", side_effect=lambda: page(current=100 if clock[0] == 0 else clock[0] - 1)), \
                patch.object(snapshot.time, "monotonic", side_effect=lambda: clock[0]), \
                patch.object(snapshot.time, "sleep", side_effect=lambda seconds: clock.__setitem__(0, clock[0] + seconds)):
            result = snapshot.wait_for_change(revision, timeout=60)
        self.assertTrue(result["progressed"])
        self.assertFalse(result["stalled"])

    def test_cli_accepts_long_local_wait(self):
        with patch.object(snapshot, "wait_for_change", return_value={"ok": True}) as wait, \
                patch("sys.argv", ["icve_snapshot.py", "watch", "--since", "abc", "--timeout", "300"]), \
                contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as exit:
                snapshot.main()
            self.assertEqual(exit.exception.code, 0)
            wait.assert_called_once_with("abc", 300)


class CourseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("course_test", Path(__file__).with_name("course.py"))
        cls.course = importlib.util.module_from_spec(spec)
        with patch.dict("sys.modules", {name: SimpleNamespace() for name in ("computer", "edge", "uia_fast", "uia_client")}):
            spec.loader.exec_module(cls.course)

    def test_equal_length_text_changes_are_detected(self):
        first = {"text": "第 1 页", "textLength": 5}
        second = {"text": "第 2 页", "textLength": 5}
        self.assertNotEqual(self.course.signature(first), self.course.signature(second))

    def test_keyboard_fallback_does_not_claim_unverified_success(self):
        course = self.course
        data = {"ok": True, "signature": "same"}
        with patch.object(course, "guard", return_value=None), patch.object(course, "activate_safety"), \
                patch.object(course.computer, "press_combo", create=True), patch.object(course, "read_page", return_value=data):
            for action in (course.do_play, course.do_ppt):
                result = action(data)
                self.assertFalse(result["ok"])
                self.assertTrue(result["stalled"])

    def test_invalid_or_failed_answer_cannot_submit(self):
        course = self.course
        data = {"controls": [{"role": "RadioButton", "name": "A"}, {"role": "Button", "name": "提交"}]}
        with patch.object(course, "guard", return_value=None), patch.object(course, "activate_safety"), \
                patch.object(course, "click_candidate", return_value={"ok": False}) as click:
            self.assertFalse(course.do_answer(data, choice="unknown", submit=True)["ok"])
            self.assertEqual(click.call_count, 0)
            self.assertFalse(course.do_answer(data, choice="A", submit=True)["ok"])
            self.assertEqual(click.call_count, 1)


if __name__ == "__main__":
    unittest.main()
