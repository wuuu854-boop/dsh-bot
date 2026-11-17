# 性能基线（2026-11-12）

环境：Windows、DSH 本机 API、6 个 Bot、25 个线程、state.json 约 1.18 MB。

## 基线

`node scripts/bench-api.mjs`（8 次采样，p50）：

| 接口 | p50 | 备注 |
|---|---:|---|
| `/state` | 5 ms | 117 KB payload |
| `/bootstrap` | 4 ms | 117 KB payload |
| `/health` | 1 ms | |
| `/team` | 3 ms | |
| `/memory` | **215 ms** | 每次调用都跑 `git rev-parse`、`git log`、`git status` |
| `/notify` | 1 ms | |

## 修复

`/memory` 的 Git 历史结果加入 5 秒 TTL 缓存：

- 缓存 key：Bot 的记忆仓库目录；
- 保存、提交、恢复记忆时主动失效；
- 不改变 API 返回结构，不改变文件内容。

修复后：

| 接口 | p50 | 冷启动 |
|---|---:|---:|
| `/memory` | **2 ms** | 约 205–215 ms |

也就是重复打开记忆面板从约 215 ms 降到约 2 ms，冷启动成本保留但只付一次。

## 状态快照瘦身

`/state` 的 `quality.recent` 之前带 16 条完整 run（每条包含完整 prompt、summary、errors 等），单 `quality` 字段约 **57.2 KB**，整个 `/state` 约 **117 KB**。

UI 实际只渲染最近 5 条，并只使用 id/status/prompt/steps/verification/时间。

改为专用 `publicQualityRun()`：

- 最近 5 条；
- prompt 截断 160；
- verification 只带 status/note；
- 全量 run 仍保留在 `state.json`，只是不从快照下发。

结果：

| 项目 | 之前 | 之后 |
|---|---:|---:|
| `quality` | 57.2 KB | **3.6 KB** |
| `/state` | 117 KB | **62 KB** |
| `/bootstrap` | 117 KB | **62 KB** |

`/state` p50 仍约 5 ms，但客户端解析和渲染的数据量减少约 47%。

## 派活列表瘦身

`/team` 之前约 **95 KB**，主要来自每条 assignment 的完整 prompt/summary/error（单条最多 4 KB）。

UI 实际只显示 summary 120 字、状态、步数、耗时和 tokens。

调整为：

- prompt 600 字；
- summary 800 字；
- error 500 字。

结果：

```text
/team：95 KB → 40 KB
```

完整记录仍保留在 `state.json`，只是列表接口不再下发大段正文。

## 安全快照瘦身

`/state.safety` 之前带 8 条完整 snapshot 和 8 条 audit，约 **12.3 KB**；UI 只显示最近 3 条 snapshot，且只需要 id/kind/reason/status/entries 数量。

改为：

- 最近 3 条；
- audit 明细不再随快照下发（仍保留 `auditCount`）；
- snapshot 只带 UI 使用的字段和 `entriesCount`。

结果：

```text
safety：12.3 KB → 0.9 KB
/state：62 KB → 51 KB
/team：95 KB → 40 KB（上一轮）
```

## 客户端轮询

之前前端固定每 **900 ms** 拉一次 `/state`，即使任务空闲、页面静置。

现在自适应：

- 运行中 / 有 stream / 有 approval / 有 question：900 ms；
- 空闲：3000 ms；
- 页面隐藏：不轮询，恢复可见时立即补一次。

空闲状态请求频率从约 67 次/分钟降到约 20 次/分钟，长会话静置时 CPU 和 API 压力更低。

## 课程 UIA 冷启动

之前每次 `course.py` 读取都启动一次 Windows PowerShell + UIAutomation，冷启动约 **2.3 s**。

新增 Python UIA 快路径：

- `uia_fast.py` 用 Python COM 直接读 Document/TextPattern；
- `uia_service.py` 是 loopback-only 的常驻服务（随机 token，空闲 5 分钟退出）；
- `uia_client.py` 按需启动并复用服务；
- 服务失败时自动回退到 `edge.py`，不改变课程行为；
- `next` / `ppt` 的点击也优先走快路径并比较文本变化。

实测本机 Course Progress 页面：

```text
旧 edge.py 读取：约 2300 ms
新快路径冷启动：约 1200–1500 ms
新快路径缓存命中：约 150–200 ms
```

## 长会话渲染

消息行 `.gb-user` / `.gb-assistant` 使用：

```css
content-visibility: auto;
contain-intrinsic-size: auto 120px/160px;
```

