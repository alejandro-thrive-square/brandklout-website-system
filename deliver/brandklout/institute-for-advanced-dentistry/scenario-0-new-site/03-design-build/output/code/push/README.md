# IFA site push (staging only)

The whole rebuilt site, from `../site-src/dist/` to `https://staging.ifadentistry.com`. Generalised on
2026-10-01 from the home's proven pipeline (`workflows/21-instatic-upload/home/`), which it replaces.

**Why not the standard `tools/instatic-site/push/` pipeline:** that one converts the stylesheet into the
Styles registry and lets `importHtml` type `<button>`, `<img>`, `<video>` and form controls, which drops
their `data-*` and `aria-*` attributes. The approved design runs on those attributes (every control,
slider, pin and film), and its stylesheet leans on custom properties, `svh` units and source order that
the registry conversion loses. So, exactly as for the approved home: lossy tags travel as `x-wz-*`
containers and are named back, and `site.css` / `site.js` ship verbatim as code assets.

## Order

From `output/code/`. Every script refuses any host but `staging.ifadentistry.com` (`staging-only.mjs`).
Prefix each API step with `INSTATIC_BASE_URL=https://staging.ifadentistry.com`.

```bash
node site-src/build.mjs > site-src/build.log 2>&1                 # full build into dist/ (writes seo.json)
node push/prepare.mjs > push/.tmp/prepare.log 2>&1                 # dist -> importer-safe bodies, embeds, media list
node push/upload-media.mjs > push/.tmp/upload.log 2>&1             # library; reuses the home's 49 files
node push/assemble.mjs > push/.tmp/assemble.log 2>&1               # tokens -> URLs, site.css, site.js, payload
node push/snapshot.mjs <label> > push/.tmp/snapshot.log 2>&1       # API backup (+ DB copy, runbook)
WZ_TMP="$PWD/push/.tmp" RAILWAY_LINK_DIR="$LOCALAPPDATA/Temp/rw-ifa-staging" env -u RAILWAY_TOKEN -u RAILWAY_PROJECT_ID \
  bash ../../../../workflows/21-instatic-upload/ship.sh > push/.tmp/ship.log 2>&1    # importHtml on the container
node push/push.mjs > push/.tmp/push-dry.log 2>&1                   # dry run
node push/push.mjs --apply --force > push/.tmp/push.log 2>&1       # REPLACE: the payload is the site
STAGING_HOST=staging.ifadentistry.com node ../../../../tools/instatic-site/ops/apply-template-flags.mjs --page 404 --not-found
node push/publish.mjs
```

Then the gates against the published pages (runbook), and the BugHerd sidebar check.

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
- **`<title>`** comes from the page row's `title` (the SEO title); per-page meta descriptions are not rendered
  natively: the site-level one is the home's until the SEO step configures the open-graph plugin per page.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md). Scripts and this file are committed;
`.tmp/` is not (`output/.gitignore`).
