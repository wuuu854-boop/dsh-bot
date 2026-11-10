#!/usr/bin/env python3
"""Local GUI control for DSH Bot.

Zero third-party dependencies beyond Pillow (for screenshots). Coordinates are
physical pixels because the process opts into per-monitor DPI awareness.

Commands:
  screen
  monitors
  windows
  active
  screenshot [path] [all|primary|monitor:N]
  click X Y [left|right|double]
  move X Y
  drag X1 Y1 X2 Y2
  scroll AMOUNT
  type TEXT | type --file PATH
  key COMBO            (ctrl+s, alt+tab, enter, f5, win, ...)
  activate TITLE_SUBSTRING
  wait MS

Coordinates and screenshots use the virtual desktop, so secondary monitors
to the left/right/top of the primary are included by default.

Every command prints one JSON object on stdout and exits non-zero on failure.
"""

from __future__ import annotations

import ctypes
import json
import os
import sys
import tempfile
import time
from ctypes import wintypes

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
except Exception:
    try:
        user32.SetProcessDPIAware()
    except Exception:
        pass

if ctypes.sizeof(ctypes.c_void_p) == 8:
    ULONG_PTR = ctypes.c_ulonglong
else:
    ULONG_PTR = ctypes.c_ulong

LONG = wintypes.LONG
DWORD = wintypes.DWORD
WORD = wintypes.WORD


class MOUSEINPUT(ctypes.Structure):
    _fields_ = [
        ('dx', LONG),
        ('dy', LONG),
        ('mouseData', DWORD),
        ('dwFlags', DWORD),
        ('time', DWORD),
        ('dwExtraInfo', ULONG_PTR),
    ]


class KEYBDINPUT(ctypes.Structure):
    _fields_ = [
        ('wVk', WORD),
        ('wScan', WORD),
        ('dwFlags', DWORD),
        ('time', DWORD),
        ('dwExtraInfo', ULONG_PTR),
    ]


class HARDWAREINPUT(ctypes.Structure):
    _fields_ = [
        ('uMsg', DWORD),
        ('wParamL', WORD),
        ('wParamH', WORD),
    ]


class _INPUTUNION(ctypes.Union):
    _fields_ = [
        ('mi', MOUSEINPUT),
        ('ki', KEYBDINPUT),
        ('hi', HARDWAREINPUT),
    ]


class INPUT(ctypes.Structure):
    _anonymous_ = ('u',)
    _fields_ = [
        ('type', DWORD),
        ('u', _INPUTUNION),
    ]


class RECT(ctypes.Structure):
    _fields_ = [
        ('left', LONG),
        ('top', LONG),
        ('right', LONG),
        ('bottom', LONG),
    ]


class MONITORINFO(ctypes.Structure):
    _fields_ = [
        ('cbSize', DWORD),
        ('rcMonitor', RECT),
        ('rcWork', RECT),
        ('dwFlags', DWORD),
    ]


MONITORENUMPROC = ctypes.WINFUNCTYPE(
    wintypes.BOOL,
    wintypes.HANDLE,
    wintypes.HDC,
    ctypes.POINTER(RECT),
    wintypes.LPARAM,
)


INPUT_MOUSE = 0
INPUT_KEYBOARD = 1
KEYEVENTF_KEYUP = 0x0002
KEYEVENTF_UNICODE = 0x0004
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010
MOUSEEVENTF_WHEEL = 0x0800
WM_KEYDOWN = 0x0100
WM_KEYUP = 0x0101

