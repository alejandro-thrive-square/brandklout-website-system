# MCP Access: Giovanni Serrano

This file controls MCP usage for the Giovanni Serrano client project.

## Access Scope

- **Access level:** `client`
- **Profile:** [client-delivery.md](../../../mcp-servers/profiles/client-delivery.md)
- **Project overview:** [project-overview.md](./project-overview.md)
- **Primary artifact path:** `deliver/giovanni-serrano/workflows/[workflow-name]/.tmp/`

## Active MCP Servers

| MCP Server | Status | Allowed Purpose |
| :--- | :--- | :--- |
| Figma | Optional / runtime-authenticated | Design generation, design inspection, and design handoff only when a workflow calls for it. |
| Webflow | Optional future path | Webflow build, CMS, staging, QA, and launch only if the optional Webflow path is activated. |

## Target Resources

- **Production domain:** `giovanniserrano.com`
- **Current delivery path:** Vercel/Airtable path documented in `project-overview.md`.
- **Webflow target:** Not active. If activated, list sites first and confirm the target site ID before any mutation.
- **Airtable target:** Use only environment variable names and non-secret base/table identifiers documented by the relevant workflow. Do not store token values here.

## Allowed Operations

- Read project docs and workflow artifacts.
- Generate design or implementation artifacts for the approved workflow scope.
- Inspect staging, preview, or public URLs for QA.
- Use Figma MCP for design production only when the active workflow requires it.
- Use Webflow MCP only if the optional Webflow build path is explicitly activated.

## Forbidden Operations

- Do not publish, delete, overwrite, bulk edit, transfer access, change DNS, or modify production data without explicit confirmation.
- Do not use private client credentials, OAuth tokens, cookies, passwords, or recovery codes in repo artifacts.
- Do not use Webflow MCP against a guessed site. Confirm the site ID first.
- Do not commit `.env` files, token values, private exports, or binary/media assets.

## Confirmation Requirements

Explicit confirmation is required before:

- Production deploys or publishing.
- DNS or domain changes.
- Webflow site/page/CMS mutations.
- Airtable schema or production content edits.
- Access grants, revocations, transfers, or credential/session use.
- Emailing, billing, or any client-facing notification.

## Runtime Authentication

MCP authentication is handled at runtime through Claude Code or the active MCP client. This file may document target IDs and public URLs, but never credential values.

## Version Control

This MCP access file follows the root-level version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). Commit documentation and lightweight references only. Do not commit secrets, OAuth tokens, API keys, passwords, private cookies, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
