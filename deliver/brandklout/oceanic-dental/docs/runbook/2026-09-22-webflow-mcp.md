# 2026-09-22 — Dedicated Webflow MCP registered

## Done

- Oceanic Dental's site was added to Brandklout's Webflow workspace. At the user's request it gets its
  own server, `webflow-oceanic-dental` (`https://mcp.webflow.com/mcp`), in `.mcp.json`.
- Wrote `docs/mcp-access.md`: why this client gets a dedicated instance, the auth steps and the
  target-resource table (site ID still pending).
- Added rows to `mcp-servers/MCP_INDEX.md` and the partner registry in `deliver/brandklout/docs/mcp-access.md`.

## Next

- Restart the session, approve the server, authenticate through `/mcp` with only Oceanic ticked.
- Run `list_sites` (it should return one site) and record the site ID in `mcp-access.md`.

## Gotchas

- This departs from the one-partner-instance rule on purpose. Do not also add Oceanic to the
  `webflow-brandklout` grant: re-authorizing that instance replaces its grant wholesale.

## Version Control

Tracked on `bk-oceanic-dental`. See [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
