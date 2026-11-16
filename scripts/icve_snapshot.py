#!/usr/bin/env python3
"""Read and normalize snapshots produced by the DSH ICVE browser extension.

The extension copies a JSON snapshot to the clipboard. Bot workflow:

  python scripts/icve_snapshot.py save
  python scripts/icve_snapshot.py summary
  python scripts/icve_snapshot.py read

This module never talks to the extension directly; it only consumes the
clipboard/file payload, so it works without any local server or native host.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

STATE_DIR = os.path.join(
    os.environ.get("DSH_HOME", os.path.join(os.path.expanduser("~"), ".dsh")),
    "storages",
    "dsh-bot",
)
SNAPSHOT_FILE = os.path.join(STATE_DIR, "icve", "latest.json")
SCHEMA = "dsh.icve.snapshot.v1"


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def clean(value, limit=4_000):
    text = str(value or "").replace("\r\n", "\n").strip()
    return text[:limit] + ("…" if len(text) > limit else "")


def parse_payload(raw):
    text = str(raw or "").strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.startswith("json"):
            text = text[4:].lstrip()
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("剪贴板里没有 JSON 快照")
    data = json.loads(text[start : end + 1])
    if data.get("schema") != SCHEMA:
        raise ValueError(f"快照 schema 不是 {SCHEMA}")
    if not isinstance(data.get("frames"), list):
        raise ValueError("快照缺少 frames")
    return data


def clipboard_payload():
    import computer

    text = computer.clipboard_get()
    if not text:
        raise ValueError("剪贴板为空")
    return parse_payload(text)


def save_snapshot(data):
    os.makedirs(os.path.dirname(SNAPSHOT_FILE), exist_ok=True)
    temp = SNAPSHOT_FILE + ".tmp"
    with open(temp, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
    os.replace(temp, SNAPSHOT_FILE)
    return SNAPSHOT_FILE


def load_snapshot():
    try:
        with open(SNAPSHOT_FILE, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return None


def summarize(data):
    frames = data.get("frames") or []
    return {
        "ok": True,
        "schema": data.get("schema"),
        "capturedAt": data.get("capturedAt"),
        "page": {
            "url": data.get("tab", {}).get("url") or (frames[0].get("url") if frames else ""),
            "title": data.get("tab", {}).get("title") or (frames[0].get("title") if frames else ""),
        },
        "frames": [
            {
                "url": frame.get("url"),
                "title": frame.get("title"),
                "textLength": len(str(frame.get("text") or "")),
                "controls": len(frame.get("controls") or []),
                "questions": len(frame.get("questions") or []),
                "links": len(frame.get("links") or []),
                "api": len(frame.get("api") or []),
            }
            for frame in frames
        ],
        "api": [
            {"method": entry.get("method"), "url": entry.get("url"), "at": entry.get("at")}
            for entry in (data.get("api") or [])[:30]
        ],
        "questions": [
            {
                "text": clean(question.get("text"), 800),
                "options": [
                    {"text": clean(option.get("text"), 200), "checked": bool(option.get("checked"))}
                    for option in (question.get("options") or [])[:12]
                ],
            }
            for frame in frames
            for question in (frame.get("questions") or [])[:5]
        ][:20],
    }


def read_text(data, limit=20_000):
    parts = []
    for frame in data.get("frames") or []:
        text = str(frame.get("text") or "").strip()
        if not text:
            continue
        title = str(frame.get("title") or frame.get("url") or "frame")
        parts.append(f"===== {title} =====\n{text}")
    return "\n\n".join(parts)[:limit]


def main():
    parser = argparse.ArgumentParser(description="DSH ICVE extension snapshot reader")
    parser.add_argument("command", choices=["save", "summary", "read", "controls", "questions", "file"])
    parser.add_argument("--file", default="")
    parser.add_argument("--limit", type=int, default=20_000)
    args = parser.parse_args()

    if args.command == "file":
        if not args.file:
            emit({"ok": False, "error": "file 需要 --file"}, 2)
        with open(args.file, "r", encoding="utf-8-sig") as handle:
            data = parse_payload(handle.read())
        save_snapshot(data)
        emit({"ok": True, **summarize(data)})

    if args.command == "save":
        data = clipboard_payload()
        save_snapshot(data)
        emit({"ok": True, "saved": SNAPSHOT_FILE, **summarize(data)})

    data = load_snapshot()
    if not data:
        emit({"ok": False, "error": "还没有快照；先在 ICVE 页点「复制 JSON 给 DSH」并运行 save"}, 2)

    if args.command == "summary":
        emit(summarize(data))
    if args.command == "read":
        emit({"ok": True, "text": read_text(data, args.limit)})
    if args.command == "controls":
        emit({
            "ok": True,
            "controls": [
                control
                for frame in data.get("frames") or []
                for control in (frame.get("controls") or [])
            ][:500],
        })
    if args.command == "questions":
        emit({
            "ok": True,
            "questions": [
                question
                for frame in data.get("frames") or []
                for question in (frame.get("questions") or [])
            ][:100],
        })


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        emit({"ok": False, "error": str(error)}, 1)
