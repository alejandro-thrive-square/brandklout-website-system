# Webzite Agent Entry Point

Welcome, agent. You are operating within the **Webzite Agentic Workflow** system. To perform your tasks effectively, you must adhere to the core architectural rules and pillar-specific directives.

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
> **Runbooks**: after each task, add a dated run file under the client's `docs/runbook/` (or `.claude/runbook/` for repo-level work) and keep the standing `RUNBOOK.md` current. When you start, read `docs/runbook/INDEX.md` and only the runs you need — never the whole history. Nothing enforces this any more — the automatic session-rotation hooks were removed on 2026-08-22 (see [SYSTEM_RULES.md §5](./SYSTEM_RULES.md)), so the runbook is now a convention you follow, not a gate you hit.

## Quick Links
- **Master Rules**: [SYSTEM_RULES.md](./SYSTEM_RULES.md)
- **Runbooks**: [SYSTEM_RULES.md §5](./SYSTEM_RULES.md) - one file per run under `deliver/brandklout/<client>/docs/runbook/`, indexed; read the index, not the history
- **Client runbooks on `main` are a SNAPSHOT.** Each client's runbook is written on its own branch; `main` carries a copy taken 2026-09-09 so the history is visible from here. The branch is always the newer one — read it there before trusting a date. The re-sync command is in commit `3a19c955`.
- **New Computer Install**: [INSTALL.md](./INSTALL.md)
- **VPS Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Agent Hermes & Two-Workspace Sync**: [HERMES.md](./HERMES.md) - resume work from anywhere (phone via Hermes or local) with `bash scripts/sync.sh`
- **Orca Agent IDE (Windows workstation & orchestration)**: [ORCA.md](./ORCA.md) - run multiple agents (Claude/Codex/Cursor/GLM) side by side in isolated git worktrees; replaces the WezTerm Agent Hub and the removed `@dispatch` layer
- **Sales, Manage and Growth pillars**: not in this repository. This repo is the Deliver pillar scoped to Brandklout; the other three live in `webzite-agentic-workflow`.
- **Pricing & Timeline Rules**: not in this repository, and they do **not** apply here. Brandklout is a partner engagement, not a per-page client — never compute or record a price, rate, quote or cost anywhere under `deliver/brandklout/`.
- **Deliver Pillar**: [deliver/DELIVER_SYSTEM_RULES.md](./deliver/DELIVER_SYSTEM_RULES.md)
- **Credentials**: [SYSTEM_RULES.md §4.2.2](./SYSTEM_RULES.md) - `~/.webzite/.env` is the single master file; every worktree `.env` is generated from it and must never be hand-edited
- **Client assets on Google Drive**: [deliver/brandklout/docs/GOOGLE_DRIVE.md](./deliver/brandklout/docs/GOOGLE_DRIVE.md) - every client has a shared drive; read the map, then `node scripts/drive.mjs ls/pull` before asking anyone to re-send files
- **MCP Index**: [mcp-servers/MCP_INDEX.md](./mcp-servers/MCP_INDEX.md) - all MCP servers used across the project
- **MCP Access Model**: [mcp-servers/ACCESS_MODEL.md](./mcp-servers/ACCESS_MODEL.md) - folder-based MCP permissions and profiles
- **Webflow MCP Setup**: [mcp-servers/webflow/setup.md](./mcp-servers/webflow/setup.md)

## Operational Protocol
1. **Understand the Pillar**: Before starting a task, read the rules for the relevant pillar.
2. **Locate the Workflow**: Workflows are stored in subfolders with a `.md` directive and a `.py` executor.
3. **Use Artifacts**: Store all intermediate data in the `.tmp/` folder within the specific workflow directory.
4. **Token Optimization**: Filter your context to the specific workflow folder you are executing.
5. **MCP Management**: MCP servers are shared infrastructure in `mcp-servers/`. Register new servers with `claude mcp add --scope project`. Before using any MCP, read the nearest `mcp-access.md` and the referenced profile in `mcp-servers/profiles/`. See [MCP Index](./mcp-servers/MCP_INDEX.md) and [MCP Access Model](./mcp-servers/ACCESS_MODEL.md).
6. **Directive Improvement Loop**: At task completion, update the related directive `.md` files used to learn or execute the process whenever the task reveals a missing step, changed requirement, new decision, corrected assumption, or reusable process improvement.
7. **Runbook Loop**: Also at task completion, add a dated run file at `deliver/brandklout/<client>/docs/runbook/YYYY-MM-DD-<slug>.md`, add its row to that folder's `INDEX.md`, and refresh the standing `docs/RUNBOOK.md`. Repo-level work that belongs to no client goes to `.claude/runbook/` instead. **Runbooks are tracked — commit them.** Read `INDEX.md` and only the runs you need, never the whole history — Done (with the commit SHA), Next, and especially **Gotchas**. Write it for a reader with no memory of your session, and read it yourself when you pick a worktree up; it is no longer injected for you. This is a separate obligation from the directive loop above: directives capture reusable process, the runbook captures the live state of *this* worktree.
8. **Credentials**: Never hand-edit a worktree `.env` — it is generated from the single master file at `~/.webzite/.env` and rewritten on every `npm install`. A missing credential is added to the master (`[shared]` for account-wide, `[<client>]` for one client), then `node scripts/env-sync.mjs` in the worktree. Read [SYSTEM_RULES.md §4.2.2](./SYSTEM_RULES.md) before touching any secret, and never paste a value into a `.md`, a commit, or a chat.
9. **Version Control**: This system is managed via a GitHub repository. Follow the version control rules in [SYSTEM_RULES.md - Section 4](./SYSTEM_RULES.md). Commit lightweight `.tmp/` workflow artifacts when useful, but never commit `.env` files, secrets, or binary/media assets. All new `.md` files must include a Version Control section.

## Version Control

This entry-point directive follows the root-level version control rules in [SYSTEM_RULES.md](./SYSTEM_RULES.md). Keep [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md), and [GEMINI.md](./GEMINI.md) identical whenever any one of them changes.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
