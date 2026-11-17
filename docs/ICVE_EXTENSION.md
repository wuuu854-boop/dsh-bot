# 智慧职教（ICVE）浏览器扩展

DSH Bot 6.11.0 配合扩展 1.2.0，通过当前页面和 iframe 的结构化快照读取课程。右下角面板显示题目、控件、视频进度和同步结果。

## 安装与升级

Edge 打开 `edge://extensions`（Chrome 用 `chrome://extensions`），开启开发人员模式，加载 `browser-extension/icve-assistant`。本机目录通常为 `E:\DSH bot\dsh-bot\browser-extension\icve-assistant`。

升级后重新加载扩展并刷新已打开的课程页；DSH 插件也需要重新加载。面板的「刷新」「复制 JSON 给 DSH」「下载 JSON」可手工触发采集，`Alt+Shift+C` 可复制。

## 课程快路径

默认自动保存当前活动课程标签页的快照到系统下载目录 `dsh-icve-latest.json`。请保持待处理课程标签页可见。播放状态变化、iframe 内容变化会触发刷新，静止页面也有心跳同步。

```powershell
python scripts/icve_snapshot.py course
# 使用上一步的 revision 等待阶段、题目或播放状态变化，最多 60 秒
python scripts/icve_snapshot.py watch --since <revision> --timeout 60
```

`course` 输出 `phase`、`media`、`questions`、`actions`、`revision`。`watch` 在本地读快照，播放器秒数变化不会触发新的模型决策。返回 `changed:false, progressed:true` 时可继续等待；`progressed:false` 时检查暂停、缓冲或同步中断。视频结束只代表播放器结束，课程完成情况应读取平台记录。

动作沿用 `course.py play`、`course.py ppt`、`course.py next`，直接复用动作结果。无变化或操作失败时会返回失败/停滞，避免重复点击。

## 练习题快路径

```powershell
python scripts/icve_quiz.py --auto --dry-run
# 只给 unresolved 生成 answers.json，再合并题库结果核对
python scripts/icve_quiz.py --auto --answers answers.json --dry-run
# 需要执行并提交时
python scripts/icve_quiz.py --auto --answers answers.json --learn --submit
```

默认输出计数与未解决题目，`--verbose` 可查看完整匹配计划。缺题、iframe 未加载、题目超出单帧 100 道或答案不完整时拒绝提交。已有选择不重复点击；不同题目同名选项无法唯一定位时返回失败。

题库格式、旧数据迁移和多选示例见 [题库说明](ICVE_QUESTION_BANK.md)。

## 手动检查

`latest --brief`、`summary`、`questions`、`controls`、`read` 保留为诊断命令。自动快照缺失时可复制 JSON 后运行 `icve_snapshot.py save`；手工文件使用 `file --file <path>`。默认课程和作答命令仍要求 90 秒内的自动快照，手工文件可通过 `icve_quiz.py --snapshot <path> --dry-run` 离线核对。

## 数据与边界

- 扩展只对 `*.icve.com.cn` 生效；iframe 无权限或未加载会明确计入缺失。
- 扩展自动文件保存在下载目录，Bot 副本和题库位于 `%DSH_HOME%\storages\dsh-bot\icve`（未设置时使用 `~/.dsh`）。
- 扩展本身不上传快照。Bot 读取命令输出后，其中内容会进入所用模型的上下文；避免发送无关个人信息。
- 不采集密码值，登录/个人资料 API 被过滤，已识别的身份与令牌字段被脱敏；页面正文与链接仍可能包含个人信息。
- 考试/监考/交卷页面停止自动操作。学习记录由平台实际播放、浏览与提交结果决定。
- 已通过合成页面、iframe 和脚本回归；真实账号课程完成、平台判分和 DSH 端到端调用尚未验收。
