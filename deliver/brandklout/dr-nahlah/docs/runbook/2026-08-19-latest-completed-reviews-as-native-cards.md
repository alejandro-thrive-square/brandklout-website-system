## Latest completed: reviews as native cards (2026-08-19)

Commits **ecca2cb** and **05e686d**. Triggered by "the iframe for the reviews is not working
properly". It was not working on Instatic, and it never can.

### Why the embed is impossible there, not merely broken
Instatic builds a per-page CSP `<meta>` from MODULE CONTRIBUTIONS. `frame-src` is lifted only by
`base.video` when it renders a YouTube embed (`src/modules/base/video/index.ts`); a page with no
YouTube node keeps `frame-src 'none'`. There is no env var, no allowlist, nothing on Railway to
change. `default-src 'self'` also blocks a cross-origin fetch from our own JS, so on that platform
the reviews have to be static content.

**"Can we just add the script?"** Yes, and it changes nothing. `review-widget.js` is 1,974 bytes
and is only a postMessage height-resizer. Every review lives inside the frame.

### What shipped instead
`site-src/gen-reviews.mjs` fetches the practice's own ReputationHub widget PAGE (server-rendered
with schema.org microdata) and writes six real reviews, author + rating + date + full text, into
`home.body.html` between the `REVIEWS:BEGIN/END` markers. Native `.rv-card`s, light-themed for the
now cream Chapter 07. Same markup on every platform, and the reviews finally count for this domain
rather than for reputationhub.site. Re-run the generator to refresh; never hand-edit the cards.

- **The headline score is NOT computed from that feed.** It serves only the most recent handful,
  carries no aggregateRating, and they were all 5s: averaging printed **5.0** over the **4.9** the
  client corrected on 2026-08-10. A sample is not an average.
- **No Review/AggregateRating JSON-LD.** Self-serving review markup is not eligible for rich
  results and risks a manual action.

### THE BIG ONE: this platform reports write failures as PROSE with a 200
One `site.css` push failed three different ways, none of which raised anything:
1. an **82KB `oldText` was silently dropped**, so the fill appended a SECOND copy of the stylesheet
   (163,878 chars, one banner, one sentinel, every rule twice). The same call worked at 81KB that
   morning, so the threshold moves;
2. once doubled, every clearing slice matched twice and came back
   *"Replacement is ambiguous: 2 matches. Use a larger oldText span or set replaceAll:true."*;
3. the bridge dropped a response mid-clear (*"AI chat stream ended before tool result arrived"*).

`callJson` returned all three as `{ text }`, which reads as success. **`callWrite` in
`instatic-mcp.mjs` now throws on any non-JSON response from a write tool** and is used across
push-page / push-all / push-site-css / push-site-js / restore-img-attrs / retire-scripts /
fix-video-poster / upload-one. The reset clears in 4KB slices with `replaceAll`, verifies the file
reads back as exactly banner+sentinel before filling, and the dropped-stream case is retried, which
is safe because `expectedHash` catches a write that actually landed.

### Gotchas
- **A page re-push wipes every node-level `htmlAttributes` patch on that page.** Re-pushing `index`
  for the reviews reset all 25 image alts and the hero poster. The order is: push the page, THEN
  `restore-img-attrs.mjs <slug>` and `fix-video-poster.mjs`.
- **`push-page.mjs` does not verify; `push-all.mjs` does.** Do not trust a lone page push.
- **The simulator goes stale.** `build-sim.mjs` served a `site.css` copied before the review CSS
  existed, and the wall rendered as unformatted text, which looked exactly like a CSS bug on
  Instatic and was not one. It now recopies site.css and site.js on every run, and `sim-check`
  asserts the cards are actually painted white rather than merely present.
- The Site editor bridge disconnects mid-session (`siteConnected:false`); `site_list_documents`
  keeps working headlessly while `site_read_document` and `site_render_snapshot` do not. Several
  canvas-snapshot attempts died that way; the simulator is the more reliable check regardless.

### Gates
`css-vocab` 239 | `site-test` **484/484** | `interaction-test-gsap` **64/64** | `swap-proof` **6/6**
| `fluid-qa` **390/390** | `image-substance` OK | em dashes **0** | `sim-check` **28/28**

Home-page parity against the pulled Instatic document is down to 10 differences, all three known
categories (7 empty spans rebuilt at runtime, 2 video ids resolved by class, 1 avif to jpg).
