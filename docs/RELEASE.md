# DSH Bot v6.10.0

**An open-source GrokBot alternative that runs a real bot team on your own Windows machine, inside DeepSeek Harness.**

You talk to one **Boss**. It decides what to do, hires a specialist when nobody fits, delegates real work to bots that each keep their own DSH session, workspace and memory, then reviews the receipts and reports back. Every morning it runs a stand-up where the whole team reports what it did.

![Architecture](architecture.svg)

## Speed/tokens (v6.10.0)

- Add a local ICVE question bank (63 seeded questions) and `icve_quiz.py --auto`: known questions are clicked without asking the model to answer; only unresolved questions are returned compactly.
- `latest --brief` returns only page/frame/question counts before the bank check; `--learn` writes successful answers back to the bank.
- `--learn` writes successful answers back to the bank; `icve_bank.py` imports existing verified answer tables.
- Bot prompt/template start with `--auto --dry-run` and submit only when every question is resolved.

## Speed (v6.9.0)

- Add `icve_quiz.py` batch answering: one process clicks all matched choice options and optionally submits; `--dry-run` validates question/option matches first.
- This replaces one PowerShell/UIA process per question on ICVE quizzes.

## Speed (v6.8.0)

- The ICVE extension auto-saves `dsh-icve-latest.json` to Downloads on page load/change; Bot runs `icve_snapshot.py latest` directly.
- The Bot prompt now prefers this snapshot and forbids preliminary UIA paging/screenshots for ICVE homework; submission still goes through normal verified clicks.
- The “智慧职教 / 刷课” template now starts from the same auto-saved snapshot.
- Add batch answering: `icve_quiz.py --answers answers.json [--submit]` clicks all matched choices in one process; dry-run validates matches first.
- No button click or clipboard read is needed in the normal path.

## Security fix (v6.7.1)

- ICVE snapshot capture now skips login/profile endpoints and redacts phone, real name, student ID, avatar, school/class and token fields in both the extension and `icve_snapshot.py`.
- The real-site smoke test found this exposure; the test snapshot and clipboard were cleared.

## New (v6.7.0)

- Dedicated Edge/Chrome extension for 智慧职教 (ICVE): page + iframe extraction, question/controls overview, one-click JSON copy, `Alt+Shift+C`, and a Bot-side `icve_snapshot.py` reader.
- The extension is installed in Edge as an unpacked extension; source is in `browser-extension/icve-assistant/`.
- Verified on a realistic mock ICVE page: 2 frames, 7 controls, 2 question blocks; clipboard snapshot saves and re-reads correctly.

## Fix (v6.6.2)

- The watchdog now releases a live run that stayed `running` while its agent was idle for more than 90 seconds and stops stale activity rows; this covers an in-process lost `turn/end`, not only restarts.

## Fix (v6.6.1)

- Morning meeting no longer stays "执行中" after a host restart. Stale `running` runs are reconciled at boot, and a group member's running state is scoped to that group's child threads/assignments.

## Performance patch (v6.6.0)

- Course reads use a persistent local Python UIA service; cold course status drops from ~2.3 s to ~1.2–1.5 s, cached reads ~0.15–0.2 s. It is loopback-only, token-protected, and falls back to `edge.py`.
- Long-session message rows use `content-visibility: auto` to skip offscreen layout/paint.
- No feature changes.

## Performance patch (v6.5.0)

- Client state polling is adaptive: 900 ms while a run is active, 3 seconds when idle, paused while the page is hidden.
- Idle request rate drops from about 67/min to about 20/min; snapshot payload stays at 51 KB.

## Performance patch (v6.4.0)

- Safety snapshot payload only carries the 3 rows the deck renders; audit detail is no longer sent in `/state`.
- `safety` 12.3 KB → 0.9 KB; `/state` 62 KB → 51 KB.

## Performance patch (v6.3.0)

- Team assignment rows are capped at 600/800/500 chars for prompt/summary/error; `/team` payload dropped from 95 KB to 40 KB.
- Full assignment records remain in `state.json`.

## Performance patch (v6.2.0)

- `/state` quality history only sends the 5 runs the UI renders; prompt/verification fields are truncated.
- `quality` payload dropped from 57.2 KB to 3.6 KB; `/state` and `/bootstrap` dropped from 117 KB to 62 KB.
- No feature changes; full run history remains in `state.json`.

## Performance patch (v6.1.0)

- Memory Git history is cached for 5 seconds and invalidated on save/commit/restore.
- `/memory` p50 dropped from about **215 ms** to **2 ms**; the first call still pays the Git cost.
- Reproducible benchmark: `node scripts/bench-api.mjs`; baseline in [`docs/PERFORMANCE.md`](PERFORMANCE.md).
- No new feature surfaces.

## v6 is a polish release

No new feature surfaces. v6 consolidates what already existed: reliability, security, attachment UX, creative output, docs and regression checks.

## Reliability

- Creative tasks now verify once — file exists and page count — then report. They no longer inspect XML/fonts/geometry or hunt LibreOffice indefinitely.
- QQ notifications and QQ remote control remain **default-off**; no automatic polling while disabled.
- Course status reuses returned action results instead of full re-reading every click.

## Attachments

- Files are grouped by type with counts: images, PDF, sheets, code, files.
- Images show thumbnails; the lightbox supports previous/next, counter, zoom, pan, double-click reset and download.
- Attachment cards expose a separate copy-path action; failure cards and thread titles no longer leak raw attachment Markdown.
- Uploads older than 30 days are removed only when unreferenced; referenced files are kept.
- `/file` rejects symlinks and real paths outside uploads; traversal probes return 404.

## UI

- Five themes: dark, warm, ink, Mist, Clay, with a named picker and dual-color previews.
- One accessible Toast component (`role=status`, `aria-live`, Esc/close) and a shared EmptyState for routines and skills.
- Routine empty state offers three starter templates; “保存并运行” creates, runs and opens the task.

## Quality

- CI compiles every Python script with `compileall`, not just three files.
- Version drift across `package.json`, `index.js` and `client.js` now fails checks.
- Real-project validation against `uav-yolo-offboard-tracking`: README attachment extraction and a 4-slide PPT were generated and inspected; details in [`docs/REAL_PROJECT_VALIDATION.md`](REAL_PROJECT_VALIDATION.md).
- DOCX code fences now render as shaded monospace panels instead of plain paragraphs.

## Compatibility

- Existing bots, threads, groups, memories, routines and theme selections are preserved.
- QQ stays off until explicitly enabled in notification settings.
- All API endpoints stay loopback-only; POST requests still require the client marker.

## Install

Download `dsh-bot-6.0.0.zip`, install it in DSH, then reload the plugin. The first install still creates only the Boss; specialists are added on demand.
