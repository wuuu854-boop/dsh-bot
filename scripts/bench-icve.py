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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="4756ae3187957169e3d22bf3391a04f8399aa64e")
    parser.add_argument("--tokens", action="store_true", help="measure cl100k_base tokens; requires tiktoken")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    source = subprocess.check_output(["git", "show", f"{args.base}:scripts/icve_quiz.py"],
                                     cwd=Path(__file__).resolve().parents[1], encoding="utf-8")
    legacy = types.ModuleType("legacy_icve_quiz")
    legacy.__file__ = icve_quiz.__file__
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
    result = {"base": args.base, "sample": "20 synthetic Chinese questions, all bank-matched; dry-run output only"}
    for label, module in (("before", legacy), ("after", icve_quiz)):
        output = io.StringIO()
        with patch.object(module, "load_snapshot", return_value=data), patch.object(module, "load_bank", return_value=bank), \
                patch("sys.argv", ["icve_quiz.py", "--snapshot", "fixture.json", "--auto", "--dry-run"]), contextlib.redirect_stdout(output):
            assert module.main() == 0
        text = output.getvalue().strip()
        assert json.loads(text)["resolved"] == 20
        result[label] = {"chars": len(text), "utf8Bytes": len(text.encode("utf-8"))}
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
