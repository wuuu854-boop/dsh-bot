#!/usr/bin/env python3
"""Isolated Firefox launcher for browser-only foreign AI (Grok / Copilot).

The browser is a dedicated Firefox copy under <project>\\browser\\firefox.
Windows Firewall rules only allow its exe files to reach 127.0.0.1:7890.
Each target has its own Firefox profile with a manual SOCKS5 proxy and no
direct fallback; the profile also disables updates, telemetry, WebRTC and
search suggestions.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(os.path.dirname(HERE))
BROWSER_DIR = os.path.join(BASE, "browser")
FIREFOX = os.path.join(BROWSER_DIR, "firefox", "firefox.exe")
PROFILE_ROOT = os.path.join(BROWSER_DIR, "profiles")
DOWNLOADS = os.path.join(BROWSER_DIR, "downloads")
COMPUTER = os.path.join(HERE, "computer.py")
PROXY = os.path.join(HERE, "proxy.py")
CONTAIN = os.path.join(HERE, "contain_foreign_browser.ps1")
CLASH_ROUTES = os.path.join(HERE, "clash_routes.py")
TARGETS = {
    "grok": {
        "name": "Grok",
        "title": "Grok",
        "url": "https://grok.com/",
        "profile": "grok",
    },
    "copilot": {
        "name": "Copilot",
        "title": "Copilot",
        "url": "https://copilot.microsoft.com/",
        "profile": "copilot",
    },
}


def run(cmd, timeout=60):
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
    start = output.find("{")
    end = output.rfind("}")
    if start >= 0 and end > start:
        try:
            data = json.loads(output[start:end + 1])
        except Exception:
            data = None
    if data is None:
        for line in reversed(output.splitlines()):
            line = line.strip()
            if line.startswith("{") and line.endswith("}"):
                try:
                    data = json.loads(line)
                    break
                except Exception:
                    continue
    return completed.returncode, output, data


def target_of(value):
    key = str(value or "").strip().lower()
    aliases = {
        "grok": "grok",
        "grok.com": "grok",
        "copilot": "copilot",
        "microsoft copilot": "copilot",
        "copilot.microsoft.com": "copilot",
    }
    return aliases.get(key)


def prefs_for(target):
    profile = os.path.join(PROFILE_ROOT, target["profile"])
    download = os.path.join(DOWNLOADS, target["profile"]).replace("\\", "/")
    url = target["url"]
    return [
        'user_pref("network.proxy.type", 1);',
        'user_pref("network.proxy.socks", "127.0.0.1");',
        'user_pref("network.proxy.socks_port", 7890);',
        'user_pref("network.proxy.socks_version", 5);',
        'user_pref("network.proxy.socks_remote_dns", true);',
        'user_pref("network.proxy.http", "");',
        'user_pref("network.proxy.http_port", 0);',
        'user_pref("network.proxy.ssl", "");',
        'user_pref("network.proxy.ssl_port", 0);',
        'user_pref("network.proxy.no_proxies_on", "");',
        'user_pref("network.proxy.failover_direct", false);',
        'user_pref("network.proxy.allow_hijacking_localhost", false);',
        'user_pref("network.dns.disableIPv6", true);',
        'user_pref("network.trr.mode", 5);',
        'user_pref("network.trr.uri", "");',
        'user_pref("network.http.http3.enable", false);',
        'user_pref("network.dns.disablePrefetch", true);',
        'user_pref("network.prefetch-next", false);',
        'user_pref("network.predictor.enabled", false);',
        'user_pref("network.captive-portal-service.enabled", false);',
        'user_pref("network.connectivity-service.enabled", false);',
        'user_pref("media.peerconnection.enabled", false);',
        'user_pref("media.peerconnection.ice.default_address_only", true);',
        'user_pref("app.update.enabled", false);',
        'user_pref("app.update.auto", false);',
        'user_pref("app.update.service.enabled", false);',
        'user_pref("app.update.disabledForTesting", true);',
        'user_pref("app.normandy.enabled", false);',
        'user_pref("app.shield.optoutstudies.enabled", false);',
        'user_pref("datareporting.policy.dataSubmissionEnabled", false);',
        'user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);',
        'user_pref("datareporting.healthreport.uploadEnabled", false);',
        'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);',
        'user_pref("toolkit.telemetry.enabled", false);',
        'user_pref("toolkit.telemetry.unified", false);',
        'user_pref("toolkit.telemetry.archive.enabled", false);',
        'user_pref("toolkit.telemetry.server", "");',
        'user_pref("browser.ping-centre.telemetry", false);',
        'user_pref("browser.newtabpage.activity-stream.feeds.telemetry", false);',
        'user_pref("browser.urlbar.suggest.searches", false);',
        'user_pref("browser.search.suggest.enabled", false);',
        'user_pref("browser.formfill.enable", false);',
        'user_pref("signon.rememberSignInAsks.password", false);',
        'user_pref("signon.autofillForms", false);',
        'user_pref("browser.safebrowsing.malware.enabled", false);',
        'user_pref("browser.safebrowsing.phishing.enabled", false);',
        'user_pref("browser.download.folderList", 2);',
        'user_pref("browser.download.useDownloadDir", true);',
        'user_pref("browser.download.dir", "%s");' % download,
        'user_pref("browser.startup.page", 1);',
        'user_pref("browser.startup.homepage", "%s");' % url,
        'user_pref("browser.startup.homepage_override.mstone", "ignore");',
        'user_pref("browser.aboutwelcome.enabled", false);',
        'user_pref("browser.shell.checkDefaultBrowser", false);',
        'user_pref("browser.messaging-system.whatsNewPanel.enabled", false);',
        'user_pref("browser.tabs.warnOnClose", false);',
        'user_pref("browser.sessionstore.resume_from_crash", false);',
        'user_pref("browser.newtabpage.enabled", false);',
        'user_pref("browser.discovery.enabled", false);',
        'user_pref("extensions.getAddons.showPane", false);',
        'user_pref("browser.region.network.url", "");',
        'user_pref("browser.region.update.enabled", false);',
        'user_pref("browser.search.region", "US");',
        'user_pref("intl.accept_languages", "zh-CN,zh,en-US,en");',
    ]


def write_policies():
    distribution = os.path.join(BROWSER_DIR, "firefox", "distribution")
    os.makedirs(distribution, exist_ok=True)
    policies = {
        "policies": {
            "DisableTelemetry": True,
            "DisableFirefoxStudies": True,
            "DisablePocket": True,
            "DisableFormHistory": True,
            "DontCheckDefaultBrowser": True,
            "OverrideFirstRunPage": "",
            "OverridePostUpdatePage": "",
            "NoDefaultBookmarks": True,
            "OfferToSaveLogins": False,
            "PasswordManagerEnabled": False,
            "Proxy": {
                "Mode": "manual",
                "SOCKSProxy": "127.0.0.1:7890",
                "SOCKSVersion": 5,
                "UseProxyForDNS": True,
                "Locked": True,
            },
            "Preferences": {
                "network.proxy.type": {"Value": 1, "Status": "locked"},
                "network.proxy.socks": {"Value": "127.0.0.1", "Status": "locked"},
                "network.proxy.socks_port": {"Value": 7890, "Status": "locked"},
                "network.proxy.socks_version": {"Value": 5, "Status": "locked"},
                "network.proxy.socks_remote_dns": {"Value": True, "Status": "locked"},
                "network.proxy.failover_direct": {"Value": False, "Status": "locked"},
                "network.trr.mode": {"Value": 5, "Status": "locked"},
                "network.http.http3.enable": {"Value": False, "Status": "locked"},
                "media.peerconnection.enabled": {"Value": False, "Status": "locked"},
                "datareporting.policy.dataSubmissionEnabled": {"Value": False, "Status": "locked"},
                "toolkit.telemetry.enabled": {"Value": False, "Status": "locked"},
                "app.update.enabled": {"Value": False, "Status": "locked"},
                "app.update.auto": {"Value": False, "Status": "locked"},
                "browser.aboutwelcome.enabled": {"Value": False, "Status": "locked"},
                "browser.shell.checkDefaultBrowser": {"Value": False, "Status": "locked"},
                "browser.startup.homepage_override.mstone": {"Value": "ignore", "Status": "locked"},
            },
        }
    }
    path = os.path.join(distribution, "policies.json")
    with open(path, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(policies, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return path


def configure(target):
    profile = os.path.join(PROFILE_ROOT, target["profile"])
    os.makedirs(profile, exist_ok=True)
    os.makedirs(os.path.join(DOWNLOADS, target["profile"]), exist_ok=True)
    user_js = os.path.join(profile, "user.js")
    with open(user_js, "w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(prefs_for(target)) + "\n")
    policies = write_policies()
    return {"ok": True, "profile": profile, "userJs": user_js, "policies": policies}


def containment_status():
    try:
        code, output, data = run(
            ["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", CONTAIN, "-Action", "Status"],
            timeout=30,
        )
        if data:
            return data
        return {"ok": False, "error": output[-500:] or "no containment status"}
    except Exception as error:
        return {"ok": False, "error": str(error)}


def proxy_status():
    try:
        code, output, data = run([sys.executable, PROXY, "ensure"], timeout=90)
        return data or {"verified": False, "error": output[-500:]}
    except Exception as error:
        return {"verified": False, "error": str(error)}


def guard(value):
    target = TARGETS.get(target_of(value) or "")
    if not target:
        return {"ok": False, "error": "unsupported browser target", "target": value}
    if not os.path.isfile(FIREFOX):
        return {"ok": False, "error": "BROWSER_NOT_INSTALLED", "browser": FIREFOX}
    configured = configure(target)
    if target["profile"] == "copilot":
        code, output, route = run([sys.executable, CLASH_ROUTES, "ensure"], timeout=90)
        if not (route and route.get("ok")):
            return {
                "ok": False,
                "error": "COPILOT_ROUTE_NOT_READY",
                "target": target["name"],
                "detail": route or output[-500:],
            }
    proxy = proxy_status()
    if not proxy.get("verified"):
        return {
            "ok": False,
            "error": "PROXY_NOT_VERIFIED",
            "target": target["name"],
            "proxy": proxy,
        }
    containment = containment_status()
    if not containment.get("installed"):
        return {
            "ok": False,
            "error": containment.get("error") or "BROWSER_CONTAINMENT_NOT_INSTALLED",
            "target": target["name"],
            "containment": containment,
        }
    return {
        "ok": True,
        "target": target["name"],
        "foreign": True,
        "browser": FIREFOX,
        "profile": configured["profile"],
        "url": target["url"],
        "proxy": {
            "verified": proxy.get("verified"),
            "loc": proxy.get("purity", {}).get("loc"),
            "country": proxy.get("purity", {}).get("country"),
            "clean": proxy.get("purity", {}).get("clean"),
        },
        "containment": {
            "installed": containment.get("installed"),
            "ruleCount": containment.get("ruleCount"),
            "group": containment.get("group"),
        },
    }


def windows():
    code, output, data = run([sys.executable, COMPUTER, "windows"], timeout=30)
    return (data or {}).get("windows") or []


def find_window(target):
    needle = target["title"].lower()
    for window in windows():
        title = str(window.get("title") or "").lower()
        if needle in title and "firefox" in title:
            return window
    return None


def launch(value):
    target = TARGETS.get(target_of(value) or "")
    if not target:
        return {"ok": False, "error": "unsupported browser target", "target": value}
    ready = guard(value)
    if not ready.get("ok"):
        return ready
    existing = find_window(target)
    if existing:
        run([sys.executable, COMPUTER, "activate", existing.get("title") or target["title"]], timeout=20)
        return {**ready, "ok": True, "reused": True, "window": existing}
    profile = os.path.join(PROFILE_ROOT, target["profile"])
    env = os.environ.copy()
    env["MOZ_CRASHREPORTER_DISABLE"] = "1"
    env["MOZ_DISABLE_AUTO_SAFE_MODE"] = "1"
    try:
        process = subprocess.Popen(
            [FIREFOX, "-no-remote", "-profile", profile, "-new-window", target["url"]],
            cwd=os.path.dirname(FIREFOX),
            env=env,
        )
    except Exception as error:
        return {"ok": False, "error": "BROWSER_LAUNCH_FAILED", "detail": str(error)}
    deadline = time.time() + 20
    window = None
    while time.time() < deadline:
        time.sleep(0.5)
        window = find_window(target)
        if window:
            break
    return {
        **ready,
        "ok": bool(window),
        "pid": process.pid,
        "window": window,
        "reused": False,
        "error": None if window else "BROWSER_WINDOW_NOT_FOUND",
    }


def main():
    command = (sys.argv[1] if len(sys.argv) > 1 else "status").lower()
    value = sys.argv[2] if len(sys.argv) > 2 else ""
    if command == "status":
        targets = {}
        for key, target in TARGETS.items():
            targets[key] = {
                "target": target["name"],
                "url": target["url"],
                "profile": os.path.join(PROFILE_ROOT, target["profile"]),
                "configured": os.path.isfile(os.path.join(PROFILE_ROOT, target["profile"], "user.js")),
            }
        print(json.dumps({
            "ok": os.path.isfile(FIREFOX),
            "browser": FIREFOX,
            "targets": targets,
            "containment": containment_status(),
        }, ensure_ascii=False))
        return 0
    if command == "configure":
        target = TARGETS.get(target_of(value) or "")
        if not target:
            print(json.dumps({"ok": False, "error": "unsupported target"}))
            return 1
        print(json.dumps(configure(target), ensure_ascii=False))
        return 0
    if command == "guard":
        result = guard(value)
        print(json.dumps(result, ensure_ascii=False))
        return 0 if result.get("ok") else 1
    if command == "launch":
        result = launch(value)
        print(json.dumps(result, ensure_ascii=False))
        return 0 if result.get("ok") else 1
    print(json.dumps({"ok": False, "error": f"unknown command: {command}"}))
    return 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        raise SystemExit(1)
