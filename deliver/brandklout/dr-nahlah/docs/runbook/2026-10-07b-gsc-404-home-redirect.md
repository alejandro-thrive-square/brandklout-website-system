# 2026-10-07b — GSC "Not found (404)": `/home` redirected, the GSAP cache folder left alone

Search Console's Page indexing › Not found (404) report listed two URLs. The user asked what caused
them, then approved the fix.

**State: DONE AND VERIFIED.** `/home` and `/home/` now 301 to `/`. The other URL needs no action.
Still to do in Search Console (not done; we have no GSC access): **Validate fix** on the report.

## The two URLs

| URL (last crawled) | Cause | Action |
| :--- | :--- | :--- |
| `www.drnahlah.com/_instatic/runtime/cache/3850ee1c14aa4d59a28a74bb/gsap/` (Sep 16) | Instatic writes an import map into every page head: `"gsap": "…/gsap/index.js"` **and the prefix entry `"gsap/": "…/gsap/"`**. Googlebot crawls URL-shaped strings in inline scripts, and a bare folder has no page, so the answer is 404. That is correct. | **None.** It is not a page, and 404s on URLs that were never pages do not hurt. A robots.txt block would only move it to "Blocked by robots.txt", and a careless one would stop Google fetching `gsap/index.js` to render. |
| `drnahlah.com/home` (Aug 21) | Apex 301s to www (canonical host), and `www.drnahlah.com/home` was a 404. **Nothing on our side links to it**: all 81 sitemap pages scanned for `/home`, and it is not in the sitemap, `drnahlah-301-redirects*.csv` or the Cloudflare list. The Wayback Machine has no capture of it on the WordPress site. So Google found it off-site. GSC URL Inspection › Referring page would name the source. | **Two rows in `drnahlah_301`.** |

## Done

- New `workflows/14-migration-seo-redirects/add-home-redirect.mjs` (plan / `--apply`). It follows
  the shape of `add-trailing-slash-redirects.mjs`:
  - sources `www.drnahlah.com/home` and `www.drnahlah.com/home/`;
  - target `https://www.drnahlah.com/`;
  - www only (`include_subdomains: false`): staging keeps its own behaviour, and the apex reaches
    www through the Single Redirect first;
  - exact match, query string preserved.
- It refuses to run if `/home` answers 200 (that would mean it has become a page) or if `/` does
  not answer 200. It also skips a source the list already holds.
- Applied: list `drnahlah_301` went from **289 → 291 rows**. It is appended with POST items, so no
  existing row was touched.

## Verified (live)

| Request | Result |
| :--- | :--- |
| `www…/home` | 301 → `https://www.drnahlah.com/` |
| `www…/home/` | 301 → `/` |
| `drnahlah.com/home` | 2 hops (apex → www → `/`), ends 200 |
| `www…/home?utm_source=gbp` | 301 → `/?utm_source=gbp` |

For about a minute after the apply, the edge returned mixed 404/301 for `/home/`. Every check after
that returned 301.

## Gotchas

- **An import map's prefix entry ends up in GSC's 404 report.** Any page whose head has
  `"pkg/": "/path/"` will show `/path/` as Not found. This is expected; do not "fix" it. The cache
  hash (`3850ee1c…`) changes when Instatic rebuilds the runtime, so a new folder URL may appear in the
  report later. That one is harmless too.
- **Cloudflare list edits take about a minute to reach every edge.** A 404 straight after `--apply`
  does not mean the row failed. Re-check before you debug.
