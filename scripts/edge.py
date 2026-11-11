#!/usr/bin/env python3
"""Browser helper for DSH Bot — Edge / Chrome / Brave / Chromium / Firefox.

Low-level UI Automation first; auto-selects the browser the user is currently
using, then installed Edge → Chrome → Brave → Chromium → Firefox.

Default workflow for web tasks:
  edge.py open URL       # reuse the running Edge process, new tab
  edge.py read           # page text + buttons/inputs/links via UI Automation
  edge.py click --name "提交"
  edge.py type --name "学号" --text "123"
  edge.py select --name "A"

Screenshots are a fallback for canvas/PDF/image-only pages, not the default.

Commands:
  status [--browser edge|chrome|brave|chromium|firefox]
  open URL [--new-window] [--browser NAME]
  navigate URL [--browser NAME]
  activate [--browser NAME]
  read [--limit 200] [--all] [--browser NAME]
  wait [--timeout 8]
  wait-change [--timeout 6]
  scroll [down|up|top|bottom] [--pages N]
  back
  forward
  reload
  click --name TEXT [--role Button] [--all] [--verify] [--browser NAME]
  type --name TEXT --text VALUE [--browser NAME]
  type --index N --text VALUE
  select --name TEXT
  screenshot [PATH]
  monitors
  screen
"""

from __future__ import annotations

import base64
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


def flag(args, name, default=""):
    key = f"--{name}"
    for index, item in enumerate(args):
        if item == key and index + 1 < len(args):
            return args[index + 1]
    return default


