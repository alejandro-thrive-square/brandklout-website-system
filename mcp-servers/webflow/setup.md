# Webflow MCP Server

Connects Claude Code to Webflow's APIs for CMS management, site audits, collection CRUD, SEO, and publishing.

## Installation

The server was installed via:

```bash
claude mcp add --transport http webflow https://mcp.webflow.com/mcp -s project
```

This added the Webflow MCP to `.mcp.json` at the project root (project-scoped).

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
