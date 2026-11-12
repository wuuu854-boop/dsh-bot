# DSH Bot v5.29.0






















**An open-source GrokBot alternative that runs a real bot team on your own Windows machine, inside DeepSeek Harness.**

You talk to one **Boss**. It decides what to do, hires a specialist when nobody fits, delegates real work to bots that each keep their own DSH session, workspace and memory, then reviews the receipts and reports back. Every morning it runs a stand-up where the whole team reports what they did.

![Architecture](architecture.svg)

## Highlights

- **Polished DOCX code blocks** — fenced Markdown code now gets a shaded panel, left border, tighter spacing and monospace text instead of reading as plain body copy.

- **Real-project validation** — validated README attachment extraction and 4-slide PPT generation against the real `uav-yolo-offboard-tracking` project.
- **Over-verification fix** — the Bot now verifies creative outputs once (file exists/page count) and reports instead of inspecting XML/fonts/geometry or hunting LibreOffice indefinitely.

- **SVG safety fix** — SVG uploads now render as generic files instead of inline thumbnails, avoiding broken previews and script-capable SVG in the app origin.

- **Grouped attachments + zoom** — images/PDF/sheets/code/files are grouped with counts and type icons; the lightbox supports wheel/buttons/keyboard zoom, drag pan, and double-click reset.
- **Accessible toast + shared empty states** — one toast component with `role=status`, aria-live, close button and Esc; routine/skill empty states share one component.

- **Zoom/pan lightbox** — buttons, wheel, keyboard `+`/`-`/`0`, drag panning, and a percentage indicator.
- **File-type icons + shared empty state** — image/PDF/sheet/code icons in attachment cards; routine and skill empty states now share one component and focus styling.

- **Attachment size labels** — uploaded files now show their size next to the name, e.g. `image.png · 64 KB`.
- **Save & run verified in the UI** — routine created, immediate run started, thread opened; test data cleaned.

- **Save & run routines** — a new “保存并运行” action creates/updates the routine, runs it immediately, and opens the resulting thread.
- **Lightbox download** — image preview now downloads through a UTF-8 attachment response.

- **Lightbox download** — the image preview now has a download action; the file endpoint supports `Content-Disposition` with a UTF-8 filename.

- **Routine onboarding** — the empty state now offers three starter templates (daily summary, weekly file review, hourly task check); choosing one fills the form, cancel leaves no routine behind.

- **Multi-image lightbox** — left/right arrows, ArrowLeft/ArrowRight, wrap-around navigation and a `1 / N` counter, distilled from shadcn/Radix dialog patterns.

- **Full-screen image lightbox** — portal-based dialog with Radix/shadcn semantics, Esc/backdrop close, visible labeled close button, and focus handling.
- **Cleaner failure cards** — inline attachment markup is stripped too, so abort cards no longer leak raw paths.

- **Cleaner failure cards** — abort cards strip attachment Markdown and legacy thread titles are cleaned on load, so raw paths no longer dominate the sidebar or error card.

- **Image thumbnails** — image attachments now show a real 28px preview inside the card, served by a same-origin endpoint restricted to the uploads directory.

- **Upload cleanup** — unreferenced attachment files older than 30 days are removed at boot and every 6 hours; files still referenced by runs, assignments, skills, or group messages are kept.

- **Attachment cards** — attachments now render as named cards with a copy-path action in both user and assistant messages; raw paths stay available to the Bot.
- **Clean titles** — attachment messages use the first line as the thread title instead of dumping the whole Markdown payload.

- **Readable attachments** — files now appear as named Markdown links instead of raw absolute paths; the link still carries the local path so the Bot can read it.

- **Group routing choice** — choose “全员” or “群主” per group; leader routing sends unmentioned messages to the leader and `@all` still reaches everyone.
- **Group editor cap fixed** — member picks now allow 8, not 3; meeting routing uses the configured leader instead of a missing role tag.

- **Group routing choice** — choose “全员” or “群主” per group; leader routing sends unmentioned messages to the leader and `@all` still reaches everyone.
- **Group editor cap fixed** — member picks now allow 8, not 3; meeting routing uses the configured leader instead of a missing role tag.

- **QQ remote loop is live** — the poll timer was missing; `/status` from QQ now executes and replies. Verified with a real `/status` message and a “DSH 远程状态” response.
- **QQ chat window + verified send** — separate contact windows are detected, direct JSON is accepted, and desktop notifications only return success after the message is visible in the chat.

- **Honest schedules** — Cron is disabled in the routine editor because the local scheduler only supports daily/weekly/every; no more saves that can never run.
- **Verified** — attachment upload → Bot reads file → reply, voice start/stop, group create/send/backfill/delete, routine create/run/delete.

- **QQ remote works again** — the helper timeout was 40 ms instead of 40 s; fixed, plus real contact-mismatch guidance and a doctor check for comtypes.

- **Routines work offline** — daily/weekly/every routines use a local scheduler while DSH is open; no dependency on the optional DSH schedule service, and create → run → stop → delete is verified.

- **Cleaner skills + diagnostics** — noisy auto-captured skills are removed; `doctor` now validates the DSH runtime Python and pptx/docx/openpyxl/Pillow imports.

- **Templates that actually run** — creative/course templates now expand to the DSH runtime Python and absolute script paths, so PPT/DOCX/XLSX/game/music commands do not fail on a Bot workspace or a Python without bundled libraries.

