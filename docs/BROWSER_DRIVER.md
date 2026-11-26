# 跨浏览器驱动（可选 Playwright）

## 为什么需要

`web_batch.py` 通过浏览器地址栏执行页面脚本，只适合 Chromium 系：

- Edge / Chrome：可用；
- Firefox：没有可用的 UIA 地址栏，必须换驱动。

`browser_driver.py` 是跨浏览器路径，使用 Playwright：

- Edge：本机 `msedge` channel；
- Chrome：本机 `chrome` channel；
- Firefox：Playwright Firefox；
- WebKit：Playwright WebKit。

## 安装

```powershell
python -m pip install playwright
```

Edge / Chrome 使用本机浏览器，不需要下载 Chromium：

```powershell
python scripts/browser_driver.py status
```

Firefox 需要下载 Playwright 版 Firefox：

```powershell
python -m playwright install firefox
```

## 用法

```powershell
python scripts/browser_driver.py fill `
  --answers answers.json `
  --url "https://example.com/form" `
  --browser auto
```

- `--browser auto`：优先本机 Edge，其次 Chrome，再 Firefox；
- `--browser firefox`：指定 Firefox；
- `--profile "C:\Users\...\Edge\User Data"`：复制 Chromium user data；也可传 `...\User Data\Default`；
- `--profile "C:\Users\...\AppData\Roaming\Mozilla\Firefox\Profiles\xxx"`：Firefox profile 目录；
- `--cdp-url http://127.0.0.1:9222`：连接已经开着远程调试的浏览器；
- `--headless`：无界面（验证用）；
- 脚本只填值，不提交；提交仍由一次显式点击完成。

## 实测

本地 60 题 mock：

| 浏览器 | 结果 | scrollDelta | 耗时 |
|---|---|---|---|
| Edge | 60/60 | 0 | 1.28s |
| Chrome | 60/60 | 0 | 1.29s |
| Firefox | 60/60 | 0 | 2.51s |

测试使用 `--headless`，没有消耗作业提交次数。

## 限制

- Playwright 是可选依赖，不随插件强制安装；
- 默认启动新 profile，已有登录态需要 `--profile` 或 `--cdp-url`；
- 复制正在运行的浏览器 profile 可能遇到锁文件，脚本会忽略缓存/锁，但不保证所有站点登录态完整；
- `browser_driver.py` 不负责提交，避免误交。
