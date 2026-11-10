# 竞品调研与借鉴清单（2026-11-10）

调研对象是 GitHub 上「模仿 GrokBot、跑在 DeepSeek Harness 上」的几个代表项目。
本文件记录：它们各自的重心、我们对比后的差距、这一版（v4.0）借鉴了什么、以及**故意没做**什么。

## 一、样本

| 项目 | Star（调研时） | 形态 | 重心 |
|---|---|---|---|
| [BotHarness/DeepSeekBot（Tobs）](https://github.com/BotHarness/DeepSeekBot) | 762 | DSH 插件（TypeScript monorepo） | 有身份的 Bot 团队：Git 记忆、群聊、Assignment、Bot 市场、IM、像素头像、CLI |
| [aibot-fans/dsh-bot](https://github.com/aibot-fans/dsh-bot) | 38 | DSH 插件 | Super-agent 接活 → 交给对口的群 → 组长/成员分工 → 结果回群；Grok Pages、共享浏览器 |
| [omdsh-dev/dsh-bot](https://github.com/omdsh-dev/dsh-bot) | 4 | DSH 插件 + 飞书/如流 | 原生多 Bot 聊天：每个 Bot 独立 Session，`@handle` / `@all` 路由，群内派活 |
| [tencent-connect/dsh-qqbot](https://github.com/tencent-connect/dsh-qqbot) | 569 | 通道插件 | 只是把 QQ 接进 DSH，不是 Bot 团队形态 |
| [Kr-ATG/dsh-seeker-bot](https://github.com/Kr-ATG/dsh-seeker-bot) | 5 | DSH 插件 | 双栏执行大盘、可交互卡片、Bot 团队/群聊/语音、七个工作台 |

结论：**高星项目的共同点不是工具更多，而是「多 Bot 在一个频道里协作」这层产品形态**。
Tobs 的 762 星主要由三件事撑起来：Git 可审阅记忆、群聊 + 委派、把 Bot 带出 DSH（IM、市场）。

## 二、和我们的差距（v3.1 → v4.0 前）

| 能力 | Tobs | omdsh | 我们 v3.1 | 判断 |
|---|---|---|---|---|
| 多个 Bot 在同一对话 | 群聊 + @ | 群聊 + `@handle`/`@all` | ❌ 只有独立 Bot，各自开任务 | **最大缺口** |
| Bot 之间派活 | Assignment + 报告 | 回复里 `@handle 任务` | ❌ README 自己写明「没有编排器」 | **核心缺口** |
| 记忆 | 每个 Bot 一个 Git 工作树，可 diff / 回滚 / 推 GitHub | Markdown 记忆 | ⚠️ 每 Bot 一个 `memory.md`，无历史 | 值得补 |
| 发言归属 | 每个 Bot 名字/头像/颜色 | 按 Bot 名称头像 | ⚠️ 单 Bot 视角，无「谁说的」 | 群聊必需 |
| CLI | 每个功能都有 CLI，lint 强制 parity | 部分 | ❌ 无 | Agent 可操作性缺口 |
| IM（飞书/Slack/Discord/微信） | ✅ | ✅ | ⚠️ 只有 QQ 通知 + QQ 远程控制 | 暂不扩 |
| Bot 市场 / zip 导入导出 | ✅ | ❌ | ❌ | 暂不做 |
| 定时任务 | ✅ | ✅ | ✅ 已有一等公民（例程） | 保持 |
| 审批 | 可交给审核模型 | 原生审批 | ✅ 继承 DSH + `bot_ask` | 保持 |
| 本机操作（电脑/浏览器/AI） | Computer 组件 | 浏览器 | ✅ 我们更深（GUI、代理硬闸、隔离 Firefox） | 保持优势 |

我们的优势不在「Bot 团队」而在**本机执行纵深**：截图/GUI、Clash 代理硬闸、防火墙隔离、
QQ 通知与远程控制、安全快照、预算、验收、技能库。所以 v4.0 不重做这些，只补形态缺口。

## 三、v4.0 借鉴并落地的

1. **频道 = 一等公民（借 Tobs / omdsh）**
   新增 `kind: group` 的群聊线程，成员 2–3 个 Bot。每个成员仍保有自己的 DSH Session、
   persona、模型、工作区、记忆、预算和审计——不是把多个角色塞进一个 prompt。

2. **@ 点名路由（借 omdsh 的 `@handle` / `@all`）**
   消息里 `@名字` 只发给被点名成员；`@all` / `@全员` / 不 @ 发给全员。
   每个成员收到独立的群上下文前导，回复带自己的名字和头像出现在同一时间线。

3. **跨 Bot 派活（借 Tobs 的 Assignment、omdsh 的群内派活）**
   新增 `bot_dispatch(bot, task)` 工具：成员在自己的 Session 里把子任务派给另一位成员，
   对方独立执行并把结果发回群里；同一请求最多 3 次，不能派给自己或派回去。

4. **看得见的记忆（借 Tobs 的 Git 记忆）**
   每个 Bot 的记忆迁到 `storages/dsh-bot/memory/<botId>/` 并初始化为 Git 仓库；
   每次保存自动 commit，`记忆` 页可看提交列表、diff、一键回滚。没有 Git 时退化为普通文件。

5. **CLI parity（借 Tobs 的「所有能力都要能被 Agent 无 UI 驱动」）**
   `scripts/bot_cli.mjs` 覆盖 bots / tasks / groups / status / send / new / stop /
   group create|delete / memory get|set|history|diff|restore，输出单个 JSON。

6. **发言人归属（借 omdsh 的身份标注）**
   Host 合并快照时给每条 assistant / activity 打上 `botId` + `speaker`；
   前端按成员渲染头像、名字、模型和工具轨迹归属。

7. **老大 + 专家团队（借 aibot-fans 的 Super-agent、Tobs 的 Assignment）**
   新增 `role: lead` 的「老大」Bot：只跟用户对话，`bot_delegate` 把任务派给专家，
   专家在自己的 Session 执行，回执自动回到老大；老大验收后汇报。每次派活都有独立线程
   和 UI 卡片，可审计。模板同时提供「磁盘清理」「大学事务」两个专家和一个幂等的初始化入口。

8. **自建员工（借 aibot-fans 的「没有对口群就建群」）**
   老大发现现有成员不匹配时，用 `bot_hire` 新建专家：自动分配工作区、记忆、模型和权限，
   再派活。一次请求最多 2 个，避免团队无限膨胀。

9. **每日晨会（本项目新增）**
   当天第一次打开 DSH 时自动开全员群：每人从自己的运行记录总结 36 小时工作，老大出纪要。
   竞品有定时简报/定时任务，但没有把全员拉进一个群、各自汇报再汇总的日会机制；这解决的
   是「多 Bot 长期运行后，用户不知道谁做了什么」的问题。

## 四、故意没做（以及原因）

| 没做 | 原因 | 什么时候值得做 |
|---|---|---|
| Bot 市场 / zip 导入导出 | 需要服务端审核、签名和迁移格式，收益偏社区冷启动 | 有第二个用户要分享 Bot 时 |
| 飞书 / Slack / Discord / 微信接入 | 每个平台一套鉴权、限流、重连；我们已有 QQ 通道覆盖通知和远程控制 | 你确实要在某个 IM 里长期用 |
| 像素头像生成器 | 纯装饰；当前 emoji 头像已能区分成员 | 需要对外展示时 |
| 手机配对 / Tailscale | 涉及网络暴露面，和「凭证不出本机」的取舍冲突 | 明确要手机远程时 |
| Super-agent 自动建群 | 已用「老大 + 专家」的私聊派活覆盖；自动建群仍不做，避免模型自己组织结构难以审计 | 群聊稳定后再评估 |

## 五、验证方式

- 建群 / 改名 / 删群：`/channel/create`、`/channel/update`、`/channel/delete` 实测返回成员与快照。
- `@DSH` 只触发 DSH；不加 @ 时 DSH 与 AI 调度都回复，前端显示两个发言人。
- `bot_dispatch` 实测：DSH 派活给 AI 调度 → 群里收到 `DISPATCH_OK` → DSH 回 `DISPATCH_SENT`。
- 记忆：临时 Bot 连续两次保存生成 2 个 commit，diff 可读，回滚后内容与旧版逐字一致，非法 sha 被拒。
- UI：群列表、群头成员、@ 快捷条、建群弹窗、记忆版本历史与 diff 均在本机 DSH 窗口截图验证。
- 团队：老大 → 磁盘清理 0.65 秒返回 C 盘剩余空间与命令证据；老大 → 大学事务建成 17 目录/16 文件并复核；两次派活都有独立线程、回执卡片和工具轨迹。
- 自建员工：老大招「软件盘点 📦」并派活，产出 469 条清单，验收后汇报。
- 晨会：首次打开自动触发，5 位成员发言 + 老大纪要；`lastDate` 一天一次；晨会不触发 QQ 通知。
