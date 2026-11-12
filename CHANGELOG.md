# Changelog

## 5.23.0 — 2026-11-12

- Add: “保存并运行” in the routine form — creates/updates the routine, immediately runs it, and opens the resulting thread.
- Add: image lightbox download action; the file endpoint supports UTF-8 `Content-Disposition` attachments.
- Verified: routine create/run/delete APIs; template fill flow; download headers; QQ remains default-off.

## 5.22.0 — 2026-11-12

- Add: image lightbox download action; `/file?download=1` now returns `Content-Disposition: attachment` with a UTF-8 filename.
- Verified: uploaded PNG downloads with `image/png` and correct disposition; test upload cleaned.
- QQ remains default-off.

## 5.21.0 — 2026-11-12

- Add: routine empty state now offers three starter templates — daily work summary, weekly file review, hourly task check. Choosing one fills the form; cancel leaves no routine behind.
- Add: concise empty-state explanation instead of a blank panel.
- Verified visually: template cards render, clicking “每日工作摘要” fills name/prompt/daily 18:30; cancel returns to empty state with 0 routines.
- QQ remains default-off.

## 5.20.0 — 2026-11-12

- Add: the image lightbox now supports multiple images — left/right arrow buttons, ArrowLeft/ArrowRight keys, a `1 / N` counter, and wrap-around navigation.
- Polish: close button remains visible bottom-right with a focus outline; the counter sits bottom-left.
- Distill: documented the lightbox interaction in `docs/UI_DESIGN.md` against shadcn/ui (127.9k), Radix Primitives (19.5k), Excalidraw (135.5k) and tldraw (51.4k).
- Verified: two-image message opened at `1 / 2`, ArrowRight switched to the second image at `2 / 2`; test thread/uploads cleaned.

## 5.19.0 — 2026-11-12

- Add: image attachment lightbox rendered through a document.body portal, so a transformed message bubble cannot trap the overlay in the chat column.
- Add: Radix/shadcn-style dialog semantics — `role=dialog`, `aria-modal`, focus on the visible close button, Esc/backdrop close, and a labeled “关闭” button at the bottom-right.
- Change: attachment card is now a container with a separate preview/copy action; image card click opens the preview, copy icon copies the path.
- Fix: problem cards strip inline `附件：...` text, not only block-form attachment Markdown.
- Verified: full-window lightbox screenshot; test thread, uploaded file, and local test image cleaned.

## 5.18.0 — 2026-11-12

- Fix: the abort/problem card no longer dumps the raw attachment Markdown block as the reason; attachment lines are stripped before display.
- Fix: legacy thread titles containing `附件：...` are cleaned on load, so old tasks stop showing long raw paths in the sidebar.
- Verified: existing state no longer contains attachment Markdown titles after reload.

## 5.17.0 — 2026-11-12

- Add: image attachments show a real 28px thumbnail in the card instead of only a generic paperclip. Served through a new same-origin `/file?name=...` endpoint restricted to the uploads directory.
- Add: `/file` returns image/text/pdf types with `nosniff` and private cache headers; path traversal is rejected via basename + directory check.
- Verified: a 64px red PNG uploaded through `/upload` renders as a thumbnail in the UI; endpoint returns `image/png`; test thread and file cleaned.

## 5.16.0 — 2026-11-12

- Add: upload lifecycle cleanup. Files older than 30 days are removed on boot and every 6 hours, unless their filename still appears in a persisted run/assignment/skill/group message.
- Verified: an unreferenced 45-day-old upload file was deleted on reload; referenced files are skipped.
- Attachment cards and QQ default-off behavior remain unchanged.

## 5.15.0 — 2026-11-12

- Add: attachments render as real cards in both user and assistant messages, with filename and a “复制路径” action; the local path remains available to the Bot.
- Fix: message titles now use only the first line, so attachment messages no longer produce long raw Markdown titles such as `请查看附件。 附件： - [file](<path>)`.
- Verified: attachment card renders in the user bubble; copied path works; Bot still reads the file and replies `LINK_ATTACHMENT_OK`.
- QQ notifications and remote control remain disabled in this profile; fresh-install defaults are already off.

## 5.14.0 — 2026-11-12

