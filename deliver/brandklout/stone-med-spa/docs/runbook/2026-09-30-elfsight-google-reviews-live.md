# 2026-09-30 — The practice's Google reviews, live, on staging AND production

Brief: [`docs/tasks/2026-09-30-google-reviews-widget.md`](../tasks/2026-09-30-google-reviews-widget.md)
(the Google Reviews widget rollout). The site showed two hand-quoted, anonymised Google reviews
in a drag rail on `/` and `/results`; both rails are now the live Elfsight widget for the med
spa's own listing.

## Done (`7ef14428`, this worktree only — not pushed, not merged)

- **Widget:** Elfsight Google Reviews `73fff4ec-b68f-4c97-af8a-7b022584e166` on the shared agency
  account, registered in `deliver/process/tools/elfsight-reviews/review-widgets.json`. Source:
  **Westlake Medical Aesthetics, 72 Andorra Dr #110B** (5.0 from 15). Carousel, light theme,
  transparent ground, its own "What Our Customers Say" title. Not created, edited or deleted here.
- **Where it went, and what it replaced**
  - `/` `.words_section` (the dark chapter): the `.words_rail` of two quotes + "Read more reviews"
    card is gone, and so are its arrows (the widget has its own). The `.words_rail-head` keeps
    "In their words" and now carries a `Results & reviews →` link where the arrows were. The
    widget sits in a new **`.words_reviews`** slot — a white panel at the card radius, because the
    widget's dark title text is unreadable on charcoal and the widget's own theme is not ours to
    change. `data-drag-scope` dropped from the section.
  - `/results` `.wall_component`: the `.wall_rail` of two quotes + two portraits + "Read every
    review on Google" is gone with its arrows; the `.wall_head` keeps eyebrow + heading and carries
    a `Google reviews →` link to the listing. Widget in **`.wall_reviews`**, a white hairlined panel
    (the widget's grey cards sink into the ivory page otherwise).
  - No heading claimed a count, so no copy changed.
- **Source of truth, so a re-push keeps it.** `site-src/elfsight-reviews.mjs` holds the snippet
  (Elfsight's paste **minus `data-elfsight-app-lazy`**, which never boots on Instatic).
  `home.body.html` / `results.body.html` carry `<div class="… " data-embed="google-reviews">
  {{GOOGLE_REVIEWS}}</div>`; `build-site.mjs` inlines the snippet; `push-site.mjs` has a second
  `EMBEDS` key, `google-reviews`, so a full re-push turns the slot into the Embed block the same
  way `/book` gets its form. 55-words.css / 65-proof.css: the rail, arrow and `.quote_card` rules
  are gone, the two slot rules and a phone stack for `.words_rail-head` are in.
- **The live write:** new **`05-instatic-upload/add-elfsight-reviews.mjs`** (dry run by default;
  `--apply --publish`; `INSTATIC_BASE_URL` picks the instance). One incremental site-document save
  with `baseSeqs`: two class rules on the shell, the two pages restructured to the exact tree the
  source now describes, then `/results`'s `seoTitle`/`seoDescription` PATCHed back (the save drops
  them), a read-back, then publish. Re-runnable: an existing slot is left alone, a stale snippet is
  refreshed. Backs up `site.json` + `pages.json` first.
- **Staging** `https://staging.westlaketxmedspa.com`: seq 20 → 21 (widget) → 22 (head stack),
  `{"publishedPages":26}` each time.
- **Production** `https://westlaketxmedspa.com`: seq 24 → 25 (widget) → 26 (head stack),
  `{"publishedPages":26}`. Termly (4 tags), Sienna (2) and the GHL pool (`number_pool` +
  `user_session`) still on the home page afterwards.

## Verified

- **Headless Chrome (puppeteer-core, the workstation's own Chrome), fresh loads, both instances:**
  `/` and `/results` render the widget at **442px**; the shadow-root text reads "5.0 (15)",
  "Review us on Google", Miles McClure, MK Sabharwal, Rorie Good, Anniina Sankoh — the med spa's
  reviews, not Stone Surgical Arts'. `/about` has no widget and still serves the strict CSP
  (`script-src 'self' …`); the two widget pages serve the plugin's compatible policy.
  Screenshots at 1440 and 390 of both chapters, both instances, looked right (the phone head
  stacked after seq 22/26).
- **Real Chrome (the Claude in Chrome tab), fresh loads:** staging `/` at 441px; production
  `/results` at 441px with "(15)" and the same names. Each page took a minute or two to become
  responsive to the extension — see gotchas — but rendered.
- **Local gates:** `build-site` clean; `audit` no failures (the unreferenced `staff-*`/`tex-*`
  assets are the hidden filmstrip and stone textures, pre-existing); `drag-test` 1/1 (only
  `/about`'s room rail drags now); `all-pages` 26 × 5 widths, 520 assertions clean once
  `phosphor.utils.elfsightcdn.com` (Elfsight's proxy for the reviewers' Google photos) joined the
  gate's embed hosts — the first run failed `/results` at every width on that host alone, and
  passed `/` only because its photos had not arrived inside the grace window.

## Gotchas

1. **Production's validator rejects a node without `children: []`; staging's does not.** The first
   production write 400'd: `pages[0].nodes.<id>.children: Expected array` on one of the new link's
   text nodes. The identical payload had saved on staging (which then normalised the field — its
   read-back showed `children: []`). Every node you create by hand gets `children: []`, text nodes
   included; the script now does, and its re-run path repairs any it finds.
2. **The script's backup folder was per day, not per seq, and the second run overwrote the
   first.** `backup-{prod,staging}-2026-09-30-pre-reviews` now hold the state AFTER the widget
   (prod seq 25, staging seq 21), renamed `…-seq25-post-widget` / `…-seq21-post-widget`. The true
   pre-widget snapshots (prod seq 24, staging seq 20) are gone; the nearest earlier ones are
   `backup-prod-2026-09-29-pre-utilities` (seq 23 — one push earlier, differing only in the
   pickable-utility rules) and `backup-staging-2026-09-29-utilities`. The folder name now carries
   the seq and the script refuses to overwrite one.
3. **The Claude in Chrome tab freezes for a minute or two on these pages** (GSAP smoother; memory
   "Chrome extension freezes on GSAP smoother pages"): `Runtime.evaluate` timed out at 45s, the
   Elfsight app bundle showed as `pending` while `curl` fetched it in 1s, `readyState` sat at
   `interactive`. It does finish. Verify with `.tmp/elfsight-live-check.mjs` (puppeteer-core, same
   Chrome) and treat the extension as a second opinion, not the gate.
4. **The widget renders in a shadow root.** `innerText` is empty while it visibly shows reviews;
   read `shadowRoot.textContent` recursively (the check script does). The first pass reported
   "164px, no text" — the header before the reviews arrived — so wait for text with a digit and
   a height over 300px, not merely > 0.
5. **Git Bash turns `/results` into `C:/Program Files/Git/results`** on the way into Node. Any
   script taking paths as arguments runs with `MSYS_NO_PATHCONV=1`.
6. **What the widget shows is Google's, in full:** reviewer names, photos, and the owner's and
   family members' own five-star reviews that the 2026-09-15 hand-pick deliberately left out.
   Hiding those is a filter in the Elfsight editor (not touched in this run — the brief forbids
   widget edits), not a site change. The 2026-09-15 rule "no reviewer names until the client says
   so" no longer holds on these two pages.
7. "Panel only seen by widget owner" shows above the widget in any browser logged in to Elfsight.
   Visitors do not see it.
8. **A re-import no longer drops the Embed** the way it did on Mason Park: the local source carries
   the slot and `push-site.mjs` knows the key. If a page is ever rebuilt from markup that lacks
   the slot, `add-elfsight-reviews.mjs --apply --publish` puts it back.

## Next

1. The client sees it. If they want the widget's own title off, its colours matched or the
   owner/family reviews filtered, that is inside Elfsight's editor (Header / Theme / Filters) —
   the registry decides who does that.
2. The main-repo rollout session should mark this widget `live-on-site` for `stone-med-spa` in
   `review-widgets.json` (both hosts).
3. The old `.words_rail`, `.quote_card`, `.wall_rail`, `.words_arrows`, `.wall_arrows` class rules
   are still in both drafts' registries (publish tree-shaking drops them from the live CSS). The
   next full `push-site` from source removes them.

## Version Control

Tracked runbook, per [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md). Committed with the
work it describes; not pushed, not merged (per the brief).
