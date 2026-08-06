# Mason Park Dental - MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

**None. No platform grant exists for this client yet.**

| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-mason-park` | Would cover this client's Webflow site. | **Not registered.** Do not create it until the build platform is confirmed and Brandklout grants access. |

Partnership-level Asana access is covered by
[../../docs/mcp-access.md](../../docs/mcp-access.md) and is **read-only**. It grants nothing here:
being able to read this client's Asana tasks confers no permission to touch their website,
hosting, CRM, or ad accounts.

> [!IMPORTANT]
> The build platform is **Webflow**, confirmed 2026-08-05. That still does not create a grant: the
> three landing pages are built and reviewed locally first, and no Webflow instance should be
> registered for this client until Brandklout grants access to a specific site.

## Target Resources
- **Asana parent task**: `1217040406855582` (workspace `1210572425689866`)
- **Live site**: **https://bestdentistinkatytx.com/** — found 2026-08-05.
  `masonparkdental.com` 302-redirects to it. Public, read-only research only.
- **Staging / platform account**: none.
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
- Do not authenticate to, or mutate, **any** client platform - no Webflow, GHL, hosting, DNS,
  analytics, CRM, or ad account - until this file names the target and access is granted.
- Do not create MCP server instances for this client on your own initiative.
- Do not write to Asana. Comments and status changes notify real Brandklout staff.
- Do not invent testimonials, reviews, patient stories, or statistics for this practice. Real
  content only, sourced from the client's own material.
- Do not store API keys, tokens, passwords, or session exports in this repository.

## Confirmation Requirements
Any first contact with a client-owned system requires explicit confirmation in the current
conversation, plus an update to this file naming the target account and site ID.

## Runtime Authentication Notes
Nothing to authenticate yet. If a task appears to need platform access, stop and request it rather
than reusing another client's grant - grants are per principal, and reusing one silently wipes the
previous client's. See
[ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md#server-instances-one-per-principal).

## Artifact Storage
`deliver/brandklout/mason-park/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
