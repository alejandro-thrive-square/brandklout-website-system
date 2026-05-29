# MCP Access Model

This document defines how agents use Model Context Protocol (MCP) servers across the Webzite Agentic Workflow. MCP server definitions stay centralized, while permission and target-resource decisions are controlled by the active folder.

## Access Levels

| Level | Folder Scope | Purpose |
| :--- | :--- | :--- |
| `global` | Repository-wide | Utility MCPs that are safe across pillars, such as design, browser, search, or read-only analysis tools. |
| `agency` | Webzite-owned folders and workflows | MCP access to Webzite-owned accounts, sites, projects, dashboards, and assets. |
| `client` | `deliver/[client-name]/` | MCP access to signed client projects, client-owned platforms, or client-authorized workspaces. |
| `prospect` | Sales and Growth lead workflows | Public or pre-contract analysis of prospect websites, listings, and reference material. |
| `workflow` | A specific workflow folder | Narrow MCP access needed only for one workflow execution. |

## Folder-Based Control

MCP server definitions are stored in `.mcp.json` and documented in `mcp-servers/`. Folder-level access is controlled by `mcp-access.md` files.

Before using any MCP tool, agents must:

1. Identify the active folder context.
2. Read the closest applicable `mcp-access.md`.
3. Read the referenced profile in `mcp-servers/profiles/`.
4. Confirm the MCP server is listed in [MCP_INDEX.md](./MCP_INDEX.md).
5. Verify runtime authentication through `/mcp`, `claude mcp list`, or the MCP client's equivalent status check.
6. Confirm the target account, site, base, project, repository, or deployment before making changes.
7. Ask explicit confirmation before publishing, deleting, overwriting, billing, emailing, deploying, changing production data, or using private session data.
8. Store MCP outputs in the active workflow's `.tmp/` folder unless that workflow specifies a different repo-safe artifact path.

If no `mcp-access.md` exists for the active folder and the task requires an MCP, create or request one before using the MCP. Read-only public prospect analysis may use the `prospect-audit` profile when the workflow directive already allows public web analysis.

> [!NOTE]
> **VPS-resident agents (e.g., [Hermes](../HERMES.md))** that operate inside this repository's folders are bound by the same folder-based `mcp-access.md` rules as any other agent. Their own external projects live outside this repository and are out of scope here — do not add a Hermes-specific MCP profile, since that would imply Hermes' infrastructure lives in this repo.

## MCP Access File Pattern

Each folder that uses MCPs should include an `mcp-access.md` file with:

- Access level.
- Referenced profile.
- Active MCP servers.
- Target accounts, sites, projects, repositories, bases, or deployment targets.
- Allowed operations.
- Forbidden operations.
- Confirmation requirements.
- Runtime authentication notes without secret values.
- Artifact storage path.

Use identifiers such as site IDs, workspace names, base IDs, project slugs, and public URLs when they are not secrets. Never include API keys, OAuth tokens, passwords, full credential values, private cookies, or recovery codes.

## Scope Strategy

- **Project scope**: Use `.mcp.json` for team-visible server definitions that are safe to commit.
- **User scope**: Use user/global MCPs for private tools available across projects.
- **Local scope**: Use local-scoped MCP definitions for experimental tools, private credentials, or stronger client isolation. Local scope is stored outside this repository and must not become the default unless a client project requires it.

## Mutating Actions

The following actions always require explicit confirmation in the current conversation or workflow directive:

- Publishing a site or deployment to production.
- Deleting, overwriting, bulk editing, or migrating client data.
- Sending email, outreach, invoices, contracts, or public notifications.
- Charging, refunding, billing, or changing payment settings.
- Changing DNS, domain, OAuth app, webhook, or production environment settings.
- Granting, revoking, or transferring access.

## Version Control

This MCP access model follows the root-level version control rules in [SYSTEM_RULES.md](../SYSTEM_RULES.md). Commit documentation and lightweight configuration references only. Do not commit secrets, OAuth tokens, API keys, passwords, private cookies, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
