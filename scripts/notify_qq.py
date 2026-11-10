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


def find_qq_window():
    code, output, data = run([sys.executable, COMPUTER, "windows"], timeout=20)
    for window in (data or {}).get("windows") or []:
        if str(window.get("title") or "").strip().lower() == "qq":
            return window
    return None


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
    # leave the logged-in QQ main window open.
    window = find_qq_window()
    if not window:
        return {"ok": False, "method": "desktop", "error": "QQ 未运行或未登录；请先打开并登录 QQ"}
    left, top, right, bottom = window.get("rect") or [0, 0, 1600, 1000]
    width = max(1, right - left)
    height = max(1, bottom - top)
    code, output, active = run([sys.executable, COMPUTER, "activate", "QQ"], timeout=20)
    if not (active and active.get("window", {}).get("active")):
        # AppActivate is a second, independent way past the foreground lock.
        try:
            run([
                "powershell.exe", "-NoProfile", "-Command",
                "(New-Object -ComObject WScript.Shell).AppActivate('QQ')",
            ], timeout=15)
        except Exception:
            pass
        time.sleep(0.4)
        code, output, active = run([sys.executable, COMPUTER, "activate", "QQ"], timeout=20)
    if not (active and active.get("window", {}).get("active")):
        return {"ok": False, "method": "desktop", "error": "QQ 窗口没有真正切到前台，未发送", "detail": active or output[-300:]}
    time.sleep(0.5)
    # Search box is in the upper-left; clear any previous query first.
    search_x = int(left + width * 0.08)
    search_y = int(top + height * 0.055)
    run([sys.executable, COMPUTER, "click", str(search_x), str(search_y)], timeout=20)
    run([sys.executable, COMPUTER, "key", "ctrl+a"], timeout=20)
    run([sys.executable, COMPUTER, "type", args.contact or "文件传输助手"], timeout=30)
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
    # QQ's Enter may be intercepted by IME composition. Click the actual send
    # button at the lower-right of the message composer instead.
    send_x = int(left + width * 0.926)
    send_y = int(top + height * 0.962)
    run([sys.executable, COMPUTER, "click", str(send_x), str(send_y)], timeout=20)
    time.sleep(0.6)
    return {
        "ok": True,
        "method": "desktop",
        "contact": args.contact or "文件传输助手",
        "search": [search_x, search_y],
        "input": [input_x, input_y],
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
