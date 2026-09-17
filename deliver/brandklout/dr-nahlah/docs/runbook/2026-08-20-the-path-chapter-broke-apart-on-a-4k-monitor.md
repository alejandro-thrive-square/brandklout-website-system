## The Path chapter broke apart on a 4K monitor (2026-08-20)

Commit **bdcad3a**. Reported from the client's own screen. **Not live** — rides with the blog push.

**Above `--maxw` (1560px) the page stops growing and starts CENTRING.** `.pa-head` is
`max-width:var(--maxw);margin-inline:auto`; the card track and the progress rule were only
gutter-indented. At 3840px that is three different left edges in one section:
heading 1140-2700, track 117-2110 (half the screen, hard left), rule 117-3723 (full bleed).
All three now share `--pa-inset`, which is the gutter below `--maxw` and follows the centred column
above it. `100%` inside `calc` resolves against `.pa-pin`, the containing block for all three.
Measured at 1440 / 1920 / 2560 / 3840: one left edge everywhere, no page overflow.

**The pin also went dead up there.** With the track fitting on screen `distance()` is 0, so the
section pinned for 0.6 of a viewport height with nothing moving: ~1300px of dead scroll on 4K.
`ch-path.js` now picks its build from whether the track actually overflows and rebuilds on resize;
`.ch-path.is-static` hides the progress rule. Fixing the inset makes the track overflow again at
3840, so the scrub is back there and the static branch is for anything wider.

**NEW GATE: `audit-site.mjs --width 3840 --height 2160`**, plus a `misaligned` check — every band
that lays out more than one full-width child must start them on ONE left edge. It reports
`path:1257/117` against the live site and nothing against the fixed build. 34/34 local pages clean
at 4K.

### Gotchas
- **A pinned section cannot be photographed with `captureBeyondViewport`.** Pinning pulls the
  content out of flow behind a spacer, so a full-page capture renders the spacer and the chapter
  comes out BLANK. Either shoot the viewport at a scroll position (`shot-at.mjs`) or emulate
  `prefers-reduced-motion: reduce` (`shot.mjs --reduced`), which turns the pins into static sections.
  The layout is identical in both branches, so the reduced capture is a fair check of alignment.
- **`--local` was mapping the 43 CMS article routes onto top-level files** that do not exist, so a
  local sweep reported 43 phantom 404s around the 34 real results. Local mode skips them now.
