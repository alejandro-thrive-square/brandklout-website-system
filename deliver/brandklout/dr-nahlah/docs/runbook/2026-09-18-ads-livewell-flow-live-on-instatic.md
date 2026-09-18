# 2026-09-18 — ads landing pages: rebuilt to the Livewell flow, LIVE on Instatic under /ads-landing-pages/

Brandklout rejected the 2026-09-17 build ("this output does not convince me") and asked for
the same flow of information as Livewell's ads landing pages
(`livewelldentalva.com/ads-landing-pages/{dental-implants, dental-implant-consultation,
thank-you-implants}`), then for everything to go up on Instatic under `/ads-landing-pages`.
Both done. Eighteen pages are live on production, verified, noindex, with the four site tags
live site-wide.

## Done (commit: see the row in INDEX.md)

### The flow, section for section

Every landing page now runs in Livewell's order, and the three campaigns share it:

| # | Livewell | Here |
| :-- | :-- | :-- |
| 1 | hero: headline, Book + Call, service area, the doctor on film, the form card | same; the film is the page's one real YouTube iframe, the form is this office's LeadConnector form |
| 2 | journey: one before/after slider, four story beats, Book | `.lp-journey`: a wide `.pk-ba` slider with "Life before / Life after" labels, four `.pk-card` beats with a photograph each, `.lp-sec-cta` |
| 3 | why patients drive past: four cards, the filmed patients, Book | four `.pk-card`s, three `.vl-card` facades of the practice's own filmed patients, `.lp-sec-cta` |
| 4 | the dentist: film, copy, pull-quote, four photographs | `.pk-split` with the headshot, `.lp-quote`, `.pk-stats`, a `.mz-4` of four photographs |
| 5 | options: one tooth to a full smile, three cards with a photograph and what moves the price | `.lp-tiers` with `.lp-tier-fig`, spec list, `.lp-tier-note` ("what moves the cost"); NO figures. All-on-4 keeps the three arches FP1/FP2/FP3 here |
| 6 | process: three steps, Book, film | `.lp-steps` (three; four on All-on-4 and veneers), `.lp-sec-cta` |
| 7 | real patients, real results: seven before/afters, Book | six `.pk-ba` sliders, `.lp-sec-cta` |
| 8 | a space designed for your comfort: five photographs | `.mz-4` with three `.mz-wide` |
| 9 | FAQ, seven questions | `.pk-faq` beside the portrait, the same seven questions per campaign |
| 10 | final: argument, film, Book, "prefer to talk? call", credential logo marquee | `.lp-final-grid`: copy + film (or photograph on veneers), `.lp-creds` typeset credential strip |

The consultation page is Livewell's: form and the doctor above the fold, "Hear from our
patients" (one real film, three facades), the specialist with his credentials, nothing else.
The thank-you page is Livewell's call-first page: "Let's talk about your new smile", Call,
the rating, what the call covers, what waiting costs, why this practice, the FAQ, Call again
with call / visit / hours and the credentials.

**CTAs go to the consultation page**, as on the reference (`build-site.mjs` `landing.book`
is the consultation file for every landing page; `#book` on consultation pages; `tel:` on
thank-you pages). The hero form stays, also as on the reference.

Bodies: the nine `pages/ads-*.body.html` rewritten. CSS: `css/70-landing.css` rewritten
(stakes, CTA bands, lenders, wide figure gone; journey, section-foot CTA row, pull-quote,
tier figure, closer grid, credential strip, thank-you hero, call/visit/hours grid new). JS:
`sections/video-library.js` now binds facades on the document, not on the first `.vl-grid`
(the landing pages carry a grid, a lone card and a grid under a story row). One film
(`bn3vdCgDTrc`, the couple) has no `maxresdefault`; it uses `hqdefault`.

### On Instatic, headlessly

The MCP editor bridge is dead (its grant points at encorercm.com), so the pages went in over
REST with three new scripts in `workflows/22-instatic-api-sync/`:

| Script | Does |
| :-- | :-- |
| `upload-ads-media.mjs --map <map> --apply` | uploads the photographs the library lacks (20), writes the map. Run per host: production's map is `13-content-export-import/.tmp/instatic-media-map.json`, staging's `.tmp/media-map-staging.json` |
| `ads-to-nodes.py --map <map> --out <dir>` | built HTML → Instatic page documents, node shapes copied from what the platform's own importer produced; maps `ads-<rest>` → `ads-landing-pages/<rest>`; refuses an unmapped image |
| `push-ads-pages.mjs --nodes <dir> --apply` | 70 empty class rules for the `lp-*`/`is-*` names, `src/styles/landing.css` as a code asset scoped to the 18 page ids, one site-document write per page with read-back counts, SEO cells, then a second site-document write (see Gotchas), templates asserted |
| `set-site-tags.mjs --apply` | Termly (autoBlock=off), GTM, LeadConnector pool + session into the Embed Origins `siteScripts`, read-merge-write; `app.termly.io` frame, `us.consent.api.termly.io` connect |
| `verify-ads-live.mjs <host>` | the 18 nested URLs answer and the flattened ones do not, `landing.css` is linked with the `lp-` rules, this office's form id is inside the embed wrapper, films are YouTube, internal ads links are nested, the four tags are in the head, `seo-head.js` carries the route as noindex |

