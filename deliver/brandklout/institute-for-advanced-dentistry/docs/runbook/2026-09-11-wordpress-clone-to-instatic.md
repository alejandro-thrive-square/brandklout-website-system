## 2026-09-11: WordPress site cloned, as it is, into a new Instatic instance on Railway

### Done

- **Scrape refreshed and proven complete.** One post had gone up after yesterday's scrape
  (`/what-to-look-for-in-an-implant-specialist/`, 2026-09-10 18:04); `mirror.mjs --no-media`
  picked it up: 59 pages, 792/792 page assets. New `scrapers/verify-mirror.mjs` resolves every
  local reference on every page and stylesheet (4,182): 3 misses, none an asset (a `/contact/`
  redirect and Cloudflare's email-obfuscation endpoints). All 469 remaining absolute
  `ifadentistry.com` references are page-level (feeds, JSON-LD ids, canonical), zero files.
  The three testimonials over Instatic's 50 MB cap were re-encoded to ~2.6 Mbps
  (`media-library/vimeo-instatic/`), and Vimeo's own thumbnails fetched as posters
  (`media-library/vimeo-posters/`, oEmbed with the site as referer).
- **Instance provisioned**: `https://institute-for-advanced-dentistry-production.up.railway.app`,
  Railway project `Institute for Advanced Dentistry` `3449a121-3580-485b-97f5-8c8903f8e409`,
  name-first by `provision-instance.mjs` (now committed in `deliver/process/22-instatic-api-sync/`),
  admin set up (owner alejandro@thrivesquare.com, Mason Park password by reference).
  `~/.webzite/.env` gained `[institute-for-advanced-dentistry]` (backup at
  `~/.webzite/.env.bak-institute-for-advanced-dentistry`); registered in
  `20-instatic-domain-origins/sites.json`. Plugin `brandklout.embed-origins` 1.5.1 installed.
- **The clone**: `workflows/21-instatic-upload/` — a new `*-wp.mjs` pipeline, documented at the
  top of `21-instatic-upload.md`. 59 pages as Instatic node trees, 766 media assets (every image
  and its WordPress size variants, fonts, 10 videos, posters), the whole WordPress cascade as one code asset (730 KB, page-scoped
  with zero-specificity `:where()`), every WordPress script replayed in place by `runtime.js`,
  the footer map as an Embed block. Published `{"publishedPages":59}`; all 59 routes 200.
- **Gate** `verify-live-wp.mjs` against the LIVE WordPress page, 1440 and 390: see the result
  lines at the end of this file.

### Next

- **Before the domain moves** (see `dns/DNS-CUTOVER.md`):
  - the contact form needs a destination — Fluent Forms posts to WordPress `admin-ajax.php`, which
    the browser refuses cross-origin; it renders and validates, it does not submit;
  - the nested WordPress URLs need a Cloudflare rewrite or 301 map to the flat Instatic slugs
    (`/dental-services/dental-implants/` -> `/dental-services-dental-implants`);
  - add `www.ifadentistry.com` to `PUBLIC_ORIGIN` and `sites.json`, keep the Railway host;
  - Google tag / Site Kit start firing on their own on the production host (gated in `runtime.js`).
- Fix the two stale `webzite.*` ids in `deliver/process/18-instatic-embeds` (`set-origins.mjs`,
  `test-embed-module.mjs`) — trap 47.

### Gotchas

- **Compare against WordPress itself, not the mirror.** On `file://` the Bricksable before/after
  slider never initialises and reCAPTCHA lays out differently, so the mirror "disagrees" with a
  correct clone. Both WordPress and the clone are 1626px wide at 1440 (reCAPTCHA's badge).
- **Instatic's reset is unlayered and beats Bricks' `@layer`.** `site.css` opens with the reset's
  selectors set to `revert-layer`. Re-derive `INSTATIC_RESET` in `prepare-wp.mjs` after a platform
  upgrade.
- **`iframe` is a forbidden custom tag**: a non-YouTube iframe imports as an empty `<div>`. The map
  is an Embed block; Vimeo became local `<video>`.
- **Every page needs the embed plugin's compatible CSP** (`'unsafe-inline'` for the replayed
  scripts). It is triggered by `data-wz-embed`, which is on every `<body>` and on the map block.
- **The importer trims text-only leaves** (a space between two words vanished) and turns `&nbsp;`
  into a space; `prepare-wp.mjs` hoists edge spaces and parks `&nbsp;`.
- **Images are WordPress's own `<img>`, not Image modules** (trap 51): base.image's
  `sizes="auto, 100vw"` made a 451px portrait publish 595px wide. Every attribute (srcset with all
  size variants, sizes, width, height, alt per usage) is kept; an editor changes an image by its
  attributes. The 54 alt-duplicate assets from the earlier approach (trap 49) are unused orphans
  in the library.
- **Compare text by what scripts read, too**: the importer drops newline whitespace between
  blocks, which Bricks' client-side reading time counts ("8 minutes" vs WordPress's 7).
  `prepare-wp.mjs` keeps one space between any two elements.
- **WordPress's emoji loader matters on Windows**: it swaps emoji for Twemoji images; it now loads
  `wp-emoji-release.min.js` 7.1 from jsDelivr's WordPress mirror, not from the WordPress server.
- **A broad pixel diff with a few px of height difference is one element moved.** Use
  `21-instatic-upload/sections-wp.mjs <slug> <width>` (every `#brxe-*` box, both sides). It found
  the portrait (trap 51) and the map's missing baseline gap (trap 52).
- **Trustindex's "Read more" is timing**: the gate can catch WordPress before the widget has
  measured. Both sides match once settled (trap 53).
- A CSS-only change does not need a re-import: when `import-input.json.gz` is byte-identical,
  `push-wp.mjs --apply --force` reuses `import-out.json` and only the code asset changes.
- `ship.sh` over `railway ssh` takes ~10 minutes for this payload (623 KB gzipped, 6 KB chunks).
- When writing code, typed backslash-u escapes landed as the raw characters and U+2028 broke a
  parse; build such characters with `String.fromCharCode`.

### Gate results (final publish, `seq 4`)

`verify-live-wp.mjs`, all 59 pages, clone vs the live WordPress page, reduced motion:

| | 1440 | 390 |
| :--- | ---: | ---: |
| median pixel difference | 0.28% | 0.00% |
| 90th percentile | 1.34% | 0.04% |
| max | 5.71% (`dental-services`) | 6.17% (`dental-services-cosmetic-dentistry`) |
| hard failures | 1 (`privacy-policy`: the gate's own DNS lookup failed; 0.18% and clean on re-run) | 1 (`contact-us-thank-you`: Trustindex "Read more" timing, trap 53) |
| live-only JS errors | 0 | 0 |

The remaining outliers are not clone defects: the hub's dark cards are full-page captures taken
before 1536w JPEGs decode (all 18 images are the same files at the same size and load on both
sides; the score moves between runs), and testimonials / cosmetic dentistry carry the Vimeo
players that became `<video>`. Every page's title, visible text, runtime globals (jQuery, gsap,
bricksData where WordPress has them) and Motion.page reveal match.

Earlier rounds found and fixed, in order: the importer eating a space ("What is aProsthodontist",
trap 48), WordPress's emoji loader skipped (native emoji vs Twemoji), Bricks' client-side reading
time counting merged words ("8 minutes" vs 7), base.image widening a portrait (trap 51), the map
iframe losing its baseline gap (trap 52, the whole 390 offset).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). Scripts and the directive are
committed; `21-instatic-upload/.tmp/` keeps only the media map and the prepare report.
