#!/usr/bin/env python3
"""Clash system-proxy guard for DSH Bot.

Foreign AI apps must run with Clash running and the Windows *system proxy*
enabled (not only TUN / browser proxy). This helper checks that state, starts
Clash when needed, and writes the per-user WinINet proxy settings.

Commands:
  status
  clash
  ensure
  off
"""

from __future__ import annotations

import ctypes
import json
import os
import re
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import winreg

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

INTERNET_SETTINGS = r"Software\Microsoft\Windows\CurrentVersion\Internet Settings"
DEFAULT_OVERRIDE = "localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*;<local>"
CANDIDATE_PORTS = [7890, 7897, 7891, 1080]
CLASH_CONFIG_PATHS = [
    os.path.join(os.environ.get("USERPROFILE", ""), r".config\clash\config.yaml"),
    os.path.join(os.environ.get("USERPROFILE", ""), r".config\clash\config.yml"),
    os.path.join(os.environ.get("APPDATA", ""), r"Clash for Windows\config.yaml"),
    os.path.join(os.environ.get("APPDATA", ""), r"clash\config.yaml"),
]
CLASH_CORE_CANDIDATES = [
    r"C:\Clash for Windows\resources\static\files\win\x64\clash-win64.exe",
]
CLASH_DIR = os.path.join(os.environ.get("USERPROFILE", ""), r".config\clash")
CHINESE_COUNTRIES = {"CN", "HK", "MO", "TW"}
CHINESE_ORG_HINTS = (
    "china", "chinatelecom", "chinaunicom", "chinamobile", "alibaba", "aliyun",
    "tencent", "baidu", "huawei", "jd.com", "ucloud", "kingsoft", "netease",
    "sina", "sohu", "cernet", "cnnic", "chinanet", "cncgroup",
)
PROXY_GROUP_HINTS = ("手动切换", "手动", "proxy", "select")


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def fail(message):
    emit({"ok": False, "error": str(message)}, 1)


def read_settings():
    result = {"ProxyEnable": 0, "ProxyServer": "", "ProxyOverride": DEFAULT_OVERRIDE, "AutoConfigURL": ""}
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, INTERNET_SETTINGS, 0, winreg.KEY_READ) as key:
            for name in list(result):
                try:
                    value, _kind = winreg.QueryValueEx(key, name)
                    result[name] = value
                except FileNotFoundError:
                    pass
    except OSError:
        pass
    result["ProxyEnable"] = int(result.get("ProxyEnable") or 0)
    result["ProxyServer"] = str(result.get("ProxyServer") or "")
    result["ProxyOverride"] = str(result.get("ProxyOverride") or DEFAULT_OVERRIDE)
    result["AutoConfigURL"] = str(result.get("AutoConfigURL") or "")
    return result


def port_open(port):
    try:
        with socket.create_connection(("127.0.0.1", int(port)), timeout=0.35):
            return True
    except OSError:
        return False


CLASH_HINTS = ("clash", "mihomo", "verge")


