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
import hashlib
import json
import os
import re
import sys
import tempfile
import time
from datetime import datetime, timezone
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
        import winreg

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
    fd, temp = tempfile.mkstemp(dir=os.path.dirname(SNAPSHOT_FILE), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False)
        os.replace(temp, SNAPSHOT_FILE)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)
    return SNAPSHOT_FILE


def read_latest(max_age=90):
    for attempt in range(3):
        try:
            path = find_download_snapshot()
            data = parse_payload(path.read_text(encoding="utf-8-sig"))
            break
        except (OSError, ValueError):
            if attempt == 2:
                raise
            # The browser may be replacing the file while it is being read.
            time.sleep(0.2)
    stamp = datetime.fromisoformat(str(data.get("capturedAt", "")).replace("Z", "+00:00"))
    age = (datetime.now(timezone.utc) - stamp).total_seconds()
    if not -5 <= age <= max_age:
        raise ValueError("ICVE 快照已过期，请切回课程标签页并刷新助手")
    if not data.get("frames"):
        raise ValueError("ICVE 页面仍在加载，请等待扩展采集到页面")
    return data


def course_view(data):
    frames = data.get("frames") or []
    media = [item for frame in frames for item in frame.get("media", [])]
    questions = [item for frame in frames for item in frame.get("questions", [])]
    text = "\n".join(str(frame.get("text") or "") for frame in frames)
    actions = list(dict.fromkeys(
        str(control.get("text") or control.get("name"))
        for frame in frames for control in frame.get("controls", [])
        if not control.get("disabled") and str(control.get("text") or control.get("name"))
        in ("播放", "继续播放", "开始播放", "下一页", "下一节", "下一课", "继续学习", "开始学习", "提交作业")
    ))
    phase = "unknown"
    if questions:
        phase = "question"
    elif media:
        phase = "video-ended" if all(item.get("ended") for item in media) else "paused"
        if any(not item.get("paused") and not item.get("ended") for item in media):
            phase = "playing"
        if any(item.get("error") for item in media):
            phase = "media-error"
    elif actions:
        phase = "next"
    if data.get("missingFrames"):
        phase = "loading"
    if any(marker in text for marker in ("考试", "监考", "闭卷", "交卷", "答题卡")):
        phase = "exam"
    result = {
        "ok": True,
        "page": {"id": data.get("tab", {}).get("id"), "url": data.get("tab", {}).get("url"), "title": data.get("tab", {}).get("title")},
        "phase": phase,
        "questions": len(questions),
        "actions": actions,
        "media": media,
        "missingFrames": data.get("missingFrames", 0),
    }
    # Playback seconds advance without requiring another model decision.
    decision = {**result, "media": [{k: v for k, v in item.items() if k not in ("currentTime", "readyState")} for item in media],
                "documents": [(frame.get("frameId"), frame.get("documentId"), frame.get("url")) for frame in frames],
                "questionState": questions, "content": "" if media else text}
    result["revision"] = hashlib.sha256(json.dumps(decision, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
    return result


def wait_for_change(revision, timeout=300):
    started = time.monotonic()
    deadline = started + timeout
    last_progress = started
    progressed = False
    previous_positions = []
    while True:
        data = read_latest()
        result = course_view(data)
        now = time.monotonic()
        positions = [item.get("currentTime", 0) for item in result["media"]]
        if any(current > previous for current, previous in zip(positions, previous_positions)):
            last_progress = now
            progressed = True
        previous_positions = positions
        if result["revision"] != revision:
            save_snapshot(data)
            return {**result, "changed": True}
        remaining = deadline - now
        stalled = result["phase"] == "playing" and now - last_progress >= 45
        if remaining <= 0 or stalled or result["phase"] != "playing":
            return {"ok": True, "changed": False, "revision": revision, "phase": result["phase"],
                    "progressed": progressed and not stalled,
                    "stalled": stalled, "media": result["media"], "waitedSeconds": round(now - started, 1)}
        time.sleep(min(1, remaining))


def load_snapshot():
    try:
        with open(SNAPSHOT_FILE, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return None


def summarize(data, brief=False):
    frames = data.get("frames") or []
    result = {
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
    }
    if brief:
        return result
    result["api"] = [
        {"method": entry.get("method"), "url": entry.get("url"), "at": entry.get("at")}
        for entry in (data.get("api") or [])[:30]
    ]
    result["questions"] = [
        {
            "text": clean(question.get("text"), 800),
            "options": [
                {"text": clean(option.get("text"), 200), "checked": bool(option.get("checked"))}
                for option in (question.get("options") or [])[:12]
            ],
        }
        for frame in frames
        for question in (frame.get("questions") or [])[:5]
    ][:20]
    return result


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
    parser.add_argument("command", choices=["save", "latest", "summary", "read", "controls", "questions", "file", "course", "watch"])
    parser.add_argument("--file", default="")
    parser.add_argument("--limit", type=int, default=20_000)
    parser.add_argument("--brief", action="store_true")
    parser.add_argument("--since", default="")
    parser.add_argument("--timeout", type=int, choices=range(1, 601), default=300, metavar="1..600")
    args = parser.parse_args()

    if args.command == "course":
        data = read_latest()
        save_snapshot(data)
        emit(course_view(data))
    if args.command == "watch":
        if not args.since:
            parser.error("watch 需要 --since <revision>")
        emit(wait_for_change(args.since, args.timeout))

    if args.command == "latest":
        path = find_download_snapshot()
        with open(path, "r", encoding="utf-8-sig") as handle:
            data = parse_payload(handle.read())
        save_snapshot(data)
        emit({"ok": True, "source": str(path), "saved": SNAPSHOT_FILE, **summarize(data, args.brief)})

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
