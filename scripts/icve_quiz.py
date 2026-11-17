#!/usr/bin/env python3
"""Batch-answer helper for ICVE snapshots.

Modes:
  --auto        answer from the local question bank; print only unresolved
                questions (compact) so the Bot spends tokens on those only.
  --answers F   answer from a small JSON written by the Bot.
  --learn       merge successful answers into the local question bank.

Answer file:
  {"answers": [{"question": "1. ...", "choice": "A"}, ...]}
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from icve_bank import load_bank, normalize, save_bank  # noqa: E402

STATE_DIR = os.path.join(
    os.environ.get("DSH_HOME", os.path.join(os.path.expanduser("~"), ".dsh")),
    "storages",
    "dsh-bot",
)
SNAPSHOT_FILE = os.path.join(STATE_DIR, "icve", "latest.json")
EXAM_MARKERS = ("考试", "监考", "闭卷", "交卷", "答题卡")
SUBMIT_NAMES = ("提交作业", "提交", "交卷", "保存并提交", "确认提交")


def clean(value, limit=2_000):
    return str(value or "").replace("\r\n", "\n").strip()[:limit]


def load_snapshot(path):
    with open(path, "r", encoding="utf-8-sig") as handle:
        data = json.load(handle)
    if data.get("schema") != "dsh.icve.snapshot.v1":
        raise ValueError("不是 ICVE 快照")
    return data


def all_questions(data):
    output = []
    for frame in data.get("frames") or []:
        for question in frame.get("questions") or []:
            text = clean(question.get("text"))
            options = [
                {"text": clean(option.get("text")), "checked": bool(option.get("checked"))}
                for option in question.get("options") or []
                if clean(option.get("text"))
            ]
            if text or options:
                output.append({"text": text, "options": options, "frame": frame.get("title")})
    return output


def match_question(questions, value):
    needle = clean(value)
    if not needle:
        return None
    matches = [q for q in questions if needle == q["text"]]
    if not matches:
        matches = [q for q in questions if needle in q["text"] or q["text"] in needle]
    if matches:
        return matches[0] if len(matches) == 1 else None
    number = re.fullmatch(r"\s*(?:第\s*)?(\d+)(?:题)?\s*", needle)
    if number:
        index = int(number.group(1)) - 1
        if 0 <= index < len(questions):
            return questions[index]
    return None


def option_by_choice(question, choice):
    value = clean(choice).strip()
    options = question.get("options") or []
    if not options:
        return None
    letter = re.match(r"^\s*([A-Za-z])(?:[.、:：)]|\s|$)", value)
    if letter:
        index = ord(letter.group(1).upper()) - ord("A")
        if 0 <= index < len(options):
            return options[index]
    bare = value.upper()
    if len(bare) == 1 and "A" <= bare <= "Z":
        index = ord(bare) - ord("A")
        if 0 <= index < len(options):
            return options[index]
    matches = [option for option in options if value == option["text"]]
    return matches[0] if len(matches) == 1 else None


def option_key(text):
    return re.sub(r"^[A-Za-z][.、:：)）]\s*", "", clean(text)).strip()


def question_key(question):
    text = re.sub(r"\s+", " ", question.get("text", "")).strip()
    option_text = " ".join(option["text"] for option in question.get("options", []))
    if option_text and text.endswith(option_text):
        text = text[:-len(option_text)].rstrip()
    return re.sub(r"^\s*(?:第\s*)?\d+[.、)）题]\s*", "", text)


def bank_match(question, bank):
    normalized = question_key(question)
    if len(normalized) < 6:
        return None
    matches = []
    for item in bank.get("items", []):
        key = item.get("questionKey") or normalize(item.get("q"))
        if key == normalized:
            matches.append(item)
    return matches[0] if len(matches) == 1 else None


def bank_options(question, item):
    indexes = item.get("answers") if isinstance(item, dict) else None
    if not isinstance(indexes, list) or not indexes:
        return []
    options = question.get("options") or []
    stored = item.get("options")
    if not isinstance(stored, list) or not stored:
        return []
    current_keys = [option_key(option["text"]) for option in options]
    stored_keys = [option_key(text) for text in stored]
    if len(set(current_keys)) != len(current_keys) or sorted(current_keys) != sorted(stored_keys):
        return []
    if any(type(index) is not int or not 0 <= index < len(stored) for index in indexes):
        return []
    return [options[current_keys.index(stored_keys[index])] for index in indexes]


def click_option(text):
    for module_name in ("uia_client", "uia_fast"):
        try:
            module = __import__(module_name)
            result = module.click(text, "", True)
            if result.get("ok"):
                return result
        except Exception:
            pass
    import edge

    return edge.uia_run("click", name=text, role="", index=None, all=True)


def click_submit():
    for name in SUBMIT_NAMES:
        result = click_option(name)
        if result.get("ok"):
            return {"name": name, **result}
    return None


def add_bank_entry(bank, question, option_indexes, source="model"):
    normalized = normalize(question.get("text"))
    if not normalized or not option_indexes:
        return
    identity = {"questionKey": question_key(question), "options": [option["text"] for option in question["options"]]}
    for item in bank.setdefault("items", []):
        if item.get("questionKey") == identity["questionKey"] or (
            not item.get("questionKey") and (item.get("normalized") or normalize(item.get("q"))) == normalized
        ):
            item["answers"] = sorted(set(option_indexes))
            item.update(identity)
            item["updatedAt"] = int(time.time() * 1000)
            return
    bank["items"].append(
        {
            "q": question.get("text"),
            "normalized": normalized,
            "answers": sorted(set(option_indexes)),
            "type": "model",
            "source": source,
            "updatedAt": int(time.time() * 1000),
            **identity,
        }
    )


def compact_question(question):
    return {
        "question": clean(question.get("text"), 600),
        "options": [clean(option.get("text"), 200) for option in (question.get("options") or [])[:8]],
    }


def build_plan(questions, bank, answers, auto):
    supplied = {}
    unresolved = []
    for answer in answers:
        if not isinstance(answer, dict):
            unresolved.append({"error": "答案必须是对象"})
            continue
        question = match_question(questions, answer.get("question") or answer.get("q"))
        if question is None or id(question) in supplied:
            unresolved.append({"question": clean(answer.get("question"), 200), "error": "题目未唯一匹配或答案重复"})
        else:
            supplied[id(question)] = answer
    plan = []
    for question in questions:
        answer = supplied.get(id(question))
        item = bank_match(question, bank) if auto else None
        options = bank_options(question, item) if item else []
        if answer:
            choices = answer.get("choices", answer.get("choice", answer.get("answer", answer.get("option", ""))))
            if not isinstance(choices, list):
                choices = [choices]
            options = [option_by_choice(question, choice) for choice in choices]
        if not options or any(option is None for option in options):
            unresolved.append(compact_question(question))
            continue
        indexes = sorted(set(question["options"].index(option) for option in options))
        plan.append({"question": question, "options": [question["options"][i] for i in indexes], "indexes": indexes,
                     "source": "model" if answer else item.get("source", "bank")})
    return plan, unresolved


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--auto", action="store_true", help="answer from local bank")
    parser.add_argument("--answers", default="", help="answer JSON file")
    parser.add_argument("--snapshot", default=SNAPSHOT_FILE)
    parser.add_argument("--submit", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--learn", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--brief", action="store_true", help="compact output (default)")
    parser.add_argument("--verbose", action="store_true", help="include the matched answer plan")
    args = parser.parse_args()
    if not args.auto and not args.answers:
        raise SystemExit("需要 --auto 或 --answers")

    if args.snapshot == SNAPSHOT_FILE:
        from icve_snapshot import read_latest, save_snapshot
        data = read_latest()
        save_snapshot(data)
    else:
        data = load_snapshot(args.snapshot)
    text = "\n".join(str(frame.get("text") or "") for frame in data.get("frames") or [])
    if any(marker in text for marker in EXAM_MARKERS) and not args.force:
        print(json.dumps({"ok": False, "blocked": True, "error": "检测到考试/监考/交卷页面，拒绝批量作答"}, ensure_ascii=False))
        return 2

    questions = all_questions(data)
    if not questions or data.get("missingFrames") or any(frame.get("questionsTruncated") for frame in data.get("frames", [])):
        print(json.dumps({"ok": False, "error": "题目为空、题目过多或有未加载的框架，请分批加载并刷新快照"}, ensure_ascii=False))
        return 2
    bank = load_bank()
    answers = []
    if args.answers:
        with open(args.answers, "r", encoding="utf-8-sig") as handle:
            answer_data = json.load(handle)
        answers = answer_data.get("answers") if isinstance(answer_data, dict) else answer_data
        if not isinstance(answers, list):
            raise ValueError("answers 必须是数组")
    plan, unresolved = build_plan(questions, bank, answers, args.auto)

    if args.dry_run:
        output = {"ok": True, "dryRun": True, "questions": len(questions), "resolved": len(plan),
                  "readyToSubmit": not unresolved, "unresolved": unresolved}
        if args.verbose:
            output["plan"] = [{"question": clean(item["question"]["text"], 200), "options": [option["text"] for option in item["options"]]} for item in plan]
        print(json.dumps(output, ensure_ascii=False, separators=(",", ":")))
        return 0

    if args.submit and unresolved:
        print(json.dumps({"ok": False, "unresolved": unresolved, "error": "仍有未确定答案，补齐后再提交"}, ensure_ascii=False))
        return 1

    from collections import Counter
    labels = Counter(option["text"] for question in questions for option in question["options"])
    results = []
    for item in plan:
        clicks = []
        if any(option["checked"] and option not in item["options"] for option in item["question"]["options"]):
            clicks.append({"ok": False, "error": "已有选择与答案不同，请先核对当前题目"})
        for option in item["options"]:
            if clicks and not clicks[-1].get("ok"):
                break
            if option["checked"]:
                clicks.append({"ok": True, "alreadySelected": True})
            elif labels[option["text"]] > 1:
                clicks.append({"ok": False, "error": "不同题目有同名选项，无法唯一定位"})
            else:
                clicks.append(click_option(option["text"]))
        item["clicks"] = clicks
        item["ok"] = bool(clicks) and all(click.get("ok") for click in clicks)
        results.append(item)

    failed = [item for item in results if not item.get("ok")]
    submitted = None
    if args.submit and not unresolved and not failed:
        submitted = click_submit()
    elif args.submit:
        submitted = {"ok": False, "skipped": True, "error": "存在未匹配/未点击题目，拒绝提交"}

    if args.learn and not failed:
        for item in results:
            add_bank_entry(bank, item["question"], item["indexes"], "model")
        save_bank(bank)

    output = {
        "ok": not failed and not unresolved and (not args.submit or bool(submitted and submitted.get("ok"))),
        "questions": len(questions),
        "resolved": len(results),
        "unresolved": unresolved,
        "clickedQuestions": len([item for item in results if item.get("ok")]),
        "failed": [
            {"question": clean(item["question"]["text"], 200), "clicks": item.get("clicks")}
            for item in failed
        ],
        "submitted": submitted,
    }
    print(json.dumps(output, ensure_ascii=False, separators=(",", ":")))
    return 0 if output["ok"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        raise SystemExit(1)
