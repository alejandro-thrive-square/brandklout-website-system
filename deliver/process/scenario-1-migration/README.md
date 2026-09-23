# Scenario 1 · Website Migration

A client already has a website (WordPress, Webflow, Squarespace, a dead host, a hacked host) and we
rebuild it on Instatic. Migration is scenario 0 with two steps in front of it: capture everything
the old site is, and map every URL it ever had. Then the build follows scenario 0.

## Flow

| Step | Directive | What it produces |
| :--- | :--- | :--- |
| 01 | [01-old-site-capture.md](./01-old-site-capture/01-old-site-capture.md) | Pages as markdown, 1440 + 390 screenshots, all assets, a scanned mirror, the URL inventory (sitemap + crawl + Wayback), the email DNS snapshot, the tracking inventory, `posts.json` |
| 02 | [02-redirect-map.md](./02-redirect-map/02-redirect-map.md) | Every old URL classified and mapped; at launch, the redirect Worker built, verified and deployed at cutover |
| then | scenario 0 from `02-research-sitemap` | The new site. The sitemap gives every classified old URL a destination; step 02 Part B runs inside scenario 0's launch with [tools/cloudflare-launch](../tools/cloudflare-launch/cloudflare-launch.md) |

## Rules that hold across both steps

- The old site disappears at cutover. Capture first, change nothing.
- Three URL sources, never one: sitemap/crawl, Wayback CDX, and the database or Search Console.
- Every mirror is scanned before anyone opens it. A compromised host is checked only as an
  anonymous visitor in a fresh browser.
- Email DNS is snapshotted over DoH before any nameserver change, and copied into the new zone first.
- Instatic has no URL redirects: the map is a Cloudflare Worker, deployed at the domain cutover.
- An old domain different from the new one gets its own Cloudflare zone.
- Heavy capture output goes to the client's shared drive, not git and not only the worktree.

## Scripts

`scripts/` holds the promoted executables. Install once: `npm install` in `scripts/` (puppeteer-core;
the installed Chrome is used, `CHROME_PATH` overrides). Python scripts use the standard library
(`truststore` optional). Redirect Node output to a file on Windows; never pipe it.

