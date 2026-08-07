# Grand Mission Dentistry - MCP Access

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
> **Site ID confirmed 2026-08-07 via `list_sites`: `698111847e9608eb30ee21c6`.** Writes to that
> site are now in scope. This is a **large live site — 303 pages** on a production domain, so scope
> every call to a specific page ID as well; do not run site-wide mutations.

> [!NOTE]
> Build platform is **resolved: Webflow** (see [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md)).
> The client's live site **is already Webflow** (found 2026-08-05), so the landing pages most likely
> belong on that site rather than a standalone deploy. That does **not** create a grant: registering
> a Webflow instance still requires Brandklout to hand over access explicitly. Ask first.
>
> GoHighLevel appears only as a lead destination, not as the page builder. It is a separate grant we
> also do not hold, and two of the three tasks require a lead form in it.

## Target Resources
- **Asana parent task**: `1217040406855578` (workspace `1210572425689866`)
- **Live site**: **https://grandmissiondentistry.com** — Webflow, site id `698111847e9608eb30ee21c6`,
  **confirmed via `list_sites` 2026-08-07**. API access is live (`webflow-brandklout`).
- **Staging URL**: https://grandmissiondentistry.webflow.io
- **Landing-page destinations** — these three pages **already exist and already hold a build**
  (created 2026-08-04, last updated 2026-08-05), matching the three local packages 1:1:

  | Local package | Webflow page | Page ID | Live? |
  | :--- | :--- | :--- | :--- |
  | `implant-landing-page` | `implant-ai` | `6a724b6977f9b0019d2a03f8` | no — 404 on staging and production |
  | `cosmetic-landing-page` | `cosmetic-ai` | `6a723ad5534774f35f17d119` | no — 404 on staging and production |
  | `thank-you-landing-page` | `thank-u-landing-ai` | `6a7268a862a728c1cd4df73b` | no — 404 on staging and production |

  All three are `draft: false` (so they publish with the site) but the site has not been published
  since they were created, which is why they 404. **What they contain is the superseded band-stack
  build** — `iai_section-tint` / `iai_section-white` / `cai_section-light` / `cai_section-dark`
  alternating, the exact architecture this campaign replaces. They are destinations to overwrite,
  not work to preserve.
- **Previous landing pages**: GoHighLevel, location id `0e2uXXYZTFpKGnacy2NF`, GTM `GTM-TGSMNX3`,
  built by the outgoing ad company "Digital Presence Matters". Read-only observation from the
  attachments; no account access.
- **Staging / platform account**: none.

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
`deliver/brandklout/grand-mission-dentistry/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
