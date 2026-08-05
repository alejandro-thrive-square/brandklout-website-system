# MCP Access: Excellent Facets

This file controls MCP usage for the Excellent Facets client project (past client, site built and delivered entirely on Webflow; now in maintenance/update engagements).

## Access Scope

- **Access level:** `client`
- **Profile:** [client-delivery.md](../../../mcp-servers/profiles/client-delivery.md)
- **Project overview:** [project-overview.md](./project-overview.md)
- **Current maintenance intake:** Pending client-provided documents in `../workflows/15-improvement-intake-audit/.tmp/client-docs/`.
- **Previous spec reference:** legacy French-page update spec stored in the client root with its original filename.
- **Primary artifact path:** `deliver/excellent-facets/workflows/[workflow-name]/.tmp/`

## Active MCP Servers

| MCP Server | Status | Allowed Purpose |
| :--- | :--- | :--- |
| `webflow-excellent-facets` | Active for confirmed website update work | Page/CMS content edits, page creation, SEO metadata, redirects, staging QA, and publishing only after target site confirmation and per-change approval. Grant must cover the Excellent Facets site only. See the [server-per-principal model](../../../mcp-servers/ACCESS_MODEL.md#server-instances-one-per-principal). |

## Target Resources

- **Production domain:** `excellentfacets.com`
- **Webflow target:** Excellent Facets production site - site ID `667ba12b8def17ce19a9419b` (confirmed via `list_sites` on 2026-07-08; the grant exposes only this site). Custom domains: `excellentfacets.com`, `www.excellentfacets.com`.
- **Localization note:** The site does NOT use Webflow Localization. French pages are static duplicates of the English pages inside a `/fr` page folder. Work through the regular pages/element tools, never `data_localization_tool` locale IDs.
- **Current scope of work:** Maintenance updates are pending the new client documents. Until the new change list is normalized and approved, Webflow use should remain read-only except for explicitly confirmed work.

## Allowed Operations

- Read project docs and workflow artifacts.
- List and inspect the site's pages, CMS collections, styles, and locales via `webflow-excellent-facets`.
- Draft-level edits for pages, CMS items, SEO metadata, redirects, forms, or components only after the requested change is documented and approved for this maintenance cycle.
- Inspect staging, preview, or public URLs for QA.

## Forbidden Operations

- Do not publish, delete, overwrite, bulk edit, transfer access, change DNS, or modify production data without explicit confirmation.
- Do not touch pages, shared components, CMS collections, forms, custom code, redirects, or integrations outside the approved maintenance scope.
- Do not use private client credentials, OAuth tokens, cookies, passwords, or recovery codes in repo artifacts.
- Do not use Webflow MCP against a guessed site. Confirm the site ID first.
- Do not commit `.env` files, token values, private exports, or binary/media assets.

## Confirmation Requirements

Explicit confirmation is required before:

- Production deploys or publishing.
- DNS or domain changes.
- Page deletion, slug changes, or 301 redirect creation.
- Webflow site/page/CMS mutations outside the approved maintenance scope.
- Access grants, revocations, transfers, or credential/session use.
- Emailing, billing, or any client-facing notification.

## Runtime Authentication

MCP authentication is handled at runtime through Claude Code or the active MCP client. Authenticate via `/mcp`, selecting **only** the Excellent Facets site in the OAuth screen. This file may document target IDs and public URLs, but never credential values.

## Version Control

This MCP access file follows the root-level version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). Commit documentation and lightweight references only. Do not commit secrets, OAuth tokens, API keys, passwords, private cookies, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
