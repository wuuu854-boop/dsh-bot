#!/usr/bin/env python3
"""Creative Studio for DSH Bot: PPT, DOCX, XLSX, games, music, posters.

Local, dependency-light generation. No cloud model is required; the Bot supplies
the outline/content and this script turns it into a real deliverable.

Commands:
  ppt    --out FILE [--spec JSON_FILE | --title T --slides-json JSON]
  doc    --out FILE --markdown FILE
  sheet  --out FILE [--csv FILE | --json FILE]
  game   --out FILE [--kind snake|memory|runner] [--title T]
  music  --out FILE [--style lofi|upbeat|ambient] [--seconds N]
  poster --out FILE --title T [--subtitle S]

Examples:
  python studio.py ppt --out deck.pptx --spec outline.json
  python studio.py doc --out report.docx --markdown report.md
  python studio.py sheet --out data.xlsx --csv data.csv
  python studio.py game --out game.html --kind snake --title "霓虹贪吃蛇"
  python studio.py music --out theme.wav --style lofi --seconds 20
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import random
import struct
import sys
import wave
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

THEMES = {
    "midnight": {"bg": "0B0F12", "ink": "F4F7F5", "muted": "91A09A", "accent": "C8FF5A", "panel": "151C1F"},
    "warm": {"bg": "F6EBD8", "ink": "2F2418", "muted": "7A6954", "accent": "C26422", "panel": "FFF8EC"},
    "mono": {"bg": "F2F1ED", "ink": "171716", "muted": "6F6D66", "accent": "111111", "panel": "FFFFFF"},
    "aurora": {"bg": "07101E", "ink": "EDF5FF", "muted": "94A8C2", "accent": "6EE7B7", "panel": "101B2E"},
    "ember": {"bg": "140D09", "ink": "FFF4E8", "muted": "C3A895", "accent": "FFB454", "panel": "21150F"},
}


def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False), flush=True)
    raise SystemExit(code)


def hex_rgb(value):
    value = str(value or "000000").lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


# --------------------------------------------------------------------------- PPT
def build_ppt(out, spec):
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
    from pptx.enum.shapes import MSO_SHAPE

    spec = spec if isinstance(spec, dict) else {}
    theme = THEMES.get(str(spec.get("theme") or "midnight"), THEMES["midnight"])
    bg, ink, muted, accent, panel = [RGBColor(*hex_rgb(theme[key])) for key in ("bg", "ink", "muted", "accent", "panel")]
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    W, H = prs.slide_width, prs.slide_height
    blank = prs.slide_layouts[6]
    title = str(spec.get("title") or "Untitled deck")
    subtitle = str(spec.get("subtitle") or "")
    slides = spec.get("slides") if isinstance(spec.get("slides"), list) else []

    def add_text(slide, text, left, top, width, height, size, color, bold=False, font="Segoe UI", align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
        box = slide.shapes.add_textbox(left, top, width, height)
        frame = box.text_frame
        frame.clear()
        frame.word_wrap = True
        frame.vertical_anchor = anchor
        p = frame.paragraphs[0]
        p.alignment = align
        run = p.add_run()
        run.text = text
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.name = font
        run.font.color.rgb = color
        return box

    def background(slide):
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg
        shape.line.fill.background()
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.7), Inches(0.78), Inches(0.08), Inches(0.52))
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent
        bar.line.fill.background()

    def footer(slide, index, total):
        add_text(slide, "DSH BOT · CREATIVE STUDIO", Inches(0.75), H - Inches(0.52), Inches(5), Inches(0.3), 8, muted)
        add_text(slide, f"{index:02d} / {total:02d}", W - Inches(1.45), H - Inches(0.52), Inches(0.8), Inches(0.3), 8, muted, align=PP_ALIGN.RIGHT)

    # Cover
    cover = prs.slides.add_slide(blank)
    background(cover)
    add_text(cover, title, Inches(0.75), Inches(2.0), Inches(11.6), Inches(1.5), 40, ink, bold=True)
    if subtitle:
        add_text(cover, subtitle, Inches(0.78), Inches(3.55), Inches(10.8), Inches(0.9), 16, muted)
    add_text(cover, "CREATIVE STUDIO  /  " + str(spec.get("date") or ""), Inches(0.78), Inches(5.55), Inches(8), Inches(0.4), 8, accent)
    footer(cover, 1, len(slides) + 1)

    for index, item in enumerate(slides, start=2):
        item = item if isinstance(item, dict) else {"title": str(item)}
        slide = prs.slides.add_slide(blank)
        background(slide)
        kind = str(item.get("type") or "bullets")
        heading = str(item.get("title") or "")
        add_text(slide, heading, Inches(0.75), Inches(0.55), Inches(11.8), Inches(0.8), 25, ink, bold=True)
        if kind == "section":
            add_text(slide, str(item.get("subtitle") or ""), Inches(0.8), Inches(3.0), Inches(10.5), Inches(1.0), 20, accent)
        elif kind == "quote":
            quote = str(item.get("quote") or item.get("text") or "")
            add_text(slide, f"“{quote}”", Inches(1.0), Inches(2.1), Inches(10.8), Inches(2.2), 26, ink, bold=False)
            if item.get("source"):
                add_text(slide, f"— {item.get('source')}", Inches(1.0), Inches(4.5), Inches(8), Inches(0.5), 12, muted)
        elif kind == "stats":
            stats = item.get("items") if isinstance(item.get("items"), list) else []
            for position, stat in enumerate(stats[:3]):
                left = Inches(0.75 + position * 4.05)
                card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(2.0), Inches(3.75), Inches(2.25))
                card.fill.solid()
                card.fill.fore_color.rgb = panel
                card.line.color.rgb = accent
                add_text(slide, str(stat.get("value") or ""), left + Inches(0.25), Inches(2.25), Inches(3.2), Inches(0.8), 34, accent, bold=True)
                add_text(slide, str(stat.get("label") or ""), left + Inches(0.25), Inches(3.25), Inches(3.2), Inches(0.55), 11, muted)
        elif kind == "image":
            image = str(item.get("image") or "")
            if image and os.path.isfile(image):
                slide.shapes.add_picture(image, Inches(1.1), Inches(1.75), width=Inches(11.1))
        else:
            bullets = item.get("bullets") if isinstance(item.get("bullets"), list) else []
            body = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.7), Inches(1.5), Inches(11.9), Inches(5.25))
            body.fill.solid()
            body.fill.fore_color.rgb = panel
            body.line.color.rgb = panel
            top = Inches(1.75)
            for bullet in bullets[:7]:
                add_text(slide, f"•  {bullet}", Inches(0.95), top, Inches(11.2), Inches(0.58), 16, ink if bullet else muted)
                top += Inches(0.62)
            if item.get("note"):
                add_text(slide, str(item.get("note")), Inches(0.95), H - Inches(1.3), Inches(11), Inches(0.45), 9, muted)
        footer(slide, index, len(slides) + 1)

    Path(out).parent.mkdir(parents=True, exist_ok=True)
    prs.save(out)
    return {"ok": True, "kind": "ppt", "path": os.path.abspath(out), "slides": len(prs.slides), "theme": spec.get("theme") or "midnight"}


# --------------------------------------------------------------------------- DOCX
def build_doc(out, markdown, title=None):
    from docx import Document
    from docx.shared import Pt, Inches, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    text = Path(markdown).read_text(encoding="utf-8-sig", errors="replace") if markdown and os.path.isfile(markdown) else str(markdown or "")
    lines = text.splitlines()
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.85)
    section.bottom_margin = Inches(0.85)
    section.left_margin = Inches(0.95)
    section.right_margin = Inches(0.95)
    normal = doc.styles["Normal"]
    normal.font.name = "Microsoft YaHei"
    normal.font.size = Pt(10.5)
    normal.paragraph_format.line_spacing = 1.35
    heading = str(title or "")
    if not heading:
        heading = next((line[2:].strip() for line in lines if line.startswith("# ")), "Document")
    h = doc.add_paragraph()
    h.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = h.add_run(heading)
    run.bold = True
    run.font.size = Pt(24)
    run.font.color.rgb = RGBColor(0x18, 0x18, 0x16)
    h.paragraph_format.space_after = Pt(18)

    in_code = False
    code_lines = []
    table_lines = []
    skip_first_h1 = True

    def flush_table():
        nonlocal table_lines
        if len(table_lines) >= 2:
            rows = [[cell.strip() for cell in line.strip().strip("|").split("|")] for line in table_lines]
            if rows and all(set(cell) <= set("-: ") for cell in rows[1]):
                rows = [rows[0]] + rows[2:]
            if rows:
                table = doc.add_table(rows=len(rows), cols=max(len(row) for row in rows))
                table.style = "Light Grid Accent 1"
                for r, row in enumerate(rows):
                    for c, value in enumerate(row[: len(table.columns)]):
                        table.cell(r, c).text = value
                doc.add_paragraph()
        table_lines = []

    def style_code_paragraph(paragraph):
        from docx.oxml import OxmlElement
        from docx.oxml.ns import qn

        paragraph.paragraph_format.left_indent = Inches(0.2)
        paragraph.paragraph_format.right_indent = Inches(0.1)
        paragraph.paragraph_format.space_before = Pt(4)
        paragraph.paragraph_format.space_after = Pt(7)
        paragraph.paragraph_format.line_spacing = 1.12
        paragraph.paragraph_format.keep_together = True
        p_pr = paragraph._p.get_or_add_pPr()
        borders = OxmlElement("w:pBdr")
        left = OxmlElement("w:left")
        left.set(qn("w:val"), "single")
        left.set(qn("w:sz"), "10")
        left.set(qn("w:space"), "7")
        left.set(qn("w:color"), "8AA79A")
        borders.append(left)
        p_pr.append(borders)
        shading = OxmlElement("w:shd")
        shading.set(qn("w:val"), "clear")
        shading.set(qn("w:color"), "auto")
        shading.set(qn("w:fill"), "F3F6F4")
        p_pr.append(shading)

    for line in lines:
        if line.strip().startswith("```"):
            if in_code:
                paragraph = doc.add_paragraph()
                style_code_paragraph(paragraph)
                run = paragraph.add_run("\n".join(code_lines))
                run.font.name = "Consolas"
                run.font.size = Pt(8.2)
                run.font.color.rgb = RGBColor(0x20, 0x2A, 0x26)
                code_lines = []
            in_code = not in_code
            continue
        if in_code:
            code_lines.append(line)
            continue
        if line.strip().startswith("|") and line.strip().endswith("|"):
            table_lines.append(line)
            continue
        flush_table()
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            level = min(4, len(stripped) - len(stripped.lstrip("#")))
            heading_text = stripped[level:].strip()
            if level == 1 and skip_first_h1:
                skip_first_h1 = False
                continue
            paragraph = doc.add_heading(heading_text, level=level)
            paragraph.paragraph_format.space_before = Pt(12)
            continue
        if stripped.startswith(">"):
            paragraph = doc.add_paragraph(stripped[1:].strip())
            paragraph.paragraph_format.left_indent = Inches(0.3)
            paragraph.runs[0].italic = True
            continue
        if stripped.startswith(("- ", "* ", "+ ")):
            doc.add_paragraph(stripped[2:].strip(), style="List Bullet")
            continue
        if stripped[:2].isdigit() and stripped[2:4] in (". ", ") "):
            doc.add_paragraph(stripped[3:].strip(), style="List Number")
            continue
        paragraph = doc.add_paragraph(stripped.replace("**", ""))
        paragraph.paragraph_format.space_after = Pt(6)
    flush_table()
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    doc.save(out)
    return {"ok": True, "kind": "docx", "path": os.path.abspath(out), "paragraphs": len(doc.paragraphs)}


# --------------------------------------------------------------------------- XLSX
def build_sheet(out, csv_path=None, json_path=None, title="Data"):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.chart import BarChart, Reference
    from openpyxl.utils import get_column_letter

    rows = []
    if csv_path and os.path.isfile(csv_path):
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.reader(handle))
    elif json_path and os.path.isfile(json_path):
        data = json.loads(Path(json_path).read_text(encoding="utf-8-sig"))
        if isinstance(data, list) and data and isinstance(data[0], dict):
            headers = list(data[0].keys())
            rows = [headers] + [[item.get(key, "") for key in headers] for item in data]
        elif isinstance(data, dict) and isinstance(data.get("rows"), list):
            rows = data["rows"]
    if not rows:
        rows = [["项目", "数值"], ["示例 A", 12], ["示例 B", 28], ["示例 C", 19]]
    wb = Workbook()
    ws = wb.active
    ws.title = str(title or "Data")[:31]
    accent = "C8FF5A"
    dark = "0B0F12"
    for row in rows:
        ws.append(row)
    header = ws[1]
    for cell in header:
        cell.font = Font(bold=True, color="FFFFFF", name="Microsoft YaHei")
        cell.fill = PatternFill("solid", fgColor=dark)
        cell.alignment = Alignment(vertical="center")
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
    widths = {}
    for row in rows:
        for index, value in enumerate(row, start=1):
            widths[index] = max(widths.get(index, 8), min(48, len(str(value)) + 2))
    for index, width in widths.items():
        ws.column_dimensions[get_column_letter(index)].width = width
    thin = Side(style="thin", color="D9D9D9")
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            cell.border = Border(bottom=thin)
            cell.font = Font(name="Microsoft YaHei")
    # Chart when there are at least two numeric rows and two columns.
    numeric = [r for r in rows[1:] if len(r) >= 2 and isinstance(r[1], (int, float)) or (len(r) >= 2 and str(r[1]).replace(".", "", 1).isdigit())]
    if len(numeric) >= 2:
        chart = BarChart()
        chart.title = str(title or "Data")
        chart.height = 7
        chart.width = 14
        data_ref = Reference(ws, min_col=2, min_row=1, max_row=min(len(rows), 20))
        cats = Reference(ws, min_col=1, min_row=2, max_row=min(len(rows), 20))
        chart.add_data(data_ref, titles_from_data=True)
        chart.set_categories(cats)
        ws.add_chart(chart, "H2")
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
    return {"ok": True, "kind": "xlsx", "path": os.path.abspath(out), "rows": len(rows)}


# --------------------------------------------------------------------------- Game
GAME_SHELL = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><style>
*{{box-sizing:border-box}}body{{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(900px 500px at 70% -10%,{accent}22,transparent 60%),#070a0d;color:#edf5ff;font-family:"Segoe UI","Microsoft YaHei",sans-serif}}
.wrap{{width:min(920px,94vw);padding:22px}}.head{{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px}}
h1{{font-size:20px;margin:0;letter-spacing:.02em}}small{{color:#7f9189}}.score{{color:{accent};font:600 14px "Cascadia Code",monospace}}
canvas{{width:100%;height:auto;display:block;border:1px solid #24312c;border-radius:16px;background:#0b1110;box-shadow:0 30px 80px #0008}}
.bar{{display:flex;gap:8px;align-items:center;margin-top:10px;color:#8fa39a;font-size:12px}}.bar button{{margin-left:auto;background:{accent};color:#07100b;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}}
kbd{{border:1px solid #2c3b35;border-radius:5px;padding:1px 5px;color:#c8ff5a}}
</style></head><body><div class="wrap"><div class="head"><div><h1>{title}</h1><small>DSH BOT · CREATIVE STUDIO</small></div><div class="score" id="score">0</div></div>
<canvas id="game" width="900" height="520"></canvas><div class="bar"><span>{hint}</span><button id="restart">重新开始</button></div></div>
<script>{script}</script></body></html>"""

