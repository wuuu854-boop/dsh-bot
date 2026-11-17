#!/usr/bin/env python3
"""Build and inspect the local ICVE question bank.

The bank stores question stems and answer indexes from previously verified
quizzes. It stays in the Bot state directory, not in the plugin package.

  python scripts/icve_bank.py seed --file answers.md
  python scripts/icve_bank.py stats
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
STATE_DIR = os.path.join(
    os.environ.get("DSH_HOME", os.path.join(os.path.expanduser("~"), ".dsh")),
    "storages",
    "dsh-bot",
)
BANK_FILE = os.path.join(STATE_DIR, "icve", "question-bank.json")


def normalize(text):
    value = str(text or "").lower()
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"[\s\u3000]+", "", value)
    value = re.sub(r"[（）()【】\[\]<>《》\"'`，。,.、：:；;!！?？]", "", value)
    return value


def load_bank():
    try:
        with open(BANK_FILE, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        if isinstance(data, dict) and isinstance(data.get("items"), list):
            return data
    except FileNotFoundError:
        return {"version": 1, "updatedAt": 0, "items": []}
    raise ValueError("题库格式损坏，请恢复备份后重试")


def save_bank(data):
    os.makedirs(os.path.dirname(BANK_FILE), exist_ok=True)
    data["version"] = 1
    data["updatedAt"] = int(time.time() * 1000)
    temp = BANK_FILE + ".tmp"
    with open(temp, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
    os.replace(temp, BANK_FILE)


def parse_markdown(path):
    entries = []
    with open(path, "r", encoding="utf-8-sig") as handle:
        for line in handle:
            line = line.strip()
            if not line.startswith("|") or not line.endswith("|"):
                continue
            cells = [cell.strip() for cell in line.strip("|").split("|")]
            if len(cells) < 6 or not cells[0].isdigit():
                continue
            number, kind, score, answer, reason, question = cells[:6]
            indexes = [int(value) for value in re.findall(r"\d+", answer)]
            question = question.strip()
            if not question or not indexes:
                continue
            entries.append(
                {
                    "q": question,
                    "normalized": normalize(question),
                    "answers": indexes,
                    "type": kind,
                    "score": score,
                    "source": os.path.basename(path),
                    "number": int(number),
                }
            )
    return entries


def merge_entries(bank, entries):
    by_norm = {
        item.get("normalized") or normalize(item.get("q")): item
        for item in bank.get("items", [])
        if item.get("q")
    }
    added = 0
    for entry in entries:
        key = entry["normalized"]
        if not key:
            continue
        if key in by_norm:
            existing = by_norm[key]
            existing["answers"] = entry["answers"]
            existing.pop("options", None)
            existing.pop("questionKey", None)
            existing["type"] = entry.get("type") or existing.get("type")
            existing["updatedAt"] = int(time.time() * 1000)
            continue
        entry["updatedAt"] = int(time.time() * 1000)
        bank.setdefault("items", []).append(entry)
        by_norm[key] = entry
        added += 1
    return added


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["seed", "stats", "list"])
    parser.add_argument("--file", action="append", default=[])
    args = parser.parse_args()
    bank = load_bank()
    if args.command == "seed":
        if not args.file:
            raise SystemExit("seed 需要 --file")
        total = 0
        for path in args.file:
            entries = parse_markdown(path)
            total += merge_entries(bank, entries)
            print(f"parsed {len(entries)} from {path}", file=sys.stderr)
        save_bank(bank)
        print(json.dumps({"ok": True, "file": BANK_FILE, "added": total, "total": len(bank["items"])}, ensure_ascii=False))
    elif args.command == "stats":
        print(json.dumps({"ok": True, "file": BANK_FILE, "total": len(bank["items"])}, ensure_ascii=False))
    elif args.command == "list":
        print(json.dumps({"ok": True, "items": bank["items"][:100]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
