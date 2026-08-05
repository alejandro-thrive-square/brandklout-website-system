# Arvada Dental Center & Implants - MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

**None. No platform grant exists for this client yet.**

| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-arvada-dental-center` | Would cover this client's Webflow site. | **Not registered.** Do not create it until the build platform is confirmed and Brandklout grants access. |

Partnership-level Asana access is covered by
[../../docs/mcp-access.md](../../docs/mcp-access.md) and is **read-only**. It grants nothing here:
being able to read this client's Asana tasks confers no permission to touch their website,
hosting, CRM, or ad accounts.

> [!IMPORTANT]
> The build platform is **unconfirmed** - it may be Webflow or GoHighLevel. See
> [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md). Registering a Webflow instance before that is
> settled would create a grant nobody needs. Resolve the platform question first.

## Target Resources
- **Asana parent task**: `1217040406855586` (workspace `1210572425689866`)
- **Live site**: `https://arvadadentalcenter.com` - identified 2026-08-05 by public search, not
  from Asana. Confirmed as the practice at 6695 Wadsworth Blvd, Arvada, CO 80003, matching the
  Asana client name. **Read-only research only** - the site is on SiteGround behind an sgcaptcha
  bot challenge; scraping it for brand and content is permitted, touching it is not.
- **Staging / platform account**: none.

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
`deliver/brandklout/arvada-dental-center/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
