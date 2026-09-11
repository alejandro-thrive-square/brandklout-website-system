# Runbook — bk-west-la-implants

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

## Objective

**West LA Implants** (Dr. Tony Barriere, DDS, 12301 Wilshire Blvd #205) — a from-scratch rebuild of
a 91-URL WordPress site, delivered through Brandklout. The immediate deliverable is **one page**:
an awwwards-grade homepage in the "Dark Surgical Luxury" direction the client chose
(`west-la-implants-concepts-7.webflow.io/concept-03-dark-surgical-luxury`), hosted on the
client's own Instatic instance so Brandklout can send a link.

Start at [`project-overview.md`](./project-overview.md).

## Status: HOMEPAGE BUILT, INSTANCE LIVE — the push is the current run

**2026-09-10.** The homepage exists at `workflows/04-design/.tmp/site-src/` (`node build.mjs` →
`dist/`), passes every gate in `DESIGN-STANDARD.md` (journey audit, fluid root, scrub proof on four
pins, six breakpoints with zero overflow, no console errors). The Instatic instance is
`https://west-la-implants-production.up.railway.app` (Railway project `a55b5cac…`, service
"West LA Implants", provisioned name-first with `22-instatic-api-sync/provision-instance.mjs`;
admin bootstrapped; registered in `sites.json` and the master credential file). The upload
toolkit is copied into `workflows/21-instatic-upload/` and the push is in progress — see the
newest runbook entry for the live-verification numbers.

Research is complete: the client scrape (91 pages, 102 MB of assets, local again), three
competitors scraped in full (Wilshire Oral Surgery, Santa Monica OMS, Implant Center LA), and
`01-content-intake/.tmp/gap-analysis/HOMEPAGE-GAP-ANALYSIS.md` is the blueprint the build follows.

## Where things are

| What | Where |
| :--- | :--- |
| Homepage source | `workflows/04-design/.tmp/site-src/` — `index.html`, `css/NN-*.css`, `js/00-runtime.js`, `sections/chapters.js`, `js/90-boot.js`, `build.mjs` |
| Built page | `workflows/04-design/.tmp/site-src/dist/` (committed snapshot) |
| Media for the build | `site-src/media/` (video encodes + stills, gitignored), `site-src/fonts/` (variable woff2, gitignored) |
| Asset mirror | `workflows/03-graphic-resources/.tmp/downloads/` (gitignored; catalogue in `ASSETS.md`) |
| Research | `workflows/01-content-intake/.tmp/` — `current-site-scrape/`, `competitor-scrape/<domain>/`, `gap-analysis/`, `homepage-screenshots/` |
| Upload toolkit | `workflows/21-instatic-upload/` (Stone Med Spa lineage; link dir in `.tmp/railway-link`) |
| QA captures | `workflows/08-qa/.tmp/screenshots/home/` (local build), `…/live/` (published) |
| Instatic admin | `https://west-la-implants-production.up.railway.app/admin` — owner account, shared password (`INSTATIC_PASSWORD_MASON_PARK` in the master file) |

## Open with the client

1. Implant count: 6,000+ (concept questionnaire) vs "more than 5,000 sets" (live site). Not shown.
2. Amenities (Netflix, headphones, blankets, Spanish) come from the concept, not the live site.
3. Consent for Leslie, Emily, Michael; a vector logo; blog scope (46 posts); page count for the
   full build (28–34 per the gap analysis).
4. Their live site's "Read Our Google Reviews" link goes to another practice's Google listing, and
   the footer displays the current-patient number while dialling the new-patient one.

## Traps

Read the **Gotchas** in the newest runbook entry. The ones that will bite again: pipe nothing out
of a Node 24 script that talks to Railway (libuv assertion); capture full pages only under
reduced motion; the B-roll has blank frames that the encodes trim; journey-audit caps chapters at
eight.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
