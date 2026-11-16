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
BANK_FILE = os.path.join(STATE_DIR, "icve", "question-bank.json")
EXAM_MARKERS = ("考试", "监考", "闭卷", "交卷", "答题卡")
SUBMIT_NAMES = ("提交作业", "提交", "交卷", "保存并提交", "确认提交")


def clean(value, limit=2_000):
    return str(value or "").replace("\r\n", "\n").strip()[:limit]


def normalize(text):
    value = str(text or "").lower()
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"[\s\u3000]+", "", value)
    value = re.sub(r"[（）()【】\[\]<>《》\"'`，。,.、：:；;!！?？]", "", value)
    return value


def load_snapshot(path):
    with open(path, "r", encoding="utf-8-sig") as handle:
        data = json.load(handle)
    if data.get("schema") != "dsh.icve.snapshot.v1":
        raise ValueError("不是 ICVE 快照")
    return data


def load_bank():
    try:
        with open(BANK_FILE, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        if isinstance(data, dict) and isinstance(data.get("items"), list):
            return data
    except Exception:
        pass
    return {"version": 1, "items": []}


def save_bank(data):
    os.makedirs(os.path.dirname(BANK_FILE), exist_ok=True)
    data["version"] = 1
    data["updatedAt"] = int(time.time() * 1000)
    temp = BANK_FILE + ".tmp"
    with open(temp, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
    os.replace(temp, BANK_FILE)


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


def bank_match(question, bank):
    normalized = normalize(question.get("text"))
    if len(normalized) < 6:
        return None
    best = None
    best_score = 0
    for item in bank.get("items", []):
        key = item.get("normalized") or normalize(item.get("q"))
        if len(key) < 6:
            continue
        if key in normalized or normalized in key:
            score = len(key)
            if score > best_score:
                best = item
                best_score = score
    return best


def bank_options(question, item):
    indexes = item.get("answers") if isinstance(item, dict) else None
    if not isinstance(indexes, list) or not indexes:
        return []
    options = question.get("options") or []
    selected = []
    for index in indexes:
        try:
            value = int(index)
        except Exception:
            continue
        if 0 <= value < len(options):
            selected.append(options[value])
    return selected if len(selected) == len(indexes) else []


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


def add_bank_entry(bank, question, option_indexes, source="model"):
    normalized = normalize(question.get("text"))
    if not normalized or not option_indexes:
        return
    for item in bank.setdefault("items", []):
        if (item.get("normalized") or normalize(item.get("q"))) == normalized:
            item["answers"] = sorted(set(option_indexes))
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
        }
    )


def compact_question(question):
    return {
        "question": clean(question.get("text"), 600),
        "options": [clean(option.get("text"), 200) for option in (question.get("options") or [])[:8]],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--auto", action="store_true", help="answer from local bank")
    parser.add_argument("--answers", default="", help="answer JSON file")
    parser.add_argument("--snapshot", default=SNAPSHOT_FILE)
    parser.add_argument("--submit", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--learn", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    if not args.auto and not args.answers:
        raise SystemExit("需要 --auto 或 --answers")

    data = load_snapshot(args.snapshot)
    text = "\n".join(clean(frame.get("text")) for frame in data.get("frames") or [])
    if any(marker in text for marker in EXAM_MARKERS) and not args.force:
        print(json.dumps({"ok": False, "blocked": True, "error": "检测到考试/监考/交卷页面，拒绝批量作答"}, ensure_ascii=False))
        return 2

    questions = all_questions(data)
    bank = load_bank()
    plan = []
    unresolved = []

    if args.auto:
        for question in questions:
            item = bank_match(question, bank)
            options = bank_options(question, item) if item else []
            if options:
                plan.append(
                    {
                        "question": question,
                        "options": options,
                        "indexes": [question["options"].index(option) for option in options],
                        "source": item.get("source") or "bank",
                    }
                )
            else:
                unresolved.append(compact_question(question))
    else:
        with open(args.answers, "r", encoding="utf-8-sig") as handle:
            answer_data = json.load(handle)
        answers = answer_data.get("answers") if isinstance(answer_data, dict) else answer_data
        if not isinstance(answers, list):
            raise ValueError("answers 必须是数组")
        for item in answers:
            if not isinstance(item, dict):
                continue
            question = match_question(questions, item.get("question") or item.get("q") or "")
            choice = item.get("choice") or item.get("answer") or item.get("option") or ""
            option = option_by_choice(question, choice) if question else None
            if not question or not option:
                unresolved.append({"question": clean(item.get("question"), 400), "error": "题目/选项未匹配"})
                continue
            index = question["options"].index(option)
            plan.append({"question": question, "options": [option], "indexes": [index], "source": "model"})

    if args.dry_run:
        print(
            json.dumps(
                {
                    "ok": True,
                    "dryRun": True,
                    "questions": len(questions),
                    "resolved": len(plan),
                    "unresolved": unresolved,
                    "plan": [
                        {"question": clean(item["question"]["text"], 200), "options": [option["text"] for option in item["options"]]}
                        for item in plan
                    ],
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    results = []
    for item in plan:
        clicks = []
        for option in item["options"]:
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
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0 if output["ok"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        raise SystemExit(1)
