# Legacy Dental Pasadena - MCP Access

## Access Level
Client delivery (via the Brandklout partnership).

## Referenced Profile
[client-delivery.md](../../../../mcp-servers/profiles/client-delivery.md)

## Active MCP Servers

| MCP Server | Purpose | Status |
|:---|:---|:---|
| `webflow-brandklout` | Webflow access for every Brandklout client, this one included. Shared instance — **the site ID under Target Resources is the boundary, not the tool prefix**. | **LIVE.** Reach to this specific site confirmed 2026-08-20 via `get_site`. |
| `webflow-clientfirst` | Local Client-First conversion helper. Reads files, holds no credentials, makes no network calls. | Always available. |

Partnership-level Asana access is covered by
[../../docs/mcp-access.md](../../docs/mcp-access.md) and is **read-only**. It grants nothing here:
being able to read this client's Asana tasks confers no permission to touch their website,
hosting, CRM, ad accounts, or their patient scheduler.

> [!IMPORTANT]
> **The instance is shared; the site is not.** `webflow-brandklout` is one grant covering every
> Brandklout client, because they all sit in one workspace Brandklout owns — so the tool prefix does
> **not** tell you which client you are acting on. Before any mutating call, take the site ID from
> Target Resources below and pass it explicitly. Never act on a site the tool defaulted to, listed
> first, or that merely came up in conversation.

## Target Resources

- **Asana parent task**: `1217611213174386` (workspace `1210572425689866`, project
  `BK Implementation - Legacy Dental Pasadena` `1212641204749217`)
- **Webflow site**: **Legacy Dental Pasadena - Cosmetic & Implant Dentistry**, site id
  **`68e12d861f12c7f04a762a8e`**, short name `legacy-dental`, workspace
  `63b4b7393e89b78575e9a9bb`, parent folder `6913c1f7094146b473c586dc`. Confirmed 2026-08-20 via
  `get_site`. Timezone `America/Los_Angeles`. Created 2025-10-04, last published 2026-08-10.
- **Staging URL**: https://legacy-dental.webflow.io — live, returns 200.
- **Live site**: https://legacydentalpasadena.com/ — **this is the same Webflow site**, not a
  separate platform. Editing the site edits the practice's production website.
- **Pages**: **78** as of 2026-08-20. Full service tree, 15 blog posts, four CMS collections
  (Blogs, Blog categories, Blog authors, Home videos), a **draft Client-First style guide** at
  `68e12d871f12c7f04a762ae7`.
- **Online booking**: `https://schedule.jarvisanalytics.com/frame?eoid=15391&elid=15000000000923`
  (Jarvis Analytics). Public embed link only — no account, no credentials, nothing written to it.

### Pages relevant to this engagement

| Page | Id | State |
| :--- | :--- | :--- |
| `invisalign-offer-pasadena` | `69c7517d9a46fc9fe1bf1f7c` | Live, 200, not in sitemap. **Existing paid-traffic LP** |
| `invisalign-clear-aligners-pasadena` ("Invisalign Meta Ads") | `69bad96a0c05edcc53a701ec` | **Draft**, 301s publicly |
| `style-guide` | `68e12d871f12c7f04a762ae7` | Draft. Read it before creating any class |

> [!CAUTION]
> **This is a live, revenue-generating practice website — the highest-risk site in the Brandklout
> set.** Mason Park was an empty site with no custom domain; this one has 78 pages, four CMS
> collections and real patients booking through it. Every previous Brandklout build could afford a
> mistake on staging. This one cannot afford a mistake anywhere.

> [!CAUTION]
> **The site carries a SECOND BRAND'S DOMAINS.** `customDomains` on
> `68e12d861f12c7f04a762a8e` lists four entries:
>
> | Domain | |
> | :--- | :--- |
> | `legacydentalpasadena.com` | this client |
> | `www.legacydentalpasadena.com` | this client |
> | `caldentalpasadena.com` | **not this brand** |
> | `www.caldentalpasadena.com` | **not this brand** |
>
> A full-site publish with `customDomains` unset or set to "all" therefore pushes to
> `caldentalpasadena.com` as well. Before any publish is authorised, establish what that domain is
> and who owns it. Until then, publish **only** with
> `publishToWebflowSubdomain: true` and `customDomains: []`.

## Allowed Operations

- Read this client's Asana tasks through the read-only partnership scripts.
- Public, unauthenticated research on the client's own live site.
- Read Webflow structure on site `68e12d861f12c7f04a762a8e` — pages, styles, elements, the style
  guide, CMS schemas.
- Create design and planning artifacts in this folder's workflow `.tmp/` directories.
- **Create the three new pages** on that site, as **drafts**, once the slug question in
  [project-overview.md](./project-overview.md#open-questions--close-these-before-04-design-ships)
  is answered.

## Forbidden Operations

- **Do not publish to a custom domain.** Staging only (`publishToWebflowSubdomain: true`,
  `customDomains: []`). Publishing to a custom domain here puts pages in front of real paid traffic
  **and** touches a second brand — it needs an explicit, separate go-ahead naming the domains.
- **Do not modify, restyle, or delete any of the 78 existing pages.** The scope is three new pages.
  A shared class edited "just a little" repaints the whole practice site — the site already has a
  Client-First system and `set_style` resolves whole class chains. Add, never mutate.
- **Do not edit CMS collections or items.** The blog is live and indexed.
- **Do not touch another Brandklout client's site.** The shared instance can reach all of them; this
  folder authorizes exactly one.
- Do not authenticate to, or mutate, any other client platform — no hosting, DNS, analytics, CRM,
  ad accounts, or the Jarvis scheduler.
- Do not insert tracking, GTM containers, call-tracking numbers, or DNI code. Those are Gauge Hill's
  Asana subtasks. Build the seams, hand them over.
- Do not create MCP server instances for this client on your own initiative.
- Do not write to Asana. Comments and status changes notify real Brandklout staff.
- **Do not invent testimonials, reviews, patient stories, statistics, or prices for this practice.**
  Real content only, sourced from the client's own material. Note that the client's own site
  currently states two conflicting review counts — carry neither forward unverified.
- Do not store API keys, tokens, passwords, or session exports in this repository.

## Confirmation Requirements

Any first contact with a client-owned system requires explicit confirmation in the current
conversation, plus an update to this file naming the target account and site ID.

Publishing — to anything, including staging — is confirmed separately from building.

## Runtime Authentication Notes

Authenticate in a **team-profile** terminal (`claude team`). OAuth grants are stored in
`~/.claude-<profile>/.credentials.json` keyed `<server-name>|<url-hash>`, which makes them **per
profile and global across projects** — not per worktree. Authenticating on the personal profile puts
the grant where client agents cannot see it, because all client work runs on team.

Do not register a per-client Webflow instance for this client: because Brandklout owns the
workspace, a per-client instance authorizes against that same workspace and isolates nothing. See
[ACCESS_MODEL.md](../../../../mcp-servers/ACCESS_MODEL.md#when-the-partner-owns-the-workspace-one-instance-is-correct).

Re-authenticating `webflow-brandklout` replaces its grant wholesale, so the OAuth screen must have
**every** active Brandklout client ticked, not just this one. Unticking a sibling revokes it
silently. That procedure belongs to the partner file — do not run it from this folder to add a site.

## Artifact Storage
`deliver/brandklout/legacy-dental-pasadena/workflows/<workflow>/.tmp/`

## Version Control
Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
