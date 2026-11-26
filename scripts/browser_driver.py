#!/usr/bin/env python3
"""Optional Playwright browser driver for DSH Bot.

This is the cross-browser path. It requires the optional `playwright` package:
  pip install playwright
  python -m playwright install firefox     # only for Firefox

Chromium channels use the customer's existing Edge/Chrome installation, so no
Chromium browser download is normally needed.

Commands:
  status
  fill --answers PATH --url URL [--browser auto|edge|chrome|firefox|webkit]
       [--profile PATH] [--cdp-url URL] [--headless]

The fill command only fills; it never submits. Output is a compact JSON object.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import tempfile
import time
from pathlib import Path

FILL_FUNCTION = r"""(answers) => {
  const norm = (s) => (s || '').replace(/\s+/g, '');
  const docs = [document];
  for (const f of document.querySelectorAll('iframe')) {
    try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {}
  }
  const nodes = [];
  for (const d of docs) {
    try { nodes.push(...d.querySelectorAll('div,span,p,h1,h2,h3,h4,label')); } catch (e) {}
  }
  const allHeaders = nodes.filter((e) => {
    try {
      const t = norm(e.textContent);
      return /^\d+\.\u3010/.test(t) && t.length < 160;
    } catch (e) { return false; }
  });
  const leafHeaders = allHeaders.filter((e) => e.children.length === 0);
  const headers = leafHeaders.length ? leafHeaders : allHeaders;
  const findHeader = (n) => headers.find((e) => norm(e.textContent).startsWith(n + '.\u3010'));
  const setValue = (el, v) => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, v); else el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const y0 = window.scrollY;
  let filled = 0;
  const failed = [];
  for (const item of answers) {
    const n = String(item.no);
    const header = findHeader(n);
    if (!header) { failed.push(n + ':header'); continue; }
    const isChoice = item.kind === 'choice';
    let container = header;
    let radios = [];
    let fields = [];
    let found = false;
    for (let depth = 0; depth < 10 && container; depth++) {
      container = container.parentElement;
      if (!container) break;
      radios = [...container.querySelectorAll('input[type=radio]')];
      fields = [...container.querySelectorAll('input:not([type=radio]):not([type=checkbox]),textarea,[contenteditable="true"]')]
        .filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);
      if (isChoice ? (radios.length >= 2 && radios.length <= 8) : fields.length >= 1) {
        found = true;
        break;
      }
    }
    if (!found) { failed.push(n + ':container'); continue; }
    if (isChoice) {
      const letter = String(item.answer || '').trim().toUpperCase();
      let el = radios.find((r) => {
        const label = r.closest('label') || r.parentElement || r;
        const t = norm(label.textContent);
        return t.startsWith(letter + '.') || t.startsWith(letter + '\u3001');
      });
      if (!el) {
        const custom = [...container.querySelectorAll('[role="radio"],label,li,span,div')].find((x) => {
          const t = norm(x.textContent);
          return t.length < 120 && (t.startsWith(letter + '.') || t.startsWith(letter + '\u3001'));
        });
        if (custom) { custom.click(); filled++; continue; }
        el = radios['ABCD'.indexOf(letter)];
      }
      if (!el) { failed.push(n + ':option'); continue; }
      el.click();
      filled++;
    } else {
      const el = fields[0];
      if (!el) { failed.push(n + ':field'); continue; }
      if (el.isContentEditable) {
        el.textContent = String(item.answer || '');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        setValue(el, String(item.answer || ''));
      }
      filled++;
    }
  }
  return { filled, failed, scrollDelta: Math.round(window.scrollY - y0) };
}"""


SYSTEM_BROWSERS = {
    "edge": [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ],
    "chrome": [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ],
}


def system_browser_path(name: str) -> str:
    for candidate in SYSTEM_BROWSERS.get(name, []):
        if Path(candidate).exists():
            return candidate
    return ""


def choice_browser(requested: str, playwright) -> str:
    if requested not in ("", "auto"):
        return requested
    for name in ("edge", "chrome"):
        if system_browser_path(name):
            return name
    try:
        if Path(playwright.firefox.executable_path).exists():
            return "firefox"
    except Exception:
        pass
    return "edge"


def load_answers(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    answers = data.get("answers") if isinstance(data, dict) else data
    if not isinstance(answers, list):
        raise SystemExit("answers JSON must be a list or contain an answers list")
    cleaned = []
    for item in answers:
        if not isinstance(item, dict):
            continue
        try:
            no = int(item.get("no"))
        except (TypeError, ValueError):
            continue
        cleaned.append({
            "no": no,
            "kind": "choice" if item.get("kind") == "choice" else "fill",
            "answer": str(item.get("answer", "")),
        })
    if not cleaned:
        raise SystemExit("no usable answers found")
    return cleaned


def playwright_module():
    try:
        from playwright.sync_api import sync_playwright
    except Exception as error:
        return None, error
    return sync_playwright, None


def copy_profile(source: str, browser: str) -> str:
    src = Path(source)
    target = Path(tempfile.mkdtemp(prefix="dsh-browser-profile-"))
    ignore = shutil.ignore_patterns(
        "Cache", "Code Cache", "GPUCache", "DawnGraphiteCache", "DawnWebGPUCache",
        "ShaderCache", "Service Worker", "Crashpad", "SingletonLock", "SingletonCookie",
        "SingletonSocket", "lockfile", "LOCK", "*.lock",
    )
    if browser == "firefox":
        shutil.copytree(src, target, dirs_exist_ok=True, ignore=ignore)
    elif (src / "Default").exists() or (src / "Local State").exists():
        # Playwright Chromium expects the user-data parent of Default.
        shutil.copytree(src, target, dirs_exist_ok=True, ignore=ignore)
    else:
        # Common customer input: .../User Data/Default
        shutil.copytree(src, target / "Default", dirs_exist_ok=True, ignore=ignore)
    return str(target)


def status() -> dict:
    sync_playwright, error = playwright_module()
    result = {
        "ok": bool(sync_playwright),
        "playwright": bool(sync_playwright),
        "browsers": {},
        "note": "Chromium channels use installed Edge/Chrome; Firefox needs 'python -m playwright install firefox'",
    }
    if error:
        result["error"] = str(error)
        return result
    with sync_playwright() as p:
        for name, browser_type in (("edge", p.chromium), ("chrome", p.chromium), ("firefox", p.firefox), ("webkit", p.webkit)):
            try:
                channel = {"edge": "msedge", "chrome": "chrome"}.get(name)
                system_path = system_browser_path(name)
                bundled_path = browser_type.executable_path
                result["browsers"][name] = {
                    "executable": system_path or bundled_path,
                    "bundled": bool(not channel and bundled_path and Path(bundled_path).exists()),
                    "channel": channel,
                }
            except Exception as caught:
                result["browsers"][name] = {"error": str(caught)[:160]}
    return result


def fill(args) -> dict:
    sync_playwright, error = playwright_module()
    if error:
        return {
            "ok": False,
            "error": "playwright is not installed",
            "hint": "pip install playwright; for Firefox also: python -m playwright install firefox",
        }
    answers = load_answers(Path(args.answers))
    started = time.time()
    temp_profile = None
    playwright = sync_playwright().start()
    context = None
    browser = None
    try:
        args.browser = choice_browser(args.browser, playwright)
        if args.cdp_url:
            browser = playwright.chromium.connect_over_cdp(args.cdp_url)
            context = browser.contexts[0] if browser.contexts else browser.new_context()
            page = context.pages[0] if context.pages else context.new_page()
        else:
            profile = args.profile
            if profile:
                temp_profile = copy_profile(profile, args.browser)
                user_data_dir = temp_profile
            else:
                temp_profile = tempfile.mkdtemp(prefix="dsh-browser-profile-")
                user_data_dir = temp_profile
            if args.browser in ("edge", "chrome"):
                context = playwright.chromium.launch_persistent_context(
                    user_data_dir,
                    channel="msedge" if args.browser == "edge" else "chrome",
                    headless=args.headless,
                    args=["--start-maximized"],
                )
            elif args.browser == "firefox":
                context = playwright.firefox.launch_persistent_context(
                    user_data_dir,
                    headless=args.headless,
                )
            else:
                context = playwright.webkit.launch_persistent_context(
                    user_data_dir,
                    headless=args.headless,
                )
            page = context.pages[0] if context.pages else context.new_page()
        if args.url:
            page.goto(args.url, wait_until="domcontentloaded", timeout=45_000)
            page.wait_for_timeout(500)
        if not page.url or page.url == "about:blank":
            return {"ok": False, "error": "no page URL; pass --url or --cdp-url"}
        result = page.evaluate(FILL_FUNCTION, answers)
        result["ok"] = not result.get("failed")
        result["mode"] = "playwright"
        result["browser"] = args.browser
        result["elapsedMs"] = int((time.time() - started) * 1000)
        return result
    except Exception as caught:
        return {"ok": False, "error": str(caught)[:500], "browser": args.browser}
    finally:
        try:
            if context:
                context.close()
            if browser:
                browser.close()
        except Exception:
            pass
        try:
            playwright.stop()
        except Exception:
            pass
        if temp_profile:
            try:
                shutil.rmtree(temp_profile, ignore_errors=True)
            except Exception:
                pass


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("status")
    p = sub.add_parser("fill")
    p.add_argument("--answers", required=True)
    p.add_argument("--url", default="")
    p.add_argument("--browser", default="auto", choices=["auto", "edge", "chrome", "firefox", "webkit"])
    p.add_argument("--profile", default="")
    p.add_argument("--cdp-url", default="")
    p.add_argument("--headless", action="store_true")
    args = parser.parse_args()
    if args.command == "status":
        print(json.dumps(status(), ensure_ascii=False))
        return 0
    if args.browser == "auto":
        args.browser = "edge"
    result = fill(args)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
