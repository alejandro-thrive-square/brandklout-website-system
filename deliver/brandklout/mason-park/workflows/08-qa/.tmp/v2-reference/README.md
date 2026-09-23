# v2-reference — visual + content reference of the live staging pages

Captured 2026-08-17 from https://mason-park-dental.webflow.io with `capture.mjs`
(headless Chrome over CDP, read-only — no Webflow API calls, no site changes).

Per page (`<slug>/`):

- `page.html` — the served HTML (plain GET, pre-JS)
- `1440.png`, `768.png`, `390.png` — full-page screenshots at those viewport widths
- `content.json` — sections, every visible text run in DOM order, images (src/alt/rendered
  size), links, forms (fields + action), iframe embeds, extracted from the rendered DOM at 1440
- `metrics.json` — body height per width, section ids/offsets/heights at 1440

## Caveats a reader must know

- **Captures are reduced-motion.** Chrome was launched with
  `--force-prefers-reduced-motion` (plus emulated `prefers-reduced-motion: reduce`)
  because the pages run GSAP scroll pinning — `captureBeyondViewport` on a pinned
  document renders chapters at their pinned offsets with blank spacer gaps. The PNGs
  therefore show the honest flowing layout, not the pinned motion. The live pages
  animate on scroll; judge motion on the staging site itself, not in these images.
- Smooth scrolling was disabled for the same reason.
- Body heights in `metrics.json` were taken after a settle loop (height stable within
  4px for >= 3s), and may differ slightly from the motion-enabled page.
- `captureBeyondViewport` silently WRAPS past ~8192 device px in this SwiftShader
  config (the image repeats the top of the page at the bottom). Every capture whose
  body exceeds that is scaled with `deviceScaleFactor = 8100 / bodyHeight`
  (`reshoot.mjs`) — layout identical, lower pixel density. All 18 PNGs verified wrap-free.
- `capture-summary.json` marks the two big LPs "ok: false" for "visible img(s) at
  0x0/unloaded" — those are hidden slider/tab-panel slides (hidden by an ancestor, so
  the element-level visibility check passes them). False positives; the captures are good.

See `INDEX.md` for the per-page summary table and notable features.
