# tools/instatic-site

The executables a new Instatic site needs across scenario 0: provision, stage, push the build,
gate it, launch it on Cloudflare. Promoted 2026-09-23 from the Instatic client worktrees
(`bk-west-la-implants`, `bk-stone`, `bk-stone-med-spa`, `bk-dr-nahlah`, `bk-ifa-dentistry`,
`bk-mason-park`, `bk-mason-park-kids`, `bk-brandklout-website`). Each script's header names its
origin file.

Sibling toolkits this one relies on and does not copy:

| Toolkit | What it owns |
|---|---|
| [`../instatic-api-sync/`](../instatic-api-sync/instatic-api-sync.md) | `insta-api.mjs` (the admin client every script here uses via `lib/site.mjs`), `conv-encode.ts` / `conv-preload.ts` (shipped by `push/ship.sh`), `install-fonts.mjs`, CSS repair tools, `prune-versions` |
| [`../instatic-plugins/`](../instatic-plugins/README.md) | every `brandklout.*` plugin source, `plugins.json` (registry), `install-plugin.mjs`, `plugins.mjs` (status, rollout, verify across sites) |
| [`../instatic-embeds/`](../instatic-embeds/instatic-embeds.md) | the Embed block tooling: `set-origins.mjs`, `rollout-site-scripts.mjs` (GTM, DNI pool, accessibility widget as site scripts; never Microsoft Clarity), the canvas and published-page gates |
| [`../instatic-domain-origins/`](../instatic-domain-origins/instatic-domain-origins.md) | `check-origins.mjs --all` after any domain or `PUBLIC_ORIGIN` change |
| [`../termly-ghl-consent/`](../termly-ghl-consent/termly-ghl-consent.md) | `consent-kit.mjs` (Termly above GTM, autoBlock off, GHL bridge; `check <url>` is the consent gate) |
| [`../seo-aeo/`](../seo-aeo/README.md) | The SEO & AEO standard, the keyword map format and `lib.mjs` (`seo/push-keyword-h1.mjs` and `seo/hero-look.mjs` import it: a `requires` in `toolkit.json`) |
| `scripts/fluid-root.mjs` (repo root) | `--check <package>`: the house fluid root, before any push |
| `scenario-0-new-site/03-design-build/scripts/journey-audit.mjs` | GSAP journey standard (max eight chapters, `pin:true`); on a root-relative multi-page build use `gates/check-pages.mjs` instead |

## Scenario 0 step map

| Step | Scripts | When to run |
|---|---|---|
| 01-client-inquiry | `setup/provision-instance.mjs` | New Railway project + Instatic service + volume + domain + variables, then `--setup` claims the admin at once |
| | `../instatic-plugins/install-plugin.mjs` (or `plugins.mjs rollout`), `../instatic-domain-origins/check-origins.mjs` | Install every plugin on production and staging; prove the admin login origin |
| | `staging-clone/staging-clone.md` §A, `staging-clone/*` | Stand up the staging environment (volume, `PUBLIC_ORIGIN`, claim setup, delete the minted service domain) |
| 02-research-sitemap | (none here) | Sitemap tooling is `../specialty-sitemaps/` |
| 03-design-build | `scripts/fluid-root.mjs --check`, `gates/check-pages.mjs` (local), `gates/click-controls.mjs` (local), `gates/colour-leak.mjs`, `gates/cross-client-grep.mjs`, `gates/image-reuse.mjs` | Every build, before any push |
| | `images/upscale-images.mjs` + `images/contact-sheet.py` | When client photos are soft; look at every face |
| | `ops/backup-site.mjs` (+ `--db-command`) | Before any `--force` push once the site has admin edits |
| | `push/*` in order (below), `ops/apply-template-flags.mjs`, `gates/template-guard.mjs` | Every push to staging |
| | `gates/verify-live.mjs`, `css-declared-parity.mjs`, `compare-live.mjs`, `visual-diff.mjs`, `verify-motion-live.mjs` | After every staging publish |
| | `ops/render-draft-page.mjs` | Look at an unpublished page without publishing |
| 04-qa | `gates/check-pages.mjs --base`, `gates/click-controls.mjs --base`, `gates/perf-budget.mjs`, `../termly-ghl-consent/gates/check-ghl-form.mjs`, `gates/facts-sweep.mjs`, `gates/cross-client-grep.mjs --base`, `gates/image-reuse.mjs --base`, `gates/audit-double-aspect.mjs` | On staging, all breakpoints, before sign-off |
| 05-launch | `seo/*` ([README](./seo/README.md)): scan → facts → build → push → `verify-schema.mjs`, and `push-keyword-h1.mjs` + `hero-look.mjs` | The schema from each page's visible content; a keyword H1 where the map needs one (also Scenario 7 step 02) |
| | `gates/seo-head-check.mjs`, `gates/facts-sweep.mjs`, `../termly-ghl-consent/gates/dni-proof.mjs`, `../termly-ghl-consent/consent-kit.mjs check` | After SEO, schema, OG, DNI, analytics and Termly are in |
| | `staging-clone/clone-site.mjs` / `diff-sites.mjs` / `clone-plugins.mjs` / `publish-rows.mjs` | Promote staging to production and prove parity |
| | `../instatic-domain-origins/check-origins.mjs` | After connecting the domain and `staging.<domain>`; `PUBLIC_ORIGIN` on BOTH environments |
| | `../cloudflare-launch/canonical-host.mjs` | One address per page (apex to www or back) |
| 06-post-launch | `../cloudflare-launch/build-sitemap-worker.mjs` → `deploy-worker.mjs` → `verify-launch.mjs` | Sitemap Worker; rebuild on every page add/remove/rename |
| | `staging-clone/verify-staging-clean.mjs`, `check-noindex.mjs` | Staging noindex, no trackers, production still tracked |
| | `gates/seo-head-check.mjs`, `gates/facts-sweep.mjs` | Full sweep over the live sitemap |
| | `ops/restore-page-seo-cells.mjs` | If a later page write dropped SEO cells |

