#!/usr/bin/env python3
"""UI Automation element control for DSH Bot.

Instead of guessing screen coordinates, list a window's accessibility tree and
invoke/select/toggle/focus elements by name. Coordinates are a fallback for
canvas/PDF/image-only surfaces.

Commands:
  list  [--window TITLE] [--limit 240] [--role Button] [--interactive]
  click --window TITLE --name TEXT [--role Button] [--index N]
  type  --window TITLE --name TEXT --text VALUE
  focus --window TITLE --name TEXT [--role Button]
  wait  --window TITLE --name TEXT [--timeout 8]

Every command prints one JSON object.
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

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

UIA_SCRIPT = r"""
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$ErrorActionPreference = 'Stop'
$payload = $payloadText | ConvertFrom-Json
function RoleOf($e) {
  try { return ([string]$e.Current.ControlType.ProgrammaticName) -replace '^ControlType\.', '' } catch { return '' }
}
function ValueOf($e) {
  try {
    $p = $e.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    return [string]$p.Current.Value
  } catch { return '' }
}
function PatternsOf($e) {
  $names = @()
  foreach ($p in $e.GetSupportedPatterns()) {
    try { $names += ([string]$p.ProgrammaticName) -replace '^Pattern\.', '' } catch {}
  }
  return $names
}
$root = [System.Windows.Automation.AutomationElement]::RootElement
$window = $null
if ($payload.window) {
  foreach ($w in $root.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)) {
    if ([string]$w.Current.Name -match [regex]::Escape([string]$payload.window)) { $window = $w; break }
  }
}
if (-not $window) {
  $focused = [System.Windows.Automation.AutomationElement]::FocusedElement
  if ($focused) { $window = $focused }
}
if (-not $window) {
  [pscustomobject]@{ ok = $false; error = "no window matching $($payload.window)" } | ConvertTo-Json -Compress
  exit 0
}
$all = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
$rows = @()
foreach ($e in $all) {
  try {
    $r = $e.Current.BoundingRectangle
    $role = RoleOf $e
    $name = [string]$e.Current.Name
    $enabled = $e.Current.IsEnabled
    $offscreen = $e.Current.IsOffscreen
    if ($payload.role -and $role.ToLower() -notlike "*$(([string]$payload.role).ToLower())*") { continue }
    if ($payload.interactive -and $role -notin @('Button','Edit','RadioButton','CheckBox','ComboBox','ListItem','Hyperlink','MenuItem','TabItem','Slider','Spinner')) { continue }
    if ([string]::IsNullOrWhiteSpace($name) -and [string]::IsNullOrWhiteSpace((ValueOf $e))) { continue }
    if ($r.Width -le 0 -or $r.Height -le 0) { continue }
    $rows += [pscustomobject]@{
      index = $rows.Count
      role = $role
      name = $name
      value = (ValueOf $e)
      automationId = [string]$e.Current.AutomationId
      className = [string]$e.Current.ClassName
      enabled = $enabled
      offscreen = $offscreen
      x = [int]$r.X
      y = [int]$r.Y
      w = [int]$r.Width
      h = [int]$r.Height
      patterns = @(PatternsOf $e)
    }
    if ($rows.Count -ge [int]$payload.limit) { break }
  } catch {}
}
if ($payload.action -eq 'list') {
  [pscustomobject]@{
    ok = $true
    window = [pscustomobject]@{ name = $window.Current.Name; className = $window.Current.ClassName; handle = $window.Current.NativeWindowHandle; x = [int]$window.Current.BoundingRectangle.X; y = [int]$window.Current.BoundingRectangle.Y; w = [int]$window.Current.BoundingRectangle.Width; h = [int]$window.Current.BoundingRectangle.Height }
    count = $rows.Count
    elements = @($rows)
  } | ConvertTo-Json -Depth 7 -Compress
  exit 0
}
$wanted = [string]$payload.name
$candidates = @()
foreach ($e in $all) {
  try {
    $name = [string]$e.Current.Name
    $role = RoleOf $e
    $r = $e.Current.BoundingRectangle
    if ($r.Width -le 0 -or $r.Height -le 0) { continue }
    if ($payload.role -and $role.ToLower() -notlike "*$(([string]$payload.role).ToLower())*") { continue }
    if ($name -eq $wanted) { $candidates += $e; continue }
    if ($name -like "*$wanted*") { $candidates += $e }
  } catch {}
}
if ($candidates.Count -eq 0) {
  [pscustomobject]@{ ok = $false; error = "element not found: $wanted"; window = [string]$window.Current.Name } | ConvertTo-Json -Compress
  exit 0
}
$element = $candidates[[Math]::Min([int]$payload.index, $candidates.Count - 1)]
$method = ''
if ($payload.action -eq 'click') {
  try { $p = $element.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern); $p.Invoke(); $method = 'invoke' } catch {}
  if (-not $method) { try { $p = $element.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern); $p.Select(); $method = 'select' } catch {} }
  if (-not $method) { try { $p = $element.GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern); $p.Toggle(); $method = 'toggle' } catch {} }
  if (-not $method) { try { $p = $element.GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern); $p.Expand(); $method = 'expand' } catch {} }
}
if (-not $method) {
  try { $element.SetFocus(); $method = 'focus' } catch {}
}
$r = $element.Current.BoundingRectangle
[pscustomobject]@{
  ok = $true
  action = $payload.action
  method = $method
  name = [string]$element.Current.Name
  role = (RoleOf $element)
  x = [int]($r.X + $r.Width / 2)
  y = [int]($r.Y + $r.Height / 2)
  w = [int]$r.Width
  h = [int]$r.Height
  value = (ValueOf $element)
  window = [string]$window.Current.Name
  windowX = [int]$window.Current.BoundingRectangle.X
  windowY = [int]$window.Current.BoundingRectangle.Y
  windowW = [int]$window.Current.BoundingRectangle.Width
  windowH = [int]$window.Current.BoundingRectangle.Height
} | ConvertTo-Json -Compress
"""


def normalize_element(element, ui_window, win32_window):
    """Map provider coordinates (often 2x) into Win32 screen pixels."""
    try:
        ux = float(ui_window.get("x") or 0)
        uy = float(ui_window.get("y") or 0)
        uw = float(ui_window.get("w") or 0)
        uh = float(ui_window.get("h") or 0)
        wx, wy, wr, wb = win32_window.get("rect") or [0, 0, 0, 0]
        ww = float(wr - wx)
        wh = float(wb - wy)
        sx = ww / uw if uw > 0 else 1.0
        sy = wh / uh if uh > 0 else 1.0
        raw_x = float(element.get("x") or 0)
        raw_y = float(element.get("y") or 0)
        element["rawX"] = int(raw_x)
        element["rawY"] = int(raw_y)
        element["x"] = int(round(wx + (raw_x - ux) * sx))
        element["y"] = int(round(wy + (raw_y - uy) * sy))
        element["w"] = int(round(float(element.get("w") or 0) * sx))
        element["h"] = int(round(float(element.get("h") or 0) * sy))
        return {"scaleX": round(sx, 4), "scaleY": round(sy, 4)}
    except Exception:
        return {"scaleX": 1.0, "scaleY": 1.0}


def normalize_result(result, window):
    try:
        win32 = computer.activate_window(window)
        result["windowInfo"] = win32
        window_value = result.get("window")
        ui_window = window_value if isinstance(window_value, dict) else {
            "x": result.get("windowX"),
            "y": result.get("windowY"),
            "w": result.get("windowW"),
            "h": result.get("windowH"),
        }
        if result.get("elements"):
            for element in result["elements"]:
                result["coordinateScale"] = normalize_element(element, ui_window, win32)
        elif "x" in result:
            point = {"x": result.get("x"), "y": result.get("y"), "w": result.get("w"), "h": result.get("h")}
            result["coordinateScale"] = normalize_element(point, ui_window, win32)
            result.update({"x": point["x"], "y": point["y"], "w": point["w"], "h": point["h"]})
    except Exception as error:
        result["normalizeError"] = str(error)
    return result


def run_uia(payload):
    encoded = base64.b64encode(json.dumps(payload, ensure_ascii=False).encode("utf-8")).decode("ascii")
    script = f"$payloadText = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('{encoded}'))\n" + UIA_SCRIPT
    completed = subprocess.run(
        ["powershell", "-NoProfile", "-STA", "-Command", script],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=45,
    )
    raw = (completed.stdout or "").strip()
    lines = [line for line in raw.splitlines() if line.strip()]
    if not lines:
        return {"ok": False, "error": (completed.stderr or "UI Automation returned nothing")[:600]}
    try:
        return json.loads(lines[-1])
    except Exception as error:
        return {"ok": False, "error": f"bad UIA json: {error}", "raw": raw[-500:]}


def flag(args, name, default=""):
    key = f"--{name}"
    for index, item in enumerate(args):
        if item == key and index + 1 < len(args):
            return args[index + 1]
    return default


def has(args, name):
    return f"--{name}" in args


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def main():
    if len(sys.argv) < 2:
        emit({"ok": False, "error": "missing command; try list/click/type/focus/wait"})
    command = sys.argv[1].lower()
    args = sys.argv[2:]
    window = flag(args, "window", "")
    role = flag(args, "role", "")
    if not window:
        emit({"ok": False, "error": "--window TITLE is required"})
    if command == "list":
        payload = {
            "action": "list",
            "window": window,
            "role": role,
            "interactive": has(args, "interactive"),
            "limit": int(flag(args, "limit", "240") or 240),
        }
        result = run_uia(payload)
        if result.get("ok"):
            normalize_result(result, window)
        emit(result)
    if command in ("click", "focus"):
        name = flag(args, "name", "")
        if not name:
            emit({"ok": False, "error": "--name TEXT is required"})
        result = run_uia(
            {
                "action": "click" if command == "click" else "focus",
                "window": window,
                "name": name,
                "role": role,
                "index": int(flag(args, "index", "0") or 0),
            }
        )
        if result.get("ok"):
            result = normalize_result(result, window)
            if command == "click" and result.get("method") == "focus":
                # Last-resort coordinate click for elements without Invoke/Select patterns.
                try:
                    computer.mouse_click(int(result.get("x") or 0), int(result.get("y") or 0))
                    result["method"] = "mouse-fallback"
                except Exception as error:
                    result["fallbackError"] = str(error)
        emit(result)
    if command == "type":
        name = flag(args, "name", "")
        text = flag(args, "text", "")
        if not name:
            emit({"ok": False, "error": "--name TEXT is required"})
        try:
            computer.activate_window(window)
        except Exception:
            pass
        result = run_uia(
            {
                "action": "type",
                "window": window,
                "name": name,
                "role": role or "Edit",
                "index": int(flag(args, "index", "0") or 0),
            }
        )
        if result.get("ok"):
            try:
                computer.type_text(text)
                result["typed"] = True
            except Exception as error:
                result["typed"] = False
                result["error"] = str(error)
        emit(result)
    if command == "wait":
        name = flag(args, "name", "")
        timeout = float(flag(args, "timeout", "8") or 8)
        deadline = time.time() + timeout
        while time.time() < deadline:
            result = run_uia({"action": "list", "window": window, "role": role, "interactive": False, "limit": 240})
            if result.get("ok") and any(name == item.get("name") or name in str(item.get("name") or "") for item in result.get("elements") or []):
                emit({"ok": True, "found": True, "window": window, "name": name})
            time.sleep(0.4)
        emit({"ok": False, "found": False, "window": window, "name": name, "timeout": timeout})
    emit({"ok": False, "error": f"unknown command: {command}"})


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:
        emit({"ok": False, "error": str(error)}, 1)
