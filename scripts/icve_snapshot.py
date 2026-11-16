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
import re
import sys
import winreg
from pathlib import Path

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
SENSITIVE_KEY = re.compile(
    r"(password|passwd|phone|mobile|email|avatar|real.?name|nick.?name|user.?name|user.?id|"
    r"job.?no|student.?id|student.?no|id.?card|school.?name|school.?number|class.?name|"
    r"token|session|ticket|authorization)",
    re.I,
)
SENSITIVE_URL = re.compile(r"/system/user/|getInfo|login|logout|auth|sso|token|session", re.I)


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def clean(value, limit=4_000):
    text = str(value or "").replace("\r\n", "\n").strip()
    return text[:limit] + ("…" if len(text) > limit else "")


def clean_url(raw):
    text = str(raw or "")
    try:
        from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

        parts = urlsplit(text)
        query = [
            (key, "[redacted]" if key.lower() in {"token", "ticket", "session", "sessionid", "authorization"} else value)
            for key, value in parse_qsl(parts.query, keep_blank_values=True)
        ]
        return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))
    except Exception:
        return text


def redact(value, depth=0):
    if depth > 8:
        return "[depth]"
    if isinstance(value, list):
        return [redact(item, depth + 1) for item in value[:200]]
    if not isinstance(value, dict):
        return value
    output = {}
    for key, item in list(value.items())[:200]:
        if SENSITIVE_KEY.search(str(key)):
            output[key] = "[redacted]"
        else:
            output[key] = redact(item, depth + 1)
    return output


def sanitize_snapshot(data):
    data = redact(data)
    data["tab"] = data.get("tab") if isinstance(data.get("tab"), dict) else {}
    data["tab"]["url"] = clean_url(data["tab"].get("url"))
    for frame in data.get("frames") or []:
        frame["url"] = clean_url(frame.get("url"))
        frame["api"] = [
            entry for entry in (frame.get("api") or [])
            if isinstance(entry, dict) and not SENSITIVE_URL.search(str(entry.get("url") or ""))
        ]
    data["api"] = [
        entry for entry in (data.get("api") or [])
        if isinstance(entry, dict) and not SENSITIVE_URL.search(str(entry.get("url") or ""))
    ]
    return data


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
    return sanitize_snapshot(data)


def download_dirs():
    dirs = []
    try:
        key = r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders"
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key) as handle:
            value, _ = winreg.QueryValueEx(handle, "{374DE290-123F-4565-9164-39C4925E467B}")
        dirs.append(Path(os.path.expandvars(value)))
    except Exception:
        pass
    dirs.append(Path.home() / "Downloads")
    dirs.append(Path.home() / "OneDrive" / "Downloads")
    return [path for path in dirs if path.is_dir()]


def find_download_snapshot():
    candidates = []
    for directory in download_dirs():
        candidates.extend(directory.glob("dsh-icve-latest*.json"))
    if not candidates:
        raise FileNotFoundError(
            "没有找到自动快照；请确认 ICVE 扩展已开启自动保存，或先点「复制 JSON 给 DSH」再运行 save"
        )
    return max(candidates, key=lambda path: path.stat().st_mtime)


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
    parser.add_argument("command", choices=["save", "latest", "summary", "read", "controls", "questions", "file"])
    parser.add_argument("--file", default="")
    parser.add_argument("--limit", type=int, default=20_000)
    args = parser.parse_args()

    if args.command == "latest":
        path = find_download_snapshot()
        with open(path, "r", encoding="utf-8-sig") as handle:
            data = parse_payload(handle.read())
        save_snapshot(data)
        emit({"ok": True, "source": str(path), "saved": SNAPSHOT_FILE, **summarize(data)})

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
