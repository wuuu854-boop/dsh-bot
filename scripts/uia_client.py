#!/usr/bin/env python3
"""Client for the local fast UIA service.

Starts one background process on demand, reuses it across course invocations,
and falls back to the direct Python UIA path when the service cannot start.
"""

from __future__ import annotations

import json
import os
import secrets
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SERVICE = os.path.join(HERE, "uia_service.py")
STATE_DIR = os.path.join(
    os.environ.get("DSH_HOME", os.path.join(os.path.expanduser("~"), ".dsh")),
    "storages",
    "dsh-bot",
)
CONFIG = os.path.join(STATE_DIR, "uia-service.json")
VERSION = 1


def _free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _read_config():
    try:
        with open(CONFIG, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        if data.get("version") == VERSION and data.get("port") and data.get("token"):
            return data
    except Exception:
        pass
    return None


def _health(config):
    try:
        request = urllib.request.Request(
            f"http://127.0.0.1:{config['port']}/health",
            headers={"X-DSH-UIA-Token": config["token"]},
        )
        with urllib.request.urlopen(request, timeout=0.6) as response:
            return response.status == 200
    except Exception:
        return False


def _request(config, path, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        f"http://127.0.0.1:{config['port']}{path}",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "X-DSH-UIA-Token": config["token"],
        },
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def _start():
    os.makedirs(STATE_DIR, exist_ok=True)
    config = {"version": VERSION, "port": _free_port(), "token": secrets.token_hex(16), "pid": 0}
    flags = 0
    if os.name == "nt":
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    env = dict(os.environ)
    env["DSH_HOME"] = os.environ.get("DSH_HOME", os.path.join(os.path.expanduser("~"), ".dsh"))
    process = subprocess.Popen(
        [sys.executable, SERVICE, "--port", str(config["port"]), "--token", config["token"]],
        cwd=HERE,
        env=env,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=flags,
        close_fds=True,
    )
    config["pid"] = process.pid
    temp = CONFIG + ".tmp"
    with open(temp, "w", encoding="utf-8") as handle:
        json.dump(config, handle)
    os.replace(temp, CONFIG)
    deadline = time.time() + 8
    while time.time() < deadline:
        if _health(config):
            return config
        if process.poll() is not None:
            break
        time.sleep(0.08)
    try:
        process.terminate()
    except Exception:
        pass
    raise RuntimeError("UIA 快路径服务启动失败")


def ensure():
    config = _read_config()
    if config and _health(config):
        return config
    return _start()


def read_text(limit=20000):
    return _request(ensure(), "/read", {"limit": limit})


def click(name, role="", exact=True):
    return _request(ensure(), "/click", {"name": name, "role": role, "exact": exact})
