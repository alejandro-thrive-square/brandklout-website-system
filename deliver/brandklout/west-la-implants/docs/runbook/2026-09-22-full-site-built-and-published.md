# 2026-09-22 — The rest of the site: 34 designed pages + the 46-entry journal, built, pushed and published

**Commit:** `COMMIT_SHA` `feat(west-la-implants): the full site`. Live at
<https://west-la-implants-production.up.railway.app/>, published **seq 18**, then **19** (journal titles at h2 size) and **20** (the two cascade fixes below); it was 17 when
we started — the agency had added two consent code assets since our seq 12, and both survive.
`{"publishedPages":80}`.
Pre-push tag `wla-pre-full-site` (local) on `3afdc6ae`; API snapshot
`21-instatic-upload/.tmp/backup-2026-09-22-pre-full-site/`; `VACUUM INTO
/app/storage/backups/cms-2026-09-22-pre-full-site.db` (14.5 MB) on the container.

## Done

Brandklout reported the homepage design approved and asked for the rest of the site. The Asana
task is **"Complete Client Website" 1216841931530915** (due 2026-09-21; it also asks for a second
CTA for Zocdoc, `https://www.zocdoc.com/booking-link/practice/west-la-implants-65990`, now in the
invitation of every page, the site index, the footer and the contact cover). Its open dependency
"Add Pricing Information for the Pages" is why the cost page carries no dollar figures.

**IA** (`02-wireframe/.tmp/sitemap.json`, `wireframe-rationale.md`): the gap analysis's 28–34
range, landed at 34 designed pages plus the journal. No wireframe round — the approved homepage is
the structural language and the pages went straight to the elevated build.

**Build system** (`04-design/.tmp/site-src/`): `index.html` stays the approved homepage source.
Every other page is a chapter list in `pages/*.mjs` (24 designed pages) or `templates/*.mjs`
(6 neighbourhoods, journal index + 46 entries from the 01 scrape), rendered by `lib/blocks.mjs`
(19 block types: cover, statement, steps, compare, strip, ledger, proof, faq, rail, gallery,
stories, videos, team, detail, tabs, contactcard, prose, postindex, invite) inside one shell
(`lib/layout.mjs`: nav with real links, the burger on every width opening a four-column site
index, a five-column footer, the mobile bar). `build.mjs --strict` writes `dist/` (80 pages,
root-relative links, `seo.json` regenerated from the pages) and refuses a dangling link or a
missing image. Motion: `sections/blocks.js` (statement written by scroll; steps, compare, ledger,
proof and rail pinned and scrubbed; covers arrive and depart) beside the untouched
`chapters.js`. `js/80-seo.js` writes canonical, Open Graph and JSON-LD (Dentist + FAQPage +
per-page MedicalProcedure/Person/BlogPosting) into the published `<head>` from
`<main data-seo>` — trap 31's workaround.

**Media**: 99 photographs from the 03 mirror (`prep-interior-media.py`), ten YouTube posters,
~40 journal heroes; 148 uploads, 402 map entries; 93 alts applied (per asset — see Gotchas).

**Gates**, all against the published site unless noted:

| Gate | Result |
| :--- | :--- |
| `08-qa/.tmp/check-local.mjs` (local, 80 pages × 1440 + 390) | FAIL none: every designed page 6–8 chapters, ≥3 pins that each scrub, console clean, no 390 overflow |
| `scripts/fluid-root.mjs --check dist` | 80/80 (after teaching it root-relative hrefs) |
| `verify-live.mjs` | 80 routes, 482 URLs, 1165 assets, 80 distinct titles, FAIL none |
| `css-parity.mjs` | FAIL none (740 local rules → 759 live) |
| `verify-motion-live.mjs` | FAIL none at 1440 and 390 (homepage) |
| `check-local.mjs --base=<live>` at 1440 / 390 | 80/80 FAIL none at both widths (one journal entry 502'd once mid-republish, clean on re-check) |
| `compare-live.mjs` index, dental-implants, results, one journal entry | no differences after the two cascade fixes (the trap-37 auto-margin artifact only, on index) |
| `visual-diff.mjs` dental-implants, results | 0.33 % / 0.25 % and 0.42 % / 0.25 % at 1440 / 390, no height delta, bands are image re-encoding |

Six-breakpoint screenshots reviewed by eye for index, dental-implants, all-on-4, technology,
results, our-practice, implant-cost, contact, brentwood, blog and one entry
(`08-qa/.tmp/screenshots/<slug>/<width>.png`).

## Next

- Paste `SITE-REVIEW-COMMENT.md` on the Asana task; expect a BugHerd round.
- Client owes: pricing figures (or confirmation none are published), consent for Leslie, Emily,
  Michael and the twelve gallery cases, the privacy-policy text (the page is a marked draft for
  counsel), the form destination (GHL task), a vector logo.
- The before/after originals are 300×225 for Leslie, Emily and Michael; the proof slider upscales
  them. Ask the practice for the originals.
- Nav and footer are inlined on 80 pages, not a Visual Component; the day one changes, rebuild and
  re-push (one command chain) rather than edit 80 rows.

## Gotchas

- **`railway ssh` fails transiently** ("Failed to fetch: error decoding response body") once in a
  hundred calls, and `set -e` killed a 53-chunk ship at the first one. `ship.sh`'s `rs()` retries
  three times now.
- **Alt is per asset, and the longest wins**: a practice photo reused as a neighbourhood cover with
  "a short drive from Brentwood" as its alt would have carried that alt on every page. Every reuse
  of a photograph now shares one descriptive alt; `set-alt.mjs` prints the conflicts — read them.
- **`verify-live.mjs` read the first `<script>` on the page as the site bundle** and failed a good
  publish once the agency's two consent scripts sat ahead of it. It finds the asset carrying
  `window.WZ` now.
- **A nested slug (`blog/x`) must never go through `PATCH /data/rows`** — it flattens to `/blog-x`.
  `push-site.mjs` skips the SEO cell pass for them; the cells are unread by this publisher anyway.
- **Root-relative links defeat page-relative static gates.** `fluid-root.mjs --check` reported
  0/80; `journey-audit.mjs` would report zero pins. The checker was fixed; the runtime pin proof
  in `check-local.mjs` is the journey gate for this site.
- **The media copy in `build.mjs` must run after the templates load**: the journal copies its hero
  images into `media/img` as it loads, and the first strict build failed on six missing heroes.
- **Screenshots run under reduced motion** show the stepper's steps stacked and every statement
  fully lit — that is the reduced-motion design, not a bug. Motion is judged by `check-local`'s
  25/50/75 % scrub fingerprints.
- **`compare-live.mjs` found the local build wrong, not the live one**: `02-base.css` reset `ul`
  but not `ol`, so the stepper's `<ol>` kept the browser's 40px indent locally while Instatic's
  reset.css removed it live (page 92px shorter at 390). `ul,ol` are reset together now. And the
  journal title's mobile `max-width:none` tied at (0,1,0) with `.cv-title--small{max-width:18ch}`
  and lost on the published cascade (trap 20): doubled class settles it. Both fixed at seq 20.
- The remaining `compare-live` findings are the `margin-inline: auto` artifact of trap 37
  (`.wrap` reads `0px` live, geometry identical) — do not suppress, check `x`.
- `08-qa/.tmp/bugherd/tasks.json`, `check-*.log` and `screenshots/**` stay uncommitted.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Runbooks are tracked.
