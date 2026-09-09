## Done this session (2026-09-03, evening) — the second build (`7f620a6b`)

- **Every page rebuilt to the review brief** (elevate; colours used differently; different layouts;
  scroll-based animation; far more imagery; far less text). The home page was built first as the
  canary with the shared system, then the ten interior pages were built by four parallel forked
  agents, each owning its own body files and stylesheets and nothing shared.
- **The shared system:** `css/40-motion.css` + `js/20-motion.js` (the motion vocabulary — see the
  file headers), `css/49-cover.css` (the photographic interior header), two new themes in
  `01-tokens.css` (`green`, `stone`), pill buttons and soft frames, the vendor bundle on every
  page, a dark footer, a progress hairline in the navbar.
- **Imagery:** 39 files brought in from the sibling's assets (its model library and practice
  photographs), the previous site's masthead portrait (`m-glow-hat.webp`, from the Drive export's
  `bg/face.jpg`) and five old-blog lifestyle images (`m-street-*.webp`) converted with PIL, and the
  Drive's higher-resolution doctor portrait (`dr-stone-coat.webp`).
- **Tooling:** `probe.mjs` (viewport captures with motion ON), `menu-test.mjs`; `shot.mjs`,
  `probe.mjs` and `all-pages.mjs` now pick a free port so parallel runs do not collide;
  `all-pages.mjs` skips controls inside `[data-overflow-ok]` (a marquee or a pinned track).
- **Deleted:** `49-pagehead`, `51-ledger`, `53-detail`, `54-practice`, `55-proof`, `56-plan`,
  `57-book`, `59-wide` (renumbered `90-wide`). Their class names are gone; do not reach for them.
- Directive loop: `deliver/process/04-design/04-design.md` gained the "canary is built at the
  review bar" rule. Memory: `brandklout-rejects-static-first-builds`.
