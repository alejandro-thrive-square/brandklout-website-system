# Webzite Agent Entry Point

Welcome, agent. You are operating within the **Brandklout Website System**. To perform your tasks effectively, you must adhere to the core architectural rules and the Deliver directives.

> [!IMPORTANT]
> **Main is for the system; client worktrees are for the sites.** A client branch changes only `deliver/brandklout/<client>/` and is that client's permanent history: it merges main in at the start of a session (system files only, so it cannot conflict) and **never merges into main** — read it from main with `node scripts/client.mjs`; a system update changes everything except client folders and reaches clients through `scenario.mjs sync`. **`deliver/process/` is tracked on main only**: a client worktree reads it through an untracked mirror rebuilt from the `main` ref, so a process fix made anywhere else is lost — make it on main. `node scripts/check-scope.mjs` enforces this (and the `pre-commit` / `pre-merge-commit` hooks on main).

> [!IMPORTANT]
> **This repository is the Brandklout delivery system, and nothing else.** It carries the Deliver
> pillar — the root rules, `mcp-servers/`, `scripts/`, `deliver/process/` and every Brandklout
> client — split out of `webzite-agentic-workflow` so the two stop mixing. Webzite's own clients
> and the Sales, Manage and Growth pillars stay in that repository; do not add them back here, and
> do not put non-Brandklout client work in this one.

> [!IMPORTANT]
> **Documentation Integrity Rule**: Any update to the system's logic or structure requires an immediate update to the relevant `.md` files.

> [!IMPORTANT]
> This file must stay identical to [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md), and [GEMINI.md](./GEMINI.md). These filenames exist separately because different agent runtimes auto-load different entry-point names.

> [!IMPORTANT]
> **Runbooks**: after each task, add a dated entry to the step's `output/RUNBOOK.md` and a row to the client's `RUNBOOK.md` (or a run file in `.claude/runbook/` for system work). When you start, read the client `RUNBOOK.md` and only the step runbooks you need — never the whole history. Nothing enforces this any more — the automatic session-rotation hooks were removed on 2026-08-22 (see [SYSTEM_RULES.md §5](./SYSTEM_RULES.md)), so the runbook is now a convention you follow, not a gate you hit.

## Quick Links
- **Master Rules**: [SYSTEM_RULES.md](./SYSTEM_RULES.md)
- **Runbooks**: [SYSTEM_RULES.md §5](./SYSTEM_RULES.md) - per step in `<scenario>/<step>/output/RUNBOOK.md`, indexed in the client's `RUNBOOK.md`; read the index, not the history
- **Active clients and their worktrees**: [deliver/docs/CLIENTS.md](./deliver/docs/CLIENTS.md) - every `bk-<client>` branch, its folder, worktree and scenarios. `main` tracks **no** client folders (since 2026-10-03); a client exists only on its branch. Read one from anywhere with `node scripts/client.mjs runbook <client>` (also `log`, `ls`, `show`, `where`, `list`).
- **New Computer Install**: [INSTALL.md](./INSTALL.md)
- **VPS Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Agent Hermes & Two-Workspace Sync**: [HERMES.md](./HERMES.md) - resume work from anywhere (phone via Hermes or local) with `bash scripts/sync.sh` (git only)
- **Client media (R2)**: `node scripts/assets.mjs push | pull <client> | status` - media is gitignored and backed up to Cloudflare R2; push at the end of every task that made media ([DELIVER_SYSTEM_RULES.md §2](./deliver/DELIVER_SYSTEM_RULES.md))
- **Computer use (GUI work in websites/apps with no API)**: always Codex, via `node deliver/process/tools/codex-computer-use/codex_cu.mjs "<instruction>"` ([README](./deliver/process/tools/codex-computer-use/README.md), skill `.claude/skills/codex-computer-use`). It works in a background tab of the user's Chrome. **Secondary: Claude in Chrome** (`mcp__claude-in-chrome__*`) for FigJam/Figma and other canvas apps (its `javascript_tool` reaches `window.figma`), and as the fallback when a Codex run fails or the ChatGPT app is unavailable. Not Jev, `orca computer`, Cua sandboxes or ad hoc CDP.
- **Orca Agent IDE (Windows workstation & orchestration)**: [ORCA.md](./ORCA.md) - run multiple agents (Claude/Codex/Cursor/GLM) side by side in isolated git worktrees; replaces the WezTerm Agent Hub and the removed `@dispatch` layer
- **Sales, Manage and Growth pillars**: not in this repository. This repo is the Deliver pillar scoped to Brandklout; the other three live in `webzite-agentic-workflow`.
- **Pricing & Timeline Rules**: not in this repository, and they do **not** apply here. Brandklout is a partner engagement, not a per-page client — never compute or record a price, rate, quote or cost anywhere under `deliver/brandklout/`.
- **Deliver Pillar**: [deliver/DELIVER_SYSTEM_RULES.md](./deliver/DELIVER_SYSTEM_RULES.md)
- **Credentials**: [SYSTEM_RULES.md §4.2.2](./SYSTEM_RULES.md) - `~/.webzite/.env` is the single master file; every worktree `.env` is generated from it and must never be hand-edited
- **Client assets on Google Drive**: [deliver/docs/GOOGLE_DRIVE.md](./deliver/docs/GOOGLE_DRIVE.md) - every client has a shared drive; read the map, then `node scripts/drive.mjs ls/pull` before asking anyone to re-send files
- **MCP Index**: [mcp-servers/MCP_INDEX.md](./mcp-servers/MCP_INDEX.md) - all MCP servers used across the project
- **MCP Access Model**: [mcp-servers/ACCESS_MODEL.md](./mcp-servers/ACCESS_MODEL.md) - folder-based MCP permissions and profiles
- **Webflow MCP Setup**: [mcp-servers/webflow/setup.md](./mcp-servers/webflow/setup.md)

