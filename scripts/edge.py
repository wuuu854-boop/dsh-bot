#!/usr/bin/env python3
"""Microsoft Edge helper for DSH Bot.

The default browser for every bot is Edge. Firefox is only used for the
isolated Grok/Copilot profiles, not for ordinary web work.

Commands:
  status
  open URL [--new-window]
  navigate URL
  activate
  screenshot [PATH]
  monitors
  screen

Every command prints one JSON object.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import computer  # noqa: E402


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def fail(message):
    emit({"ok": False, "error": str(message)}, 1)


def find_edge():
    candidates = []
    for root in (
        os.environ.get("ProgramFiles(x86)"),
        os.environ.get("ProgramFiles"),
        os.environ.get("LOCALAPPDATA"),
    ):
        if root:
            candidates.append(os.path.join(root, "Microsoft", "Edge", "Application", "msedge.exe"))
    try:
        import winreg

        with winreg.OpenKey(
            winreg.HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe",
        ) as key:
            candidates.insert(0, winreg.QueryValue(key, None))
    except Exception:
        pass
    for candidate in candidates:
        if candidate and os.path.isfile(candidate):
            return candidate
    return None


def edge_windows():
    return [
        window
        for window in computer.list_windows()
        if "edge" in str(window.get("title", "")).lower()
    ]


def normalize_url(value):
    url = str(value or "").strip()
    if not url:
        raise ValueError("URL is empty")
    if not url.lower().startswith(("http://", "https://", "file://")):
        url = "https://" + url
    return url


def activate_edge():
    windows = edge_windows()
    if not windows:
        return None
    return computer.activate_window(windows[0]["title"])


def open_url(url, new_window=True):
    edge = find_edge()
    if not edge:
        raise RuntimeError("Microsoft Edge not found")
    args = [edge]
    if new_window:
        args.append("--new-window")
    args.append(url)
    subprocess.Popen(args, close_fds=True)
    time.sleep(1.6)
    window = activate_edge()
    return {"ok": True, "url": url, "window": window, "windows": edge_windows()}


def navigate(url):
    activate_edge()
    if not edge_windows():
        return open_url(url)
    computer.press_combo("ctrl+l")
    time.sleep(0.2)
    computer.type_text(url)
    time.sleep(0.2)
    computer.press_combo("enter")
    time.sleep(1.0)
    return {"ok": True, "url": url, "windows": edge_windows()}


def main():
    if len(sys.argv) < 2:
        fail("missing command; try: status, open, navigate, activate, screenshot, monitors, screen")
    command = sys.argv[1].lower()
    args = sys.argv[2:]

    if command == "status":
        return emit({"ok": True, "edge": find_edge(), "windows": edge_windows(), "monitors": computer.list_monitors()})
    if command == "monitors":
        return emit({"ok": True, "monitors": computer.list_monitors(), "virtual": computer.virtual_screen()})
    if command == "screen":
        return emit(computer.screen_info())
    if command == "activate":
        return emit({"ok": True, "window": activate_edge(), "windows": edge_windows()})
    if command == "open":
        if not args:
            fail("open requires URL")
        return emit(open_url(normalize_url(args[0]), new_window="--new-window" in args))
    if command == "navigate":
        if not args:
            fail("navigate requires URL")
        return emit(navigate(normalize_url(args[0])))
    if command == "screenshot":
        path = args[0] if args else None
        return emit(computer.screenshot(path, "all"))

    fail(f"unknown command: {command}")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:
        fail(error)
