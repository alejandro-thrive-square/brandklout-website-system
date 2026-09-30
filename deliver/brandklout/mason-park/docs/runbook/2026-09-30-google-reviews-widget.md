# 2026-09-30 — The practice's Google reviews widget where the static reviews were, both instances

Task brief: [`docs/tasks/2026-09-30-google-reviews-widget.md`](../tasks/2026-09-30-google-reviews-widget.md)
(the Google Reviews widget rollout, one worktree per client).

## Done

- **The widget is the practice's own**, Elfsight All-in-One Reviews `32926aff-7df5-4c6d-8f35-d4d3f5f46b4b`,
  from the old site, in the OTHER Elfsight account (not Trong's), on the adult listing (Mason Park Dental
  of Katy, 21830 Kingsland Blvd **#104A**). Nothing was created or edited in Elfsight. Registry row:
  `deliver/process/tools/elfsight-reviews/review-widgets.json` (`mason-park`, main repo).
- **Where it went** (the two places the site presents the practice's reviews as a body):
  - `/` `#proof` (The Proof): the `.el-deck` of six sticky cards (five quotes and a photo) is now the
    widget, in the same `.wrap`, as `.rv-embed`. The chapter heading stays. In `.el-deck_foot` the
    fixed "4.9 / Across 1,037 Google reviews" pair is gone (the widget shows the live rating and count);
    "Read more reviews" stays. `.pr-note` "…shown whole." became "…live from its profile."
  - `/patient-reviews` `#wall` (The Wall): the `.cp-wall` of 15 reviews and 6 photos is now the widget.
    Heading "The rest of them, whole." stays; the lede became "Live from the practice's Google profile,
    in each patient's own words." In `#number`, "…taken from the practice's Google profile and shown
    whole." became "…from the practice's Google profile."
  - The lead quote, portrait and four chips in `/patient-reviews` `#proof` stay: hand-picked, verbatim.
- **Left static, on purpose:** the 33 service/offer/technology pages' proof chapters (a lead quote and
  three topic-matched chips each) and the four ad landing pages' rails. The chips are chosen to match
  the page's treatment, and a live feed could put Dr. Sung's name on an ad page (the client's
  standing rule keeps him off them). If the client wants the widget there too, the slot pattern below
  extends to any page.
- **How it is placed:** a `brandklout.embed-origins.embed` node in snippet mode, Elfsight's install
  code **without `data-elfsight-app-lazy`** (`.tmp/elfsight-snippet.mjs`, one source for both paths).
  The plugin (staging 1.5.1, production 1.6.0, `compatible` policy) was already there; no plugin
  setting was touched, and production's `siteScripts` number pool and Termly origins read back intact.
- **Two paths, same result:**
  - `.tmp/add-elfsight-reviews.mjs` edits the live rows (dry run by default; `--apply --publish`).
    Re-runnable: an existing widget only gets its snippet refreshed. It registers the `.rv-embed`
    class rule (empty, like the converter's) so the attribute is emitted.
  - The local source carries the same change: `home/index.html` and `home/patient-reviews/index.html`
    hold `<div class="rv-embed" data-elfsight-reviews="32926aff-…">` where the deck and wall were, and
    `place-ad-embeds.mjs` (already in every push chain) turns that slot into the identical Embed. So a
    chain run (`import-pages.mjs --overwrite`) **keeps** the widget instead of dropping it.
  - `.rv-embed` styling is in `home/assets/site.css` (26rem min-height so the chapter holds while
    platform.js boots; locally the slot is a labelled panel). Pushed with `to-instatic.mjs --media
    instatic-media-map.json` + `import-styles.mjs`. Both live stylesheets were byte-identical to
    HEAD before the push.
- **Order per instance:** `backup-site.mjs` → `import-styles.mjs` → `add-elfsight-reviews.mjs --apply
  --publish`. Staging (seq 143 → 148, published 21:40Z), then production (seq 61 → 73, published 21:46Z).
  Backups: `.tmp/backup-staging.masonparkdental.com-2026-09-30T21-39-22.json`,
  `.tmp/backup-www.masonparkdental.com-2026-09-30T21-46-12.json`.
- **Verified in real Chrome on fresh loads** (`?fresh=` cache-buster, no scroll before the first
  read): the widget renders at 424px inside a 443px `.rv-embed` on all four pages, with the live
  listing (Overall Rating 4.9, 1,080 reviews on staging, 1,084 on production, reviewers Leiana Rose,
  Christian Ramirez, Raven Butler, Celia Kennedy…). On `/patient-reviews` the wall sits 3,300px down
  and had booted to 304px before any scroll, 424px in view. No CSP or Elfsight console errors.
  Staging screenshot: `%TEMP%\claude-chrome-screenshots-n6JV1A\screenshot-1790804770469-0.jpg` (not committed).
- Local gate: `doctor-names.py --check` passes (0 short forms). New copy names no doctor.

## Next

- **The fixed count "1,037 Google reviews" is stale elsewhere**: home hero and "together" chapter,
  the reviews page seal and `#number` counter, About, and the four ad pages (11 places). Google says
  1,084 today. Either make them live (the widget's count) or drop the number; a client decision.
- The reviews page hero lede still says "shown whole and under their own names"; true of the lead
  quote and chips, not of the widget's truncated cards. Worth a word with the reviewer.
- Design: the widget brings Google-grey cards, its own "Overall Rating" header and font, under our
  chapter heading. Matching colours is done in Elfsight's editor (the other account), not here.
- The registry row `onSite` is still `[]`; the main-repo session that owns
  `review-widgets.json` should record `/` and `/patient-reviews` on both instances.

## Gotchas

- **Every push chain re-imports every page** (`import-pages.mjs --overwrite` from local HTML), so an
  API-only placement here lasts until the next chain run. That is why the slot lives in the local
  HTML and `place-ad-embeds.mjs` builds the Embed: the chain reproduces the widget. If a page is ever
  rebuilt from a source without the slot, `add-elfsight-reviews.mjs --apply --publish` puts it back.
  `place-ad-embeds.mjs` now fails the chain if it finds a slot with a different widget id, or not
  exactly two slots when `/` is in the set.
- **`data-elfsight-app-lazy` must stay out** (kids' site 2026-09-29: with it the widget never boots
  on Instatic, 0px, no error). The script's read-back asserts the attribute is absent.
- **The widget renders in a shadow root.** `innerText` on the Elfsight div is empty even when it is
  424px tall with reviews on screen; read `firstElementChild.shadowRoot.textContent`. A gate that
  greps text will call a working widget dead.
- **Claude in Chrome's screenshots time out on these pages** (GSAP, 30s CDP timeout) and one
  `Runtime.evaluate` with a 7s wait did too. Short JS reads work; the one screenshot that succeeded
  was after the page had settled.
- `import-styles.mjs` reads `converted-pages.json` for class names, which held only the two blog
  templates from the last chain run; it is additive, so that was harmless, but it means the script
  never registers `rv-embed` on its own. `add-elfsight-reviews.mjs` registers it.
- `probe-reviews.mjs` is the read-only inventory of both pages and the plugin on any instance.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
