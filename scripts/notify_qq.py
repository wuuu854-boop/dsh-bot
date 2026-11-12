#!/usr/bin/env python3
"""Send a DSH notification through QQ.

Two transports:
  smtp    - QQ Mail SMTP with an authorization code (recommended, reliable).
  desktop - drive the QQ desktop app to the configured contact (no SMTP secret).
"""

from __future__ import annotations

import argparse
import json
import os
import smtplib
import subprocess
import sys
import tempfile
import time
from email.header import Header
from email.mime.text import MIMEText

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
APPS = os.path.join(HERE, "apps.py")
COMPUTER = os.path.join(HERE, "computer.py")
QQ_UIA = os.path.join(HERE, "qq_uia.py")
UIA = os.path.join(HERE, "uia.py")


def run(cmd, timeout=40):
    completed = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )
    output = (completed.stdout or "").strip()
    data = None
    for line in reversed(output.splitlines()):
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                data = json.loads(line)
                break
            except Exception:
                continue
    return completed.returncode, output, data


def send_smtp(args):
    if not args.email or not args.auth or not args.to:
        return {"ok": False, "error": "QQ 邮箱缺少 email/auth/to"}
    message = MIMEText(args.message, "plain", "utf-8")
    message["Subject"] = Header(args.subject, "utf-8")
    message["From"] = args.email
    message["To"] = args.to
    try:
        with smtplib.SMTP_SSL("smtp.qq.com", 465, timeout=25) as smtp:
            smtp.login(args.email, args.auth)
            smtp.sendmail(args.email, [item.strip() for item in args.to.split(",") if item.strip()], message.as_string())
        return {"ok": True, "method": "smtp", "to": args.to}
    except Exception as error:
        return {"ok": False, "method": "smtp", "error": str(error)}


def find_qq_window(contact):
    code, output, data = run([sys.executable, COMPUTER, "windows"], timeout=20)
    windows = (data or {}).get("windows") or []
    target = str(contact or "").strip().lower()
    candidates = []
    for window in windows:
        title = str(window.get("title") or "").strip()
        if title.lower() not in {target, "qq"}:
            continue
        rect = window.get("rect") or [0, 0, 0, 0]
        if len(rect) < 4 or rect[0] < -10000 or rect[1] < -10000:
            continue
        candidates.append(window)
    candidates.sort(key=lambda item: 0 if str(item.get("title")).lower() == target else 1)
    return candidates[0] if candidates else None


def acquire_desktop_lock(timeout=120):
    lock = os.path.join(tempfile.gettempdir(), "dsh-qq-notify.lock")
    started = time.time()
    while time.time() - started < timeout:
        try:
            handle = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(handle, str(os.getpid()).encode("ascii"))
            return lock, handle
        except FileExistsError:
            try:
                if time.time() - os.path.getmtime(lock) > 120:
                    os.remove(lock)
                    continue
            except OSError:
                pass
            time.sleep(0.25)
    raise RuntimeError("QQ notification lock timeout")


def send_desktop(args):
    lock, handle = acquire_desktop_lock()
    try:
        return send_desktop_locked(args)
    finally:
        try:
            os.close(handle)
        except OSError:
            pass
        try:
            os.remove(lock)
        except OSError:
            pass


def send_desktop_locked(args):
    # Do not launch QQ automatically: launching a second instance can land on
    # the login window and inject text into the wrong field. The operator must
    # leave the logged-in QQ chat open.
    contact = args.contact or "文件传输助手"
    window = find_qq_window(contact)
    if not window:
        return {"ok": False, "method": "desktop", "error": "QQ 未运行或聊天窗口不可见；请先打开 QQ 和目标聊天"}
    title = str(window.get("title") or "QQ")
    code, output, active = run([sys.executable, COMPUTER, "activate", title], timeout=20)
    if not (active and active.get("window", {}).get("active")):
        try:
            run([
                "powershell.exe", "-NoProfile", "-Command",
                f"(New-Object -ComObject WScript.Shell).AppActivate('{title}')",
            ], timeout=15)
        except Exception:
            pass
        time.sleep(0.4)
        code, output, active = run([sys.executable, COMPUTER, "activate", title], timeout=20)
    if not (active and active.get("window", {}).get("active")):
        return {"ok": False, "method": "desktop", "error": "QQ 窗口没有真正切到前台，未发送", "detail": active or output[-300:]}
    time.sleep(0.5)
    refreshed = find_qq_window(contact)
    if not refreshed:
        return {"ok": False, "method": "desktop", "error": "QQ 窗口恢复后不可见，未发送"}
    left, top, right, bottom = refreshed.get("rect") or [0, 0, 1600, 1000]
    width = max(1, right - left)
    height = max(1, bottom - top)
    # A separate contact window is already on the target chat; only the main
    # QQ window needs the contact search box.
    if str(refreshed.get("title") or "").strip().lower() != contact.lower():
        search_x = int(left + width * 0.08)
        search_y = int(top + height * 0.055)
        run([sys.executable, COMPUTER, "click", str(search_x), str(search_y)], timeout=20)
        run([sys.executable, COMPUTER, "key", "ctrl+a"], timeout=20)
        run([sys.executable, COMPUTER, "type", contact], timeout=30)
        time.sleep(1.2)
        run([sys.executable, COMPUTER, "key", "enter"], timeout=20)
        time.sleep(1.2)
    # The message composer is the bottom bar, not the search box.
    input_x = int(left + width * 0.42)
    input_y = int(top + height * 0.925)
    run([sys.executable, COMPUTER, "click", str(input_x), str(input_y)], timeout=20)
    time.sleep(0.3)
    # QQ sends on every newline; keep the notification as one chat bubble.
    desktop_message = " | ".join(line.strip() for line in args.message.splitlines() if line.strip())
    run([sys.executable, COMPUTER, "type", desktop_message], timeout=30)
    time.sleep(0.4)
    # Prefer the real UIA send button. Coordinate clicks can hit the adjacent
    # “send options” arrow and leave the text sitting in the composer.
    sent = run(
        [
            sys.executable,
            UIA,
            "click",
            "--window",
            contact,
            "--name",
            "发送",
            "--role",
            "Button",
            "--exact",
        ],
        timeout=20,
    )
    if not (sent[2] or {}).get("ok"):
        run([sys.executable, COMPUTER, "key", "enter"], timeout=20)
    time.sleep(0.8)
    # Never report success from clicks alone; confirm the message is in the chat.
    code, output, chat = run([sys.executable, QQ_UIA, "--contact", contact, "--tail", "8"], timeout=40)
    messages = (chat or {}).get("messages") or []
    if not any(desktop_message[:100] in str(item) for item in messages):
        return {
            "ok": False,
            "method": "desktop",
            "error": "QQ 未确认消息出现，可能未发送",
            "detail": (output or "")[-300:],
        }
    return {
        "ok": True,
        "method": "desktop",
        "contact": contact,
        "verified": True,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--method", choices=["smtp", "desktop"], required=True)
    parser.add_argument("--subject", default="DSH Bot")
    parser.add_argument("--message", required=True)
    parser.add_argument("--email", default="")
    parser.add_argument("--auth", default="")
    parser.add_argument("--to", default="")
    parser.add_argument("--contact", default="文件传输助手")
    args = parser.parse_args()
    result = send_smtp(args) if args.method == "smtp" else send_desktop(args)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        raise SystemExit(1)
