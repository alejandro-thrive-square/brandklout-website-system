# West LA Implants — MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-brandklout` | Webflow access for every Brandklout client, this one included. Shared instance — **the site ID under Target Resources is the boundary, not the tool prefix**. | **LIVE on the `team` profile.** No site recorded for this client yet, so **read-only here** until one is confirmed. |
| `webflow-clientfirst` | Local Client-First conversion helper. Reads files, holds no credentials, makes no network calls. | Always available. |
| `relume` | Component specs read as a build spec, then rebuilt natively. Serves React/TSX, not Webflow markup. | Available. |

Partnership-level Asana access is covered by
[../../docs/mcp-access.md](../../docs/mcp-access.md) and is **read-only**. There is no Asana task
for this client yet.

> [!IMPORTANT]
> **The instance is shared; the site is not.** `webflow-brandklout` is one grant covering every
> Brandklout client, because they all sit in one workspace Brandklout owns (`63b4b7393e89b78575e9a9bb`)
> — so the tool prefix does **not** tell you which client you are acting on. Before any mutating
> call, take the site ID from Target Resources below and pass it explicitly. Never act on a site the
> tool defaulted to, listed first, or that merely came up in conversation. **A client with no site ID
> recorded is read-only.**

> [!NOTE]
> **If West LA's site appears to be missing from `list_sites`, re-authenticate before concluding it
> does not exist.** The grant reported only 9 sites until re-authorization on 2026-08-11 widened it
> to 79. Once found or created, record the ID here **and** in the
> [client site registry](../../docs/mcp-access.md#client-site-registry).
> Re-authorizing replaces the grant wholesale: the OAuth screen must have **every** active
> Brandklout client ticked, not just this one. Unticking a sibling revokes it silently. That
> procedure belongs to the partner file — do not run it from this folder.

## Target Resources
- **Live site (client-owned, WordPress)**: https://westlaimplants.com/ — **public read only.** No
  WordPress, hosting, DNS, or Google account access is granted or requested.
- **Webflow site**: none recorded. Must be confirmed via `list_sites` before any write.
- **Asana task**: none.
- **Instatic instance (ours, provisioned 2026-09-10)**: `https://west-la-implants-production.up.railway.app`
  — Railway workspace Brandklout, project `a55b5cac-b92d-4653-a9ff-6da522a5c89c`, service "West LA Implants",
  environment production. Owner account is the shared Instatic login (`[west-la-implants]` in the master
  credential file). Writes go through `workflows/21-instatic-upload/` with the link dir in its `.tmp/`;
  never through a sibling client's link dir — there are three Stone projects on the same account.
- **Staging / platform accounts**: none beyond the above.

## Allowed Operations
- Public, unauthenticated research and scraping of the client's own live site, including downloading
  its images, video and stylesheet assets for the content-intake phase.
- Read this client's Asana tasks through the read-only partnership scripts, if any are ever created.
- Create design, content and planning artifacts in this folder's workflow `.tmp/` directories.

## Forbidden Operations
- Do not authenticate to, or mutate, any client platform — no WordPress admin, hosting, DNS,
  analytics, Google Business Profile, CRM, or ad account.
- **Do not touch another Brandklout client's site.** The shared grant can reach all of them; this
  folder authorizes exactly one, and right now that one is not yet identified.
- **Publishing to the Instatic review host is allowed** (it is ours, not the client's). Connecting
  `westlaimplants.com` or any client domain to it is a separate explicit go-ahead.
- Do not create MCP server instances for this client on your own initiative. A per-client Webflow
  instance authorizes against the same partner workspace and isolates nothing — see
  [ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md#when-the-partner-owns-the-workspace-one-instance-is-correct).
- Do not write to Asana. Comments and status changes notify real Brandklout staff.
- **Do not invent testimonials, reviews, patient stories, or statistics for this practice.** It is a
  real practice with real patients and real Yelp and Google reviews. Real content only, sourced from
  the client's own material.
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
`deliver/brandklout/west-la-implants/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