## Operational Protocol
1. **Understand the Rules**: Before starting a task, read [deliver/DELIVER_SYSTEM_RULES.md](./deliver/DELIVER_SYSTEM_RULES.md).
2. **Locate the Step**: Delivery is organised as scenarios in `deliver/process/scenario-*/`, one `.md` directive per step; the scripts they use live in `deliver/process/tools/` (or the scenario's `scripts/`). Start at [deliver/process/PROCESS_INDEX.md](./deliver/process/PROCESS_INDEX.md). The FigJam board *Deliver SOP's* draws the same scenarios; keep them in step.
3. **Use Artifacts**: Work in the step folder of the client's scenario, `deliver/brandklout/<client>/<scenario>/<step>/`, and store everything it produces (assets, code, runbook) in that step's `output/` folder — the only part of a step folder the client branch tracks. Start a scenario for a client with `node scripts/scenario.mjs start <client> <scenario>`. The directive and scripts beside `output/` are an untracked mirror of main: `node scripts/scenario.mjs sync` refreshes it (automatic on `npm install` and at Claude Code session start; run it yourself in other runtimes) and refuses to overwrite a mirror file you edited, because that edit exists nowhere else. Fix the process on main ([DELIVER_SYSTEM_RULES.md §3](./deliver/DELIVER_SYSTEM_RULES.md)).
4. **Token Optimization**: Read the step directive you are executing and only the tools it names.
5. **MCP Management**: MCP servers are shared infrastructure in `mcp-servers/`. Register new servers with `claude mcp add --scope project`. Before using any MCP, read the nearest `mcp-access.md` and the referenced profile in `mcp-servers/profiles/`. See [MCP Index](./mcp-servers/MCP_INDEX.md) and [MCP Access Model](./mcp-servers/ACCESS_MODEL.md).
6. **Directive Improvement Loop**: At task completion, update the related directive `.md` files used to learn or execute the process whenever the task reveals a missing step, changed requirement, new decision, corrected assumption, or reusable process improvement.
7. **Runbook Loop**: Also at task completion, add a dated entry to the step's `output/RUNBOOK.md` and a row to the client's `deliver/brandklout/<client>/RUNBOOK.md` (standing state on top). Repo-level work that belongs to no client goes to `.claude/runbook/` instead. **Runbooks are tracked — commit them.** Read `INDEX.md` and only the runs you need, never the whole history — Done (with the commit SHA), Next, and especially **Gotchas**. Write it for a reader with no memory of your session, and read it yourself when you pick a worktree up; it is no longer injected for you. This is a separate obligation from the directive loop above: directives capture reusable process, the runbook captures the live state of *this* worktree.
8. **Credentials**: Never hand-edit a worktree `.env` — it is generated from the single master file at `~/.webzite/.env` and rewritten on every `npm install`. A missing credential is added to the master (`[shared]` for account-wide, `[<client>]` for one client), then `node scripts/env-sync.mjs` in the worktree. Read [SYSTEM_RULES.md §4.2.2](./SYSTEM_RULES.md) before touching any secret, and never paste a value into a `.md`, a commit, or a chat.
9. **Version Control**: This system is managed via a GitHub repository. Follow the version control rules in [SYSTEM_RULES.md - Section 4](./SYSTEM_RULES.md). Commit lightweight `output/` step artifacts when useful, but never commit `.env` files, secrets, or binary/media assets. All new `.md` files must include a Version Control section.

## Version Control

This entry-point directive follows the root-level version control rules in [SYSTEM_RULES.md](./SYSTEM_RULES.md). Keep [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md), and [GEMINI.md](./GEMINI.md) identical whenever any one of them changes.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
