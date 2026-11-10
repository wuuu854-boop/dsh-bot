#!/usr/bin/env python3
"""Keep Copilot's domains on the proxy despite the Clash profile's Microsoft DIRECT rule.

Clash subscription updates replace profile YAML files, which otherwise route
copilot.microsoft.com DIRECT (and the browser gets a TLS failure). This helper
inserts the narrow Copilot rules before the Microsoft DIRECT block, reloads the
active profile through the Clash controller, and verifies the runtime rules.
"""

from __future__ import annotations

import json
import os
import shutil
import sys
import time
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import proxy  # noqa: E402

CLASH_DIR = os.path.join(os.environ.get("USERPROFILE", ""), ".config", "clash")
PROFILE_DIR = os.path.join(CLASH_DIR, "profiles")
GROUP = "🚀手动切换线路"
RULES = [
    ("copilot.microsoft.com", GROUP),
    ("copilot.cloud.microsoft", GROUP),
    ("githubcopilot.com", GROUP),
]
NEEDLE = "# > Microsoft\n- DOMAIN-SUFFIX,microsoft.com,DIRECT\n"


def controller():
    return proxy.clash_controller()


def runtime_rules():
    info = controller()
    if not info:
        return None, "Clash controller unavailable"
    request = urllib.request.Request(
        info["base"] + "/rules",
        headers={"Authorization": f"Bearer {info['secret']}"} if info.get("secret") else {},
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        data = json.loads(response.read().decode())
    return (data.get("rules") if isinstance(data, dict) else data) or [], None


def route_ok(rules):
    if not rules:
        return False
    found = {}
    for rule in rules:
        payload = str(rule.get("payload") or "")
        if payload in {item[0] for item in RULES}:
            found[payload] = str(rule.get("proxy") or "")
    return all(found.get(name) not in (None, "", "DIRECT", "REJECT") for name, _ in RULES)


def patch_file(path):
    with open(path, "r", encoding="utf-8", errors="replace") as handle:
        text = handle.read()
    if "DOMAIN-SUFFIX,copilot.microsoft.com" in text:
        return False
    if NEEDLE not in text:
        return False
    lines = [
        "# > Microsoft Copilot (force proxy, do not inherit microsoft.com DIRECT)",
        *[f"- DOMAIN-SUFFIX,{name},{group}" for name, group in RULES],
        "# > Microsoft",
        "- DOMAIN-SUFFIX,microsoft.com,DIRECT",
        "",
    ]
    backup = path + ".dsh-backup-" + time.strftime("%Y%m%d-%H%M%S")
    shutil.copy2(path, backup)
    with open(path, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(text.replace(NEEDLE, "\n".join(lines) + "\n", 1))
    return True


def profiles():
    items = []
    if not os.path.isdir(PROFILE_DIR):
        return items
    for name in os.listdir(PROFILE_DIR):
        path = os.path.join(PROFILE_DIR, name)
        if not name.lower().endswith((".yml", ".yaml")) or not os.path.isfile(path):
            continue
        try:
            if os.path.getsize(path) > 10_000:
                items.append(path)
        except OSError:
            pass
    items.sort(key=os.path.getmtime, reverse=True)
    return items


def reload_profile(path):
    info = controller()
    if not info:
        return False, "Clash controller unavailable"
    body = json.dumps({"path": path}, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        info["base"] + "/configs",
        data=body,
        method="PUT",
        headers={
            **({"Authorization": f"Bearer {info['secret']}"} if info.get("secret") else {}),
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status not in (200, 204):
            return False, f"reload HTTP {response.status}"
    return True, None


def ensure():
    rules, error = runtime_rules()
    if error:
        return {"ok": False, "error": error}
    if route_ok(rules):
        return {"ok": True, "already": True, "rules": len(rules)}
    changed = []
    for path in profiles():
        try:
            if patch_file(path):
                changed.append(path)
        except Exception as exc:
            return {"ok": False, "error": f"patch failed: {path}: {exc}"}
    candidates = changed + profiles()
    last = None
    for path in candidates[:8]:
        try:
            ok, reload_error = reload_profile(path)
        except Exception as exc:
            last = str(exc)
            continue
        if not ok:
            last = reload_error
            continue
        time.sleep(1.5)
        rules, error = runtime_rules()
        if not error and route_ok(rules):
            return {
                "ok": True,
                "already": False,
                "patched": changed,
                "reloaded": path,
                "rules": len(rules),
            }
        last = error or "runtime rules still missing copilot route"
    return {"ok": False, "error": last or "could not reload a profile with the copilot route"}


def main():
    command = (sys.argv[1] if len(sys.argv) > 1 else "status").lower()
    if command == "status":
        rules, error = runtime_rules()
        print(json.dumps({
            "ok": not error and route_ok(rules),
            "controller": controller(),
            "rules": len(rules or []),
            "copilotRoute": route_ok(rules),
            "error": error,
        }, ensure_ascii=False))
        return 0 if not error and route_ok(rules) else 1
    if command == "ensure":
        result = ensure()
        print(json.dumps(result, ensure_ascii=False))
        return 0 if result.get("ok") else 1
    if command == "patch":
        changed = []
        for path in profiles():
            if patch_file(path):
                changed.append(path)
        print(json.dumps({"ok": True, "patched": changed}, ensure_ascii=False))
        return 0
    print(json.dumps({"ok": False, "error": f"unknown command: {command}"}))
    return 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        raise SystemExit(1)
