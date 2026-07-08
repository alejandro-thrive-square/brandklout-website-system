# MCP Profile: Agent Dispatch

Use this profile for the **agent-dispatch** MCP server — the cross-provider orchestration layer that lets any agent (Claude Code, Codex, pi, Gemini) trigger another provider's agent headlessly.

- **Access level:** `global` — a cross-pillar utility, safe to call from any folder.
- **MCP server:** `agent-dispatch` (stdio). Setup: [../agent-dispatch/setup.md](../agent-dispatch/setup.md) · Engine: [.agents/dispatch.py](../../.agents/dispatch.py) · Directive: [.agents/DISPATCH.md](../../.agents/DISPATCH.md).

> [!IMPORTANT]
> The dispatch server **holds no platform grants itself** — it only launches other agent runtimes. Those sub-agents are still bound by the active folder's `mcp-access.md`. Dispatch is a launcher, **not** an access elevator.

## Allowed Use

- `ask` — synchronously run another provider's agent and return its answer (quick questions / sub-tasks).
- `handoff` / `collect` — queue a task for async processing and read the answer later.
- `status` / `routes` — inspect the queue and the role→agent roster.

## Required Checks

- Confirm the `role` / `agent` target before dispatching (run `routes` if unsure).
- Confirm `cwd` points at the intended workflow folder, so the sub-agent reads the right directive and is bound by the right `mcp-access.md`.
- Respect the recursion guard (`max_depth`) and per-call `timeout`; the dispatcher enforces both automatically.

## Confirmation Required

Dispatch does **not** bypass the standard mutating-action rules. A sub-agent task that would publish, delete, overwrite, deploy, send email, bill, change DNS/access, or edit production data still requires explicit confirmation — exactly as if that agent ran directly in the folder.

## Cost Note

Each `ask` boots a full agent runtime (tokens + latency). Prefer it for work needing reasoning + tools + file edits; use a direct API call for trivial lookups.

## Version Control

This profile follows the root-level version control rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md). The dispatch server is stdlib-only Python. Do not commit secrets, provider login tokens, API keys, or private session data.

## Infrastructure

- **Hosting**: Hostinger VPS (Ubuntu 24.04 LTS) + local Windows workstation — identical behaviour on both.
- **Runtime**: Python 3.11+ (stdlib only). Provider CLIs installed per machine.