- Improve: attachment messages now render each file as a Markdown link with the filename visible, instead of showing a raw local path. The link target still contains the absolute path, and the Bot can read it.
- Verified: sending an attachment through the new Markdown link form still lets the Bot read the file and reply with its first line (`LINK_ATTACHMENT_OK`); test file and thread cleaned.
- No behavior change to upload limits or local-only storage.

## 5.13.0 — 2026-11-12

- Add: group message routing — “全员” (default) or “群主”. In leader mode an unmentioned message goes to the configured leader, who can delegate; `@all` still reaches everyone.
- Fix: the group editor silently capped member picks at 3 although the backend supports 8; it now allows 8.
- Fix: meeting channels now use the configured `leaderId` instead of searching for a `role: lead` bot; a meeting without a role-tagged lead could accidentally broadcast to everyone.
- Verified: creating a leader-routed group and sending an unmentioned message produced exactly one assistant reply from the leader; test group deleted.

## 5.12.0 — 2026-11-12

- Fix: QQ remote control was implemented but **never polled** — `checkRemoteControl()` had no timer. Added a 15s poll plus a 2s first check.
- Verified end-to-end: sent `/status` from QQ, the remote loop executed it, and QQ received a “DSH 远程状态” reply with the current task, state, bot and last result.
- Fix: QQ desktop notifications now use the visible contact window, click the real UIA “发送” button, and verify the message appears before returning success.
- Verify: QQ remote reads `title: 我的手机`, count, and last message; notification returns `{ok:true, verified:true}`.

## 5.11.0 — 2026-11-12

- Fix: QQ opens a separate chat window titled with the contact name; the UIA reader only looked for a window titled “QQ” and therefore never found the chat. It now prefers the contact window and falls back to the main window.
- Fix: `readQQChat` accepts the helper’s direct JSON payload, not only the old base64 wrapper.
- Fix: desktop QQ notifications no longer report false success. They pick the visible contact window, send through the UIA “发送” button, then verify the message appears in the chat before returning `ok:true`.
- Verified end-to-end: remote read returns `title: 我的手机`, count and last message; notification returns `{ok:true, verified:true}` and the test message appears.

## 5.10.0 — 2026-11-12

- Fix: the routine editor no longer offers Cron as a usable option. The local scheduler supports daily/weekly/every only, so Cron is disabled with “暂不支持” instead of letting users save a schedule that can never run.
- Verified: attachment end-to-end (upload → Bot reads file → replies first line), voice start/stop, group create/send/backfill/delete, and routine create/run/delete.
- Note: ordinary non-meeting groups still send an unmentioned message to all members by design (`groupHint`: no @ sends to everyone); no silent behavior change was made.

## 5.9.0 — 2026-11-12

- Fix: QQ remote-control reads were killed after 40 **milliseconds** — `execJson` passed seconds directly to Node's `execFile` timeout. It now converts seconds to milliseconds, so the helper can actually return.
- Fix: surface the real QQ helper error (“current chat is not …”) plus an actionable hint, instead of always reporting “UIA helper failed”.
- Fix: use the DSH runtime Python for QQ/voice/admin subprocesses; QQ UIA falls back to a Python that has `comtypes` when the runtime does not.
- Add: doctor `qq-uia` check when desktop remote control is enabled; verified comtypes available.
- Verified: remote test now reaches QQ and reports the actual contact mismatch; doctor all green.

## 5.8.0 — 2026-11-12

- Fix: routines no longer fail with “DSH 调度服务不可用”. They now use a local scheduler while DSH is open for daily / weekly / every schedules; Cron is rejected with a clear message instead of silently failing.
- Fix: routine create/update/delete no longer depend on the optional schedule service; tested create → run → stop → delete.
- Add: local scheduler ticks every 15s, tracks `lastRunAt`, and avoids replaying missed runs older than 60s after a restart.
- Verified: routine create 200 (`local:true`), manual run 200, stop and delete 200.

## 5.7.0 — 2026-11-12

- Fix: stop noisy automatic skill capture from one-off prompts/delegation boilerplate; unused auto skills are dropped on load, while used/manual skills survive.
- Fix: doctor now checks the actual DSH runtime Python and imports `pptx/docx/openpyxl/PIL`; this catches the “Python is available but creative generation fails” case.
- Add: doctor `creative` check with the exact runtime Python and a clear fix.
- Verified: runtime Python 3.12.14, `pptx/docx/openpyxl/PIL` import OK, manual skill capture still works, health/model ready.