SNAKE_JS = r"""
const c=document.getElementById('game'),x=c.getContext('2d'),S=24,N=Math.floor(c.width/S),M=Math.floor(c.height/S);
let snake,dir,food,score,dead,timer;
function reset(){snake=[{x:8,y:8},{x:7,y:8},{x:6,y:8}];dir={x:1,y:0};score=0;dead=false;food={x:14,y:8};document.getElementById('score').textContent='0';clearInterval(timer);timer=setInterval(step,110)}
function foodAt(){do{food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*M)}}while(snake.some(p=>p.x===food.x&&p.y===food.y))}
function step(){if(dead)return;const h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(h.x<0||h.y<0||h.x>=N||h.y>=M||snake.some(p=>p.x===h.x&&p.y===h.y)){dead=true;draw();return}snake.unshift(h);if(h.x===food.x&&h.y===food.y){score+=10;document.getElementById('score').textContent=score;foodAt()}else snake.pop();draw()}
function draw(){x.fillStyle='#0b1110';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#15221c';x.lineWidth=1;for(let i=0;i<=N;i++){x.beginPath();x.moveTo(i*S,0);x.lineTo(i*S,c.height);x.stroke()}for(let j=0;j<=M;j++){x.beginPath();x.moveTo(0,j*S);x.lineTo(c.width,j*S);x.stroke()}
x.fillStyle='#c8ff5a';snake.forEach((p,i)=>{x.globalAlpha=i?0.55:1;x.beginPath();x.roundRect(p.x*S+2,p.y*S+2,S-4,S-4,6);x.fill()});x.globalAlpha=1;x.fillStyle='#ff8a4c';x.beginPath();x.arc(food.x*S+S/2,food.y*S+S/2,S*0.32,0,7);x.fill();
if(dead){x.fillStyle='#000a';x.fillRect(0,0,c.width,c.height);x.fillStyle='#fff4e8';x.font='600 28px Segoe UI';x.textAlign='center';x.fillText('游戏结束 · '+score,x.width/2,x.height/2)}}
document.addEventListener('keydown',e=>{const map={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};const d=map[e.key];if(!d)return;if(d.x===-dir.x&&d.y===-dir.y)return;dir=d;e.preventDefault()});
document.getElementById('restart').onclick=()=>{reset();draw()};reset();draw();
"""

