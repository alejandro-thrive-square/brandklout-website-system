# Livewell Dental - MCP Access

## Access Level
Client delivery.

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers
| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-brandklout` | Site inspection, audit reads, section paste support, component conversion, CMS work, staging publish after confirmation. Shared instance covering all Brandklout clients. | **LIVE — authenticated on the `team` profile 2026-08-07.** |
| `webflow-clientfirst` | Local Client-First conversion helper. Reads files, holds no credentials, and makes no network calls. | Always available. |

The dedicated `webflow-livewell-dental` instance was retired unauthenticated on 2026-08-07. All
Brandklout clients live in one workspace Brandklout owns, so a per-client instance authorized
against that same workspace and isolated nothing — see
[ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md#when-the-partner-owns-the-workspace-one-instance-is-correct).

> [!IMPORTANT]
> **The site ID is the boundary now, not the tool prefix.** Every Brandklout client shares the
> `mcp__webflow-brandklout__*` prefix, so it cannot tell you which client you are acting on. This
> folder authorizes **only** the Livewell Dental site recorded below — pass its ID explicitly on
> every call, and never act on a site the tool defaulted to or listed first. Do not use the deprecated
> `webflow` instance, or any instance belonging to another workspace.

## Target Resources
- **Workspace**: Brandklout, ID `63b4b7393e89b78575e9a9bb` (confirmed 2026-08-07)
- **Site Name**: Livewell Dental
- **Live URL**: https://www.livewelldentalva.com
- **Staging URL**: https://livewelldentalva.webflow.io
- **Target Site ID**: `69d03fdbe999e9907724a69d` (confirmed 2026-08-07 through `list_sites`;
  domains `livewelldentalva.com` and `www.livewelldentalva.com`).

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
- **Do not touch another Brandklout client's site.** The shared instance can reach all of them;
  this folder authorizes exactly one. A call carrying a sibling's site ID is out of bounds even
  though the grant permits it.
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
Webflow MCP uses runtime OAuth keyed to the instance name. Authenticate `webflow-brandklout` in a
**team-profile** terminal (`claude team`, then `/mcp`); one authentication covers every Brandklout
client worktree. Verify the connection through `/mcp` before using Webflow tools. If authentication
is missing or the target site is not visible, stop and ask for runtime access rather than guessing
or falling back to another Webflow instance.

Adding a site to this grant is a **partnership-level** action, not a client-level one:
re-authorization replaces the grant wholesale, so the OAuth screen must have every active
Brandklout client ticked. Follow
[the partner file](../../docs/mcp-access.md#onboarding-a-new-brandklout-client); never run it from
this folder.

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
