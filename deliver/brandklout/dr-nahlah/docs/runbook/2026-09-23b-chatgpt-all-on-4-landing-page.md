# 2026-09-23b — ChatGPT Ads All-on-4 landing page; OpenAI pixel moved onto it only. LIVE

Request (Alejandro, relaying Gauge Hill / Brandklout): one dedicated All-on-4 page for ChatGPT
Ads. Only the page, with no consultation or thank-you page of its own. Put the OpenAI pixel on it
and take it off the Google Ads landing pages. Office: **Alexandria**. Form: **keep Alexandria's
existing GHL form** (client choice). Build on production first, then mirror to staging.

## Done

Commit: `92d2a80e`

- **`/ads-landing-pages/alexandria-all-on-4-chatgpt`** (page id `OU3PheenMVXGlpMPkiN6D`) is a
  clone of the LIVE `alexandria-all-on-4`: all 568 nodes, fresh node ids, and the 8 links to
  `/ads-landing-pages/alexandria-all-on-4-consultation` changed to `#book`, the hero form on the
  page. A ChatGPT visitor never enters the Google funnel. `dup-chatgpt-landing.mjs`.
- The page id was added to the scope of `src/styles/landing.css` (now 19 pages). `seo-head.js`
  got a map entry copied from the Alexandria page (`noindex, follow`, same title), patched in place
  and not regenerated. `seo.json` got the same entry under `ads-alexandria-all-on-4-chatgpt`.
- **Pixel**: the siteScripts SDK line is now `#pages=ads-landing-pages/alexandria-all-on-4-chatgpt`.
  The code asset `openai-ads-pixel.js` is scoped to that one page id and does `init` only. It is
  host-guarded to `www.drnahlah.com`, so the staging clone never reaches it.
  `set-openai-pixel.mjs --apply`.
- Published. The draft matched live beforehand. Afterwards: 58 pages, draft = published.
- **Verified live** (curl + headless Chrome, OpenAI requests aborted): the new page returns 200,
  `noindex, follow`, the Alexandria form `8jq7yzSeCzZrIkuA3sSG` iframe, Alexandria's pool, 0
  consultation links and 8 `#book` links. The CTA click stays on the page, and `oaiq` is initialised
  with the SDK requested. Its hero and page heights match the source exactly (1286 / 14020 at 1440).
  None of the six Google All-on-4 pages loads `oaiq.min.js` or the pixel asset.
- **Staging**: session bk-dr-nahlah-79 re-seeded staging from production at about 19:20Z, before
  this publish. It was told production is final and asked to re-run its mirror
  (18-instatic-staging-clone). The staging copy comes from that re-run, not from this script.

## Gotchas

- **No ChatGPT conversion is measured.** The page keeps Alexandria's *Google* AO4 form. On
  submit it redirects to `/ads-landing-pages/alexandria-all-on-4-thank-you`, which Google
  counts, and the pixel is no longer on that page. That is Gauge's "the Google flow will get
  confused at form level". There are two ways to fix it: a ChatGPT copy of the form in GHL that
  redirects to its own URL (then add `measure lead_created` there), or a sessionStorage flag set
  on the ChatGPT page and read on the thank-you page. The second puts the pixel back on a Google page.
- `dup-chatgpt-landing.mjs` clones LIVE, not site-src. The page is **not in build-site.mjs PAGES**,
  so site-test/fluid-qa do not see it, and a `push-ads-pages.mjs` run will not touch it. If the
  Alexandria AO4 page is edited, re-run the clone script (it replaces in its own id). It also
  re-adds the seo/css bits idempotently.
- The 2026-09-23 run's `lead_created` on the two All-on-4 thank-you pages is gone with this.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
