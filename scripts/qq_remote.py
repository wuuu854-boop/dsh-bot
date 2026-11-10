#!/usr/bin/env python3
"""QQ remote-control daemon for DSH Bot.

Runs outside the DSH/Electron process so Windows UI Automation can read the
logged-in QQ chat reliably. It only watches the configured contact's current
chat, executes a small fixed command set through the local DSH API, and sends
the reply back through QQ.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import qq_uia  # noqa: E402

LOG = None
STATE = None
API = None


def find_state_dir() -> Path:
    candidates = []
    if os.environ.get("DSH_HOME"):
        candidates.append(Path(os.environ["DSH_HOME"]) / "storages" / "dsh-bot")
    candidates.extend([
        Path.home() / ".dsh-official-desktop" / "storages" / "dsh-bot",
        Path.home() / ".dsh" / "storages" / "dsh-bot",
    ])
    for path in candidates:
        if path.exists():
            return path
    return candidates[0]


def log(message: str) -> None:
    if LOG is None:
        return
    line = f"{time.strftime('%Y-%m-%d %H:%M:%S')} {message}"
    try:
        with LOG.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")
    except Exception:
        pass


def api_base() -> str:
    try:
        data = json.loads((STATE / "runtime.json").read_text(encoding="utf-8"))
        if data.get("apiBase"):
            return data["apiBase"].rstrip("/")
    except Exception:
        pass
    return "http://127.0.0.1:60183/dsh-bot/api"


def request(path: str, method: str = "GET", body=None, timeout: int = 20):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        api_base().rstrip("/") + path,
        data=data,
        method=method,
        headers={"x-dsh-bot-client": "1", "content-type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def send_qq(contact: str, message: str) -> bool:
    command = [
        sys.executable,
        str(HERE / "notify_qq.py"),
        "--method",
        "desktop",
        "--contact",
        contact,
        "--message",
        message,
    ]
    try:
        completed = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
        log(f"send rc={completed.returncode} out={(completed.stdout or '').strip()[:200]}")
        return completed.returncode == 0
    except Exception as error:
        log(f"send failed: {error}")
        return False


def status_text(contact: str) -> str:
    snapshot = request("/bootstrap")
    thread = snapshot.get("thread") or {}
    thread_id = thread.get("id")
    state = request("/state?thread=" + urllib.parse.quote(thread_id or "")) if thread_id else {}
    running = bool((state.get("thread") or {}).get("running"))
    items = state.get("items") or []
    last = ""
    for item in reversed(items):
        if item.get("kind") == "assistant" and item.get("text"):
            last = item["text"].strip()
            break
    bot = (snapshot.get("bot") or {}).get("name") or "DSH"
    summary = re.sub(r"\s+", " ", last).strip()[:300]
    return "\n".join([
        f"Bot：{bot}",
        f"任务：{thread.get('title') or '未命名'}",
        f"状态：{'运行中' if running else '空闲'}",
        f"最后：{summary or '无'}",
        f"时间：{time.strftime('%Y-%m-%d %H:%M:%S')}",
    ])


def execute(contact: str, command: str, raw: str) -> None:
    action = command.lower()
    snapshot = request("/bootstrap")
    thread = snapshot.get("thread") or {}
    thread_id = thread.get("id")

    if action == "/tasks":
        threads = snapshot.get("threads") or []
        lines = ["任务列表（用 /use 序号 切换）："]
        for index, item in enumerate(threads[:12], start=1):
            mark = " ←当前" if item.get("id") == thread_id else ""
            lines.append(f"{index}. {item.get('title') or '未命名'}{mark}")
        send_qq(contact, "\n".join(lines) if len(lines) > 1 else "当前 bot 没有任务。")
        return

    if action == "/use":
        match = re.search(r"[\/／]\s*(?:use|切换)\s+(\d+)", raw, re.I)
        if not match:
            send_qq(contact, "用法：/use 2（先用 /tasks 看序号）")
            return
        threads = snapshot.get("threads") or []
        index = int(match.group(1)) - 1
        if index < 0 or index >= len(threads):
            send_qq(contact, "序号超出范围，先用 /tasks 看列表。")
            return
        chosen = threads[index]
        request("/select", "POST", {"threadId": chosen.get("id")})
        send_qq(contact, f"已切换：{chosen.get('title') or chosen.get('id')}")
        return

    if not thread_id:
        send_qq(contact, "没有可控制的任务。")
        return
    if action == "/status":
        send_qq(contact, status_text(contact))
        return
    if action == "/stop":
        request("/stop", "POST", {"threadId": thread_id})
        send_qq(contact, f"已停止：{thread.get('title') or thread_id}")
        return
    if action == "/continue":
        try:
            request("/resume", "POST", {"threadId": thread_id})
            send_qq(contact, f"已从断点继续：{thread.get('title') or thread_id}")
        except urllib.error.HTTPError:
            request("/send", "POST", {"threadId": thread_id, "text": "继续上一个任务。先检查当前状态，不要从头重做；完成后给结果。"})
            send_qq(contact, f"已继续：{thread.get('title') or thread_id}")
        return
    if action == "/retry":
        request("/retry", "POST", {"threadId": thread_id})
        send_qq(contact, f"已重试：{thread.get('title') or thread_id}")
        return
    send_qq(contact, "支持：/tasks /use N /status /stop /continue /retry（或中文 /任务 /切换 N /状态 /停止 /继续 /重试）")


def last_content(messages):
    for item in reversed(messages or []):
        text = str(item or "").strip()
        if not text or re.fullmatch(r"\d{1,2}:\d{2}", text):
            continue
        return text
    return ""


def content_hash(text: str) -> str:
    import hashlib

    return hashlib.sha256(text.encode("utf-8")).hexdigest()


COMMAND_MAP = {
    "status": "/status",
    "stop": "/stop",
    "continue": "/continue",
    "retry": "/retry",
    "tasks": "/tasks",
    "use": "/use",
    "状态": "/status",
    "停止": "/stop",
    "继续": "/continue",
    "重试": "/retry",
    "任务": "/tasks",
    "切换": "/use",
}


def command_of(messages) -> str:
    for item in reversed(messages or []):
        text = str(item or "").strip()
        if not text or re.fullmatch(r"\d{1,2}:\d{2}", text):
            continue
        match = re.match(r"^(?:dsh\s*)?[\/／]\s*(status|stop|continue|retry|tasks|use|状态|停止|继续|重试|任务|切换)(?:\s|$)", text, re.I)
        if match:
            return COMMAND_MAP.get(match.group(1).lower(), "")
        return ""
    return ""


def main() -> int:
    global LOG, STATE, API
    STATE = find_state_dir()
    STATE.mkdir(parents=True, exist_ok=True)
    LOG = STATE / "qq-remote.log"
    lock_file = STATE / "qq-remote.lock"
    try:
        if lock_file.exists():
            old = int(lock_file.read_text(encoding="utf-8").strip() or 0)
            if old and old != os.getpid():
                handle = __import__("ctypes").windll.kernel32.OpenProcess(0x1000, False, old)
                if handle:
                    __import__("ctypes").windll.kernel32.CloseHandle(handle)
                    log(f"daemon already running pid={old}")
                    return 0
        lock_file.write_text(str(os.getpid()), encoding="utf-8")
    except Exception:
        pass

    state_file = STATE / "qq-remote-state.json"
    last_hash = ""
    try:
        last_hash = json.loads(state_file.read_text(encoding="utf-8")).get("lastSeenHash", "")
    except Exception:
        pass

    log(f"daemon started pid={os.getpid()} state={STATE}")
    while True:
        try:
            config = request("/notify").get("config") or {}
            contact = config.get("contact") or ""
            if config.get("enabled") and config.get("remoteControl") and config.get("method") == "desktop" and contact:
                chat = qq_uia.read_chat(contact, 20)
                if chat.get("ok") and chat.get("title") == contact:
                    content = last_content(chat.get("messages"))
                    if content and content_hash(content) != last_hash:
                        last_hash = content_hash(content)
                        state_file.write_text(json.dumps({"lastSeenHash": last_hash}, ensure_ascii=False), encoding="utf-8")
                        command = command_of([content])
                        if command:
                            log(f"command={command}")
                            execute(contact, command, content)
        except Exception as error:
            log(f"loop error: {error}")
        time.sleep(5)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
