#!/usr/bin/env python3
"""Run one PowerShell command elevated (UAC) and return its output.

This is the explicit administrator escape hatch for bots whose privilege mode
is "admin". Normal pwsh stays unelevated; this helper starts an elevated
PowerShell process, writes stdout/stderr to a temp log, and returns a JSON
result. It does not bypass UAC if Windows is configured to prompt.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
import uuid

sys.stdout.reconfigure(encoding="utf-8")
AUDIT_DIR = os.path.join(os.environ.get("LOCALAPPDATA", tempfile.gettempdir()), "DSHBot")
AUDIT_LOG = os.path.join(AUDIT_DIR, "admin-audit.jsonl")


def audit(record):
    try:
        os.makedirs(AUDIT_DIR, exist_ok=True)
        with open(AUDIT_LOG, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--command", "-c", required=True, help="PowerShell command to run elevated")
    parser.add_argument("--cwd", default=os.getcwd())
    parser.add_argument("--timeout", type=int, default=600)
    args = parser.parse_args()

    work = os.path.join(tempfile.gettempdir(), f"dsh-admin-{uuid.uuid4().hex}")
    os.makedirs(work, exist_ok=True)
    log_path = os.path.join(work, "output.log")
    exit_path = os.path.join(work, "exit.txt")
    runner = os.path.join(work, "runner.ps1")
    cwd = args.cwd if os.path.isdir(args.cwd) else os.getcwd()

    script = f"""$ErrorActionPreference = 'Continue'
Set-Location -LiteralPath {json.dumps(cwd)}
& {{
{args.command}
}} *> {json.dumps(log_path)}
$code = if ($LASTEXITCODE -ne $null) {{ [int]$LASTEXITCODE }} else {{ 0 }}
Set-Content -LiteralPath {json.dumps(exit_path)} -Value $code -Encoding ASCII
"""
    with open(runner, "w", encoding="utf-8-sig", newline="\n") as handle:
        handle.write(script)

    record = {
        "time": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "cwd": cwd,
        "command": args.command[:8_000],
        "user": os.environ.get("USERNAME", ""),
    }
    try:
        started = time.time()
        process = subprocess.Popen(
            [
                "powershell.exe",
                "-NoLogo",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                (
                    "Start-Process -FilePath powershell.exe -Verb RunAs -Wait "
                    f"-ArgumentList @('-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',{json.dumps(runner)})"
                ),
            ],
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        try:
            stdout, stderr = process.communicate(timeout=args.timeout)
        except subprocess.TimeoutExpired:
            process.kill()
            stdout, stderr = process.communicate()
            record.update({"ok": False, "error": "timeout"})
            audit(record)
            print(json.dumps(record, ensure_ascii=False))
            return 124
        output = ""
        try:
            with open(log_path, "rb") as handle:
                raw = handle.read()
            if raw.startswith(b"\xff\xfe") or (len(raw) > 2 and raw[1:2] == b"\x00"):
                output = raw.decode("utf-16", errors="replace")
            elif raw.startswith(b"\xfe\xff"):
                output = raw.decode("utf-16-be", errors="replace")
            else:
                output = raw.decode("utf-8", errors="replace")
            output = output.lstrip("\ufeff")
        except OSError:
            output = ""
        exit_code = None
        try:
            with open(exit_path, "r", encoding="ascii", errors="replace") as handle:
                exit_code = int(handle.read().strip() or "0")
        except Exception:
            exit_code = process.returncode
        result = {
            "ok": True,
            "elevated": True,
            "exitCode": exit_code,
            "output": output[-200_000:],
            "stderr": (stderr or "")[-20_000:],
            "elapsed": round(time.time() - started, 2),
        }
        record.update({"ok": True, "exitCode": exit_code, "elapsed": result["elapsed"]})
        audit(record)
        print(json.dumps(result, ensure_ascii=False))
        return 0 if exit_code == 0 else 1
    except Exception as error:
        record.update({"ok": False, "error": str(error)})
        audit(record)
        print(json.dumps({"ok": False, "elevated": False, "error": str(error)}, ensure_ascii=False))
        return 1
    finally:
        try:
            import shutil

            shutil.rmtree(work, ignore_errors=True)
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
