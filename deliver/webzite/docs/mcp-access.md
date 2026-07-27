# MCP Access: Webzite Studio (Internal)

This file controls MCP usage for the Webzite Studio site redesign.

> [!NOTE]
> This is an **internal** project — Webzite is its own client. The access rules are unchanged from a client engagement: owning the site is not a reason to relax confirmation requirements. `webzite.studio` is production.

## Access Scope

- **Access level:** `client` (self)
- **Profile:** [client-delivery.md](../../../mcp-servers/profiles/client-delivery.md)
- **Project overview:** [project-overview.md](./project-overview.md)
- **Primary artifact path:** `deliver/webzite/workflows/[workflow-name]/.tmp/`

## Active MCP Servers

| MCP Server | Status | Allowed Purpose |
| :--- | :--- | :--- |
| `webflow-webzite` | **Out of scope** — registered but not yet in use | No Webflow target has been chosen. The current phase stops at design HTML. Do not invoke until a target is confirmed and the build phase is explicitly opened. See the [server-per-principal model](../../../mcp-servers/ACCESS_MODEL.md#server-instances-one-per-principal). |
| Figma | Optional / runtime-authenticated | Design generation and inspection only when a workflow calls for it. |

## Target Resources

- **Production domain:** `webzite.studio` (live, Webflow)
- **Webflow target:** **Undecided.** The choice between a staging page on the existing site and a new site is deferred until after design review. List sites and confirm the site ID before any mutation.
- **Current phase:** `04-design` — HTML output only, no Webflow interaction.

## Allowed Operations

- Read project docs and workflow artifacts.
- Generate design artifacts within `deliver/webzite/workflows/*/.tmp/`.
- Inspect public URLs for QA and analysis.
- Read `manage/brand-assets/` as the design-system source of truth.

## Forbidden Operations

- Do not publish, delete, overwrite, bulk edit, change DNS, or modify production data without explicit confirmation. **The live site is production traffic.**
- Do not invoke `webflow-webzite` while the Webflow target is undecided.
- Do not use Webflow MCP against a guessed site. Confirm the site ID first.
- **Do not download or reuse media from the live webzite.studio site.** Text and structure were captured for analysis; media was deliberately excluded. See the asset rules in [project-overview.md](./project-overview.md).
- Do not commit `.env` files, token values, or binary/media assets.

## Confirmation Requirements

Explicit confirmation is required before:

- Any Webflow site/page/CMS mutation, including on a staging page.
- Publishing or production deploys.
- DNS or domain changes.
- Pointing the live domain at any redesigned page.
- Access grants, revocations, transfers, or credential/session use.

## Runtime Authentication

MCP authentication is handled at runtime through Claude Code or the active MCP client. This file may document target IDs and public URLs, but never credential values.

## Version Control

This MCP access file follows the root-level version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). Commit documentation and lightweight references only. Do not commit secrets, OAuth tokens, API keys, passwords, private cookies, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
