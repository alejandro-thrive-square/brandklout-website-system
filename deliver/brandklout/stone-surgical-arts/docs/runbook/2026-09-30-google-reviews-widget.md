# 2026-09-30 — The Google reviews widget placed on STAGING; it is a floating badge, so production waits

Brief: [`docs/tasks/2026-09-30-google-reviews-widget.md`](../tasks/2026-09-30-google-reviews-widget.md)
(the Google Reviews rollout across every client). Widget `c92f78df-0615-4ab9-a204-4f7b385011c9`,
Elfsight Google Reviews, source the practice's own listing (72 Andorra Dr **#110**). It existed
since April 2026 and was embedded on the sister practice's site instead of this one.

## Done

- **Staging carries the widget, published** (`https://staging.dfwsurgicalarts.com`, 54 pages, shell
  seq 5 → 8). Three Embed blocks (`brandklout.embed-origins.embed`, snippet mode, plugin 1.6.0
  `compatible`), one per review section, each with the author class `.reviews_embed`:
  - `/` chapter 07 "The proof": the six-quote carousel (`.proof_slides` + `.proof_controls`) is
    gone; the photograph, the 4.8 rating card and the chapter mark stay. 781 → 734 nodes.
  - `/results` `#reviews`: the filter bar, the eight-card wall and the "Two reviews are shown
    without a name" foot are gone; the heading stays and the lede now reads "Straight from the
    practice's Google listing, as patients wrote them." 284 → 218 nodes.
  - `/team` band 03: the four-quote carousel is gone; photograph, rating and "About the people"
    stay. 277 → 242 nodes.
  - The two carousels lost `tabindex` and `aria-roledescription="carousel"`, which described the
    carousel that is no longer there.
- **The authored pages carry the same change** as an embed MARKER (`data-embed="google-reviews"`),
  and `place-embeds.mjs` has a `google-reviews` row for the three slugs, so the next full re-import
  puts the block back by itself. `css/62-embed.css` has `.reviews_embed` (a 26rem floor while the
  widget boots). Local gates: build, `audit.mjs` and `check-copy.mjs` clean.
- **New script `21-instatic-upload/add-google-reviews.mjs`**: dry run by default, `--apply
  --publish`, re-runnable (refreshes a placed snippet), backs up the whole shell and every row
  first (`.tmp/backup-staging.dfwsurgicalarts.com-2026-09-30T21-38-37-pre-google-reviews.json`).
  It edits the three rows by class name, so it runs unchanged against production.
- **New helper `21-instatic-upload/embed-markers.mjs`** (balanced-tag marker parsing) now used by
  `build-import-input.mjs`, `place-embeds.mjs`, `add-google-reviews.mjs` and `all-pages.mjs`. The
  gate also reads a marker's `data-embed-hosts` and counts an in-page (non-iframe) widget as
  booted.
- **Seven upload scripts re-pointed** at `deliver/process/tools/instatic-api-sync/insta-api.mjs`:
  since system v2 (2026-09-27) the old `process/22-instatic-api-sync/` path no longer exists and
  every one of them failed to import. `git sparse-checkout add deliver/process/tools` once per
  worktree.
- **Verified in real Chrome on fresh loads of staging:** the snippet is published with the widened
  CSP; `platform.js` loads, `/p/boot` answers 200 for the widget, the app bundle (google-reviews
  v3.49.19) loads, and the listing resolves to **4.9 from 282 reviews**. But see the first gotcha:
  it renders as a floating badge, not in the section.

## Next

- **Production is untouched, on purpose.** The widget is configured in Elfsight as a **floating
  card badge** (`layout: cardBadge`, `badgeDisplayMode: singleFloating`, bottom-right,
  `badgeVisibilityOnDevices: desktopOnly`), so the inline mount that the Embed block publishes is
  0px by design and the three review sections on staging show an empty 26rem slot under their
  headings. Promoting that would ship blank sections and a corner badge. What has to happen, and
  is out of this worktree's hands (the brief forbids editing any Elfsight widget): in Elfsight's
  editor, switch widget `c92f78df` from the Card Badge layout to a section layout (Carousel, as on
  Mason Park Kids, or Grid), and clear "desktop only". The same widget is still embedded on
  stonedentalimplantcenter.com's footer as a badge, so that change reaches the sister site too;
  that site has its own widget (`b694d47f`) to move to. Then, with no further write here, reload
  staging, confirm the three sections render the reviews inline, and promote:
  ```bash
  cd workflows/21-instatic-upload
  node add-google-reviews.mjs                    # dry run against production (.env host)
  node add-google-reviews.mjs --apply --publish
  ```
  The dry run must report `.proof_slides + .proof_controls -> Embed` for index and team and
  `[data-filter] wall + .tier_foot -> Embed` for results, then verify in a real browser again.