浏览器跳过视口外消息的布局和绘制，滚动到附近时再渲染；没有改消息内容或交互。

## 复现

```powershell
$env:DSH_HOME='C:\Users\<you>\.dsh'
node scripts/bench-api.mjs
```

可选：

```powershell
$env:DSH_BOT_BENCH_SAMPLES='20'
$env:DSH_BOT_RUNTIME='D:\path\to\runtime.json'
```

## ICVE 课程与输出（2026-11-17）

对比 6.10.0（`4756ae3`）与 6.11.0。固定 20 道合成中文选择题，全部命中本地题库，测量 `--auto --dry-run` 的标准输出（去掉末尾换行）。

| 指标 | 6.10.0 | 6.11.0 |
|---|---:|---:|
| 字符数 | 2,198 | 91 |
| UTF-8 字节 | 3,198 | 91 |
| cl100k_base token | 1,082 | 28 |

该样例工具输出 token 减少 **97.41%**。实际模型使用不同 tokenizer、缓存和对话上下文，不能把这个比例当作总账单降幅。未命中题仍需要输出题面和选项。

```powershell
# 无附加依赖，测量字符和字节
python scripts/bench-icve.py
# 可选：临时安装 tokenizer，测量样例 token
uv run --with tiktoken python scripts/bench-icve.py --tokens
```

`watch` 本地每秒检查快照，最长等待 60 秒；播放秒数推进不改变 revision，暂停、结束、题目或页面变化才提前返回。正常播放超时会报告 progressed=true，停滞则为 false。浏览器周期采集与本地读文件不消耗模型 token。稳定的课程工具说明放到 persona 中，避免在每次动态运行上下文中重复注入；缓存收益取决于宿主。

验证命令：

```powershell
node scripts/check-client.cjs
node --test scripts/test-state-recovery.mjs scripts/test-icve-extension.mjs
python -m unittest discover -s scripts -p test_icve.py
uv run --with playwright python scripts/test-icve-browser.py --browser "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --artifacts <目录>
```

本机通过：16 条 Python、5 条扩展、2 条恢复用例，版本/模块激活/含空格路径检查。Edge 157.0.4341.60 合成页面通过嵌套题目、面板不自循环、iframe 媒体事件、保存错误与重试、文本去面板、收起状态、280px 命中测试及超量题目标记。CI 使用独立 Chromium 并保存截图和探针结果。

未进行真实账号课程提交、平台计时/判分验收、DSH 宿主模型调用或费用测量。


## 6.12.0 长播放与快照可靠性（2026-11-17）

对比 6.11.0 的默认 60 秒等待和 6.12.0 的默认 300 秒等待。使用虚拟时钟和同一段连续播放 300 秒的合成媒体状态，输出以命令默认 JSON 格式计量。

| 指标 | 6.11.0 | 6.12.0 |
|---|---:|---:|
| 返回模型的等待结果 | 5 次 | 1 次 |
| 输出字符 | 1,323 | 283 |
| cl100k_base token | 470 | 102 |

等待结果数量减少 80%，样例输出 token 减少 78.3%。脚本内部仍检查播放进度；45 秒没有观察到进度会提前返回停滞，暂停、换文档、替换视频和题目变化也会返回。缺少 iframe 时标记 loading。平台的学习记录不会被这些本地等待修改。

```powershell
python scripts/bench-icve.py --watch
uv run --with tiktoken python scripts/bench-icve.py --watch --tokens
# 默认 300 秒；允许 1–600 秒
python scripts/icve_snapshot.py watch --since <revision> --timeout 300
```

这是虚拟时间下的工具输出基准，未计入真实宿主的后台通知、模型推理与缓存，也未测量模型账单。后台任务应等待完成通知；频繁询问后台状态会增加调用。

自动检查加入独立 Chromium 完整加载扩展，核对下载文件落盘、documentId、同 URL 重载和双窗口当前页隔离；页面内容使用合成课程，浏览器 profile 和下载目录均隔离。无头环境无法可靠切回操作系统窗口焦点，此项仅有事件模拟回归，真实桌面焦点恢复尚未验收。

```powershell
uv run --with playwright==1.65.2 python -m playwright install chromium
uv run --with playwright==1.65.2 python scripts/test-icve-live-extension.py --artifacts <目录>
```

浏览器接口依据：[活动标签与最近聚焦窗口](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-query)、[下载完成事件](https://developer.chrome.com/docs/extensions/reference/api/downloads#event-onChanged)。集成测试使用 [Playwright 的扩展加载方式](https://playwright.dev/python/docs/chrome-extensions)。
