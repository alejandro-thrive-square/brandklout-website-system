# Project Overview — Stone Surgical Arts

| Field | Value |
| :--- | :--- |
| **Project** | Stone Surgical Arts |
| **Client** | Dr. Mona Stone — one client, **three projects** (see below) |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Source** | Asana — `BK Activation - Stone Dental Implant Center` (not yet split per project) |
| **Scope** | **One full website** — not landing pages |
| **Platform** | Instatic on Railway — production `www.dfwsurgicalarts.com`, staging `staging.dfwsurgicalarts.com` (since 2026-09-15) |
| **Worktree** | `bk-stone` (Orca display name `bk-stone-surgical-arts`) |
| **Due** | None set in Asana |
| **Started** | 2026-08-05 (folder created from Asana dispatch) |

## Process Baseline

Required by [DELIVER_SYSTEM_RULES §3.2](../../../DELIVER_SYSTEM_RULES.md): client workflow folders are
versioned instances, not live mirrors of `deliver/process/`, so the baseline and every deviation are
recorded here.

| Field | Value |
| :--- | :--- |
| `process_baseline_commit` | `968cd4a9` (local `main`, merged as `260ac72b`, 2026-09-08) |
| Routed modules | `00-client-delivery-initialization`, `01-content-intake`, `04-design`, `14-migration-seo-redirects` (2026-09-15), `21-instatic-upload` |
| Not routed | 02, 03, 05-13, 15-20 — this is an Instatic build, not a Webflow one, so the Webflow phases (07, 08) do not apply |
| Run, not copied | The staging clone (2026-09-15) ran from `bk-mason-park`'s `deliver/process/21-instatic-staging-clone`, unmerged; nothing of it lives in this folder |

### One client, three projects

Dr. Mona Stone's engagement is delivered as **three separate projects**, each with its own folder,
worktree, platform instance and overview. They are separate websites with separate brands, so they
are not folded into one folder:

| Project | Folder | Worktree | Platform |
| :--- | :--- | :--- | :--- |
| **Stone Surgical Arts** (this one) | `stone-surgical-arts/` | `bk-stone` | Instatic |
| Stone Dental Implant Center | `stone-dental-implant-center/` | `bk-stone-dental` | Webflow (ad landing pages) |
| Stone Med Spa | `stone-med-spa/` | `bk-stone-med-spa` | Instatic |

Asana has not been split to match yet — both Stone task GIDs are still listed against the first two
in `asana-context.mjs`. Split them there once Asana is reorganised.

Before 2026-09-04 this project lived inside `stone-dental-implant-center/` because the signed scope
was written as "2 full websites" under one Asana project. It was separated so that a folder means a
website.

### Documented deviations

- **`21-instatic-upload` is a client-local module**, not a canonical one. It was created here as
  `05-instatic-upload`, which **collided with the canonical `05-design-revisions`**; renamed
  2026-09-04 to the next free number. [PROCESS_INDEX](../../../process/PROCESS_INDEX.md) claims
  00-20, with 19 held by `19-cloudflare-launch` (promoted on the `bk-dr-nahlah` branch, not yet
  merged to `main`). **Check the worktrees, not just `main`, before claiming a number.**
  It should be promoted to `deliver/process/` — `bk-stone-med-spa` has its own copy of the same
  module, still numbered `05`, and two clients using a module is the promotion trigger.
