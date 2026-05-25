# MCP Profile: Client Delivery

Use this profile for signed client projects under `deliver/[client-name]/`.

## Allowed Use

- Use only the MCP servers listed in the client's `docs/mcp-access.md`.
- Work only on the target resources listed in that file or explicitly confirmed by the user.
- Read, audit, build, stage, and update project resources within the approved client scope.
- Store MCP outputs in the owning workflow's `.tmp/` folder unless the client workflow specifies another repo-safe path.

## Required Checks

- Read `deliver/[client-name]/docs/project-overview.md`.
- Read `deliver/[client-name]/docs/mcp-access.md`.
- Confirm runtime authentication before using authenticated tools.
- Confirm target site, workspace, project, base, repository, or deployment before changes.
- Treat missing target IDs as a blocker for mutation; list available resources first, then confirm the target.

## Confirmation Required

Publishing, deleting, overwriting, bulk editing, billing, emailing, deploying to production, DNS changes, access transfer, production data edits, and credentials/session use require explicit confirmation.

## Version Control

This profile follows the root-level version control rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md). Do not commit secrets, OAuth tokens, API keys, passwords, private cookies, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
