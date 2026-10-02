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

- **FigJam test, Codex.** On the real *Deliver SOP's* it moved the original Scenario 2 lane,
  overwrote its title, intro and first header with Scenario 6 text, left a Scenario 1 copy at
  x 47760, and reported success. The user restored the Sep 25 13:01 version in the UI; Claude
  Code's permission check blocked my click on Restore. The user then had me duplicate the board as
  the sandbox *Deliver SOP's (copia)* (`2sUFV9D8ReH76pzVRAQPBA`).
- **Sandbox rerun, Codex:** loose text blocks, an empty "Section 1" at the wrong x, a duplicated
  Scenario 0 card, and a fresh-tab check that was `false` while the report said verified. The
  existing lanes kept their positions. All `2002:*` nodes were removed afterwards.
- **Same lane, Claude in Chrome + plugin API:** right, and confirmed from a fresh tab. Sandbox
  section `2004:1332` at x 7180 with 71 cards; the six lanes are unchanged. Recipe:
  - clone Scenario 1's own cards as templates, picked **by text** (child order differs from REST);
  - set text, height and position;
  - one card line holds about 85 characters (32 px, then +34 px per line);
  - abort if the section name already exists.
- FigJam/Figma canvas edits are now an exception in the skill, DELIVER_SYSTEM_RULES §3 and the
  entry points: Claude in Chrome, not Codex.

## Gotchas
- The npm `codex` 0.155 rejects the app's model `gpt-6.1-sol`. Use the app's `codex.exe`
  (`CODEX_CLI_PATH` in `~/.codex/config.toml`).
- Orca's skill, also named `computer-use`, in `~/.agents/skills` shadows the plugin. The first
  runs used `orca computer`, which needed the Chrome tab focused (the user caught it). The prompt
  now pins Codex to the Chrome plugin for websites and `@oai/sky` for native apps.
- `sky` refuses Chrome windows ("could not determine the current browser URL … policy"). Browser
  work must go through the Chrome plugin.
- The ChatGPT app must be running (its `codex-computer-use` helper owns the native pipe).

- Excalidraw test (with writes): Codex drew the five-box system diagram in a background tab.
  The wrapper now logs `--json`, passes the Chrome plugin's Bootstrap path, and has Codex check its own
  result before it finishes. A tab one session keeps open can't be claimed by the next.

- **Codex's `tab.playwright.evaluate` runs isolated from the page.** It saw no `window.figma`,
  so it cannot use in-page app APIs. Claude in Chrome's `javascript_tool` can.
- **Section children are positioned relative to the section.** `n.x = 7180 + 96` put every card
  7180 px off. Set the offset from the section's corner.
- **A timed-out FigJam script resumes when the tab comes to the front.** The first build seemed
  to make nothing, then completed. The name guard stopped the rerun from duplicating it.
- **The Figma REST API is blocked for about four days** (`Retry-After` 353798 s, free-plan "low"
  tier). Verify in the page and from a fresh tab, not through REST.

## Next
- **Done:** the Scenario 6 lane is on the real *Deliver SOP's* board (section `374:1330`, x 7180,
  71 cards). Built in one pass with the corrected script (templates by text, positions relative
  to the section), checked in the page and from a fresh tab.
- Still open: Scenario 2's lane should read Instatic only. That is a write to the owner's board,
  so confirm first.
- GoHighLevel API access: decide between Private Integration tokens per sub-account (created and
  shown once; the agency may need to enable them) and one agency token. Then run with
  `--allow-writes` on one sub-account.
- Committed in `760e8013` (main, not pushed).