def _clash_by_tasklist():
    completed = subprocess.run(
        ["tasklist", "/FO", "CSV", "/NH"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        timeout=10,
    )
    output = (completed.stdout or "").lower()
    if not output.strip():
        return None
    return any(hint in output for hint in CLASH_HINTS)


def _clash_by_snapshot():
    """Fallback for sandboxes where tasklist cannot enumerate processes."""
    import ctypes
    import ctypes.wintypes as wt

    class ProcessEntry32(ctypes.Structure):
        _fields_ = [
            ("dwSize", wt.DWORD),
            ("cntUsage", wt.DWORD),
            ("th32ProcessID", wt.DWORD),
            ("th32DefaultHeapID", ctypes.POINTER(ctypes.c_ulong)),
            ("th32ModuleID", wt.DWORD),
            ("cntThreads", wt.DWORD),
            ("th32ParentProcessID", wt.DWORD),
            ("pcPriClassBase", ctypes.c_long),
            ("dwFlags", wt.DWORD),
            ("szExeFile", ctypes.c_char * 260),
        ]

    kernel32 = ctypes.windll.kernel32
    snapshot = kernel32.CreateToolhelp32Snapshot(0x2, 0)  # TH32CS_SNAPPROCESS
    if snapshot == -1:
        return False
    try:
        entry = ProcessEntry32()
        entry.dwSize = ctypes.sizeof(ProcessEntry32)
        ok = kernel32.Process32First(snapshot, ctypes.byref(entry))
        while ok:
            name = entry.szExeFile.decode("mbcs", "ignore").lower()
            if any(hint in name for hint in CLASH_HINTS):
                return True
            ok = kernel32.Process32Next(snapshot, ctypes.byref(entry))
        return False
    finally:
        kernel32.CloseHandle(snapshot)


def clash_running():
    try:
        found = _clash_by_tasklist()
        if found is not None:
            return found
    except Exception:
        pass
    try:
        return bool(_clash_by_snapshot())
    except Exception:
        return False


def proxy_port(settings):
    server = settings.get("ProxyServer", "")
    if ":" in server:
        candidate = server.rsplit(":", 1)[1].strip()
        if candidate.isdigit() and port_open(int(candidate)):
            return int(candidate)
    for port in CANDIDATE_PORTS:
        if port_open(port):
            return port
    return int(CANDIDATE_PORTS[0])


def refresh_wininet():
    try:
        wininet = ctypes.windll.wininet
        wininet.InternetSetOptionW(None, 39, None, 0)  # SETTINGS_CHANGED
        wininet.InternetSetOptionW(None, 37, None, 0)  # REFRESH
    except Exception:
        pass


def set_proxy(enable=True, port=7890):
    """Write the WinINet system proxy, skipping the write when already correct."""
    current = read_settings()
    desired_server = f"127.0.0.1:{int(port)}"
    if enable:
        already = (
            current["ProxyEnable"] == 1
            and current["ProxyServer"] == desired_server
            and not current["AutoConfigURL"]
        )
    else:
        already = current["ProxyEnable"] == 0
    if already:
        refresh_wininet()
        return {"written": False, "ProxyServer": current["ProxyServer"], "ProxyEnable": current["ProxyEnable"]}
    try:
        with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, INTERNET_SETTINGS, 0, winreg.KEY_SET_VALUE) as key:
            winreg.SetValueEx(key, "ProxyEnable", 0, winreg.REG_DWORD, 1 if enable else 0)
            if enable:
                winreg.SetValueEx(key, "ProxyServer", 0, winreg.REG_SZ, desired_server)
                winreg.SetValueEx(key, "ProxyOverride", 0, winreg.REG_SZ, DEFAULT_OVERRIDE)
                try:
                    winreg.DeleteValue(key, "AutoConfigURL")
                except FileNotFoundError:
                    pass
    except PermissionError as error:
        raise RuntimeError(
            f"系统代理写入被拒绝({error}); 需要提权/关闭文件沙箱后重试"
        ) from error
    refresh_wininet()
    return {"written": True, "ProxyServer": desired_server, "ProxyEnable": 1 if enable else 0}


def launch_clash():
    try:
        import apps
    except Exception:
        apps = None
    if apps is not None:
        for query in ("Clash for Windows", "Clash"):
            try:
                matches = apps.find(query)
            except Exception:
                matches = []
            if not matches:
                continue
            try:
                result = apps.launch(query)
            except Exception:
                result = None
            if result and result.get("ok"):
                return result
    start_clash_core()
    return {"ok": True, "kind": "core"}


def start_clash_core():
    core = next((path for path in CLASH_CORE_CANDIDATES if os.path.isfile(path)), None)
    if not core:
        raise RuntimeError("Clash core executable not found")
    profile_dir = os.path.join(CLASH_DIR, "profiles")
    profiles = []
    if os.path.isdir(profile_dir):
        for name in os.listdir(profile_dir):
            path = os.path.join(profile_dir, name)
            if name.lower().endswith((".yml", ".yaml")) and os.path.isfile(path):
                try:
                    if os.path.getsize(path) > 10_000:
                        profiles.append(path)
                except OSError:
                    pass
    if not profiles:
        raise RuntimeError("no usable Clash profile found")
    profiles.sort(key=os.path.getmtime, reverse=True)
    creation = 0x08000000 if sys.platform == "win32" else 0
    subprocess.Popen(
        [core, "-f", profiles[0], "-d", CLASH_DIR],
        cwd=os.path.dirname(core),
        creationflags=creation,
        close_fds=True,
    )
    for _ in range(24):
        time.sleep(0.5)
        if port_open(proxy_port(read_settings())):
            return profiles[0]
    raise RuntimeError("Clash core started but port 7890 did not open")


