#!/usr/bin/env python3
"""Local memory / thread full-text search for DSH Bot.

Searches only local text (memory Git repos + thread titles/messages), never
uploads anything. Chinese queries are plain substring matches, so no tokenizer
or embedding service is required.

Commands:
  stats
  search --query TEXT [--limit 10] [--scope all|memory|threads]
"""

from __future__ import annotations

import json
import os
import re
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def state_dir():
    candidates = []
    if os.environ.get("DSH_HOME"):
        candidates.append(os.path.join(os.environ["DSH_HOME"], "storages", "dsh-bot"))
    candidates.append(os.path.join(os.path.expanduser("~"), ".dsh-official-desktop", "storages", "dsh-bot"))
    candidates.append(os.path.join(os.path.expanduser("~"), ".dsh", "storages", "dsh-bot"))
    for path in candidates:
        if os.path.isdir(path):
            return path
    return candidates[0]


STATE = state_dir()
MEMORY_DIR = os.path.join(STATE, "memory")


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def flag(args, name, default=""):
    key = f"--{name}"
    for index, item in enumerate(args):
        if item == key and index + 1 < len(args):
            return args[index + 1]
    return default


def terms_of(query):
    text = str(query or "").strip()
    if not text:
        return []
    parts = [item for item in re.split(r"[\s,，;；]+", text) if item]
    return parts[:8]


def read_text(path, limit=2_000_000):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as handle:
            return handle.read(limit)
    except Exception:
        return ""


def memory_docs():
    docs = []
    if not os.path.isdir(MEMORY_DIR):
        return docs
    for root, dirs, files in os.walk(MEMORY_DIR):
        dirs[:] = [item for item in dirs if item not in (".git", "node_modules")]
        for name in files:
            if not name.lower().endswith((".md", ".txt")):
                continue
            path = os.path.join(root, name)
            text = read_text(path)
            if not text.strip():
                continue
            bot_dir = os.path.basename(os.path.dirname(path))
            docs.append({"source": "memory", "path": path, "title": f"{bot_dir}/{name}", "text": text})
    return docs


def thread_docs():
    docs = []
    path = os.path.join(STATE, "state.json")
    raw = read_text(path, 30_000_000)
    if not raw:
        return docs
    try:
        state = json.loads(raw)
    except Exception:
        return docs
    for thread in state.get("threads") or []:
        title = str(thread.get("title") or "")
        lines = [title]
        for message in (thread.get("messages") or [])[-200:]:
            content = message.get("content")
            if isinstance(content, str):
                lines.append(content)
            elif isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        lines.append(str(part.get("text") or ""))
        text = "\n".join(lines)
        if text.strip():
            docs.append(
                {
                    "source": "thread",
                    "path": path,
                    "title": title or thread.get("id") or "untitled",
                    "text": text,
                }
            )
    return docs


def snippets(text, terms, limit=3, radius=100):
    found = []
    lower = text.lower()
    for term in terms:
        needle = term.lower()
        start = 0
        while len(found) < limit:
            index = lower.find(needle, start)
            if index < 0:
                break
            left = max(0, index - radius)
            right = min(len(text), index + len(term) + radius)
            snippet = text[left:right].replace("\r", " ").replace("\n", " ").strip()
            line = text.count("\n", 0, index) + 1
            found.append({"line": line, "snippet": snippet, "term": term})
            start = index + len(term)
    return found


def search(query, limit=10, scope="all"):
    terms = terms_of(query)
    if not terms:
        return {"ok": False, "error": "query is empty"}
    docs = []
    if scope in ("all", "memory"):
        docs.extend(memory_docs())
    if scope in ("all", "threads"):
        docs.extend(thread_docs())
    results = []
    for doc in docs:
        text = doc["text"]
        hits = snippets(text, terms)
        if not hits:
            continue
        score = sum(text.lower().count(term.lower()) for term in terms)
        if len(terms) > 1 and not all(term.lower() in text.lower() for term in terms):
            score *= 0.5
        results.append(
            {
                "source": doc["source"],
                "title": doc["title"],
                "path": doc["path"],
                "score": score,
                "hits": hits,
            }
        )
    results.sort(key=lambda item: item["score"], reverse=True)
    return {
        "ok": True,
        "query": query,
        "terms": terms,
        "scope": scope,
        "documents": len(docs),
        "count": len(results[:limit]),
        "results": results[:limit],
    }


def stats():
    memories = memory_docs()
    threads = thread_docs()
    return {
        "ok": True,
        "state": STATE,
        "memoryFiles": len(memories),
        "memoryBytes": sum(len(item["text"].encode("utf-8", "replace")) for item in memories),
        "threads": len(threads),
        "threadBytes": sum(len(item["text"].encode("utf-8", "replace")) for item in threads),
        "note": "本地全文检索；不会上传记忆或会话。",
    }


def main():
    args = sys.argv[1:]
    if not args:
        emit({"ok": False, "error": "missing command; try stats/search"})
    command = args[0].lower()
    if command == "stats":
        emit(stats())
    if command == "search":
        query = flag(args, "query", "")
        limit = int(flag(args, "limit", "10") or 10)
        scope = flag(args, "scope", "all")
        emit(search(query, limit, scope))
    emit({"ok": False, "error": f"unknown command: {command}"})


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:
        emit({"ok": False, "error": str(error)}, 1)
