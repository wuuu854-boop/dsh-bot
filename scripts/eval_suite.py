#!/usr/bin/env python3
"""Run a small real-task regression suite against the local DSH Bot API.

Usage:
  python scripts/eval_suite.py
  python scripts/eval_suite.py --base http://127.0.0.1:60183/dsh-bot/api

The suite creates one temporary task per case, waits for the real agent turn,
checks the answer/evidence/file, then deletes the task. It exits non-zero if
any case fails.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_BASE = os.environ.get("DSH_BOT_API", "http://127.0.0.1:60183/dsh-bot/api")
PROBE_FILE = os.path.join(tempfile.gettempdir(), "dsh-bot-eval-probe.txt")
CASES = [
    {
        "name": "echo",
        "prompt": "用 pwsh 执行 echo DSH_EVAL_OK，然后只回复 DSH_EVAL_OK。验收：包含 DSH_EVAL_OK",
        "expect": "DSH_EVAL_OK",
    },
    {
        "name": "calc",
        "prompt": "用 pwsh 计算 17*23，然后只回复数字结果。验收：包含 391",
        "expect": "391",
    },
    {
        "name": "file_roundtrip",
        "prompt": (
            f"把字符串 EVAL_FILE_OK 写入 {PROBE_FILE}，再读回来，然后只回复 EVAL_FILE_OK。"
            f"验收：文件 {PROBE_FILE}\n验收：包含 EVAL_FILE_OK"
        ),
        "expect": "EVAL_FILE_OK",
        "file": PROBE_FILE,
    },
    {
        "name": "no_tool",
        "prompt": "不要调用任何工具，只回复 READY。验收：包含 READY",
        "expect": "READY",
        "max_tools": 0,
    },
]


def request(base: str, path: str, body=None, timeout=90):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        base + path,
        data=data,
        method="POST" if data is not None else "GET",
        headers={"x-dsh-bot-client": "1", "content-type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def run_case(base: str, case: dict, timeout_seconds: int = 150) -> dict:
    created = request(base, "/new", {})
    thread_id = created["thread"]["id"]
    started = time.time()
    result = {"name": case["name"], "passed": False, "threadId": thread_id, "detail": ""}
    try:
        request(base, "/send", {"threadId": thread_id, "text": case["prompt"]})
        state = None
        deadline = time.time() + timeout_seconds
        while time.time() < deadline:
            time.sleep(2)
            state = request(base, f"/state?thread={urllib.parse.quote(thread_id)}")
            if not state["thread"].get("running"):
                break
        if state is None:
            result["detail"] = "no state"
            return result
        texts = []
        tool_results = []
        tools = 0
        for item in state.get("items") or []:
            if item.get("kind") == "assistant":
                texts.append(item.get("text") or "")
            elif item.get("kind") == "activity":
                tools += 1
                if item.get("result"):
                    tool_results.append(item.get("result") or "")
        haystack = "\n".join(texts + tool_results)
        expected = case["expect"]
        passed = expected in haystack
        text_match = expected in "\n".join(texts)
        tool_match = expected in "\n".join(tool_results)
        detail = [
            f"expect={expected}",
            f"text={'YES' if text_match else 'NO'}",
            f"tool_evidence={'YES' if tool_match else 'NO'}",
            f"tools={tools}",
            f"elapsed={round(time.time() - started, 1)}s",
        ]
        if "file" in case:
            file_ok = os.path.isfile(case["file"])
            passed = passed and file_ok
            detail.append(f"file={'YES' if file_ok else 'NO'}")
        if "max_tools" in case:
            passed = passed and tools <= case["max_tools"]
            detail.append(f"max_tools={case['max_tools']}")
        result["passed"] = bool(passed)
        result["detail"] = "; ".join(detail)
        result["tools"] = tools
        return result
    finally:
        try:
            request(base, "/stop", {"threadId": thread_id}, timeout=20)
        except Exception:
            pass
        try:
            request(base, "/delete", {"threadId": thread_id}, timeout=20)
        except Exception:
            pass


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default=DEFAULT_BASE)
    parser.add_argument("--timeout", type=int, default=150)
    args = parser.parse_args()
    if os.path.isfile(PROBE_FILE):
        os.remove(PROBE_FILE)
    results = []
    for case in CASES:
        print(f"[eval] {case['name']} ...", flush=True)
        result = run_case(args.base, case, args.timeout)
        results.append(result)
        print(f"[eval] {case['name']}: {'PASS' if result['passed'] else 'FAIL'} {result['detail']}", flush=True)
    passed = sum(1 for item in results if item["passed"])
    print(json.dumps({"passed": passed, "total": len(results), "results": results}, ensure_ascii=False, indent=2))
    if os.path.isfile(PROBE_FILE):
        os.remove(PROBE_FILE)
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
