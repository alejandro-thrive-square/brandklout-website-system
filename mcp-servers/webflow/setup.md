# Webflow MCP Server

Connects Claude Code to Webflow's APIs for CMS management, site audits, collection CRUD, SEO, and publishing.

## Installation

The server was installed via:

```bash
claude mcp add --transport http webflow https://mcp.webflow.com/mcp -s project
```

This added the Webflow MCP to `.mcp.json` at the project root (project-scoped).

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

## Version Control

Documentation only — no secrets. OAuth tokens are managed at runtime by Claude Code.

## Infrastructure

- **Hosting**: Hostinger VPS (Ubuntu 24.04 LTS)
- **Client**: Claude Code CLI
- **Type**: Remote HTTP (https://mcp.webflow.com/mcp)