def status():
    settings = read_settings()
    running = clash_running()
    port = proxy_port(settings)
    return {
        "ok": True,
        "systemProxy": settings["ProxyEnable"] == 1,
        "ProxyEnable": settings["ProxyEnable"],
        "ProxyServer": settings["ProxyServer"],
        "AutoConfigURL": settings["AutoConfigURL"],
        "clashRunning": running,
        "port": port,
        "portOpen": port_open(port),
    }


def _opener(port=None):
    if port:
        proxy = f"http://127.0.0.1:{int(port)}"
        return urllib.request.build_opener(urllib.request.ProxyHandler({"http": proxy, "https": proxy}))
    return urllib.request.build_opener(urllib.request.ProxyHandler({}))


def _fetch(opener, url, timeout=8, limit=8192):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DSH-Bot/2.0"})
    with opener.open(request, timeout=timeout) as response:
        body = response.read(limit).decode("utf-8", "replace")
        return response.status, body


def _trace(opener):
    status, body = _fetch(opener, "https://chatgpt.com/cdn-cgi/trace", 8)
    values = {}
    for line in body.splitlines():
        if "=" in line:
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    if status != 200 or not values.get("loc"):
        raise RuntimeError(f"chatgpt trace returned {status}")
    return {"ip": values.get("ip", ""), "loc": values.get("loc", ""), "colo": values.get("colo", "")}


def _ipapi(opener):
    status, body = _fetch(opener, "https://ipapi.co/json/", 8)
    data = json.loads(body)
    if status != 200 or not data.get("ip"):
        raise RuntimeError(f"ipapi returned {status}")
    return {"ip": data.get("ip", ""), "country": data.get("country_code") or data.get("country") or ""}


def _direct_ip():
    try:
        status, body = _fetch(_opener(None), "https://api.ipify.org?format=json", 5)
        data = json.loads(body)
        return data.get("ip") if status == 200 else None
    except Exception:
        return None


def clash_controller():
    candidates = []
    secret = ""
    for path in CLASH_CONFIG_PATHS:
        if not path or not os.path.isfile(path):
            continue
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as handle:
                text = handle.read()
        except OSError:
            continue
        match = re.search(r"^external-controller:\s*[\"']?([^\s\"']+)", text, re.M)
        secret_match = re.search(r"^secret:\s*[\"']?([^\s\"']*)", text, re.M)
        secret = secret_match.group(1) if secret_match else ""
        if match:
            host_port = match.group(1)
            if host_port.startswith("0.0.0.0:"):
                host_port = "127.0.0.1:" + host_port.split(":", 1)[1]
            candidates.append((f"http://{host_port}", secret))
    candidates.extend([
        ("http://127.0.0.1:9090", ""),
        ("http://127.0.0.1:51404", secret),
    ])
    seen = set()
    for base, token in candidates:
        if base in seen:
            continue
        seen.add(base)
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            request = urllib.request.Request(base + "/version", headers=headers)
            with urllib.request.urlopen(request, timeout=2) as response:
                if response.status == 200:
                    return {"base": base, "secret": token}
        except Exception:
            continue
    return None


def clash_api(path, method="GET", payload=None):
    controller = clash_controller()
    if not controller:
        return None
    headers = {"Content-Type": "application/json"}
    if controller.get("secret"):
        headers["Authorization"] = f"Bearer {controller['secret']}"
    data = json.dumps(payload).encode() if payload is not None else None
    request = urllib.request.Request(controller["base"] + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=6) as response:
        body = response.read().decode("utf-8", "replace")
    return json.loads(body) if body.strip() else {}


