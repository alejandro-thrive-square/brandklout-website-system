# Oceanic Dental - MCP Access

## Access Level
Client delivery (Brandklout partner engagement).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers
| MCP Server | Purpose | Status |
| :--- | :--- | :--- |
| `webflow-oceanic-dental` | Webflow reads and writes for the Oceanic Dental site **only** | **Authorized 2026-09-22**; `list_sites` returns only Oceanic Dental |
| `webflow-clientfirst` | Local Client-First tooling, no network | Available |

### Why a dedicated instance, when the rest of Brandklout shares one

The site sits in Brandklout's workspace, where the standing rule is one partner instance
(`webflow-brandklout`) ([partner registry](../../docs/mcp-access.md)). The user asked for a
dedicated server for this site on 2026-09-22. Two things support that:

- **Scoped grant.** Webflow's OAuth screen lets you pick individual sites. With only Oceanic ticked,
  this instance cannot reach any sibling site. That scope is stronger than the site-ID convention
  the partner instance relies on.
- **No collateral re-auth.** Adding Oceanic to `webflow-brandklout` would mean re-authorizing it.
  That replaces the grant wholesale, so any active client left unticked loses access without
  warning. A separate instance leaves the partner grant untouched.

## Authorization

1. Restart Claude Code in this worktree and approve `webflow-oceanic-dental` when prompted.
   If it never appears in `/mcp`, run `claude mcp reset-project-choices` and restart.
2. `/mcp` → `webflow-oceanic-dental` → authenticate.
3. On the Webflow OAuth screen, tick **only the Oceanic Dental site**.
4. Confirm with `list_sites`: exactly one site should come back. Record its ID below.

## Target Resources

| Resource | Value | Status |
| :--- | :--- | :--- |
| Webflow workspace | Brandklout (`63b4b7393e89b78575e9a9bb`) | Per the user, 2026-09-22 |
| Webflow site | Oceanic Dental (`oceanic-dental`), live on `www.oceanicdental.com` + `oceanicdental.com` | Confirmed 2026-09-22 |
| Site ID | `66cd6c49cbb85d43d9e41a7c` | Recorded from `list_sites`, 2026-09-22 |

Before any mutating call, pass the site ID from this table explicitly. Never act on whichever
site a tool defaults to.

## Version Control

Documentation only; no secrets. OAuth tokens are held by Claude Code at runtime and never
committed. Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
