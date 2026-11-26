# GitHub 调研：浏览器适配与额度控制

调研对象：Playwright、browser-use、LiteLLM、OpenRouter、AgentsKit cost-guard 等公开仓库与文档。

## 一、浏览器适配：主流怎么做

### 1. Playwright：用一套 API 驱动 Chromium / Firefox / WebKit

Playwright 官方 README 明确写了：

> Playwright drives Chromium, Firefox, and WebKit with a single API.

并支持 headed/headless、持久化用户数据目录、浏览器上下文隔离。  
来源：<https://github.com/microsoft/playwright>

对 DSH Bot 的启示：

- 真正的跨浏览器不应依赖某个地址栏 AutomationId；
- Playwright 的 `launchPersistentContext(userDataDir)` 可以复用登录态；
- 但 Playwright 自带浏览器和客户已有浏览器是两套环境，需要明确用哪一个 profile。

### 2. browser-use：Chromium 优先，Firefox 没有通用路径

browser-use README 给出的本地浏览器方式：

```python
Browser('chromium')  # fresh local Chrome/Chromium/Edge temp profile
Browser('chrome')    # the Chrome you have open, with your logins
```

其中 `Browser('chrome')` 需要打开一次：

```text
chrome://inspect/#remote-debugging
```

以便通过 CDP 连接现有 Chrome。  
来源：<https://github.com/browser-use/browser-use>

社区对比也直接指出：

> browser-use drives a Chromium-family browser ... There is no Firefox path.

来源：<https://github.com/feder-cr/invisible_playwright_mcp/wiki/browser-use-alternatives>

这和我们实测一致：

- Edge / Chrome 成功；
- Firefox 没有可用的 UIA 地址栏，不能靠同一条 `javascript:` 注入路径。

### 3. Selenium：跨浏览器驱动，但不能接管现有会话

Selenium 可以用 `user-data-dir` 加载浏览器配置，但不能附着到“已经在运行”的浏览器会话；常见做法是复制 profile 再启动。  
参考：<https://www.volcengine.com/article/824693>  
（这是中文技术文章，不是 GitHub 仓库，仅作为 profile 复用模式的旁证。）

### 4. Playwright CLI：为 Agent 降低 token

Playwright CLI README 强调它比 MCP 更 token-efficient：

- 命令式调用，不把大工具 schema 和整棵 accessibility tree 塞进上下文。

来源：<https://github.com/microsoft/playwright-cli>

对额度控制的直接价值：

- 页面操作应返回“动作结果摘要”，而不是整棵 UIA 树；
- 与 DSH 的 `web_batch.py` 紧凑输出方向一致。

## 二、额度控制：主流怎么做

### 1. LiteLLM：预算不是单一 max_tokens，而是分维度账本

LiteLLM 的虚拟 Key / Team Budget 文档包含：

- `max_budget`：金额预算；
- `budget_duration`：预算重置周期（如 `1d`）；
- `model_max_budget`：按模型单独设限；
- Team budgets：团队级消费汇总。

来源：

- <https://github.com/BerriAI/litellm>
- <https://github.com/BerriAI/litellm/blob/main/docs/my-website/docs/proxy/team_budgets.md>
- <https://github.com/BerriAI/litellm/blob/main/litellm/proxy/management_endpoints/key_management_endpoints.py>

关键设计：

1. 预算绑定到 key/user/team，不只是一个全局数字；
2. 预算有**时间窗口**，会周期重置；
3. 可以按模型设不同额度。

### 2. OpenRouter：先读余额，再判断平台限额

OpenRouter Limits 文档列出：

- 免费模型每分钟/每天请求限制；
- 平台级 credits / key 限额；
- `GET /api/v1/key` 和 `GET /api/v1/credits` 可查询当前 key 与 credits。

来源：<https://github.com/openrouterteam/docs/blob/main/api_reference/limits.mdx>

关键设计：

- 客户端应先查询余额和限额，而不是等调用失败；
- 免费额度和付费额度是不同维度。

### 3. AgentsKit cost-guard：观察 usage，超预算立即 abort

AgentsKit 的 cost-guarded chat 示例：

- 监听 `llm:end` 事件；
- 累加 `promptTokens` / `completionTokens`；
- 按价格表计算成本；
- 超过预算调用 `abort()`；
- 建议增加 per-tool 预算、per-user Redis 配额、用 tiktoken 在调用前估算 system prompt。

来源：<https://github.com/AgentsKit-io/agentskit/blob/main/apps/docs-next/content/docs/reference/recipes/cost-guarded-chat.mdx>

关键设计：

- 先记账，再决定是否继续；
- 预调用估算与事后结算结合；
- 支持用户级累计额度。

### 4. Cost Guard 模式：预扣 + 原子账本 + 价格表

`mjmirza/patterns` 的 cost-guard 文档指出几个真实失败模式：

