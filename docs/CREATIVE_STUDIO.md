# Creative Studio：创作能力与高星参照

更新：2026-11-11。star 数为 GitHub API 调研时快照；只蒸馏交互与工程模式，没有复制项目代码。

## 能力 → 高星参照

| 能力 | 高星项目 | Stars | 本仓实现 |
|---|---|---:|---|
| AI PPT / 演示 | [Presenton](https://github.com/presenton/presenton)、[PPTAgent](https://github.com/icip-cas/PPTAgent)、[Slidev](https://github.com/slidevjs/slidev)、[Marp](https://github.com/marp-team/marp) | 11.9k / 5.2k / 49.4k / 12.7k | `studio.py ppt`：16:9、主题、封面、bullets/stats/quote/section |
| 文档 | [python-docx](https://github.com/python-openxml/python-docx)、[MarkItDown](https://github.com/microsoft/markitdown) | 5.8k / 194.9k | `studio.py doc`：Markdown → DOCX，标题/表格/列表/引用/代码 |
| 表格 | [XlsxWriter](https://github.com/jmcnamara/XlsxWriter)、[openpyxl](https://openpyxl.readthedocs.io/) | 4.0k / — | `studio.py sheet`：CSV/JSON → XLSX，表头、冻结、筛选、宽度、柱状图 |
| 小游戏 | [Phaser](https://github.com/phaserjs/phaser)、[Three.js](https://github.com/mrdoob/three.js)、[pygame](https://github.com/pygame/pygame) | 40.7k / 118.1k / 9.0k | `studio.py game`：单文件 HTML，snake/memory/runner |
| 音乐 | [ACE-Step](https://github.com/ace-step/ACE-Step)、[Audiocraft](https://github.com/facebookresearch/audiocraft)、[Magenta](https://github.com/magenta/magenta)、[Tone.js](https://github.com/Tonejs/Tone.js) | 5.0k / 23.8k / 19.8k / 14.9k | `studio.py music`：本地合成 WAV + MIDI，lofi/upbeat/ambient |
| 海报/视觉 | [Excalidraw](https://github.com/excalidraw/excalidraw)、[ComfyUI](https://github.com/comfyanonymous/ComfyUI) | 135.5k / 146.3k | `studio.py poster`：渐变、标题、主题色 PNG |
| 图表/数据 | [ECharts](https://github.com/apache/echarts)、[D3](https://github.com/d3/d3) | 67.7k / 113.9k | XLSX 原生图表；数据整理交给 pandas/CSV |
| 视频 | [Remotion](https://github.com/remotion-dev/remotion)、[FFmpeg](https://github.com/FFmpeg/FFmpeg) | 72.4k / 67.0k | 本机未装 FFmpeg/LibreOffice，暂不做视频渲染；可先产出 PPT/HTML/图片脚本 |

## 使用

```powershell
# PPT
python scripts/studio.py ppt --out deck.pptx --spec deck.json

# 文档
python scripts/studio.py doc --out report.docx --markdown report.md

# 表格
python scripts/studio.py sheet --out data.xlsx --csv data.csv --title "月度数据"

# 游戏
python scripts/studio.py game --out game.html --kind snake --title "霓虹贪吃蛇"

# 音乐
python scripts/studio.py music --out theme.wav --style lofi --seconds 20

# 海报
python scripts/studio.py poster --out poster.png --title "本地创作" --subtitle "..." --theme ember
```

### PPT spec

```json
{
  "title": "标题",
  "subtitle": "副标题",
  "theme": "aurora",
  "slides": [
    { "title": "核心观点", "bullets": ["要点 1", "要点 2"] },
    { "title": "关键数据", "type": "stats", "items": [{ "value": "3×", "label": "效率" }] },
    { "title": "引用", "type": "quote", "quote": "一句话", "source": "来源" }
  ]
}
```

## 设计边界

- 本机没有云端图片/视频/大音乐模型，不假装能生成 Midjourney/Suno 级内容；
- 当前用**确定性模板 + 本地合成**，保证离线、可复现、可继续迭代；
- 需要真正的图像/音乐模型时，走 DSH 已接入的模型或本机 ComfyUI/ACE-Step，不把大模型塞进插件；
- 所有产物写到用户指定路径，生成后必须检查文件存在、可打开、页数/行数/时长正确。
