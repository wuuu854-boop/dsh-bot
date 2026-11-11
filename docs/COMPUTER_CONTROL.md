# 电脑操控蒸馏：GitHub 高星项目 → DSH Bot

更新：2026-11-11

## 样本（GitHub API，star 数为调研时）

| 项目 | Stars | 语言/许可 | 可蒸馏点 |
|---|---:|---|---|
| [OpenInterpreter/open-interpreter](https://github.com/OpenInterpreter/open-interpreter) | 68.9k | Rust/Apache-2.0 | 极简 computer API：screenshot / click / keyboard / display，动作少而稳定 |
| [bytedance/UI-TARS-desktop](https://github.com/bytedance/UI-TARS-desktop) | 39.6k | TypeScript/Apache-2.0 | 截图 + grounding 兜底；屏幕元数据/缩放；action schema |
| [AutoHotkey/AutoHotkey](https://github.com/AutoHotkey/AutoHotkey) | 13.5k | C++/GPL-2.0 | 窗口激活、键盘/剪贴板、热键，Windows 输入层经验 |
| [robotframework/RobotFramework](https://github.com/robotframework/RobotFramework) | 12.0k | Python/Apache-2.0 | 等待/重试/关键字分层，失败可诊断 |
| [bytedance/UI-TARS](https://github.com/bytedance/UI-TARS) | 11.7k | Python/Apache-2.0 | GUI 感知与动作空间，坐标与控件的混合策略 |
| [CursorTouch/Windows-MCP](https://github.com/CursorTouch/Windows-MCP) | 11.5k | Python/MIT | 无障碍树快照 + 元素索引；窗口/进程/剪贴板工具化 |
| [microsoft/UFO](https://github.com/microsoft/UFO) | 10.2k | Python/MIT | UIA 控件 + 应用 API 的混合控制，优先语义控件 |
| [pywinauto/pywinauto](https://github.com/pywinauto/pywinauto) | 6.4k | Python/BSD-3 | UIA backend、控件 wrapper、等待与重试 |
| [RaiMan/SikuliX1](https://github.com/RaiMan/SikuliX1) | 3.3k | Java/MIT | 图像匹配只作为最后兜底 |
| [FlaUI/FlaUI](https://github.com/FlaUI/FlaUI) | 3.2k | C#/MIT | UIA2/UIA3 树、pattern 调用、控件缓存 |
| [OpenAdaptAI/OpenAdapt](https://github.com/OpenAdaptAI/OpenAdapt) | 1.9k | Python/MIT | 记录/回放、无障碍事件与截图对齐 |
| [microsoft/WindowsAgentArena](https://github.com/microsoft/WindowsAgentArena) | 0.9k | Python/MIT | Windows agent 评测环境与可复现任务 |

没有复制上述项目的代码；只蒸馏交互模式和工程约束。

## 蒸馏出的原则

1. **语义控件优先，坐标最后**：优先 UIA 的 Invoke / SelectionItem / Toggle / ValuePattern；坐标只对 canvas、PDF、游戏、图片按钮兜底。
2. **先快照后动作**：先 `uia.py list` 拿窗口、角色、名称、值、边界、可用状态；动作后重新读取，不靠猜。
3. **动作必须可验证**：点击/输入后检查窗口标题、控件值或页面文本是否变化；没变化就停，不重复。
4. **坐标要归一化**：UIA provider 可能返回 2x 坐标（DSH 窗口就是 2x），不能直接 `SetCursorPos`；用 Win32 窗口矩形和 UIA 窗口矩形求比例。
5. **窗口/进程要可区分**：同名窗口很多，必须带 `process`、`pid`、`dpi`；激活和截图按窗口范围，不截整个桌面。
6. **等待是动作的一部分**：窗口出现、控件出现、值变化、页面加载都要有超时和明确的失败原因。
7. **截图不是默认路径**：截图只用于视觉-only 场景；能用 UIA 文本/控件就不截图，减少隐私与 token 成本。
8. **可回放**：记录窗口、元素名、动作、前后值，失败时能解释“点了什么、为什么没继续”。

## 本仓已落地

- `scripts/uia.py`
  - `list`：窗口无障碍树（role/name/value/bounds/enabled/patterns）；
  - `click`：Invoke/Select/Toggle/Expand，最后才鼠标兜底；
  - `type`：SetFocus + 键盘输入；
  - `wait`：等控件出现；
  - 坐标归一化：UIA 2x → Win32 屏幕坐标。
- `scripts/computer.py`
  - 窗口列表带 `process` / `pid` / `dpi`；
  - `window-shot`：只截目标窗口；
  - `clipboard get/set`；
  - `launch` / `wait-window`；
  - 多显示器虚拟桌面与 DPI-aware 截图。
- `scripts/edge.py`
  - Edge / Chrome / Brave / Chromium 自动选择；
  - `read --all` 跨 iframe；
  - `click --all --verify`、`wait-change`。
- `scripts/course.py`
  - 视频/PPT/题目/下一回合状态机；
  - stalled 熔断与考试页保护。

## 有意不做

- 不默认全屏截图后让模型猜坐标；
- 不引入需要管理员驱动/内核权限的远程控制；
- 不复制 GPL/闭源项目的代码；
- 不绕过验证码、DRM、考试/监考。
