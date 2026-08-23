# MCP Access: Dealer Websites

This file controls MCP usage for the Dealer Websites client project (existing Webflow site built previously by the studio, now under maintenance/update engagement).

## Access Scope

- **Access level:** `client`
- **Profile:** [client-delivery.md](../../../mcp-servers/profiles/client-delivery.md)
- **Project overview:** [project-overview.md](./project-overview.md)
- **Primary artifact path:** `deliver/dealer-websites/workflows/07-webflow-build/.tmp/`

## Active MCP Servers

| MCP Server | Status | Allowed Purpose |
| :--- | :--- | :--- |
| `webflow-dealer-websites` | Active for confirmed maintenance/build work | Webflow build setup (CSS variable import, clipboard paste of converted sections), CMS, page edits, staging QA, and publishing only after target site confirmation and per-change approval. Grant must cover the Dealer Websites site only — see the [server-per-principal model](../../../mcp-servers/ACCESS_MODEL.md#server-instances-one-per-principal). |

## Target Resources

- **Production domain:** `<TBD>` (staging: `dealer-websites.webflow.io`)
- **Webflow target:** Dealer Websites production site — site ID `69c8c0f16c14c214b2451dcf` (confirmed via `list_sites` 2026-08-08; the grant exposes only this site).
- **Current scope of work:** Maintenance / updates via the `07-webflow-build` workflow only (see [project-overview.md](./project-overview.md)).

## Allowed Operations

- Read project docs and workflow artifacts.
- List and inspect the site's pages, CMS collections, styles, and locales via `webflow-dealer-websites`.
- Run the `07-webflow-build` toolchain: convert approved HTML/CSS to Webflow clipboard payloads and import CSS variables before pasting.
- Draft-level edits to the approved pages/CMS items, applied to staging first.
- Inspect staging, preview, or public URLs for QA.

## Forbidden Operations

- Do not publish, delete, overwrite, bulk edit, transfer access, change DNS, or modify production data without explicit confirmation.
- Do not use private client credentials, OAuth tokens, cookies, passwords, or recovery codes in repo artifacts.
- Do not use Webflow MCP against a guessed site. Confirm the site ID first.
- Do not commit `.env` files, token values, private exports, or binary/media assets.

## Confirmation Requirements

Explicit confirmation is required before:

- Production deploys or publishing.
- DNS or domain changes.
- Webflow site/page/CMS mutations outside the approved maintenance scope.
- Page deletion, slug changes, or 301 redirect creation.
- Access grants, revocations, transfers, or credential/session use.
- Emailing, billing, or any client-facing notification.

## Runtime Authentication

MCP authentication is handled at runtime through Claude Code or the active MCP client. Authenticate via `/mcp`, selecting **only** the Dealer Websites site in the OAuth screen. This file may document target IDs and public URLs, but never credential values.

## Version Control

This MCP access file follows the root-level version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). Commit documentation and lightweight references only. Do not commit secrets, OAuth tokens, API keys, passwords, private cookies, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
