# scenario-1-migration · 01-old-site-capture · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-09-30 · full capture of www.hackensackdentalimplants.com

Asked for: "scrape the site and all of the assets". The scope of the engagement is still not
recorded; scenario 1 was started because the capture step lives here.

### Done (commit: see the client `RUNBOOK.md` row)

Summary with counts and the content findings: [`docs/migration/old-site-capture.md`](../../../docs/migration/old-site-capture.md).

| Step | Result | Command (from this `output/` folder) |
| :--- | :--- | :--- |
| 2 probe | Webflow behind Cloudflare, apex 301 to www, no bot wall | `curl -sI` |
| 3 scrape | 38/38 pages | `python ../scripts/scrape_site.py --site https://www.hackensackdentalimplants.com --out scrape --save-html` |
| 4 screenshots | 38 pages at 1440 + 390 | `node ../scripts/screenshot-pages.mjs --urls scrape/site-data.json --out screenshots` |
| 5 assets | 675/681 (the 6 misses are guessed names, not files), 203 MB | `python code/assets_webflow.py extract --site … --out assets --html-dir scrape/html --site-data scrape/site-data.json`, then `… catalogue --dir assets --site hackensackdentalimplants.com` |
| 6 mirror | 38 pages + 404, 700 assets, 0 dead local links | `node code/mirror-webflow.mjs --origin … --out mirror --site-data scrape/site-data.json --assets assets` |
| 6 offline proof | 39/39 pages render with the network cut | `node code/check-mirror-offline.mjs mirror/site <pages…>` |
| 7 scan | all five checks pass | `node ../scripts/scan-mirror.mjs mirror/site --host hackensackdentalimplants.com` |
| 8 URL inventory | 38 paths, all 200; Wayback 0 | `node ../scripts/wayback-cdx.mjs …`, `node ../scripts/build-url-inventory.mjs …` |
| 9 email DNS | 6 records, Google Workspace | `node ../scripts/email-dns-audit.mjs hackensackdentalimplants.com --out ../../../docs/migration` |
| 10 tracking | 38 pages rendered | `node ../scripts/tracking-inventory.mjs --urls scrape/site-data.json --out tracking --limit 40` |
| 11 blog | 6 posts from the Webflow CMS (read through `webflow-brandklout`) | `MSYS_NO_PATHCONV=1 python code/posts_from_webflow_cms.py --cms posts/webflow-cms.json --origin … --prefix /blog --out posts` |
| 12 backup | R2, manifest `assets.tsv` in the client folder | `node scripts/assets.mjs push --client hackensack-dental-implants` (repo root) |
| 13 summary | written | `docs/migration/old-site-capture.md` |

Four client scripts are in `code/`, each with its reason in the header: `assets_webflow.py`,
`mirror-webflow.mjs`, `check-mirror-offline.mjs`, `posts_from_webflow_cms.py`.

### Next

1. Upload `screenshots/`, `assets/downloads/` and `mirror/` to the shared drive
   `0ADqUKcTkH0SxUk9PVA` under `Old Site Capture/2026-09-30/` (manual: `drive.mjs` only reads) and
   put the link in `docs/migration/old-site-capture.md`.
2. Re-run `wayback-cdx.mjs` once: the Archive was returning 503 during this run, then 200 with zero
   rows. Zero is believable (the domain was registered 2026-07-18) but it was read on a bad day.
3. Get the scope and a ruling on the seven content findings, then step 02 (redirect map) or
   scenario 0 step 02.
4. Pull the client drive (logos, before and afters, clinical and office photos) when the build starts.

### Gotchas

- **The output folder is ~180 characters deep and this machine has `LongPathsEnabled = 0`.** Python
  cannot write past 260: the first asset run lost 623 of 681 files with `Errno 2`. `subst` does not
  help (`Path.resolve()` follows it back). The client scripts flatten to short names
  (`downloads/wf/<id6>_<stem30>…`, `mirror/site/_ext/wf/…`, pages as `<path>.html`); the longest path
  in the mirror is 258. Do not add a folder level under `output/`.
- **`extract_assets.py` needs `--site-data scrape/site-data.json`** on a site with no
  `sitemap_index.xml`. Without it the script scans 0 pages and exits 0.
- **`mirror-site.mjs` is WordPress-only.** On Webflow it mirrors the home page and then throws in
  the media-library pass. Use `code/mirror-webflow.mjs`.
- **`wayback-cdx.mjs` prints "0 archived URLs" when the Archive answers 503.** Check with
  `curl -s -o /dev/null -w "%{http_code}"` on the CDX URL before believing a zero.
- **`export-posts.mjs --scrape` finds 0 posts on Webflow** (every page is `kind: page`). The CMS read
  is better anyway: it has the rich text, the ten FAQ pairs per post and the meta fields.
- **`verify-mirror.mjs` reports 9 "missing" files that exist**: it reads
  `data-video-urls="a.mp4,b.webm"` as one file name. `check-mirror-offline.mjs` is the proof here.
- **Git Bash rewrites `--prefix /blog`** to `C:/Program Files/Git/blog`. Prefix the command with
  `MSYS_NO_PATHCONV=1`.
- **Asset names in URLs can hold literal parentheses** (`name%20(1).svg`); a URL regex that stops at
  `)` truncates them and the CDN answers 403.
- Finsweet Attributes is a code-split ES module; the mirror leaves module scripts remote. Termly,
  GTM, GHL, Elfsight, Maps and the WebFont loader also stay remote, by design.
- The tracking inventory rendered all 38 pages in a real browser, so GTM and GA4 counted 38 visits
  from this machine today.
- These are process findings for `main` (directive step 5, `mirror-site.mjs`, `wayback-cdx.mjs`,
  `export-posts.mjs`, `verify-mirror.mjs`, the drive map, the Webflow site registry). Nothing on
  `main` was changed from this branch.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
