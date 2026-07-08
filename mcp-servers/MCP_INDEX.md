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
| Agent Dispatch | stdio (local) | Project | Global | [agent-dispatch/setup.md](./agent-dispatch/setup.md) · [profiles/agent-dispatch.md](./profiles/agent-dispatch.md) | Cross-provider orchestration: trigger Claude/Codex/Pi agents headlessly (local + VPS). See [.agents/DISPATCH.md](../.agents/DISPATCH.md) |

## Server Instances (One Per Principal)

Platform MCPs that hold OAuth grants are registered once **per principal** (see [ACCESS_MODEL.md — Server Instances](./ACCESS_MODEL.md#server-instances-one-per-principal)). All Webflow instances point at `https://mcp.webflow.com/mcp`; each holds its own runtime grant scoped to its principal's sites only.

| Instance Name | Principal | Access Level | Grant Scope | Access File |
| :--- | :--- | :--- | :--- | :--- |
| `webflow-webzite` | Webzite Studio | `agency` | Webzite-owned sites only | [agency-site profile](./profiles/agency-site.md) |
| `webflow-clifton-exteriors` | Clifton Exteriors (via Farewell Agency) | `client` | `clifton-exteriors-lutum.webflow.io` | [mcp-access.md](../deliver/farewell-agency/clifton-exteriors/docs/mcp-access.md) |
| `webflow-giovanni-serrano` | Giovanni Serrano | `client` | Giovanni Serrano site only | [mcp-access.md](../deliver/giovanni-serrano/docs/mcp-access.md) |
| `webflow-horizon` | Horizon Building Corp (via Farewell Agency) | `client` | Horizon sites only (`6a1f7d0be8345316ba21999c`) | [mcp-access.md](../deliver/farewell-agency/horizon/docs/mcp-access.md) |
| `webflow-excellent-facets` | Excellent Facets | `client` | Excellent Facets site only (`excellentfacets.com`) | [mcp-access.md](../deliver/excellent-facets/docs/mcp-access.md) |
| `webflow` | **Legacy — deprecated** | — | Whatever the last OAuth covered (unscoped) | Remove after active work migrates to per-client instances |

> [!WARNING]
> The `claude.ai Webflow` connector that may appear in `/mcp` is a claude.ai **account** connector, not part of this project's structure. Do not use it for project work — it belongs to whichever claude.ai account the terminal is logged into and bypasses the per-principal grant model. Always use the project-scoped instances above.

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
