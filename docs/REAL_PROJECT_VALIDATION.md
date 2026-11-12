# 真实项目验证记录

验证日期：2026-11-12。

## 项目

- `uav-yolo-offboard-tracking`：真实无人机视觉闭环项目，含 README、435 个测试、Results/Features 文档。
- `PX4-ROS2-Gazebo-YOLOv8`：真实 PX4/ROS2/Gazebo 项目，用于结构检查。

## 用例与结果

### 1. 真实 README 附件读取

把项目的 `README.md` 以附件链接发给 Bot，要求只提取 Results 三个指标，不修改文件。

结果：Bot 正确返回

- 成功率 9/9（100%）
- 着陆误差中位数 0.73 m
- 端到端延迟 p50 143 ms

附件卡片正常显示文件名、大小和分组。

### 2. 真实项目 PPT 生成

让 Bot 读取真实 README 的 Results/Features，生成 4 页 PPT。

结果：

- 生成 `_work/real-project-validation-v2.pptx`
- `python-pptx` 读取确认 **4 页**
- 内容覆盖 Results、Features、证据与边界
- Bot 在生成后立即汇报，没有继续检查 XML/字体/几何

### 3. 发现并修复的缺陷

第一次生成 PPT 时，Bot 已经生成文件，却反复检查形状几何、字体、LibreOffice，任务长时间不结束。

修复：

- 全局规则加“验证一次就够；同一类检查不要重复超过一次”。
- PPT 模板明确：只检查页数和文件存在，不检查 XML/字体/形状几何，不寻找 LibreOffice。
- 重新跑真实任务，约 35 秒内完成并汇报。

## 产物

- `_work/real-project-validation-v2.pptx`
- `_work/real-project-spec-v2.json`

产物只读取真实项目，没有修改项目文件。
