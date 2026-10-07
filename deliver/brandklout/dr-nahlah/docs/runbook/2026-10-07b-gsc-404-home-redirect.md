# 2026-10-07b — GSC "Not found (404)": both URLs redirected, Validate fix started, Asana closed

Search Console's Page indexing › Not found (404) report listed two URLs. The user asked what caused
them, approved the fix, and then asked for the report to be validated and the task closed. The task
is Asana **"Fix 404"** `1218884763280824` (BK Activation – Dr. Esam Nahlah, from Jessica on
2026-09-26). Its attachment, `drnahlah.com-Coverage-Drilldown-2026-09-25.xlsx`, is this same report
with these same two URLs.

**State: DONE AND VERIFIED.**
- Both URLs 301 (`drnahlah_301` 289 → 292 rows).
- **Validate fix started in GSC on 2026-10-07.** Google re-crawls and reports Passed or Failed later;
  that can take days to about two weeks.
- Asana task commented and **completed**.

## The two URLs

| URL (last crawled) | Cause | Action |
| :--- | :--- | :--- |
| `drnahlah.com/home` (Aug 21) | The apex 301s to www (canonical host), and `www.drnahlah.com/home` was a 404. **Nothing on our side links to it**: all 81 sitemap pages were scanned for `/home`, and it is not in the sitemap, `drnahlah-301-redirects*.csv` or the Cloudflare list. The Wayback Machine has no capture of it on the WordPress site, so Google found it off-site. | `/home` and `/home/` 301 to `/`. |
| `www.drnahlah.com/_instatic/runtime/cache/3850ee1c14aa4d59a28a74bb/gsap/` (Sep 16) | Instatic writes an import map into every page head: `"gsap": "…/gsap/index.js"` **and the prefix entry `"gsap/": "…/gsap/"`**. Googlebot crawls URL-shaped strings in inline scripts, and the bare folder answers 404. That does no SEO harm, but **Validate fix fails while any URL in the report still 404s**. | The folder 301s to `…/gsap/index.js`. Browsers never request the folder (an import map only resolves paths under it). `index.js`, `ScrollTrigger.js` and `gsap-core.js` still answer 200. |

The first answer to the user called the GSAP URL harmless and said to leave it. That was right for
rankings but wrong for the task, which was to clear the report. It was redirected once the
validation goal was known.

## Done

- `workflows/14-migration-seo-redirects/add-gsc-404-redirects.mjs` (plan / `--apply`; it began as
  `add-home-redirect.mjs` and was renamed in the same run). Rows follow
  `add-trailing-slash-redirects.mjs`:
  - www only (`include_subdomains: false`): the apex reaches www through the Single Redirect first,
    and staging keeps its own behaviour;
  - exact match, query string preserved.
  - The GSAP row is built from the **live import map**: each prefix entry `k/` maps to entry `k`.
    Re-run the script when the Instatic runtime hash changes.
  - Refuses if a source answers 200 or a target does not, and skips a source already in the list.
- Search Console: Codex computer use (`codex_cu.mjs --allow-writes`) clicked **Validate fix**. The
  page then read "Validation Started", October 7, 2026, with the same two Examples.
- Asana: comment `1219282858289962` explains both redirects and the validation, then
  `update_tasks completed:true` (read back as `completed: true`).

## Verified (live)

| Request | Result |
| :--- | :--- |
| `www…/home` | 301 → `https://www.drnahlah.com/` |
| `www…/home/` | 301 → `/` |
| `drnahlah.com/home` | 2 hops (apex → www → `/`), ends 200 |
| `www…/home?utm_source=gbp` | 301 → `/?utm_source=gbp` |
| `www…/_instatic/runtime/cache/3850ee1c…/gsap/` | 301 → `…/gsap/index.js` (200) |

## Next

- Check the report in a week or two (account below) for **Validation: Passed**. If it fails, look
  for a new runtime hash in the Examples and re-run `add-gsc-404-redirects.mjs --apply`.

## Gotchas

- **Search Console for drnahlah.com opens only as `success@driverank.com`** (DriveRank Success,
  Chrome `authuser=4` on this workstation). The default Chrome account `elalejandromilano@gmail.com`
  and three other personal accounts have no access, so Codex's first run stopped at "can't access the
  property". Tell Codex to try the other signed-in accounts (`authuser=N`), never to sign in.
- **An import map's prefix entry ends up in GSC's 404 report**, and **Validate fix fails while any
  listed URL still 404s**, even one that is not a page.
- **Cloudflare list edits take about a minute to reach every edge.** A 404 straight after `--apply`
  does not mean the row failed. Re-check before you debug.
