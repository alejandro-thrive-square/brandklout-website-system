# 2026-09-30 — Elfsight Google Reviews on the homepage, published seq 25

**Commit:** see the client `RUNBOOK.md` row (this file is committed with it).
Brief: [`docs/tasks/2026-09-30-google-reviews-widget.md`](../tasks/2026-09-30-google-reviews-widget.md).

Backed up first at **seq 24**: API snapshot `21-instatic-upload/.tmp/backup-2026-09-30-pre-reviews/`
(shell, 86 page rows, 86 published HTML files). Compared with `after-ads-2026-09-30/` before the
write: identical, so nobody had edited in the admin since the ads push.

## Done

- **Widget:** Elfsight Google Reviews "West LA Implants", app
  `670ca31c-8602-42c1-a126-f46f653fe07f`, on the shared Elfsight account (registry:
  `deliver/process/tools/elfsight-reviews/review-widgets.json` on main). Source: the practice's
  own listing, 12301 Wilshire Blvd #205, 4.9 from 209 reviews. Not created, edited or deleted here.
- **Where:** the site shows reviews in one place, the homepage proof chapter (`#proof`, "Our
  patients tell it best."). The three static `.pf-quote` cards (Peter Chang, Mike Hascats, Annie
  Gigliotti) are replaced by **one Embed block** (`brandklout.embed-origins.embed`, snippet mode,
  class `.pf-embed`) inside the same `.wrap.pf-grid`. The kicker, the heading, the review marquee
  and the three "Read our Google reviews / Yelp / Patient video library" links stay. Nothing else
  on the site is a review section: the `b-proof` block on 15 interior pages is a before/after case
  with the patient's own film quote, `/results` carries the three film stories, and the doctor and
  practice pages quote one review inside their copy. All untouched.
- **Production only** (`west-la-implants-production.up.railway.app`, the only instance): written
  incrementally at seq 24, saved as **seq 25**, published, 86 pages. One `PUT site-document`
  carried three things: the `index` page, a new `.pf-embed` class rule
  (`grid-column:1/-1; display:block; width:100%; min-height:420px`), and `src/scripts/site.js`
  (the site bundle after the GSAP head, replaced by the rebuilt `dist/assets/site.js`; the live
  bundle had been byte-identical to the build, so the only difference is the guard below).
- **Source of truth updated to match** (`04-design/.tmp/site-src/`): `index.html` carries a
  `<div class="pf-embed" data-embed="google-reviews">` slot where the cards were;
  `css/30-chapters.css` declares `.pf-embed`; `sections/chapters.js` tweens `.pf-quote` only when
  there are any (an empty GSAP target list logs "GSAP target not found", and the console gate
  counts a warning as a failure). Rebuilt with `node build.mjs --strict`.
- **Script:** `workflows/21-instatic-upload/add-elfsight-reviews.mjs` (dry run by default;
  `--apply`, `--publish`). Re-runnable: it swaps the three cards or the build's slot for the
  block, refreshes the snippet on an existing block, and re-syncs the rule and site.js only when
  they differ from the build.
- **Verified on a fresh load in real Chrome** (puppeteer-core driving the installed Chrome at 1440,
  `?fresh=` cache-buster): the block is **718 px** tall, the widget shows "Google Reviews 4.9
  (209)" and the carousel of live reviews (Justin Ellsworth, Deiton Baughman, Oscar Quintanilla,
  James Ruano…), `platform.js`, the boot call and both `service-reviews-ultimate` data calls answer
  200, zero console errors or warnings, no `.pf-quote` left, the marquee intact. The homepage live
  gate (`08-qa/.tmp/check-local.mjs index --base=…`) is green at 1440 and 390: 8 chapters, 4/3
  pins, smoother, SEO injected, console clean.
- Live state after the publish: `21-instatic-upload/.tmp/after-reviews-2026-09-30/` (seq 25).

## Next

- **Design:** the widget arrives with Elfsight's defaults: its own "What Our Customers Say" title
  in dark grey (near-invisible on the ink ground, under our own heading), white Google-style cards
  and its own font. If the reviewer asks, turn the widget's header title off and set the theme in
  Elfsight's editor (Header / Theme); that is a widget edit, which this task forbade.
- The ads landing pages carry no widget (no review section by design; still not ready for
  traffic, see the client runbook).
- After **any** `push-site.mjs` run: `node add-elfsight-reviews.mjs --apply --publish` (gotcha
  below).

## Gotchas

- **A re-import drops the block.** `push-site.mjs` rebuilds every page from `dist/`, and
  `dist/index.html` carries only the plain `.pf-embed` slot: `importHtml` has no Embed module and
  strips a raw `<script>`. After any push the chapter shows an empty 420 px slot until
  `add-elfsight-reviews.mjs --apply --publish` runs again. The Execution Steps in
  `21-instatic-upload.md` now end with it.
- **Keep `.pf-grid`.** `sections/chapters.js` uses it as the ScrollTrigger anchor for the cards'
  reveal; the block sits inside it and spans the grid with `grid-column:1/-1`. Removing the
  container (or the marquee: `row.querySelector` on `.pf-row`) breaks the chapter's runtime.
- **`data-elfsight-app-lazy` stays out** of the snippet: with it the widget loads `platform.js`
  and never boots on Instatic (0 px, no error). Known since Mason Park Kids 2026-09-29.
- **Claude in Chrome froze on this homepage, twice.** Two extension tabs loaded the page (title
  and URL went blank, then `Runtime.evaluate` and `captureScreenshot` timed out at 30–45 s, the
  renderer unresponsive). A third tab loaded fine but froze the moment the CDP touched it. The
  same page under puppeteer-core with the same Chrome binary loaded, scrolled and measured in
  seconds, so it is the extension's debugger on this GSAP/ScrollSmoother page, not the site.
  Verify this site with `check-local.mjs --base=` or a puppeteer script, not the extension.
- The instance runs embed-origins **1.6.0** (main ships 1.8.0). Snippet mode and the compatible
  CSP are in 1.6.0; the 1.8.0 page-scoping of `siteScripts` is not. Upgrading is scenario 4, not
  this task.

## Version Control

Tracked with the client runbook on `bk-west-la-implants`; see the repository's SYSTEM_RULES.md §4.