MEMORY_JS = r"""
const c=document.getElementById('game'),x=c.getContext('2d');const emojis=['🌙','🌿','⚡','🔥','💎','🎧','🚀','🍀'];let cards,open,score,busy;
const cols=4,rows=4,cw=150,ch=118,ox=(c.width-cols*cw)/2,oy=(c.height-rows*ch)/2;
function reset(){cards=[...emojis,...emojis].sort(()=>Math.random()-.5);open=[];score=0;busy=false;document.getElementById('score').textContent='0';draw()}
function draw(){x.fillStyle='#0b1110';x.fillRect(0,0,c.width,c.height);cards.forEach((v,i)=>{const cx=ox+(i%cols)*cw+8,cy=oy+Math.floor(i/cols)*ch+8;const shown=open.includes(i);x.fillStyle=shown?'#c8ff5a':'#16241e';x.beginPath();x.roundRect(cx,cy,cw-16,ch-16,12);x.fill();if(shown){x.fillStyle='#07100b';x.font='34px Segoe UI Emoji';x.textAlign='center';x.textBaseline='middle';x.fillText(v,cx+(cw-16)/2,cy+(ch-16)/2)}})}
c.onclick=e=>{if(busy)return;const r=c.getBoundingClientRect();const px=(e.clientX-r.left)*c.width/r.width,py=(e.clientY-r.top)*c.height/r.height;const col=Math.floor((px-ox)/cw),row=Math.floor((py-oy)/ch),i=row*cols+col;if(col<0||col>=cols||row<0||row>=rows||open.includes(i))return;open.push(i);draw();if(open.length===2){busy=true;const [a,b]=open;if(cards[a]===cards[b]){score+=10;document.getElementById('score').textContent=score;open=[];busy=false;draw()}else{setTimeout(()=>{open=[];busy=false;draw()},600)}}};
document.getElementById('restart').onclick=reset;reset();
"""

