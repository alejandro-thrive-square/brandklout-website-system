# Arvada Dental Center & Implants - MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-arvada-dental-center` | This client's Webflow site. | **Registered 2026-08-06.** Authenticate on the **team** profile, scoping the OAuth screen to this client's sites only. |
| `webflow-clientfirst` | Local Client-First conversion helper. Reads files, holds no credentials, makes no network calls. | Always available. |

Partnership-level Asana access is covered by
[../../docs/mcp-access.md](../../docs/mcp-access.md) and is **read-only**. It grants nothing here:
being able to read this client's Asana tasks confers no permission to touch their website,
hosting, CRM, or ad accounts.

> [!IMPORTANT]
> **Registration is not a grant.** The instance exists so that it *can* be authenticated. It confers
> nothing until Brandklout invites the agency Webflow account to this client's workspace or site,
> and the OAuth screen is completed with **only this client's sites** selected. Authorising another
> client's sites into this instance breaks the per-principal boundary the naming exists to enforce.

> [!NOTE]
> Build platform is **resolved: Webflow** (see [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md)).
> GoHighLevel appears only as a lead destination, not as the page builder.

## Target Resources
- **Asana parent task**: `1217040406855586` (workspace `1210572425689866`)
- **Live site**: unknown - not recorded in Asana. Record here once found.
- **Staging / platform account**: none.

## Allowed Operations
- Read this client's Asana tasks through the read-only partnership scripts.
- Public, unauthenticated research on the client's live site and the cited inspiration URLs.
- Create design and planning artifacts in this folder's workflow `.tmp/` directories.

## Forbidden Operations
- Do not authenticate to, or mutate, any client platform other than the Webflow instance named
  above - no GHL, hosting, DNS, analytics, CRM, or ad account.
- **Do not publish.** Local design approval comes first, then a Webflow build, and publishing is a
  separate explicit go-ahead. A published page is live to real paid traffic.
- Do not create MCP server instances for this client on your own initiative.
- Do not write to Asana. Comments and status changes notify real Brandklout staff.
- Do not invent testimonials, reviews, patient stories, or statistics for this practice. Real
  content only, sourced from the client's own material.
- Do not store API keys, tokens, passwords, or session exports in this repository.

## Confirmation Requirements
Any first contact with a client-owned system requires explicit confirmation in the current
conversation, plus an update to this file naming the target account and site ID.

## Runtime Authentication Notes

Authenticate in a **team-profile** terminal (`claude team`). OAuth grants are stored in
`~/.claude-<profile>/.credentials.json` keyed `<server-name>|<url-hash>`, which makes them **per
profile and global across projects** — not per worktree. Authenticating on the personal profile puts
the grant where client agents cannot see it, because all client work runs on team.

Verify the connection through `/mcp`, and confirm the target site ID, before any write.

Grants are per principal. Never re-authenticate this instance against another client's sites, and
never borrow another client's instance for this one — re-authenticating a server name silently wipes
the previous grant. See
[ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md#server-instances-one-per-principal).

## Artifact Storage
`deliver/brandklout/arvada-dental-center/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
