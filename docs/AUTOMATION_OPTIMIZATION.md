# 自动化执行优化计划

## 已观察到的证据

- 45 题课堂测验：2 分 35 秒，45/45 成功。
- 作答过程中页面会随选中项滚动，最后停在 Q45，这是页面“闪烁/跳动”的主要来源。
- 全量 UIA 读取一次约 160KB，既慢又消耗上下文。
- 逐题 UIA 动作是 45 次跨进程调用，固定开销远大于实际逻辑。

## 已实现

### 无滚动 DOM 批处理（v6.29）

新增：

```text
scripts/web_batch.py
scripts/address_exec.ps1
```

做法：

1. 一次读取答案 JSON；
2. 生成一个 DOM 批处理脚本；
3. 用 UIA 写入地址栏并回车，脚本在页面里直接 `.click()` / `value setter`；
4. 不逐题 UIA 选中，不把控件滚进视口；
5. 只返回 `filled / failed / scrollDelta`。

本地 60 题 mock 验证：

```text
filled=60 failed=0 scrollDelta=0
elapsed=1.86s
页面保持顶部，无跳动
```

用法：

```powershell
python scripts/web_batch.py fill --answers answers.json
```

`answers.json`：

```json
{"answers":[
  {"no":1,"kind":"choice","answer":"B"},
  {"no":5,"kind":"fill","answer":"Skip-gram"}
]}
```

### 跨浏览器兼容

`web_batch.py` 不再写死 Edge 窗口和地址栏 AutomationId：

- 支持 `--browser auto|edge|chrome|brave|chromium|firefox`；
- 通过进程名找到浏览器窗口；
- 地址栏按顶部位置和宽度查找，兼容 Chromium 系不同语言/版本；
- 用 `Ctrl+L` + 地址栏 ValuePattern 注入，不依赖固定控件 ID；
- 结果只返回摘要。

实测矩阵：

| 浏览器 | 结果 |
|---|---|
| Edge | 60/60，scrollDelta 0 |
| Chrome | 60/60，scrollDelta 0 |
| Brave / Chromium | 同 Chromium 引擎，预期可用，未实机验证 |
| Firefox | 当前 Firefox 不暴露 UIA 地址栏；批处理会明确报错，需回退 UIA |

Firefox 返回 `address bar not found` 时，不重试、不静默失败；继续用现有 UIA/人工路径。

已实现：

- 预算统计包含 `input + output + reasoning` token；
- 50% token 提醒 + 剩余量；
- 80% 预警；
- 90% “下一步后可能停止”预警；
- 经济/标准/深度/自定义档位；
- 设置页显示本线程累计 token、当前任务 token 和单任务上限。

## 待完成

- 富文本/附件类作业仍使用剪贴板/坐标路径，下一步合并成一个批处理；
- ICVE 页面若被 CSP 拦住 `javascript:`，回退到 UIA 并明确报告；
- 运行前 token 预估和 90% 预停止；
- 把本批处理接入更多通用表单。

### 1. 无闪烁批处理

目标：

- 一次读取页面结构，不逐题读；
- 优先使用 `InvokePattern` / `ValuePattern`，避免会强制滚动的 `SelectionItemPattern.Select()`；
- 所有改动离屏完成，保持 `scrollY` 不变；
- 最后统一校验、统一提交。

验收：

- 45 题全部成功；
- 0 次可见滚动；
- 总耗时 < 10 秒；
- 提交前只有一次确认。

### 2. 紧凑输出

自动化脚本只返回摘要：

```json
{"ok":true,"filled":45,"failed":0,"scrollChanged":false,"elapsedMs":4200}
```

不再把整棵 UIA 树或整页文本作为一次工具结果返回。  
目标：单次批处理工具输出 < 5KB，题库类任务 token 消耗降到当前的 1/10 以下。

### 3. Token 额度治理

已实现：

- 预算统计包含 `input + output + reasoning` token，不再漏算推理 token；
- token 使用到 50% 提醒一次，并显示剩余量；
- 80% 预警；
- 设置页提供经济/标准/深度三档，以及自定义；
- 设置页显示本线程累计 token 和单任务上限；
- 运行记录/任务统计同步计入 reasoning token。

下一阶段：

- 运行前估算输入上下文，超出预算时先提示；
- 可选的 90% 预停止，避免一次调用直接冲过 100%；
- 按天/按 Bot 的累计额度，而不只是单任务；
- 运行结束显示 token 明细和本任务占比；
- 自动化脚本使用紧凑输出，减少上下文消耗。

## 验收指标

| 指标 | 目标 |
|---|---|
| 45 题批处理 | 45/45，0 失败 |
| 可见滚动 | 0 次 |
| 批处理耗时 | < 10 秒 |
| 单次工具输出 | < 5KB |
| token 预警 | 50% / 80% |
| 硬停止 | 不超过单任务上限 |
| 预算漏算 | reasoning token 不再漏算 |

## 不做

- 不引入浏览器扩展；
- 不改变模型路由；
- 不加新的业务功能；
- 不为了速度跳过提交前校验。
