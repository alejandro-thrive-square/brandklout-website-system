# Stone Med Spa — MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

| MCP Server | Purpose | Status |
| :--- | :--- | :--- |
| `webflow-brandklout` | Webflow access for every Brandklout client. Shared instance — **the site ID under Target Resources is the boundary, not the tool prefix**. | Authenticated on the `team` profile. **No site exists for this brand**, so there is nothing here to act on. |
| `webflow-clientfirst` | Local Client-First conversion helper. Reads files, holds no credentials, makes no network calls. | Always available. |

Partnership-level Asana access is covered by [../../docs/mcp-access.md](../../docs/mcp-access.md)
and is **read-only**. Being able to read this brand's Asana task confers no permission to touch a
website, host, CRM or ad account.

> [!IMPORTANT]
> **The instance is shared; the site is not.** `webflow-brandklout` is one grant covering every
> Brandklout client, so the tool prefix does not tell you which client you are acting on. Before
> any mutating call, take the site ID from Target Resources and pass it explicitly.
>
> **There is no site ID for this brand.** `list_sites` on 2026-08-07 returned nine sites and none
> belongs to Stone. Nothing has been built for any Stone pillar in Brandklout's Webflow workspace.
> Re-authorizing the grant to add one replaces it **wholesale** — every existing client must be
> ticked or it is silently revoked. That procedure belongs to the partner file, not this folder.

> [!WARNING]
> **The sibling pillar publishes to Instatic, not Webflow.** Stone Surgical Arts is served from
> Railway at `stone-surgical-arts-production.up.railway.app`. **That instance is not yours.** This
> folder authorizes no writes to it, and a `push-site.mjs` run is an atomic PUT of a whole site —
> pointed at the wrong instance it would delete the sibling brand's twelve published pages.
> Confirm the target instance in the current conversation before any publish.

## Target Resources
- **Asana task**: `1217160668112180` (workspace `1210572425689866`, project `1213901750672059`)
- **Live site**: none. The brand has no domain and no site.
- **Staging / platform account**: none.

## Allowed Operations
- Read this brand's Asana task through the read-only partnership scripts.
- Public, unauthenticated research on the practice's live sites, its social accounts, and the
  Wayback archive of the retired `stonesurgicalarts.com`.
- Create planning and design artifacts in this folder's workflow `.tmp/` directories.

## Forbidden Operations
- Do not authenticate to, or mutate, any client platform — no Webflow site, Instatic instance,
  Railway project, GHL, hosting, DNS, analytics, CRM or ad account.
- **Do not touch another Stone pillar.** The implant centre is live to real paid traffic and the
  Surgical Arts staging link is under client review. Neither is in this folder's scope.
- **Do not publish.** Scope, then identity, then local design approval, then a separate explicit
  go-ahead.
- Do not write to Asana. Comments and status changes notify real Brandklout staff.
- Do not invent testimonials, reviews, patient stories, prices or statistics for this practice.
- **Do not republish archived patient before-and-after photography.** Fifteen galleries are
  recoverable from the Wayback Machine. Consent status is unknown, which makes it a HIPAA problem,
  not a sourcing convenience.
- Do not store API keys, tokens, passwords or session exports in this repository.

## Confirmation Requirements
Any first contact with a client-owned system requires explicit confirmation in the current
conversation, plus an update to this file naming the target account and site ID.

## Runtime Authentication Notes

Authenticate in a **team-profile** terminal (`claude team`). OAuth grants live in
`~/.claude-<profile>/.credentials.json` keyed `<server-name>|<url-hash>` — per profile and global
across projects, not per worktree. A grant made on the personal profile is invisible to client
agents, which all run on team.

Do not register a per-brand Webflow instance. Brandklout owns the workspace, so a per-client
instance authorizes against that same workspace and isolates nothing. See
[ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md#when-the-partner-owns-the-workspace-one-instance-is-correct).

## Artifact Storage
`deliver/brandklout/stone-med-spa/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
