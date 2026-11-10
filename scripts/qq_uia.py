#!/usr/bin/env python3
"""Read the current QQ chat through Windows UI Automation (no focus stealing).

Only the last N text elements of the current chat message pane are returned,
never the contact list's previews of other chats.
"""

from __future__ import annotations

import argparse
import json
import sys

if sys.stdout is not None:
    sys.stdout.reconfigure(encoding="utf-8")


def read_chat(contact: str, tail: int = 20) -> dict:
    import comtypes
    import comtypes.client as client
    import ctypes

    comtypes.CoInitialize()
    try:
        client.GetModule("UIAutomationCore.dll")
        from comtypes.gen import UIAutomationClient as UIA

        uia = client.CreateObject(UIA.CUIAutomation, interface=UIA.IUIAutomation)
        handle = ctypes.windll.user32.FindWindowW(None, "QQ")
        if not handle:
            return {"ok": False, "error": "QQ window not found"}
        root = uia.ElementFromHandle(handle)

        name_condition = uia.CreatePropertyCondition(UIA.UIA_NamePropertyId, contact)
        class_condition = uia.CreatePropertyCondition(UIA.UIA_ClassNamePropertyId, "chat-header__contact-name")
        header = root.FindFirst(UIA.TreeScope_Descendants, uia.CreateAndCondition(name_condition, class_condition))
        if not header:
            return {"ok": False, "error": f"current chat is not {contact}"}

        pane_condition = uia.CreatePropertyCondition(UIA.UIA_NamePropertyId, "消息列表")
        pane = root.FindFirst(UIA.TreeScope_Descendants, pane_condition)
        if not pane:
            return {"ok": False, "error": "QQ message pane not found"}

        text_condition = uia.CreatePropertyCondition(UIA.UIA_ControlTypePropertyId, UIA.UIA_TextControlTypeId)
        texts = pane.FindAll(UIA.TreeScope_Descendants, text_condition)
        messages = []
        for index in range(texts.Length):
            item = texts.GetElement(index)
            value = (item.CurrentName or "").strip()
            if value:
                messages.append(value)
        if len(messages) > tail:
            messages = messages[-tail:]
        return {"ok": True, "title": header.CurrentName, "count": texts.Length, "messages": messages}
    finally:
        try:
            comtypes.CoUninitialize()
        except Exception:
            pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--contact", required=True)
    parser.add_argument("--tail", type=int, default=20)
    args = parser.parse_args()
    result = read_chat(args.contact, args.tail)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
