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

- Prints Codex's final report. `prompt.txt`, `report.md` and `session.log` (Codex's JSON event stream, which includes the code each tool call ran) land in `--out` (default
  `%TEMP%/codex-cu/<stamp>`).
- **Read-only by default.** `--allow-writes` permits only the changes the instruction names.
  Delete, regenerate, pay, send, invite and publish still have to be named explicitly.
- Write one plain instruction. No per-site steps (see the `computer-use-must-be-generic` feedback).

## When not to use it: canvas apps with a scripting API

**Codex's browser scripts cannot see the page's own JavaScript.** `tab.playwright.evaluate`
found no `window.figma` on a loaded FigJam board (it listed no Figma globals at all). So on a
canvas, Codex falls back to clicking, typing and the clipboard. In FigJam, 2026-10-02:
- **Real board:** it duplicated the Scenario 2 lane and overwrote its title in place, then
  reported success. The board was restored from version history.
- **Sandbox, even with "only add" rules:** loose text blocks, an empty "Section 1" in the wrong
  place, a duplicated Scenario 0 card, and a fresh-tab check that returned `false` while the
  report said "verified".

**Use Claude in Chrome for FigJam and Figma edits.** Its `javascript_tool` runs in the page and
reaches the plugin API. The same lane built that way was right first time, and was confirmed
from a fresh tab. The recipe is in the 2026-10-02 runbook. Codex stays the tool for forms,
dashboards and reading pages.

**Test canvas work on a copy.** The FigJam sandbox is *Deliver SOP's (copia)*
(`figma.com/board/2sUFV9D8ReH76pzVRAQPBA`). Duplicate a board before any automated experiment.

## Requirements and gotchas

- **The ChatGPT desktop app must be running**, with its Chrome extension connected. The wrapper
  runs the app's own CLI (`CODEX_CLI_PATH` in `~/.codex/config.toml`, or the newest
  `%LOCALAPPDATA%/OpenAI/Codex/bin/*/codex.exe`). The npm `codex` (0.155) lags the app: it rejects
  the app's default model (`gpt-6.1-sol … not supported with a ChatGPT account`).
- **Orca shadows the plugin.** Orca installs its own skill, also called `computer-use`, in
  `~/.agents/skills`. Left to choose, Codex picked it, and `orca computer` then needed the Chrome
  tab in the foreground. The wrapper's prompt pins Codex to the Chrome and Computer Use plugins and
  bans the Orca skill. Check `session.log` for `browser.` / `sky.` calls, not `orca computer`.
- **The Chrome plugin needs its Bootstrap block.** Its skill lives at
  `~/.codex/.tmp/bundled-marketplaces/openai-bundled/plugins/chrome/skills/control-chrome/SKILL.md`,
  not under `plugins/cache`. Without that block, `browser` is undefined and Codex falls back to
  `sky`. The wrapper passes the path in.
- **A tab a session keeps open stays claimed by that session.** Excalidraw, 2026-10-02: the drawing
  run marked its tab as a deliverable, and a later read-only run couldn't claim it ("already claimed
  by another browser session"). Do any checks inside the run that made the tab, or have the user look.
- **Plain `exec` logs hide the code**, so the wrapper runs `--json`. Grep `session.log` for
  `browser.` / `tab.` / `sky.` to see which path a run took.
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
