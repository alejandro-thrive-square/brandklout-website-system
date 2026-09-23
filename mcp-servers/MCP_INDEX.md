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
| Asana | HTTP (remote) | Project | Client | [asana/setup.md](./asana/setup.md) | Reading a partner's/client's project-management workspace: tasks, projects, assignees, comments — used to pick up delegated work. **Blocked in Claude Code** (token-exchange bug); accessed via direct-token scripts. |
| Relume | HTTP (remote) | Project | Global, Agency | [relume/setup.md](./relume/setup.md) | Reading the Relume component library as a source of page/section structure. Read-only, no client account involved. Registered 2026-08-10 as `relume`, **awaiting OAuth** (scope `relume:components`). |

## Server Instances (One Per Principal)

Platform MCPs that hold OAuth grants are registered once **per principal** (see [ACCESS_MODEL.md — Server Instances](./ACCESS_MODEL.md#server-instances-one-per-principal)). All Webflow instances point at `https://mcp.webflow.com/mcp`; each holds its own runtime grant scoped to its principal's sites only. Asana instances follow the same naming rule but a weaker grant boundary — see the note under the table.

A principal is the party that **owns the platform account**. For a direct client that is the client. For a white-label partner whose clients all live in one workspace the partner owns, the principal is the **partner** — one instance covers every client under it, because per-client instances would authorize against that same shared workspace and isolate nothing.

| Instance Name | Principal | Access Level | Grant Scope | Access File |
| :--- | :--- | :--- | :--- | :--- |
| `webflow-brandklout` | Brandklout (white-label partner) — **all** its clients | `client` | Every Brandklout client site Webzite is engaged on, in the single workspace Brandklout owns: Livewell Dental, Dr. Nahlah, Grand Mission Dentistry, Arvada Dental Center, Mason Park Dental, Stone Dental Implant Center. Registered 2026-08-07, **awaiting OAuth**. Per-client isolation is not available — the boundary is the **site ID**, per client `mcp-access.md`. | [partner registry](../deliver/docs/mcp-access.md) |
| `webflow-clientfirst` | Local tool server (no principal) | n/a | No network. Reads repo files, writes `mcp-servers/webflow-clientfirst/.tmp/` | [setup.md](./webflow-clientfirst/setup.md) |
| `webflow` | **Legacy — deprecated** | — | Whatever the last OAuth covered (currently returns 401) | Remove after active work migrates to per-principal instances |
| `asana-brandklout` | Brandklout (white-label partner) | `client` | Workspace `1210572425689866` (the only one the grant can see) — registered 2026-08-05 (client ID `1217205892702386`, callback port 8080). **Cannot authenticate: Claude Code token-exchange bug.** Working access is via [scripts](../deliver/scripts/README.md). | [mcp-access.md](../deliver/docs/mcp-access.md) |

> [!WARNING]
> The `claude.ai Webflow` connector that may appear in `/mcp` is a claude.ai **account** connector, not part of this project's structure. Do not use it for project work — it belongs to whichever claude.ai account the terminal is logged into and bypasses the per-principal grant model. Always use the project-scoped instances above. The same applies to a `claude.ai Asana` connector.

> [!IMPORTANT]
> **Asana's grant boundary is weaker than Webflow's.** Webflow's OAuth screen lets you select individual sites, so a per-client instance really is scoped to that client. Asana has no workspace picker — the grant follows the **user**, so an Asana token reaches every workspace that user belongs to. Per-instance naming still gives each engagement a persistent grant and a self-evident tool prefix, but the actual isolation must come from the Asana membership (limited-access member/guest, or a dedicated Asana account). See [asana/setup.md — Grant Scope](./asana/setup.md#grant-scope-read-this-before-authorizing).

## Configuration

MCP server definitions are stored in `.mcp.json` at the project root (project-scoped) and in `.claude/` for user/global-scoped servers.

- **Project-scoped** (`.mcp.json`): Managed via `claude mcp add --scope project`
- **Global/user-scoped** (`.claude/`): Managed via `claude mcp add --scope user` or `claude mcp add` (default)
- **Local-scoped**: Managed outside the repository and used only for private credentials, experimental servers, or stronger client isolation.

Runtime authorization is account-specific. Agents must read the nearest `mcp-access.md` and the referenced profile before using an MCP, even when the MCP server appears connected.

### Where OAuth grants actually live — authenticate on the right profile

Verified 2026-08-06. Grants are stored in `~/.claude-<profile>/.credentials.json` under `mcpOAuth`, keyed **`<server-name>|<url-hash>`**. Two consequences:

- **Grants are per profile.** `.credentials.json` is a real file in each of `~/.claude`, `~/.claude-team` and `~/.claude-personal` — it is *not* one of the directories junctioned back into `~/.claude`. Authenticating a client MCP on the personal profile puts the grant somewhere the client agents cannot reach, because all client work runs on `claude team` (see [ORCHESTRATION.md](../deliver/docs/ORCHESTRATION.md)).
- **Grants are global across projects, not per worktree.** The hash is derived from the server URL, not the project path, so one authentication per profile covers every checkout and every worktree. There is no need to repeat OAuth in each client worktree.

What *is* per worktree is `enabledMcpjsonServers` in `.claude/settings.local.json`, which is gitignored and therefore does not travel with a new worktree. A server missing from that list never appears in `/mcp` at all, and the omission is silent. Each Brandklout client worktree is scoped to `webflow-brandklout` plus `webflow-clientfirst`.

Because the partner instance is a single server name, **one authentication on the team profile covers every Brandklout client worktree** — this is the main practical win of the consolidation. The prior per-client scheme needed one OAuth round trip per client, each one presenting the operator with a site picker listing every sibling site.

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
