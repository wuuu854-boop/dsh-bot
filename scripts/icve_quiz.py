#!/usr/bin/env python3
"""Batch-answer helper for ICVE snapshots.

The extension supplies the structured snapshot; the Bot supplies a small answer
JSON. This script clicks all selected options in one process instead of spawning
one UIA process per question.

Answer file:

  {"answers": [
    {"question": "1. ...", "choice": "A"},
    {"question": "2. ...", "answer": "图片"}
  ]}

`choice` may be a letter (A/B/C/D) or an option text; `answer` is an alias.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import edge  # noqa: E402
try:
    import uia_client  # noqa: E402
except Exception:
    uia_client = None
try:
    import uia_fast  # noqa: E402
except Exception:
    uia_fast = None

STATE_DIR = os.path.join(
    os.environ.get("DSH_HOME", os.path.join(os.path.expanduser("~"), ".dsh")),
    "storages",
    "dsh-bot",
)
SNAPSHOT_FILE = os.path.join(STATE_DIR, "icve", "latest.json")
EXAM_MARKERS = ("考试", "监考", "闭卷", "交卷", "答题卡")
SUBMIT_NAMES = ("提交作业", "提交", "交卷", "保存并提交", "确认提交")


def clean(value, limit=2_000):
    text = str(value or "").replace("\r\n", "\n").strip()
    return text[:limit]


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
    for question in questions:
        if needle in question["text"] or question["text"] in needle:
            return question
    # A numeric prefix such as "1" or "第1题" is often enough.
    number = re.match(r"\s*(?:第\s*)?(\d+)", needle)
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
    for option in options:
        text = option["text"]
        if value and (value in text or text in value):
            return option
    return None


def click_option(text):
    if uia_client is not None:
        try:
            result = uia_client.click(text, "", True)
            if result.get("ok"):
                return result
        except Exception:
            pass
    if uia_fast is not None:
        try:
            result = uia_fast.click(text, "", True)
            if result.get("ok"):
                return result
        except Exception:
            pass
    return edge.uia_run("click", name=text, role="", index=None, all=True)


def click_submit():
    for name in SUBMIT_NAMES:
        result = click_option(name)
        if result.get("ok"):
            return {"name": name, **result}
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--answers", required=True, help="answer JSON file")
    parser.add_argument("--snapshot", default=SNAPSHOT_FILE)
    parser.add_argument("--submit", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    data = load_snapshot(args.snapshot)
    text = "\n".join(clean(frame.get("text")) for frame in data.get("frames") or [])
    if any(marker in text for marker in EXAM_MARKERS) and not args.force:
        print(json.dumps({"ok": False, "blocked": True, "error": "检测到考试/监考/交卷页面，拒绝批量作答"}, ensure_ascii=False))
        return 2

    with open(args.answers, "r", encoding="utf-8-sig") as handle:
        answer_data = json.load(handle)
    answers = answer_data.get("answers") if isinstance(answer_data, dict) else answer_data
    if not isinstance(answers, list):
        raise ValueError("answers 必须是数组")

    questions = all_questions(data)
    plan = []
    for item in answers:
        if not isinstance(item, dict):
            continue
        question = match_question(questions, item.get("question") or item.get("q") or "")
        choice = item.get("choice") or item.get("answer") or item.get("option") or ""
        if not question:
            plan.append({"ok": False, "error": "题目未匹配", "item": item})
            continue
        option = option_by_choice(question, choice)
        if not option:
            plan.append({"ok": False, "error": "选项未匹配", "item": item, "question": question["text"]})
            continue
        plan.append({"ok": True, "question": question["text"], "option": option["text"]})

    if args.dry_run:
        print(json.dumps({"ok": True, "dryRun": True, "plan": plan, "questions": len(questions)}, ensure_ascii=False, indent=2))
        return 0

    results = []
    for entry in plan:
        if not entry.get("ok"):
            results.append(entry)
            continue
        result = click_option(entry["option"])
        results.append({**entry, "click": result, "ok": bool(result.get("ok"))})

    failed = [item for item in results if not item.get("ok")]
    submitted = None
    if args.submit and not failed:
        submitted = click_submit()
    elif args.submit and failed:
        submitted = {"ok": False, "skipped": True, "error": "有选项未点击成功，拒绝提交"}

    output = {
        "ok": not failed and (not args.submit or bool(submitted and submitted.get("ok"))),
        "questions": len(questions),
        "clicked": len([item for item in results if item.get("click", {}).get("ok")]),
        "failed": failed,
        "submitted": submitted,
        "results": results,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0 if output["ok"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        raise SystemExit(1)
