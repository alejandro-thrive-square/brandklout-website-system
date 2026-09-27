# Alki House — MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

| MCP Server | Purpose | Status |
| :--- | :--- | :--- |
| `webflow-brandklout` | Webflow access for every Brandklout client. Shared instance — the site ID is the boundary, not the tool prefix. | Available, **but no Webflow site exists for this client.** Do not write to another client's site from here. |
| `webflow-clientfirst` | Local Client-First conversion helper. Reads files, holds no credentials, makes no network calls. | Always available. |

Partnership-level Asana access is covered by [`../../docs/mcp-access.md`](../../docs/mcp-access.md)
and is **read-only**.

## Non-MCP credentials in use

| Credential | Where | Scope |
| :--- | :--- | :--- |
| `[shared]` account-wide values | generated worktree `.env`, from `~/.webzite/.env` | Every worktree |
| `[alki-house]` section | `~/.webzite/.env` | **Empty** as of 2026-09-12 — add the Instatic/Railway values when the instance exists, then `node scripts/env-sync.mjs` |

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