- check-then-act 竞态：两个并发请求都读到“未超预算”，结果超支；
- 解决：原子 increment-and-check，或先 reservation 再 settle；
- 价格表过期、cached input 折扣没算，会让账本和真实账单不一致；
- 估算式 pre-call 检查快但可能偏离账单。

来源：<https://github.com/mjmirza/patterns/blob/main/patterns/17-ai-agentic/cost-guard.md>

对 DSH 的启示：

- 当前 `checkRunBudget` 是“用后检查”，不是预扣；
- 单 Agent 串行时竞态较小，但多 Agent/并发委托时仍需要原子预留；
- 只算 input/output 不够，reasoning/cached input 必须分项。

### 5. Prompt caching：缓存命中按折扣价，额度必须按实际计费口径记账

公开案例显示，Anthropic prompt caching 的缓存命中输入通常按约 10% 价格计费，可带来 30–90% 成本下降。

来源：<https://github.com/kudratsingh/arxiv-research-agent/pull/28/commits/fa47e045877a318553c70a1ca010efa0d9cc5e9e>

启示：

- 额度账本要记录 `cachedInputTokens`，不能把所有 input 都按全价算；
- 重复任务优先缓存稳定上下文，减少重复计费。

## 三、对 DSH Bot 的直接结论

### 浏览器

1. **不要继续扩展地址栏注入来假装全浏览器通用**。它只适合 Chromium 系。
2. 真正通用的方向是浏览器驱动层：
   - Chromium：CDP / Playwright attach 或 persistent profile；
   - Firefox：Playwright Firefox 或 WebDriver/Marionette；
   - 不支持的环境：UIA 回退，并明确告知能力边界。
3. 不要默认操作客户现有浏览器 profile；优先临时 profile，登录态用复制 profile 或显式授权。
4. 每次执行前做能力探测：
   - 浏览器类型/版本；
   - 是否有可复用 profile；
   - 是否能开 CDP / WebDriver；
   - 页面是否 CSP 限制脚本。

### 额度

1. 从“单任务 maxTokens”升级为**账本**：
   - 按任务、Bot、天/月累计；
   - 预扣 + 结算；
   - 输入、输出、reasoning、cached input 分项。
2. 加预算周期和告警：
   - 50% / 80% / 90%；
   - 达到上限取消并 checkpoint；
   - 运行前估算，余额不足直接拒绝。
3. 减少消耗：
   - 批量 DOM 操作，不把 45 次动作放进模型上下文；
   - 工具输出摘要化；
   - prompt caching / 稳定前缀；
   - 禁用重复读取整页。
4. 价格与额度分离：
   - 当前 DSH 只统计 token；若客户按费用看，需要价格表；
   - 价格表必须可配置，避免写死后过期。

## 四、建议的落地顺序

### P0

- 保留 `web_batch.py` 作为 Chromium 快速路径；
- 增加能力探测和明确回退；
- 不把 Firefox 标成支持。

### P1

- 引入 Playwright（Chromium/Firefox/WebKit）作为可选驱动层：
  - `channel=chrome/msedge` 复用本机浏览器；
  - `launchPersistentContext` 复制 profile；
  - 与现有 UIA 并存，失败自动回退。

### P2

- Token 账本：预扣、原子结算、周期预算、分项 token；
- UI 显示当前任务/线程/周期剩余；
- 价格表和缓存 token 分开记。

### P3

- 基准测试：
  - 60 题填表：<10 秒、0 滚动；
  - 预算超限测试：不超支、不无限重试；
  - 三浏览器冒烟：Edge / Chrome / Firefox 至少能打开页面并执行一次脚本。

## 五、来源

- [microsoft/playwright](https://github.com/microsoft/playwright)
- [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli)
- [browser-use/browser-use](https://github.com/browser-use/browser-use)
- [browser-use alternatives: Firefox gap](https://github.com/feder-cr/invisible_playwright_mcp/wiki/browser-use-alternatives)
- [BerriAI/litellm](https://github.com/BerriAI/litellm)
- [LiteLLM team budgets](https://github.com/BerriAI/litellm/blob/main/docs/my-website/docs/proxy/team_budgets.md)
- [OpenRouter limits](https://github.com/openrouterteam/docs/blob/main/api_reference/limits.mdx)
- [AgentsKit cost-guarded chat](https://github.com/AgentsKit-io/agentskit/blob/main/apps/docs-next/content/docs/reference/recipes/cost-guarded-chat.mdx)
- [Cost guard patterns](https://github.com/mjmirza/patterns/blob/main/patterns/17-ai-agentic/cost-guard.md)
- [Prompt caching cost evidence](https://github.com/kudratsingh/arxiv-research-agent/pull/28/commits/fa47e045877a318553c70a1ca010efa0d9cc5e9e)
