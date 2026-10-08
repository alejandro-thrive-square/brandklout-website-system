# 2026-10-08 — Home "Our treatments" shelf: every card open on phones, production

The ask (design feedback on `https://westlaketxmedspa.com/`, `div.shelf_component`): "This layout on
mobile has a little problem in which only one card is tall and the other ones are shrunk. We need all
the cards to reveal the entire content, maybe with an aspect ratio on mobile."

Below 767px the shelf was an accordion: card 1 open at 22rem, the other three 4.5rem strips showing
only an index and a name, and a tap on a strip opened it instead of following the link.

## Done (production published, staging draft only)

- **≤767px, no accordion**: every card is open, `aspect-ratio: 4 / 3`, in a grid
  `repeat(auto-fit, minmax(18rem, 1fr))` (one column on a phone, two at ~600px and wider), the body
  (name + count + treatments) always shown, the vertical name hidden, the index top-left, the photo
  un-zoomed. Tablet (768–991) and desktop keep the accordion, unchanged.
- **Darker scrim on phones only**: the body sits higher in a 4:3 card than it did in the open 22rem
  panel, and the desktop gradient left the name at 1.6–2.2:1 on the photos (the old open card was
  already 2.4:1). Now `0.18 0% / 0.1 20% / 0.66 50% / 0.86 100%`: name ≥ 4.3:1, meta ≥ 5.9:1, worst
  case at 320px.
- **JS**: below 767 the first tap follows the card's link (`stacked.matches`); the old "first tap
  opens" made a tap on an already-open card do nothing.
- New `05-instatic-upload/fix-shelf-mobile.mjs` (dry run / `--apply` / `--publish`, backup, one
  incremental shell save, read-back, publish guard). Nine registry contexts on the
  `media:(max-width: 767px)` key; `.shelf_item.is-open .shelf_index` deleted (it only held the old
  strip's index position). Idempotent.
- New gate `site-src/shelf-test.mjs [host | ../final-site]`: 4:3, same size, body shown, no clipping
  and contrast at 320/390/600/767; taps at 390 and 800; hover at 1440.
- Local source: `site-src/css/53-shelf.css`, `js/20-motion.js`; `final-site` rebuilt.
- **PRODUCTION** published twice (`{"publishedPages":27}` each), shell seq 31 → 34 → 35. Backups
  `.tmp/backup-prod-2026-10-08053150-seq31-pre-shelf-mobile` and `…053638-seq34…`.
- **STAGING draft only** (seq 36, 37): its draft already held unpublished edits, so not published.

## Verified live

`shelf-test.mjs https://westlaketxmedspa.com` FAIL none; `verify-live.mjs` FAIL none (26 routes);
no page errors at 390 or 1440 (fresh load, no cache); the live bundle has `$$(".shelf_item", root)`
and `stacked.matches`; the 390 screenshot shows the four cards whole.

## Next

- Staging gets this with its next publish (the draft has it).
- Not asked for: the desktop open card has the same weak contrast (name ~2.4:1 on the Injectables
  photo); the same scrim on desktop would fix it.

## Gotchas

- **The first publish broke production for ~5 minutes (05:31:55–05:36:42Z).** `String.replace` with
  a string replacement turned `$$(` into `$(`, so `items.forEach` threw inside `boot()` and every motion
  function after `shelf()` stopped. The read-back passed because it compared against the same wrong
  string. Repaired by the script's REPAIR branch; now split/join — trap 43 in `05-instatic-upload.md`.
- The shell's `src/scripts/site.js` is CRLF on both instances; anchors are matched with the bundle's
  own line ending.
- **On a Chrome tablet the accordion's first tap already follows the link** (since the first build):
  the tap focuses the link, the focus handler opens the card, and the click then finds it open.
  Open-then-follow only holds where a tap does not focus (iOS Safari). Left as is; the gate reports it.
- Waiting for `waitForNavigation` raced the slow /treatments load; the gate reads `defaultPrevented`
  at the document instead and cancels the navigation.

## Version Control

Tracked. Committed with the work it describes.
