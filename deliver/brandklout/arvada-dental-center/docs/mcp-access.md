# Arvada Dental Center & Implants - MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-brandklout` | Webflow access for every Brandklout client, this one included. Shared instance — **the site ID under Target Resources is the boundary, not the tool prefix**. | **LIVE — authenticated on the `team` profile 2026-08-07.** One grant, all Brandklout clients. |
| `webflow-clientfirst` | Local Client-First conversion helper. Reads files, holds no credentials, makes no network calls. | Always available. |

Partnership-level Asana access is covered by
[../../docs/mcp-access.md](../../docs/mcp-access.md) and is **read-only**. It grants nothing here:
being able to read this client's Asana tasks confers no permission to touch their website,
hosting, CRM, or ad accounts.

> [!IMPORTANT]
> **The instance is shared; the site is not.** `webflow-brandklout` is one grant covering every
> Brandklout client, because they all sit in one workspace Brandklout owns — so the tool prefix does
> **not** tell you which client you are acting on. Before any mutating call, take the site ID from
> Target Resources below and pass it explicitly. Never act on a site the tool defaulted to, listed
> first, or that merely came up in conversation.
>
> **Site ID confirmed 2026-08-07: `693c51e685b19f0d0c149cab` ("Arvada Dental Center").** Writes to
> that site are in scope.
>
> [!CAUTION]
> **This workspace holds FIVE Arvada sites and four of them are copies.** The deliverable is the
> only one carrying the `arvadadentalimplants.com` custom domain, and the user confirmed it
> explicitly on 2026-08-07. Match on the site ID, never on the display name — "Arvada Dental
> Implants Center" and "Arvada Cosmetic Dental Implants" are decoys:
>
> | Site | ID | Verdict |
> | :--- | :--- | :--- |
> | Arvada Dental Center | `693c51e685b19f0d0c149cab` | **THE ONE TO EDIT** |
> | Arvada Dental Center - Blue | `6957a3881484e0be00a9b0b2` | copy — do not touch |
> | Arvada Cosmetic Dental Implants | `69bc29b491a12ccd5a2d47fa` | copy — do not touch |
> | Arvada Dental Implants Center | `69c6a0f225e31703647d23cd` | copy — do not touch |
> | Arvada Implants | `69f2fe636ca87b3f22fa54c1` | copy — do not touch |

> [!NOTE]
> Build platform is **resolved: Webflow** (see [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md)).
> GoHighLevel appears only as a lead destination, not as the page builder.

## Target Resources
- **Asana parent task**: `1217040406855586` (workspace `1210572425689866`)
- **Live site**: `https://arvadadentalcenter.com` - identified 2026-08-05 by public search, not
  from Asana. Confirmed as the practice at 6695 Wadsworth Blvd, Arvada, CO 80003, matching the
  Asana client name. **Read-only research only** - the site is on SiteGround behind an sgcaptcha
  bot challenge; scraping it for brand and content is permitted, touching it is not.
- **Webflow site**: **Arvada Dental Center**, site id `693c51e685b19f0d0c149cab`, workspace
  `63b4b7393e89b78575e9a9bb`. Confirmed via `list_sites` and **user-confirmed as the site to edit**
  on 2026-08-07. Custom domains `arvadadentalimplants.com` / `www.` — note this is a *different*
  domain from the research site above, which is the practice's older SiteGround site.
- **Staging URL**: https://arvadadentalcenter.webflow.io

## Allowed Operations
- Read this client's Asana tasks through the read-only partnership scripts.
- Public, unauthenticated research on the client's live site and the cited inspiration URLs.
- Create design and planning artifacts in this folder's workflow `.tmp/` directories.

## Forbidden Operations
- Do not authenticate to, or mutate, any client platform other than the Webflow instance named
  above - no GHL, hosting, DNS, analytics, CRM, or ad account.
- **Do not touch another Brandklout client's site.** The shared instance can reach all of them; this
  folder authorizes exactly one. A call carrying a sibling's site ID is out of bounds even though
  the grant permits it.
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

Do not register a per-client Webflow instance for this client. One existed until 2026-08-07 and was
retired unauthenticated: because Brandklout owns the workspace, a per-client instance authorizes
against that same workspace and isolates nothing. See
[ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md#when-the-partner-owns-the-workspace-one-instance-is-correct).

Re-authenticating `webflow-brandklout` replaces its grant wholesale, so the OAuth screen must have
**every** active Brandklout client ticked, not just this one. Unticking a sibling revokes it
silently. That procedure belongs to the partner file — do not run it from this folder to add a site.

## Artifact Storage
`deliver/brandklout/arvada-dental-center/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
