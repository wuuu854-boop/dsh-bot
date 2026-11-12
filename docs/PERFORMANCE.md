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
