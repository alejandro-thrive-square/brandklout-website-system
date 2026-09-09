# Institute for Advanced Dentistry — MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-brandklout` | Webflow access for every Brandklout client, this one included. Shared instance — **the site ID under Target Resources is the boundary, not the tool prefix**. | **LIVE on the `team` profile**, but **this client's site is not in the grant** (checked 2026-09-03). **Read-only** until re-authorized and the ID confirmed below. |
| `webflow-clientfirst` | Local Client-First conversion helper. Reads files, holds no credentials, makes no network calls. | Always available. |
| `relume` | Component specs read as a build spec, then rebuilt natively. Serves React/TSX, not Webflow markup. | Available. |

Partnership-level Asana access is covered by
[../../docs/mcp-access.md](../../docs/mcp-access.md) and is **read-only**. This client's tasks are
`1217929763942271` and `1215476573810829` in project `1215461031852894`.

> [!IMPORTANT]
> **The instance is shared; the site is not.** `webflow-brandklout` is one grant covering every
> Brandklout client, because they all sit in one workspace Brandklout owns (`63b4b7393e89b78575e9a9bb`)
> — so the tool prefix does **not** tell you which client you are acting on. Before any mutating
> call, take the site ID from Target Resources below and pass it explicitly. Never act on a site the
> tool defaulted to, listed first, or that merely came up in conversation. **A client whose site ID
> is unconfirmed is read-only.**

> [!NOTE]
> A Webflow site for this client **does exist** — `6a946f89a8315fa7643642e3`, read from the
> `data-wf-site` attribute of https://institute-for-advanced-dentistry---conc.webflow.io/ — but
> `list_sites` returned 79 sites on 2026-09-03 and none carried that id. The grant must be
> re-authorized with this site ticked **and every other active Brandklout client ticked too**;
> re-authorizing replaces the grant wholesale and unticking a sibling revokes it silently. That
> procedure belongs to the partner file — do not run it from this folder. Once `get_site` confirms
> the id, record it under Target Resources **and** in the
> [client site registry](../../docs/mcp-access.md#client-site-registry).

## Target Resources
- **Live site (client-owned, WordPress)**: https://www.ifadentistry.com/ — **public read only.** No
  WordPress, hosting, DNS, or Google account access is granted or requested.
- **Webflow site**: `6a946f89a8315fa7643642e3` ("Institute for Advanced Dentistry — Homepage
  Concepts", staging https://institute-for-advanced-dentistry---conc.webflow.io/). **Observed, not
  confirmed** — not yet in the grant, not yet confirmed as the build target. **No writes.**
- **Asana**: project `1215461031852894`; tasks `1217929763942271`, `1215476573810829`. Read-only.
- **Staging / platform accounts**: none.

## Allowed Operations
- Public, unauthenticated research and scraping of the client's own live site and of the public
  Webflow staging URL, including downloading images, video and stylesheets for content intake.
- Read this client's Asana tasks through the read-only partnership scripts.
- Create design, content and planning artifacts in this folder's workflow `.tmp/` directories.

## Forbidden Operations
- Do not authenticate to, or mutate, any client platform — no WordPress admin, hosting, DNS,
  analytics, Google Business Profile, GoHighLevel, CRM, or ad account.
- **Do not touch another Brandklout client's site.** The shared grant can reach all of them; this
  folder authorizes exactly one, and that one is not yet in the grant.
- **Do not publish.** Local design approval comes first, then a Webflow build, and publishing is a
  separate explicit go-ahead.
- Do not create MCP server instances for this client on your own initiative. A per-client Webflow
  instance authorizes against the same partner workspace and isolates nothing — see
  [ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md#when-the-partner-owns-the-workspace-one-instance-is-correct).
- Do not write to Asana. Comments and status changes notify real Brandklout staff.
- **Do not invent testimonials, reviews, patient stories, or statistics for this practice.** The
  client supplied its own figures in the Asana brief; use those and nothing else.
- Do not store API keys, tokens, passwords, cookies, or session exports in this repository.

## Confirmation Requirements
Any first contact with a client-owned system requires explicit confirmation in the current
conversation, plus an update to this file naming the target account and site ID. Publishing, DNS
changes, and domain cutover always require explicit confirmation.

## Runtime Authentication Notes

Authenticate in a **team-profile** terminal (`claude team`). OAuth grants live in
`~/.claude-<profile>/.credentials.json` keyed `<server-name>|<url-hash>` — **per profile, global
across projects**, not per worktree. Authenticating on the personal profile puts the grant where
client agents cannot see it, because all Brandklout client work runs on team.

Verify the connection through `/mcp`, and confirm the target site ID, before any write.

## Artifact Storage
`deliver/brandklout/institute-for-advanced-dentistry/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