## 5.6.0 — 2026-11-12

- Fix: creative and course templates no longer emit relative `python scripts/...` commands. They are expanded at insertion time to the DSH runtime Python and absolute script paths.
- Fix: the system `python` on this machine lacks `python-pptx`/`python-docx`, so the previous PPT/DOCX templates would fail on first use; the runtime Python with bundled libraries is now used.
- Add: snapshot `paths` (`python`, `scripts`, `studio`, `course`, `edge`, etc.) so the UI can render executable commands without guessing the install directory.
- Verified: PPT and game generation from a Bot workspace with the runtime Python; template insertion shows quoted absolute paths.

## 5.5.0 — 2026-11-12

- Redesign: “Aurora” becomes 雾海/Mist — cool fog-grey + low-saturation seafoam, no neon navy.
- Redesign: “Ember” becomes 陶土/Clay — warm stone neutral surfaces + apricot/clay accents, no muddy brown wash.
- Add: theme picker popover with names, description, dual-color preview, active check, Esc/outside close and accessible option states.
- Add: `docs/UI_DESIGN.md` with shadcn/Tailwind/Catppuccin/Nord/Radix references and token rules.
- Fix: bot update now reports when permission was saved but the live session could not switch, instead of a misleading success toast.

## 5.4.0 — 2026-11-12

- Add: client render error boundary with “重试渲染 / 复制诊断” safe-mode card and localStorage diagnostics, so a frontend exception no longer leaves a blank page.
- Fix: course page cache requires an active browser window; it no longer serves a stale snapshot after the browser is minimized/closed.
- Polish: course fast path only reads the active tab/window; cache hits stay around 0.1s after the first read.
- Verified: existing-bot update (`id`/`botId`), ICVE progress counting, cached status, and normal UI boot.

## 5.3.0 — 2026-11-12

- Fix: existing bots can now save settings again — `/bot/update` accepts both `id` and `botId`, and the client sends both; previously the route looked only for `botId` and returned 404.
- Fix: an already-admin bot no longer needs to re-check the admin warning on every unrelated edit; confirmation is required only when elevating a standard bot.
- Improve ICVE: fast text path reads only the active tab/window, ignores background tabs, and caches page text for 3s (cache is invalidated by title change).
- Add: `course.py progress` counts completed/pending items from text; status/progress default to fast mode; action commands return page/phase/progress so the Bot does not re-read after every click.
- Improve: course prompts now tell the Bot to reuse action results and only run `status --full` when the page is missing, stale, or stuck.

## 5.2.0 — 2026-11-12

- Fix: the native-approval “回到 DSH 处理” button now uses `ctx.layout.selectPanel(null)` instead of history/reload, preventing the DSH crash that required a restart.
- Fix: if the layout API is unavailable, show a manual “click 新会话” hint instead of navigating; no page refresh while an approval is pending.
- Verified: opened a fake native approval, clicked “回到 DSH 处理”, landed on the DSH conversation with no blank screen or restart.

## 5.1.0 — 2026-11-11

- Add: `scripts/studio.py` Creative Studio — PPT (themes/cover/stats/quote), DOCX from Markdown, XLSX with formatting/chart, single-file HTML games (snake/memory/runner), WAV + MIDI music, and poster PNG.
- Add: creative task templates for PPT, documents, sheets, games and music.
- Add: `docs/CREATIVE_STUDIO.md` high-star map (Presenton, PPTAgent, Slidev, Marp, python-docx, MarkItDown, XlsxWriter, Phaser, Three.js, ACE-Step, Audiocraft, Magenta, ComfyUI, Remotion, FFmpeg).
- Fix: template menu scrolls with many entries; thread header shows the bot's current latest model instead of historical model labels.
- Polish: PPT content panels, poster theme accent, runner/snake game geometry.

## 5.0.0 — 2026-11-11

- Add: command center on `Ctrl+K` with quick actions (new task, add specialist, memory, guide, theme) and global search.
- Add: global search now covers chat messages, thread titles and every bot's long-term memory; memory results open the memory deck.
- Add: five themes (dark, warm, ink, Aurora, Ember) and task difficulty controls (simple/standard/hard) with persisted per-thread behavior.
- Add: local OCR, isolated workbench, local memory search, multi-browser/UIA control and course runner are bundled into the v5 workbench.
- Fix: exact accessible-name matching in `uia.py`, native DSH approval awareness, model/difficulty migration, and empty-send state mutation.