| Script | Purpose | Usage | Origin |
| :--- | :--- | :--- | :--- |
| `scrape_site.py` | Every page to markdown + JSON (sitemaps, crawl fallback) | `python scrape_site.py --site https://old.com --out scrape --save-html` | bk-west-la-implants `01-content-intake/output/scrapers/` (from bk-dr-nahlah) |
| `extract_assets.py` | Download every asset (srcset, originals, CSS, icons, SVG, PDFs, video ids) | `python extract_assets.py --site https://old.com --out assets --html-dir scrape/html` | bk-west-la-implants, same folder |
| `catalogue_assets.py` | Group size variants, write ASSETS.md + CSV | `python catalogue_assets.py --dir assets --site old.com` | bk-west-la-implants, same folder |
| `screenshot-pages.mjs` | Full-page screenshots at 1440 and 390, rendered-text markdown | `node screenshot-pages.mjs --urls scrape/site-data.json --out screenshots` | bk-ifa-dentistry `current-site-scrape/scrapers/screenshots.mjs`, mobile added |
| `mirror-site.mjs` | Verbatim file:// mirror + WordPress media library originals | `node mirror-site.mjs --origin https://www.old.com --out mirror` | bk-ifa-dentistry `scrapers/mirror.mjs` |
| `verify-mirror.mjs` | Every local reference in the mirror exists on disk | `node verify-mirror.mjs mirror/site` | bk-ifa-dentistry `scrapers/verify-mirror.mjs` |
| `scan-mirror.mjs` | Malware / injected-script gate (decoded blobs, inline loaders), external hosts list | `node scan-mirror.mjs <dir> --host old.com [--strict]` | bk-mason-park-kids `01-site-recovery/output/verify-safe.mjs` |
| `wayback-cdx.mjs` | Every URL the Archive saw, as paths | `node wayback-cdx.mjs old.com --out wayback` | CDX query from the old 14 directive (bk-dr-nahlah, bk-stone) |
| `wayback-capture.mjs` | Recover pages (HTML, text, optional shots) from the largest good capture | `node wayback-capture.mjs --domain old.com --paths wayback/wayback-paths.txt --out wayback [--shots]` | bk-stone `wayback-screenshots/capture.mjs` + `archive-text/refetch-stubs.mjs` |
| `build-url-inventory.mjs` | Merge URL sources with provenance and live status | `node build-url-inventory.mjs --from scrape=… --from wayback=… --out . --check https://old.com` | bk-dr-nahlah `14-migration-seo-redirects/output/provenance.mjs` idea |
| `email-dns-audit.mjs` | Email DNS snapshot over DoH: md, json, BIND zone file | `node email-dns-audit.mjs old.com --out docs/migration [--selectors s1]` | manual checks on bk-ifa-dentistry and bk-mason-park |
| `tracking-inventory.mjs` | Trackers, tags, widgets and phone links from rendered pages | `node tracking-inventory.mjs --urls scrape/site-data.json --out tracking --limit 15` | new (IFA double GTM, UserWay, GHL pool findings) |
| `export-posts.mjs` | Blog to `posts.json` + per-post md + `posts-redirects.csv` | `node export-posts.mjs --wxr content.xml` or `--rest https://old.com` or `--scrape site-data.json` | bk-mason-park-kids `03-core-pages/output/build-blog.mjs` harvest |
| `wp-ssh-export.sh` | WordPress export over SSH with plugins and themes skipped | `WP_SSH_HOST=… WP_SSH_USER=… WP_SSH_PORT=… WP_SSH_KEY=… bash wp-ssh-export.sh '<docroot>'` | bk-mason-park-kids `01-site-recovery/output/sg.sh` + `03-export.sh` |
| `build-redirect-worker.mjs` | Build + validate the map, generate the Worker, routes and audit CSV | `node build-redirect-worker.mjs --config redirect-map.config.json [--offline]` | bk-stone `14-migration-seo-redirects/build-redirects.mjs` + bk-mason-park `12-legacy-redirects/build-redirects.mjs` |
| `verify-redirects.mjs` | Replay every row against the edge or a workers.dev preview | `node verify-redirects.mjs --map out/redirect-map.json [--via <url>]` | bk-mason-park `12-legacy-redirects/verify-redirects.mjs` |
| `redirect-map.config.example.json` | Config template for the builder | copy to the client's `redirects/` folder | new |
| `capture.gitignore` | What of the capture stays out of git | copy to the client's `capture/.gitignore` | new |

Deploying the Worker, DNS copy, tokens and the cutover itself live in
[tools/cloudflare-launch](../tools/cloudflare-launch/README.md).

### Listed, not promoted

Too client-specific to generalize cheaply. Read them when the same situation comes back.

- bk-mason-park-kids `workflows/01-site-recovery/output/05-mirror.sh`, `06-sanitize.mjs`,
  `07-assets.mjs`, `08-shoot.mjs`, `09-clean.mjs`: render a WordPress site on a jailed host with
  `wp server`, sanitize to root-relative, copy assets off disk, shoot offline, strip the loader.
  The README there has twelve hard-won gotchas.
- bk-stone `workflows/01-content-intake/extract-archive-posts.mjs`: posts from a file backup with no
  database (recycle Chrome every 6 pages).
- bk-ifa-dentistry `docs/dns/set-url-rules.mjs`: Cloudflare URL rewrites for nested WordPress paths.
- bk-ifa-dentistry `scrapers/vimeo.mjs`: domain-locked Vimeo clips (full Chrome UA + site referer).
- bk-dr-nahlah `14-migration-seo-redirects/build_redirects.py`: the Webflow CSV generator (Webflow
  targets only).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md). Scripts and directives are committed; client
capture output follows `scripts/capture.gitignore`.
