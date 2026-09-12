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

## Status: PUBLISHED — the homepage is live on the client's Instatic instance

**2026-09-11.** Brandklout's first BugHerd pass (13 tasks on project 541030) is fixed, republished
(seq 11) and every task is answered and closed — [run](./runbook/2026-09-11-bugherd-round-one-thirteen-fixes-republished.md).
Type is heavier and larger-leaded, the treatment rail is shorter, the story stage is sized in JS,
Leslie has a new frame. `08-qa/.tmp/bugherd/pull-bugherd.mjs` and `reply-bugherd.mjs` handle the
next round.

**2026-09-10.** <https://west-la-implants-production.up.railway.app/> serves the eight-chapter
homepage. `{"publishedPages":1}`, 560 nodes, 272 style rules, 52 media assets (44 images, 5 mp4
films, 3 variable woff2), alt text on 19 photographs, favicon set.

All five live gates pass: `verify-live.mjs` clean, `css-parity.mjs` **FAIL none**,
`compare-live.mjs` down to the trap-37 artifact only, `visual-diff.mjs` bands all video frames or
image re-encoding, and **`verify-motion-live.mjs` — the new fifth gate, the only one that drives the
published page — FAIL none**: ScrollSmoother, four pins, the reality scrub, the precision iris, the
story swap, both variable typefaces loaded, the hero film playing, zero console errors, no overflow
at 390.

The homepage source is still the source of truth at `workflows/04-design/.tmp/site-src/`
(`node build.mjs` → `dist/`); the Instatic admin is NOT. Any re-import runs with `--force` and
overwrites anything edited in the CMS.

Research is complete: the client scrape (91 pages, 102 MB of assets), three competitors scraped in
full, and `01-content-intake/.tmp/gap-analysis/HOMEPAGE-GAP-ANALYSIS.md` is the blueprint the build
follows.

## Where things are

| What | Where |
| :--- | :--- |
| Homepage source | `workflows/04-design/.tmp/site-src/` — `index.html`, `css/NN-*.css`, `js/00-runtime.js`, `sections/chapters.js`, `js/90-boot.js`, `build.mjs` |
| Built page | `workflows/04-design/.tmp/site-src/dist/` (committed snapshot) |
| Media for the build | `site-src/media/` (video encodes + stills, gitignored), `site-src/fonts/` (variable woff2, gitignored) |
| Asset mirror | `workflows/03-graphic-resources/.tmp/downloads/` (gitignored; catalogue in `ASSETS.md`) |
| Research | `workflows/01-content-intake/.tmp/` — `current-site-scrape/`, `competitor-scrape/<domain>/`, `gap-analysis/`, `homepage-screenshots/` |
| Upload toolkit | `workflows/21-instatic-upload/` (Stone Med Spa lineage, retargeted; directive `21-instatic-upload.md`; link dir in `.tmp/railway-link`) |
| SEO source | `workflows/04-design/.tmp/site-src/seo.json` — origin, `<title>`, meta description |
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

Read the **Gotchas** in the newest runbook entry, and
[`workflows/21-instatic-upload/21-instatic-upload.md`](../workflows/21-instatic-upload/21-instatic-upload.md)
before touching the upload — it carries forty of them, all found the hard way, and every single one
answered 200 while doing the wrong thing.

The ones that will bite again here: a typed Instatic module keeps only its own props and silently
discards the rest of the tag (`<video>`, `<input>`, `alt`); the published script asset is bundled as
CommonJS and served as a module, so a UMD that is not wrapped never reaches `window`; `!important`,
`svh`, bare `clamp()/min()/max()`, multi-layer backgrounds and custom properties are all dropped by
the CSS conversion; source order is not a contract across the import; `MSYS_NO_PATHCONV=1` belongs
on the `railway ssh` call and nowhere else; pipe nothing out of a Node 24 script that talks to
Railway (libuv assertion); capture full pages only under reduced motion; the B-roll has blank frames
that the encodes trim; journey-audit caps chapters at eight.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
