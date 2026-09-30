# scenario-0-new-site · 03-design-build · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-09-30 (late) · layouts recomposed editorially, on staging

### Done (commit: see the client `RUNBOOK.md` row)

- Asked for: "change the layout so it's not too common … the majority shouldn't be like a regular
  layout". Nine of twelve blocks recomposed on a 12-column grid; list in `canary-review.md` →
  Layout. Feature, consult form and FAQ kept.
- Markup: hero masthead (`.hero-meta`, h1, `.hero-visual`, `.hero-copy`), treatment numerals are
  `01/02/03`, `#process-scene` also carries `.process-wrap`. `--bleed` token in `01-tokens.css`.
- Layout that exists only with motion (ticker, horizontal journey, name behind the team, stepped
  closing words, split-headline indent) is in `25-interaction.css`, shipped verbatim.
- Runtime: hero no longer pinned (the masthead is taller than a laptop window); pins are
  story/process/results/final and each pins only if it fits the window (`scene()` helper),
  otherwise scrubs unpinned.
- Checks: probe 28/28; fluid-root pass; live `check-staging.mjs` 14/14; visual-diff 0.60% / 0.89%.

### Gotchas

- **A negative `text-indent` on a split headline** is inherited by every SplitText line and word
  (inline-blocks): the words piled up on one spot. Clear it inside (`.ln-mask, .ln, .wh`) and pull
  only the first `.ln-mask` back with a negative margin.
- **Mobile one-column resets lose to desktop placements** like `.intro-grid > div:last-child`
  (0,2,1). The reset uses `> div:nth-child(n)` to match that specificity and come later.
- **Puppeteer clicking a control below the fold under ScrollSmoother** scrolls the window natively
  first and the smoother stalls at that offset: the probe's hero-button check failed with the
  button 30px under the fold. Moving the button above the fold fixed it; a JS `.click()` never
  shows it.
- A mouse click leaves focus on the in-page link; the handler now blurs it (mouse) or focuses the
  destination (keyboard, `e.detail === 0`).

## 2026-09-30 (night) · home page motion elevated to the editorial standard, on staging

### Done (commit: see the client `RUNBOOK.md` row)

- `js/00-runtime.js` motion layer rewritten; new `css/25-interaction.css`. Scene by scene list in
  `canary-review.md` → Motion. Five pins at desktop (`hero-scene`, `story-scene`, `process-scene`,
  `results-scene`, `final-scene`); `#final-scene` is on `.final-grid`, the consult and closing h2
  are `js-light` (words lit grey → ink by scroll). Hero pins only when it fits the window.
- Everything motion-only (curtain, cursor, SVG implant drawings, scan line, process rule, rolling
  button labels) is created by the runtime, never in the imported markup.
- Checks: `code/probe.mjs` 29/29 twice; `fluid-root --check` pass; `check-staging.mjs` 14/14 (new
  check: interaction layer created and styled on the live page); `visual-diff` 0.62% at 1440,
  0.80% at 390 (unchanged).
- Pushed with `push-staging.sh`, which now exports `TOKEN_FILES=00-fluid-root.css,01-tokens.css,25-interaction.css`.

### Next

Same as the run below: rulings in `canary-review.md`, then inner pages.

### Gotchas

- **CSS for elements the runtime creates must ship verbatim.** The registry importer keeps only
  rules it can bind to imported markup, so `.curtain`, `.cursor`, `.drawing`… would publish
  unstyled. `push-site.mjs` honours `TOKEN_FILES`; list the interaction stylesheet there. Worth a
  line in the design-build directive on `main`.
- **A puppeteer `screenshot({ clip })` resizes the viewport** (captureBeyondViewport defaults to
  true), which fires `gsap.matchMedia` and reverts every pin: the capture comes back blank. Use
  `look.mjs --at <fraction>` or pass `captureBeyondViewport: false`.
- **FAQ close animation vs one-open rule:** auto-closed siblings must shut at once; animating them
  left two answers open for 0.4s and the probe caught it intermittently.
- `.solution` had a CSS `transition: transform`, which fights a GSAP scrub; `.motion .solution`
  narrows it to `box-shadow`. Same for `.btn` under the magnetic hover (`.is-magnetic`).

