# Horizon - MCP Access

## Access Level
Client delivery.

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers
| MCP Server | Purpose |
|:---|:---|
| `webflow-horizon` | Site inspection, Designer build support, CMS collection setup, collection-item import, staging publish after confirmation. Grant must cover Horizon sites only — see the [server-per-principal model](../../../../mcp-servers/ACCESS_MODEL.md#server-instances-one-per-principal). |

## Target Resources
- **Workspace**: Farewell Agency
- **Site Name**: Horizon
- **Staging URL**: https://horizon-build.webflow.io
- **Target Site ID**: `6a1f7d0be8345316ba21999c`
- **Old Reference Site**: https://www.horizonbuildingcorp.com
- **Old Reference Site ID**: `675b24600dce6f2388670f18`

## Allowed Operations
- Read and inspect the Horizon Webflow site structure, styles, pages, assets, and CMS collections.
- Create reviewable CMS plans and import manifests in workflow `.tmp/` folders.
- Create or update CMS collections and collection items only after confirming the specific collection and source artifact.
- Build or replace staging-only page sections after confirming the target page and section.
- Publish to Webflow staging after explicit confirmation.

## Forbidden Operations
- Do not publish to production without explicit confirmation.
- Do not delete pages, collections, fields, collection items, assets, symbols/components, scripts, or existing Designer sections without explicit confirmation.
- Do not overwrite production data or perform bulk edits without a reviewed artifact and explicit confirmation.
- Do not change DNS, domains, billing, access, OAuth apps, or workspace settings.
- Do not store API keys, OAuth tokens, private cookies, passwords, or session exports in this repository.

## Confirmation Requirements
Before any mutating Webflow action, confirm:
- The active Webflow account/workspace.
- The target site ID.
- The target page and section.
- The CMS collection name and field schema.
- Whether the action is staging-only or production-impacting.

Publishing, deleting, overwriting, production data edits, DNS/domain changes, billing changes, and access changes require explicit confirmation in the current conversation.

## Runtime Authentication Notes
Webflow MCP uses runtime OAuth/session authentication. Verify connection through the active MCP client before using Webflow tools. If authentication is missing or the target site is not visible, stop and ask for runtime access rather than guessing.

## Artifact Storage
Store Webflow MCP outputs and CMS conversion artifacts in:

`deliver/farewell-agency/horizon/workflows/07-webflow-build/.tmp/`

For this experiment, section-to-CMS artifacts live under:

`deliver/farewell-agency/horizon/workflows/07-webflow-build/.tmp/cms-section-conversion/`

## Version Control
This project MCP access file follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Commit documentation and lightweight JSON/CSV/HTML artifacts only. Do not commit secrets or binary/media assets.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
