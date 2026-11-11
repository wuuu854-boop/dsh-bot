# Changelog

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
