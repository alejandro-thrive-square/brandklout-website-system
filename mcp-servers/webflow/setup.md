# Webflow MCP Server

Connects Claude Code to Webflow's APIs for CMS management, site audits, collection CRUD, SEO, and publishing.

## Installation

Webflow is registered as **one server instance per principal** (see [ACCESS_MODEL.md — Server Instances](../ACCESS_MODEL.md#server-instances-one-per-principal)). All instances share the same URL; each holds its own OAuth grant scoped to that principal's sites:

```bash
# The Brandklout partner workspace — one grant covering every Brandklout client
claude mcp add --transport http webflow-brandklout https://mcp.webflow.com/mcp -s project

# One per client, when a client owns their own Webflow account
# (slug matches the deliver/brandklout/ folder name)
claude mcp add --transport http webflow-<client-name> https://mcp.webflow.com/mcp -s project

# One per white-label partner, when the partner owns one workspace holding all its clients
claude mcp add --transport http webflow-<partner-name> https://mcp.webflow.com/mcp -s project
```

Current instances are listed in [MCP_INDEX.md](../MCP_INDEX.md#server-instances-one-per-principal). The original unscoped `webflow` entry is deprecated and will be removed once active work has migrated to per-principal instances.

> [!IMPORTANT]
> OAuth grants are keyed by server *name*. Re-authenticating a shared server for a different client silently wipes the previous client's grant — this is exactly why instances are per-principal. When authorizing an instance, select **only** that principal's sites in the OAuth screen.

### Which one: per client, or per partner?

Ask who owns the Webflow account, not who the work is for.

- **Client owns the account** (they invite the agency account to their own workspace) → one instance per client. The grant really is scoped, and the tool prefix names the client.
- **Partner owns one workspace containing all their clients** → one instance for the partner. Per-client instances here would each authorize against the same workspace, so they isolate nothing while costing an OAuth round trip per client.

`webflow-brandklout` is the partner case. Onboarding a new Brandklout client needs **no new server** — re-authenticate the existing instance and tick the new site alongside the existing ones. Re-authorization replaces the grant wholesale, so leaving an active client unticked silently revokes it.

Under a partner instance the tool prefix no longer identifies the client, so the boundary is the **site ID**: resolve it from the working folder's `mcp-access.md` and pass it explicitly on every mutating call. See [ACCESS_MODEL.md — When the partner owns the workspace](../ACCESS_MODEL.md#when-the-partner-owns-the-workspace-one-instance-is-correct).

## Folder-Based Access

The Webflow MCP server definition is shared, but usage is controlled by the active folder's nearest `mcp-access.md`.

Before using Webflow MCP:
1. Read [ACCESS_MODEL.md](../ACCESS_MODEL.md).
2. Read the closest applicable `mcp-access.md`.
3. Read the referenced profile in [profiles/](../profiles/).
4. Verify Webflow runtime authentication through `/mcp`.
5. Confirm the target Webflow workspace/site ID before making changes.

Common profiles:
- [agency-site.md](../profiles/agency-site.md) for Webzite-owned Webflow sites.
- [client-delivery.md](../profiles/client-delivery.md) for signed client projects.
- [prospect-audit.md](../profiles/prospect-audit.md) for public read-only prospect analysis.

Client access should normally happen by the client inviting the agency Webflow account to the required workspace or site. Do not store Webflow credentials, OAuth tokens, or private session values in this repository.

## Authorization

1. Start Claude Code
2. Run `/mcp list` and select the `webflow` server
3. Complete OAuth in the browser window that opens
4. Authorize the Webflow sites/workspaces you want to access
5. Open the Webflow Designer, press `E` to open the Apps panel, and launch the "Webflow MCP Bridge App"

## Usage Examples

```
List all my collections and show me their field structures
```

```
Audit my site for broken links, missing alt text, and incomplete meta descriptions
```

```
Create a responsive hero section with a headline, description, and CTA button
```

```
Add a blog post to the Blog collection with title "Hello World" and status "Staging"
```

## Available Tools

The Webflow MCP provides tools for:
- **Sites**: List, get details
- **Collections**: List, get schema, create/update/delete items
- **Pages**: List, create, update, publish
- **Assets**: Upload
- **SEO**: Audit, meta updates
- **E-commerce**: Orders, inventory, fulfillment
- **Designer**: Bridge app access for style and layout changes

## Troubleshooting

- **Bridge App not connecting**: Ensure the Webflow Designer is open and the Bridge App is launched from the Apps panel (E key)
- **OAuth issues**: Re-authenticate by logging out via `/mcp` and reconnecting
- **Permission errors**: Verify the authorized sites in the OAuth flow include the target site
- **Server missing from `/mcp` entirely**: project-scoped servers require a one-time approval at session start, and Claude Code remembers a rejection silently. Run `claude mcp reset-project-choices`, restart the session, and approve the server when prompted.
- **"claude.ai Webflow" is not this server**: `/mcp` may also list a `claude.ai Webflow` connector — that is a claude.ai account-level connector tied to whichever Claude account the terminal is logged into (it can fail with "Server not found" on other accounts). Always select the project-scoped instance (`webflow-<principal>`) instead.

## Version Control

Documentation only — no secrets. OAuth tokens are managed at runtime by Claude Code.

## Infrastructure

- **Hosting**: Hostinger VPS (Ubuntu 24.04 LTS)
- **Client**: Claude Code CLI
- **Type**: Remote HTTP (https://mcp.webflow.com/mcp)
