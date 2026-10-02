# Codex computer use

Hand one GUI task from Claude Code (or any shell) to the ChatGPT desktop app's Codex
agent. It works the way it does in the app: websites run in a **background tab of the user's own
signed-in Chrome** (Chrome plugin, Browser Use). Windows apps run through Computer Use (`@oai/sky`),
which takes screenshots even of covered windows. The user keeps working, and nothing needs focus.
This replaces Jev and `orca computer` for vendor dashboards (GoHighLevel, Elfsight, …), at the
user's choice on 2026-10-02.

```bash
node deliver/process/tools/codex-computer-use/codex_cu.mjs "<plain instruction with its stopping point>" \
  [--allow-writes] [--out <dir>] [--timeout <minutes, default 20>]
```

- Prints Codex's final report. `prompt.txt`, `report.md` and `session.log` land in `--out` (default
  `%TEMP%/codex-cu/<stamp>`).
- **Read-only by default.** `--allow-writes` permits only the changes the instruction names.
  Delete, regenerate, pay, send, invite and publish still have to be named explicitly.
- Write one plain instruction. No per-site steps (see the `computer-use-must-be-generic` feedback).

## Requirements and gotchas

- **The ChatGPT desktop app must be running**, with its Chrome extension connected. The wrapper
  runs the app's own CLI (`CODEX_CLI_PATH` in `~/.codex/config.toml`, or the newest
  `%LOCALAPPDATA%/OpenAI/Codex/bin/*/codex.exe`). The npm `codex` (0.155) lags the app: it rejects
  the app's default model (`gpt-6.1-sol … not supported with a ChatGPT account`).
- **Orca shadows the plugin.** Orca installs its own skill, also called `computer-use`, in
  `~/.agents/skills`. Left to choose, Codex picked it, and `orca computer` then needed the Chrome
  tab in the foreground. The wrapper's prompt pins Codex to the Chrome and Computer Use plugins and
  bans the Orca skill. Check `session.log` for `browser.` / `sky.` calls, not `orca computer`.
- **Computer Use (`sky`) refuses browser windows** whose URL it cannot read ("could not determine
  the current browser URL … to enforce policy"). That is by design: browser tasks belong to the
  Chrome plugin.

## Verified

2026-10-02, read-only on GoHighLevel. It took a background tab and found agency DriveRank with 47
sub-accounts. It opened Marvel Dental (`ljvdYxYeswqNrIklUHLh`) Settings: no Private Integrations or
API-key page is visible at sub-account level. Nothing was changed.

## Version Control

Follows the root version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Run
output stays outside the repo (`%TEMP%`); never commit a report that contains a secret.
