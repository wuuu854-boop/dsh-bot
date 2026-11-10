#!/usr/bin/env python3
"""Find and launch local Windows desktop apps, desktop-first.

Reads Start Menu apps via `Get-StartApps`, plus .lnk shortcuts on the common
Start Menu and Desktop folders. Never opens a browser for an app that has a
local desktop entry.

Commands:
  find QUERY
  launch QUERY
  list

Every command prints one JSON object.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

START_MENU_DIRS = [
    os.path.join(os.environ.get("ProgramData", r"C:\ProgramData"), r"Microsoft\Windows\Start Menu\Programs"),
    os.path.join(os.environ.get("APPDATA", ""), r"Microsoft\Windows\Start Menu\Programs"),
]
DESKTOP_DIRS = [
    os.path.join(os.environ.get("USERPROFILE", ""), "Desktop"),
    os.path.join(os.environ.get("PUBLIC", r"C:\Users\Public"), "Desktop"),
]
PROXY_SCRIPT = os.path.join(HERE, "proxy.py")
CONTAINMENT_MARKER = os.path.join(os.environ.get("ProgramData", r"C:\ProgramData"), "DSHBot", "foreign-ai-containment.json")
CONTAINMENT_GROUP = "DSH Bot Foreign AI Containment"
FOREIGN_HINTS = ("chatgpt", "codex", "openai", "claude", "copilot", "gemini", "grok")
PROXY_URL = "http://127.0.0.1:7890"
PROXY_FLAG = f"--proxy-server={PROXY_URL}"
COMPUTER_SCRIPT = os.path.join(HERE, "computer.py")
FOREIGN_BROWSER = os.path.join(HERE, "foreign_browser.py")
BROWSER_TARGETS = {
    "grok": {"name": "Grok", "url": "https://grok.com/"},
    "copilot": {"name": "Copilot", "url": "https://copilot.microsoft.com/"},
    "microsoft copilot": {"name": "Copilot", "url": "https://copilot.microsoft.com/"},
}
SELF_APP_IDS = {"com.deepseek.dsh"}
SELF_APP_NAMES = {"deepseek harness"}


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def fail(message):
    emit({"ok": False, "error": str(message)}, 1)


def start_apps():
    command = (
        "[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false);"
        "$OutputEncoding=[Text.UTF8Encoding]::new($false);"
        "Get-StartApps | ConvertTo-Json -Compress"
    )
    try:
        completed = subprocess.run(
            ["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=15,
        )
        raw = (completed.stdout or "").strip()
        if not raw:
            return []
        data = json.loads(raw)
        if isinstance(data, dict):
            data = [data]
        results = []
        for item in data:
            if not isinstance(item, dict):
                continue
            name = str(item.get("Name") or "").strip()
            appid = str(item.get("AppID") or "").strip()
            if name and appid:
                results.append({"name": name, "appid": appid, "kind": "startapp"})
        return results
    except Exception:
        return []


def shortcuts():
    results = []
    for root in START_MENU_DIRS + DESKTOP_DIRS:
        if not root or not os.path.isdir(root):
            continue
        for base, _dirs, files in os.walk(root):
            for name in files:
                if name.lower().endswith(".lnk"):
                    path = os.path.join(base, name)
                    results.append({"name": os.path.splitext(name)[0], "path": path, "kind": "shortcut"})
    return results


def is_foreign(name):
    lower = str(name).lower()
    return any(hint in lower for hint in FOREIGN_HINTS)


def containment_status(name):
    if not os.path.exists(CONTAINMENT_MARKER):
        return {
            "ready": False,
            "error": "CONTAINMENT_NOT_INSTALLED",
            "hint": "Run dsh-bot/contain-foreign-ai.cmd as administrator once.",
        }
    try:
        with open(CONTAINMENT_MARKER, "r", encoding="utf-8-sig") as handle:
            marker = json.load(handle)
    except Exception as error:
        return {"ready": False, "error": "CONTAINMENT_MARKER_BROKEN", "detail": str(error)}
    apps = [
        str(item.get("name") or "").lower()
        for item in (marker.get("apps") or [])
        if isinstance(item, dict)
    ]
    if name.lower() not in apps:
        return {
            "ready": False,
            "error": "CONTAINMENT_UNSUPPORTED",
            "detail": f"no native firewall target for {name}",
            "markerApps": apps,
        }
    command = (
        "Get-NetFirewallRule -Group 'DSH Bot Foreign AI Containment' -ErrorAction SilentlyContinue | "
        "Where-Object { $_.Enabled -eq 'True' } | Measure-Object | Select-Object -ExpandProperty Count"
    )
    try:
        completed = subprocess.run(
            ["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=15,
        )
        count = int((completed.stdout or "0").strip() or 0)
    except Exception as error:
        return {"ready": False, "error": "CONTAINMENT_CHECK_FAILED", "detail": str(error)}
    expected = int(marker.get("ruleCount") or 0)
    ready = bool(marker.get("selfTest", {}).get("ok")) and count > 0 and count >= expected
    return {
        "ready": ready,
        "error": None if ready else "CONTAINMENT_BROKEN",
        "ruleCount": count,
        "expectedRuleCount": expected,
        "selfTest": marker.get("selfTest"),
        "marker": CONTAINMENT_MARKER,
    }


def containment_paths(name):
    try:
        with open(CONTAINMENT_MARKER, "r", encoding="utf-8-sig") as handle:
            marker = json.load(handle)
    except Exception:
        return []
    wanted = str(name or "").lower()
    paths = []
    for item in marker.get("apps") or []:
        if not isinstance(item, dict):
            continue
        if str(item.get("name") or "").lower() != wanted:
            continue
        path = str(item.get("path") or "")
        if path.lower().endswith(".exe") and os.path.isfile(path):
            paths.append(path)
    return paths


def proxy_processes(exe):
    command = (
        "$p=Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq '"
        + exe.replace("'", "''")
        + "' }; $p | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"
    )
    try:
        completed = subprocess.run(
            ["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=15,
        )
        raw = (completed.stdout or "").strip()
        if not raw:
            return []
        data = json.loads(raw)
        if isinstance(data, dict):
            data = [data]
        return [item for item in data if isinstance(item, dict)]
    except Exception:
        return []


def launch_foreign(name):
    """Reuse a proxy-flagged instance when possible; otherwise launch one with the explicit proxy."""
    paths = containment_paths(name)
    if not paths:
        return {"ok": False, "error": "CONTAINMENT_UNSUPPORTED", "reason": f"no native exe in marker for {name}"}
    # Prefer the main executable, not helper binaries.
    wanted = str(name or "").lower()
    paths.sort(key=lambda path: (0 if os.path.splitext(os.path.basename(path))[0].lower() == wanted else 1, path))
    exe = paths[0]
    basenames = sorted({os.path.basename(path) for path in paths})

    existing = proxy_processes(exe)
    flagged = [
        item for item in existing
        if PROXY_FLAG.lower() in str(item.get("CommandLine") or "").lower()
    ]
    if flagged:
        window = wait_window(os.path.splitext(os.path.basename(exe))[0], timeout=3)
        if window:
            try:
                subprocess.run([sys.executable, COMPUTER_SCRIPT, "activate", name], capture_output=True, timeout=10)
            except Exception:
                pass
            return {
                "ok": True,
                "reused": True,
                "name": name,
                "kind": "native",
                "exe": exe,
                "proxyFlag": PROXY_FLAG,
                "window": window,
            }
        return {
            "ok": False,
            "error": "WINDOW_NOT_FOUND",
            "reused": True,
            "name": name,
            "exe": exe,
            "proxyFlag": PROXY_FLAG,
            "reason": "instance already has the proxy flag but has no visible window; not restarting it",
        }
    ps_command = (
        "Get-Process -ErrorAction SilentlyContinue | "
        "Where-Object { $_.Path -and ($_.Path -eq '" + exe.replace("'", "''") + "') } | "
        "Stop-Process -Force"
    )
    try:
        subprocess.run(
            ["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-Command", ps_command],
            capture_output=True,
            timeout=15,
        )
    except Exception:
        pass
    for basename in basenames:
        try:
            subprocess.run(["taskkill", "/F", "/IM", basename], capture_output=True, timeout=10)
        except Exception:
            pass
    time.sleep(1.5)

    env = os.environ.copy()
    env["HTTP_PROXY"] = PROXY_URL
    env["HTTPS_PROXY"] = PROXY_URL
    env["ALL_PROXY"] = PROXY_URL
    env["NO_PROXY"] = "localhost,127.0.0.1,::1"
    try:
        subprocess.Popen(
            [exe, PROXY_FLAG],
            cwd=os.path.dirname(exe),
            env=env,
            close_fds=True,
        )
    except Exception as error:
        return {"ok": False, "error": "LAUNCH_FAILED", "detail": str(error), "exe": exe}
    window = wait_window(os.path.splitext(os.path.basename(exe))[0], timeout=20)
    return {
        "ok": bool(window),
        "name": name,
        "kind": "native",
        "exe": exe,
        "proxyFlag": PROXY_FLAG,
        "window": window,
        "error": None if window else "WINDOW_NOT_FOUND",
    }


def proxy_guard():
    try:
        completed = subprocess.run(
            [sys.executable, PROXY_SCRIPT, "ensure"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=60,
        )
        lines = [line for line in (completed.stdout or "").splitlines() if line.strip().startswith("{")]
        if not lines:
            return {"ok": False, "verified": False, "error": (completed.stderr or "proxy ensure produced no JSON").strip()[:800]}
        return json.loads(lines[-1])
    except Exception as error:
        return {"ok": False, "verified": False, "error": str(error)}


def score(query, name):
    query = query.lower().strip()
    lower = name.lower()
    if not query:
        return 0
    if lower == query:
        return 100
    if lower.startswith(query):
        return 80
    if query in lower:
        return 60
    return 0


def browser_target(query):
    return BROWSER_TARGETS.get(str(query or "").strip().lower())


def browser_call(command, target):
    completed = subprocess.run(
        [sys.executable, FOREIGN_BROWSER, command, target],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=120,
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
    return completed.returncode, data or {"ok": False, "error": output[-500:] or "browser helper failed"}


def find(query):
    target = browser_target(query)
    if target:
        return [{
            "name": target["name"],
            "kind": "isolated-browser",
            "foreign": True,
            "url": target["url"],
            "appid": None,
            "path": FOREIGN_BROWSER,
        }]
    matches = []
    for item in start_apps():
        if item.get("appid") in SELF_APP_IDS or item["name"].lower() in SELF_APP_NAMES:
            continue
        value = score(query, item["name"])
        if value:
            matches.append({**item, "foreign": is_foreign(item["name"]), "score": value})
    for item in shortcuts():
        if item["name"].lower() in SELF_APP_NAMES:
            continue
        value = score(query, item["name"])
        if value:
            matches.append({**item, "foreign": is_foreign(item["name"]), "score": value})
    matches.sort(key=lambda item: (-item["score"], item["kind"] != "startapp", item["name"]))
    return matches


def wait_window(query, timeout=12):
    try:
        from computer import list_windows
    except Exception:
        return None
    needle = query.lower().strip()
    deadline = time.time() + timeout
    while time.time() < deadline:
        for window in list_windows():
            title = str(window.get("title") or "")
            if needle and needle in title.lower():
                return window
        time.sleep(0.4)
    return None


def launch(query):
    target = browser_target(query)
    if target:
        code, data = browser_call("launch", target["name"])
        return data
    matches = find(query)
    if not matches:
        return {"ok": False, "error": f"no local app matching {query!r}"}
    chosen = matches[0]
    if is_foreign(chosen["name"]):
        containment = containment_status(chosen["name"])
        if not containment.get("ready"):
            return {
                "ok": False,
                "error": containment.get("error") or "CONTAINMENT_NOT_INSTALLED",
                "name": chosen["name"],
                "reason": "国外 AI 未完成防火墙硬隔离，拒绝启动以避免直连风控/封号",
                "containment": containment,
            }
        guard = proxy_guard()
        if not guard.get("verified"):
            return {
                "ok": False,
                "error": "PROXY_NOT_VERIFIED",
                "name": chosen["name"],
                "reason": "国外 AI 未通过 Clash 系统代理校验，拒绝启动以避免风控/封号",
                "proxy": guard,
            }
        return launch_foreign(chosen["name"])
    if chosen["kind"] == "startapp":
        appid = chosen["appid"]
        subprocess.Popen(["explorer.exe", f"shell:AppsFolder\\{appid}"], close_fds=True)
    else:
        os.startfile(chosen["path"])
    window = wait_window(chosen["name"], timeout=12)
    return {
        "ok": True,
        "name": chosen["name"],
        "kind": chosen["kind"],
        "appid": chosen.get("appid"),
        "path": chosen.get("path"),
        "window": window,
    }


def main():
    if len(sys.argv) < 2:
        fail("missing command: find <query> | launch <query> | list")
    command = sys.argv[1].lower()
    if command == "list":
        apps = start_apps()
        emit({"ok": True, "apps": apps})
    if command == "find":
        query = " ".join(sys.argv[2:]).strip()
        if not query:
            fail("find requires a query")
        emit({"ok": True, "query": query, "matches": find(query)[:12]})
    if command == "guard":
        query = " ".join(sys.argv[2:]).strip()
        if not query:
            fail("guard requires a query")
        target = browser_target(query)
        if target:
            code, data = browser_call("guard", target["name"])
            emit(data, 0 if data.get("ok") else 1)
        matches = find(query)
        if not matches:
            fail(f"no local app matching {query!r}")
        chosen = matches[0]
        foreign = is_foreign(chosen["name"])
        containment = containment_status(chosen["name"]) if foreign else None
        guard = proxy_guard() if foreign and containment and containment.get("ready") else None
        ok = (not foreign) or bool(containment and containment.get("ready") and guard and guard.get("verified"))
        emit(
            {
                "ok": ok,
                "name": chosen["name"],
                "foreign": foreign,
                "containment": containment,
                "proxy": guard,
            },
            0 if ok else 1,
        )
    if command == "launch":
        query = " ".join(sys.argv[2:]).strip()
        if not query:
            fail("launch requires a query")
        target = browser_target(query)
        if target:
            code, data = browser_call("launch", target["name"])
            emit(data, 0 if data.get("ok") else 1)
        result = launch(query)
        emit(result, 0 if result.get("ok") else 1)
    fail(f"unknown command: {command}")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:
        fail(error)
