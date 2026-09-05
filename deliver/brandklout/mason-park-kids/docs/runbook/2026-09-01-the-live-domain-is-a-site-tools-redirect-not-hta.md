## 2026-09-01 - THE LIVE DOMAIN IS A SITE TOOLS REDIRECT, NOT .htaccess. WordPress is intact.

The WordPress site at `pediatricdentistkatytx.com` went down (cause still unknown, see below) and a
**temporary redirect** was put in place by the team while the Instatic rebuild finished. The rebuild
IS finished - 54/54 routes 200 at `mason-park-kids.up.railway.app` - so the redirect's original
reason has lapsed.

### Where the redirect lives - this is the thing to remember

**SiteGround Site Tools -> Domain -> Redirects.** It is applied at SiteGround's nginx layer, ABOVE
the account filesystem. **Editing `.htaccess` does nothing** - nginx answers before Apache/PHP is
reached. Proof gathered over SSH:

- `.htaccess` mtime is 2026-06-10 (months stale) and contains no `masonparkdental`, no `railway`,
  and no external `RewriteRule`; only a stock `FRedirect_ErrorDocument` comment block.
- `find ~ -newermt '-3 hours'` returned NOTHING, while a redirect-target change made minutes
  earlier was already live.
- Response signature: `Server: nginx`, `Content-Length: 24`, `0.000s`, `X-Limited: 1`.

### The outage this caused (14+ hours, 31-Aug 13:17 -> 01-Sep 03:28 UTC)

The redirect targeted **`mason-park.up.railway.app`** - the PARENT practice's host, per this
runbook's own top warning - which returns **404**. So 100% of requests were `301 -> 404`: all 54
pages, `/robots.txt`, `/sitemap_index.xml`, every image, apex and `www`, and even WordPress's own
`wp-cron.php` calling itself. Googlebot, bingbot, GoogleOther, Applebot and AhrefsBot all took it
continuously. Retargeted mid-session by the user to `https://www.masonparkdental.com/` (200), which
ends the hard outage but still points the pediatric domain at the adult practice and still collapses
every path to `/`.

**Open recommendation, not yet applied:** target `https://mason-park-kids.up.railway.app` with path
preserved, and make it a **302, not a 301**. A 301 on a deliberately temporary redirect is the one
choice that does permanent damage - browsers cache 301s indefinitely and Google treats many-URLs-to-
one-root as soft-404 deletion rather than consolidation.

**Unfixable tail:** anyone who loaded the site during the broken window has
`pediatricdentistkatytx.com -> mason-park.up.railway.app` cached in their browser and will keep
hitting the dead 404 without contacting the server. Expect "site is broken" reports that do not
reproduce. Nothing can be done server-side; it is an argument for reaching the final state once
rather than cycling targets.

### Why the site originally went down is STILL UNKNOWN

WordPress is fully intact on disk - `wp-config.php`, `wp-admin`, `wp-content` (mod Aug 27) all
present, nothing deleted. But **because nginx 301s every request, PHP never runs**, so the error log
has recorded nothing about the outage since the redirect went up. `~/php_errorlog` holds only
wp-cron noise: 121 warnings for a missing `wp-content/mu-plugins/transient-cleanup.php` include, and
7 WooCommerce/FTP fatals. Diagnosing the real fault requires the redirect off, at least briefly.

### Security: treat as one incident until proven otherwise

Same day, 31-Aug: unauthorised registrar transfer at 05:42 UTC, and a coordinated WordPress
intrusion attempt 13:17-13:19 UTC from `31.134.6.32`, `31.134.5.73`, `212.87.218.141`,
`140.235.168.114` hitting `/wp-login.php`, `/wp-admin/plugins.php` and
`/wp-admin/plugin-install.php?tab=upload` (malicious plugin upload). SiteGround flagged them
`NC:200000` / `NC:010000`. The redirect itself was confirmed by the user as deliberate team action,
so it is NOT part of the suspected compromise.

### SSH access works

`.env` has `HOSTNAME`/`USERNAME`/`PORT` + `.secrets/sg_pediatric_recovery`. Connects as
`u2155-s8yzq05oaqg3@ssh.pediatricdentistkatytx.com -p 18765`, lands on `gtxm1211.siteground.biz`.
Docroot: `~/www/pediatricdentistkatytx.com/public_html`. This is **server access only** - it cannot
reach Site Tools, the Client Area, or the registrar, so it cannot change the redirect or the
nameservers.
