#!/usr/bin/env python3
"""Fast, no-scroll batch filling for browser forms.

The normal UIA path selects controls one by one. Browsers scroll each selected
radio into view, which looks like flicker on long quizzes and is slow. This
script builds one small JavaScript batch, runs it from the address bar, and
lets the page update its own controls without moving the viewport.

Answers JSON:

  {"answers": [
    {"no": 1, "kind": "choice", "answer": "B"},
    {"no": 5, "kind": "fill", "answer": "Skip-gram"}
  ]}

Commands:
  build --answers PATH [--out PATH]   write the JavaScript without running it
  fill  --answers PATH [--browser auto|edge|chrome|brave|chromium|firefox] [--timeout 3]
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import computer  # noqa: E402

ADDRESS_HELPER = ROOT / "address_exec.ps1"


SCRIPT_TEMPLATE = r"""javascript:void((()=>{
const A=__ANSWERS__;
const norm=s=>(s||'').replace(/\s+/g,'');
const docs=[document];
for(const f of document.querySelectorAll('iframe')){
  try{if(f.contentDocument)docs.push(f.contentDocument)}catch(e){}
}
const nodes=[];
for(const d of docs){
  try{nodes.push(...d.querySelectorAll('div,span,p,h1,h2,h3,h4,label'))}catch(e){}
}
const H=nodes.filter(e=>{
  try{const t=norm(e.textContent);return e.children.length===0&&/^\d+\.【/.test(t)&&t.length<160}catch(e){return false}
});
const findHeader=n=>H.find(e=>norm(e.textContent).startsWith(n+'.【'));
const setValue=(el,v)=>{
  const proto=(el instanceof HTMLTextAreaElement)?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  if(setter)setter.call(el,v);else el.value=v;
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
};
const y0=window.scrollY;
let ok=0;
const fail=[];
for(const item of A){
  const n=String(item.no);
  const h=findHeader(n);
  if(!h){fail.push(n+':header');continue}
  const isChoice=item.kind==='choice';
  let c=h;
  let radios=[];
  let fields=[];
  let found=false;
  for(let depth=0;depth<10&&c;depth++){
    c=c.parentElement;
    if(!c)break;
    radios=[...c.querySelectorAll('input[type=radio]')];
    fields=[...c.querySelectorAll('input:not([type=radio]):not([type=checkbox]),textarea,[contenteditable="true"]')]
      .filter(el=>el.offsetParent!==null||el.getClientRects().length>0);
    if(isChoice?(radios.length>=2&&radios.length<=8):(fields.length>=1)){
      found=true;
      break;
    }
  }
  if(!found){fail.push(n+':container');continue}
  if(isChoice){
    const letter=String(item.answer||'').trim().toUpperCase();
    let el=radios.find((r)=>{
      const label=(r.closest('label')||r.parentElement||r);
      const t=norm(label.textContent);
      return t.startsWith(letter+'.')||t.startsWith(letter+'、');
    });
    if(!el){
      const custom=[...c.querySelectorAll('[role="radio"],label,li,span,div')].find((x)=>{
        const t=norm(x.textContent);
        return t.length<120&&(t.startsWith(letter+'.')||t.startsWith(letter+'、'));
      });
      if(custom){custom.click();ok++;continue}
      el=radios['ABCD'.indexOf(letter)];
    }
    if(!el){fail.push(n+':option');continue}
    el.click();
    ok++;
  }else{
    const el=fields[0];
    if(!el){fail.push(n+':field');continue}
    if(el.isContentEditable){
      el.textContent=String(item.answer||'');
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    }else{
      setValue(el,String(item.answer||''));
    }
    ok++;
  }
}
const y1=window.scrollY;
const status='DSH_BATCH:'+ok+'/'+fail.join(',')+'/'+Math.round(y1-y0);
const previous=document.title;
document.title=status;
setTimeout(()=>{try{document.title=previous}catch(e){}},3000);
})())"""


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
        kind = "choice" if item.get("kind") == "choice" else "fill"
        cleaned.append({"no": no, "kind": kind, "answer": str(item.get("answer", ""))})
    if not cleaned:
        raise SystemExit("no usable answers found")
    return cleaned


def build_script(answers: list[dict]) -> str:
    payload = json.dumps(answers, ensure_ascii=False, separators=(",", ":"))
    return SCRIPT_TEMPLATE.replace("__ANSWERS__", payload)


def encode_script(script: str) -> str:
    body = script[len("javascript:"):] if script.startswith("javascript:") else script
    # atob() yields a binary string, so keep the payload ASCII and use JS
    # unicode escapes for Chinese literals. Otherwise UTF-8 bytes become mojibake
    # before eval and header/option matching silently fails.
    body = "".join(ch if ord(ch) < 128 else f"\\u{ord(ch):04x}" for ch in body)
    encoded = base64.b64encode(body.encode("ascii")).decode("ascii")
    return f"javascript:void(eval(atob('{encoded}')))"


def active_window() -> dict:
    for window in computer.list_windows():
        if window.get("active"):
            return window
    return {}


BROWSER_PROCESSES = {
    "edge": ("msedge.exe",),
    "chrome": ("chrome.exe",),
    "brave": ("brave.exe",),
    "chromium": ("chromium.exe",),
    "firefox": ("firefox.exe",),
}


def find_browser_window(browser: str = "auto") -> dict:
    windows = computer.list_windows()
    preferred = ["edge", "chrome", "brave", "chromium", "firefox"] if browser in ("", "auto") else [browser]
    if browser in ("", "auto"):
        active = next((window for window in windows if window.get("active")), {})
        active_process = str(active.get("process", "")).lower()
        if any(active_process == item for name in preferred for item in BROWSER_PROCESSES.get(name, ())):
            return active
    for name in preferred:
        processes = BROWSER_PROCESSES.get(name, ())
        for window in windows:
            process = str(window.get("process", "")).lower()
            if any(process == item or process.endswith("\\" + item) for item in processes):
                return window
    return {}


def activate_browser(browser: str = "auto") -> bool:
    target = find_browser_window(browser)
    if not target:
        return False
    try:
        # Reuse computer.py's foreground-lock-safe minimize/restore path.
        computer.activate_window(str(target.get("title") or ""))
    except Exception:
        try:
            computer.user32.SetForegroundWindow(int(target["handle"]))
        except Exception:
            pass
    time.sleep(0.25)
    return True


def execute_script(script: str, timeout: float = 3.0, browser: str = "auto") -> dict:
    """Run one script through the address bar without per-control UIA scrolling."""
    if not activate_browser(browser):
        return {"ok": False, "error": f"no supported browser window for {browser}"}
    current = active_window()
    if not current or not any(
        str(current.get("process", "")).lower().endswith(item)
        for name in BROWSER_PROCESSES.values()
        for item in name
    ):
        return {"ok": False, "error": f"active window is not a supported browser: {current.get('process')}"}
    handle = current.get("handle")
    if not handle:
        return {"ok": False, "error": "no active browser window"}
    if not ADDRESS_HELPER.exists():
        return {"ok": False, "error": f"missing helper: {ADDRESS_HELPER}"}
    payload = encode_script(script)
    fd, temp_name = tempfile.mkstemp(prefix="dsh-web-batch-", suffix=".js")
    os.close(fd)
    try:
        Path(temp_name).write_text(payload, encoding="utf-8")
        completed = subprocess.run(
            [
                "powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(ADDRESS_HELPER),
                "-File",
                temp_name,
                "-Handle",
                str(handle),
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=20,
        )
    finally:
        try:
            os.unlink(temp_name)
        except OSError:
            pass
    if completed.returncode != 0:
        return {"ok": False, "error": (completed.stderr or completed.stdout or "address helper failed")[:300]}
    deadline = time.time() + max(0.5, timeout)
    title = ""
    while time.time() < deadline:
        time.sleep(0.15)
        title = str(active_window().get("title") or "")
        if title.startswith("DSH_BATCH:"):
            break
    if not title.startswith("DSH_BATCH:"):
        return {"ok": False, "error": "batch did not report a result", "title": title[:120]}
    body = title.split("DSH_BATCH:", 1)[1].split(" - ", 1)[0]
    parts = body.split("/", 2)
    try:
        filled = int(parts[0])
    except (IndexError, ValueError):
        return {"ok": False, "error": "bad batch result", "title": title[:120]}
    failed = [item for item in parts[1].split(",") if item] if len(parts) > 1 else []
    try:
        scroll_delta = int(parts[2]) if len(parts) > 2 else None
    except ValueError:
        scroll_delta = None
    return {
        "ok": not failed,
        "filled": filled,
        "failed": len(failed),
        "failedQuestions": failed[:20],
        "scrollDelta": scroll_delta,
        "mode": "dom-batch-address",
    }


def run_batch(script: str, timeout: float = 3.0, browser: str = "auto") -> dict:
    return execute_script(script, timeout=timeout, browser=browser)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("build", "fill"):
        p = sub.add_parser(name)
        p.add_argument("--answers", required=True)
        p.add_argument("--out", default="")
        p.add_argument("--browser", default="auto", choices=["auto", "edge", "chrome", "brave", "chromium", "firefox"])
        p.add_argument("--timeout", type=float, default=3.0)
    args = parser.parse_args()
    answers = load_answers(Path(args.answers))
    script = build_script(answers)
    if args.command == "build":
        if args.out:
            Path(args.out).write_text(script, encoding="utf-8")
            print(json.dumps({"ok": True, "answers": len(answers), "chars": len(script), "out": args.out}, ensure_ascii=False))
        else:
            print(script)
        return 0
    result = run_batch(script, timeout=args.timeout, browser=args.browser)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
