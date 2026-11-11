#!/usr/bin/env python3
"""Local OCR fallback for DSH Bot (Tesseract).

Use only when a page/app has no usable control tree: canvas, PDF, image quiz,
screenshot-only dialogs. Always try ui.py / edge.py read first.

Commands:
  langs
  image PATH [--lang eng+chi_sim] [--psm 6]
  window TITLE [PATH] [--lang ...]
  screen [PATH] [--lang ...]
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
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

CANDIDATES = [
    os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"), "Tesseract-OCR", "tesseract.exe"),
    os.path.join(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"), "Tesseract-OCR", "tesseract.exe"),
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "Tesseract-OCR", "tesseract.exe"),
]


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def flag(args, name, default=""):
    key = f"--{name}"
    for index, item in enumerate(args):
        if item == key and index + 1 < len(args):
            return args[index + 1]
    return default


def find_tesseract():
    located = shutil.which("tesseract")
    if located:
        return located
    for candidate in CANDIDATES:
        if candidate and os.path.isfile(candidate):
            return candidate
    return None


def languages(executable):
    completed = subprocess.run(
        [executable, "--list-langs"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=15,
    )
    found = []
    for line in (completed.stdout or "").splitlines():
        line = line.strip()
        if line and "List of available" not in line and not line.startswith("Error"):
            found.append(line)
    return found


def choose_language(executable, requested):
    available = languages(executable)
    wanted = [item.strip() for item in str(requested or "eng").split("+") if item.strip()]
    selected = [item for item in wanted if item in available]
    missing = [item for item in wanted if item not in available]
    if not selected:
        selected = ["eng"] if "eng" in available else available[:1]
    return selected, available, missing


def parse_tsv(raw):
    lines = []
    words = []
    current_key = None
    current_words = []
    for row in str(raw or "").splitlines():
        cells = row.split("\t")
        if len(cells) < 12 or cells[0].strip() == "level":
            continue
        try:
            level = int(cells[0])
        except Exception:
            continue
        if level != 5:
            continue
        text = cells[11].strip()
        if not text:
            continue
        try:
            conf = float(cells[10])
        except Exception:
            conf = 0.0
        if conf < 25:
            continue
        key = (cells[1], cells[2], cells[3], cells[4])
        if key != current_key:
            if current_words:
                lines.append(" ".join(current_words))
            current_words = []
            current_key = key
        current_words.append(text)
        try:
            words.append(
                {
                    "text": text,
                    "conf": round(conf, 1),
                    "x": int(cells[6]),
                    "y": int(cells[7]),
                    "w": int(cells[8]),
                    "h": int(cells[9]),
                }
            )
        except Exception:
            pass
    if current_words:
        lines.append(" ".join(current_words))
    text = "\n".join(line for line in lines if line.strip())
    return text, words


def ocr_image(path, lang="eng", psm=6):
    executable = find_tesseract()
    if not executable:
        return {"ok": False, "error": "Tesseract not installed", "hint": "Install Tesseract-OCR or set PATH."}
    if not os.path.isfile(path):
        return {"ok": False, "error": f"image not found: {path}"}
    selected, available, missing = choose_language(executable, lang)
    command = [
        executable,
        path,
        "stdout",
        "-l",
        "+".join(selected),
        "--psm",
        str(int(psm)),
        "tsv",
    ]
    started = time.time()
    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=90,
    )
    if completed.returncode != 0:
        return {"ok": False, "error": (completed.stderr or "tesseract failed").strip()[:600]}
    text, words = parse_tsv(completed.stdout)
    result = {
        "ok": True,
        "path": os.path.abspath(path),
        "image": {"width": None, "height": None},
        "langs": selected,
        "availableLangs": available,
        "text": text[:20000],
        "textLength": len(text),
        "words": words[:400],
        "ms": int((time.time() - started) * 1000),
    }
    if missing:
        result["missingLangs"] = missing
        result["warning"] = (
            f"缺少语言包 {', '.join(missing)}；已用 {'+'.join(selected)}。"
            "中文识别请安装 chi_sim.traineddata 到 Tesseract-OCR/tessdata。"
        )
    try:
        from PIL import Image

        with Image.open(path) as image:
            result["image"] = {"width": image.width, "height": image.height}
    except Exception:
        pass
    return result


def main():
    if len(sys.argv) < 2:
        emit({"ok": False, "error": "missing command; try langs/image/window/screen"})
    command = sys.argv[1].lower()
    args = sys.argv[2:]
    executable = find_tesseract()
    if command == "langs":
        emit({"ok": bool(executable), "path": executable, "langs": languages(executable) if executable else []})
    lang = flag(args, "lang", "eng")
    psm = int(flag(args, "psm", "6") or 6)
    if command == "image":
        if not args:
            emit({"ok": False, "error": "image requires PATH"})
        emit(ocr_image(args[0], lang, psm))
    if command == "window":
        if not args:
            emit({"ok": False, "error": "window requires TITLE"})
        path = args[1] if len(args) > 1 and not args[1].startswith("--") else os.path.join(tempfile.gettempdir(), f"dsh-ocr-window-{int(time.time())}.png")
        try:
            capture = computer.screenshot_window(args[0], path)
        except Exception as error:
            emit({"ok": False, "error": str(error)})
        result = ocr_image(capture["path"], lang, psm)
        result["screenshot"] = capture
        emit(result)
    if command == "screen":
        path = args[0] if args and not args[0].startswith("--") else os.path.join(tempfile.gettempdir(), f"dsh-ocr-screen-{int(time.time())}.png")
        try:
            capture = computer.screenshot(path)
        except Exception as error:
            emit({"ok": False, "error": str(error)})
        result = ocr_image(capture["path"], lang, psm)
        result["screenshot"] = capture
        emit(result)
    emit({"ok": False, "error": f"unknown command: {command}"})


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:
        emit({"ok": False, "error": str(error)}, 1)