RUNNER_JS = r"""
const c=document.getElementById('game'),x=c.getContext('2d');let player,obstacles,score,dead,tick;
function reset(){player={x:90,y:462,w:38,h:58,vy:0,onGround:true};obstacles=[];score=0;dead=false;tick=0;document.getElementById('score').textContent='0';loop()}
function jump(){if(player.onGround){player.vy=-13;player.onGround=false}}
document.addEventListener('keydown',e=>{if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();jump()}});c.onclick=jump;
function loop(){if(dead)return;tick++;player.vy+=0.62;player.y+=player.vy;if(player.y>=462){player.y=462;player.vy=0;player.onGround=true}
if(tick%75===0)obstacles.push({x:c.width+30,w:26,h:34+Math.random()*34});obstacles.forEach(o=>o.x-=5.2);obstacles=obstacles.filter(o=>o.x>-60);
for(const o of obstacles){if(player.x+player.w>o.x&&player.x<o.x+o.w&&player.y+player.h>520-o.h){dead=true}}
if(dead){draw();return}score+=1;if(tick%12===0)document.getElementById('score').textContent=Math.floor(score/10);draw();requestAnimationFrame(loop)}
function draw(){x.fillStyle='#0b1110';x.fillRect(0,0,c.width,c.height);x.fillStyle='#c8ff5a';x.beginPath();x.roundRect(player.x,player.y,player.w,player.h,10);x.fill();x.fillStyle='#ff8a4c';obstacles.forEach(o=>{x.beginPath();x.roundRect(o.x,520-o.h,o.w,o.h,6);x.fill()});x.fillStyle='#2a3a33';x.fillRect(0,520,c.width,6);if(dead){x.fillStyle='#000a';x.fillRect(0,0,c.width,c.height);x.fillStyle='#fff4e8';x.font='600 28px Segoe UI';x.textAlign='center';x.fillText('撞到了 · 空格重新开始',c.width/2,c.height/2)}}
document.getElementById('restart').onclick=reset;reset();
"""