VK = {
    'backspace': 0x08,
    'tab': 0x09,
    'enter': 0x0D,
    'return': 0x0D,
    'shift': 0x10,
    'ctrl': 0x11,
    'control': 0x11,
    'alt': 0x12,
    'pause': 0x13,
    'capslock': 0x14,
    'escape': 0x1B,
    'esc': 0x1B,
    'space': 0x20,
    'pageup': 0x21,
    'pgup': 0x21,
    'pagedown': 0x22,
    'pgdn': 0x22,
    'end': 0x23,
    'home': 0x24,
    'left': 0x25,
    'up': 0x26,
    'right': 0x27,
    'down': 0x28,
    'insert': 0x2D,
    'delete': 0x2E,
    'del': 0x2E,
    'win': 0x5B,
    'lwin': 0x5B,
    'rwin': 0x5C,
    'apps': 0x5D,
    'num0': 0x60,
    'num1': 0x61,
    'num2': 0x62,
    'num3': 0x63,
    'num4': 0x64,
    'num5': 0x65,
    'num6': 0x66,
    'num7': 0x67,
    'num8': 0x68,
    'num9': 0x69,
    'multiply': 0x6A,
    'add': 0x6B,
    'subtract': 0x6D,
    'decimal': 0x6E,
    'divide': 0x6F,
    'f1': 0x70,
    'f2': 0x71,
    'f3': 0x72,
    'f4': 0x73,
    'f5': 0x74,
    'f6': 0x75,
    'f7': 0x76,
    'f8': 0x77,
    'f9': 0x78,
    'f10': 0x79,
    'f11': 0x7A,
    'f12': 0x7B,
    'numlock': 0x90,
    'scrolllock': 0x91,
    'printscreen': 0x2C,
    'semicolon': 0xBA,
    'equals': 0xBB,
    'comma': 0xBC,
    'minus': 0xBD,
    'period': 0xBE,
    'slash': 0xBF,
    'backtick': 0xC0,
    'bracketleft': 0xDB,
    'backslash': 0xDC,
    'bracketright': 0xDD,
    'quote': 0xDE,
}


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def fail(message):
    emit({'ok': False, 'error': str(message)}, 1)


def send_inputs(inputs):
    count = len(inputs)
    array = (INPUT * count)(*inputs)
    sent = user32.SendInput(count, array, ctypes.sizeof(INPUT))
    if sent != count:
        raise ctypes.WinError()


def input_key(vk, flags=0, scan=0):
    item = INPUT()
    item.type = INPUT_KEYBOARD
    item.ki = KEYBDINPUT(vk, scan, flags, 0, 0)
    return item


def press_combo(combo):
    parts = [part.strip().lower() for part in str(combo).split('+') if part.strip()]
    if not parts:
        raise ValueError('empty key combo')
    vks = []
    for part in parts:
        if len(part) == 1:
            char = part.upper()
            code = ord(char)
            if not (0x30 <= code <= 0x5A):
                raise ValueError(f'unsupported key: {part}')
            vks.append(code)
        elif part in VK:
            vks.append(VK[part])
        else:
            raise ValueError(f'unknown key: {part}')
    for code in vks:
        send_inputs([input_key(code, 0)])
        time.sleep(0.012)
    for code in reversed(vks):
        send_inputs([input_key(code, KEYEVENTF_KEYUP)])
        time.sleep(0.012)


def type_text(text):
    for char in text:
        if char == '\n':
            press_combo('enter')
            continue
        if char == '\t':
            press_combo('tab')
            continue
        if char == '\r':
            continue
        code = ord(char)
        if code > 0xFFFF:
            for unit in char.encode('utf-16-le'):
                pass
            encoded = char.encode('utf-16-le')
            units = [int.from_bytes(encoded[i:i + 2], 'little') for i in range(0, len(encoded), 2)]
        else:
            units = [code]
        for unit in units:
            item = INPUT()
            item.type = INPUT_KEYBOARD
            item.ki = KEYBDINPUT(0, unit, KEYEVENTF_UNICODE, 0, 0)
            up = INPUT()
            up.type = INPUT_KEYBOARD
            up.ki = KEYBDINPUT(0, unit, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP, 0, 0)
            send_inputs([item, up])
            time.sleep(0.004)


def mouse_click(x, y, button='left', double=False):
    user32.SetCursorPos(int(x), int(y))
    time.sleep(0.06)
    down = MOUSEEVENTF_RIGHTDOWN if button == 'right' else MOUSEEVENTF_LEFTDOWN
    up = MOUSEEVENTF_RIGHTUP if button == 'right' else MOUSEEVENTF_LEFTUP
    clicks = 2 if double else 1
    for index in range(clicks):
        user32.mouse_event(down, 0, 0, 0, 0)
        time.sleep(0.05)
        user32.mouse_event(up, 0, 0, 0, 0)
        if index + 1 < clicks:
            time.sleep(0.08)


def mouse_drag(x1, y1, x2, y2):
    user32.SetCursorPos(int(x1), int(y1))
    time.sleep(0.08)
    user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    steps = 24
    for index in range(1, steps + 1):
        x = int(x1 + (x2 - x1) * index / steps)
        y = int(y1 + (y2 - y1) * index / steps)
        user32.SetCursorPos(x, y)
        time.sleep(0.008)
    user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)


def window_title(hwnd):
    length = user32.GetWindowTextLengthW(hwnd)
    if length <= 0:
        return ''
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    return buffer.value


def window_rect(hwnd):
    rect = wintypes.RECT()
    user32.GetWindowRect(hwnd, ctypes.byref(rect))
    return [rect.left, rect.top, rect.right, rect.bottom]


