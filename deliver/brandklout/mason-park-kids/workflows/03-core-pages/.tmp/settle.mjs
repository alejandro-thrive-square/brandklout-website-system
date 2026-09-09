/**
 * Wait until the page has actually SETTLED before measuring it.
 *
 *   import { settle } from "./settle.mjs";
 *   await settle(page);
 *
 * WHY THIS EXISTS. Until 2026-09-08 the two families came from a
 * `<link rel="stylesheet">` to Google with a preconnect in front of it, so by
 * the time any gate looked at the page the webfonts had been there for a
 * while. They are now self-hosted faces declared inside site.css, which the
 * browser cannot even discover until the stylesheet has parsed, and
 * `font-display: swap` paints Georgia until they arrive.
 *
 * Every gate here measures geometry - box widths, line counts, split lines,
 * where a heading's ink sits - and every one of those numbers is different in
 * the swap window. `diff-live.mjs` duly reported the local homepage h1 as two
 * lines and 194px tall against three lines and 292px live, and the local page
 * as having two fewer split lines than the published one. Both pages were
 * correct; the local one had simply been photographed too early.
 *
 * A fixed `waitForTimeout` is not the fix - it is the bug, with a bigger
 * number. This waits on the two things that actually have to be true:
 *   1. `document.fonts.ready`, so every face is resolved, and
 *   2. one animation frame after that, so the relayout it triggers is done.
 * GSAP's SplitText re-splits on `fonts.ready` too, so waiting on it is also
 * what makes the split line COUNT stable.
 */
export async function settle(page, { timeout = 15000 } = {}) {
  await page.evaluate(async (ms) => {
    if (document.fonts) {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, ms)),
      ]);
    }
    // Two frames: one for the relayout the font swap schedules, one for
    // anything that reacts to it (ScrollTrigger.refresh is bound to
    // fonts.ready in journey.js).
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, timeout);
  // ScrollTrigger's refresh is debounced behind its own rAF; give it a beat.
  await page.waitForTimeout(250);
}
