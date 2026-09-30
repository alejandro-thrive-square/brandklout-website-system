# scenario-0-new-site · 03-design-build · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-09-30 · home page canary, local build

Asked for: "redesign the home page". Steps 01 and 02 of this scenario have not been run and the
platform is not decided; the build follows the Instatic layout.

### Done (commit: see the client `RUNBOOK.md` row)

- Read first: [`canary-review.md`](./canary-review.md) (sources, chapters, checks, decisions to confirm).
- Build: `code/site-src/` (`pages/index.html`, `partials/`, `css/00..30`, `js/head.js` + `00-runtime.js`,
  `vendor/gsap` 3.15.0, `seo.json`, `build.mjs` to `dist/`). Look: `node code/serve.mjs`.
- Images: `python code/prep-images.py` cuts 31 files from the drive pull (`assets/drive/`) and the
  old-site capture into `site-src/media/img` and writes `images.csv`. Fonts: subset `woff2` of the
  site's own Nunito Sans and Maven Pro (`site-src/fonts`, made with fonttools).
- Client drive pulled to `assets/drive/` (office, root, ba, logos; no video). All of it is in R2.
- Checks: `code/probe.mjs` 35/35; `fluid-root --check` pass; `image-reuse` 0 problems;
  `check-pages` and `click-controls` exit 1 for the reasons in `canary-review.md`.

### Next

1. Alejandro and Brandklout react to the canary; rule on the seven decisions in `canary-review.md`.
2. Decide the platform. Instatic: run scenario 0 step 01 (instance, staging, plugins), then push.
3. Service page (All-on-X) and contact page to complete the canary set; read the mobile branch of
   every shared component on the second page.
4. Safari pass (playwright-core 1.49.1 and webkit-2104) and `colour-leak.mjs` once playwright-core
   is installed.

### Gotchas

- **ScrollTriggers are created by kind, not in page order.** Without `ScrollTrigger.sort()` and
  `refresh()` at the end of the runtime, every reveal below a pin measured itself before the pin
  spacer existed and chapter heads faded out while still on screen (seen at 390).
- **`position: sticky` is dead under ScrollSmoother.** Sticky columns are a scrubbed translate
  (`[data-sticky]`), not a pin: a pin with a static subtree fails `check-pages` ("does not scrub").
- **`check-pages` fingerprints opacity, transform, clip-path and text length, not colour.** The
  word-by-word statement only changed colour and was reported as not scrubbing; each word now
  also settles 7px.
- **A scrubbed timeline's trigger stops calling `onUpdate` before a smoothed scrub has caught up.**
  The progress ticks on the treatment scene lagged one step; they hang off the timeline's own
  `onUpdate` now.
- **A custom property computed at `:root` does not follow an override further down.**
  `--d1: calc(6.5rem * var(--s-d1))` ignored `--s-d1` set on the hero; the hero sets its own
  `font-size` from `--hero`. The tiers are measured (`code/measure-hero.mjs`): the longest line,
  "Hackensack, NJ", is 7.16em wide.
- **`scroll-snap-align: start` eats a rail's left padding** unless the rail has `scroll-padding-inline`.
- **The GHL survey's Turnstile answers 401 on localhost** and fails `check-pages` on its own.
  `probe.mjs` blocks those hosts; the gate cannot.
- `journey-audit.mjs` counts zero pins on a root-relative build. Known; not a finding.
- Write `.mjs` files with the Write tool: a bash heredoc broke on a quote inside `probe.mjs`.
- Drive folder names are shortened (`office`, `root`, `ba`, `logos`) to stay under Windows MAX_PATH.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
