#!/usr/bin/env python3
"""Local isolated workbench for DSH Bot.

There is no cloud computer; this is the local substitute:

- If Windows Sandbox is installed: create a disposable .wsb desktop with a
  mapped workspace and open it.
- Otherwise: create a dedicated browser profile + workspace, so cookies,
  logins and downloads are isolated from the user's everyday browser.

Commands:
  status
  list
  create --name NAME [--copy PATH]
  open --name NAME [--url URL]
  remove --name NAME
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import edge  # noqa: E402

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

STATE_DIR = os.path.join(os.environ.get("DSH_HOME", os.path.join(os.path.expanduser("~"), ".dsh-official-desktop")), "storages", "dsh-bot")
ROOT = os.path.join(STATE_DIR, "sandboxes")
SANDBOX_EXE = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "System32", "WindowsSandbox.exe")


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def flag(args, name, default=""):
    key = f"--{name}"
    for index, item in enumerate(args):
        if item == key and index + 1 < len(args):
            return args[index + 1]
    return default


def windows_sandbox_available():
    return os.path.isfile(SANDBOX_EXE)


def safe_id(name):
    raw = str(name or "").strip()
    slug = re.sub(r"[^0-9A-Za-z_-]+", "-", raw).strip("-")[:40]
    if not slug:
        slug = "workbench-" + uuid.uuid4().hex[:6]
    return slug


def sandbox_dir(name):
    return os.path.join(ROOT, safe_id(name))


def manifest_for(name):
    path = os.path.join(sandbox_dir(name), "manifest.json")
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return None


def status():
    browsers = {}
    for name in ("edge", "chrome", "brave", "chromium", "firefox"):
        try:
            browsers[name] = edge.find_browser(name)
        except Exception:
            browsers[name] = None
    return {
        "ok": True,
        "mode": "windows-sandbox" if windows_sandbox_available() else "isolated-profile",
        "windowsSandbox": windows_sandbox_available(),
        "sandboxExe": SANDBOX_EXE if windows_sandbox_available() else None,
        "root": ROOT,
        "browsers": browsers,
        "sandboxes": [item for item in list_sandboxes() if item.get("ok")],
        "note": (
            "Windows Sandbox 可用：可开一次性桌面。"
            if windows_sandbox_available()
            else "Windows Sandbox 未安装：使用独立浏览器 profile + 独立工作区；不影响日常 Cookie/下载。"
        ),
    }


def list_sandboxes():
    results = []
    if not os.path.isdir(ROOT):
        return results
    for entry in sorted(os.listdir(ROOT)):
        path = os.path.join(ROOT, entry)
        if not os.path.isdir(path):
            continue
        manifest = manifest_for(entry)
        if manifest:
            results.append({"ok": True, **manifest, "path": path})
    return results


def create(name, copy_path=None):
    identifier = safe_id(name)
    path = os.path.join(ROOT, identifier)
    workspace = os.path.join(path, "workspace")
    profile = os.path.join(path, "browser-profile")
    os.makedirs(workspace, exist_ok=True)
    os.makedirs(profile, exist_ok=True)
    copied = []
    if copy_path:
        source = os.path.abspath(os.path.expanduser(str(copy_path)))
        if not os.path.exists(source):
            return {"ok": False, "error": f"copy path not found: {source}"}
        target = os.path.join(workspace, os.path.basename(source))
        if os.path.isdir(source):
            shutil.copytree(source, target, dirs_exist_ok=True)
        else:
            shutil.copy2(source, target)
        copied.append(target)
    manifest = {
        "name": str(name or identifier),
        "id": identifier,
        "createdAt": int(time.time() * 1000),
        "mode": "windows-sandbox" if windows_sandbox_available() else "isolated-profile",
        "workspace": workspace,
        "profile": profile,
        "copied": copied,
    }
    with open(os.path.join(path, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
    wsb = os.path.join(path, "workbench.wsb")
    with open(wsb, "w", encoding="utf-8") as handle:
        handle.write(
            "<Configuration>\n"
            "  <MappedFolders>\n"
            "    <MappedFolder>\n"
            f"      <HostFolder>{workspace}</HostFolder>\n"
            "      <SandboxFolder>C:\\workspace</SandboxFolder>\n"
            "      <ReadOnly>false</ReadOnly>\n"
            "    </MappedFolder>\n"
            "  </MappedFolders>\n"
            "  <LogonCommand>\n"
            '    <Command>cmd.exe /c start "" "C:\\workspace"</Command>\n'
            "  </LogonCommand>\n"
            "</Configuration>\n"
        )
    manifest["wsb"] = wsb
    with open(os.path.join(path, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
    return {"ok": True, **manifest}


def open_workbench(name, url=""):
    manifest = manifest_for(name)
    if not manifest:
        return {"ok": False, "error": f"workbench not found: {name}"}
    if windows_sandbox_available():
        wsb = manifest.get("wsb")
        if not wsb or not os.path.isfile(wsb):
            return {"ok": False, "error": "workbench config missing"}
        process = subprocess.Popen([SANDBOX_EXE, wsb], close_fds=True)
        return {"ok": True, "mode": "windows-sandbox", "pid": process.pid, "wsb": wsb, "workspace": manifest.get("workspace")}
    browser = edge.resolve_browser("auto")
    executable = edge.find_browser(browser)
    if not executable:
        return {"ok": False, "error": f"no browser executable for {browser}"}
    profile = manifest.get("profile")
    args = [
        executable,
        f"--user-data-dir={profile}",
        "--no-first-run",
        "--no-default-browser-check",
        "--new-window",
        url or "about:blank",
    ]
    process = subprocess.Popen(args, close_fds=True)
    return {
        "ok": True,
        "mode": "isolated-profile",
        "browser": browser,
        "pid": process.pid,
        "profile": profile,
        "workspace": manifest.get("workspace"),
        "url": url or "about:blank",
    }


def remove(name):
    path = sandbox_dir(name)
    root = os.path.abspath(ROOT)
    target = os.path.abspath(path)
    if not target.startswith(root + os.sep):
        return {"ok": False, "error": "refusing to remove outside sandbox root"}
    if not os.path.isdir(target):
        return {"ok": False, "error": f"workbench not found: {name}"}
    shutil.rmtree(target)
    return {"ok": True, "removed": target}


def main():
    if len(sys.argv) < 2:
        emit({"ok": False, "error": "missing command; try status/list/create/open/remove"})
    command = sys.argv[1].lower()
    args = sys.argv[2:]
    if command == "status":
        emit(status())
    if command == "list":
        emit({"ok": True, "root": ROOT, "sandboxes": list_sandboxes()})
    if command == "create":
        name = flag(args, "name", "")
        if not name:
            emit({"ok": False, "error": "create requires --name NAME"})
        emit(create(name, flag(args, "copy", "")))
    if command == "open":
        name = flag(args, "name", "")
        if not name:
            emit({"ok": False, "error": "open requires --name NAME"})
        emit(open_workbench(name, flag(args, "url", "")))
    if command == "remove":
        name = flag(args, "name", "")
        if not name:
            emit({"ok": False, "error": "remove requires --name NAME"})
        emit(remove(name))
    emit({"ok": False, "error": f"unknown command: {command}"})


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:
        emit({"ok": False, "error": str(error)}, 1)
