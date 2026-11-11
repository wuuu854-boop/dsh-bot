# DSH Bot HTTP API

所有接口都挂在 `http://127.0.0.1:<dsh-web-port>/dsh-bot/api` 下，只接受本机请求。POST 需要带 `content-type: application/json` 和 `x-dsh-bot-client: 1`；成功返回 `{ ok: true, ... }`，失败返回 `{ ok: false, error: "..." }`。

CLI 已经覆盖常用路径：`node scripts/bot_cli.mjs ...`。

## 读取

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/bootstrap` | 当前 Bot、当前线程、Bot 列表、完整快照；打开页面时调用 |
| GET | `/state?thread=<id>` | 指定线程的快照；群聊会合并成员发言、活动、派活 |
| GET | `/catalog` | 可选 Agent Preset、模型服务商和模型 |
| GET | `/health` | 版本、运行时长、状态文件大小、Bot/线程/运行/派活数、live agent、模型状态、最近错误 |
| GET | `/update` | 当前版本、GitHub 最新版本、是否可更新、release / zip 链接、检查时间与错误 |
| POST | `/update/check` | 立即重新检查 GitHub Release，返回同上 |
| GET | `/doctor` | 逐项诊断：状态目录可写、Python、Edge、模型、磁盘空间、运行时 API；返回 `checks[]` 与修复建议 |
| GET | `/memory?botId=<id>` | 记忆正文、路径、Git 历史 |
| GET | `/memory/history?botId=` | 提交列表、dirty |
| GET | `/memory/diff?botId=&sha=` | 某次提交的 diff |
| GET | `/team` | 团队名册 + 最近派活；支持 `?limit=&offset=&status=&memberId=` |
| GET | `/meeting` | 晨会日期、是否运行、上次纪要 |
| GET | `/meeting/export` | 导出全部纪要为 Markdown（`filename` + `markdown`） |
| GET | `/notify` / `/budget` | 通知与预算配置 |
| GET | `/computer?botId=` | CPU / 内存 / 磁盘 / 窗口 / 截图 |
| GET | `/screenshot` | 当前屏幕 JPEG（只读） |

## Bot

| 方法 | 路径 | body |
|---|---|---|
| POST | `/bot/create` | `{name, emoji, tagline, persona, presetId, provider, model, reasoningEffort, workspace, role, privilege, autonomy}` |
| POST | `/bot/select` | `{botId}` |
| POST | `/bot/update` | 同上，带 `botId`；改 `role` 会重开该 Bot 的 agent |
| POST | `/bot/delete` | `{botId}` |

`POST /model/refresh`：清空模型探测缓存，重新读取 DSH 当前默认模型/可用 provider，返回 `{modelReady, provider, model}`。

`role`: `member` 或 `lead`。`reasoningEffort`: `low` / `high` / `max`（`off` 也可，但 UI 不暴露）。

## 线程与消息

| 方法 | 路径 | body |
|---|---|---|
| POST | `/open` | `{threadId}` |
| POST | `/new` | `{botId?}` |
| POST | `/thread/rename` | `{threadId, title}` |
| POST | `/thread/pin` | `{threadId, pinned}` |
| POST | `/thread/reorder` | `{threadIds:[...]}`；按顺序重排置顶任务 |
| POST | `/thread/archive` | `{threadId, archived}` |
| POST | `/message/pin` | `{threadId, messageId, action?:'add'\|'remove'\|'clear'}`；最多 10 条置顶，返回 `pinnedMessages` |
| POST | `/send` | `{threadId, text, replyTo?}`；群聊里 `@名字` 只发给该成员，晨会群普通消息只发给老大；`replyTo` 引用某条消息并默认回给该 Bot |
| POST | `/stop` | `{threadId}`；群聊会停掉所有正在跑的成员；最多等 500ms 让 agent 退出 running，并直接返回最新快照 |
| POST | `/voice` | `{action:'start'\|'stop'}`；Windows 系统听写（Win+H），光标需在输入框内 |
| POST | `/delete` | `{threadId}` |
| POST | `/reset` | `{threadId}`；重建会话 |
| POST | `/retry` | `{threadId}` |
| POST | `/resume` | `{threadId}`（有 checkpoint 时） |
| POST | `/answer` | `{threadId, questionId, botId?, answers}` |
| POST | `/upload` | 附件上传（multipart 由客户端走 JSON/base64） |

## 群聊

| 方法 | 路径 | body |
|---|---|---|
| POST | `/channel/create` | `{name, emoji, memberIds}` |
| POST | `/channel/update` | `{threadId, name?, emoji?, memberIds?}` |
| POST | `/channel/delete` | `{threadId}` |
| POST | `/channel/backfill` | `{threadId, messages:[{botId, text, time}]}`（把漏掉的成员发言补进群） |
| GET | `/channel/messages` | `?threadId=&before=&limit=`；群聊历史分页，返回 `messages/hasMore/nextBefore` |
| GET | `/search` | `?threadId=&q=&limit=`；搜索当前会话；传 `scope=all` 搜索全部会话 |
| GET | `/export` | `?threadId=`；导出当前会话为 Markdown（`filename` + `markdown`） |
| GET | `/pins` | 跨会话收藏/置顶列表，最多 100 条 |

## 团队 / 晨会

| 方法 | 路径 | body |
|---|---|---|
| POST | `/team/bootstrap` | 已移除（410）；不再部署固定团队，请用 `/bot/create` 按需创建专家 |
| POST | `/team/cleanup` | `{keepRunning?}`；删除已结束派活及其线程 |
| POST | `/assignment/retry` | `{assignmentId}`；重派失败/中断的任务，回执回到原会话 |
| POST | `/meeting/run` | `{force?}`；立即补开晨会（异步，秒回 `started:true`） |
| POST | `/meeting/reset` | 删除晨会群和记录（下次打开会重建） |
| POST | `/meeting/config` | `{enabled?, weekdaysOnly?, onlyWhenWork?}`；晨会自动开关、工作日、是否有工作才开 |

## 记忆

| 方法 | 路径 | body |
|---|---|---|
| POST | `/memory` | `{botId, text}`；保存并自动 Git commit |
| POST | `/memory/restore` | `{botId, sha}`；回滚到某版 |

## 运行 / 技能 / 快照 / 例程

| 方法 | 路径 | body |
|---|---|---|
| POST | `/run/verify` | `{runId, status, note}` |
| POST | `/skill/capture` | `{threadId, runId?}` |
| POST | `/skill/run` | `{id}` |
| POST | `/skill/delete` | `{id}` |
| POST | `/snapshot/restore` | `{id}` |
| POST | `/routine/create` | `{botId, title, prompt, kind, time/weekdays/seconds/cron, enabled}` |
| POST | `/routine/update` | `{id, ...}` |
| POST | `/routine/delete` | `{id}` |
| POST | `/routine/run` | `{id}` |

## 示例

```powershell
$api = 'http://127.0.0.1:<dsh-web-port>/dsh-bot/api'
Invoke-RestMethod "$api/bootstrap"

Invoke-RestMethod "$api/send" -Method Post -ContentType 'application/json' `
  -Headers @{ 'x-dsh-bot-client' = '1' } `
  -Body (@{ threadId = '<threadId>'; text = '让专家盘点 C 盘' } | ConvertTo-Json)

Invoke-RestMethod "$api/bot/create" -Method Post -ContentType 'application/json' `
  -Headers @{ 'x-dsh-bot-client' = '1' } `
  -Body (@{ name = '报税'; tagline = '报税与发票'; persona = '你负责报税与发票核对'; role = 'member' } | ConvertTo-Json)
```

## 安全边界

- 只接受 loopback；跨站 `Origin` 会被拒绝。
- POST 带 `x-dsh-bot-client: 1` 才放行，防止普通网页误触。
- 破坏性工具调用前会做安全快照；磁盘级操作（format / diskpart / Clear-Disk）硬拒绝。
- 密钥、token 不进入 API 响应；记忆 diff 只读本 Bot 的仓库。
