#!/usr/bin/env python3
"""Local-only HTTP service for fast UIA reads/clicks.

The service keeps the Python process alive so repeated course reads do not pay
interpreter/import startup. It binds loopback only and requires a random token.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import uia_fast  # noqa: E402


class Handler(BaseHTTPRequestHandler):
    server_version = "DSH-UIA/1"
    token = ""

    def log_message(self, *args):
        return

    def _send(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _authorized(self):
        return bool(self.token) and self.headers.get("X-DSH-UIA-Token") == self.token

    def do_GET(self):
        self.server.last_request = time.time()
        if self.path == "/health":
            self._send(200, {"ok": True, "service": "uia", "version": 1})
            return
        self._send(404, {"ok": False, "error": "not found"})

    def do_POST(self):
        self.server.last_request = time.time()
        if not self._authorized():
            self._send(403, {"ok": False, "error": "forbidden"})
            return
        try:
            length = min(64_000, max(0, int(self.headers.get("Content-Length") or 0)))
            payload = json.loads(self.rfile.read(length) or b"{}")
        except Exception as error:
            self._send(400, {"ok": False, "error": str(error)})
            return
        try:
            if self.path == "/read":
                result = uia_fast.read_text(int(payload.get("limit") or 20000))
            elif self.path == "/click":
                result = uia_fast.click(
                    str(payload.get("name") or ""),
                    str(payload.get("role") or ""),
                    bool(payload.get("exact", True)),
                )
            else:
                self._send(404, {"ok": False, "error": "not found"})
                return
            self._send(200, result)
        except Exception as error:
            self._send(500, {"ok": False, "error": str(error)})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--token", required=True)
    parser.add_argument("--idle", type=int, default=300)
    args = parser.parse_args()
    Handler.token = args.token
    server = HTTPServer(("127.0.0.1", args.port), Handler)
    server.timeout = 1
    server.last_request = time.time()
    while time.time() - server.last_request < args.idle:
        server.handle_request()
    server.server_close()


if __name__ == "__main__":
    raise SystemExit(main())
