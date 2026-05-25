# MCP Servers Index

This directory stores configuration, setup documentation, and folder-based access procedures for all Model Context Protocol (MCP) servers used across the Webzite Agentic Workflow. It sits above all microsystems (sales, manage, growth, deliver) as shared infrastructure.

## Access Model

MCP server definitions are centralized, but MCP usage is controlled by the active folder's nearest `mcp-access.md`.

- **Shared access model:** [ACCESS_MODEL.md](./ACCESS_MODEL.md)
- **Reusable profiles:** [profiles/](./profiles/)
- **Client access files:** `deliver/[client-name]/docs/mcp-access.md`
- **Workflow access files:** `sales/**/mcp-access.md`, `growth/**/mcp-access.md`, `manage/**/mcp-access.md`, or `deliver/**/mcp-access.md` when a specific workflow needs its own policy.

## Active MCP Servers

| MCP Server | Type | Config Scope | Access Levels | Setup Doc | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Webflow | HTTP (remote) | Project | Agency, Client, Workflow | [webflow/setup.md](./webflow/setup.md) | CMS management, site audits, collection item CRUD, SEO, publishing |
| Figma | HTTP (remote) | User/Global | Global, Agency, Client, Workflow | [figma/setup.md](./figma/setup.md) | Design file generation, design inspection, and conversion from HTML/CSS prototypes |

## Configuration

MCP server definitions are stored in `.mcp.json` at the project root (project-scoped) and in `.claude/` for user/global-scoped servers.

- **Project-scoped** (`.mcp.json`): Managed via `claude mcp add --scope project`
- **Global/user-scoped** (`.claude/`): Managed via `claude mcp add --scope user` or `claude mcp add` (default)
- **Local-scoped**: Managed outside the repository and used only for private credentials, experimental servers, or stronger client isolation.

Runtime authorization is account-specific. Agents must read the nearest `mcp-access.md` and the referenced profile before using an MCP, even when the MCP server appears connected.

## Adding a New MCP Server

1. Create a subfolder under `mcp-servers/<name>/`
2. Add setup documentation (`setup.md`)
3. Register the server via `claude mcp add ...`
4. Assign supported access levels in this index
5. Add or reuse an access profile in `mcp-servers/profiles/`
6. Update the relevant folder-level `mcp-access.md`
7. Update the relevant microsystem rules if the server is used by specific workflows

## Version Control

This directory is committed to Git. It contains only documentation and configuration, no secrets, API keys, or binary assets. OAuth tokens and credentials are handled at runtime by the Claude MCP client.

## Infrastructure

- **Hosting**: Hostinger VPS (Ubuntu 24.04 LTS)
- **Client**: Claude Code CLI (project-scoped MCP config)