## 4.27.0 — 2026-11-11

- Changed: task difficulty now changes behavior, not only effort — simple asks for the shortest result, standard executes/verifies, hard decomposes risks and cross-checks.
- Changed: the Boss passes the chosen difficulty into delegation effort (at least `high`, `max` for hard) and the agent prompt refreshes as difficulty changes.

## 4.26.0 — 2026-11-11

- Add: task difficulty selector (简单 / 标准 / 困难) in the composer; simple/standard map to `high`, hard to `max`; persisted per thread and shown in the title bar and task list.
- Add: Aurora and Ember themes, with theme-scoped variables, new theme dots, and dark/light color-scheme handling.
- Polish: composer focus ring, send/button hover motion, message rise animation, compact difficulty pills.
- Fix: thread difficulty/effort survives reload and old threads migrate consistently; empty sends no longer mutate difficulty.
- Fix: `uia.py` now prefers exact accessible names and supports `--exact`, preventing clicks on long thread titles that merely contain the target word.

## 4.25.0 — 2026-11-11

- Changed: every bot now uses the same current latest model (DeepSeek V4.1 Flash) instead of mixing Flash and older Pro routes.
- Changed: only reasoning effort differs — lead defaults to `max`, members to `high`; `low` is clamped to `high` and removed from the Bot editor.
- Changed: existing bots and thread model metadata are migrated on startup so old threads no longer show/use the previous model.
- Changed: delegation/hiring prompts no longer offer model downgrades; `effort` is the only per-task knob.

## 4.24.0 — 2026-11-11

- Add: `scripts/memory_search.py` local full-text search over bot memories, thread titles and group messages; Chinese substring matching, no upload/vector service.
- Add: site profiles for ICVE/智慧职教, 超星/学习通, 智慧树, 学堂在线 in `edge.py read`; each returns a domain-specific iframe/loop hint.
- Changed: Bot prompt tells agents to search local memory before asking the user to repeat old context.
- Docs: memory search and site profiles added to README and the all-in-one map.

## 4.23.0 — 2026-11-11

- Fix: native DSH approvals (the popup in the main session list) are now folded from `approval/asked` / `approval/decided` and shown as a Bot card, so the user is no longer unaware.
- Add: native approval card offers “回到 DSH 处理” (history back) and “停止”; it never pretends the Bot can answer a DSH-owned prompt.
- Fix: native approval state clears on stop/dispose and when the matching `approval/decided` arrives.
- Fix: approval cards are auto-scrolled into view when they appear.

## 4.22.0

- Add: `scripts/ocr.py` local Tesseract OCR fallback (image/window/screen, word boxes, language detection and Chinese-language hint).
- Add: `scripts/sandbox.py` local isolated workbench; Windows Sandbox when available, otherwise a dedicated browser profile + workspace.
- Add: task templates for deep research, isolated workbench, image/OCR, and read-only PC checkup.
- Add: `docs/ALL_IN_ONE.md` high-star feature map (n8n, MarkItDown, Dify, browser-use, Whisper, OpenHands, Tesseract, Mem0, AutoGen, CrewAI, Langfuse, GPT-Researcher, Stagehand, Letta) and explicit non-goals.
- Changed: GUI prompt documents OCR and isolated-workbench fallbacks; first-run guide/templates expose the new capabilities.

## 4.21.0 — 2026-11-11

