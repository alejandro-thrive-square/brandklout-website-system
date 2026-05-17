# MCP Servers Index

This directory stores configuration and setup documentation for all Model Context Protocol (MCP) servers used across the Webzite Agentic Workflow. It sits above all microsystems (sales, manage, growth, deliver) as shared infrastructure.

## Active MCP Servers

| MCP Server | Type | Scope | Setup Doc | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| Webflow | HTTP (remote) | Project | [webflow/setup.md](./webflow/setup.md) | CMS management, site audits, collection item CRUD, SEO, publishing |
| Figma | HTTP (remote) | User/Global | — | Design file generation from HTML/CSS prototypes (used in Deliver 03-design workflow) |

## Configuration

MCP server definitions are stored in `.mcp.json` at the project root (project-scoped) and in `.claude/` for user/global-scoped servers.

- **Project-scoped** (`.mcp.json`): Managed via `claude mcp add --scope project`
- **Global/user-scoped** (`.claude/`): Managed via `claude mcp add --scope user` or `claude mcp add` (default)

## Adding a New MCP Server

1. Create a subfolder under `mcp-servers/<name>/`
2. Add setup documentation (`setup.md`)
3. Register the server via `claude mcp add ...`
4. Update this index
5. Update the relevant microsystem rules if the server is used by specific workflows

## Version Control

This directory is committed to Git. It contains only documentation and configuration — no secrets, API keys, or binary assets. OAuth tokens and credentials are handled at runtime by the Claude MCP client.

## Infrastructure

- **Hosting**: Hostinger VPS (Ubuntu 24.04 LTS)
- **Client**: Claude Code CLI (project-scoped MCP config)