def list_windows():
    active = user32.GetForegroundWindow()
    results = []
    callback_type = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)

    def callback(hwnd, _lparam):
        if not user32.IsWindowVisible(hwnd):
            return True
        title = window_title(hwnd)
        if not title.strip():
            return True
        pid = DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        results.append({
            'handle': int(hwnd),
            'pid': int(pid.value),
            'title': title,
            'active': hwnd == active,
            'rect': window_rect(hwnd),
        })
        return True

    user32.EnumWindows(callback_type(callback), 0)
    return results


def activate_window(needle):
    needle = str(needle).lower().strip()
    if not needle:
        raise ValueError('empty window title')
    for item in list_windows():
        if needle in item['title'].lower():
            hwnd = wintypes.HWND(item['handle'])
            # A minimize/restore cycle is the most reliable way past the
            # Windows foreground lock when another app is focused.
            user32.ShowWindow(hwnd, 6)
            time.sleep(0.06)
            user32.ShowWindow(hwnd, 9)
            time.sleep(0.08)
            try:
                user32.keybd_event(0x12, 0, 0, 0)
                time.sleep(0.02)
                user32.keybd_event(0x12, 0, 2, 0)
            except Exception:
                pass
            # Foreground lock: briefly attach to the current foreground thread
            # and flash topmost so a background window is really raised.
            foreground = user32.GetForegroundWindow()
            foreground_pid = wintypes.DWORD()
            foreground_thread = user32.GetWindowThreadProcessId(foreground, ctypes.byref(foreground_pid)) if foreground else 0
            current_thread = kernel32.GetCurrentThreadId()
            attached = False
            try:
                if foreground_thread and foreground_thread != current_thread:
                    attached = bool(user32.AttachThreadInput(foreground_thread, current_thread, True))
                user32.BringWindowToTop(hwnd)
                user32.SetWindowPos(hwnd, wintypes.HWND(-1), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040)
                user32.SetWindowPos(hwnd, wintypes.HWND(-2), 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040)
                user32.SetForegroundWindow(hwnd)
                user32.SetFocus(hwnd)
            finally:
                if attached:
                    user32.AttachThreadInput(foreground_thread, current_thread, False)
            time.sleep(0.2)
            updated = dict(item)
            updated['active'] = int(user32.GetForegroundWindow() or 0) == int(item['handle'])
            return updated
    raise LookupError(f'no visible window matching {needle!r}')


def list_monitors():
    monitors = []

    def callback(hmonitor, _hdc, lprc, _lparam):
        info = MONITORINFO()
        info.cbSize = ctypes.sizeof(MONITORINFO)
        if user32.GetMonitorInfoW(hmonitor, ctypes.byref(info)):
            rect = info.rcMonitor
            work = info.rcWork
            monitors.append({
                'handle': int(hmonitor),
                'primary': bool(info.dwFlags & 1),
                'x': int(rect.left),
                'y': int(rect.top),
                'width': int(rect.right - rect.left),
                'height': int(rect.bottom - rect.top),
                'work': {
                    'x': int(work.left),
                    'y': int(work.top),
                    'width': int(work.right - work.left),
                    'height': int(work.bottom - work.top),
                },
            })
        return True

    user32.EnumDisplayMonitors(None, None, MONITORENUMPROC(callback), 0)
    monitors.sort(key=lambda item: (not item['primary'], item['x'], item['y']))
    return monitors


def virtual_screen():
    return {
        'x': int(user32.GetSystemMetrics(76)),
        'y': int(user32.GetSystemMetrics(77)),
        'width': int(user32.GetSystemMetrics(78)),
        'height': int(user32.GetSystemMetrics(79)),
    }


def screen_info():
    monitors = list_monitors()
    virtual = virtual_screen()
    primary = next((item for item in monitors if item['primary']), None)
    if primary is None:
        primary = {
            'x': 0,
            'y': 0,
            'width': int(user32.GetSystemMetrics(0)),
            'height': int(user32.GetSystemMetrics(1)),
        }
    return {
        'ok': True,
        'width': virtual['width'],
        'height': virtual['height'],
        'virtual': virtual,
        'primary': {
            'x': primary['x'],
            'y': primary['y'],
            'width': primary['width'],
            'height': primary['height'],
        },
        'monitors': monitors,
    }


