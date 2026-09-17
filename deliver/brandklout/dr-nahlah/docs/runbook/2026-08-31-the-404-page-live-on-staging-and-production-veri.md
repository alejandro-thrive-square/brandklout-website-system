## DONE 2026-08-31: the 404 page — LIVE ON STAGING AND PRODUCTION, verified both

Both sites now serve a real designed 404 instead of the 21-byte
`{"error":"Not found"}`. Staging first, reviewed and approved by the client, then
production with the same script.

**Instatic ships this feature; nothing was patched.** A page whose
`template.target` is `{ kind: 'notFound' }` gets baked to `404.html` on publish and
served with status 404 for every unmatched GET. Full mechanics, the three serving
layers and five traps:
[`workflows/15-instatic-api-sync/15-instatic-api-sync.md`](../deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync/15-instatic-api-sync.md)
§ "The 404 page is a TEMPLATE TARGET, not a page".

| | |
|---|---|
| script | `workflows/15-instatic-api-sync/push-404-page.mjs` (dry run by default) |
| staging | `https://staging.drnahlah.com/<anything>` → **404**, 14,792 B |
| production | `https://www.drnahlah.com/<anything>` → **404**, 15,681 B |
| `/404` direct | **200**, same body — static-hosting convention, not a bug |
| page row | slug `404`, title `Page Not Found \| Dr. Nahlah Implants & Prosthodontics` |
| templates after save | `404, post` on both — `post` intact, all 43 articles route |
| production publish | `{"publishedPages":38}`, seq 125 |

Built by cloning `about` (the only hero with a `.ph-actions` CTA row): header, drawer,
`#smooth-wrapper` and footer kept byte for byte, every other `main` section stripped,
hero rebuilt from the site's own class ids. 200 nodes, nothing added to the style
registry. Content: breadcrumb → h1 "Page *not found*." → lead → **Back to home** /
**Book a consultation** → both offices' phone numbers as `tel:` links.

Production regression-checked after publish: 7 pages 200, sitemap.xml still 200 with
79 `<loc>` entries, `/posts` still lists 43 articles and four spot-checked entries 200.

### Next

1. **`/404` returns 200 and is indexable, and carries a self-referencing canonical**
   (`<link rel="canonical" href="https://www.drnahlah.com/404">`, from the Open Graph
   plugin — production has `emitCanonical: true`, staging has it off). The 404
   *responses* are harmless: they carry status 404 and Google drops them. The 200 copy
   at `/404` is the only exposure. It is in no sitemap and linked from nowhere, so the
   risk is low — but the clean fix is a Cloudflare Response Header Transform Rule on
   zone `drnahlah.com` (`f126e891760316b7946887faacf306bd`), added to the SAME ruleset
   the staging noindex rule lives in (`18e6e6c0ac15437395bfbf71562ce1c6`), with
   expression `http.host eq "www.drnahlah.com" and http.request.uri.path eq "/404"`.
   **This one is safe to pair with a canonical** — the canonical is self-referencing, so
   the noindex can only ever apply to `/404` itself, never to a real page. Not done;
   needs a decision.
2. **The design package has no `404.html`.** `04-design/.tmp/final-site/` is the static
   mirror of the site and is now one page behind on both environments. Add it, and a
   `seo.json` entry, or a future re-import silently drops the 404.
3. **Nothing here is committed yet** — `push-404-page.mjs`, the module-15 doc section
   and this entry are all still in the working tree.

### Traps found doing it

- **`site` is REQUIRED in the `PUT /site-document` body** even when the shell is
  unchanged. Omit it and you get a bare `400 Invalid request body` that reads like a
  problem with the page payload. Ship the shell you just read.
- **`.tmp/.session` is host-blind.** One cached cookie, no record of which environment
  it came from — switching between staging and production silently reuses the other
  one's. `push-404-page.mjs` deletes it on every run and refuses to start without an
  explicit `INSTATIC_BASE_URL`, because the repo `.env` default is **production**.
- **`seo-head.js` can never title this page.** It keys off `location.pathname`, which on
  a 404 is the missed URL, and returns early on a miss. `page.title` is the only title
  the page will ever have.
- **Class ids and upload ids are per-site, and a wrong one is SILENT.** The script
  hardcodes twelve class ids and one image id. A class id that resolves to nothing
  publishes a node with no styling — a completely unstyled page, no error. Staging and
  production agreed here (12/12, image 200), but they are only a clone-snapshot apart;
  `push-404-page.mjs` now asserts every id against the target host's own registry before
  it will build.
- **`publish` bakes the WHOLE draft, not your change.** Before publishing production,
  `GET /admin/api/cms/publish/status` must say `draftMatchesPublished: true` — otherwise
  you ship whatever else was sitting unreviewed in the draft. It did (37/37, last
  published 2026-08-31T01:27Z), which is the only reason the production publish was safe
  to run unattended.
- **Instatic has no sitemap route at all.** `/sitemap.xml` on production (200, 79 URLs)
  is served by **Cloudflare**, not the platform, so the 404 template cannot affect it and
  `/404` cannot leak into it. On staging the same path has no Cloudflare rule, so it now
  falls through to the 404 page — that is pre-existing, not caused by this change.
