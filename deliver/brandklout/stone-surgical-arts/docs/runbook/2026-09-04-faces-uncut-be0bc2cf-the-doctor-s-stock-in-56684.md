## 2026-09-04 — Faces uncut (`be0bc2cf`), the doctor's stock in (`56684289`). Local, not published

Two jobs from `04-design/.tmp/TRIGGER_PROMPT.txt` and `STOCK-AND-CROPS-PLAN.md`, in that order.
Site rebuilt into `final-site/`; **not pushed to Instatic**, on the standing instruction. The branch
is now 37 commits ahead of `origin/main` and still on this machine only.

### Done

- **Job 1, the cut faces.** Diagnosis confirmed from the render, not the rule: `site-src/crop-probe.mjs`
  (visible region of every `cover` frame, 12 pages x 4 widths, 577 frames) + `crop-faces.py`
  (OpenCV Haar boxes intersected with that region). Then one `object-position` per photograph:
  ten selectors that always carry a person got a value with the measurement in a comment beside
  it; five shared with rooms got it on the element via `u-focus-top/upper/left` (`02-base.css`);
  the dossier hero got `is-mid` / `is-lower` next to the existing `is-upper`, and a 56rem cap at
  2K (`59-wide.css`); two phone frames that no crop could fix grew (`.ask_media` 5:4,
  `.steps_media.is-tall` 4:5). Verified by eye on contact sheets of every changed frame and by
  `section-shot.mjs` on the bands that sit under type.
- **Job 2, the doctor's stock.** `import-doctor-stock.mjs` + `doctor-stock-manifest.json`: 18 of
  20 files in as `ds-*.webp` (16:9 @ 2200 / 4:5 @ 1200, alt + provenance per slot). Four placed on
  `treatments.html` (Skin band, Non-Surgical band, both stills). Fourteen are the library and
  `audit.mjs` counts them instead of warning. The before/after collage is recorded as excluded and
  never written. The `.mov` is a 0.6 MB muted mp4 + poster in `site-src/video/`, outside the
  upload path, awaiting a design decision (HANDOFF.md).
- **Gates:** audit FAIL none / WARN none, all-pages 144/144, journey and the four dossier suites
  unchanged.

### Next

1. Alejandro reviews locally (the four treatments placements, the hero crops at 1920), then decides
   on the peel clip: no video component exists; adding one is a design call, and whether Instatic
   serves `.mp4` from its library is unverified.
2. Publish when told: `build-import-input.mjs` / `push-site.mjs --force`, expect `12 written, 0
   deleted` and the asset step to upload the 18 `ds-*` files plus the four re-exported ones.
3. Ask Brandklout for the licence behind the doctor's stock before the domain goes live.
4. Still open from the morning: the pre-upscale photographs and the missing Drive export.

### Gotchas

- **The restored asset library was incomplete and nobody had noticed.** The 2026-09-04 restore
  brought back the 56 files the HTML references and nothing the CSS references: all seven
  typefaces and the two marble textures were missing, so `audit` FAILed and `all-pages` logged
  "typefaces did not load" on every page. Fonts: `node get-fonts.mjs` (Google, deterministic).
  Textures: the live site 404s `/assets/tex-*.webp`, but its stylesheet
  (`/_instatic/css/style-<hash>.css`) carries the `/uploads/<id>-tex-carrara-w1800.webp` URLs
  and those download with curl. All gitignored, so this will happen again on a fresh checkout.
- **The OpenCV that pip gives you has no face detector.** `opencv-python-headless` resolves to
  5.0, which dropped `CascadeClassifier`; `crop-faces.py` needs `<5`. Bare `pip` is not on PATH
  here, use `python -m pip`.
- **Puppeteer element screenshots are unusably slow on these pages** (9 frames in 10 minutes):
  `crop-probe.mjs` measures without shooting by default, and `section-shot.mjs` takes ONE
  full-page capture and crops it with Pillow. Scrolling an element into view and clipping the
  viewport lands on the wrong section because of the pinned scrollytelling chapters.
- **A `.u-focus-*` utility in `02-base.css` loses to any component rule that sets its own
  `object-position`**, on cascade order at equal specificity. That is why the treatments band's
  centred photographs use `.catx_media.is-centred img` in `53-hub.css`, not a utility. Check
  before reusing a utility on a selector that already has a value.
- **A 3.85:1 still strip cannot hold a face.** `.still_component` is `clamp(14rem, 26vw, 34rem)`
  tall at content width; at 1440 that shows 48% of a 16:9 source. The brow photograph was placed
  there and withdrawn the same hour. Stills stay still lifes.
- **The four widths the probe uses are 390/1024/1440/1920 at a 900px-tall viewport.** The dossier
  hero at 1920x900 is the harshest case on the site (27% of the source); a real 1920x1080 screen
  gives the hero 31% with the new cap. Judge 1920 findings with that in mind.
- **`cd` inside a Bash call moves the session's working directory for every later call.** Parallel
  calls in the same turn then run from the wrong folder. Use absolute paths or a subshell.
