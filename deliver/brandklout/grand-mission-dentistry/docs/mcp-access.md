# Grand Mission Dentistry - MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

**None. No platform grant exists for this client yet.**

| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-grand-mission-dentistry` | Would cover this client's Webflow site. | **Not registered.** Do not create it until the build platform is confirmed and Brandklout grants access. |

Partnership-level Asana access is covered by
[../../docs/mcp-access.md](../../docs/mcp-access.md) and is **read-only**. It grants nothing here:
being able to read this client's Asana tasks confers no permission to touch their website,
hosting, CRM, or ad accounts.

> [!IMPORTANT]
> The client's live site **is already Webflow** (found 2026-08-05), so the landing pages most likely
> belong on that site rather than a standalone deploy. That does **not** create a grant: registering
> a Webflow instance still requires Brandklout to hand over access explicitly. Ask first.
>
> GoHighLevel is a separate grant we also do not hold, and two of the three tasks require a lead
> form in it. See [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md).

## Target Resources
- **Asana parent task**: `1217040406855578` (workspace `1210572425689866`)
- **Live site**: **https://grandmissiondentistry.com** — Webflow, site id `698111847e9608eb30ee21c6`
  (from the public CSS host; we have no API access to it).
- **Previous landing pages**: GoHighLevel, location id `0e2uXXYZTFpKGnacy2NF`, GTM `GTM-TGSMNX3`,
  built by the outgoing ad company "Digital Presence Matters". Read-only observation from the
  attachments; no account access.
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
`deliver/brandklout/grand-mission-dentistry/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
