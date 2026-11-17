"""Compare dry-run output against a Git revision using 20 synthetic questions.

Optional token measurement: uv run --with tiktoken python scripts/bench-icve.py --tokens
"""
import argparse
import contextlib
import io
import json
import subprocess
import types
from pathlib import Path
from unittest.mock import patch

import icve_quiz
import icve_snapshot


def watch_outputs(module):
    clock = [0]
    def data():
        return {"tab": {"id": 1, "url": "https://mooc.icve.com.cn/course", "title": "课程"}, "frames": [
            {"frameId": 0, "documentId": "fixture", "media": [{"id": 1, "kind": "video", "currentTime": clock[0],
             "duration": 600, "paused": False, "ended": False, "readyState": 4, "error": None}]}]}
    revision = module.course_view(data())["revision"]
    output = []
    with patch.object(module, "read_latest", side_effect=data), patch.object(module.time, "monotonic", side_effect=lambda: clock[0]), \
            patch.object(module.time, "sleep", side_effect=lambda seconds: clock.__setitem__(0, clock[0] + seconds)):
        while clock[0] < 300:
            output.append(json.dumps(module.wait_for_change(revision), ensure_ascii=False))
    assert clock[0] == 300
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base")
    parser.add_argument("--watch", action="store_true", help="compare default wait calls over five simulated minutes")
    parser.add_argument("--tokens", action="store_true", help="measure cl100k_base tokens; requires tiktoken")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    args.base = args.base or ("f2de500a22eb45855f96202510de9eff83b39eb7" if args.watch else "4756ae3187957169e3d22bf3391a04f8399aa64e")
    current = icve_snapshot if args.watch else icve_quiz
    source = subprocess.check_output(["git", "show", f"{args.base}:scripts/{Path(current.__file__).name}"],
                                     cwd=Path(__file__).resolve().parents[1], encoding="utf-8")
    legacy = types.ModuleType("legacy_icve_quiz")
    legacy.__file__ = current.__file__
    with patch.dict("sys.modules", {"edge": types.SimpleNamespace()}):
        exec(compile(source, "legacy_icve_quiz.py", "exec"), legacy.__dict__)
    questions = [{"text": f"第 {number} 组数据中，哪一种图表适合表示时间变化趋势？",
                  "options": [{"text": label, "checked": False} for label in ("A. 折线图", "B. 饼图", "C. 散点图", "D. 箱线图")]}
                 for number in range(1, 21)]
    bank = {"items": []}
    for question in questions:
        icve_quiz.add_bank_entry(bank, question, [0])
    data = {"schema": "dsh.icve.snapshot.v1", "frames": [{"questions": questions, "text": "课程练习"}]}
    encoding = None
    if args.tokens:
        import tiktoken
        encoding = tiktoken.get_encoding("cl100k_base")
    result = {"base": args.base, "sample": "Five simulated minutes of uninterrupted playback" if args.watch
              else "20 synthetic Chinese questions, all bank-matched; dry-run output only"}
    for label, module in (("before", legacy), ("after", current)):
        outputs = []
        if args.watch:
            outputs = watch_outputs(module)
        else:
            output = io.StringIO()
            with patch.object(module, "load_snapshot", return_value=data), patch.object(module, "load_bank", return_value=bank), \
                    patch("sys.argv", ["icve_quiz.py", "--snapshot", "fixture.json", "--auto", "--dry-run"]), contextlib.redirect_stdout(output):
                assert module.main() == 0
            outputs = [output.getvalue().strip()]
            assert json.loads(outputs[0])["resolved"] == 20
        text = "\n".join(outputs)
        result[label] = {"chars": len(text), "utf8Bytes": len(text.encode("utf-8"))}
        if args.watch:
            result[label]["waitResults"] = len(outputs)
        if encoding:
            result[label]["cl100kTokens"] = len(encoding.encode(text))
    if encoding:
        result["tokenReductionPercent"] = round(100 * (1 - result["after"]["cl100kTokens"] / result["before"]["cl100kTokens"]), 2)
    report = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(report + "\n", encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
