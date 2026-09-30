# Runbook — bk-west-la-implants

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

## Objective

**West LA Implants** (Dr. Tony Barriere, DDS, 12301 Wilshire Blvd #205) — a from-scratch rebuild of
a 91-URL WordPress site, delivered through Brandklout, in the "Dark Surgical Luxury" direction the
client chose, hosted on the client's own Instatic instance. The homepage was approved on
2026-09-22 and the rest of the site was built on it the same day. Asana: **"Complete Client
Website" 1216841931530915** (Success Daily Stand-Up · BK Implementation - West LA Implants).

Start at [`project-overview.md`](./project-overview.md).

## Status: PUBLISHED — the full site (80 pages) is live on the client's Instatic instance

**2026-09-30 (later).** The homepage proof chapter shows the **live Google reviews** (Elfsight
widget `670ca31c…`, an Embed block where the three static cards were), published **seq 25** —
[run](./runbook/2026-09-30-elfsight-google-reviews-on-homepage.md). **Any re-import drops it**:
run `21-instatic-upload/add-elfsight-reviews.mjs --apply --publish` after every push.

**2026-09-30.** Six ads landing pages (All-on-6 and 3-on-6; landing, consultation, thank you) were
added under `/ads-landing-pages/` and published at **seq 24**, 86 pages in all. Their state, and
every run from here on, is in the client runbook one level up: [`../RUNBOOK.md`](../RUNBOOK.md).
The upload chain changed the same day: see "The ads set" and trap 43 in `21-instatic-upload.md`.

**2026-09-24 (later).** Strict image pass: every photo now shows what its copy is about, from the
practice's library or licensed Freepik stock (42, ledger in `03-graphic-resources/.tmp/stock/`),
published **seq 23** — [run](./runbook/2026-09-24-strict-image-pass.md). Only the before/after case
photos remain soft (client originals owed).

**2026-09-24.** Pre-review content-fit QA ran on all 80 pages (copy fit, and every photo judged
against its copy). Fixes are published at **seq 22**; backed up at seq 21 first (tag
`wla-pre-qa-2026-09-24`, API snapshot, `VACUUM INTO` DB copy) —
[run](./runbook/2026-09-24-pre-review-content-fit-qa.md), [report](./qa-report.md). Next: Jessica
reviews from the "West LA Implants — Pre-Review QA" doc's checklist.

**2026-09-22.** 34 designed pages plus the 46-entry journal, built from `pages/*.mjs` and
`templates/*.mjs` through `lib/blocks.mjs` on the approved homepage's chrome and runtime, pushed
with `--force` and published at **seq 20** — [run](./runbook/2026-09-22-full-site-built-and-published.md).
Every gate is green on all 80 routes; the review comment for Brandklout is
[`SITE-REVIEW-COMMENT.md`](../SITE-REVIEW-COMMENT.md). Zocdoc is the second CTA everywhere.
Waiting on: the BugHerd round, pricing figures, patient consent, the privacy text, the form's
destination, a vector logo.

**2026-09-15.** Brandklout's second BugHerd pass (#14–#18) fixed, republished (seq 12), closed —
[run](./runbook/2026-09-15-bugherd-round-two-five-fixes-republished.md). The live page also loads
a Sienna accessibility widget that is not in the build (trap 42); the agency has since added two
consent code assets to the shell (seq 13–17), which `push-site.mjs` preserves.

**2026-09-11.** First BugHerd pass (13 tasks) fixed, republished (seq 11), closed —
[run](./runbook/2026-09-11-bugherd-round-one-thirteen-fixes-republished.md).
`08-qa/.tmp/bugherd/pull-bugherd.mjs` and `reply-bugherd.mjs` handle the next round.

**2026-09-10.** Homepage published; five gates written — [run](./runbook/2026-09-10-homepage-pushed-to-instatic-and-published.md).

The build in `workflows/04-design/.tmp/site-src/` is the source of truth (`node build.mjs
--strict` → `dist/`); the Instatic admin is NOT. Any re-import runs with `--force` and overwrites
anything edited in the CMS. The full chain is in
[`21-instatic-upload.md`](../workflows/21-instatic-upload/21-instatic-upload.md) → Execution Steps.

## Where things are

| What | Where |
| :--- | :--- |
| Site source | `workflows/04-design/.tmp/site-src/` — `index.html` (the approved homepage), `pages/*.mjs` + `templates/*.mjs` (every other page), `lib/` (blocks, layout, site facts), `css/NN-*.css`, `js/00-runtime.js`, `sections/*.js`, `js/80-seo.js`, `js/90-boot.js`, `build.mjs --strict` |
| IA record | `workflows/02-wireframe/.tmp/sitemap.json`, `wireframe-rationale.md` |
| Page check (local and `--base=<live>`) | `workflows/08-qa/.tmp/check-local.mjs` — chapters, pins that scrub, console, 390 overflow, SEO injection, six-breakpoint screenshots |
| Built site | `workflows/04-design/.tmp/site-src/dist/` (gitignored — rebuild with `node build.mjs --strict` before any gate; 80 pages) |
| Media for the build | `site-src/media/` (video encodes + stills, gitignored), `site-src/fonts/` (variable woff2, gitignored) |
| Asset mirror | `workflows/03-graphic-resources/.tmp/downloads/` (gitignored; catalogue in `ASSETS.md`) |
| Research | `workflows/01-content-intake/.tmp/` — `current-site-scrape/`, `competitor-scrape/<domain>/`, `gap-analysis/`, `homepage-screenshots/` |
| Upload toolkit | `workflows/21-instatic-upload/` (Stone Med Spa lineage, retargeted; directive `21-instatic-upload.md`; link dir in `.tmp/railway-link`) |
| Google reviews widget | `workflows/21-instatic-upload/add-elfsight-reviews.mjs` — the Elfsight Embed block in the homepage `#proof`; re-run after every push |
| SEO source | each page module's `title`/`description`; `seo.json` is regenerated by the build (origin + all 80) |
| QA captures | `workflows/08-qa/.tmp/screenshots/home/` (local build), `…/live/` (published) |
| Instatic admin | `https://west-la-implants-production.up.railway.app/admin` — owner account, shared password (`INSTATIC_PASSWORD_MASON_PARK` in the master file) |

## Open with the client

1. Implant count: 6,000+ (concept questionnaire) vs "more than 5,000 sets" (live site). Not shown.
2. Amenities (Netflix, headphones, blankets, Spanish) come from the concept, not the live site.
3. Consent for Leslie, Emily, Michael; a vector logo; blog scope (46 posts); page count for the
   full build (28–34 per the gap analysis).
4. Their live site's "Read Our Google Reviews" link goes to another practice's Google listing, and
   the footer displays the current-patient number while dialling the new-patient one.
5. The staging page loads a Sienna accessibility widget (`data-wz-site-script`) that is not in our
   build; it freezes type sizes inline (quotes render 16px, not 17.92px). Keep or remove is theirs.

## Traps

Read the **Gotchas** in the newest runbook entry, and
[`workflows/21-instatic-upload/21-instatic-upload.md`](../workflows/21-instatic-upload/21-instatic-upload.md)
before touching the upload — it carries forty-two of them, all found the hard way, and every single one
answered 200 while doing the wrong thing.

The ones that will bite again here: a typed Instatic module keeps only its own props and silently
discards the rest of the tag (`<video>`, `<input>`, `alt`); the published script asset is bundled as
CommonJS and served as a module, so a UMD that is not wrapped never reaches `window`; `!important`,
`svh`, bare `clamp()/min()/max()`, multi-layer backgrounds and custom properties are all dropped by
the CSS conversion; source order is not a contract across the import; `MSYS_NO_PATHCONV=1` belongs
on the `railway ssh` call and nowhere else; pipe nothing out of a Node 24 script that talks to
Railway (libuv assertion); capture full pages only under reduced motion; the B-roll has blank frames
that the encodes trim; journey-audit caps chapters at eight.


## Cookie consent (Termly) — 2026-09-22

**Applied and published to the Instatic build**, which is not yet the live site. Nothing fires before a visitor chooses. Account `westlaimplants@thrivesquare.com`, website UUID
`ca7a6606-636f-4af5-a0f0-83aaf6ec1ff1`, `autoBlock=off`. The Cookie Preferences control is inserted at runtime by
`BrandkloutConsentPreferences` / `brandklout-consent-preferences.js`, which clones the footer's
Privacy Policy link so it matches this site's own type.

`TERMLY_API_KEY` is in this worktree's generated `.env`, from `~/.webzite/.env` `[vars]`
`TERMLY_WEST_LA`. Never hand-edit `.env`; edit the master and run `node scripts/env-sync.mjs`.
The key is near-useless (one read-only endpoint) — the public **website UUID** is what tooling needs.

**Do not re-add a consent hold to a GoHighLevel number pool**: the client's instruction (2026-09-22)
is that pools run even without consent.

Full history: [`runbook/2026-09-22-termly-cookie-consent.md`](./runbook/2026-09-22-termly-cookie-consent.md). Cross-site detail:
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
