# 全能 Bot 功能地图：高星项目蒸馏

更新：2026-11-11。star 数为调研时 GitHub API 返回值。

项目只用于验证交互模式和工程取舍，**没有复制代码**。

## 功能 → 高星参照

| 现有/新增能力 | 高星参照 | Stars | 蒸馏结论 |
|---|---|---:|---|
| 多 Bot 团队、群聊、例会 | [CrewAI](https://github.com/crewAIInc/crewAI) / [AutoGen](https://github.com/microsoft/autogen) / [MetaGPT](https://github.com/geekan/MetaGPT) | 60.8k / 61.8k / 71.2k | 角色 + 派活 + 回执；不引入整套编排框架，沿用 DSH Session |
| 定时任务/例程 | [n8n](https://github.com/n8n-io/n8n) | 210.1k | 触发器→步骤→回执；用 DSH 原生 schedule，不另起工作流引擎 |
| 长期记忆 | [Mem0](https://github.com/mem0ai/mem0) / [Letta](https://github.com/letta-ai/letta) | 68.8k / 25.4k | 每 Bot 独立 Git 记忆；先做可读可回滚，不把记忆藏进黑盒向量库 |
| 网页 Agent | [browser-use](https://github.com/browser-use/browser-use) / [Stagehand](https://github.com/browserbase/stagehand) | 120.7k / 26.0k | 读页面状态→动作→验证；UIA 优先，坐标最后 |
| 电脑操控 | [Windows-MCP](https://github.com/CursorTouch/Windows-MCP) / [UFO](https://github.com/microsoft/UFO) / [UI-TARS](https://github.com/bytedance/UI-TARS-desktop) | 11.5k / 10.2k / 39.6k | 无障碍树 + 元素语义动作 + 截图兜底 |
| Windows 控件细节 | [pywinauto](https://github.com/pywinauto/pywinauto) / [FlaUI](https://github.com/FlaUI/FlaUI) | 6.4k / 3.2k | Invoke/Select/Toggle、等待、重试、窗口/进程定位 |
| 操作回放 | [OpenAdapt](https://github.com/OpenAdaptAI/OpenAdapt) | 1.9k | 记录动作前后状态；现有 replay + 活动时间线继续用 |
| 键鼠/窗口 | [AutoHotkey](https://github.com/AutoHotkey/AutoHotkey) | 13.5k | 激活窗口、组合键、剪贴板 |
| 通用 computer API | [OpenInterpreter](https://github.com/OpenInterpreter/open-interpreter) | 68.9k | 动作少而稳：截图/点击/输入/窗口，不让模型记几十个命令 |
| GUI 基准 | [WindowsAgentArena](https://github.com/microsoft/WindowsAgentArena) | 0.9k | 任务要可复现、可判定成功 |
| OCR 兜底 | [Tesseract](https://github.com/tesseract-ocr/tesseract) | 77.5k | canvas/PDF/图片题才 OCR；中文需 chi_sim 语言包 |
| 文档解析 | [MarkItDown](https://github.com/microsoft/markitdown) | 194.9k | 文档先转文本/结构，再让模型读；本仓已有 docx/pptx/xlsx/PDF 工具链 |
| 深度调研 | [GPT-Researcher](https://github.com/assafelovic/gpt-researcher) | 30.6k | 先列问题→多来源→交叉验证→带链接报告 |
| Agent 工作台 | [OpenHands](https://github.com/All-Hands-AI/OpenHands) / [Dify](https://github.com/langgenius/dify) | 93.2k / 161.0k | 任务、工具、记忆、可观测性放一个工作台；不搬云平台 |
| 可观测性 | [Langfuse](https://github.com/langfuse/langfuse) | 37.3k | 每次运行有耗时、token、工具轨迹；已有 `/health`、replay、stats |
| 语音 | [Whisper](https://github.com/openai/whisper) | 112.5k | 本地优先；Windows 用 Win+H，避免浏览器 SpeechRecognition 不稳定 |
| 工具协议 | [MCP servers](https://github.com/modelcontextprotocol/servers) | 91.9k | 工具边界清楚、参数结构化；本仓用 CLI + Host API，不强行上 MCP |
| 本地隔离 | Windows Sandbox / Hyper-V | — | 没有云电脑：优先 Windows Sandbox；不可用时独立浏览器 profile + 独立工作区 |

## 本仓已落地

1. **团队**：Boss + 按需专家、派活、回执、群聊、例会、记忆、技能。
2. **浏览器**：Edge / Chrome / Brave / Chromium 自动选择；`read --all` 跨 iframe；`click --all --verify`；`course.py` 刷课状态机。
3. **电脑**：`uia.py` 无障碍树 + 语义点击/输入；`computer.py` 窗口 process/pid/dpi、窗口截图、剪贴板、launch、wait-window。
4. **视觉兜底**：`ocr.py` Tesseract 本地 OCR；`window-shot` 只截目标窗口。
5. **本地记忆检索**：`memory_search.py` 全文搜记忆、任务标题、群聊记录；中文子串，零上传。
6. **站点适配**：ICVE/智慧职教、超星/学习通、智慧树、学堂在线返回 iframe/防循环提示。
7. **隔离**：`sandbox.py` 本地工作台；Windows Sandbox 可用则开一次性桌面，否则独立浏览器 profile + 工作区。
8. **模板**：作业、阅读、清理、复盘、深度调研、隔离工作台、OCR、电脑体检、智慧职教/刷课。
9. **新手引导**：4 步上手 + 侧边栏「使用指引」。
10. **可观测**：健康检查、replay、活动时间线、token/耗时统计、失败卡。

## 不做的部分

- 不复制 GPL/闭源代码；
- 不做云电脑/云托管，数据留在本机；
- 不默认全屏截图，不把隐私画面发给模型；
- 不绕过验证码、DRM、考试/监考；
- 不为了“全能”引入第二套 Session/编排/记忆系统，避免把现有产品做散。
