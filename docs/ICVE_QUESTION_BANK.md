# ICVE 题库对照与批量作答

## 目标

让 Bot 做智慧职教选择题时先查本地题库，只把没命中的题交给模型，减少 token 和点击等待。

## 本地题库

位置：

```text
storages\dsh-bot\icve\question-bank.json
```

格式：

```json
{
  "version": 1,
  "items": [
    {
      "q": "Matplotlib中用于...的函数是（）。",
      "normalized": "matplotlib中用于...的函数是",
      "answers": [3],
      "type": "单选",
      "source": "py_quiz/answers.md"
    }
  ]
}
```

- `answers` 是选项索引，0 开始；
- 题库只在本机，不随插件发布；
- 本次从已做过的两个 ICVE 测验答案表导入 **63 道**。

## 导入题库

```powershell
python scripts/icve_bank.py seed --file <answers.md>
python scripts/icve_bank.py stats
```

`answers.md` 支持之前任务生成的表格：

```text
| # | 类型 | 分值 | 我的答案 | 依据 | 题干 |
```

## Bot 快路径

```powershell
# 1. 读取扩展自动快照
python scripts/icve_snapshot.py latest

# 2. 题库先匹配；全部命中时直接提交
python scripts/icve_quiz.py --auto --dry-run
python scripts/icve_quiz.py --auto --submit

# 3. 有未命中时，只为这些题生成 answers.json
python scripts/icve_quiz.py --answers answers.json --learn --submit
```

`--auto` 的输出只包含：

- `resolved`：题库命中并点击的题数；
- `unresolved`：未命中的题面 + 选项，供模型最小化作答；
- `failed`：点击失败的题。

不会把整份快照或全部题干重新交给模型。

## Token 控制

- 全命中：模型只看到一条命令结果，不生成答案；
- 部分命中：只把 `unresolved` 的题面发给模型；
- 提交前先 `--dry-run` 或 `--auto --dry-run`，不把失败当成功；
- `--learn` 把本次成功答案回填题库，下次直接命中。

## 边界

- 题库按题干归一键匹配，题干重复或选项顺序变化时会跳过，不硬套答案；
- 只支持选项题（单选/多选/判断），填空题仍走普通 UIA；
- 考试/监考/交卷页面仍然硬停止；
- 题库答案来自本人已完成的测验记录，提交前应人工复核。
