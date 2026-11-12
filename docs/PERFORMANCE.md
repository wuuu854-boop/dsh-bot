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
