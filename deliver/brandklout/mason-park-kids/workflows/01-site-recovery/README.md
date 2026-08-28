# 01 — Site recovery (pediatricdentistkatytx.com)

Get the pediatric site's content and design off a SiteGround account we can only reach over SSH,
safely, so it can be rebuilt as static the way the main site was.

Client context: [`../../docs/project-overview.md`](../../docs/project-overview.md).
**Read [`../../docs/security-incident-2026-08-27.md`](../../docs/security-incident-2026-08-27.md)
before running anything here** — the host is actively compromised.

## Status: content and design recovered

| Artifact | What it is |
| :--- | :--- |
| `recovered/content.xml` | 12.7 MB WXR export — 40 pages, 157 posts, 580 attachments, verbatim copy |
| `recovered/db.sql.gz` | 21.9 MB full database dump |
| `recovered/mirror/` | **779 files** — all 40 pages plus the CSS, JS, fonts and images they use, fully offline |
| `screenshots/w1440/` | 40 full-page PNGs |
| `pages/<slug>/` | `rendered.html`, `rendered.txt`, `meta.json` per page |
| `recovered/pages.csv`, `posts.csv`, `media.csv`, `options.txt` | inventories + nav-menu structure |

`recovered/` is gitignored — the DB dump carries credentials and patient-adjacent PII.

## Why it had to be done this way

**The live site cannot be crawled.** Past SiteGround's `sgcaptcha` bot wall every URL on
`pediatricdentistkatytx.com` redirects to `https://mason-park.up.railway.app/` — the *main* site.
15 of 16 probed paths collapse onto that root; the one that escapes, `/wp-content/uploads/`,
answers `429 Site Unavailable`. The redirect is **not** in `.htaccess` and **not** in the database
(`siteurl`/`home` are both correct), so it is set at SiteGround's domain level and we cannot lift
it. Evidence: `probe-report.json`.

**And it cannot be tunnelled.** SiteGround refuses port forwarding — `ssh -L` returns
"administratively prohibited" on every channel — and the SSH account is jailed, with nothing
listening on `127.0.0.1:80` and `ps` restricted.

So the site is rendered *on the box* by a temporary `wp server`, fetched there, and only finished
files travel back.

## Run order

```bash
bash 01-inventory.sh          # read-only survey: docroot, theme, plugins, uploads, DB name
bash 02-triage.sh             # read-only: where the redirect lives, and what should not be there
bash 03-export.sh             # WXR + DB + inventories -> ~/recovery-tmp on the server
#   then scp ~/recovery-tmp/* into recovered/
bash 05-mirror.sh             # renders the 40 pages on the box, tars them
#   then scp+extract recovered/mirror.tar.gz
node 06-sanitize.mjs          # URLs -> root-relative; strip external <script>/<iframe>
node 07-assets.mjs            # copy referenced CSS/JS/img/fonts off the disk (2 passes)
node 06-sanitize.mjs          # again: the CSS only exists after 07, and it has URLs too
node 07-assets.mjs            # again: CSS references fonts and background images
node verify-safe.mjs          # the gate — must pass before anyone opens the bundle
node 08-shoot.mjs             # 40 full-page screenshots from the local mirror
```

`sg.sh` wraps ssh (host/user/port from repo-root `.env`, key from `SG_KEY`, default
`.secrets/sg_pediatric_recovery`). `probe.mjs` and `diag.mjs` are the diagnostics that established
the facts above.

## Safety — what makes this bundle safe to open

`verify-safe.mjs` asserts all of this and exits non-zero if any of it stops being true. Current
run: **8/8 pass.**

1. **No executable code was ever downloaded.** 779 files, not one `.php`, `.htaccess`, `.sh` or
   archive. `07-assets.mjs` allow-lists by extension, refuses executables even when a page
   references them (it refused `/xmlrpc.php` 80 times), and rejects any path that tries to escape
   the docroot.
2. **Nothing runs PHP locally.** The mirror is static files served by a plain Node static server.
3. **External `<script>` and `<iframe>` tags are stripped** — 44 and 76 of them. The injected
   loaders on this site build their payload at runtime from a remote host; with those tags gone
   the saved copy is inert.
4. **All URLs are root-relative** — 13,517 loopback and 1,984 live-domain URLs rewritten — so no
   page reaches for the live host.
5. **Rendering is offline.** Chrome runs with
   `--host-resolver-rules="EXCLUDE 127.0.0.1, EXCLUDE localhost, MAP * ~NOTFOUND"`, so no external
   host resolves at all.
6. **No IOC markers** in any of the 40 pages, before or after sanitising.
7. **Read-only on the server.** Nothing outside `~/recovery-tmp` is written; the site's files and
   database are never modified.

## Capture quality

40/40 pages, all with the full 95-item navigation, no injection markers. Nine distinct assets do
not resolve, and none of them affect layout: four Elementor JS bundles whose filenames carry a
content hash that no longer exists on disk, `wp-emoji-release.min.js`, two Contact Form 7 REST
endpoints, and `admin-ajax.php`. Ten Nunito Sans `.woff2` files are referenced with different
letter-casing than the files on disk; the fallback face renders.

