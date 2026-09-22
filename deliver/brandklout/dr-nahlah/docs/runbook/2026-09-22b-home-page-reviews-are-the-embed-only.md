# 2026-09-22b — Home page reviews: the card wall removed, the embed is the only reviews. LIVE

Client: "it seems like you restored the review wall and we should only have the review embed."

They were right that the home page was showing both, and right to call it a restore — but the
restore was not the cause, and the fix is not a revert of it. Scope confirmed with the client
before anything changed: **home page only**, and **embed only**, knowing what it gives up.

## What was wrong

The published home page's chapter 07 carried, in this order:

```
rv-head    "What patients say afterwards" / 4.9 ★★★★★
rv-wall    6 × .rv-card          <- generated Google reviews
<Embed>    ReputationHub iframe  <- the live widget, working
rv-more    "Read the patient stories"
```

The same reviews twice, one above the other.

## Why both were on the page, because it decided what to remove

`site-src/sections/ch-proof.js` was written to ship cards as the content and **upgrade** to the
vendor's live widget where a third-party frame is allowed, hiding the wall
(`wall.hidden = true`) once the widget reports its height. Two independent things broke that
on the platform:

1. The page was imported into Instatic **while `hidden` was set**, so the importer baked
   `display:none` into the `.rv-wall` style rules. The cards were invisible from the import
   until 2026-09-21, when `fix-rv-wall-display.mjs` put `display:grid` back for the veneers
   pages. **That is when the wall appeared on the home page for the first time** — hence "you
   restored the review wall". The wall had been in the document all along.
2. The live frame on the published page is **not** the one `ch-proof.js` builds. Its
   `.rv-live` slot is not in the published document at all; the frame is a separate
   `brandklout.embed-origins.embed` node. So the upgrade code returns early at
   `if (!slot) return` and the hide was never going to run.

So the duplication was structural, not a bad restore, and reverting
`fix-rv-wall-display.mjs` would have been the wrong fix — see the first gotcha.

## Done

Commit: see below.

- **`22-instatic-api-sync/drop-home-review-wall.mjs`** (new) — removes the `.rv-wall` subtree
  (61 nodes) from the home page document and nothing else. Seven guards run against the
  post-removal document before it will write, and nine checks on the read-back.
  Applied: **737 -> 676 nodes**, section children now `rv-head, embed, rv-more`.
- SEO cells re-applied afterwards (`push-page-seo-cells.mjs --only index --apply`) — a page
  write replaces the row's cells and cannot carry `seoTitle`/`seoDescription` through.
- **Published.** Verified live: 0 `.rv-card`, no `.rv-wall`, ReputationHub iframe present.
- Mirrored in the source so the next build cannot bring it back:
  - `site-src/gen-reviews.mjs` no longer emits a wall; it still fetches and caches
    `reviews.json` (which `gen-blog.mjs` reads). Its header rationale — "an iframe cannot work
    on Instatic and never will" — was stale and is now marked as such.
  - `site-src/pages/home.body.html` regenerated; `sections/ch-proof.js` comments corrected.
  - Rebuilt: 56/56 pages, `final-site/index.html` has 0 `rv-card`.
- **`22-instatic-api-sync/check-review-embed.mjs`** (new) — the embed is now the only reviews
  on that page, so it needs its own gate. Reads the vendor payload AND the rendered frame.
  Current: **8 reviews in the payload, frame 575px, section 816px.** Not a hole.

## Gotchas

- **Do NOT revert `fix-rv-wall-display.mjs`.** It is tempting — it is what made the wall
  visible — but `.rv-wall{display:grid}` is a site-wide style rule and the two veneers
  consultation landing pages still use it for their four veneer-specific reviews (added
  2026-09-21 when the client dropped the filmed patient). Reverting the rule blanks those
  again. **Remove nodes from one page; never the rule.**
- **The veneers walls stay, by decision.** An embed cannot filter to veneer treatment, so those
  four on-topic reviews cannot be replaced by the widget's eight generic ones.
  `gen-reviews-topic.mjs` still builds them.
- **`restore-review-wall.mjs` looks for the OLD plugin id.** It searches for
  `webzite.embed-origins.embed`; the node is `brandklout.embed-origins.embed` since
  `migrate-plugin-ids.mjs`. So its "put the embed last" step silently does nothing. If that
  script is ever run again it will re-add the wall — it is now the wrong tool for this page.
- **What this gives up, knowingly:** ~356 words of review text that counted for this domain
  (inside the frame they count for `reputationhub.site`), and the copy a visitor sees with
  JavaScript off or when the widget fails. `ch-proof.js` removes the slot after an 8s timeout,
  so the section can now be a heading and a link. It could not be empty before.
- **The widget was serving zero reviews on 2026-09-21** and collapsed to ~91px; the note in
  `restore-review-wall.mjs` says so. It is serving 8 today. That is exactly why
  `check-review-embed.mjs` exists — run it before assuming the section is fine.
- **A publish bakes all 57 pages.** Checked first that `index` was the only row dirty since the
  15:16Z publish, so this shipped nothing else. Another session was working the cookie consent
  on `main` at the time; its work was already live.

## What is next

1. Watch that the ReputationHub widget keeps returning reviews. `check-review-embed.mjs` is
   the one-command check; if the vendor account loses its review source again, the home page
   review section goes empty with no fallback.
2. Nothing else. The two veneers pages are untouched and still correct.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
