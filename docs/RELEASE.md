# DSH Bot v4.9.0

**An open-source GrokBot alternative that runs a real bot team on your own Windows machine, inside DeepSeek Harness.**

You talk to one **Boss**. It decides what to do, hires a specialist when nobody fits, delegates real work to bots that each keep their own DSH session, workspace and memory, then reviews the receipts and reports back. Every morning it runs a stand-up where the whole team reports what they did.

![Architecture](architecture.svg)

## Highlights

- **Boss + specialists** — `老大` is the only bot you talk to. `bot_delegate` assigns work; receipts come back automatically; assignment cards show steps, duration and tokens.
- **Self-hiring** — if no teammate fits, the Boss uses `bot_hire` to create one (workspace, memory, model, persona) and delegates immediately. Test run: hired `软件盘点` and produced a 469-row installed-software inventory.
- **Daily stand-up** — first DSH open of the day creates a ☀️ group with every bot; each reports from its own 36-hour run history; the Boss writes the minutes. Configurable: off, weekdays only, or only when there was work.
- **Group chats** — 2–8 bots in one channel, `@name` routing, `bot_dispatch`, speaker-attributed replies, persisted group transcript.
- **Git-backed memory** — each bot's memory is a Git repo with history, diff and one-click restore.
- **Model policy** — bots follow the DSH default model, with per-assignment `effort` / `model` overrides.
- **Local execution depth** — Edge is the default browser; multi-monitor screenshots cover the whole virtual desktop; GUI control, app launching, Clash proxy guard, isolated Firefox, safety snapshots, budgets, QQ notifications and remote control.
- **CLI + HTTP API** — `bot_cli.mjs` and `docs/API.md` cover bots, threads, groups, team, meeting, memory, routines and skills.

## Install

```powershell
git clone https://github.com/wuuu854-boop/dsh-bot.git
# In DSH: plugin_manager install_bundle <path>\dsh-bot
# or link it in the target profile package.json:
#   "@local/dsh-bot": "link:<path>/dsh-bot"
```

Then talk to the default **老大** bot; click **团队模板** only when you want to add specialists.

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