The grey band under the header on interior pages is **faithful** — it is the `tooth-fairy`
page-title panel with no featured image set, not a missing asset.

## Gotchas — every one of these cost real time

1. **curl cannot answer any question about this host.** Every request gets the 202 captcha. Nor
   can `fetch()` from inside a browser session — the redirect lands the document cross-origin and
   CORS hides everything. Only top-level navigation plus CDP Network events sees the truth.
2. **`--host-resolver-rules` is first-match-wins.** `MAP * ~NOTFOUND` placed first black-holes the
   host you are trying to reach, and every page captures as `ERR_NAME_NOT_RESOLVED`. Specific
   rules go before the catch-all; `EXCLUDE` before `MAP *`.
3. **A stale `wp server` is invisible.** The jail restricts `ps`, so `pkill` finds nothing while
   the old process still holds its port — the new server fails to bind and `curl` cheerfully talks
   to the OLD one with the OLD configuration. Two identical, entirely misleading verification
   readings came from this. **Use a fresh random port every run.**
4. **Do not rewrite URLs with a PHP `ob_start` filter.** It only fires while a page-cache drop-in
   happens to be flushing the buffer chain; the moment `WP_CACHE` was set to false it silently
   stopped. The symptom was not "URLs unrewritten" — it was 39 of 40 pages screenshotting as blank
   749px stubs, because Chrome **blocks parsing** on a `<script src>` it cannot fetch. Rewrite
   locally in `06-sanitize.mjs`.
5. **WordPress emits asset URLs port-less** (`src="http://127.0.0.1/wp-includes/…"`) even with
   `WP_HOME` carrying the port, because something in this stack rebuilds them from `SERVER_NAME`.
   That is port 80, nothing listens there in the jail, and wget gives up after two `errno=111`
   lines having fetched no CSS at all. Hence `07-assets.mjs` copying from disk instead.
6. **wget needs `--force-directories` once `--page-requisites` is gone.** Without any recursion
   flag it writes every URL into the current directory by basename, so all 40 pages land as
   `index.html`, `index.html.1`, `index.html.2`…
7. **Never pass `--convert-links` or `--restrict-file-names=windows` here.** Between them they
   drop the `:PORT` from every absolute link they rewrite.
8. **`?` is a glob wildcard.** `tar --exclude='*?*'` matches and therefore excludes *every* file;
   the character class `*[?]*` is what you want. Query strings must also be stripped from saved
   filenames or the tarball will not extract on Windows at all.
9. **MSYS tar and Windows paths do not mix.** An absolute `C:\…` archive path is read as a
   `host:path` remote spec ("Cannot connect to C: resolve failed"), and passing one to `-C` gets
   its backslashes mangled. Run from `cwd` with a relative archive name.
10. **`openssl req -subj "/CN=…"` needs `MSYS_NO_PATHCONV=1`** in Git Bash, or the leading slash
    becomes a Windows path.
11. **The theme hides its own navigation.** `tooth-fairy` keeps the main menu at
    `visibility:hidden` until its JS adds `.inited` to `.sc_layouts_menu`, and that init never
    completes on this broken install. Without forcing the class you get 40 pages with no nav —
    the same trap the main site's capture hit.
12. **PHP memory.** `trx_addons` blows the stock 256M rendering the homepage and every page 500s.
    Raised via `PHP_INI_SCAN_DIR`, which needs a **leading colon** (`:$HOME/…`) or the default ini
    directory is replaced and every extension disappears with it.

## Content findings worth a client ruling

- **Two different phone numbers on the same page.** The header bar and footer say
  **(281) 578-7100**; the About Us body text says **+1 281-769-8878** — which is the *main*
  practice's number.
- **Dr. William Sung is still named** in the About Us copy. He was deliberately removed from the
  main site's rebuild; confirm whether that applies here too.
- **Roughly a dozen of the 40 pages are ThemeREX demo pages** never part of the real site:
  `blog-masonry`, `blog-portfolio`, `blog-list`, `blog-standard`, `blog-grid`, `shop`, `cart`,
  `my-account`, `wishlist-page`, `pricing`, `appointment`, `newsletter-popups`. The main site's
  rebuild dropped the equivalents.
- **`our-team-copy` and `dental-saving-plan`** look like stale duplicates of `our-team` and
  `dental-savings-plan`.
- **Office hours** here read Mon 9–6, Tue 8–5, Wed 9–6, Thu 8–5, Fri/Sat/Sun closed — check these
  against the main site's still-unresolved hours contradiction.

## Next

1. Decide with Brandklout whether this brand is being kept at all (see the client overview).
2. If yes: rebuild on the
   [`mason-park/workflows/09-static-rebuild/`](../../../mason-park/workflows/09-static-rebuild/README.md)
   component library — same `tooth-fairy` origin, so it should carry over almost unchanged.
3. **Revoke the recovery SSH key** in Site Tools → Devs → SSH Keys Manager when finished.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Scripts and
JSON reports are committed; `recovered/` and `screenshots/` are not (PII, credentials, and binary
assets — see the root `.gitignore`).