## Conventions (all scripts)

- **Run from the step folder in the client's scenario copy** (for example `deliver/brandklout/<client>/scenario-0-new-site/04-qa/`). Outputs go to `<cwd>/output`. Credentials come from the
  nearest generated `.env` (never hand-edit it; `node scripts/env-sync.mjs`).
- **`INSTATIC_BASE_URL` is required.** `lib/site.mjs` refuses to run without it. The worktree `.env`
  points at production: for staging, prefix the command `INSTATIC_BASE_URL=https://<staging host>`.
  Scripts that write in replace mode or patch rows also call `lib/staging-guard.mjs`: set
  `STAGING_HOST=<exact hostname>` or pass `--allow-production` on purpose.
- **Build root.** `lib/paths.mjs`: `--site-src <dir>` or `SITE_SRC`, default
  `scenario-0-new-site/03-design-build/output/code/site-src` (relative to `deliver/brandklout/<client>/`, where every script runs). Layout (West LA Implants, the most general build):
  `dist/` (every page `.html`, `assets/`, `assets/gsap/`, `media/img`, `media/video`, `fonts/`) and
  `css/` (source stylesheets in load order). Pages are always derived by walking `dist/`, never listed.
- **Browser gates** need `puppeteer-core` (`npm i --no-save puppeteer-core` in the worktree, or
  `PUPPETEER_DIR`) and Chrome (`CHROME_PATH`). `colour-leak.mjs` needs `playwright-core`.
- **Git Bash:** `MSYS_NO_PATHCONV=1` on any `railway ssh` call or any `/`-prefixed argument. Never pipe
  a Node 24 script's output on Windows; redirect to a file.
- **Every dry run is the default.** Writes need `--apply` (and `--force` where noted).

## The push pipeline, in order (staging)

```
node push/upload-media.mjs                                 # media into the library; writes output/media-map.json
node push/set-alt.mjs --apply                              # importHtml DISCARDS alt; always run
node push/build-import-input.mjs                           # output/import-input.json.gz + .b64
RAILWAY_LINK_DIR=<dir linked by project ID> bash push/ship.sh   # check-link, ship, bun import-run.ts, fetch result
node push/push-site.mjs                                    # dry run
node push/push-site.mjs --apply --force                    # REPLACE mode: a page missing from dist/ is deleted live
node push/place-embeds.mjs --apply                         # output/code/embeds.json; the importer turns third-party iframes into empty divs
node ops/apply-template-flags.mjs --page 404 --not-found   # + --page <tpl> --table <collection>; import wipes them
node gates/template-guard.mjs
node ../instatic-api-sync/insta-api.mjs publish
node gates/verify-live.mjs   # must end "FAIL  none"; then css-declared-parity, compare-live, visual-diff 1440 and 390, verify-motion-live
node ../instatic-api-sync/editability.mjs --published      # must end "EDITABLE": no code-asset rules, no :root shadow of the Framework
node push/push-site.mjs --record                           # baseline for the next update (after embeds/flags moved the seqs)
```
(Paths above are relative to this folder; prefix them with the path from your client folder.)

This full run is for the **first import** or a deliberate rebuild. Every later change goes through
the update path below.

