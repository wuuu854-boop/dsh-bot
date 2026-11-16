# 智慧职教（ICVE）浏览器扩展

## 目的

DSH Bot 以前靠 `edge.py` 的 UIA 读取 ICVE 页面。ICVE 大量使用 iframe 和动态组件，UIA 读到的文本不稳定，Bot 容易靠猜。

这个扩展把 ICVE 页面整理成结构化 JSON，Bot 点一下「复制 JSON 给 DSH」，再用本地脚本读取即可。

## 组成

- `browser-extension/icve-assistant/`：Edge / Chrome Manifest V3 扩展。
- `scripts/icve_snapshot.py`：Bot 侧读取/保存/查询快照。
- 扩展安装目录和说明见 [扩展 README](<../browser-extension/icve-assistant/README.md>)。

## 扩展界面

页面右下角：

```text
DSH 智慧职教助手
2 帧 · 7 控件 · 2 题面 · 0 API
已就绪 · 21:39:33
[刷新] [复制 JSON 给 DSH] [下载 JSON]
```

- 「复制 JSON 给 DSH」把结构化快照写入剪贴板。
- 「下载 JSON」把快照保存成文件。
- `Alt+Shift+C` 是复制快捷键。

## 安装

Edge 地址栏打开：

```text
edge://extensions
```

开启「开发人员模式」→「加载解压缩的扩展」→ 选择：

```text
E:\DSH bot\dsh-bot\browser-extension\icve-assistant
```

安装后扩展 ID 会显示在扩展页；本机已安装为解压缩扩展，更新文件后点「重新加载」即可。

## Bot 使用

扩展默认自动保存最新快照到下载目录的 `dsh-icve-latest.json`，Bot 先跑：

```powershell
python scripts/icve_snapshot.py latest
python scripts/icve_snapshot.py summary
python scripts/icve_snapshot.py questions
python scripts/icve_snapshot.py controls
python scripts/icve_snapshot.py read
```

选择题批量作答：

```powershell
python scripts/icve_quiz.py --answers answers.json --dry-run
python scripts/icve_quiz.py --answers answers.json --submit
```

`answers.json`：

```json
{"answers":[{"question":"1. ...","choice":"A"},{"question":"2. ...","choice":"图片"}]}
```

`--dry-run` 只校验题目/选项匹配；匹配失败会返回 `failed`，不会硬点。

脚本会自动在系统下载目录里找 `dsh-icve-latest*.json`；找不到时才回退到按钮复制：

```powershell
python scripts/edge.py click --name "复制 JSON 给 DSH"
python scripts/icve_snapshot.py save
```

## 数据安全

- 快照只在本机 `storages\dsh-bot\icve\latest.json`。
- 不采集密码输入值。
- 跳过登录/个人资料接口，并对手机号、真实姓名、学号、头像、学校/班级和 token 字段脱敏。
- `icve_snapshot.py` 会再次执行同样的脱敏，旧快照或手工粘贴也不会把个人字段写进 Bot 状态。
- 不上传任何页面内容。
- 提交作业仍然走正常页面点击，不自动提交。