BROWSERS = {
    "edge": {
        "name": "Microsoft Edge",
        "exe": ("Microsoft", "Edge", "Application", "msedge.exe"),
        "title": "Edge",
        "process": "msedge.exe",
    },
    "chrome": {
        "name": "Google Chrome",
        "exe": ("Google", "Chrome", "Application", "chrome.exe"),
        "title": "Chrome",
        "process": "chrome.exe",
    },
    "brave": {
        "name": "Brave",
        "exe": ("BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
        "title": "Brave",
        "process": "brave.exe",
    },
    "chromium": {
        "name": "Chromium",
        "exe": ("Chromium", "Application", "chrome.exe"),
        "title": "Chromium",
        "process": "chrome.exe",
    },
    "firefox": {
        "name": "Mozilla Firefox",
        "exe": ("Mozilla Firefox", "firefox.exe"),
        "title": "Firefox",
        "process": "firefox.exe",
    },
}
BROWSER_ORDER = ("edge", "chrome", "brave", "chromium", "firefox")
PREFERRED_BROWSER = os.environ.get("DSH_BOT_BROWSER", "auto").strip().lower() or "auto"
SITE_PROFILES = {
    "icve.com.cn": (
        "icve",
        "智慧职教：任务/视频/作业常在 iframe。先看 documents 的 frame；"
        "点击用 click --all --verify，changed:false 时禁止重复点击，先检查新 frame、scroll、wait-change，仍无变化就停下报告卡点。",
    ),
    "chaoxing.com": (
        "chaoxing",
        "超星/学习通：章节、视频、作业常在 iframe 或新窗口；先 read --all，提交后必须 read 确认状态，未变化不要重复点。",
    ),
    "zhihuishu.com": (
        "zhihuishu",
        "智慧树：课程视频/章节在播放器 iframe；先 read --all，视频用播放控件，作业提交后回读确认。",
    ),
    "xuetangx.com": (
        "xuetangx",
        "学堂在线：课件/视频/测验常在 iframe；先 read --all，点击用 --all --verify，卡住就停下报告。",
    ),
}


def find_browser(name):
    spec = BROWSERS.get(str(name).lower())
    if not spec:
        return None
    candidates = []
    for root in (
        os.environ.get("ProgramFiles(x86)"),
        os.environ.get("ProgramFiles"),
        os.environ.get("LOCALAPPDATA"),
    ):
        if root:
            candidates.append(os.path.join(root, *spec["exe"]))
    try:
        import winreg

        if str(name).lower() != "chromium":
            exe_name = spec["exe"][-1]
            with winreg.OpenKey(
                winreg.HKEY_LOCAL_MACHINE,
                rf"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{exe_name}",
            ) as key:
                candidates.insert(0, winreg.QueryValue(key, None))
    except Exception:
        pass
    for candidate in candidates:
        if candidate and os.path.isfile(candidate):
            return candidate
    return None


def installed_browsers():
    return [name for name in BROWSER_ORDER if find_browser(name)]


def browser_windows(name):
    title_needle = BROWSERS.get(str(name).lower(), {}).get("title", "")
    if not title_needle:
        return []
    return [
        window
        for window in computer.list_windows()
        if title_needle.lower() in str(window.get("title", "")).lower()
    ]


def resolve_browser(preferred=None):
    wanted = str(preferred or PREFERRED_BROWSER or "auto").strip().lower()
    if wanted != "auto":
        if wanted not in BROWSERS:
            raise RuntimeError(f"unknown browser: {wanted}")
        if not find_browser(wanted) and not browser_windows(wanted):
            raise RuntimeError(f"{BROWSERS[wanted]['name']} is not installed or not running")
        return wanted
    running = [name for name in BROWSER_ORDER if browser_windows(name)]
    active = [name for name in running if any(item.get("active") for item in browser_windows(name))]
    if active:
        return active[0]
    if running:
        return running[0]
    installed = installed_browsers()
    if installed:
        return installed[0]
    raise RuntimeError("no supported browser found (Edge / Chrome / Brave / Chromium / Firefox)")


def find_edge():
    return find_browser("edge")


def edge_windows(browser=None):
    return browser_windows(resolve_browser(browser))


def normalize_url(value):
    url = str(value or "").strip()
    if not url:
        raise ValueError("URL is empty")
    if not url.lower().startswith(("http://", "https://", "file://")):
        url = "https://" + url
    return url


def activate_edge(browser=None):
    name = resolve_browser(browser)
    windows = browser_windows(name)
    if not windows:
        return None
    return computer.activate_window(windows[0]["title"])


def open_url(url, new_window=False, browser=None):
    name = resolve_browser(browser)
    executable = find_browser(name)
    if not executable:
        raise RuntimeError(f"{BROWSERS[name]['name']} not found")
    windows = browser_windows(name)
    args = [executable]
    if new_window:
        args.append("-new-window" if name == "firefox" else "--new-window")
    elif windows:
        # Reuse the running browser process; never spawn a second copy per step.
        args.append("-new-tab" if name == "firefox" else "--new-tab")
    if name != "firefox" and not windows:
        args.extend(["--no-first-run", "--no-default-browser-check"])
    args.append(url)
    subprocess.Popen(args, close_fds=True)
    time.sleep(0.9)
    window = activate_edge(name)
    page = wait_ready(8)
    return {
        "ok": True,
        "browser": name,
        "browserName": BROWSERS[name]["name"],
        "url": url,
        "window": window,
        "page": page,
        "windows": browser_windows(name),
    }


def navigate(url, browser=None):
    name = resolve_browser(browser)
    activate_edge(name)
    if not browser_windows(name):
        return open_url(url, browser=name)
    computer.press_combo("ctrl+l")
    time.sleep(0.2)
    computer.type_text(url)
    time.sleep(0.2)
    computer.press_combo("enter")
    return {"ok": True, "browser": name, "url": url, "page": wait_ready(8), "windows": browser_windows(name)}


def read_page(limit=200, all_frames=False):
    return uia_run("read", limit=limit, all=all_frames)


def click_with_verify(action, name, role, index, all_frames, timeout=2.5):
    before = read_page(160, all_frames)
    before_sig = page_signature(before)
    result = uia_run(action, name=name, role=role, index=index, all=all_frames)
    if not result.get("ok"):
        return result
    deadline = time.time() + timeout
    after = before
    while time.time() < deadline:
        time.sleep(0.35)
        after = read_page(160, all_frames)
        if after.get("ok") and page_signature(after) != before_sig:
            return {
                **result,
                "changed": True,
                "before": {"textLength": before.get("textLength"), "controlsCount": before.get("controlsCount")},
                "after": {"textLength": after.get("textLength"), "controlsCount": after.get("controlsCount")},
            }
    return {
        **result,
        "changed": False,
        "stalled": True,
        "warning": "点击后页面没有可见变化，不要重复点击；先 read --all、检查 frame、滚动或等待。",
        "before": {"textLength": before.get("textLength"), "controlsCount": before.get("controlsCount")},
        "after": {"textLength": after.get("textLength"), "controlsCount": after.get("controlsCount")},
    }


def page_signature(page):
    controls = page.get("controls") if isinstance(page, dict) else None
    return (
        int(page.get("textLength") or 0) if isinstance(page, dict) else 0,
        tuple(
            (str(item.get("name") or ""), str(item.get("value") or ""), str(item.get("role") or ""), bool(item.get("enabled")))
            for item in (controls or [])
        ),
    )


def wait_change(timeout=6):
    before = read_page(160, True)
    if not before.get("ok"):
        return before
    before_sig = page_signature(before)
    deadline = time.time() + timeout
    while time.time() < deadline:
        time.sleep(0.45)
        after = read_page(160, True)
        if after.get("ok") and page_signature(after) != before_sig:
            return {
                "ok": True,
                "changed": True,
                "before": {"textLength": before.get("textLength"), "controlsCount": before.get("controlsCount")},
                "after": {"textLength": after.get("textLength"), "controlsCount": after.get("controlsCount")},
                "page": after,
            }
    after = read_page(160, True)
    return {
        "ok": True,
        "changed": False,
        "before": {"textLength": before.get("textLength"), "controlsCount": before.get("controlsCount")},
        "after": {"textLength": after.get("textLength"), "controlsCount": after.get("controlsCount")},
        "page": after,
    }


def wait_ready(timeout=8):
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        last = read_page(40)
        if last.get("ok") and (int(last.get("textLength") or 0) >= 40 or int(last.get("controlsCount") or 0) >= 1):
            return last
        time.sleep(0.5)
    return last or {"ok": False, "error": "page did not become readable"}


def page_summary(page):
    if not page:
        return None
    return {
        "title": page.get("title"),
        "url": page.get("url"),
        "textLength": page.get("textLength"),
        "controlsCount": page.get("controlsCount"),
    }


def scroll_page(direction="down", pages=1):
    activate_edge()
    key = {
        "down": "pagedown",
        "up": "pageup",
        "top": "ctrl+home",
        "bottom": "ctrl+end",
    }.get(str(direction).lower(), "pagedown")
    for _ in range(max(1, int(pages))):
        computer.press_combo(key)
        time.sleep(0.25)
    return {"ok": True, "direction": direction, "pages": pages, "page": read_page(80)}


UIA_BODY = r'''
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class DshMouse {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, IntPtr e);
  public static void Click(int x, int y) {
    SetCursorPos(x, y);
    mouse_event(0x0002, 0, 0, 0, IntPtr.Zero);
    mouse_event(0x0004, 0, 0, 0, IntPtr.Zero);
  }
}
"@
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$ErrorActionPreference = 'Stop'
$root = [System.Windows.Automation.AutomationElement]::RootElement
$windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)
$win = $null
foreach ($w in $windows) {
  if ($w.Current.Name -match [regex]::Escape([string]$payload.window)) { $win = $w; break }
}
if (-not $win) { '{"ok":false,"error":"Edge window not found"}'; exit 1 }
$all = $win.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
function Get-Role($e) { $e.Current.ControlType.ProgrammaticName -replace 'ControlType\.', '' }
function Get-Value($e) {
  try { return $e.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value } catch { return '' }
}
$action = [string]$payload.action
$limit = if ($payload.limit) { [int]$payload.limit } else { 200 }
$docs = @()
foreach ($e in $all) { if ((Get-Role $e) -eq 'Document') { $docs += $e } }
$doc = $null
$bestLength = -1
foreach ($d in $docs) {
  try {
    $t = $d.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern).DocumentRange.GetText(-1)
    if ($t.Length -gt $bestLength) { $bestLength = $t.Length; $doc = $d }
  } catch {}
}
$pageAll = if ($doc) { $doc.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition) } else { $all }
$url = ''
foreach ($e in $all) {
  if ((Get-Role $e) -eq 'Edit') {
    $v = Get-Value $e
    if ($v -match '^(https?|file)://') { $url = $v; break }
  }
}
if ($action -eq 'read') {
  $readDocs = if ($payload.all) { $docs } else { @($doc) }
  $textParts = @()
  $items = @()
  $documents = @()
  $frameIndex = 0
  foreach ($d in $readDocs) {
    if (-not $d) { $frameIndex++; continue }
    $frameText = ''
    try {
      $frameText = $d.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern).DocumentRange.GetText(-1)
    } catch {}
    $frameControls = @()
    foreach ($e in $d.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)) {
      $role = Get-Role $e
      if ($role -notin @('Edit','Button','RadioButton','CheckBox','ComboBox','ListItem','Hyperlink','MenuItem','TabItem')) { continue }
      $nm = [string]$e.Current.Name
      if ([string]::IsNullOrWhiteSpace($nm)) { continue }
      $r = $e.Current.BoundingRectangle
      if ($r.Width -le 0 -or $r.Height -le 0) { continue }
      $entry = [pscustomobject]@{
        frame = $frameIndex
        name = $nm
        role = $role
        value = (Get-Value $e)
        enabled = $e.Current.IsEnabled
        x = [int]$r.X
        y = [int]$r.Y
        w = [int]$r.Width
        h = [int]$r.Height
      }
      $frameControls += $entry
      $items += $entry
      if ($items.Count -ge $limit) { break }
    }
    $textParts += $frameText
    $frameTextShort = if ($frameText.Length -gt 8000) { $frameText.Substring(0, 8000) } else { $frameText }
    $documents += [pscustomobject]@{
      index = $frameIndex
      title = $d.Current.Name
      textLength = $frameText.Length
      controlsCount = $frameControls.Count
      text = $frameTextShort
      controls = @($frameControls)
    }
    $frameIndex++
    if ($items.Count -ge $limit) { break }
  }
  $text = ($textParts | Where-Object { $_ }) -join "`n`n--- frame ---`n`n"
  $fullLength = $text.Length
  if ($text.Length -gt 20000) { $text = $text.Substring(0, 20000) }
  [pscustomobject]@{
    ok = $true
    title = $win.Current.Name
    url = $url
    textLength = $fullLength
    controlsCount = $items.Count
    framesCount = $docs.Count
    text = $text
    controls = @($items)
    documents = @($documents)
  } | ConvertTo-Json -Depth 6 -Compress
  exit 0
}
$target = $null
$seen = 0
if ($payload.all) {
  $scopeAll = @()
  foreach ($d in $docs) {
    foreach ($e in $d.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)) {
      $scopeAll += $e
    }
  }
} elseif ($payload.chrome) {
  $scopeAll = $all
} else {
  $scopeAll = $pageAll
}
foreach ($e in $scopeAll) {
  $role = Get-Role $e
  $nm = [string]$e.Current.Name
  if ($payload.role -and $role -ne $payload.role) { continue }
  if ($payload.name) {
    if ([string]::IsNullOrWhiteSpace($nm)) { continue }
    if ($nm -ne $payload.name -and $nm -notlike "*$($payload.name)*") { continue }
  }
  $r = $e.Current.BoundingRectangle
  if ($r.Width -le 0 -or $r.Height -le 0) { continue }
  if ($payload.index -ne $null) {
    if ($seen -lt [int]$payload.index) { $seen++; continue }
  }
  $target = $e
  break
}
if (-not $target) { '{"ok":false,"error":"control not found"}'; exit 1 }
$tr = $target.Current.BoundingRectangle
$base = [pscustomobject]@{
  ok = $true
  name = $target.Current.Name
  role = (Get-Role $target)
  x = [int](($tr.X + $tr.Width / 2))
  y = [int](($tr.Y + $tr.Height / 2))
}
if ($action -eq 'type') {
  try {
    $vp = $target.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    $vp.SetValue([string]$payload.text)
    $base | Add-Member -NotePropertyName method -NotePropertyValue 'value-pattern'
    $base | ConvertTo-Json -Compress
    exit 0
  } catch {
    $base | Add-Member -NotePropertyName method -NotePropertyValue 'click-fallback'
    $base | ConvertTo-Json -Compress
    exit 0
  }
}
$method = 'click'
try {
  $inv = $target.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
  $inv.Invoke()
  $method = 'invoke'
} catch {
  try {
    $sel = $target.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern)
    $sel.Select()
    $method = 'select'
  } catch {
    try {
      $tog = $target.GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern)
      $tog.Toggle()
      $method = 'toggle'
    } catch {
      [DshMouse]::Click([int]$base.x, [int]$base.y)
      $method = 'mouse'
    }
  }
}
$base | Add-Member -NotePropertyName method -NotePropertyValue $method
$base | ConvertTo-Json -Compress
'''


def uia_run(action, **kwargs):
    try:
        browser = resolve_browser()
    except Exception as error:
        return {"ok": False, "error": str(error)}
    payload = {"action": action, "window": BROWSERS[browser]["title"], "browser": browser, **kwargs}
    encoded_payload = base64.b64encode(
        json.dumps(payload, ensure_ascii=False).encode("utf-8")
    ).decode("ascii")
    prelude = (
        "$payloadText = [Text.Encoding]::UTF8.GetString("
        f"[Convert]::FromBase64String('{encoded_payload}'))\n"
        "$payload = $payloadText | ConvertFrom-Json\n"
    )
    script = prelude + UIA_BODY
    encoded = base64.b64encode(script.encode("utf-16le")).decode("ascii")
    completed = subprocess.run(
        [
            "powershell.exe",
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-EncodedCommand",
            encoded,
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=30,
    )
    raw = (completed.stdout or "").strip()
    line = next((item for item in reversed(raw.splitlines()) if item.strip().startswith("{")), "")
    if not line:
        return {"ok": False, "error": (completed.stderr or raw or "UI Automation returned nothing")[:500]}
    try:
        parsed = json.loads(line)
        parsed.setdefault("browser", browser)
        return parsed
    except Exception as error:
        return {"ok": False, "error": f"bad UIA json: {error}", "browser": browser}


def main():
    global PREFERRED_BROWSER
    if len(sys.argv) < 2:
        fail("missing command; try: status, open, navigate, read, click, type, select, screenshot")
    command = sys.argv[1].lower()
    args = sys.argv[2:]
    requested = flag(args, "browser", "")
    if requested:
        PREFERRED_BROWSER = requested.strip().lower()
    cleaned = []
    skip = False
    for index, item in enumerate(args):
        if skip:
            skip = False
            continue
        if item == "--browser":
            skip = True
            continue
        cleaned.append(item)
    args = cleaned

    if command == "status":
        installed = {name: find_browser(name) for name in BROWSER_ORDER}
        running = {name: browser_windows(name) for name in BROWSER_ORDER}
        active = resolve_browser()
        return emit(
            {
                "ok": True,
                "browser": active,
                "browserName": BROWSERS[active]["name"],
                "installed": installed,
                "running": running,
                "windows": browser_windows(active),
                "monitors": computer.list_monitors(),
            }
        )
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
    if command == "read":
        limit = int(flag(args, "limit", "200") or 200)
        result = read_page(limit, "--all" in args)
        url = str(result.get("url") or "").lower()
        for domain, (adapter, hint) in SITE_PROFILES.items():
            if domain in url:
                result["adapter"] = adapter
                result["siteHint"] = hint
                break
        if (
            result.get("ok")
            and resolve_browser() == "firefox"
            and int(result.get("textLength") or 0) == 0
            and int(result.get("controlsCount") or 0) == 0
        ):
            result["ok"] = False
            result["error"] = "Firefox 未向 Windows UI Automation 暴露页面内容"
            result["hint"] = "改用 --browser chrome / edge / brave，或使用 scripts/browser.py 的 Firefox Marionette 桥。"
        if result.get("ok"):
            activate_edge()
        return emit(result)
    if command == "wait":
        timeout = float(flag(args, "timeout", "8") or 8)
        return emit(wait_ready(timeout))
    if command == "wait-change":
        timeout = float(flag(args, "timeout", "6") or 6)
        return emit(wait_change(timeout))
    if command == "scroll":
        direction = args[0] if args else "down"
        pages = int(flag(args, "pages", "1") or 1)
        return emit(scroll_page(direction, pages))
    if command in ("back", "forward", "reload"):
        activate_edge()
        computer.press_combo({"back": "alt+left", "forward": "alt+right", "reload": "f5"}[command])
        return emit({"ok": True, "action": command, "page": wait_ready(8)})
    if command in ("click", "select"):
        name = flag(args, "name", "")
        role = flag(args, "role", "RadioButton" if command == "select" else "")
        index = flag(args, "index", None)
        if not name and index is None:
            fail(f"{command} requires --name or --index")
        all_frames = "--all" in args
        if "--verify" in args:
            result = click_with_verify("click", name, role, index, all_frames)
        else:
            result = uia_run("click", name=name, role=role, index=index, all=all_frames)
        if result.get("ok"):
            activate_edge()
        return emit(result)
    if command == "type":
        name = flag(args, "name", "")
        text = flag(args, "text", "")
        index = flag(args, "index", None)
        if not name and index is None:
            fail("type requires --name or --index, plus --text")
        result = uia_run("type", name=name, text=text, role="Edit", index=index, all="--all" in args)
        if not result.get("ok"):
            return emit(result)
        if result.get("method") == "click-fallback":
            activate_edge()
            computer.mouse_click(int(result["x"]), int(result["y"]), "left", False)
            time.sleep(0.15)
            computer.press_combo("ctrl+a")
            computer.type_text(text)
            result["method"] = "click+type"
        return emit(result)
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
