# UI 设计参考与主题规范

更新：2026-11-12。star 数为 GitHub API 调研快照。只学习设计系统与色彩方法，不复制代码。

## 参考项目

| 项目 | Stars | 学到的点 |
|---|---:|---|
| [shadcn/ui](https://github.com/shadcn-ui/ui) | 127.9k | 中性表面 + 单一强调色；组件用 token 而不是散落颜色 |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | 98.6k | 间距/字号/圆角的有限刻度，避免随手数值 |
| [Catppuccin](https://github.com/catppuccin/catppuccin) | 19.9k | 低饱和、成套的 surface/text/accent 层级 |
| [Radix Primitives](https://github.com/radix-ui/primitives) | 19.5k | 可访问的 popover/选项状态、键盘关闭 |
| [Nord](https://github.com/nordtheme/nord) | 6.9k | 冷色主题用灰蓝/雾青，不靠高饱和霓虹 |
| [Excalidraw](https://github.com/excalidraw/excalidraw) | 135.5k | 手绘感来自克制的线条与留白，不是堆装饰 |
| [tldraw](https://github.com/tldraw/tldraw) | 51.4k | 画布/面板层级与浮层阴影 |
| [Geist Font](https://github.com/vercel/geist-font) | 3.8k | 界面字体要中性、紧凑、可读 |

## 这轮的两个主题重做

用户反馈旧「极光 / 余烬」丑。问题不是颜色不够亮，而是：
- 旧极光是高饱和青绿 + 深海军蓝，像霓虹模板；
- 旧余烬是整片棕 + 橙，表面浑浊、层级不清。

重做为：

### 雾海 Mist（原 aurora）

- 冷雾青灰底：`#0d1415`
- 面板：`#131d1e / #1a2728`
- 文字：`#e7efec`
- 强调：`#8fbcbb`（海沫）
- 辅助：`#9ccfd8`（雾青）
- 低饱和、冷色、无霓虹；强调只出现在交互/状态。

### 陶土 Clay（原 ember）

- 暖石黑底：`#191613`
- 面板：`#211d19 / #2b2520`
- 文字：`#f4ede4`
- 强调：`#d98b5f`（陶土）
- 辅助：`#e0a370`（杏色）
- 不再整片棕；用中性暖灰做层级，橙色只做点睛。

主题 ID 仍是 `aurora` / `ember`，避免已有用户的选择丢失；显示名改为「雾海 / 陶土」。

## 主题选择器

从 5 个小圆点改为：
- 顶部一个当前主题胶囊（色块 + 名称）；
- 点开显示 5 个主题卡片：名称、说明、双色预览、当前项勾选；
- 支持 Esc / 点击外部关闭；
- 选项有 `role=option` / `aria-selected` / `aria-label`，键盘和 UIA 可读。

## 设计 token 原则

- 背景、面板、面板 2、浮层、线、强线、主文字、次文字、弱文字、强调、信号、错误、警告、成功；
- 所有组件只引用 token，不写主题分支颜色；
- 对比度优先：正文不使用低对比灰；
- 一个屏幕最多一个高饱和强调；状态色只用于状态；
- 圆角 8 / 12 / 16 三档，不随意加；
- 动效 150–220ms，只用于 hover、浮层、消息进入。

## 不做什么

- 不引入第二套 UI 框架；
- 不复制 GPL/闭源组件代码；
- 不为“高级感”堆毛玻璃、发光、渐变球；
- 不用纯装饰动画干扰阅读。