def clash_selector():
    try:
        payload = clash_api("/proxies") or {}
    except Exception:
        return None, None, None
    proxies = payload.get("proxies") or {}
    selectors = [
        (name, value)
        for name, value in proxies.items()
        if isinstance(value, dict) and value.get("type") in ("Selector", "Fallback", "LoadBalance")
    ]
    if not selectors:
        return None, None, proxies
    for name, value in selectors:
        lower = name.lower()
        if any(hint in lower for hint in PROXY_GROUP_HINTS):
            return name, value, proxies
    return selectors[0][0], selectors[0][1], proxies


def is_chinese_org(org):
    lower = str(org or "").lower()
    return any(hint in lower for hint in CHINESE_ORG_HINTS)


def _ipinfo(opener):
    status, body = _fetch(opener, "https://ipinfo.io/json", 8)
    data = json.loads(body)
    if status != 200 or not data.get("ip"):
        raise RuntimeError(f"ipinfo returned {status}")
    return {
        "ip": data.get("ip", ""),
        "country": data.get("country", ""),
        "org": data.get("org", ""),
        "hostname": data.get("hostname", ""),
    }


def _row_verdict(html, label):
    match = re.search(re.escape(label) + r"</th>\s*<td[^>]*>(.*?)</td>", html, re.S | re.I)
    if not match:
        return None
    cell = match.group(1).lower()
    if ">yes<" in cell:
        return True
    if ">no<" in cell:
        return False
    return None


def _scamalytics(ip, port=None):
    if not ip or ":" in ip:
        return None
    try:
        opener = _opener(port or proxy_port(read_settings()))
        status, body = _fetch(opener, f"https://scamalytics.com/ip/{urllib.parse.quote(ip)}", 10, 80000)
        if status != 200:
            return None
        score_match = re.search(r"Fraud Score:\s*(\d+)", body, re.I)
        risk_match = re.search(r'panel_title[^>]*>\s*([^<]+?)\s*</div>', body, re.I)
        blacklisted = any(
            _row_verdict(body, label) is True
            for label in ("Firehol", "Spamhaus", "IPsum", "IP2ProxyLite", "X4Bnet Spambot")
        )
        return {
            "fraudScore": int(score_match.group(1)) if score_match else None,
            "risk": (risk_match.group(1).strip() if risk_match else None),
            "server": _row_verdict(body, "Server"),
            "residentialProxy": _row_verdict(body, "Residential Proxy"),
            "vpn": _row_verdict(body, "Anonymizing VPN"),
            "tor": _row_verdict(body, "Tor Exit Node"),
            "publicProxy": _row_verdict(body, "Public Proxy"),
            "blacklisted": blacklisted,
        }
    except Exception:
        return None


def _purity(country, loc, org, hostname, scam):
    require_residential = os.environ.get("DSH_PROXY_REQUIRE_RESIDENTIAL") == "1"
    country = str(country or "").upper()
    loc = str(loc or "").upper()
    chinese_country = country in CHINESE_COUNTRIES or loc in CHINESE_COUNTRIES
    chinese_org = is_chinese_org(org) or is_chinese_org(hostname)
    result = {
        "country": country,
        "loc": loc,
        "org": org,
        "hostname": hostname,
        "chineseCountry": chinese_country,
        "chineseOrg": chinese_org,
        "scamalytics": scam,
        "residential": bool(scam and scam.get("residentialProxy") is True),
        "server": bool(scam and scam.get("server") is True),
        "fraudScore": scam.get("fraudScore") if scam else None,
        "blacklisted": bool(scam and scam.get("blacklisted")),
        "vpn": bool(scam and scam.get("vpn")),
        "tor": bool(scam and scam.get("tor")),
        "publicProxy": bool(scam and scam.get("publicProxy")),
    }
    clean = (
        not result["chineseCountry"]
        and not result["chineseOrg"]
        and not result["blacklisted"]
        and not result["vpn"]
        and not result["tor"]
        and not result["publicProxy"]
        and (result["fraudScore"] is None or result["fraudScore"] <= 40)
        and country not in ("", "CN", "HK", "MO", "TW")
        and loc not in ("", "CN", "HK", "MO", "TW")
    )
    if require_residential:
        clean = clean and result["residential"] and not result["server"]
    result["requireResidential"] = require_residential
    result["clean"] = clean
    return result


