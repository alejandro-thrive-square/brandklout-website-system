# 2026-09-10 — The second elevation: services, blog index, articles, and Dr. Sung's portrait

**Instance:** `https://staging.masonparkdental.com`. Production untouched.
**Commit:** _(filled in below under Done)_

Client, this morning: *"Elevate the design on the services pages, the blog
overview page and articles pages, improve it locally then to Instatic. There
are some layouts that look messy. Look for a Dr. William photo with higher
resolution. The rest of the improvements analyze it yourself. If you need to
add images use stock photos related to the content."*

## Done

**The messy layouts, named.** Rendered the crowns, sealants, Invisalign,
sedation and emergency pages, the blog index and one article at 1440 and 390
before touching anything. Four things were actually wrong, and all four are
CSS at the end of `site.css` (the `sv-`/`bl-` block; the whole story is in the
README under "The second elevation"):

1. **`svc-grid` rows were ragged.** Photo cards and text cards each took their
   own height, so the qualify 4-up read as four boxes at four heights with
   holes under the short ones, and the stagger doubled it. Rows are equal now,
   and a card with no photograph is a tonal plate — sand, the numeral large,
   copy at the foot — so photo and plate alternate as one mosaic. `:has()`,
   so no page markup changed for this.
2. **The ledger clipped its own label** ("Porcelain-fused-to-metal") inside
   the overlap panel. Labels wrap; a ledger in a panel is two columns.
3. **The provider band was built to hide a 230×300 thumbnail.** See below.
4. **The blog was a WordPress grid and the article a lonely 72ch column.**
   The index now opens on a topic strip (counted numbers, the practice's own
   photographs, each tile a filter for the grid), features the newest article
   as a sand plate across the first row, turns every ninth card ink, and
   numbers every card with a CSS counter. The article has a sticky rail —
   contents built from the headings, topic, date, reading time, the booking
   button, one photograph — beside 66ch of prose with a lede and a drop cap;
   related articles are the index's cards.

**Dr. Sung's portrait, found.** Nothing larger than 230×300 exists on either
of the practice's domains or in Wayback. His other practice, Grand Mission
Dentistry (`grandmissiondentistry.com`), publishes a 3703×4000 studio
portrait. Cropped 3:4 at the four widths as `mp-dr-sung-*.jpg`, registered in
`album-manifest.json` as `dr-sung`, and on all 29 provider bands at 24rem on
an offset plate, in colour. **The 459×600 file on that site named
"DrWilliamSung (1)" is a different person.**

**Thirty stock photographs, one per treatment.** With the client's leave,
every Treatment overlap now shows the treatment — a crown on a model, an
aligner being seated, an extracted tooth, a night guard — instead of a
generic frame of the practice. Unsplash, registered as `stock-*` in the
manifest with photo ids. `stock-search.mjs` (new) reads Unsplash through the
installed Chrome; `apply-stock.mjs` (new) holds the page→frame map and swaps
the overlap image and the portrait on every services page, idempotently.

**Gates before the push:** `check.mjs` 223/0, `prune-nav.mjs --check` every
link resolves, `link-chips.mjs` 32/32, `probe-hooks.mjs` on `/blog` all four
counters count and the console is clean, `probe-heights.mjs --diff base`
**homepage unchanged at all four widths**, Invisalign moved (section 5, the
why grid, +250px at 1440 — the plates), baseline re-saved.

**The push.** Backup first (`backup-staging…2026-09-10T05-44-16.json`), then
the order in the 2026-09-10 404 run, twice: once for the 55 pages, once for
the two blog templates (`ship-payload.mjs --dir pages-templates`, then
`cp converted-pages.json converted-templates.json` because `fetch-nodes.mjs`
always writes the former, then `apply-image-alt`/`apply-body-class` with
`--converted converted-templates.json --dir pages-templates`, then
`apply-blog-markers.mjs`, then `import-pages.mjs --pages
converted-templates.json --overwrite`, then `import-styles.mjs --pages
converted-templates.json`). Then `apply-blog-template`, `apply-404-template`,
`import-scripts.mjs --publish` (elevate.js changed, so the bundle had to go
again). 355 media on the instance, 124 new.

## Gotchas

**`fetch-nodes.mjs` always writes `converted-pages.json`.** The templates
cycle overwrites the pages' converted set. Copy it to
`converted-templates.json` straight after the templates fetch, and run
`import-styles.mjs` for the pages BEFORE the templates cycle (its default
input is the file that just got replaced). Registration is additive, so the
second `import-styles --pages converted-templates.json` only adds.

**Unsplash is not curl-able and the Chrome extension will not return its
JSON.** curl answers 401; the extension refuses the `/napi/search` fetch as
"cookie/query string data". Headless Chrome through playwright-core reads the
search page fine, and the image files download keyless from
`images.unsplash.com/<id>?w=1800`. Pick from a contact sheet, never from the
alt text — Unsplash's alts are machine guesses ("a pile of chocolate" is a
row of crowns).

**`build-blog-templates.mjs` finds the body by its exact class string.** The
article body is now `lf-body text-rich-text bl-art_body`; change one and the
other or the template build throws. The rail's topic and date `<dd>`s are
tokenised there too, or every article on Instatic shows the sample's.

**The featured card is `:first-child` of the loop's `<ul>`.** On Instatic the
"Load more" button is appended INSIDE the same `<ul>`, so it is never first
and the CSS counter (`.bl-card` only) ignores it. If the runtime ever wraps
each item, the plate and the ink rhythm both stop; check the live DOM before
blaming the CSS.

**A full-page capture still lies about `data-el="mask"` frames.** The new
absolute-image media wrapper shows as a sand box with a white band above it in
`shot.mjs` output — that is the reveal mid-transition with the image not yet
loaded, not a layout fault. Verified in a real window on staging.

## Next

- **Client review of the new services/blog/article design on staging.** The
  tonal plates, the topic strip and the article rail are all new shapes.
- **The three other doctors' portraits** are still the old small files; only
  Dr. Sung's was asked for.
- Everything from the 2026-09-10 404 run's list still stands: Privacy/Cookie
  policies, a form backend, the Amazon tag, the toothpaste chart, the Instatic
  per-page meta report, then promote staging.