**Everything the pipeline pushes is editable by hand** (since 2026-10-04). Design tokens live in the
Instatic Framework (`settings.framework`), seeded with `../instatic-api-sync/framework.mjs apply`
before the first push; both paths keep it. `push-site.mjs` puts every declaration the converter
loses (custom properties, `clamp()`, layered backgrounds, `!important`) back into its registry rule
(`output/registry-repair.txt`), skips Framework-owned tokens, and the `tokens.css` asset carries only
the variable-font `@font-face` rules. `TOKEN_ASSET=legacy` restores the old token asset for one run.
After the publish: `node ../instatic-api-sync/editability.mjs --published` must end `EDITABLE`.
Standard: [`../client-first-style-guide/INSTATIC-FRAMEWORK.md`](../client-first-style-guide/INSTATIC-FRAMEWORK.md).

## The update path (changed pages only, 2026-09-28)

```
node push/upload-media.mjs                                 # skips what is already uploaded
node push/build-import-input.mjs --changed                 # only pages whose html differs from the last push (or --only a,b)
RAILWAY_LINK_DIR=<dir> bash push/ship.sh                   # the converter still runs, on the smaller payload
node push/push-site.mjs --update                           # dry run: pages written/untouched, shell sent or not
node push/push-site.mjs --update --apply                   # INCREMENTAL: every page not in the payload is untouched
node push/place-embeds.mjs --apply                         # only if a written page carries a data-embed marker (idempotent)
node ../instatic-api-sync/insta-api.mjs publish
node gates/verify-live.mjs                                 # + check-pages on the written pages
node push/push-site.mjs --record
```

- **CSS/JS only**: `push-site.mjs --update --shell-only --apply` (no conversion of pages needed, but
  `ship.sh` still has to produce the registry: build with `--only index` to keep the payload small).
- **Ids.** The converter mints random style-rule ids every run. `--update` maps each converted class
  onto the live rule's id by name, so rewritten pages and untouched pages resolve against the same
  registry. It refuses if a written page would point at a rule that is not in the registry being sent.
- **The shell** goes only when the CSS/JS sources changed since the last push, or a written page
  uses a class the live registry lacks. `--with-shell` / `--no-shell` override. Live class rules
  that only untouched pages use are carried over into a new shell.
- **Browser edits.** `output/push-state.<host>.json` records each page's seq and the registry hash
  after a push or `--record`. If the live values differ, someone edited in the editor since, and
  the update refuses and lists them. Pull those edits into `site-src` first, or `--force`. The first
  update on a site with no record needs `--record` (right after the last full push) or `--force`.
- **Templates** travel with each rewritten page (read from the live row), so
  `apply-template-flags.mjs` is not needed after an update.
- **Deletions never happen** in an update: a page gone from `dist/` is reported, not removed.
- A partial payload (`--only` / `--changed`) is refused by a replace push, which would delete the
  pages it leaves out.
- Every `--apply` of `push-site.mjs` needs `STAGING_HOST=<exact host>` or `--allow-production`.

## Scripts

