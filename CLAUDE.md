# Webzite Agent Entry Point

Welcome, agent. You are operating within the **Webzite Agentic Workflow** system. To perform your tasks effectively, you must adhere to the core architectural rules and pillar-specific directives.

> [!IMPORTANT]
> **Documentation Integrity Rule**: Any update to the system's logic or structure requires an immediate update to the relevant `.md` files.

> [!IMPORTANT]
> This file must stay identical to [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md), and [GEMINI.md](./GEMINI.md). These filenames exist separately because different agent runtimes auto-load different entry-point names.

## Quick Links
- **Master Rules**: [SYSTEM_RULES.md](./SYSTEM_RULES.md)
- **New Computer Install**: [INSTALL.md](./INSTALL.md)
- **VPS Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Pricing & Timeline Rules**: [PRICING_TIMELINE_RULES.md](./sales/PRICING_TIMELINE_RULES.md) - per-page rates and durations (single source of truth)
- **Sales Pillar**: [sales/SALES_SYSTEM_RULES.md](./sales/SALES_SYSTEM_RULES.md)
- **Manage Pillar**: [manage/MANAGE_SYSTEM_RULES.md](./manage/MANAGE_SYSTEM_RULES.md)
- **Growth Pillar**: [growth/GROWTH_SYSTEM_RULES.md](./growth/GROWTH_SYSTEM_RULES.md)
- **Deliver Pillar**: [deliver/DELIVER_SYSTEM_RULES.md](./deliver/DELIVER_SYSTEM_RULES.md)
- **MCP Index**: [mcp-servers/MCP_INDEX.md](./mcp-servers/MCP_INDEX.md) - all MCP servers used across the project
- **MCP Access Model**: [mcp-servers/ACCESS_MODEL.md](./mcp-servers/ACCESS_MODEL.md) - folder-based MCP permissions and profiles
- **Webflow MCP Setup**: [mcp-servers/webflow/setup.md](./mcp-servers/webflow/setup.md)

## Operational Protocol
1. **Understand the Pillar**: Before starting a task, read the rules for the relevant pillar.
2. **Locate the Workflow**: Workflows are stored in subfolders with a `.md` directive and a `.py` executor.
3. **Use Artifacts**: Store all intermediate data in the `.tmp/` folder within the specific workflow directory.
4. **Token Optimization**: Filter your context to the specific workflow folder you are executing.
5. **MCP Management**: MCP servers are shared infrastructure in `mcp-servers/`. Register new servers with `claude mcp add --scope project`. Before using any MCP, read the nearest `mcp-access.md` and the referenced profile in `mcp-servers/profiles/`. See [MCP Index](./mcp-servers/MCP_INDEX.md) and [MCP Access Model](./mcp-servers/ACCESS_MODEL.md).
6. **Version Control**: This system is managed via a GitHub repository. Follow the version control rules in [SYSTEM_RULES.md - Section 4](./SYSTEM_RULES.md). Commit lightweight `.tmp/` workflow artifacts when useful, but never commit `.env` files, secrets, or binary/media assets. All new `.md` files must include a Version Control section.

## Version Control

This entry-point directive follows the root-level version control rules in [SYSTEM_RULES.md](./SYSTEM_RULES.md). Keep [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md), and [GEMINI.md](./GEMINI.md) identical whenever any one of them changes.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
