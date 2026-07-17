# Webzite Agent Entry Point

Welcome, agent. You are operating within the **Webzite Agentic Workflow** system. To perform your tasks effectively, you must adhere to the core architectural rules and pillar-specific directives.

> [!IMPORTANT]
> **Documentation Integrity Rule**: Any update to the system's logic or structure requires an immediate update to the relevant `.md` files.

> [!IMPORTANT]
> This file must stay identical to [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md), and [GEMINI.md](./GEMINI.md). These filenames exist separately because different agent runtimes auto-load different entry-point names.

## Quick Links
- **Master Rules**: [SYSTEM_RULES.md](./SYSTEM_RULES.md)
- **New Computer Install**: [INSTALL.md](./INSTALL.md)
- **VPS Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Agent Hermes & Two-Workspace Sync**: [HERMES.md](./HERMES.md) - resume work from anywhere (phone via Hermes or local) with `bash scripts/sync.sh`
- **Pricing & Timeline Rules**: [PRICING_TIMELINE_RULES.md](./sales/PRICING_TIMELINE_RULES.md) - per-page rates and durations (single source of truth)
- **Sales Pillar**: [sales/SALES_SYSTEM_RULES.md](./sales/SALES_SYSTEM_RULES.md)
- **Manage Pillar**: [manage/MANAGE_SYSTEM_RULES.md](./manage/MANAGE_SYSTEM_RULES.md)
- **Growth Pillar**: [growth/GROWTH_SYSTEM_RULES.md](./growth/GROWTH_SYSTEM_RULES.md)
- **Deliver Pillar**: [deliver/DELIVER_SYSTEM_RULES.md](./deliver/DELIVER_SYSTEM_RULES.md)
- **MCP Index**: [mcp-servers/MCP_INDEX.md](./mcp-servers/MCP_INDEX.md) - all MCP servers used across the project
- **MCP Access Model**: [mcp-servers/ACCESS_MODEL.md](./mcp-servers/ACCESS_MODEL.md) - folder-based MCP permissions and profiles
- **Webflow MCP Setup**: [mcp-servers/webflow/setup.md](./mcp-servers/webflow/setup.md)
- **Cross-Provider Agent Dispatch**: [.agents/DISPATCH.md](./.agents/DISPATCH.md) - let any agent trigger another provider's agent (Claude/Codex/Pi), local + VPS. Trigger phrase: `@dispatch`
- **Desktop Notifications**: `dispatch.py` shows a toast when agents finish tasks (Win/Linux/macOS). Silence per-call with `--no-notify` or globally in `roster.toml` under `[notifications]`. Requires `libnotify-bin` on Linux VPS.

## Trigger Phrases

- **`@dispatch`** — When a message contains a line starting with `@dispatch`, load and follow [.agents/TRIGGER_PROMPT.txt](./.agents/TRIGGER_PROMPT.txt), then execute the cross-provider dispatch it describes. Syntax: `@dispatch [async] [diff:N] [account:personal] <role> <task...>` (e.g. `@dispatch review find bugs in dispatch.py`).
  - **Pick the role by task type — it already carries the model.** Do not rate difficulty; `diff:N` is an override for when *this* instance differs from what its role implies, and if you're unsure, omit it.
  - Roles by tier — **max** (Fable): `review` `code-review` `audit` `bugs` · `plan` `strategy` `system-improvement` · `design-qa` `design-review` `ux-review`. **heavy** (Opus / Codex Sol): `design` `build` · `design2` `build2` · `automation` `backend` · `motion` `animation` `remotion`. **standard** (Sonnet / gpt-5.5): `site-update` `media` · `scrape` `data`. **lite** (GLM 5.2): `docs` `vcs` `commit` `token-opt` `linking` · `docs2` `vcs2` `commit2` `token-opt2` `linking2` (2nd concurrent lite worker, on opencode).
  - **`@dispatch loop`** runs an autonomous produce→verify→refine loop: it iterates a producer role against a verifier until the verifier approves or a stop cap fires. Use `recipe:NAME` (`design-refine`, `bug-hunt`, `doc-tighten`, `plan-sharpen`) or name the producer + `verify:<role>`. Sub-agents run unattended in permission-bypass mode confined to a `--cwd` workspace; the loop refuses mutating roles (`vcs`/`commit`/`deploy`/`publish`) and never auto-commits or deploys. See [.agents/DISPATCH.md](./.agents/DISPATCH.md).
  - Mutating actions still require explicit confirmation.

## Operational Protocol
1. **Understand the Pillar**: Before starting a task, read the rules for the relevant pillar.
2. **Locate the Workflow**: Workflows are stored in subfolders with a `.md` directive and a `.py` executor.
3. **Use Artifacts**: Store all intermediate data in the `.tmp/` folder within the specific workflow directory.
4. **Token Optimization**: Filter your context to the specific workflow folder you are executing.
5. **MCP Management**: MCP servers are shared infrastructure in `mcp-servers/`. Register new servers with `claude mcp add --scope project`. Before using any MCP, read the nearest `mcp-access.md` and the referenced profile in `mcp-servers/profiles/`. See [MCP Index](./mcp-servers/MCP_INDEX.md) and [MCP Access Model](./mcp-servers/ACCESS_MODEL.md).
6. **Directive Improvement Loop**: At task completion, update the related directive `.md` files used to learn or execute the process whenever the task reveals a missing step, changed requirement, new decision, corrected assumption, or reusable process improvement.
7. **Version Control**: This system is managed via a GitHub repository. Follow the version control rules in [SYSTEM_RULES.md - Section 4](./SYSTEM_RULES.md). Commit lightweight `.tmp/` workflow artifacts when useful, but never commit `.env` files, secrets, or binary/media assets. All new `.md` files must include a Version Control section.

## Version Control

This entry-point directive follows the root-level version control rules in [SYSTEM_RULES.md](./SYSTEM_RULES.md). Keep [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md), and [GEMINI.md](./GEMINI.md) identical whenever any one of them changes.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
