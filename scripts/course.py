#!/usr/bin/env python3
"""Course-page adapter for Edge + DSH Bot.

This is a state-machine helper for self-paced course pages (ICVE / 智慧职教
and similar): read every iframe, detect video / PPT / quiz / next controls,
click with change verification, and refuse to loop on an unchanged page.

Commands (all print one JSON object):
  status
  question
  play
  next
  ppt
  answer --choice N [--submit]
  answer --text "..." [--submit]

It intentionally refuses pages that look like exams or proctored assessments.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import computer  # noqa: E402
import edge  # noqa: E402

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

STATE_DIR = os.path.join(os.environ.get("DSH_HOME", os.path.join(os.path.expanduser("~"), ".dsh")), "storages", "dsh-bot")
COURSE_STATE = os.path.join(STATE_DIR, "course-state.json")
COURSE_CACHE = os.path.join(STATE_DIR, "course-cache.json")
CACHE_TTL_MS = 3000

EXAM_MARKERS = ("考试", "监考", "闭卷", "期末", "倒计时", "交卷", "答题卡")
NEXT_NAMES = ("下一题", "下一关", "继续学习", "开始学习", "立即学习", "下一节", "下一章", "下一页", "下一课")
PLAY_NAMES = ("播放", "继续播放", "开始播放", "Play", "play")
PPT_NAMES = ("下一页", "下一张", "下一页幻灯片")
QUIZ_ROLES = ("RadioButton", "CheckBox")


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def flag(args, name, default=""):
    key = f"--{name}"
    for index, item in enumerate(args):
        if item == key and index + 1 < len(args):
            return args[index + 1]
    return default


def load_cache():
    try:
        with open(COURSE_CACHE, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict) or not data.get("result"):
            return None
        if time.time() * 1000 - float(data.get("at") or 0) > CACHE_TTL_MS:
            return None
        result = data["result"]
        try:
            name = edge.resolve_browser()
            active = [item for item in edge.browser_windows(name) if item.get("active")]
            if not active:
                return None
            if result.get("title") and str(active[0].get("title")) != str(result.get("title")):
                return None
        except Exception:
            return None
        result["cached"] = True
        return result
    except Exception:
        return None


def save_cache(result):
    if not isinstance(result, dict) or not result.get("ok"):
        return
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        snapshot = {key: value for key, value in result.items() if key not in ("cached",)}
        with open(COURSE_CACHE, "w", encoding="utf-8") as handle:
            json.dump({"at": int(time.time() * 1000), "result": snapshot}, handle, ensure_ascii=False)
    except Exception:
        pass


def read_page(fast=False):
    if fast:
        cached = load_cache()
        if cached:
            return cached
        result = edge.read_text(True)
        if not result.get("ok"):
            return read_page(False)
        result["phase"] = classify_text(text_of(result))
        result["question"] = question_view(result)
        result["nextCandidates"] = []
        result["playCandidates"] = []
        result["pptCandidates"] = []
        result["progress"] = progress_view(text_of(result))
        result["signature"] = signature(result)
        result["fast"] = True
        save_cache(result)
        return result
    result = edge.read_page(200, True)
    if not result.get("ok"):
        return result
    result["phase"] = classify(result)
    result["question"] = question_view(result)
    result["nextCandidates"] = candidates(result, NEXT_NAMES)
    result["playCandidates"] = candidates(result, PLAY_NAMES)
    result["pptCandidates"] = candidates(result, PPT_NAMES)
    result["progress"] = progress_view(text_of(result))
    result["signature"] = signature(result)
    result["fast"] = False
    save_cache(result)
    return result


def controls(page):
    return page.get("controls") if isinstance(page.get("controls"), list) else []


def text_of(page):
    return str(page.get("text") or "")


def classify_text(text):
    if any(marker in text for marker in EXAM_MARKERS):
        return "exam"
    if "提交" in text and ("题" in text or "选项" in text or "作答" in text):
        return "quiz"
    if any(name in text for name in ("继续播放", "开始播放", "播放", "暂停")):
        return "video"
    if any(name in text for name in ("下一页", "上一页", "下一张")):
        return "ppt"
    if any(name in text for name in NEXT_NAMES):
        return "next"
    if any(marker in text for marker in ("已完成", "已学完", "100%")):
        return "done"
    return "unknown"


def progress_view(text):
    done_markers = ("已完成", "已学完", "已完成学习")
    pending_markers = ("未完成", "待完成", "未开始", "进行中", "继续学习", "待学习")
    done = []
    pending = []
    action_lines = ("继续学习", "开始学习", "立即学习", "下一题", "下一关", "下一节", "下一页", "播放", "提交")
    for raw in str(text or "").splitlines():
        line = raw.strip()
        if not line or len(line) > 180:
            continue
        if line in action_lines:
            continue
        if any(marker in line for marker in pending_markers):
            if line not in pending:
                pending.append(line[:180])
        elif any(marker in line for marker in done_markers):
            if line not in done:
                done.append(line[:180])
    total = len(done) + len(pending)
    return {
        "completed": len(done),
        "pending": len(pending),
        "total": total,
        "percent": round((len(done) / total) * 100) if total else None,
        "completedItems": done[:8],
        "pendingItems": pending[:8],
    }


def candidates(page, names):
    found = []
    for control in controls(page):
        name = str(control.get("name") or "")
        if not name:
            continue
        if any(wanted.lower() in name.lower() for wanted in names):
            if not any(item.get("name") == name and item.get("frame") == control.get("frame") for item in found):
                found.append(
                    {
                        "name": name,
                        "role": control.get("role"),
                        "frame": control.get("frame"),
                        "enabled": control.get("enabled"),
                        "value": control.get("value"),
                    }
                )
    return found


def question_view(page):
    text = text_of(page)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    picked = []
    for line in lines:
        if any(marker in line for marker in ("题", "选择", "判断", "填空", "答案", "请")):
            picked.append(line[:240])
        if len(picked) >= 12:
            break
    if not picked:
        picked = lines[:8]
    options = [
        {"name": c.get("name"), "role": c.get("role"), "frame": c.get("frame")}
        for c in controls(page)
        if c.get("role") in QUIZ_ROLES and c.get("name")
    ]
    return {"snippet": "\n".join(picked), "options": options[:16]}


def classify(page):
    text = text_of(page)
    names = [str(c.get("name") or "") for c in controls(page)]
    roles = [str(c.get("role") or "") for c in controls(page)]
    if any(marker in text for marker in EXAM_MARKERS):
        return "exam"
    if any(role in QUIZ_ROLES for role in roles) and any("提交" in name for name in names):
        return "quiz"
    if any(name in PPT_NAMES or "上一页" in name for name in names):
        return "ppt"
    if any(wanted in name for name in names for wanted in PLAY_NAMES):
        return "video"
    if any(wanted in name for name in names for wanted in NEXT_NAMES):
        return "next"
    if any(marker in text for marker in ("已完成", "已学完", "100%")):
        return "done"
    return "unknown"


def signature(page):
    raw = f"{page.get('url','')}|{page.get('textLength',0)}|" + "|".join(
        f"{c.get('frame')}:{c.get('name')}:{c.get('value')}:{c.get('enabled')}" for c in controls(page)[:120]
    )
    return hashlib.sha1(raw.encode("utf-8", "replace")).hexdigest()


def load_state():
    try:
        with open(COURSE_STATE, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return {"last": None}


def save_state(value):
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        with open(COURSE_STATE, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False)
    except Exception:
        pass


def guard(page, action):
    """Return a failure object if the same click already stalled twice."""
    state = load_state()
    last = state.get("last") or {}
    same = (
        last.get("action") == action
        and last.get("signature") == page.get("signature")
        and last.get("url") == page.get("url")
    )
    count = int(last.get("count") or 0) + 1 if same else 1
    save_state(
        {
            "last": {
                "action": action,
                "url": page.get("url"),
                "signature": page.get("signature"),
                "count": count,
                "at": int(time.time() * 1000),
            }
        }
    )
    if same and count >= 3:
        return {
            "ok": False,
            "blocked": True,
            "error": "同一页面、同一动作已经连续 3 次没有进展，停止重复点击；请 read --all 检查 frame、滚动、等待或向用户报告卡点。",
            "action": action,
            "count": count,
        }
    return None


def activate_safety():
    try:
        edge.activate_edge()
    except Exception:
        pass


def click_candidate(candidate):
    return edge.click_with_verify(
        "click",
        str(candidate.get("name") or ""),
        str(candidate.get("role") or ""),
        None,
        True,
        2.5,
    )


def do_play(page):
    blocked = guard(page, "play")
    if blocked:
        return blocked
    activate_safety()
    candidates_list = page.get("playCandidates") or []
    if candidates_list:
        last = None
        for candidate in candidates_list[:3]:
            result = click_candidate(candidate)
            last = result
            if result.get("ok") and result.get("changed"):
                return {"ok": True, "action": "play", "clicked": candidate, "result": result, "phase": page.get("phase")}
            if result.get("stalled"):
                break
        if last:
            return {"ok": False, "action": "play", "error": "点击播放后页面没有变化", "result": last}
    computer.press_combo("space")
    after = read_page()
    return {"ok": True, "action": "play", "method": "space", "changed": after.get("signature") != page.get("signature"), "page": summary(after)}


def do_next(page):
    blocked = guard(page, "next")
    if blocked:
        return blocked
    activate_safety()
    candidates_list = (page.get("nextCandidates") or []) + (page.get("pptCandidates") or [])
    if not candidates_list:
        return {"ok": False, "action": "next", "error": "没有找到“下一题/下一关/继续学习/下一页”等按钮", "phase": page.get("phase")}
    last = None
    for candidate in candidates_list[:4]:
        result = click_candidate(candidate)
        last = result
        if result.get("ok") and result.get("changed"):
            return {"ok": True, "action": "next", "clicked": candidate, "result": result, "page": summary(read_page())}
        if result.get("stalled"):
            continue
    return {"ok": False, "action": "next", "error": "点击后没有可见变化，已停止；请检查 iframe/滚动/等待", "result": last, "page": summary(read_page())}


def do_ppt(page):
    blocked = guard(page, "ppt")
    if blocked:
        return blocked
    activate_safety()
    candidates_list = page.get("pptCandidates") or []
    for candidate in candidates_list[:3]:
        result = click_candidate(candidate)
        if result.get("ok") and result.get("changed"):
            return {"ok": True, "action": "ppt", "clicked": candidate, "page": summary(read_page())}
    computer.press_combo("right")
    return {"ok": True, "action": "ppt", "method": "right-arrow", "page": summary(read_page())}


def do_answer(page, choice=None, text=None, submit=False):
    blocked = guard(page, "answer")
    if blocked:
        return blocked
    activate_safety()
    options = [c for c in controls(page) if c.get("role") in QUIZ_ROLES and c.get("name")]
    clicked = None
    if choice not in (None, ""):
        try:
            index = int(str(choice).strip().upper().replace("A", "1").replace("B", "2").replace("C", "3").replace("D", "4")) - 1
        except Exception:
            index = 0
        if index < 0 or index >= len(options):
            return {"ok": False, "error": f"选项序号超出范围（共 {len(options)} 个）", "options": options[:8]}
        result = click_candidate(options[index])
        clicked = {"option": options[index], "result": result}
    elif text:
        edits = [c for c in controls(page) if c.get("role") == "Edit" and c.get("name")]
        if not edits:
            return {"ok": False, "error": "没有找到可填写的输入框"}
        result = edge.uia_run("type", name=str(edits[0].get("name")), text=text, role="Edit", all=True)
        clicked = {"option": edits[0], "result": result}
    else:
        return {"ok": False, "error": "answer 需要 --choice 或 --text"}
    submitted = None
    if submit:
        submit_controls = [c for c in controls(page) if "提交" in str(c.get("name") or "")]
        if submit_controls:
            submitted = click_candidate(submit_controls[0])
    return {"ok": True, "action": "answer", "clicked": clicked, "submitted": submitted, "page": summary(read_page())}


def summary(page):
    return {
        "url": page.get("url"),
        "phase": page.get("phase"),
        "textLength": page.get("textLength"),
        "framesCount": page.get("framesCount"),
        "nextCandidates": page.get("nextCandidates"),
        "playCandidates": page.get("playCandidates"),
        "pptCandidates": page.get("pptCandidates"),
        "question": page.get("question"),
        "progress": page.get("progress"),
        "fast": page.get("fast", False),
        "cached": page.get("cached", False),
    }


def main():
    if len(sys.argv) < 2:
        emit({"ok": False, "error": "missing command; try status/progress/question/play/next/ppt/answer"})
    command = sys.argv[1].lower()
    args = sys.argv[2:]
    fast = command in ("status", "progress") and "--full" not in args
    page = read_page(fast=fast)
    if not page.get("ok"):
        emit(page)

    if page.get("phase") == "exam":
        emit({"ok": False, "blocked": True, "phase": "exam", "error": "检测到考试/监考/交卷页面，课程助手不会自动作答或点击。"})

    if command == "status":
        emit({"ok": True, **summary(page)})
    if command == "progress":
        emit({"ok": True, "phase": page.get("phase"), "progress": page.get("progress"), "page": summary(page)})
    if command == "question":
        emit({"ok": True, "phase": page.get("phase"), "question": page.get("question"), "page": summary(page)})
    if command == "play":
        emit(do_play(page))
    if command == "next":
        emit(do_next(page))
    if command == "ppt":
        emit(do_ppt(page))
    if command == "answer":
        emit(do_answer(page, flag(args, "choice", ""), flag(args, "text", ""), "--submit" in args))
    emit({"ok": False, "error": f"unknown command: {command}"})


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:
        emit({"ok": False, "error": str(error)}, 1)