def build_game(out, kind="snake", title="Mini Game", accent="#c8ff5a"):
    kind = kind if kind in ("snake", "memory", "runner") else "snake"
    script = {"snake": SNAKE_JS, "memory": MEMORY_JS, "runner": RUNNER_JS}[kind]
    hint = {"snake": "方向键移动", "memory": "点击翻牌配对", "runner": "空格 / 点击跳跃"}[kind]
    html = GAME_SHELL.format(title=title, accent=accent, hint=hint, script=script)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_text(html, encoding="utf-8")
    return {"ok": True, "kind": "game", "path": os.path.abspath(out), "game": kind, "bytes": len(html.encode("utf-8"))}


# --------------------------------------------------------------------------- Music
def midi_write(path, notes, bpm=92):
    """Minimal Standard MIDI File, format 0, one melodic track."""
    ticks_per_beat = 480
    events = []
    for start, duration, pitch, velocity in notes:
        events.append((int(start * ticks_per_beat), 0x90, int(pitch), int(velocity)))
        events.append((int((start + duration) * ticks_per_beat), 0x80, int(pitch), 0))
    events.sort(key=lambda item: (item[0], item[1]))
    track = bytearray()
    track += b"\x00\xff\x51\x03" + int(60_000_000 // max(30, bpm)).to_bytes(3, "big")
    track += b"\x00\xc0\x00"
    last = 0
    for tick, status, pitch, velocity in events:
        delta = max(0, tick - last)
        last = tick
        # variable-length quantity
        buffer = [delta & 0x7F]
        delta >>= 7
        while delta:
            buffer.append((delta & 0x7F) | 0x80)
            delta >>= 7
        track += bytes(reversed(buffer))
        track += bytes([status, pitch, velocity])
    track += b"\x00\xff\x2f\x00"
    header = b"MThd" + struct.pack(">IHHH", 6, 0, 1, ticks_per_beat)
    chunk = b"MTrk" + struct.pack(">I", len(track)) + bytes(track)
    Path(path).write_bytes(header + chunk)


def build_music(out, style="lofi", seconds=20, title="Theme"):
    style = style if style in ("lofi", "upbeat", "ambient") else "lofi"
    seconds = max(4, min(90, int(seconds or 20)))
    sr = 22050
    bpm = {"lofi": 82, "upbeat": 124, "ambient": 66}[style]
    beat = 60.0 / bpm
    bars = max(2, int(seconds / (beat * 4)) + 1)
    progression = {
        "lofi": [(0, 3, 7), (5, 8, 12), (9, 12, 16), (7, 10, 14)],
        "upbeat": [(0, 4, 7), (5, 9, 12), (7, 11, 14), (0, 5, 9)],
        "ambient": [(0, 7, 12), (2, 9, 14), (5, 12, 16), (0, 7, 11)],
    }[style]
    root = 48 if style != "upbeat" else 55
    melody_scale = [0, 2, 3, 5, 7, 8, 10] if style == "lofi" else [0, 2, 4, 5, 7, 9, 11]
    rng = random.Random(20261111)
    total = int(seconds * sr)
    samples = [0.0] * total
    notes = []
    for bar in range(bars):
        chord = progression[bar % len(progression)]
        start = bar * 4 * beat
        for index, interval in enumerate(chord):
            pitch = root + interval
            length = 4 * beat
            notes.append((start, length, pitch, 54))
        for step in range(4):
            if style == "ambient" and step % 2:
                continue
            pitch = root + 12 + melody_scale[rng.randrange(len(melody_scale))] + (12 if rng.random() < 0.2 else 0)
            notes.append((start + step * beat, beat * 0.8, pitch, 76 if style != "ambient" else 58))
    # additive synthesis with soft envelopes
    for start, duration, pitch, velocity in notes:
        begin = int(start * sr)
        length = int(duration * sr)
        freq = 440.0 * (2 ** ((pitch - 69) / 12))
        amp = (velocity / 127.0) * 0.13
        for i in range(max(0, begin), min(total, begin + length)):
            t = (i - begin) / sr
            env = min(1.0, t / 0.04) * max(0.0, 1.0 - t / max(0.05, duration))
            wave_value = math.sin(2 * math.pi * freq * t) + 0.35 * math.sin(2 * math.pi * freq * 2 * t) + 0.18 * math.sin(2 * math.pi * freq * 3 * t)
            samples[i] += wave_value * env * amp
    peak = max(0.001, max(abs(value) for value in samples))
    scale = 0.92 / peak
    pcm = bytearray()
    for value in samples:
        pcm += struct.pack("<h", int(max(-1.0, min(1.0, value * scale)) * 32767))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    with wave.open(out, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sr)
        handle.writeframes(bytes(pcm))
    midi_path = str(Path(out).with_suffix(".mid"))
    midi_write(midi_path, notes, bpm)
    return {"ok": True, "kind": "music", "path": os.path.abspath(out), "midi": os.path.abspath(midi_path), "style": style, "seconds": seconds, "bpm": bpm}


# --------------------------------------------------------------------------- Poster
def build_poster(out, title, subtitle="", accent="", theme="midnight"):
    from PIL import Image, ImageDraw, ImageFont
    palette = THEMES.get(theme, THEMES["midnight"])
    accent = accent or f"#{palette['accent']}"
    width, height = 1600, 900
    image = Image.new("RGB", (width, height), hex_rgb(palette["bg"]))
    draw = ImageDraw.Draw(image)
    # diagonal gradient wash
    for y in range(height):
        alpha = int(26 * (1 - y / height))
        draw.line([(0, y), (width, y)], fill=tuple(min(255, c + alpha) for c in hex_rgb(palette["bg"])))
    accent_rgb = hex_rgb(accent.lstrip("#"))
    draw.rounded_rectangle((90, 110, 102, 250), radius=6, fill=accent_rgb)
    font_paths = ["C:/Windows/Fonts/msyhbd.ttc", "C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
    font_path = next((item for item in font_paths if os.path.isfile(item)), None)
    title_font = ImageFont.truetype(font_path, 74) if font_path else ImageFont.load_default()
    sub_font = ImageFont.truetype(font_path, 28) if font_path else ImageFont.load_default()
    draw.text((140, 250), str(title)[:40], font=title_font, fill=hex_rgb(palette["ink"]))
    if subtitle:
        draw.text((145, 370), str(subtitle)[:90], font=sub_font, fill=hex_rgb(palette["muted"]))
    draw.text((145, height - 100), "DSH BOT · CREATIVE STUDIO", font=sub_font, fill=accent_rgb)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    image.save(out)
    return {"ok": True, "kind": "poster", "path": os.path.abspath(out), "width": width, "height": height}


def main():
    parser = argparse.ArgumentParser(description="DSH Bot Creative Studio")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("ppt")
    p.add_argument("--out", required=True)
    p.add_argument("--spec")
    p.add_argument("--title", default="Untitled deck")
    p.add_argument("--subtitle", default="")
    p.add_argument("--slides-json", default="")
    p.add_argument("--theme", default="midnight")

    d = sub.add_parser("doc")
    d.add_argument("--out", required=True)
    d.add_argument("--markdown", required=True)
    d.add_argument("--title", default="")

    s = sub.add_parser("sheet")
    s.add_argument("--out", required=True)
    s.add_argument("--csv", default="")
    s.add_argument("--json", default="")
    s.add_argument("--title", default="Data")

    g = sub.add_parser("game")
    g.add_argument("--out", required=True)
    g.add_argument("--kind", default="snake", choices=["snake", "memory", "runner"])
    g.add_argument("--title", default="Mini Game")
    g.add_argument("--accent", default="#c8ff5a")

    m = sub.add_parser("music")
    m.add_argument("--out", required=True)
    m.add_argument("--style", default="lofi", choices=["lofi", "upbeat", "ambient"])
    m.add_argument("--seconds", type=int, default=20)
    m.add_argument("--title", default="Theme")

    r = sub.add_parser("poster")
    r.add_argument("--out", required=True)
    r.add_argument("--title", required=True)
    r.add_argument("--subtitle", default="")
    r.add_argument("--accent", default="")
    r.add_argument("--theme", default="midnight")

    args = parser.parse_args()
    try:
        if args.command == "ppt":
            if args.spec and os.path.isfile(args.spec):
                spec = json.loads(Path(args.spec).read_text(encoding="utf-8-sig"))
            else:
                slides = json.loads(args.slides_json) if args.slides_json else [
                    {"title": "核心观点", "bullets": ["把复杂问题拆成可验证的小步骤", "每一步都留下证据", "最后给结论和下一步"]},
                    {"title": "数据", "type": "stats", "items": [{"value": "3×", "label": "效率提升"}, {"value": "80%", "label": "重复工作减少"}, {"value": "1", "label": "统一入口"}]},
                    {"title": "下一步", "bullets": ["确认范围", "生成初稿", "按反馈迭代"]},
                ]
                spec = {"title": args.title, "subtitle": args.subtitle, "theme": args.theme, "slides": slides}
            emit(build_ppt(args.out, spec))
        if args.command == "doc":
            emit(build_doc(args.out, args.markdown, args.title))
        if args.command == "sheet":
            emit(build_sheet(args.out, args.csv, args.json, args.title))
        if args.command == "game":
            emit(build_game(args.out, args.kind, args.title, args.accent))
        if args.command == "music":
            emit(build_music(args.out, args.style, args.seconds, args.title))
        if args.command == "poster":
            emit(build_poster(args.out, args.title, args.subtitle, args.accent, args.theme))
    except Exception as error:
        emit({"ok": False, "error": str(error)}, 1)


if __name__ == "__main__":
    main()