- **Refined themes** — Mist and Clay replace the harsh Aurora/Ember palettes; the theme picker now shows names, descriptions and dual-color previews.

- **Safer UI** — a render error now shows a safe-mode card with retry/copy diagnostics instead of a blank page; course cache only serves an active browser window.

- **Faster ICVE** — fast text reads only the active tab/window, 3s cache, `progress` counts completed/pending, and action results are reused instead of full re-reads.
- **Bot settings fixed** — existing bots save again; `/bot/update` accepts `id`/`botId`, and admin confirmation is required only when elevating a standard bot.

- **Creative Studio** — `studio.py` generates real PPTX, DOCX, XLSX, playable single-file games, WAV+MIDI music and posters locally; templates and a creative capability map are included.

- **Command center** — `Ctrl+K` opens quick actions (new task, add specialist, memory, guide, theme) plus global search across messages, thread titles and all bot memories.
- **Task difficulty + five themes** — simple / standard / hard changes reasoning depth and verification; dark, warm, ink, Aurora and Ember are switchable and persisted.
- **Local workbench** — OCR fallback, isolated browser profile/workspace, local memory full-text search, multi-browser UIA and the course runner are bundled.

- **Boss + specialists** — `老大` is the only bot you talk to. `bot_delegate` assigns work; receipts come back automatically; assignment cards show steps, duration and tokens.
- **Self-hiring** — if no teammate fits, the Boss uses `bot_hire` to create one (workspace, memory, model, persona) and delegates immediately. Test run: hired `软件盘点` and produced a 469-row installed-software inventory.
- **Daily stand-up** — first DSH open of the day creates a ☀️ group with every bot; each reports from its own 36-hour run history; the Boss writes the minutes. Configurable: off, weekdays only, or only when there was work.
- **Group chats** — 2–8 bots in one channel, `@name` routing, `bot_dispatch`, speaker-attributed replies, persisted group transcript.
- **Git-backed memory** — each bot's memory is a Git repo with history, diff and one-click restore.
- **Model + effort** — every bot uses the current latest model; only reasoning effort differs (lead `max`, members `high`; `low` is clamped).
- **Browser coverage** — Edge / Chrome / Brave / Chromium are selected automatically (active browser first), with `--browser` and `DSH_BOT_BROWSER` overrides; normal pages use UI Automation text + controls before any screenshot.
- **Semantic PC control** — `uia.py` lists the accessibility tree and invokes/selects/toggles controls by name; `computer.py` exposes window process/DPI, window-only screenshots, clipboard, launch and wait-window. UIA 2x coordinates are normalized, screenshots are fallback only.
- **New-user guide** — first launch shows a 4-step guide (how to ask, specialists on demand, templates/memory/voice, browser and approval behavior); the sidebar keeps a “使用指引” entry.
- **Course runner** — `course.py status/play/ppt/question/answer/next` for self-paced ICVE/智慧职教 pages, with stalled-action circuit breaker and exam-page guard.
- **Replay + health** — replay a thread timeline from the top bar; `GET /health` reports version, uptime, state size, counts, live agents, model status and last error.
- **Instant stop** — `/stop` cancels immediately, returns the fresh snapshot, and the UI clears running/stream state before the round-trip finishes; measured 62 ms while an agent was running.
- **CLI + HTTP API** — `bot_cli.mjs` and `docs/API.md` cover bots, threads, groups, team, meeting, memory, routines and skills.

## Install

```powershell
git clone https://github.com/wuuu854-boop/dsh-bot.git
# In DSH: plugin_manager install_bundle <path>\dsh-bot
# or link it in the target profile package.json:
#   "@local/dsh-bot": "link:<path>/dsh-bot"
```

Then talk to the default **老大** bot; click **添加专家** only when you need a specialist — no preset team is deployed.

## Verified locally

- Team template idempotent; 6 bots (`DSH`, `AI 调度`, `老大`, `磁盘清理`, `大学事务`, `软件盘点`).
- Boss → disk cleanup: C-drive free-space query returned in 0.65 s with command evidence.
- Boss → university: 17 directories / 16 files + a 10-item “missing info” README; Boss re-scanned and verified.
- Auto-hire: `软件盘点` produced 469 rows (123 apps / 147 UWP / 55 framework / 142 system / 2 winget).
- Group dispatch receipt: Boss → `软件盘点` file check → receipt back to Boss → Boss reported 572/470 lines.
- Daily stand-up: six members reported, Boss produced minutes; once per day.
- Cleanup: three rounds freed **28.33 GB** of cache and old backups with pre-delete manifests; live data and a running WSL distro were left untouched.
- `smoke-team.mjs` 13/13; `e2e-team.mjs --yes --delegate` passed (real model direct reply + delegation).
- Edge helper opens/navigates; multi-monitor capture returned 4480×1600 across a 2560×1600 + 1920×1080 setup.

## Known limits

- Windows desktop only; DSH must stay open for background work and scheduled tasks.
- Meeting group capped at 8 members; group chat UI caps user-created groups at 3.
- No marketplace, no Feishu/Slack/Discord adapters yet; QQ notify/remote is built in.
- Boss may still do tiny tasks itself; say “必须派给 X” to force delegation.

See [CHANGELOG.md](../CHANGELOG.md) for the full 4.0 → 4.6 history and [docs/TEAM.md](TEAM.md) for team details.
