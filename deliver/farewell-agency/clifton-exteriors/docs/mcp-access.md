# Clifton Exteriors - MCP Access

## Access Level
Client delivery.

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers
| MCP Server | Purpose |
|:---|:---|
| `webflow-clifton-exteriors` | Site inspection, section paste support, component conversion, Designer bridge work, CMS setup, staging publish after confirmation. |
| `webflow` (legacy, deprecated) | Only while active work still holds its grant; migrate to `webflow-clifton-exteriors` at the next re-authentication. |

Per the [server-per-principal model](../../../../mcp-servers/ACCESS_MODEL.md#server-instances-one-per-principal), the `webflow-clifton-exteriors` grant must cover **only** the Clifton Exteriors site — never other clients' sites.

## Target Resources
- **Workspace**: Farewell Agency
- **Site Name**: Clifton Exteriors
- **Staging URL**: https://clifton-exteriors-lutum.webflow.io
- **Old Reference Site**: https://www.cliftonexteriors.com
- **Target Site ID**: `6a234fcd5732d1f0a674156f` (confirmed via `list_sites` 2026-07-08; display name "Clifton Exteriors + LUTUM").

## Allowed Operations
- Read and inspect the Clifton Exteriors Webflow site structure, styles, pages, assets, components, and CMS collections.
- Create reviewable build artifacts and payloads in workflow `.tmp/` folders.
- Convert reviewed, pasted sections into Webflow components after confirming the target page and section.
- Create or update CMS collections and items only after confirming the specific collection and source artifact.
- Publish to Webflow staging after explicit confirmation.

## Forbidden Operations
- Do not publish to production without explicit confirmation.
- Do not delete pages, collections, fields, items, assets, components, scripts, or the teammate's existing Designer sections without explicit confirmation.
- Do not overwrite production data or perform bulk edits without a reviewed artifact and explicit confirmation.
- Do not change DNS, domains, billing, access, OAuth apps, or workspace settings.
- Do not store API keys, OAuth tokens, private cookies, passwords, or session exports in this repository.

## Confirmation Requirements
Before any mutating Webflow action, confirm:
- The active Webflow account/workspace.
- The target site ID.
- The target page and section/component.
- Whether the action is staging-only or production-impacting.

Publishing, deleting, overwriting, production data edits, DNS/domain changes, billing changes, and access changes require explicit confirmation in the current conversation.

## Runtime Authentication Notes
Webflow MCP uses runtime OAuth authentication keyed to the instance name. Verify connection through `/mcp` before using Webflow tools. If authentication is missing or the target site is not visible, stop and ask for runtime access rather than guessing.

## Artifact Storage
Store Webflow MCP outputs and conversion artifacts in:

`deliver/farewell-agency/clifton-exteriors/workflows/07-webflow-build/.tmp/`

## Version Control
This project MCP access file follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Commit documentation and lightweight JSON/CSV/HTML artifacts only. Do not commit secrets or binary/media assets.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