Also pushed: `src/scripts/site.js` (the new bundle) and `src/scripts/seo-head.js`
(`gen-seo-head.mjs` regenerated with the nested routes; it had a syntax error from a
backtick in a comment since 2026-08-27, fixed). `render-draft-page.mjs` now writes a nested
slug into a subdirectory.

Order run, on staging first and then production: media → converter → pages → site.js →
seo-head → tags → publish → `verify-ads-live.mjs`.

### Production publish

`publishedPages: 56` (38 + 18). Before it, `publish/status` said `draftMatchesPublished:
false`: the draft also carried the Termly→GHL consent bridge script (added 2026-09-16, never
published) and a home-page row write from 2026-09-14. Both shipped; the home page's text is
byte-for-byte what it was (see Gotchas for the detour).

## Verified

| Gate | Result |
| :-- | :-- |
| `site-test.mjs`, all 55 local pages | **927/938**; the 3 pre-existing failures on `index` and `our-facility`, plus 8 on the couple's film thumbnail, fixed by `hqdefault` and rebuilt |
| `fluid-qa.mjs`, the 18 at 360/390/768/991/1280/1440/1920 | Alexandria nine **135/135**; Tysons five **75/75**; Tysons four **60/60** |
| `css-vocab.mjs` | 10 problems, all pre-existing, none naming `landing` |
| `check-page-lists.mjs` | all three page lists agree, 55 pages |
| per-page image repeats (bytes, logo excluded) | 0 on all 18 |
| `verify-ads-live.mjs https://staging.drnahlah.com` | 18/18 pages; only the four tags fail there (staging's Embed Origins is 1.4.0, no `siteScripts`) |
| `verify-ads-live.mjs https://www.drnahlah.com` | **all eighteen pages verified**, twice (after each publish) |
| home page after publish | text identical to the pre-publish live capture (0 diff lines), one `.cta-offices` block, two panels |
| visual, published staging implants page at 1440 and 390 | eyeballed strip by strip; one swap (below) |
| editorial pages after publish | `/veneers` `/dental-implants` `/contact-alexandria` `/posts` `/smile-gallery` all 200 |

The one swap from the visual pass: the implants journey slider had `case-1-dental-implants`,
whose before photograph is a patient in braces. It is now `case-veneers-implants-1`
(high-resolution, unmistakably an implant case) and the gallery slot it vacated is
`case-ao4-single-2`; `case-1-dental-implants` is off the page.

## Next

1. Brandklout review of the live set; screenshots of the published Alexandria implants page
   are in the session scratchpad only, take fresh ones with `fullshot.mjs` if needed.
2. LeadConnector: each of the six forms redirects to `/ads-landing-pages/<office>-<campaign>-thank-you`.
3. Google Ads: one conversion per thank-you URL.
4. A filmed veneer patient and a photograph of the Alexandria office, from the client.

## Gotchas

- **A nested slug survives a site-document write and is flattened by a row PATCH.**
  `ads-landing-pages/<name>` served at the nested URL for a probe page; the eighteen real
  pages, which got a `PATCH /data/rows/:id` for their SEO cells after the page write, served
  at `/ads-landing-pages-<name>` (and 404 nested). The patch re-derives the routable slug
  through `slugFromTitle`. Re-saving through site-document restores the nested route.
  `push-ads-pages.mjs` re-saves each page after its patch; the older memory note that "slash
  slugs always flatten" was this mechanism seen from one side.
- **`render-draft-page.mjs` drops shared components.** The home page's two office panels
  have been a `base.visual-component-ref` since 2026-09-14. The preview showed them missing,
  a text diff against the live page agreed, and a "restore" from the design package went into
  the draft and published them twice. Reverted from the row backup within minutes
  (`.tmp/backups/index-draft-2026-09-18-before-offices.json`), republished, verified identical
  to the original capture. Count the component refs before believing a preview.
- **`--only` on `push-ads-pages.mjs` narrowed the stylesheet scope to the pages it pushed.**
  Fixed to merge with the existing scope, then a full 18-page run on both hosts restored it.
- **Two browser gates at once starve each other, and a background `fluid-qa` sat idle for 20
  minutes with 1 s of CPU.** Run it in the foreground, nine pages at a time at most.
- **Killing by command-line pattern also kills the Bash tool's own shell** if the pattern
  matches the wrapper (`bash.exe -c "... fluid-qa ..."`). Match on the process name too.
- **Node fetch scripts still die on a pipe**: every REST script here is run with `> file`.
- **`gen-seo-head.mjs` had a backtick inside a comment inside its template literal**, a
  syntax error since 2026-08-27; nobody had regenerated the head script since.
- **Staging's Embed Origins plugin has no `siteScripts`** (1.4.0); the tag install is
  production-only until staging's plugin is upgraded.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
