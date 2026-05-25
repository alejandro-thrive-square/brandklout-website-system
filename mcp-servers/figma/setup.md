# Figma MCP Server

Connects Claude Code to Figma workflows for design generation, design inspection, and prototype-to-design conversion when available in the user's MCP configuration.

## Installation

Figma MCP is currently treated as a user/global MCP because authorization is account-specific:

```bash
claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
```

## Authorization

1. Start Claude Code.
2. Run `/mcp`.
3. Select the Figma MCP server.
4. Complete the browser authorization flow.
5. Verify the server is connected before running design workflows.

## Folder-Based Access

Before using Figma MCP, read [ACCESS_MODEL.md](../ACCESS_MODEL.md), then read the closest applicable `mcp-access.md`.

Common profiles:
- [design-production.md](../profiles/design-production.md) for design generation and conversion.
- [client-delivery.md](../profiles/client-delivery.md) for signed client design work.
- [agency-site.md](../profiles/agency-site.md) for Webzite-owned design work.

## Usage Examples

```text
Generate a Figma design from this approved HTML prototype and save the conversion manifest in the workflow .tmp folder.
```

```text
Inspect the selected Figma file for reusable components, tokens, spacing patterns, and implementation notes.
```

## Version Control

Documentation only. OAuth tokens and account credentials are managed at runtime by Claude Code and must not be committed to this repository.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
