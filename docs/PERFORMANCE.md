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
