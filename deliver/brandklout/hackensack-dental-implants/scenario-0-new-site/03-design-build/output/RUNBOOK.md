# scenario-0-new-site · 03-design-build · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-09-30 (later) · home page rebuilt to the client's chosen concept

Alejandro: the client chose https://hackensack-dental-implants.webflow.io/concept-04-human-transformation;
make the page as accurate to it as possible. The first canary below predates that and is replaced
(its source is in git at `1ef53236`).

### Done (commit: see the client `RUNBOOK.md` row)

- Read first: [`canary-review.md`](./canary-review.md): how to open the page, where it differs
  from the concept and why, what was checked, six things to confirm.
- The concept is one Webflow embed with its own stylesheet and markup. Captured to
  `assets/reference/concept-04/` (`page.html`, `inline.css`, `body.html`, `style-*.json`, screenshots
  at 1440 and 390) with `code/shoot-url.mjs`. The build was ported from those values: px to rem,
  `clamp()` headlines to `rem x --s-h`, the concept's 1000/800 breakpoints to 991/767.
- `code/site-src/` rewritten: `css/01-tokens` to `30-sections`, `pages/index.html` (concept order and
  copy, eight `data-chapter` wrappers), `js/00-runtime.js` (concept reveals plus three scenes).
  Fonts are now Newsreader and DM Sans (variable `woff2` from Google Fonts, latin).
- `code/prep-images.py` re-cut: 14 files, client's own, one per concept slot.
- `build.mjs` also writes `OPEN-home.html` here: the double-click copy. `dist/index.html` is
  root-relative and shows unstyled from the file system.
- `code/compare.py <width>` makes concept-versus-build strips in `look/compare-<width>/`.
- Checks: `code/probe.mjs` 27/27; `fluid-root --check` pass; `image-reuse` 0 problems;
  `check-pages` and `click-controls` exit 1 for the reasons in `canary-review.md`.

### Next

1. Rulings on the six items in `canary-review.md` (patient quote, All-on-4, doctor dates, phone,
   "by Aesthetic Dental Centers", platform).
2. The concept has no multi-page menu, financing, hours or office photographs. Decide where they
   go before the inner pages are built.
3. Ask Brandklout whether the other four concepts matter; only 04 was captured.

### Gotchas

- **Ask for the chosen concept before designing.** Brandklout presents concepts on a `webflow.io`
  staging site; the first canary was built without it and thrown away.
- **Read the concept's code, not only its picture.** Its CSS gave exact grid ratios, radii and
  sizes in one pass; the screenshots were for checking.
- The concept's small text (8 to 10px) and gold kickers (2.9:1) are kept out on purpose; both are
  listed as differences.
- A pinned block that is only a grid looks bare with its heading scrolled away: the process scene
  pins the heading with its steps. The gallery pins alone because heading plus gallery is taller
  than a 735px viewport.
- The GHL survey paints late or not at all in headless captures, so the form card looks empty in
  `look/` stills. It renders in a real browser.

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
