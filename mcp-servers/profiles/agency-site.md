# MCP Profile: Agency Site

Use this profile for MCP work on Webzite-owned sites, accounts, dashboards, repositories, design files, and deployment targets.

## Allowed Use

- Audit Webzite-owned websites, CMS content, SEO, accessibility, performance, and design implementation.
- Update staging or draft content for agency-owned properties.
- Manage agency design or build artifacts when the active workflow allows it.
- Produce reports, manifests, screenshots, and notes in the active workflow's `.tmp/` folder.

## Required Checks

- Confirm the target is Webzite-owned before using authenticated MCP tools.
- Verify runtime authentication with `/mcp`, `claude mcp list`, or the MCP client's equivalent status check.
- Confirm the target site, project, repository, base, or deployment before mutating anything.

## Confirmation Required

Publishing, deleting, overwriting, billing, emailing, deploying to production, DNS changes, access changes, and production data edits require explicit confirmation.

## Version Control

This profile follows the root-level version control rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md). Do not commit secrets, OAuth tokens, API keys, passwords, private cookies, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
