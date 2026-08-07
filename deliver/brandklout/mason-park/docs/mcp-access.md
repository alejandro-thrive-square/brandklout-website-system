# Mason Park Dental - MCP Access

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
> **Site ID confirmed 2026-08-07 via `list_sites`: `6a60bdc0340e5f1784b4d553`.** Writes to that
> site are now in scope. The site is effectively **empty — one page (Home)** and has no custom
> domain, so it is the lowest-risk of the Brandklout sites to build into.

> [!NOTE]
> Build platform is **resolved: Webflow**, confirmed 2026-08-05 (see
> [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md)). GoHighLevel appears only as a lead
> destination, not as the page builder. The three landing pages are built and reviewed locally
> first, and no Webflow instance should be authenticated for this client until Brandklout grants
> access to a specific site.

## Target Resources
- **Asana parent task**: `1217040406855582` (workspace `1210572425689866`)
- **Live site**: **https://bestdentistinkatytx.com/** — found 2026-08-05.
  `masonparkdental.com` 302-redirects to it. Public, read-only research only. **This is not the
  Webflow site below** — it is the client's existing site on another platform.
- **Webflow site**: **Mason Park Dental**, site id `6a60bdc0340e5f1784b4d553`, workspace
  `63b4b7393e89b78575e9a9bb`. Confirmed via `list_sites` 2026-08-07.
- **Staging URL**: https://mason-park-dental.webflow.io (live, returns 200)
- **Pages**: **4 as of 2026-08-07.** Home (`6a60bdc3340e5f1784b4d5e3`, the pre-existing
  placeholder, untouched) plus the three landing pages, **built and published to the Webflow
  subdomain only**: `invisalign` (`6a75f467c7c9e1a0c133edd1`), `new-patient-special`
  (`6a75f468bfddad669aaf8321`), `thank-you` (`6a75f468c490cc1bb6fa6a8c`). All three are
  `noindex, nofollow`. **Still no custom domain, and none is to be added.** Element ids,
  asset ids and the verification results are in
  `workflows/07-webflow-build/.tmp/build-manifest.json`.
- **Online booking**: `https://www.flexbook.me/masonpark/1` (FlexBook, linked from the client's own
  site). Public link only - no account, no credentials, nothing written to it.

> [!NOTE]
> The live site sits behind a SiteGround bot wall (`/.well-known/sgcaptcha/`). Plain fetchers get a
> `202` challenge page; a real browser passes. Capture with
> `workflows/01-content-intake/.tmp/capture.mjs`, one page at a time - parallel requests from one IP
> re-trip the wall. This is a scraping obstacle, not an access control, and nothing here
> authenticates to anything.

## Systems belonging to the PREVIOUS ad company - do not touch or reuse

Found hard-coded in the inherited `mpd-invisalign-lp.html`. These are third-party assets, not the
practice's, and carrying them into new work would leak the practice's traffic to another vendor:

| Asset | Value |
| :--- | :--- |
| Google Tag Manager container | `GTM-KWL239K7` |
| StatCounter project | `12978118` |
| GHL sub-account (image CDN) | `GWgJnGNYokMRdIAB4fm2` |
| Call-tracking number - Invisalign page | `(281) 767-8698` - unverified owner |
| Call-tracking number - New Patient page | `(281) 688-1610` - unverified owner |

The two tracking numbers are per-page, not per-client. They are in use on the built pages; **dial
both before any spend** to confirm they still route to the practice.

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
- **Do not publish to a custom domain.** Staging (`publishToWebflowSubdomain: true`,
  `customDomains: []`) was authorised for the 2026-08-07 build and is where the pages live now.
  Publishing anywhere a real visitor could land is a separate explicit go-ahead — a published
  page is live to real paid traffic.
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
`deliver/brandklout/mason-park/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
