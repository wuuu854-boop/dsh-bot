# ICVE 题库对照与批量作答

6.11.0 先查本地题库，只把 `unresolved` 交给模型。题库位于 `%DSH_HOME%\storages\dsh-bot\icve\question-bank.json`，未设置 `DSH_HOME` 时使用 `~/.dsh`。个人题库不随插件发布。

## 匹配与旧题库

新条目保留题干、选项文字和答案索引。题干去掉序号与选项尾部，保留大小写、数学符号；唯一题干和相同选项集合才能复用答案，选项重排后按文字重新定位。

```json
{
  "version": 1,
  "items": [{
    "q": "哪一个选项是有效颜色？",
    "questionKey": "哪一个选项是有效颜色？",
    "options": ["A. 红色", "B. 半径"],
    "answers": [0],
    "source": "model"
  }]
}
```

旧版仅有索引的条目继续保留，但需要核对一次当前选项并用 `--learn` 保存，之后才会自动复用。题干短于 6 字、存在多条匹配或重复选项文字时返回未解决。损坏题库会报错，避免覆盖原数据。

## 使用

```powershell
python scripts/icve_quiz.py --auto --dry-run
# 只为 unresolved 写答案文件
python scripts/icve_quiz.py --auto --answers answers.json --dry-run
# 核对后批量点击；按任务需要增加 --submit
python scripts/icve_quiz.py --auto --answers answers.json --learn
```

```json
{"answers":[{"question":"1","choice":"A"},{"question":"2","choices":["A","C"]}]}
```

`question` 可用本次快照的完整题干、唯一片段或题号；多选使用 `choices` 数组。`--auto --answers` 会合并题库与补充答案，补充答案优先。仅传 `--answers` 时文件必须覆盖全部待提交题目。

默认 dry-run 只给出计数、`readyToSubmit` 和 `unresolved`；`--verbose` 加入已匹配计划。执行时已有正确选择不再点击，有冲突选择或同名选项不能唯一定位时报告失败。所有题目完整且点击成功才可提交。`--learn` 记录本次成功选择的答案，不表示平台已判分正确。

## 导入

```powershell
python scripts/icve_bank.py seed --file <answers.md>
python scripts/icve_bank.py stats
```

支持表格 `| # | 类型 | 分值 | 我的答案 | 依据 | 题干 |`，答案沿用从 0 开始的索引。导入表没有完整选项文字，因此导入或覆盖的条目也需要上述一次核对。

只支持有选项的普通练习；填空题使用其他页面工具。考试/监考/交卷页保持停止。题库命中率、平台接受结果及真实模型费用须在实际课程中另行验证。