- Once inline: the widget brings its own header ("title, rating, reviewsNumber", `header2`) and
  Google-grey cards under our chapter mark; the 4.8 rating card beside it says 4.8 while Google
  says 4.9. Match colours and header in Elfsight's editor, and consider the rating card's number.
- Update the registry row `stone-surgical` in `deliver/process/tools/elfsight-reviews/
  review-widgets.json` (main repo, not this branch): `state` and `verified: "4.9 (282)"`.
- Gates at the end of this session: `compare-live.mjs index results team` against staging says
  **no differences**. `all-pages.mjs` on the three built pages passes at 1024 and 1440 and
  **fails at 390 on all three** ("the embedded widget never became visible"): the widget is
  `desktopOnly`, so on a phone it renders nothing at all. That is the widget's setting, not the
  page's, and it clears with the layout change above; do not loosen the gate for it.

## Gotchas

- **A widget that boots and still shows nothing inline may be a badge.** Elfsight's Google Reviews
  has floating layouts; this one is `cardBadge`. Every probe short of reading the boot payload
  said "working": CSP fine, `platform.js` present, `/p/boot` 200, app bundle 200, an
  `.es-embed-root` mounted. The mount stays 0px with 0 descendants, and the badge renders in a
  portal at the very end of `<body>` (`[class*="ElfsightPortalNest"]`, fixed, z-index 9999999).
  Read `settings.layout` from
  `https://core.service.elfsight.com/p/boot/?page=<url>&w=<id>` before touching CSP or the
  snippet. The badge itself sat at opacity 0 in the corner on this page; whether Elfsight's
  entrance animation is defeated by this site's smooth scroll was not chased, since the layout
  is the blocker either way.
- **The lazy regex on embed markers breaks on a snippet with its own `<div>`.** The Elfsight
  snippet is a `<script>` plus a `<div>`; `[\s\S]*?<\/div>` stopped inside it, which would have
  left a stray `</div>` in the import payload (closing the chapter early), published half a
  snippet, and read no hosts in the gate. `embed-markers.mjs` walks the tags instead.
- **The page gate cannot excuse an in-page widget's requests by frame.** `all-pages.mjs` lets a
  vendor's iframe load whatever it likes because those requests belong to the child frame. A
  widget that renders in the page makes its follow-up requests from the main frame, from hosts
  the snippet never names (`core.service.elfsight.com`, `universe-static.elfsightcdn.com`,
  `static.elfsight.com`, Google avatars). The marker now declares them in `data-embed-hosts`, as
  suffixes, and the gate reads that attribute.
- **A long `await` inside a Claude-in-Chrome JS call freezes this site.** `scrollIntoView()` plus a
  5 s wait on the home page hung the renderer until the tab was closed (CDP timed out at 45 s).
  Use the wheel (`computer` scroll) and short JS reads; same as the Mason Park note.
- **The seven upload scripts imported a path that no longer exists** and nobody had run one since
  system v2 landed. `ERR_MODULE_NOT_FOUND` on `process/22-instatic-api-sync/insta-api.mjs` is that,
  not a broken sparse checkout: the helper moved to `deliver/process/tools/instatic-api-sync/`.
- **The widget registry is not on this branch.** `deliver/process/tools/elfsight-reviews/` exists in
  the main checkout only; read it from `C:/Users/ACER/Documents/Webzite Studio/Brandklout Website
  System/deliver/process/tools/elfsight-reviews/review-widgets.json`.

## Version Control

Tracked. Committed with the work it describes as `cbf3bacf` on `bk-stone`; not pushed, not merged.
