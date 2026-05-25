# MCP Profile: Design Production

Use this profile for MCP-assisted design work, design file generation, design asset extraction, and prototype-to-design conversion.

## Allowed Use

- Create or update design files when the workflow explicitly calls for design production.
- Extract design structure, styles, component notes, and implementation references.
- Generate MCP prompts, conversion manifests, and design handoff notes in the active workflow's `.tmp/` folder.

## Required Checks

- Confirm the active workflow owns the design task.
- Confirm the target design file, team, project, or workspace before mutating anything.
- Use client-specific `mcp-access.md` for signed client work and agency/workflow access files for internal work.

## Confirmation Required

Overwriting design files, changing shared libraries, exporting private assets, granting access, deleting files, or publishing design assets requires explicit confirmation.

## Version Control

This profile follows the root-level version control rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md). Do not commit secrets, OAuth tokens, API keys, passwords, private cookies, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
