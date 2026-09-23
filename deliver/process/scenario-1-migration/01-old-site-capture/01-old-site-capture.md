# Website Migration · 01 Old-Site Capture

## Purpose

Take a complete, safe copy of the client's old website before anything changes: every page as
text, desktop and mobile screenshots, every asset, every URL it ever had, its email DNS, its
trackers and its blog. The old site will disappear at cutover. What is not captured here is lost.

## Inputs

- Signed migration scope and the client's Asana task (Sales handoff).
- Old site URL(s), and the old domain if it differs from the new one.
- Access if the client has it: WordPress admin, host panel or SSH, a site backup, the registrar
  login, Google Search Console. None of it is required to start.
- The client's shared drive id from `deliver/docs/GOOGLE_DRIVE.md`.

## Checklist

- [ ] Client folder and sparse checkout exist; `capture.gitignore` copied in
- [ ] Old site probed: platform, host, reachable, bot wall, redirects, compromised or not
- [ ] Every page scraped to markdown + JSON
- [ ] Desktop (1440) and mobile (390) full-page screenshots of every page
- [ ] Every asset downloaded and catalogued; media library originals pulled
- [ ] Verbatim mirror taken and scanned for malware
- [ ] URL inventory built from sitemap + crawl + Wayback CDX (+ WXR, + Search Console)
- [ ] Email DNS snapshot taken over DoH (before ANY nameserver change)
- [ ] Tracking inventory taken from rendered pages
- [ ] Blog exported to `posts.json` for the Instatic collection
- [ ] Capture uploaded to the client's shared drive; link in the runbook
- [ ] Content findings listed for a client ruling (wrong phones, stale doctors, demo pages)

## Steps