- **Site output lives under `04-design/.tmp/`**, which is correct per §3 ("store ... design outputs
  and final workflow assets inside the `.tmp/` folder of the workflow that produces them"). Note
  `bk-mason-park` puts its build *outside* `.tmp/`; this folder follows the rule, that one does not.
- **Modules 00, 01 and 04 carry no `.md` directive.** The standard workflow structure is
  `.md` + `.py` + `TRIGGER_PROMPT.txt` + `.tmp/`; only `21-instatic-upload` has its directive.

## Current status, 2026-09-08

The 12-page site published on September 4 is extended locally with a blog overview and three
articles recovered from content intake, rendered through one article template. Local responsive
and interaction tests pass; Instatic import and comparison are in progress. The older status
notes below are historical and predate the twelve-page publication. See the current
[runbook](RUNBOOK.md) and [blog provenance](../workflows/04-design/.tmp/surgical-arts/BLOG-CONTENT.md).

Process refresh: merged current local main and reviewed canonical `04-design`; retained the
client-local Instatic route and existing approved site design. The missing design directive is
covered for this extension by `BLOG-CONTENT.md`; no Webflow conversion is part of this task.

## Historical status

**Stone Surgical Arts: the home page and one service page, as of 2026-09-01.** It was seven core
pages on 2026-08-30 and eighteen on 2026-08-31. The client reviewed the site and kept the home page;
the other seventeen pages and everything that existed to serve them were deleted from the
repository, though the asset library was kept whole. **The neck lift was then rebuilt the same day** — not
recovered, rewritten — as the check on whether the design works for a page that has to sell a
procedure rather than position a practice. The first attempt composed it out of the home page's own
chapters and the client said so immediately: *"practically the same as the home page."* It is now a
**dossier**: a two-column layout with a sticky spec rail, three interactive components, a comparison
matrix and a recovery timeline that draws itself. The home page is a journey; a service page is a
document you interrogate. Awaiting sign-off on the direction, Instatic re-publish, and the client
decisions in the handoff. Start at
[workflows/04-design/.tmp/surgical-arts/HANDOFF.md](../workflows/04-design/.tmp/surgical-arts/HANDOFF.md).

> [!WARNING]
> **The live Instatic site is these two pages, published 2026-09-01.** The sixteen retired pages
> were deleted from the instance in the same atomic PUT, at the client's request, so the staging
> link can go to the team. `verify-live.mjs` is clean and both routes were read on the published
> site rather than assumed. <https://stone-surgical-arts-production.up.railway.app>

**Stone Med Spa: still not started**, and still unscoped. It is a separate brand — Instagram calls
it *Westlake Medical Aesthetics* — and task `1217160668112180` has no page list, no design and no
brand identity. The questions in
[scoping-questions.md](../workflows/00-client-delivery-initialization/.tmp/scoping-questions.md)
still apply to it and still have not been sent.

### What unblocked the Surgical Arts build

The 2026-08-05 note said "do not start building" because nothing was specified. Three things landed
in Asana on 2026-08-27 that specified it:

| | |
| :--- | :--- |
| **The page list** | Sang Huynh named seven core pages in a comment on [`1217846850268874`](https://app.asana.com/1/1210572425689866/project/1211830976769588/task/1217846850268874). **Superseded 2026-09-01** — the client kept the home page alone |
| **The design** | Jessica: *"Dr. Mona picked this design"* — the board **01 — Sculpted Ivory**, attached to the same task |
| **The go-ahead** | Alejandro, 2026-08-30, choosing Surgical Arts over the med spa where Sang's wording was ambiguous |

Sang's comment is worded for the *med spa* but the design Dr. Mona picked is titled *Stone Surgical
Arts*, and its four categories are Face / Neck / Skin / Non-Surgical. The build follows the design's
taxonomy inside Sang's seven-page architecture. That decision is recorded in
[SURGICAL-ARTS-BRIEF.md](../workflows/01-content-intake/.tmp/SURGICAL-ARTS-BRIEF.md).

## Task manifest

| Task | GID | Notes in Asana |
| :--- | :--- | :--- |
| [Build New Stone Med Spa](https://app.asana.com/1/1210572425689866/task/1217160668112180) | `1217160668112180` | *(empty)* |
| [Build New Stone Surgical Arts website](https://app.asana.com/1/1210572425689866/task/1217160668112175) | `1217160668112175` | *(empty)* |

> [!IMPORTANT]
> These are the **largest-scope and least-specified** items assigned to Webzite. "Build New
> \<name\> website" is a full site build — an order of magnitude more work than a landing page —
> and the Asana project is `BK Activation`, not `BK Implementation`, which for
> [Dr. Nahlah](../../dr-nahlah/docs/project-overview.md) meant early-stage/onboarding rather than
> production. **Do not start building.** Scope these with Brandklout first.

## Resolved 2026-08-05 — one practice, three brands

**Dr. Mona Stone, DDS** (board-certified oral & maxillofacial surgeon) is the sole surgeon behind
all three names, at one address: 72 Andorra Dr #110A, Westlake, TX 76262 · (817) 383-8361.

`Stone Surgical Arts` was the original WordPress site, covering three service pillars. It has been
consolidated into `Stone Dental Implant Center` — **live on Webflow** — which now carries only the
oral-surgery pillar. The cosmetic and skin pillars were dropped and are offline. The two tasks are
therefore **pillars 2 and 3 of a brand split that is already one-third complete**:

| Pillar | Brand | Status |
| :--- | :--- | :--- |
| Oral & maxillofacial surgery | Stone Dental Implant Center | **Live on Webflow.** 43 URLs. |
| Cosmetic facial *surgery* | Stone Surgical Arts | Task `1217160668112175` — built to 18 pages by 2026-08-31, **cut to the home page 2026-09-01** on the client's review, then the **neck lift** rebuilt in the journey design the same day as the direction check |
| Non-surgical skin & aesthetics | Stone Med Spa / Westlake Medical Aesthetics | Task `1217160668112180` — new brand, not started |

Rough sizing, for **sequencing and capacity only**: mirroring the archived architecture is ~42 pages
across both builds; a lean hero-procedure launch is ~21. Which one we plan against depends on the
questions below.

> [!IMPORTANT]
> Brandklout is a **partner engagement**, not a per-page client.
> PRICING_TIMELINE_RULES.md (in the `webzite-agentic-workflow` repository) does **not** apply to
> anything under `deliver/brandklout/`. Do not compute or record a price, rate, quote, or cost in
> this folder.

> [!WARNING]
> All ~130 old Surgical Arts deep links **404**. The consolidation used a blanket apex redirect with
> no page-level map, so search equity is decaying now. Worth raising with Brandklout even if both
> builds are deferred.

## Remaining unknowns

Only decisions the client or Brandklout can make. Full set with draft wording in
[scoping-questions.md](../workflows/00-client-delivery-initialization/.tmp/scoping-questions.md):

1. **Is the three-brand split correct**, and which brand owns the overlapping services (Botox,
   fillers, Morpheus8, HydraFacial, CO2 laser, PRP, GLP-1 weight loss)?
2. **Full architecture or lean launch**, and what is the sequence between the two builds?
3. **Does Stone Med Spa exist yet** — and is brand identity in scope? If it is ours, it blocks design
   and sits on the critical path.
4. **Domains and DNS** — is `stonesurgicalarts.com` reclaimed, and who controls DNS?
5. **Webflow grant** — same workspace as the implant center? Shared design system or distinct?
6. **Content** — recover from the Wayback archive, client-supplied, or copywriting in scope?
7. **Before/after photography** — 33 real patient cases; needs current consent, not archive scraping.
8. **Integrations** (Crisalix, Cherry financing, GHL routing) and **who approves**.

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | **Artifacts produced 2026-08-05** | Discovery + scoping questions in `.tmp/`. Questions not yet sent. |
| `12-migration-audit-plan` | **Applies** | Confirmed: content is recovered from an archived WordPress site, and a redirect map is needed. |
| `01-content-intake` | **Done for Surgical Arts, 2026-08-30** | [SURGICAL-ARTS-BRIEF.md](../workflows/01-content-intake/.tmp/SURGICAL-ARTS-BRIEF.md). Sources: the live sister site, the practice's Instagram and Linktree, and the archived screenshots — `web.archive.org` is blocking this IP. |
| `04-design` → build | **Done for Surgical Arts; cut back 2026-09-01** | The home page in [`.tmp/surgical-arts/`](../workflows/04-design/.tmp/surgical-arts/HANDOFF.md). Sculpted Ivory, Client-First, audited clean. Seventeen other pages were built and then deleted on the client's review; they are in git history. |
| Instatic setup | **Next** | HANDOFF.md § "Taking it into Instatic". Uses [15-instatic-api-sync](../../dr-nahlah/workflows/15-instatic-api-sync/15-instatic-api-sync.md) and [20-instatic-domain-origins](../../../process/20-instatic-domain-origins/20-instatic-domain-origins.md). |
| Med Spa, all phases | Blocked | Needs Q1–Q3, and a brand identity that does not exist yet. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

## Recommended next action

**Send HANDOFF.md's "Before this goes live" list to Brandklout.** Nine items; four need the client,
and two of those block launch outright — the fee schedule (recovered from a two-generation-old
archive) and the membership tiers (drafted by us, because the practice's real programme is published
nowhere).

Then the Instatic setup, which is a session of its own: the stylesheet has to go into the style
registry rather than as a code asset, or the site looks right and cannot be edited.

Still open, and still worth raising independently: **`stonesurgicalarts.com` currently resolves to
the implant-center Webflow site**, so pointing it at the new build is a deliberate cutover, not a
DNS afterthought. And the ~130 dead Surgical Arts deep links are still 404ing — ongoing SEO loss
that predates our involvement and is cheap to fix.

## Project structure

```
deliver/brandklout/stone-dental-implant-center/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # Read before any platform action
└── workflows/
    ├── 00-client-delivery-initialization/.tmp/
    │   ├── discovery-findings.md      # Public research, 2026-08-05
    │   ├── scoping-questions.md       # Draft to Brandklout — NOT sent; med spa only now
    │   └── archived-urls-raw.txt      # ~130 archived Surgical Arts URLs
    ├── 01-content-intake/.tmp/
    │   ├── SURGICAL-ARTS-BRIEF.md     # Every fact used in the build, and its source
    │   ├── serve.mjs                  # Static server (the extension refuses file://)
    │   ├── archive-text/              # Live-site text pull + the blocked Wayback fetcher
    │   └── wayback-screenshots/       # 112 full-page PNGs, gitignored
    └── 04-design/.tmp/surgical-arts/
        ├── HANDOFF.md                 # START HERE for the Instatic session
        ├── preview.html               # 390 / 768 / 1280 side by side
        ├── site-src/                  # Source: partials, pages, css, js, seo.json
        └── final-site/                # Generated — never hand-edit
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
