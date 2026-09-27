# 2026-09-23 - BugHerd #41: the reviewer's photo on the /special-offers hero, centred

One new note on project **540564** since 09-21: **#41, /special-offers, "Replace and center the
image"**, from BrandKlout Success at 2560x1305 in Chrome, with the replacement attached
(`shots/41-att0.png`, 1465x1295: the parent at the front desk, the receptionist with a tablet).
#34 and #38 had no new comments and stay open. Done, published, verified, replied, closed.

### Done (commit `ef174b2a`)

- The hero was `desk-1`, a **1400x1864 portrait crop**. `object-fit: cover` across a 2560x994 box
  showed only the receptionist's face (see `shots/41.jpg`). It is now the attachment as
  `front-desk-tablet-{480,960,1400}.webp`. It has a **new filename** because the media upload skips by basename.
- `.ar-bg.is-counter img { object-position: 50% 28%; }` in `site.css`. The faces sit at about a
  quarter of the frame's height, so this puts both people, the tablet and the counter in the header
  at 2560, 1512, 1440 and 390.
- The recipe (`recipes/30-practice.mjs`) still said `st-brushes`, because the page had drifted from it. It now
  names `front-desk-tablet` with `pos: 'counter'`, and `build-pages.mjs` turns `hero.pos` into
  `is-<pos>` on `.ar-bg`, so a rebuild keeps it.
- `desk-1` is unchanged on the homepage and `/our-services/`; the note was about this page only.
- Published 2026-09-23 15:01 UTC: 215 pages, `draftMatchesPublished`, style rules 530 -> 531, site
  seq 52, `import-pages --only /special-offers`. `hero41-shot.mjs <url>` on staging: the new file
  at `50% 28%` on all four widths. Reply sent; #41 is `done`.

### Next

Unchanged from 09-21: #34 needs the GHL form URL, #38 needs the reviewer's re-check, and the hours
need confirming before production.

### Gotchas

- **Python text-mode writes on Windows turn LF files into CRLF.** `stamp.mjs --check` then flags
  the page as differing from the homepage chrome, though only `<main>` changed. Use
  `open(p, 'w', encoding='utf-8', newline='')`, or `sed -i 's/\r$//'` afterwards; check with
  `git ls-files --eol`.
- **"Railway can't verify your SSH key right now"** killed `ship-payload.mjs` after the media
  upload. It is a Railway-side outage, not the key (`railway whoami` was fine). It cleared in about 3
  minutes, and the chain resumed from `ship-payload` without re-running the earlier steps.
- **Lean mode serves the 960w file at every desktop width** (`-960-w960.webp` at 2560). The hero is soft on
  very wide screens. That applies site-wide and was already true of `desk-1`, so nothing changed here.

## Version Control

Tracked with the client runbook, per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
