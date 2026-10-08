# IFA site push (staging only)

The whole rebuilt site, from `../site-src/dist/` to `https://staging.ifadentistry.com`. Generalised on
2026-10-01 from the home's proven pipeline (`workflows/21-instatic-upload/home/`), which it replaces.

**Why not the standard `tools/instatic-site/push/` pipeline:** that one lets `importHtml` type `<button>`,
`<img>`, `<video>` and form controls, which drops their `data-*` and `aria-*` attributes, and runs the
stylesheet through Instatic's converter, which loses custom properties, `svh` units and source order. The
approved design runs on all of those. So, exactly as for the approved home: lossy tags travel as `x-wz-*`
containers and are named back, and `site.css` / `site.js` are pushed verbatim as code assets.

**Then the stylesheet moves into the registry (since 2026-10-06).** A code-asset stylesheet cannot be edited
in the Styles panel and beats every panel edit, so after every push `push/editable.mjs` moves `site.css` into
the style registry with `css-to-registry.mjs` (which writes every declaration verbatim, no converter) and keeps
the colour tokens in the Framework panel. Only the eight `@font-face` blocks stay in the asset. Standards:
[INSTATIC-FRAMEWORK.md](../../../../../../../process/tools/client-first-style-guide/INSTATIC-FRAMEWORK.md) and
[CLASS-STANDARD.md](../../../../../../../process/tools/client-first-style-guide/CLASS-STANDARD.md)
(class names: `../site-src/KIT.md`, the old-to-new map in `../../class-standard/`).

## Order

From `output/code/`. Every script refuses any host but `staging.ifadentistry.com` (`staging-only.mjs`).
The worktree `.env` points at production: run each API step through
`node ../../../../tools/instatic-api-sync/with-site.mjs institute-for-advanced-dentistry:staging -- <command>`
(written `$WS` below), which supplies the staging host and login.

```bash
TOOLS=../../../../tools/instatic-api-sync ; S=institute-for-advanced-dentistry:staging ; WS="node $TOOLS/with-site.mjs $S --"
node $TOOLS/output/status.mjs --site $S                            # draftMatchesPublished must be true (a publish ships the whole draft)
node site-src/build.mjs > site-src/build.log 2>&1                 # full build into dist/ (writes seo.json)
node $TOOLS/class-audit.mjs --local site-src --strict             # GATE: IN BOUNDS (Client-First class names)
node push/prepare.mjs > push/.tmp/prepare.log 2>&1                 # dist -> importer-safe bodies, embeds, media list
$WS node push/upload-media.mjs > push/.tmp/upload.log 2>&1         # library; reuses the home's 49 files
node push/assemble.mjs > push/.tmp/assemble.log 2>&1               # tokens -> URLs, site.css, site.js, payload
$WS node push/snapshot.mjs <label> > push/.tmp/snapshot.log 2>&1   # API backup (+ DB copy, runbook)
WZ_TMP="$PWD/push/.tmp" RAILWAY_LINK_DIR="$LOCALAPPDATA/Temp/rw-ifa-staging" INSTATIC_BASE_URL=https://staging.ifadentistry.com   env -u RAILWAY_TOKEN -u RAILWAY_PROJECT_ID bash ../../../../workflows/21-instatic-upload/ship.sh > push/.tmp/ship.log 2>&1    # importHtml on the container
$WS node push/push.mjs > push/.tmp/push-dry.log 2>&1               # dry run: pages written/deleted, same row ids
$WS node push/push.mjs --apply --force > push/.tmp/push.log 2>&1   # REPLACE: the payload is the site (and the registry)
$WS node $TOOLS/../instatic-site/ops/apply-template-flags.mjs --page 404 --not-found
node push/editable.mjs                                             # dry run: site.css -> registry, tokens -> Framework
node push/editable.mjs --apply                                     # EVERY push: the push just replaced the registry
$WS node push/publish.mjs
node $TOOLS/editability.mjs --site $S --published                  # GATE: EDITABLE
node $TOOLS/class-audit.mjs --site $S --strict                     # GATE: IN BOUNDS
node $TOOLS/class-sync-check.mjs --site $S --build site-src/dist   # build and site list the same classes
node push/cascade-check.mjs                                        # GATE: the published registry cascades like site.css
```

Then the gates against the published pages (runbook), and the BugHerd sidebar check. For a push that should
not move anything visible (a refactor), take `migration-gates.mjs snapshot before` first and `diff` after
(`CLASS-STANDARD.md` section 8).

`class-sync-check` always lists the form slot: the build's design form (`form_field`, `form_chips`,
`is-textarea`, `is-full-width`, `form_note`) is replaced on the site by the GoHighLevel embed (`is-embedded`,
`form_embed`, `wz-embed`), and Cloudflare adds `__cf_email__`. Anything else is a real difference.

## Traps

- **A replace push is the site.** A page missing from `dist/` is deleted live. Build fully first.
- **No nested slugs on this instance.** A page stored as `dental-services/x` answers a JSON 404 (checked
  2026-10-01). Pages are stored flat (`dental-services-x`, `about-our-practice-articles`, `category-x`,
  `contact-us-thank-you`) and the zone-wide Cloudflare rewrites in `docs/dns/URL-RULES.md` (no host
  condition, so staging gets them too) serve them at the WordPress URLs. Links keep the nested URLs.
  A new nested section needs a new rewrite rule.
- **Embeds** (`data-embed` keys and the GHL form slot) become `brandklout.embed-origins.embed` nodes with
  the snippet from `site-src/data/embeds.json`; the plugin must be installed and enabled.
- **Media names**: `ifa-<file>` (the home's are `home-<file>`). A re-cut image needs a new file name.
- **Colours are edited in the Framework panel**, not in `site-src/css/01-tokens.css`: `editable.mjs` removes the
  `:root` copy of the 22 colour tokens on every push and never overwrites a Framework value. After a panel edit,
  put the same value in `01-tokens.css` and `../../class-standard/framework-spec.json`, or the local preview
  shows the old colour. Everything else (type sizes, spacing, per-class rules) is edited in the Styles panel
  and **a replace push overwrites it with site-src**: a hand edit in the Styles panel must be copied into
  `site-src/css/` before the next push (compare the registry first; nothing here detects it).
- **Write a combo compound when it sets a property its base class also sets** (`.path_step.is-closing`, never a
  bare `.is-closing`). Two bare classes on one element are decided by source order, and the move into the
  registry reorders them: on 2026-10-06 the home's closing path step came out 76vw instead of 84vw at <=767.
  `push/cascade-check.mjs` fails on any such swap (`SWAP` lines); the css gates sample three widths and can miss one.
- **The editor canvas is a different renderer.** React drops `hidden=""` and no site script runs, so an overlay closed
  only by `hidden` shows over every page in `/admin/site` while every published-page gate is green (2026-10-07). Overlays are
  closed in CSS by default and opened with `.is-open` (`site-src/KIT.md`, *Lessons*). Gate after every publish:
  `node $TOOLS/editor-canvas.mjs --site $S` (part of `migration-gates.mjs final`); look at its screenshot.
- **The registry holds one value per property per rule.** The move drops the 13 `vh` fallbacks that sit before
  an `svh` value (`min-height: 100vh; min-height: 100svh`): browsers from before 2022 lose those heights.
- **`<title>`** comes from the page row's `title` (the SEO title); per-page meta descriptions are not rendered
  natively: the site-level one is the home's until the SEO step configures the open-graph plugin per page.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md). Scripts and this file are committed;
`.tmp/` is not (`output/.gitignore`).