def screenshot(path=None, target='all', monitor_index=None):
    from PIL import ImageGrab

    target = str(target or 'all').lower()
    monitors = list_monitors()
    if target == 'primary':
        selected = next((item for item in monitors if item['primary']), None)
    elif target.startswith('monitor'):
        index = monitor_index
        if index is None:
            try:
                index = int(target.split(':', 1)[1])
            except Exception:
                index = 1
        index = max(1, int(index))
        selected = monitors[index - 1] if len(monitors) >= index else None
    else:
        selected = None

    if selected:
        bbox = (selected['x'], selected['y'], selected['x'] + selected['width'], selected['y'] + selected['height'])
        mode = 'primary' if selected['primary'] and target == 'primary' else f"monitor:{monitors.index(selected) + 1}"
    else:
        virtual = virtual_screen()
        bbox = (virtual['x'], virtual['y'], virtual['x'] + virtual['width'], virtual['y'] + virtual['height'])
        mode = 'all'

    image = ImageGrab.grab(bbox=bbox, all_screens=True)
    target_path = path or os.path.join(tempfile.gettempdir(), f'dsh-bot-screen-{int(time.time())}.png')
    os.makedirs(os.path.dirname(os.path.abspath(target_path)), exist_ok=True)
    image.save(target_path)
    return {
        'ok': True,
        'path': os.path.abspath(target_path),
        'width': image.size[0],
        'height': image.size[1],
        'mode': mode,
        'bbox': list(bbox),
        'monitors': monitors,
    }


def screen_size():
    return screen_info()


def main():
    if len(sys.argv) < 2:
        fail('missing command; try: screen, windows, active, screenshot, click, type, key, activate')
    command = sys.argv[1].lower()
    args = sys.argv[2:]
    if command == 'screen':
        emit(screen_info())
    if command == 'monitors':
        emit({'ok': True, 'monitors': list_monitors(), 'virtual': virtual_screen()})
    if command == 'windows':
        emit({'ok': True, 'windows': list_windows()})
    if command == 'active':
        hwnd = user32.GetForegroundWindow()
        pid = DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        emit({'ok': True, 'window': {'handle': int(hwnd), 'pid': int(pid.value), 'title': window_title(hwnd), 'rect': window_rect(hwnd)}})
    if command == 'screenshot':
        path = None
        target = 'all'
        if args:
            if args[0].lower() in ('all', 'primary') or args[0].lower().startswith('monitor'):
                target = args[0]
            else:
                path = args[0]
                if len(args) > 1:
                    target = args[1]
        emit(screenshot(path, target))
    if command == 'click':
        if len(args) < 2:
            fail('click requires X Y [left|right|double]')
        button = 'right' if len(args) >= 3 and args[2].lower() == 'right' else 'left'
        double = len(args) >= 3 and args[2].lower() == 'double'
        mouse_click(int(args[0]), int(args[1]), button, double)
        emit({'ok': True, 'action': 'click', 'x': int(args[0]), 'y': int(args[1]), 'button': button, 'double': double})
    if command == 'move':
        if len(args) < 2:
            fail('move requires X Y')
        user32.SetCursorPos(int(args[0]), int(args[1]))
        emit({'ok': True, 'action': 'move', 'x': int(args[0]), 'y': int(args[1])})
    if command == 'drag':
        if len(args) < 4:
            fail('drag requires X1 Y1 X2 Y2')
        mouse_drag(int(args[0]), int(args[1]), int(args[2]), int(args[3]))
        emit({'ok': True, 'action': 'drag'})
    if command == 'scroll':
        if len(args) < 1:
            fail('scroll requires AMOUNT')
        user32.mouse_event(MOUSEEVENTF_WHEEL, 0, 0, int(args[0]) * 120, 0)
        emit({'ok': True, 'action': 'scroll', 'amount': int(args[0])})
    if command == 'type':
        if not args:
            fail('type requires text or --file PATH')
        if args[0] == '--file' and len(args) >= 2:
            with open(args[1], 'r', encoding='utf-8') as handle:
                text = handle.read()
        else:
            text = ' '.join(args)
        type_text(text)
        emit({'ok': True, 'action': 'type', 'chars': len(text)})
    if command == 'key':
        if not args:
            fail('key requires COMBO')
        press_combo(''.join(args))
        emit({'ok': True, 'action': 'key', 'combo': ''.join(args)})
    if command == 'activate':
        if not args:
            fail('activate requires TITLE_SUBSTRING')
        emit({'ok': True, 'window': activate_window(' '.join(args))})
    if command == 'wait':
        ms = int(args[0]) if args else 500
        time.sleep(max(0, ms) / 1000)
        emit({'ok': True, 'waitedMs': ms})
    fail(f'unknown command: {command}')


if __name__ == '__main__':
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:
        fail(error)
