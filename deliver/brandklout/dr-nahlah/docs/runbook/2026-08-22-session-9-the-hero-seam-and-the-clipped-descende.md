## DONE 2026-08-22 (session 9): the hero seam and the clipped descenders — both LIVE on Instatic

Two defects the user reported from the published site, both fixed in
`04-design/.tmp/site-src/` (the source of truth for this CSS/JS), rebuilt,
pushed to Instatic and published. `encorercm.com` verified after.

### 1. Descenders were clipped in every split-line heading

`js/91-descender-rescue.js` swept for `wz-mask-line-mask`. SplitText names each
mask `<linesClass>-mask`, and this package splits with `linesClass:'wz-line'`
(`js/00-runtime.js`), so the masks are `wz-line-mask`. **The rescue therefore
matched nothing and had never run on a single page built from this package.**

It is not a typo — it is a divergence. The live Webflow build
(`www.drnahlah.com`) splits with `wz-mask-line` and its masks ARE
`wz-mask-line-mask`; verified live, and the rescue works there. The script now
matches **both** vocabularies (`querySelectorAll('.wz-line-mask,.wz-mask-line-mask')`)
so they cannot drift apart again. It also flips to `clip` rather than `hidden`
while a line travels, matching what SplitText itself sets inline.

Measured on the home `<h1>`: ink ran to row 121 clipped, 131 fixed, and 131 with
the masks forced `overflow:visible` (ground truth). Identical to 2 dark pixels.

**Do NOT fix this with padding on the mask.** The masks are block boxes in flow;
padding-bottom spreads the lines apart by that much. Dropping the clip once the
line has landed costs no layout at all.

### 2. The hairline along the bottom of every hero

Real, on every page, and only while ScrollSmoother has the page at a fractional
y. The hero's media composites on its own layer (a `filter` plus the
`[data-drift]` parallax; a `<video>` on the home page), and **a composited
layer's clip rounds outward while the scrim painted over it rounds with the
section's own raster** — so the media reached one device row further down than
the scrim did, and that row rendered as raw, unfiltered, unscrimmed source.

Two rules fix it and BOTH are needed:

1. the media is clipped SHORT of the section's bottom edge (`bottom:4px`), so a
   composited layer never meets the clip the fractional offset lands on. The
   drift scales the photo 1.12, so it overflows its own box — which is why the
   clip has to sit on the wrapper, not on the `<img>`;
2. the scrim is bled 2px past every edge AND must not share a clipping box with
   the media. That is why `.pg-hero .ph-bg::after` became `.pg-hero::after`.

Things that were tried and **do not work**, so nobody repeats them: bleeding the
scrim alone; bleeding the wrapper alone; `overflow:clip` on the section;
`translateZ(0)`/`will-change` on the scrim, the media, or the section; moving
the clip to the wrapper while the scrim stays inside it.

Measured headlessly at seven fractional scroll offsets, median row step 0-255:

| | before | after |
|---|---|---|
| interior hero (`dental-implants`) | 225 | 0.3 |
| home hero (`index`) | 58 | 1.0 |
| live `encorercm.com` after publish | — | 0.2-0.3 |

`.ch-proof .pf-film` already carried this fix and its comment already described
the mechanism — that is the "we solved it on the home page" the user remembered.

### The one thing left half-open: `.mband`

The full-bleed media band (`css/60-media.css`, 7 pages) has the SAME defect —
its `[data-drift]` photo against a `.mband-fig::after` scrim, measured at 62.
**It is deliberately left alone.** The hero fix does not transfer: that scrim is
black, so the 3-4px the photo gives up read as a flat near-ink strip against the
scrimmed photo (a 36-level step, worse than the seam it removes). Ramping the
gradient to solid over the last 10px got it to 20 and still showed. Fixing it
properly means either accepting a designed fade-to-solid at the band's foot or
adding a wrapper element to the markup. Not worth trading one artifact for
another without a decision.

### What was written to Instatic, and how

`seq 47 -> 58`, two publishes, `35/35` pages both times.

- `push-script-asset.mjs src/scripts/site.js ../04-design/.tmp/final-site/assets/site.js --apply`
  — the live asset was **byte-identical to the local build** apart from these
  edits, so the wholesale replace was safe. Check that before using it again.
- `patch-hero-seam.mjs --apply` (new, in `15-instatic-api-sync/`) — the four
  registry rules, by id, refusing to write if a selector is not what it expects,
  and reading back after. It carries the whole explanation in its header.

The runbook's own publish rule was followed and it earned its keep: an
`audit-site.mjs --only index,dental-implants,veneers` run before and after each
publish came back **byte-identical**, so the publish shipped these two fixes and
nothing else.

Those three audit records are committed at their new values, which means the
committed baseline now also absorbs two things that were already live before
this session and were NOT caused by it: the Cloudflare-beacon and Elfsight CSP
entries are gone from `index.json`, and `veneers.json`'s `ogImage` has moved to
`veneers-procedure.png` — **that is the unreviewed `seo-head.js` DRAFT work
flagged in session 7 and it still needs sign-off.**

Volume before publishing: **520 MB / 879 MB (61%)**, ~343 MB free, ~15 MB a
publish. `prune-versions.mjs --keep 3` would free ~172 MB when it is wanted.

### Not touched: the Webflow site

`www.drnahlah.com` (Webflow, 11 pages) is a separate live build. Its descender
rescue works. **Its heroes have not been checked for the seam** and its CSS is
in the Designer, not in this package. Ask before touching it.

### Gates

`site-test.mjs` **603/603**. `interaction-test-gsap.mjs` 62/64 — the two
failures (the reviews vendor fallback, five `practice-space-*.avif`) are
pre-existing and recorded as failures in the committed
`interaction-test-gsap-results.json`.
