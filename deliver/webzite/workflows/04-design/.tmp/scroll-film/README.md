# Home — Scroll-Film Edition · "It Adds Up"

**Date:** 2026-07-18 · **Skill:** `deliver/process/Fable 5 Skill (resource)/scroll-film-studio` (Lane A, pure-code)
**Status:** Design alternative to `../final-design` (Isadora r2). Same locked copy, pricing, and brand system — different hero architecture.

## Concept

The film is the brand equation solving itself. One continuous shot inside a single
pinned stage (560svh driver, one scrubbed GSAP timeline):

1. **CH 01 — Strategy**: giant char-split "Strategy" over a self-drawing blueprint
   grid with mono annotations; beat copy = the studio-of-one lede.
2. **CH 02 — + Experience**: blue orb + parallax interface fragments drift past.
3. **CH 03 — + Function**: a mono terminal reports the build (`PageSpeed 100/100`).
4. **CH 04 — = Profit**: the equation reassembles, "Profit" slams in yellow with a
   glow flood, CTAs + scrubbed stat count-ups land — the finale IS the hero.

Each solved term docks into a small mono **ledger** at the top of the stage. A
chapter HUD (`CH 0x / 04` + hairline progress) and a scroll hint complete the film
chrome. The film then unsticks into the standard proof content (marquee with
velocity-skew, thesis + services, offset case grid with clip-path cover unveils,
word-fill statement, quote table, canonical pricing, contact).

## Brand law honored

- Design System v2.0 tokens verbatim; Inter + JetBrains Mono ONLY (no serif — locked).
- Yellow = the single action/emphasis accent; blue ambient; red reserved (terminal dot only).
- Dust canvas + grain + progress bar (design system 05 Motion, verbatim).
- Canonical pricing ($200 design + $200 dev per page, 2 days/page) and the three
  verified quotes carried over word-for-word.
- Real covers used where they exist (Excellent Facets, Verde Energy, Mused);
  3D renders remain honest stand-ins for the rest.

## Files

- `index.html` / `css/film.css` / `js/film.js` — the page (GSAP + ScrollTrigger + Lenis via CDN; vendor locally for production).
- `verify.mjs` — CDP harness: screenshots every beat via the `?jump=<y>` + `window.__ready`
  dev contract, captures console errors, runs a scripted-scroll jank probe (`window.__jank()`
  reports p95/max rAF deltas). Usage: `node verify.mjs [width] [reduced]`. Output in `shots/`.

## Fallbacks

- **Reduced motion / no JS**: the film is skipped entirely; a static hero shows the
  resolved equation + lede + CTAs. All reveals render visible.
- Mid-film reload / `?jump`: boot intro is skipped, states force-settled.

## Verified (2026-07-18)

- 1440 + 390 + reduced-1440: all 11 beats `ready=true`, console clean.
- Jank probe: mobile p95 16.8ms; desktop headless p95 67ms is software-rendering
  overhead (blur orb) — same treatment as approved r2.

## Version Control

Follows root [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md). Lightweight artifact
of workflow 04-design; screenshots in `shots/` are regenerable via `verify.mjs`.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
