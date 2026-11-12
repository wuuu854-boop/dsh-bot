#!/usr/bin/env python3
"""Fast, read-only browser text extraction through Python UIA/COM.

This is used by the course fast path so a status read does not pay Windows
PowerShell startup. It intentionally only reads text; clicks and form actions
stay on the full edge.py path.
"""

from __future__ import annotations

import argparse
import json
import sys

if sys.stdout is not None:
    sys.stdout.reconfigure(encoding="utf-8")


def find_browser_window():
    import computer

    windows = computer.list_windows()
    browsers = [w for w in windows if str(w.get("process") or "").lower() in {
        "msedge.exe", "chrome.exe", "brave.exe", "chromium.exe",
    } or "edge" in str(w.get("title") or "").lower() or "chrome" in str(w.get("title") or "").lower()]
    if not browsers:
        raise RuntimeError("没有找到 Edge/Chrome 窗口")
    browsers.sort(key=lambda item: (not bool(item.get("active")),))
    return browsers[0]


def read_text(limit=20000):
    import comtypes
    import comtypes.client as client
    import ctypes

    window = find_browser_window()
    try:
        import computer
        computer.activate_window(window.get("title") or "")
    except Exception:
        pass
    comtypes.CoInitialize()
    try:
        client.GetModule("UIAutomationCore.dll")
        from comtypes.gen import UIAutomationClient as UIA

        uia = client.CreateObject(UIA.CUIAutomation, interface=UIA.IUIAutomation)
        handle = ctypes.windll.user32.FindWindowW(None, window["title"])
        if not handle:
            raise RuntimeError("浏览器窗口句柄不可用")
        root = uia.ElementFromHandle(handle)
        doc_condition = uia.CreatePropertyCondition(
            UIA.UIA_ControlTypePropertyId, UIA.UIA_DocumentControlTypeId
        )
        docs = root.FindAll(UIA.TreeScope_Descendants, doc_condition)
        if not docs or docs.Length == 0:
            raise RuntimeError("浏览器没有暴露 Document")

        def doc_text(doc):
            try:
                pattern = doc.GetCurrentPattern(UIA.UIA_TextPatternId)
                pattern = pattern.QueryInterface(UIA.IUIAutomationTextPattern)
                return str(pattern.DocumentRange.GetText(-1) or "")
            except Exception:
                return ""

        title = str(window.get("title") or "")
        active = None
        active_len = -1
        for index in range(docs.Length):
            doc = docs.GetElement(index)
            text = doc_text(doc)
            if not text:
                continue
            name = str(doc.CurrentName or "")
            if name and title.startswith(name) and len(text) > active_len:
                active = doc
                active_len = len(text)
            if active is None and len(text) > active_len:
                active = doc
                active_len = len(text)
        if active is None:
            raise RuntimeError("没有可读取的 Document")

        page_docs = [active]
        try:
            for index in range(active.FindAll(UIA.TreeScope_Descendants, doc_condition).Length):
                child = active.FindAll(UIA.TreeScope_Descendants, doc_condition).GetElement(index)
                if child is not active:
                    page_docs.append(child)
        except Exception:
            pass
        parts = []
        for doc in page_docs:
            text = doc_text(doc)
            if text:
                parts.append(text)
        full = "\n\n--- frame ---\n\n".join(parts)
        length = len(full)
        if length > limit:
            full = full[:limit]
        return {
            "ok": True,
            "title": title,
            "textLength": length,
            "framesCount": len(page_docs),
            "text": full,
            "fast": True,
        }
    finally:
        try:
            comtypes.CoUninitialize()
        except Exception:
            pass


def _control_name(control_type):
    names = {
        50000: "Button",
        50002: "CheckBox",
        50003: "ComboBox",
        50004: "Edit",
        50005: "Hyperlink",
        50007: "ListItem",
        50008: "List",
        50012: "ProgressBar",
        50013: "RadioButton",
        50018: "Tab",
        50019: "TabItem",
        50020: "Text",
        50026: "Group",
        50029: "DataItem",
        50030: "Document",
        50032: "Window",
        50033: "Pane",
        50036: "Table",
    }
    return names.get(int(control_type or 0), "")


def click(name, role="", exact=True):
    import comtypes
    import comtypes.client as client

    if not str(name or "").strip():
        raise RuntimeError("控件名不能为空")
    window = find_browser_window()
    try:
        import computer
        computer.activate_window(window.get("title") or "")
    except Exception:
        pass
    comtypes.CoInitialize()
    try:
        client.GetModule("UIAutomationCore.dll")
        from comtypes.gen import UIAutomationClient as UIA

        uia = client.CreateObject(UIA.CUIAutomation, interface=UIA.IUIAutomation)
        import ctypes

        handle = ctypes.windll.user32.FindWindowW(None, window["title"])
        if not handle:
            raise RuntimeError("浏览器窗口句柄不可用")
        root = uia.ElementFromHandle(handle)
        elements = root.FindAll(UIA.TreeScope_Descendants, uia.CreateTrueCondition())
        wanted = str(name).strip()
        role_wanted = str(role or "").strip()
        for index in range(elements.Length):
            element = elements.GetElement(index)
            try:
                current = str(element.CurrentName or "").strip()
            except Exception:
                continue
            if not current:
                continue
            if exact and current != wanted:
                continue
            if not exact and wanted.lower() not in current.lower():
                continue
            if role_wanted and _control_name(element.CurrentControlType) != role_wanted:
                continue
            try:
                if not element.CurrentIsEnabled:
                    continue
            except Exception:
                pass
            info = {"name": current, "role": _control_name(element.CurrentControlType)}
            try:
                pattern = element.GetCurrentPattern(UIA.UIA_InvokePatternId)
                pattern = pattern.QueryInterface(UIA.IUIAutomationInvokePattern)
                pattern.Invoke()
                return {"ok": True, "method": "invoke", "clicked": info}
            except Exception:
                pass
            try:
                rect = element.CurrentBoundingRectangle
                x = int((rect.left + rect.right) / 2)
                y = int((rect.top + rect.bottom) / 2)
                if x <= 0 or y <= 0:
                    continue
                import computer
                computer.mouse_click(x, y, "left", False)
                return {"ok": True, "method": "mouse", "clicked": info}
            except Exception:
                continue
        return {"ok": False, "error": f"没有找到可点击控件：{wanted}"}
    finally:
        try:
            comtypes.CoUninitialize()
        except Exception:
            pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", nargs="?", default="text", choices=["text", "click"])
    parser.add_argument("--name", default="")
    parser.add_argument("--role", default="")
    parser.add_argument("--limit", type=int, default=20000)
    parser.add_argument("--contains", action="store_true")
    args = parser.parse_args()
    try:
        if args.command == "click":
            print(json.dumps(click(args.name, args.role, not args.contains), ensure_ascii=False))
        else:
            print(json.dumps(read_text(args.limit), ensure_ascii=False))
        return 0
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
