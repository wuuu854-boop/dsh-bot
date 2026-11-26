# DSH Bot v6.33.0

**An open-source GrokBot alternative that runs a real bot team on your own Windows machine, inside DeepSeek Harness.**

You talk to one **Boss**. It decides what to do, hires a specialist when nobody fits, delegates real work to bots that each keep their own DSH session, workspace and memory, then reviews the receipts and reports back. Every morning it runs a stand-up where the whole team reports what it did.

![Architecture](architecture.svg)

## Cross-browser fixes (v6.33.0)

- Fixed automatic profile detection (`os` import) and added `--profile auto`.
- Added `browser_driver.py setup` for Playwright/browser installation.
- Verified WebKit 60/60 with scrollDelta 0.
- Added captcha/blocker detection; blocked pages return `blocked:true` instead of success.
- Daily token cap is editable and resets at local midnight.

## Bug audit and UX (v6.32.0)

- Daily quota resets at local midnight; the cap is editable in settings.
- Browser profile handling fixed for Chromium `Default` and Firefox profile directories; status reporting corrected.
- `web_batch` prefers the active browser window instead of a fixed order.
- Removed the misleading `--keep-open` option; clarified per-run vs daily quota labels.
- CI guards updated.

## Cross-browser and quota (v6.31.0)

- Optional Playwright driver for Edge, Chrome, Firefox and WebKit; persistent profiles and CDP attach supported.
- 60-question verification: Edge 1.28s, Chrome 1.29s, Firefox 2.51s, all 60/60 with scrollDelta 0.
- Daily token ledger with 80% warning and 100% hard stop; settings show current run, thread and daily usage.
- Playwright is optional; Chromium-only `web_batch` remains the fallback.

## Compatibility and quota (v6.30.0)

- `web_batch.py` supports Edge / Chrome / Brave / Chromium / Firefox selection; address-bar detection is geometry-based, not Edge-ID-specific.
- Edge and Chrome verified at 60/60, scrollDelta 0; Firefox reports a clear unsupported address-bar error and falls back.
- Quota adds a 90% warning and current-run token display.
- CI guards cover the browser path and 90% warning.

## No-scroll batch (v6.29.0)

- Long quiz/form fills now use one page-side DOM batch instead of scrolling through every UIA control.
- Mock test: 60/60 answers, 0 failures, scrollDelta 0, 1.86s, page stays at the top.
- Added `scripts/web_batch.py`, `scripts/address_exec.ps1` and `scripts/check-web-batch.cjs`; CI guards the path.

## Token quota (v6.28.0)

- Reasoning tokens now count toward the run budget, thread token totals and assignment stats.
- Token usage warns at 50% (with remaining amount) and 80%; time/tool warnings share the same path.
- Settings expose Economy / Standard / Deep profiles and show this thread’s cumulative token usage against the per-run cap.
- Added `docs/AUTOMATION_OPTIMIZATION.md` and `scripts/check-budget.cjs`; CI guards the quota path.

## UX close-out (v6.27.0)

- Added `docs/UX_REPORT.md`: fix history from 6.14 to 6.26, automated evidence, and the remaining laptop-only visual checks.
- No runtime behavior changes.

## UX (v6.26.0)

- Deck empty states explain what appears after a task runs instead of leaving a bare “no history/activity”.
- UX guards cover the empty-state hints.

## UX (v6.25.0)

- Bot and group editor dialogs trap keyboard focus and restore the opener’s focus on close.
- UX guards cover the focus trap.

## UX (v6.24.0)

- Search failures show an explicit error instead of a false “no matches” empty state.
- UX guards cover the search-failure copy and state.

## UX (v6.23.0)

- Notification/budget load failures show an error and Reload button instead of an endless spinner.
- Memory load failures no longer show an empty editor; this prevents accidentally saving over the real memory file.
- UX guards cover actionable load-failure copy.

## UX (v6.22.0)

- Notification and budget settings share a dirty state; Save stays disabled until something changes.
- Notification success plus budget failure now reports the partial result instead of one generic error.
- UX guards cover the settings dirty state and partial-failure copy.

## UX (v6.21.0)

- Routine editor warns before dropping unsaved changes on cancel, new routine, switching routine or applying a template.
- UX guards cover the routine dirty-state path.

## UX (v6.20.0)

- Bot and group editors warn before discarding unsaved changes; Esc uses the same guard.
- Close, backdrop and cancel share one guarded close path.
- UX guards cover the unsaved-change copy and editor close.

## UX (v6.19.0)

- Sidebar drawer breakpoint raised to 1100px so 1024px windows and 125% zoom layouts keep the chat area usable.
- The narrow sidebar backdrop is a real keyboard-focusable close button.
- UX guards cover the new breakpoint and backdrop.

## UX (v6.18.0)

- Toast text no longer captures clicks; only the close button remains interactive, so feedback cannot block pending question/approval controls.
- Pending, approval and checkpoint cards remain in the normal flex flow; added a static guard for Toast click-through.

## UX (v6.17.0)

- Sending restores the live edge immediately; the jump control no longer stays behind after a send.
- Below 760px the Deck has a clickable backdrop for close-by-tap.
- UX guards now cover both paths.

## UX (v6.16.0)

- Toast is positioned above the composer instead of over the input area.
- Corrected the 1500px/1280px breakpoint order so the Deck width at 1280px is actually applied.
- Added static UX guards for jump placement, Toast clearance, scroll reset and breakpoint order.

## UX (v6.15.0)

- Entering a conversation now always starts at the newest message; switching threads resets the scroll lock and jump-button state.
- The scroll is applied both immediately and after the new thread snapshot arrives, so equal-length conversations still land at the bottom.

## UI fix (v6.14.0)

- “回到最新 / Jump to latest” is scoped to the chat view, below the message area and above the composer; it no longer overlaps member tabs.
- Clicking it hides the button immediately and scrolls to the true bottom with a short scroll-lock, so it reliably returns to the newest message.

## Browser extension removed

The ICVE/智慧职教 browser extension and its auto-save/auto-download bridge were removed because opening the browser could crash it.

Removed:

- `browser-extension/icve-assistant` unpacked extension;
- auto-downloaded `dsh-icve-latest.json` snapshots;
- `icve_snapshot.py`, `icve_quiz.py`, `icve_bank.py` and extension-only tests;
- extension-specific prompt/template paths and package entries;
- local ICVE snapshot/question-bank state.

The extension was also removed from the Edge profile. Browsing no longer loads any DSH browser extension.

## Course workflow

智慧职教/刷课 returns to the normal browser UI Automation path:

- `course.py progress` for completed/pending counts;
- `course.py status` for video/PPT/question/next phase;
- `play` / `ppt` / `question` / `answer` / `next` for actions;
- every click is verified; `changed:false` stops the loop.

No local server, clipboard bridge or browser extension is required.

## Kept improvements

- Attachments: grouping, thumbnails, full-window lightbox, zoom/pan/download.
- Five themes, shared Toast/EmptyState, routine templates and save-and-run.
- Morning meeting stale-run reconciliation; watchdog for orphan runs.
- API payload trims, memory history cache, adaptive polling.
- `/file` path/symlink hardening, CI version consistency, DOCX code-block styling.
- QQ notifications and remote control remain **default-off**.

## Install

Download `dsh-bot-6.13.0.zip`, install it in DSH, then reload the plugin. The first install still creates only the Boss; specialists are added on demand.