## 2026-09-30 (evening) · home page published on Instatic staging

Staging: https://hackensack-dental-implants-staging.up.railway.app/ . Production is provisioned and empty.
Instance details are in the step 01 runbook.

### Done (commit: see the client `RUNBOOK.md` row)

- One command repeats the whole push: from this step folder,
  `RAILWAY_LINK_DIR=<dir linked to the staging environment> bash output/code/push-staging.sh > output/push.log 2>&1`.
  It builds, uploads media, sets alt text, builds and ships the payload, runs Instatic's own
  importer on the container, writes the site document (replace), sets the editor breakpoints,
  places the form Embed block, applies the Open Graph settings, publishes and records.
- The build was made import-safe first: JS hooks are classes (`js-rise`, `js-split`, ...), not
  `data-*`; no custom property is declared outside `:root`; `head.js` is folded into the one
  script; keyframes and the reduced-motion rule live in `01-tokens.css`; underlines are borders.
- Live checks: `output/code/check-staging.mjs` 13/13 (runtime armed with three pins and the
  smoother, both variable fonts loaded from the media library, form Embed block in place, icon and
  share image in the head, `noindex`, no canonical, `og:url` on staging). `visual-diff` local versus
  live: 0.62% at 1440, 0.80% at 390. `compare-live`: the only computed-style differences are the
  Embed block's own box.
- Editor breakpoints are the house set: Desktop, 1279, 991, 767, 479.

### What the generic gates said, and why

| Gate | Exit | Reading |
| :--- | :--- | :--- |
| `verify-live.mjs` | 1 | Four real findings: links to `/services/single-implant`, `/services/implant-bridges`, `/dr-alan-meskin`, `/about` are 404 because only the home page exists. Its other lines look for West LA's runtime (`wz-ready`, drawer, hero film) |
| `css-declared-parity.mjs` | 1 | `* { box-sizing }` was not published as written; the computed value on the page is `border-box` (checked). `.form-card .wz-embed` was tree-shaken; the Embed block carries its own box |
| `check-pages.mjs --base` | 1 | 8 chapters, 3 pins, smoother, one h1. Fails on Turnstile's 401 inside the form frame and on `NOSEO`: there is no canonical on staging by design and no JSON-LD until AEO Schema is configured |
| `verify-motion-live.mjs` | 1 | West LA specific (Bodoni, Manrope, `#heroFilm`); no pin finding |

### Next

1. Send the staging link for review once the items in `canary-review.md` are ruled on.
2. Inner pages (the four 404 links above first), then AEO Schema and the production promotion at launch.
3. After anyone edits in the browser, use `push-site.mjs --update`, not the replace chain.

### Gotchas (toolkit copy, all need fixing on `main`)

- **Seven scripts use `P.WORK` / `P.DIST` without importing `lib/paths.mjs`**: `push/upload-media.mjs`,
  `push/set-alt.mjs`, `gates/verify-live.mjs`, `css-declared-parity.mjs`, `compare-live.mjs`,
  `visual-diff.mjs`, `verify-motion-live.mjs`. They die with "P is not defined". Workaround:
  `node --import ./output/code/preload-paths.mjs <script>`.
- **`build-import-input.mjs` does not empty `data-embed` markers** (bk-stone's copy does, step 0c),
  so `place-embeds.mjs` refuses. Workaround: `output/code/empty-embed-markers.mjs` between the build
  and the ship.
- **`push-site.mjs` hardcodes the favicon as `media/img/logo-icon-dark.png`** and wants all six GSAP
  files in `dist/assets/gsap/`. The build names its icon that way and vendors `ScrollToPlugin` and
  `Observer` although it does not use them.
- `verify-live.mjs` and `verify-motion-live.mjs` still carry West LA's own assertions.
- **A background-image underline publishes as a solid block**: size and position are lost in the
  registry. Use a border.
- **`process.exit()` after fetch trips a libuv assertion on Node 24 for Windows** and the script
  reports failure after doing its work; with `set -e` that stops the chain. Set `process.exitCode`.
- `tools/instatic-api-sync/output/` holds session cookies and had no `.gitignore` in the client
  copy; one is added.
- The replace push keeps the site's breakpoints, but `set-breakpoints.mjs` is in the chain anyway.

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
