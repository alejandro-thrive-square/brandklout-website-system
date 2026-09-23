## Latest completed: Dr. Nahlah media pass + Instatic CSS/JS centralisation (2026-08-19)

Committed as **2c9a156**. Brief was "build all the pages locally, not too much text, as many images as possible, then upload
to Instatic, and centralise the CSS." Both halves are done. **Instatic is NOT published** - the work
is in the draft and the publish decision is with the user.

### Local: all 28 pages through a media pass
Prose cut roughly 30-45% on service pages; images up from 2-9 per page to 6-22. Every image comes
from the practice's own 376-file library, no stock. Two new components, both gated:
- **`pk-card-fig`** (in `20-pagekit.css`) - lets any kit card lead with a photograph instead of a
  numeral. This is what turned the eight first-visit steps, six technology cards and three sedation
  levels from prose into pictures. `pk-card-fig-pad` is the contain-on-cream variant for renders.
- **`60-media.css`** - `.mz` mosaic (`mz-3/-4/-wide/-tall/-plain`) and `.mband` full-bleed band.
  Reuses the shell's generic `data-rv` / `data-drift` hooks, so no JS module of its own.

Legal pages (privacy, terms) keep their text; legal copy is not ours to trim. They each gained a band.

**Gates, all green:** `css-vocab` 234 names | `site-test` 484/484 | `interaction-test-gsap` 62/62 |
`swap-proof` 6/6 | `fluid-qa` 390/390 | em dashes **0** on built output.
(62 not 64: the committed results JSON is stale, from before the 2026-08-18 reviews-embed change.)

### NEW GATE: `04-design/.tmp/image-substance.py`
`assets/xray.png` is a 2000x1000 palette PNG with an **opaque fraction of 0.00** - entirely
transparent. It LOADS, so "no broken images" passes everywhere; it DRAWS NOTHING, so it rendered as
an empty box in seven cards before anyone looked at a screenshot. The script composites every
card/mosaic image onto the exact ground it sits on and flags near-blank or near-uniform results.
All eight uses now point at `xray-consult.jpg`, a real photograph
(`2024/06/Doctor-showing-patient-X-ray-...jpg`, copied to `site-src/assets/` under a short name
because the original path exceeds Windows MAX_PATH). Run it after any image change.

### Instatic: one stylesheet, one script, 28 pages
- **`src/styles/site.css`** - the whole 81,071-char design system as ONE all-pages code asset,
  verified byte-for-byte. Replaces the per-page style registry (27 copies).
- **`src/scripts/site.js`** - the whole 36,351-char runtime as ONE all-pages code asset. Replaced
  **113** per-page inline scripts plus **four** `pagekit-*` copies that were still scoped to five
  pages. Those were not merely duplicated, they drove the OLD vocabulary (`[data-anim="hide"]`
  against the current `[data-rv]`) and would have registered a second ScrollSmoother.
- **All 28 pages pushed and verified** (thank-you created; it never existed on Instatic).
- Asset layer is now five real files site-wide plus per-page JSON-LD; ~330KB of duplication gone.

### Gotchas (the expensive ones)
- **Strip HTML comments BEFORE slicing `<body>`.** The built pages carry a head comment containing
  the literal text `<body>`, so `indexOf('<body>')` lands inside it; the dangling `-->` then pairs
  with the next real `<!--` and the stripper eats alternate blocks. `veneers.html` came out at 4KB
  of its 24KB, silently. Same failure as the 2026-08-17 re-sync.
- **Script `format` is FORCED to `module`** on every newly created code asset. Asking for `classic`
  is ignored and it is NOT sniffed from content (tested with a bare comment and with 9KB of real
  UMD-shaped JS). `gsap-head-i.js` is classic only because it predates this. Module is fine for
  `site.js`: it is the CONSUMER of the GSAP globals, and `gsap-head-i.js` is head/classic/blocking.
- **`priority` is normalised to 100** on write, and there is no tool to change a stored runtime.
  Both stylesheets sit at 100; order is listing order (runtime-states, then site.css), which is what
  we want - site.css is authoritative for layout, and the state classes still win at `.in.in.in`.
- **Create tiny, then fill by patching.** Runtime attaches on CREATE only, and a large `content` on
  write is dropped silently. `push-site-css.mjs` / `push-site-js.mjs` both guard on the runtime
  reading back correctly BEFORE putting content in, because a wrong guess is unfixable.
- **`content_list_media` needs the CONTENT workspace**, not the Site editor. With only the Site
  editor open it returns unparsed text blobs, not errors. A paging run against it burned 30 minutes
  and returned nothing. Build the media map over plain HTTP instead (`build-media-map.mjs`) and
  VERIFY each path with a HEAD request.
- **Do not decide "missing" from a map that skipped `-w<N>.webp` derivatives.** Masters referenced
  only through a derivative look absent. That mistake re-uploaded **33 files that already existed**.
- **Pages go up section by section**, and every page is read back and its `<img>`/`<section>`/class
  counts compared with the source. This bridge fails by dropping payloads silently, not by erroring.

### Still open
- **Nothing is published.** `site_publish` has not been called; encorercm.com still serves the old
  pages. This is the user's call.
- **Debris that cannot be deleted via MCP** (no delete tool; remove by hand in the editor):
  33 duplicate media uploads, `src/scripts/wz-site.js`, and ~117 emptied script assets.
- **`assets/broll.mp4`** still cannot be uploaded (`media_upload` is images only); the home proof
  film uses `hero.mp4` on Instatic, as before.
- **7,000+ vs 18,000+ implants.** `about` and `doctor-referral` publish the source figure "7,000+
  full-mouth implants"; the client's 2026-08-18 correction gave "18,000+ implants / 15,000+ arches",
  which home and meet-dr-nahlah carry. These may be two different metrics. Flagged to the user in
  the page comment; do NOT harmonise silently.
- **Webflow is untouched** and is now two architectures behind both the local build and Instatic.
- JSON-LD exists for 22 of 28 Instatic pages; the local `seo.json` has all 28.