| Script | Purpose | Usage | Origin |
|---|---|---|---|
| `setup/provision-instance.mjs` | Railway project, service (`ghcr.io/corebunch/instatic`), `/app/storage` volume, domain, 7 variables, deploy, health poll, admin setup | `--name "<Business>" [--dry]`; later `--setup` with `INSTATIC_PROVISION_URL`, `INSTATIC_EMAIL`, `INSTATIC_SETUP_PASSWORD`. Token from `~/.railway/config.json` | bk-west-la-implants `deliver/process/tools/instatic-api-sync/provision-instance.mjs` |
| `staging-clone/*` + `staging-clone.md` | Stand up staging, seed it, promote it, keep it out of Google; `verify-staging-clean.mjs` is the rendered-DOM leak gate | see `staging-clone.md` | bk-brandklout-website `deliver/process/21-instatic-staging-clone/` (newest of 4 runs) |
| `push/upload-media.mjs` | Resumable media upload (img, video, fonts incl. variable woff2), map keyed by path | `[--force] [--only a,b]` | bk-west-la-implants `21-instatic-upload/` |
| `push/set-alt.mjs` | Alt text onto library assets (longest wins) | `[--apply]` | same |
| `push/build-import-input.mjs` | Rewrite srcs to library URLs, strip `@font-face`, gzip payload | `[--only a,b \| --changed]`, `EXPECT_FONT_FACES=<n>` | same |
| `push/check-link.mjs` | Fail closed unless the Railway link dir serves `INSTATIC_BASE_URL` | `<RAILWAY_LINK_DIR>` (ship.sh runs it) | same |
| `push/ship.sh` | Chunked `railway ssh` ship of converter + payload, run, fetch `import-out.json` | `RAILWAY_LINK_DIR=... bash ship.sh` | same |
| `push/import-run.ts` | Runs on the container: `cssToStyleRules`, `importHtml`, class linking; optional prebuilt registry | shipped by ship.sh | bk-brandklout-website `21-instatic-upload/` |
| `push/push-site.mjs` | One `PUT /site-document`: replace (first import) or `--update` incremental (changed pages, shell only if needed); pages, registry (with the converter's losses put back: `registry-repair.mjs`), `@font-face`-only token asset (`TOKEN_ASSET=legacy` for the old one), script assets (GSAP first, UMD wrap), SEO cells; records `output/push-state.<host>.json` | `[--update [--pages a,b] [--with-shell\|--no-shell] \| --shell-only] [--apply] [--force]`, `--record`, `TOKEN_FILES=` | bk-west-la-implants |
| `lib/push-state.mjs` | The per-instance push record: html hashes, page seqs, registry + source hashes | imported | new 2026-09-28 |
| `push/place-embeds.mjs` | Swap `data-embed` markers for Embed blocks (GHL forms, widgets) | `--config embeds.json [--apply] [--publish]` | bk-stone `21-instatic-upload/` |
| `ops/apply-template-flags.mjs` | Re-set notFound / collection template flags after an import | `--page 404 --not-found` or `--page <tpl> --table <slug>` `[--check]` | bk-mason-park `apply-404-template` + `apply-blog-template` |
| `ops/backup-site.mjs` | API snapshot (shell, rows, published HTML, seq); `--db-command` prints the `VACUUM INTO` railway command | `[--out dir]` / `--db-command --label x` | bk-west-la-implants `output/backup-live.mjs` |
| `ops/render-draft-page.mjs` | Render an unpublished page through the editor preview (no shared components) | `[slug] [outDir]` | bk-dr-nahlah `instatic-api-sync/` |
| `ops/restore-page-seo-cells.mjs` | Put back SEO cells a page write dropped, from a backup | `--from pages.json [--only slug] [--apply]` | same |
| `gates/check-pages.mjs` | Per-page runtime gate: console/4xx, runtime armed, pins scrub, one h1, overflow at 390, optional screenshots | `[slug...] [--widths=1440,390] [--shots] [--base=https://host]`, `LIGHT_PAGES=` | bk-west-la-implants `08-qa/output/check-local.mjs` |
| `gates/click-controls.mjs` | Clicks every control; reports those whose click changes nothing | `[slug...] [--base url] [--widths 1440,390]` | new, from bk-stone-med-spa `drag-test.mjs` |
| `gates/colour-leak.mjs` | Contextual CSS stealing a class's ink; contrast by hit-testing | `[--all] [--site dir]` | bk-mason-park-kids `output/colour-leak.mjs` |
| `gates/verify-live.mjs` | Every built route live: links, assets, titles | `FAIL  none` to pass | bk-west-la-implants |
| `gates/css-declared-parity.mjs` | Every declared property reached the live CSS (not the same tool as instatic-api-sync's `css-parity.mjs`) | | same (`css-parity.mjs`) |
| `gates/compare-live.mjs` | Local vs live: computed style, geometry, runtime | `[slug] [width] [--shots]` | same |
| `gates/visual-diff.mjs` | Pixel diff local vs live | `[slug] [width]` | same |
| `gates/verify-motion-live.mjs` | Motion on the live home page: pins, smoother, console | `[widths]`, `MOTION_PINS=a,b` | same |
| `gates/perf-budget.mjs` | Causes of slow pages: blocking head JS, lazy LCP, duplicate alt, eager iframes, big media | `--base url [--paths] [--quick] [--waivers json]` | bk-dr-nahlah `08-qa/` |
| `gates/facts-sweep.mjs` | Phones/hours/retired values per URL, HEAD vs body, JSON-LD values | `--host url --facts facts.json [--urls]` | bk-dr-nahlah `audit-live-numbers.mjs` |
| `gates/seo-head-check.mjs` | Title, one description, one canonical, unique og:url, og:image, parsed JSON-LD, plugin settings | `--public url [--tables posts] [--render] [--org-type Dentist]` | bk-dr-nahlah `16-instatic-plugins/verify-seo-plugins.mjs` (fixed) |
| `gates/cross-client-grep.mjs` | Another practice's names, phones, domains, video ids on this site | `--deny deny.json [--dist] [--base]` | new |
| `gates/image-reuse.mjs` | Same photo twice on a page, on more than two pages, or leading two pages ([`IMAGES.md`](../../../docs/IMAGES.md)) | `[--dist] [--base url] [--max-pages 2] [--allow json]` | new, 2026-09-25 |
| `gates/template-guard.mjs` | Lists templated rows; proves a page write keeps `template` (writes nothing) | | bk-dr-nahlah `verify-template-guard.mjs` |
| `gates/audit-double-aspect.mjs` | CSS reserving an aspect box twice around an embed | | bk-dr-nahlah |
| `../termly-ghl-consent/gates/check-ghl-form.mjs`, `dni-proof.mjs` | GHL form readiness and the number-pool swap. Platform-neutral, so they live with the GHL toolkit since 2026-09-28 | see [`termly-ghl-consent.md`](../termly-ghl-consent/termly-ghl-consent.md) | was `gates/` here |
| `seo/*` | The content-built aeo-schema chain (`scan-sections`, `fetch-facts`, `build-schema`, `vocab-check`, `push-schema`, `verify-schema`, `plugin-stores`) and the keyword H1 (`push-keyword-h1`, `hero-look`, `hero-shot`); per-client `seo-config.json` + base layer in the step output. Schema, mapping language, limitations: [`seo/README.md`](./seo/README.md) | plan by default; `--apply` / `--publish` with `STAGING_HOST` or `--allow-production` | bk-dr-nahlah `22-instatic-api-sync/seo-v3/` (+ `seo-v2/plugin-stores.mjs`), 2026-10-07 |
| `images/upscale-images.mjs` | Magnific upscale (creativity 1, resemblance 3, sharpy) from a jobs file | `--jobs jobs.json [--only] [--list]`, `MAGNIFIC` | bk-mason-park-kids |
| `images/contact-sheet.py` | Original vs upscale sheets to check every face | `--jobs jobs.json --up dir` | bk-mason-park-kids |

## Listed, not copied (too client-specific to generalize cheaply)

- `class-system.mjs`, `type-roles-check.mjs`, `standard-check.mjs`, `class-parity.mjs`,
  `package-intake.mjs`, `cms-collections.mjs`, `cms-sync.mjs`, `wipe-instance.mjs`, `form-probe.mjs`:
  bk-brandklout-website `21-instatic-upload/`. The Client-First type-role registry and the collection
  (legal CMS) shape to copy when a site needs them.
- Legal pages: bk-ifa-dentistry `21-instatic-upload/legal/push-legal.mjs`; bk-stone and bk-stone-med-spa
  runbooks 2026-09-17 (privacy and terms adapted from the sister practice).
- SEO plugin configuration: bk-dr-nahlah `16-instatic-plugins/configure-seo-plugins.mjs`,
  `populate-seo.mjs` (stale `webzite.*` ids, broken import), `retarget-seo-numbers.mjs`;
  bk-mason-park-kids `output/configure-seo.mjs`, `populate-seo.mjs`; bk-brandklout-website
  `16-instatic-plugins/install-seo-plugins.mjs`. (Plugin sources are in `../instatic-plugins/`.)
- `set-site-tags.mjs` (bk-dr-nahlah): superseded by `../instatic-embeds/rollout-site-scripts.mjs`.
- Mason Park static-to-Instatic pipeline (`to-instatic`, `ship-payload`, `run-converter`,
  `fetch-nodes`, `import-pages`, `import-styles`, `import-scripts`): bk-mason-park and
  bk-mason-park-kids `output/`. Older route than `push/`; `import-pages.mjs` is the reference for an
  incremental write with `baseSeqs`.
- Redirect maps (`cloudflare-launch` build/deploy/verify, bk-mason-park `12-legacy-redirects`):
  scenario 1.

## Gotchas every script here assumes

- A page write REPLACES cells: `template`, `seoTitle`, `seoDescription` are dropped unless re-applied.
- `PATCH /data/rows/:id` flattens a nested slug (`a/b` serves at `/a-b`); site-document must be the
  last write a nested page gets.
- Incremental site-document writes need `baseSeqs[row.id] = row.seq`; `{}` 409s every page.
- Media upload skips by basename: a re-cut image needs a new filename.
- `importHtml` drops `alt`, `data:` images, typed-module attributes and non-YouTube iframes.
- A phone number lives in four places (page nodes, components, aeo-schema settings, open-graph store).
- Raw-HTML head checks are blind where site.js replays the head; use `--render`.
- Gates block the Sienna widget and measure at 1440 and below: check 1920 and 2560 by hand.
- A green write proves nothing: run the gates against the published page.

## Version Control

Follows the root rules in [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md). Scripts and this README
are committed; outputs land in the client folder's `output/`, never here. No token or password is ever
written to a file in this folder.
