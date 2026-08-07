# Livewell Dental - MCP Access

## Access Level
Client delivery.

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers
| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-livewell-dental` | Site inspection, audit reads, section paste support, component conversion, CMS work, staging publish after confirmation. | **Not registered yet** - register with `claude mcp add --scope project` once Brandklout grants access. |

Per the [server-per-principal model](../../../../mcp-servers/ACCESS_MODEL.md#server-instances-one-per-principal),
the `webflow-livewell-dental` grant must cover **only** the Livewell Dental site - never
other Brandklout clients, and never other agencies' sites. Do not reuse the `webflow`,
`webflow-clifton-exteriors`, or any other existing instance for this project.

## Target Resources
- **Workspace**: TBD (Brandklout or client-owned) - record after first `list_sites`
- **Site Name**: Livewell Dental
- **Live URL**: https://www.livewelldentalva.com
- **Staging URL**: https://livewelldentalva.webflow.io
- **Target Site ID**: `69d03fdbe999e9907724a69d` (read from `data-wf-site` in published HTML
  2026-07-27; **confirm via `list_sites` before any mutating action**).

## Allowed Operations
- Read and inspect the Livewell Dental Webflow site structure, styles, pages, assets,
  components, CMS collections, and custom code.
- Create reviewable audit and build artifacts in workflow `.tmp/` folders.
- Apply approved changes to pages/styles/CMS only after the change is on an approved change list.
- Publish to Webflow **staging** after explicit confirmation.

## Forbidden Operations
- Do not publish to production without explicit confirmation. This is a **live business site**
  taking real patient enquiries - assume every production action is customer-visible.
- Do not delete pages, collections, fields, items, assets, components, or scripts without
  explicit confirmation.
- Do not overwrite production data or perform bulk edits without a reviewed artifact and
  explicit confirmation.
- Do not modify forms or form-submission destinations without confirmation (patient enquiry flow).
- Do not change DNS, domains, billing, access, OAuth apps, or workspace settings.
- Do not store API keys, OAuth tokens, private cookies, passwords, or session exports in this repository.

## Confirmation Requirements
Before any mutating Webflow action, confirm:
- The active Webflow account/workspace.
- The target site ID.
- The target page and section/component.
- Whether the action is staging-only or production-impacting.

Publishing, deleting, overwriting, production data edits, form changes, DNS/domain changes,
billing changes, and access changes require explicit confirmation in the current conversation.

## Runtime Authentication Notes
Webflow MCP uses runtime OAuth keyed to the instance name. Verify the connection through
`/mcp` before using Webflow tools. If authentication is missing or the target site is not
visible, stop and ask for runtime access rather than guessing or falling back to another
Webflow instance.

Practical note: Designer-bridge (`designer_tool`) actions are slow and must run one at a
time; the `data_*` Data API tools are fast and headless and should be preferred for audit
reads, patches, code, and publishing.

## Artifact Storage
- Audit artifacts: `deliver/brandklout/livewell-dental/workflows/15-improvement-intake-audit/.tmp/`
- Build artifacts (once copied): `deliver/brandklout/livewell-dental/workflows/07-webflow-build/.tmp/`

## Version Control
This project MCP access file follows the root-level version control rules in
[SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Commit documentation and lightweight
JSON/CSV/HTML artifacts only. Do not commit secrets or binary/media assets.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