- Add: `scripts/uia.py` accessibility-tree inventory and semantic actions (`list`/`click`/`type`/`focus`/`wait`), preferring Invoke/Select/Toggle over coordinates.
- Add: UIA coordinate normalization using the Win32 window rect (handles providers that report 2x coordinates, including DSH's own window).
- Add: `computer.py` window `process`/`pid`/`dpi`, `window-shot`, clipboard get/set, `launch`, and `wait-window`.
- Add: `docs/COMPUTER_CONTROL.md` distilling high-star projects (Windows-MCP, UI-TARS, UFO, pywinauto, FlaUI, OpenAdapt, AutoHotkey, OpenInterpreter) without copying their code.
- Add: first-run 4-step guide (new task, specialists on demand, templates/memory/voice, browser/approval behavior) plus a persistent “使用指引” entry in the sidebar.
- Changed: GUI system prompt now starts from `computer.py windows` + `uia.py list/click/type`; screenshots/coordinates are fallback only.

## 4.20.0 — 2026-11-11

- Add: browser abstraction for Edge / Chrome / Brave / Chromium / Firefox; auto-selects the active running browser, then installed Edge → Chrome → Brave → Chromium → Firefox.
- Add: `--browser NAME` and `DSH_BOT_BROWSER` override; `edge.py status` reports installed and running browsers.
- Add: Chromium-family launch flags to suppress first-run/default-browser modals; Firefox UIA emptiness returns a clear hint to use Chromium or the Marionette bridge.
- Changed: all read/click/type/course commands use the selected browser; `course.py` follows the same auto-selection.

## 4.19.0 — 2026-11-11

- Add: `scripts/course.py` state machine for self-paced course pages — `status` classifies video / PPT / quiz / next, `play`, `ppt`, `question`, `answer --choice --submit`, and `next`.
- Add: exam/proctored-page guard; a course page containing 考试/监考/交卷/倒计时 is refused instead of auto-answered.
- Add: same-page/action guard: after repeated stalled clicks, `course.py` blocks further repeats and asks for a different route.
- Add: 大学搜题酱 workflow distilled into read question → verify answer → fill → next; no extension code/API copied.
- Add: `edge.py read --all`, cross-iframe `click --all --verify`, `wait-change`; `course.py` uses them for ICVE/智慧职教.

## 4.18.0 — 2026-11-11

- Fix: surface DSH `approval/request` inside the Bot UI with a card; the agent no longer spins silently while waiting.
- Fix: standard bots are explicitly put on `workspace-write` + `ask` instead of inheriting the host’s `danger-full-access` / never-ask policy; admin bots use `danger-full-access` + `never`.
- Add: `edge.py read --all` reads main document plus iframe documents; `click --all --verify` reports `changed:false/stalled:true` instead of silently repeating.
- Add: 智慧职教 (ICVE) adapter hint and task template; page URLs on icve.com.cn get a site-specific read hint.
- Add: `/approval` decision endpoint; approval card shows bot, tool, reason and “AI 已暂停” state; working strip says “等你确认后继续”.
- Add: approval timeout/cancellation cleanup when a run is stopped, disposed or aborted.

## 4.17.0 — 2026-11-11

- Theme: warm and ink now have distinct conversation bubbles, assistant borders, input surfaces, header typography and paper/ink textures.
- Add: failed runs show a plain-language “that attempt did not finish” card with tried steps, retry, rephrase and copy diagnostics.
- Add: administrator permission requires an explicit risk acknowledgement before saving; the composer shows an administrator badge.
- Fix: dashboard blank screen caused by a render-time reference to the problem card state; remove duplicate `thinking` locale keys.

## 4.16.0 — 2026-11-11

- Fix: voice input uses Windows system dictation (Win+H) through the host instead of the unreliable browser SpeechRecognition API; the mic now focuses the composer first and toggles start/stop.
- Add: while running, the UI shows plain-language actions (reading a page, checking disk, delegating to X) and recent completed steps; raw commands/JSON stay under “technical details”.
- Add: `voiceAvailable` in snapshots and a `POST /voice` endpoint.

## 4.15.1 — 2026-11-11

- Fix: `bot_cli update --check` now forces a fresh GitHub check without requiring a value.

## 4.15.0 — 2026-11-11

- Add: background update check every 6 hours against GitHub Releases; a dismissible banner in existing bots links to the new release/zip.
- Add: `GET /update`, `POST /update/check`, and `bot_cli update [--check]`.
- Add: per-version dismissal; a newer release re-appears even after dismissing an older one.

## 4.14.0 — 2026-11-11

- Fix: stop is now synchronous from the user’s point of view — the client clears running/stream state immediately, `/stop` waits at most 500 ms for the agent to leave running, and returns a fresh snapshot.
- Add: stop confirmation toast and disabled stop re-entry while the request is in flight.

## 4.13.2 — 2026-11-11

- Fix: the right computer deck now follows warm/ink themes instead of forcing a dark inline background.

## 4.13.1 — 2026-11-11

- Polish: template menu closes on outside click / Escape; replay closes with Escape.
- Polish: light themes also cover modal, toast and composer surfaces; warm composer uses a deep-brown accent, ink uses an ink-black accent.

## 4.13.0 — 2026-11-11

- Add: three UI themes — dark, warm paper, and ink-wash — selectable from the top bar and persisted in localStorage.
- Add: `docs/DISTILLATION.md` with high-star project research and adopted/rejected patterns.
- Theme: warm uses cream/terracotta with a dark-brown composer; ink uses rice-paper grey with ink black and cinnabar.

## 4.12.0 — 2026-11-11

- Change: no preset team is deployed. A fresh install has only the Boss; “添加专家” opens a blank editor so each user defines their own roles.
- Change: removed the fixed `/team/bootstrap` flow (now 410) and `team init`; existing bots are untouched.
- Docs: README/TEAM/API now describe on-demand specialists instead of a disk/university template.

## 4.11.0 — 2026-11-11

- Add: four composer task templates (web homework, web digest, disk cleanup, daily review) with low-level browser guidance.
- Add: `GET /doctor` and `bot_cli doctor` checks for state directory, Python, Edge, model, disk and runtime API.
- Add: `bot_cli health` for the `/health` summary.

## 4.10.0 — 2026-11-11

- Add: conversation replay modal — play/pause, scrub, and restart the current thread timeline.
- Add: `GET /health` with version, uptime, state size, counts, live agents, model status, and last error.
- Docs: competitive notes on `dsh-Go`, `JopenChen/dsh-go`, and `coeasy/dsh-go`; only ideas independently implemented, no AGPL code/assets copied.

## 4.9.0 — 2026-11-11

- Add: Edge `read` now selects the largest document, reports `textLength` / `controlsCount`, and supports `wait`, `scroll`, `back`, `forward`, `reload`.
- Change: every web page (articles, search results, documents, homework, forms) is read through UI Automation first; screenshots are only for empty/canvas/PDF/image/captcha pages.
- Change: `type --index` supports forms without stable control names.

## 4.8.0 — 2026-11-11

- Add: Edge UI Automation commands `read`, `click`, `type`, and `select`; bots now read page text and controls instead of taking screenshots by default.
- Change: `edge.py open` reuses the running Edge process with a new tab, so browser actions no longer spawn a new window on every step.
- Change: runtime prompts now require “read → fill/select → submit → read confirmation” for web forms and homework; screenshots are only for canvas/PDF/image/captcha fallback.
- Add: `read` returns page title, URL, visible text, and form controls with names/roles/values/bounds.

## 4.7.3 — 2026-11-11

- Fix: `bot_hire` and `bot_delegate` no longer hardcode DeepSeek provider/model IDs; hired specialists inherit the Boss provider and use a compatible default.
- Fix: per-assignment model overrides respect the teammate provider instead of falling back to `deepseek-official`.
- Polish: cost guidance is provider-neutral.

## 4.7.2 — 2026-11-11

- Add: first-run welcome and Team tab offer a one-click **添加专家团队** action when only the Boss exists.
- Add: model warning has a **重新检测** button backed by `POST /model/refresh`.
- Fix: model connection failures now return an actionable message instead of a raw task error.
- Polish: first-run guidance explains that specialists are optional.

## 4.7.1 — 2026-11-11

- Fix: a fresh install starts with exactly one bot, **老大 (lead)**. The full specialist team is only added when the user clicks **团队模板**.
- Fix: bots now resolve the current DSH default model at first bootstrap instead of hardcoding `deepseek-official`; the team template no longer pins model IDs.
- Fix: if DSH has no usable model, the UI shows a setup banner and `/send` returns a clear message instead of a raw task failure.

## 4.7.0 — 2026-11-10

- Change: Microsoft Edge is now the default browser for every bot. New `scripts/edge.py` provides `open`, `navigate`, `activate`, `status`, `screenshot`, `monitors`, and `screen`.
- Add: multi-monitor support in `computer.py`; default screenshots capture the whole virtual desktop, with `primary` and `monitor:N` options.
- Add: bot runtime prompts document Edge as the default and expose monitor layout/screenshot modes.
- Change: Firefox remains only for the isolated Grok/Copilot profiles.

## Unreleased

- Fix: the only lead bot can no longer be deleted; promote another bot first.
- Fix: the stand-up group can’t be archived from the top bar, and reusing it automatically unarchives it.
- Fix: the stand-up group and task row show “running” while a meeting is in progress.
- Fix: `/team` now returns the full roster including the lead; `smoke-team.mjs` checks that.
- Fix: a stand-up left “running” by a host restart is released on the next start.
- Add: failed or aborted assignment cards have a “Retry” button; `POST /assignment/retry` re-queues the same prompt on the same member thread and sends a fresh receipt.
- Add: Team tab failed rows have the same retry entry.
- Fix: group message timestamps are monotonic and ties sort by id, so rapid member replies keep a stable order.
- Fix: assignments left “running” by a host restart are marked aborted on startup with a retry hint, instead of showing running for up to two hours.
- Add: `bot_cli retry --assignment <id>` for the retry path.
- Add: group chat can load earlier persistent messages (`GET /channel/messages`, “load earlier” at the top of the transcript).
- Add: retries are capped at 3 per task and carry `retryOf` / `retryCount` in the API.
- Add: group replies quote the latest user prompt (within 30 minutes) and render a quote strip above the reply.
- Add: Notifications tab shows the last stand-up minutes with a button to open the stand-up group.
- Add: clicking a quote jumps to and flashes the original message.
- Add: stand-up minutes keep a 30-entry history; Notifications shows earlier days in collapsible rows.
- Add: `@` in a group composer opens member autocomplete; Enter/Tab or click inserts the name.
- Add: Notifications can search earlier minutes and export all minutes as Markdown (`GET /meeting/export`).
- Add: in a group, assistant replies expose “Quote”; the composer shows a quote chip, and sending routes the follow-up to the quoted member with the quoted text attached. `/send` accepts `replyTo`.
- Add: any assistant message can be pinned to the top of its thread (`POST /message/pin`); the banner jumps to the original and can be cleared.
- Add: per-thread message search from the top bar (`GET /search`); results jump to the message or warn when it is in unloaded history.
- Add: search scope switch “this chat / all chats”; cross-chat results carry the thread title and open the target thread before jumping.
- Polish: search results show a snippet around the first hit and highlight the keyword; Ctrl/Cmd+F opens search, Esc closes it.
- Add: threads keep up to 10 pinned messages; the top banner shows the newest, “+N” opens the list, and each item can jump or be removed (`/message/pin` supports add/remove/clear).
- Add: export the current conversation as Markdown from the top bar (`GET /export`), truncating at ~200k characters.
- Add: cross-thread “Pinned & saved” overlay in the top bar (`GET /pins`); jump to any pin, remove it, or open its thread.
- Polish: bot chips in the sidebar show a running dot; the Team tab refreshes completed delegations every 5 s until the user pages.
- Polish: group member running state also counts persisted runs/assignments, so headers stay accurate after a member session is evicted.

## 4.6.0 — 2026-11-10

- Add: pinned threads can be drag-reordered; the order is persisted and `/thread/reorder` applies it.
- Add: “only when there was work” stand-ups now retry on a 30-minute timer while DSH stays open, not just on the next page open.
- Docs: refreshed the README, added `docs/RELEASE.md` for a GitHub release body, documented `/thread/reorder`.
- Cleanup: old local backups (13.57 GB) removed; a running WSL distro was left untouched.

## 4.5.0 — 2026-11-10

- Add: Team tab delegation history now has status filters (all / running / done / failed), a counter and “load more” pagination backed by `/team?status=&limit=&offset=`.
- Add: delegation rows show steps / duration / tokens when available.
- Change: “only when there was work” stand-up now defers instead of skipping the whole day; the next open after 30 minutes re-checks and runs if work appeared.
- Polish: locale keys for filters; API/team pagination already documented.

## 4.4.0 — 2026-11-10

- Add: pin threads (★) and archive/unarchive from the top bar; archived threads are hidden behind a “show archived” toggle.
- Add: meeting trigger “only when there was work in the last 36 hours”, in addition to enable/disable and weekdays-only.
- Add: `/team` assignment history supports `limit` / `offset` / `status` / `memberId`, and `bot_cli team assignments --limit --status --member`.
- Add: `bot_cli rename` and thread pin/archive routes; `docs/API.md` updated.
- Polish: assignment cards show steps/duration/tokens; top-bar title double-click rename.

## 4.3.0 — 2026-11-10

- Add: meeting configuration — enable/disable the daily stand-up, weekdays-only mode, and “run now” from the Notifications tab or `meeting config`.
- Add: thread rename — double-click the title in the top bar; `POST /thread/rename` and `bot_cli rename` are also available.
- Add: assignment metrics — receipts and cards now show steps, duration and tokens spent.
- Add: opt-in E2E script (`scripts/e2e-team.mjs --yes [--delegate]`) that exercises a real direct reply and delegation.
- Fix: `docs/API.md` covers the new routes; package scripts expose `npm run smoke` / `npm run e2e`.

## 4.2.3 — 2026-11-10

- Fix: meeting digests no longer include stand-up meeting turns themselves, so a bot that only attended meetings reports “no real task”.
- Fix: group snapshots now include a full roster (including the lead); the Team tab shows it for groups too, and team snapshots include every bot.
- Fix: the meeting group hides “群聊设置” because membership is managed automatically.
- Fix: if a member session cannot be opened, `bot_delegate` / lead `bot_dispatch` mark the assignment failed instead of leaving it running forever.
- Fix: a watchdog now fails assignments that produced no receipt for two hours and reports the timeout to the lead.
- Add: `docs/API.md` documents every HTTP route, payload and security boundary.

## 4.2.2 — 2026-11-10

- Fix: when the lead uses `bot_dispatch` in a group, the host now creates a real assignment bound to the member thread, so the member's result comes back to the lead as a report instead of only appearing in the group.
- Fix: group snapshots include assignments that belong to member threads, so the UI can show who is working on what.
- Add: Team tab now shows the roster (role, tagline, model, running state) and recent delegations with status.
- Polish: hire events render as “New member”; Bot editor exposes reasoning effort; meeting has a 30-minute retry backoff and de-duplicated fallback messages.
- Cleanup run: 8 crash dumps (5.81 GB) and three old backup versions (7.84 GB physical) removed with a pre-delete manifest; cumulative 14.76 GB freed.

## 4.2.1 — 2026-11-10

- Fix: group replies are now persisted on `turn/end` for every member (with a failure note when a turn ends without text), so a group never shows only tool activity and no result. Backfilled the missing 12:30 replies.
- Fix: ordinary messages in the stand-up group go to the lead only; `@member` still addresses a member directly.
- Fix: meeting waits for the turn to actually start before collecting the reply; no more stale minutes, plus a 30-minute retry backoff and duplicate-fallback guard.
- Fix: client re-bootstraps when the open thread was deleted instead of staying offline.
- Polish: hire events render as “New member” cards; Bot editor exposes reasoning effort (`low` / `high` / `max`).

## 4.2.0 — 2026-11-10

- Add: `bot_hire` — the lead can create a specialist bot (workspace, memory, model) when no teammate fits, then delegate.
- Add: daily stand-up meeting on the first DSH open of the day; every bot reports from its own 36-hour run history, the lead writes the minutes; once per day, no QQ notifications.
- Add: model policy — lead `deepseek-v4-pro` + `max`, members `deepseek-flash` + `low`; per-assignment `effort` / `model` overrides via `bot_delegate`.
- Fix: `deepseek-flash` does not support `medium`; effort values are `low` / `high` / `max`.

## 4.1.0 — 2026-11-10

- Add: team template (lead + disk cleanup + university), idempotent bootstrap from the sidebar, CLI `team init/list/assignments/cleanup`.
- Add: `bot_delegate`, assignment threads, report delivery back to the lead, assignment cards.
- Add: role setting on bots, automatic agent reopen when the role changes.
- Polish: Markdown tables, wrapped bot strip, 3-member group cap.

## 4.0.0 — 2026-11-10

- Add: multi-bot group chats with `@mention` routing, per-member sessions and speaker attribution.
- Add: `bot_dispatch` between group members.
- Add: git-backed bot memory with history, diff and restore; memory moved to `storages/dsh-bot/memory/<botId>/`.
- Add: `scripts/bot_cli.mjs` for headless control; markdown tables and group UI.

## Earlier

3.1 Firefox Marionette control, 3.0 system snapshots / budgets / notification throttling / state backups,
2.9 QQ remote control, 2.8 QQ notifications + watchdog, 2.7 verifier agent, 2.6 safety snapshots,
2.5 unattended mode, 2.4 full-access + administrator, 2.3 Firefox isolation, 2.2 acceptance + regression suite,
2.1 quality ledger / skills / checkpoints / circuit breakers, 2.0 multi-bot + routines.
