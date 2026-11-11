# 高星项目蒸馏清单（2026-11-11）

目标：只吸收对「桌面 Bot 团队 + 本机执行」有用的模式，不为了追星把产品做成大杂烩。所有条目均为独立实现，未复制第三方代码或素材。

## 样本与判断

| 项目 | Stars（快照） | 许可证 | 值得蒸馏的模式 | 本轮状态 |
|---|---:|---|---|---|
| [langgenius/dify](https://github.com/langgenius/dify) | 160.9k | 自定义 | 工作流/表单式任务编排、模型与工具解耦 | 借鉴「任务模板」，不做重工作流编辑器 |
| [open-webui/open-webui](https://github.com/open-webui/open-webui) | 158.4k | 自定义 | 主题切换、模型选择、对话管理 | **已落地主题选择**（暗色/暖色/水墨） |
| [browser-use/browser-use](https://github.com/browser-use/browser-use) | 120.7k | MIT | 无障碍树/DOM 读取、act/extract/observe、少截图 | 已有 Edge UIA `read/click/type`；继续补结构化快照 |
| [All-Hands-AI/OpenHands](https://github.com/All-Hands-AI/OpenHands) | 93.2k | MIT | plan/act、沙箱执行、可恢复任务 | 已有 Boss 派活、checkpoint、重试；继续补显式计划面板 |
| [cline/cline](https://github.com/cline/cline) | 71.5k | Apache-2.0 | 计划/执行分离、checkpoint、人在环审批 | 已有快照、审批、回放；回放本轮补齐 |
| [microsoft/autogen](https://github.com/microsoft/autogen) | 61.8k | CC-BY-4.0 | 多 Agent 角色、handoff、群聊 | 已有 Boss/成员/群聊/回执 |
| [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | 60.8k | MIT | 角色化团队、任务委派、流程 | 已有按需招人/派活；不引入重型框架 |
| [block/goose](https://github.com/block/goose) | 56.5k | Apache-2.0 | MCP/扩展、桌面 Agent 工具层 | MCP 作为后续扩展点，不塞进核心 |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | 44.8k | MIT | 有状态图、可恢复执行、事件流 | 已有事件/运行记录；后续补结构化时间线 |
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | 39.5k | Apache-2.0 | 可访问性快照、稳定定位、无视觉优先 | 与 Edge UIA 思路一致；已有 `read` + 控件操作 |
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | 37.3k | 自定义 | trace、成本、健康/可观测性 | **已落地 `/health` + `/doctor`** |
| [browserbase/stagehand](https://github.com/browserbase/stagehand) | 26.0k | MIT | act/extract/observe 三原语 | `read/click/type` 已覆盖；后续加 `extract` schema |
| [letta-ai/letta](https://github.com/letta-ai/letta) | 25.4k | Apache-2.0 | 有状态记忆、可检索/可回滚 | 已有每 Bot Git 记忆与回滚 |
| [SWE-agent/SWE-agent](https://github.com/SWE-agent/SWE-agent) | 20.8k | MIT | repo map、命令/编辑闭环 | 后续为代码类任务加工作区地图 |

另含上一轮调研的 [ccch1mneyyy/dsh-Go](https://github.com/ccch1mneyyy/dsh-Go)、[JopenChen/dsh-go](https://github.com/JopenChen/dsh-go)、[coeasy/dsh-go](https://github.com/coeasy/dsh-go)。

## 本轮落地

1. **主题选择**：顶栏三个圆点，暗色 / 暖色 / 水墨，写入 `localStorage`，刷新后保持。
   - 暖色：米白纸感 + 赤陶橙 + 深棕输入区；
   - 水墨：宣纸灰 + 墨黑 + 朱砂红；
   - 暗色：原绿色荧光主题。
2. **高星模式记录**：本文件作为后续路线依据；已具备的不重复造。
3. **前几轮已落地**：Edge UIA 底层读取/填写/提交、对话回放、`/health`、`/doctor`、任务模板、按需添加专家。

## 有意不做

- Dify 式可视化工作流编辑器：当前用户是「一句话交代」，不是搭流程图。
- CrewAI/AutoGen 全套编排框架：会替换现有 DSH Session/派活/回执，收益低、迁移风险高。
- 手机端、云托管、插件市场：与「本机优先」边界冲突，暂不做。
- 复制任何 AGPL/自定义许可证代码：只蒸馏交互模式，独立实现。
