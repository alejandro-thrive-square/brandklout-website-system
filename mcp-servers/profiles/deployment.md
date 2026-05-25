# MCP Profile: Deployment

Use this profile for MCP-assisted deployment, hosting, DNS, environment, repository, and production release work.

## Allowed Use

- Inspect deployment status, logs, configuration, build output, and non-secret environment variable names.
- Prepare deployment manifests and release notes.
- Deploy previews or staging builds when the workflow explicitly allows it.
- Store logs, manifests, and reports in the active workflow's `.tmp/` folder.

## Required Checks

- Confirm the deployment target, environment, project, branch, and domain before changes.
- Confirm the deployment root contains no secrets or private client files before publishing.
- Keep token values, secret values, private credentials, and `.env` files out of repo artifacts.

## Confirmation Required

Production deploys, DNS changes, environment variable changes, rollback, billing changes, access changes, and deleting deployments require explicit confirmation.

## Version Control

This profile follows the root-level version control rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md). Do not commit secrets, OAuth tokens, API keys, passwords, private cookies, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
