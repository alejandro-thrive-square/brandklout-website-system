# 2026-09-21 — Home page redesign, local canary

Asana: **Design Home Page** `1217929763942271` (due 2026-09-21). Alejandro asked for the home page
to be redesigned entirely, locally, high-interaction and high-animation with GSAP, to the design
SOP ([DESIGN-STANDARD.md](../../../docs/DESIGN-STANDARD.md) + `04-design`).

## Done

- **The page.** `workflows/04-design/.tmp/prototypes/home/` — `index.html`, `home.css`, `home.js`,
  GSAP 3.15 (ScrollTrigger, ScrollSmoother, SplitText) self-hosted in `vendor/`, three typefaces
  self-hosted in `fonts/`. Eight named chapters: Arrival, The Question, Two Disciplines, The Design,
  The Specialist, The Path, The Proof, The Invitation. Four are pinned and scrubbed. The signature
  is chapter 03: the smile design is drawn over a real "before" and the "after" wipes in across the
  same mouth, then the divider is draggable.
- **Run it:** `node deliver/brandklout/institute-for-advanced-dentistry/workflows/04-design/.tmp/prototypes/serve.mjs`
  then `http://localhost:4173/home/`. `?motion=off` shows the reduced-motion page, `?smooth=off`
  turns ScrollSmoother off. The server answers byte ranges; `python -m http.server` does not, and
  the patient films will not seek on it.
- **Identity ruling.** The Drive's logo colour guide is the only brand document: gold `#C3972B`,
  three cool greys, Century Gothic. **No navy** — that was the previous agency's site. Recorded in
  `.tmp/reference-inventory.md`; direction in `.tmp/style-direction.md`; tokens in
  `.tmp/design-tokens.json`; manifest in `.tmp/prototype-manifest.json`.
- **All real material.** Every photograph is from the practice's own 196-frame shoot; the hero is
  their 18 s b-roll; the four patient films are theirs; every figure and every sentence of claim is
  from the client's brief or the live site. Nothing invented.
- **Gates.** `qa/gate.mjs` **48/48** (pins hold, three distinct states at 25/50/75 % on desktop and
  phone, real clicks, reduced motion, contrast, call bar). `journey-audit.mjs` PASS (8 chapters, 4
  pins, 18 scrubs, 0 IntersectionObserver). `fluid-root.mjs --check` exit 0. Zero horizontal overflow
  at 360, 390, 768, 1024, 1366, 1440, 1512, 1920, 2560. Frames reviewed at every width. Detail in
  `.tmp/canary-review.md`.
- **`scripts/drive.mjs thumbs`** — new command: a web-size JPEG of every image in a Drive folder,
  through the API's own thumbnail renderer. The shoot is about 3 GB of originals; this made it
  29 MB. Documented in [GOOGLE_DRIVE.md](../../../docs/GOOGLE_DRIVE.md).
- Four gotchas added to DESIGN-STANDARD.md (below).

Commit: `2c50e986` feat(ifa): home page redesign canary, local, and drive.mjs thumbs.

## Next

1. **Alejandro reviews the direction** on localhost. On approval, freeze tokens, shell, vocabulary
   and `home.js` for the batch (04-design step 9), then build the remaining templates from it.
2. Put the questions below to Brandklout before the client sees it.
3. WebKit pass at 1512×735 (the reviewer's Safari). Only Chrome has been driven so far.
4. Staging: port to `staging.ifadentistry.com` through `21-instatic-upload`. Known work there:
   `<video>` publishes as `base.container` with `customTag` and `src` set at boot; the form slot
   becomes the brandklout Embed block with the GHL form, height reserved; vendors already sit on
   `'self'`; self-host the variable woff2 as media.
5. Vercel preview only if Brandklout wants a link before staging (04-design step 14).

## Open questions for Brandklout / the client

- **2,500+ or 2,800+ implants.** The brief says both; the page says 2,500+.
- **Is the complimentary exam + CBCT + smile design preview still the offer?** Taken from the live site.
- **"100% patient satisfaction"** is in the brief and deliberately not on the page.
- **Consent** for the chapter 03 before/after (Drive › Smile Gallery › Smile Makeovers, the
  20-veneer case; captioned "Actual patient", no name) on a home page.
- The Asana **Style Guide** task is still open and still formally blocks this one.

## Gotchas

- **Media is gitignored and lives only in this worktree.** `prototypes/home/media/` (23 images,
  6 videos) and `03-graphic-resources/.tmp/drive/` are not in git. `prototypes/build-media.py`
  rebuilds all of it; the Drive commands it needs are in its docstring. Copy the folders out before
  deleting the worktree.
- **The review arrows were dead and every screenshot was clean.** The fixed chapter rail overlaid
  the right gutter and took the clicks. It is `pointer-events: none` now. Found only because the
  gate writes a real click.
- **`clip-path` does not contain overflow.** The hero film, scaled 1.14 inside its clipped window,
  widened the phone layout viewport to 418 px: the page rendered 7 % small and the call bar fell off
  the bottom. The window has `overflow: hidden` too. And `scrollWidth - innerWidth` read **0**
  throughout, because `innerWidth` grows with the overflow on a phone — measure against the device
  width.
- **Short windows.** At 1512×735 the hero tag slid under the nav and the third design caption
  clipped. There is a `min-width: 992px and max-height: 820px` block that steps the display scale
  down. Check pinned scenes at 735 and 768 tall, not only 900.
- **`fonts/fonts.css` URLs are relative to that file.** `url('fonts/…')` inside it 404s.
- **Do not make `.arrival__second` or any text-plus-`<em>` line a flex container directly**: each
  text run becomes its own flex item and the spaces vanish. It has an inner `<span>`.
- ScrollSmoother is on for desktop fine pointers only. `position: sticky` does not work inside it,
  so the form column is pinned with ScrollTrigger instead.
- The walk and gate scripts load `?smooth=off` for exact scroll positions; one gate block loads the
  default URL to prove the smoother registers.
- Before/after: both frames get the **same** crop logic and the same 1.22 exposure lift in
  `build-media.py`. Nothing is retouched. Keep it that way.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
