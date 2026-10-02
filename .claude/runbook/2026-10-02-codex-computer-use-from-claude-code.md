# 2026-10-02 — Codex computer use driven from Claude Code

## Done
- `deliver/process/tools/codex-computer-use/codex_cu.mjs` runs one task as
  `codex exec` through the ChatGPT desktop app's CLI and prints Codex's report. Read-only unless
  `--allow-writes`. README in the same folder; row added to `PROCESS_INDEX.md`.
- Verified read-only on GoHighLevel in a background tab of the user's Chrome: agency DriveRank,
  47 sub-accounts. Marvel Dental (`ljvdYxYeswqNrIklUHLh`) Settings shows no Private Integrations or
  API-key page at sub-account level. Integrations lists Instagram and GBP only.
- The user chose Codex computer use over Jev and Claude computer use, and made it **the repo standard**.
  It is wired into the CLAUDE/AGENTS/GEMINI.md quick links, DELIVER_SYSTEM_RULES §3, the project
  skill `.claude/skills/codex-computer-use`, and PROCESS_INDEX. Jev and the Elfsight README are
  marked superseded.

## Gotchas
- The npm `codex` 0.155 rejects the app's model `gpt-6.1-sol`. Use the app's `codex.exe`
  (`CODEX_CLI_PATH` in `~/.codex/config.toml`).
- Orca's skill, also named `computer-use`, in `~/.agents/skills` shadows the plugin. The first
  runs used `orca computer`, which needed the Chrome tab focused (the user caught it). The prompt
  now pins Codex to the Chrome plugin for websites and `@oai/sky` for native apps.
- `sky` refuses Chrome windows ("could not determine the current browser URL … policy"). Browser
  work must go through the Chrome plugin.
- The ChatGPT app must be running (its `codex-computer-use` helper owns the native pipe).

## Next
- GoHighLevel API access: decide between Private Integration tokens per sub-account (created and
  shown once; the agency may need to enable them) and one agency token. Then run with
  `--allow-writes` on one sub-account.
- Committed in `760e8013` (main, not pushed).
