# 2026-10-01, later — Review panels padded; the site has a favicon (and Open Graph)

Two client asks: the white panel around the Google reviews widget was "way too shrunk" (the
widget's title sat on the panel's top edge and its dots on the bottom edge), and the site had no
favicon (blank tab icon, `/favicon.ico` 404). Both live on STAGING and PRODUCTION.

## Done (`b8a9a12d`, this worktree only — not pushed, not merged)

- **Padding.** `.words_reviews` (`/`) and `.wall_reviews` (`/results`): `padding-block:
  var(--space-large)` (48px at 1440), `var(--space-medium)` at ≤767px (~30px). Source
  `css/55-words.css`, `css/65-proof.css`; registry form in `add-elfsight-reviews.mjs`, whose
  `ensureRule` now **merges** wanted styles into an existing rule instead of skipping it (editor-set
  properties it does not name stay). Shell only, no page touched: staging seq 23 → 24, production
  27 → 28, both `{"publishedPages":26}`. Backups `.tmp/backup-{staging-…-seq23,prod-…-seq27}-pre-reviews`.
- **Favicon.** `site-src/make-logo.py` gains a FAVICON cut: the WA monogram (trimmed to solid ink,
  not the glow, so it fills 82% of the tile) in the art's own white and lime on charcoal `#272727`;
  48 and 192 with rounded corners, 180 opaque square for iOS. `assets/_favicon/wma-favicon-*.png`,
  gitignored, backed up to R2 (`assets.tsv`).
- **`brandklout.open-graph` 1.2.3 installed** on both instances (it is one of the three house
  defaults and was missing; Instatic has no favicon setting of its own) with the shared
  `deliver/process/tools/instatic-plugins/plugins.mjs rollout`, staging first. New
  **`05-instatic-upload/set-favicon.mjs`** uploads the icons and sets `favicon`, `appleTouchIcon`,
  `siteUrl` (the instance's own host) and `siteName` "Westlake Medical Aesthetics",
  read-merge-write with read-back, then publishes and checks the live head.
- **What else the plugin now does, on every page:** og/twitter tags, a canonical, and **each page's
  own meta description** (they all carried the home page's before — directive trap 6).

## Verified

- Panels, headless at 1440 and 390, staging and production: 48px / ~30px gap above and below the
  widget; screenshots looked right.
- Both hosts: `<link rel="icon">` (48px PNG, 200 `image/png`) and `<link rel="apple-touch-icon">`
  on `/`; `plugins.mjs verify` `ok` (production includes `seo-head-check`); `verify-live`
  `FAIL none`; `/botox` and `/about` carry their own descriptions; canonical = the host.
- Production `/` still carries Termly, Sienna, the GHL pool and Elfsight; `sienna-test.mjs` on
  `/` and `/results` `FAIL none`.

## Next

- `brandklout.aeo-schema` (JSON-LD, the third default) is still not installed here.
- `plugins.json`'s note for `stone-med-spa` ("SEO pair not recorded anywhere") is stale — system
  file, update it on main.
- The widget's cards still run to the panel's left/right edges and its "next" arrow is half
  clipped by the panel's `overflow: hidden`; not asked for, side padding would fix both.

## Gotchas

1. **A fresh plugin install is never published by the rollout**, so its own verify reports
   `0 og:title` and `STOPPED` — expected; configure, publish, then `plugins.mjs verify`.
2. **Git Bash rewrites `PAGES=/,...`** into `C:/Program Files/Git/,...` — `MSYS_NO_PATHCONV=1`.
3. **`assets.mjs push --no-worktrees` reads nothing** unless this checkout is passed with `--from`;
   and it uploads every untracked file, scripts included, so run it after committing.

## Version Control

Tracked runbook, per [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md). Committed with the work it describes; not pushed, not merged.
