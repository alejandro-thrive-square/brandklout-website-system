# Runbook — bk-oceanic-dental

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

## Objective

**Oceanic Dental**, a Brandklout client. This worktree owns Oceanic Dental and nothing else.

Start at [`project-overview.md`](./project-overview.md).

## Status: NOT STARTED — Webflow MCP registered, awaiting OAuth (2026-09-22)

Platform: **Webflow**, in Brandklout's workspace, via the dedicated `webflow-oceanic-dental`
instance. See [`mcp-access.md`](./mcp-access.md).

## Next

1. Find the client in Asana; record the task/project IDs and scope in `project-overview.md`.
2. Look for the client's shared drive (`node scripts/drive.mjs ls`) before asking for assets.
3. Authenticate `webflow-oceanic-dental` (only the Oceanic site ticked), then record the site ID in
   [`mcp-access.md`](./mcp-access.md). The site stays read-only until the ID is recorded.

## Gotchas

- `webflow-oceanic-dental` and `webflow-brandklout` share a URL but hold separate grants. Do not
  re-authorize `webflow-brandklout` to add Oceanic: that replaces its grant, and any client left
  unticked loses access.

## Version Control

Tracked on the `bk-oceanic-dental` branch — commit it. See [SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
