# Dentiq - MCP Access

## Access Level
Client delivery (Brandklout partner engagement).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers
| MCP Server | Purpose | Status |
| :--- | :--- | :--- |
| `webflow-brandklout` | Webflow reads and writes for the Dentiq site, through the shared Brandklout grant ([partner registry](../../../docs/mcp-access.md)) | **In the grant**, confirmed 2026-10-05 with `get_site` |
| `webflow-clientfirst` | Local Client-First tooling, no network | Available |

## Target Resources

| Resource | Value | Status |
| :--- | :--- | :--- |
| Webflow workspace | Brandklout (`63b4b7393e89b78575e9a9bb`) | Shared partner workspace |
| Webflow site | Dentiq Dental (`dentiq-dental-houston`), 89 pages | Confirmed 2026-10-05 |
| Site ID | `6a5f81effe0aee1d204818dd` | Confirmed 2026-10-05 (`wf-publish.mjs state`) |
| Production domains | `dentiq.dental`, `www.dentiq.dental` | Live production. A live publish names both |
| Staging | `dentiq-dental-houston.webflow.io` | Staging publish is the default review |

Before any mutating call, pass the site ID from this table explicitly. Never act on whichever
site a tool defaults to.

## Allowed operations
- Draft edits to copy, components and per-page JSON-LD; staging publishes.
- A live publish only on an explicit go-ahead in the conversation, with both domains named.

## Version Control

Documentation only; no secrets. OAuth tokens are held by Claude Code at runtime and never
committed. Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
