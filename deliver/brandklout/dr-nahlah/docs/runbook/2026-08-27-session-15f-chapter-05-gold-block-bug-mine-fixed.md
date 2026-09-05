## DONE 2026-08-27 (session 15f): Chapter 05 gold-block bug — MINE, fixed

Client: "the animation got broken in Chapter 5 on mobile". Correct, and it was
my own regression from `patch-path-swipe.mjs` (session 15b) — NOT from the
smoother change, though that is when it got noticed.

`.ch-path.is-swipe .pa-bar` was given `position:static`. `.pa-bar i` — the
progress fill — is `position:absolute;inset:0`, so a static bar leaves it with no
containing block: it escaped to `#pathPin` and painted a full-height gold
rectangle across a third of the chapter, over the heading and the cards.

    .pa-bar i  offsetParent  pa-pin   rect 126x677    <- broken
    .pa-bar i  offsetParent  pa-bar   rect 115x1      <- fixed (relative)

Fix is one word: `position:relative`. The bar only needed to leave the pinned
build's absolute flow; relative does that AND keeps the fill anchored. Changed
in `css/35-ch-path.css` and the matching registry rule (`.tmp/fix-pabar.mjs`).
Desktop cannot be affected — the rule is scoped to `.is-swipe`, which is only
added on touch, and the base `.ch-path .pa-bar{position:absolute}` is untouched.

### Gotcha — the reason this reached production

**The fill starts at `scaleX(0)`, so the bug is INVISIBLE until someone swipes.**
Every check I ran on the swipe build — classes, geometry, pin-spacers, snap —
was taken AT REST, and at rest the element is correct-looking and zero-width.
A carousel has to be verified in a scrolled state, not just a mounted one. The
probe now sets `track.scrollLeft` before it screenshots, and `probe-chpath.mjs`
reports `offsetParent` for exactly this class of escape.
