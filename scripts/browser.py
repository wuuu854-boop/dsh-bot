#!/usr/bin/env python3
r"""Firefox Marionette bridge for DSH Bot.

Stock Firefox supports Marionette natively; geckodriver is not needed. The
bridge launches the dedicated Firefox once, then each command reconnects to
the same browser session to open pages, read text, click, type and screenshot.

Examples:
  python browser.py start --profile automation --url https://example.com --headless
  python browser.py text
  python browser.py screenshot --out D:\projects\page.png
  python browser.py quit
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path

if sys.stdout is not None:
    sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
BOT_DIR = HERE.parent
WORKSPACE = BOT_DIR.parent
BROWSER_DIR = WORKSPACE / "browser"
FIREFOX = BROWSER_DIR / "firefox" / "firefox.exe"
PORT = 2828
PROXY_PORT = 7890


def state_dir() -> Path:
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
    path = candidates[0]
    path.mkdir(parents=True, exist_ok=True)
    return path


SESSION = state_dir() / "browser-session.json"


def output(value) -> None:
    print(json.dumps(value, ensure_ascii=False))


def load_session():
    try:
        return json.loads(SESSION.read_text(encoding="utf-8"))
    except Exception:
        return None


def save_session(data) -> None:
    SESSION.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def clear_session() -> None:
    try:
        SESSION.unlink()
    except OSError:
        pass


def pid_alive(pid: int) -> bool:
    try:
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}", "/NH"],
            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=5,
        )
        return str(pid) in (result.stdout or "")
    except Exception:
        return False


def port_open(port: int = PORT, timeout=0.5) -> bool:
    import socket

    try:
        with socket.create_connection(("127.0.0.1", port), timeout=timeout):
            return True
    except OSError:
        return False


def acquire_lock(timeout=60):
    lock = Path(tempfile.gettempdir()) / "dsh-firefox-marionette.lock"
    started = time.time()
    while time.time() - started < timeout:
        try:
            fd = os.open(str(lock), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, str(os.getpid()).encode("ascii"))
            return lock, fd
        except FileExistsError:
            try:
                if time.time() - lock.stat().st_mtime > 120:
                    lock.unlink()
                    continue
            except OSError:
                pass
            time.sleep(0.25)
    raise RuntimeError("Firefox control lock timeout")


def release_lock(lock, fd):
    try:
        os.close(fd)
    except OSError:
        pass
    try:
        lock.unlink()
    except OSError:
        pass


def resolve_profile(name: str, copy_profile: bool):
    if not name:
        return None, None
    candidate = Path(name)
    if not candidate.is_absolute():
        candidate = BROWSER_DIR / "profiles" / name
    if not candidate.exists():
        candidate.mkdir(parents=True, exist_ok=True)
    if not copy_profile:
        return candidate, None
    target = BROWSER_DIR / "profiles" / f".auto-{uuid.uuid4().hex[:8]}"
    ignore = shutil.ignore_patterns(
        "cache2", "startupCache", "shader-cache", "thumbnails", "lock", "parent.lock",
        ".parentlock", "sessionstore-backups", "crashes", "minidumps",
    )
    shutil.copytree(candidate, target, ignore=ignore)
    return target, target


def marionette_client():
    from marionette_driver.marionette import Marionette

    client = Marionette(host="127.0.0.1", port=PORT, startup_timeout=20, socket_timeout=45)
    client.start_session()
    return client


def close_client(client):
    try:
        client.close()
    except Exception:
        pass


def start(args) -> int:
    if not FIREFOX.exists():
        output({"ok": False, "error": f"Firefox not found: {FIREFOX}"})
        return 1
    if not port_open(PROXY_PORT):
        output({"ok": False, "error": "Clash 7890 not listening; run proxy.py ensure first"})
        return 1
    try:
        import marionette_driver  # noqa: F401
    except Exception:
        output({"ok": False, "error": "marionette-driver not installed"})
        return 1
    current = load_session()
    if not args.force and current and pid_alive(int(current.get("pid") or 0)) and port_open():
        output({"ok": True, "reused": True, "session": current})
        return 0
    if current:
        stop_session(current)
    profile, temp_profile = resolve_profile(args.profile, not args.direct_profile)
    log_path = state_dir() / "browser-firefox.log"
    command = [str(FIREFOX), "--marionette", "--no-remote"]
    if profile:
        command.extend(["--profile", str(profile)])
    if args.headless:
        command.append("-headless")
    flags = 0x08000000 if os.name == "nt" else 0  # CREATE_NO_WINDOW
    log = open(log_path, "ab", buffering=0)
    env = os.environ.copy()
    if args.headless:
        env["MOZ_HEADLESS"] = "1"
    process = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT, creationflags=flags, env=env)
    try:
        started = time.time()
        while time.time() - started < 25 and not port_open():
            if process.poll() is not None:
                raise RuntimeError(f"Firefox exited with {process.returncode}")
            time.sleep(0.3)
        if not port_open():
            raise RuntimeError("Marionette port did not open")
        client = marionette_client()
        if args.url:
            client.navigate(args.url)
        close_client(client)
        session = {
            "ok": True,
            "port": PORT,
            "pid": process.pid,
            "profile": str(profile) if profile else "",
            "tempProfile": str(temp_profile) if temp_profile else "",
            "headless": bool(args.headless),
            "startedAt": int(time.time() * 1000),
        }
        save_session(session)
        output({"ok": True, "session": session, "log": str(log_path)})
        return 0
    except Exception as error:
        try:
            process.terminate()
        except Exception:
            pass
        clear_session()
        output({"ok": False, "error": str(error), "log": str(log_path)})
        return 1
    finally:
        log.close()


def get_session() -> dict:
    session = load_session()
    if not session or not pid_alive(int(session.get("pid") or 0)) or not port_open():
        raise RuntimeError("Firefox session not running; run start first")
    return session


def stop_session(session) -> None:
    if not session:
        return
    try:
        client = marionette_client()
        client.delete_session()
    except Exception:
        pass
    try:
        pid = int(session.get("pid") or 0)
        if pid:
            subprocess.run(["taskkill", "/PID", str(pid), "/F"], capture_output=True, timeout=10)
    except Exception:
        pass
    temp = session.get("tempProfile")
    if temp:
        shutil.rmtree(temp, ignore_errors=True)
    clear_session()


def with_client(action):
    lock, fd = acquire_lock()
    try:
        client = marionette_client()
        try:
            return action(client)
        finally:
            close_client(client)
    finally:
        release_lock(lock, fd)


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    p_start = sub.add_parser("start")
    p_start.add_argument("--profile", default="automation")
    p_start.add_argument("--url", default="")
    p_start.add_argument("--headless", action="store_true")
    p_start.add_argument("--direct-profile", action="store_true")
    p_start.add_argument("--force", action="store_true")

    sub.add_parser("status")
    p_open = sub.add_parser("open")
    p_open.add_argument("url")
    p_text = sub.add_parser("text")
    p_text.add_argument("--max", type=int, default=200_000)
    p_shot = sub.add_parser("screenshot")
    p_shot.add_argument("--out", default="")
    p_click = sub.add_parser("click")
    p_click.add_argument("--selector", required=True)
    p_type = sub.add_parser("type")
    p_type.add_argument("--selector", required=True)
    p_type.add_argument("--text", required=True)
    p_eval = sub.add_parser("eval")
    p_eval.add_argument("script")
    sub.add_parser("quit")

    args = parser.parse_args()
    try:
        if args.command == "start":
            return start(args)
        if args.command == "status":
            session = load_session()
            if session and pid_alive(int(session.get("pid") or 0)) and port_open():
                output({"ok": True, "session": session})
                return 0
            output({"ok": False, "error": "no live session"})
            return 1
        if args.command == "quit":
            session = load_session()
            stop_session(session)
            output({"ok": True, "stopped": bool(session)})
            return 0
        get_session()
        if args.command == "open":
            with_client(lambda client: client.navigate(args.url))
            output({"ok": True, "url": args.url})
        elif args.command == "text":
            def read(client):
                return str(client.execute_script("return document.body ? document.body.innerText : '';") or "")
            body = with_client(read)
            output({"ok": True, "text": body[: args.max], "length": len(body)})
        elif args.command == "screenshot":
            def shot(client):
                return client.screenshot(format="base64", full=True)
            raw = base64.b64decode(with_client(shot))
            target = Path(args.out) if args.out else state_dir() / f"browser-{int(time.time())}.png"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(raw)
            output({"ok": True, "path": str(target), "bytes": len(raw)})
        elif args.command == "click":
            from marionette_driver import By

            def click(client):
                client.find_element(By.CSS_SELECTOR, args.selector).click()
            with_client(click)
            output({"ok": True, "selector": args.selector})
        elif args.command == "type":
            from marionette_driver import By

            def type_text(client):
                element = client.find_element(By.CSS_SELECTOR, args.selector)
                element.send_keys(args.text)
            with_client(type_text)
            output({"ok": True, "selector": args.selector, "chars": len(args.text)})
        elif args.command == "eval":
            value = with_client(lambda client: client.execute_script(args.script))
            output({"ok": True, "value": value})
        return 0
    except Exception as error:
        output({"ok": False, "error": str(error)})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