Work in this step's `output/` (the client's copy: `deliver/brandklout/<client>/scenario-1-migration/01-old-site-capture/output/`). Run `npm install` once in
`scripts/` in this step folder (puppeteer-core; Chrome is the installed one).
Run from this step folder (the client's copy of `01-old-site-capture/`); below, `S=scripts`. Redirect Node output to a file: Node 24
on Windows dies when stdout is a pipe.

1. **Set up.** Copy `$S/capture.gitignore` to `capture/.gitignore`. New client folder: add it to
   the sparse cone (`git sparse-checkout add ...`) and add an empty `[<client>]` section to
   `~/.webzite/.env` before `node scripts/env-sync.mjs`.
2. **Probe the old site.** `curl -sI https://<old>/` and `curl -sI https://www.<old>/`. Note the
   platform (look for `wp-content`, `x-powered-by`, Webflow, Squarespace), the host, redirects,
   `x-suspended-vhost`, a captcha page (`sgcaptcha`), and whether `/wp-json/` answers.
3. **Scrape every page.**
   `python $S/scrape_site.py --site https://<old> --out scrape --save-html > scrape.log`
   Reads robots.txt and sitemaps, falls back to a crawl. Writes `pages/*.md`, `data/*.json`,
   `site-data.json`, `media-manifest.csv`.
4. **Screenshot every page, desktop and mobile.**
   `node $S/screenshot-pages.mjs --urls scrape/site-data.json --out screenshots > shots.log`
   Default widths 1440 and 390, reduced motion, lazy images forced, scroll reveals shown. Also
   writes a rendered-text `pages/<slug>.md` (what JavaScript showed). Shard big sites with
   `--shard 0/2` and `--shard 1/2` in two terminals.
5. **Extract every asset.**
   `python $S/extract_assets.py --site https://<old> --out assets --html-dir scrape/html > assets.log`
   then `python $S/catalogue_assets.py --dir assets --site <old>`. Gets srcset variants, WordPress
   originals, CSS backgrounds, icons, inline SVGs, PDFs and YouTube/Vimeo ids.
6. **Mirror the site verbatim** (WordPress: also pulls the media library originals).
   `node $S/mirror-site.mjs --origin https://<old> --out mirror > mirror.log`
   then `node $S/verify-mirror.mjs mirror/site > verify-mirror.log`. Keep this copy: it is the
   evidence of the old site and the source of any verbatim clone or stand-in.
7. **Scan every mirror before anyone opens it.**
   `node $S/scan-mirror.mjs mirror/site --host <old> > scan.log`
   It fails on executables, known injection markers (decoded blobs included) and obfuscated
   inline loaders, and lists every external script host. A failure means: stop, do not open the
   mirror in a normal browser, tell Alejandro, follow the compromised-host conditional below.
8. **Build the URL inventory.** Wayback first, then merge:
   `node $S/wayback-cdx.mjs <old-domain> --out wayback > wayback.log`
   `node $S/build-url-inventory.mjs --from scrape=scrape/site-data.json --from wayback=wayback/wayback-paths.txt --out . --check https://<old> > inventory.log`
   Add `--from wxr=recovered/urls.txt` and `--from gsc=gsc-pages.csv` when you have them. The
   Wayback sweep finds pages the live crawl cannot see (29 on Dr. Nahlah, 160 on West LA).
9. **Snapshot the email DNS.** Before anyone touches nameservers:
   `node $S/email-dns-audit.mjs <old-domain> --out ../../../docs/migration > email-dns.log`
   Writes `email-dns-<domain>.md/.json` and `<domain>-email.zone` (BIND, for the Cloudflare
   import). Ask the client who hosts email and which DKIM selectors they use; re-run with
   `--selectors` for any the script did not find.
10. **Take the tracking inventory.**
    `node $S/tracking-inventory.mjs --urls scrape/site-data.json --out tracking --limit 15 > tracking.log`
    Include the home page, a contact or booking page and a blog post in the sample. Decide per
    tag: keep, replace or drop. Record who owns each account (GA4, Ads, GTM, GHL, CallRail).
11. **Export the blog.** Best source first:
    `node $S/export-posts.mjs --wxr recovered/content.xml --prefix /blog --out posts > posts.log`
    or `--rest https://<old>` (live WordPress) or `--scrape scrape/site-data.json` (last resort).
    `posts.json` feeds the Instatic collection import (see Tools); `posts-redirects.csv` feeds
    the redirect map in step 02.
12. **Upload the capture to the client's shared drive.** `scripts/drive.mjs` only reads, so upload
    `capture/` (screenshots, assets, mirror, recovered) through the Drive web app or Drive for
    Desktop into `Old Site Capture/<YYYY-MM-DD>/`. Put the folder link in the run file. Images are
    gitignored and die with the worktree.
13. **Write the summary** at `deliver/brandklout/<client>/docs/migration/old-site-capture.md`:
    counts (pages, posts, assets, URLs by source), platform and host, email provider, trackers,
    content findings for a client ruling, and the drive link.

## Conditionals

- **If the old host is down, suspended or behind a bot wall**, then capture from the Wayback
  Machine: `node $S/wayback-capture.mjs --domain <old> --paths wayback/wayback-paths.txt --out wayback --shots`.
  It picks the LARGEST 200 capture per URL (recent ones are often the host's own bot page) and
  paces itself (7 s, backoff 45/120/240 s). Record the capture date of each page.
- **If you have SSH but the site cannot be crawled** (captcha, domain-level redirect, jailed
  account), then export on the server without running the site's code:
  `WP_SSH_HOST=… WP_SSH_USER=… WP_SSH_PORT=… WP_SSH_KEY=… bash $S/wp-ssh-export.sh '~/www/<old>/public_html' > export.log`,
  then scp `~/recovery-tmp/*` into `capture/recovered/`. For rendered pages, follow the on-box
  `wp server` method in bk-mason-park-kids `workflows/01-site-recovery/README.md`.
- **If the site is compromised** (scan fails, strange plugins, overlays, redirects only for
  anonymous visitors), then: never log in to wp-admin from your own browser profile; check the live
  site only as an anonymous visitor in a fresh browser; export content over SSH with
  `--skip-plugins --skip-themes`; never download PHP; write
  `docs/security-incident-<date>.md`; tell Alejandro and the client the same day; revoke any
  recovery key when done.
- **If the client's site must stay up while the host is dying and the new site is not ready**, then
  clean the mirror (strip the loader, add a real `404.html`), pass
  `scan-mirror.mjs <dir> --host <old> --strict`, and serve it on Cloudflare Pages with
  `tools/cloudflare-launch/pages-mirror.mjs`.
- **If the client only has a file backup and no database** (Stone), then extract posts from the
  backup's HTML trees by hand into the `posts.json` shape; do not regenerate text that was rewritten
  for legal reasons.
- **If the old site is on Webflow**, then scrape and screenshot as usual, and export the CMS
  collections as CSV from the Webflow dashboard instead of `export-posts.mjs`.
- **If Vimeo clips answer 401**, then fetch them with a full Chrome user agent and the old site as
  referer (the domain lock checks the user agent, not the IP).
- **If the old domain is not the new domain**, then write both in the summary: step 02 needs a
  separate Cloudflare zone for the old domain.

## Do / Don't

- Do run the Wayback sweep on every migration. If the Archive is offline, re-run later; never skip it.
- Do capture mobile. No client before 2026-09-23 had the old site at 390 px.
- Do scan every mirror and every recovered bundle, and prove a live WordPress site only from a fresh,
  anonymous browser (the Mason Park plugin hid from admins and from devtools).
- Do keep `db.sql.gz`, `content.xml` and anything with credentials out of git.
- Don't open an unscanned mirror in your normal browser, and don't deploy one.
- Don't trust an HTTP sweep of a static mirror: without `404.html` every missing file answers 200.
- Don't change DNS, nameservers or the old host in this step. Capture only.
- Don't pipe Node output; redirect it to a file.

## Tools

All in `scripts/` in this step folder (see its README for origins):

- `scrape_site.py`: every page to markdown and JSON, from sitemaps or a crawl.
- `screenshot-pages.mjs`: full-page 1440 + 390 screenshots and rendered-text markdown.
- `extract_assets.py`, `catalogue_assets.py`: download and catalogue every asset.
- `mirror-site.mjs`, `verify-mirror.mjs`: verbatim file:// mirror and its completeness check.
- `scan-mirror.mjs`: malware and injected-script gate; external script hosts list.
- `wayback-cdx.mjs`, `wayback-capture.mjs`: archived URL list; page recovery from the Archive.
- `build-url-inventory.mjs`: merged URL inventory with provenance and live status.
- `email-dns-audit.mjs`: email DNS snapshot, markdown checklist and BIND import file.
- `tracking-inventory.mjs`: trackers and tags from rendered pages.
- `export-posts.mjs`: blog to `posts.json` from WXR, REST or the scrape.
- `wp-ssh-export.sh`: WordPress content export over SSH without loading plugins.
- Collection import into Instatic: `deliver/process/tools/instatic-api-sync/` (collections need a
  post-type table, a template page and two-segment entry routes; each row is published separately).
- Drive map: `deliver/docs/GOOGLE_DRIVE.md`; `node scripts/drive.mjs ls|pull` to read.

## Outputs

Under `deliver/brandklout/<client>/`:

- `output/scrape/` (pages/*.md, data/*.json, site-data.json): committed
- `output/screenshots/w1440/`, `w390/`: drive only
- `output/assets/` (catalogue committed, downloads drive only)
- `output/mirror/` and `scan-mirror-report.json`: the mirror goes to the drive only
- `output/url-inventory.txt`, `url-inventory.csv`, `wayback/wayback-paths.txt`
- `output/tracking/tracking-inventory.md`
- `output/posts/posts.json`, `posts-redirects.csv`
- `docs/migration/email-dns-<domain>.md`, `.json`, `<domain>-email.zone`
- `docs/migration/old-site-capture.md` (the summary and the drive link)

## Evidence

- bk-mason-park-kids/2026-08-27-later-pediatric-site-recovered-new-client-folder.md (SSH recovery, 40 pages, WXR, 779-file mirror)
- bk-mason-park-kids/2026-09-14-domain-masonparkpediatricdental-live.md (ClearFake loader, Pages stand-in, 404.html trap)
- bk-mason-park-kids/2026-09-09-the-whole-site-on-instatic-215-pages.md (157 posts from the WXR)
- bk-stone/2026-09-09-the-whole-archive-thirty-nine-articles-published.md (39 posts from the client backup)
- bk-stone/2026-09-08-the-journal-published-ce2a4f03-and-trap-27.md (Wayback yielded 3 posts; largest-capture rule)
- bk-west-la-implants/2026-09-10-homepage-built-and-instatic-instance-provisioned.md (91-URL scrape, 774-file asset pull, 46 posts)
- bk-ifa-dentistry/2026-09-10-rebuild-current-site-scrape.md (mirror, 777 assets, Vimeo user agent)
- bk-ifa-dentistry/2026-09-11-email-dns-check.md (Google Workspace + Brevo records, DoH)
- bk-dr-nahlah/2026-08-17-latest-completed-dr-nahlah-wp-webflow-301-redire.md (Wayback found 29 URLs)
- bk-mason-park docs/security-incident-2026-08-24.md (fake plugin hid from admins; anonymous check only)

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