def repair():
    """Try a few non-Chinese AI nodes, then verify; restore the original on failure."""
    group, selector, proxies = clash_selector()
    if not group or not isinstance(selector, dict):
        return {"ok": False, "error": "Clash controller selector unavailable"}
    names = [str(name) for name in (selector.get("all") or [])]
    original = selector.get("now")
    candidates = []
    for name in names:
        upper = name.upper()
        if upper in ("DIRECT", "REJECT"):
            continue
        if any(flag in name for flag in ("🇨🇳", "🇭🇰", "🇹🇼", "🇲🇴")):
            continue
        if any(hint in name for hint in ("联通", "移动", "电信", "回国", "中国")):
            continue
        if not any(flag in name for flag in ("🇺🇸", "🇯🇵", "🇸🇬", "🇬🇧", "🇩🇪", "🇫🇷", "🇨🇦", "🇦🇺")):
            continue
        if "AI" not in upper and "高端" not in name and "下载" not in name:
            continue
        candidates.append(name)
    if not candidates:
        return {"ok": False, "error": "no non-Chinese AI candidate node found", "group": group}

    attempts = []
    try:
        for candidate in candidates[:4]:
            try:
                clash_api(f"/proxies/{urllib.parse.quote(group)}", "PUT", {"name": candidate})
                time.sleep(0.8)
                checked = verify()
                attempts.append({"node": candidate, "verified": checked.get("verified"), "error": checked.get("error")})
                if checked.get("verified"):
                    return {
                        "ok": True,
                        "group": group,
                        "original": original,
                        "switchedTo": candidate,
                        "attempts": attempts,
                    }
            except Exception as error:
                attempts.append({"node": candidate, "error": str(error)})
    finally:
        if original and not any(attempt.get("verified") for attempt in attempts):
            try:
                clash_api(f"/proxies/{urllib.parse.quote(group)}", "PUT", {"name": original})
            except Exception:
                pass
    return {"ok": False, "error": "all candidate nodes failed verification", "group": group, "original": original, "attempts": attempts}


def verify():
    settings = read_settings()
    port = proxy_port(settings)
    if os.environ.get("DSH_PROXY_FORCE_FAIL") == "1":
        return {
            "ok": False,
            "systemProxy": settings["ProxyEnable"] == 1,
            "ProxyEnable": settings["ProxyEnable"],
            "ProxyServer": settings["ProxyServer"],
            "clashRunning": clash_running(),
            "port": port,
            "portOpen": port_open(port),
            "verified": False,
            "chatgpt": None,
            "ipapi": None,
            "directIp": None,
            "error": "forced verification failure (DSH_PROXY_FORCE_FAIL=1)",
        }
    result = {
        "ok": True,
        "systemProxy": settings["ProxyEnable"] == 1,
        "ProxyEnable": settings["ProxyEnable"],
        "ProxyServer": settings["ProxyServer"],
        "clashRunning": clash_running(),
        "port": port,
        "portOpen": port_open(port),
        "verified": False,
        "chatgpt": None,
        "chatgptSamples": [],
        "ipapi": None,
        "ipinfo": None,
        "directIp": None,
        "purity": None,
        "error": None,
    }
    if not result["systemProxy"]:
        result.update({"ok": False, "error": "Windows 系统代理未开启"})
        return result
    if not result["portOpen"]:
        result.update({"ok": False, "error": f"代理端口 {port} 不可连接"})
        return result
    if not result["clashRunning"]:
        result.update({"ok": False, "error": "未检测到 Clash 进程"})
        return result
    proxy_opener = _opener(port)
    errors = []
    samples = []
    for index in range(3):
        try:
            samples.append(_trace(proxy_opener))
        except Exception as error:
            errors.append(f"chatgpt sample {index + 1}: {error}")
        time.sleep(0.25)
    result["chatgptSamples"] = samples
    result["chatgpt"] = samples[0] if samples else None
    try:
        result["ipapi"] = _ipapi(proxy_opener)
    except Exception as error:
        errors.append(f"ipapi: {error}")
    try:
        result["ipinfo"] = _ipinfo(proxy_opener)
    except Exception as error:
        errors.append(f"ipinfo: {error}")
    result["directIp"] = _direct_ip()
    chatgpt = result["chatgpt"] or {}
    ipapi = result["ipapi"] or {}
    ipinfo = result["ipinfo"] or {}
    loc = str(chatgpt.get("loc") or "").upper()
    country = str(ipapi.get("country") or ipinfo.get("country") or "").upper()
    org = str(ipapi.get("org") or ipinfo.get("org") or "")
    hostname = str(ipinfo.get("hostname") or "")
    scam = _scamalytics(ipapi.get("ip") or ipinfo.get("ip"), port)
    purity = _purity(country, loc, org, hostname, scam)
    result["purity"] = purity
    stable = len(samples) == 3 and all(
        sample.get("ip") == chatgpt.get("ip") and sample.get("loc") == chatgpt.get("loc")
        for sample in samples[1:]
    )
    checks = {
        "chatgptForeign": loc not in ("", "CN", "HK", "MO", "TW"),
        "ipapiForeign": country not in ("", "CN", "HK", "MO", "TW"),
        "notDirectEcho": not (result["directIp"] and chatgpt.get("ip") and result["directIp"] == chatgpt.get("ip")),
        "stableEgress": stable,
        "clean": purity.get("clean") is True,
    }
    result["checks"] = checks
    if all(checks.values()):
        result["verified"] = True
    else:
        result["ok"] = False
        if not purity.get("clean"):
            result["error"] = "出口 IP 不够干净（CN/黑名单/VPN/proxy/欺诈分过高）"
        else:
            result["error"] = "; ".join(errors) or "代理出口不是国外，或 ChatGPT 实际未走代理"
    return result


def ensure():
    before = status()
    if not before["clashRunning"]:
        launch_clash()
        for _ in range(30):
            time.sleep(0.5)
            if clash_running():
                break
    settings = read_settings()
    port = proxy_port(settings)
    if not port_open(port):
        try:
            launch_clash()
        except Exception:
            pass
        for _ in range(20):
            time.sleep(0.5)
            if port_open(port):
                break
        if not port_open(port):
            try:
                start_clash_core()
            except Exception:
                pass
        port = proxy_port(read_settings())
    set_proxy(True, port)
    time.sleep(0.4)
    last = None
    for _ in range(4):
        last = verify()
        if last.get("verified"):
            break
        time.sleep(1.5)
    repair_result = None
    if not (last or {}).get("verified"):
        repair_result = repair()
        if repair_result.get("ok"):
            last = verify()
        else:
            last = {**(last or {}), "ok": False, "verified": False, "error": repair_result.get("error")}
    result = {**status(), **(last or {})}
    if repair_result is not None:
        result["repair"] = repair_result
    result["launched"] = None if before["clashRunning"] else "clash"
    result["before"] = {
        "systemProxy": before["systemProxy"],
        "ProxyServer": before["ProxyServer"],
        "clashRunning": before["clashRunning"],
    }
    return result


def main():
    command = sys.argv[1].lower() if len(sys.argv) > 1 else "status"
    if command == "status":
        emit(status())
    if command == "clash":
        if clash_running():
            emit({"ok": True, "clashRunning": True, "launched": False})
        emit({"ok": True, "clashRunning": True, "launched": launch_clash()})
    if command == "verify":
        result = verify()
        emit(result, 0 if result.get("verified") else 1)
    if command == "ensure":
        result = ensure()
        emit(result, 0 if result.get("verified") else 1)
    if command == "repair":
        result = repair()
        emit(result, 0 if result.get("ok") else 1)
    if command == "off":
        settings = read_settings()
        set_proxy(False, proxy_port(settings))
        emit({"ok": True, **status()})
    fail(f"unknown command: {command}")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:
        fail(error)
