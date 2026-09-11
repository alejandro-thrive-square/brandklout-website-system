# Institute for Advanced Dentistry — runbook index

One row per run, newest first. Read the rows you need, not the whole history.

| Date | Run | Summary |
| :--- | :--- | :--- |
| 2026-09-11 | [ghl-form-and-cutover](2026-09-11-ghl-form-and-cutover.md) | GoHighLevel form replaces Fluent #1/#6 on 58 pages (gate all ok). Nameservers switched: email intact, apex on Instatic, `www` was down (Error 1000) pending a CNAME to Railway. |
| 2026-09-11 | [wordpress-url-parity](2026-09-11-wordpress-url-parity.md) | Instatic cannot route nested page URLs, so 6 Cloudflare rewrites + 3 redirects in `docs/dns/URL-RULES.md` keep every WordPress URL; `verify-wp-urls.mjs` shows 61/61 resolve. |
| 2026-09-11 | [wordpress-clone-to-instatic](2026-09-11-wordpress-clone-to-instatic.md) | WordPress site cloned as it is into a new Instatic instance on Railway (59 pages, 766 assets, all scripts replayed; gate vs live WordPress: median pixel diff 0.28% at 1440, 0.00% at 390); scrape refreshed and proven complete. Form, nested URLs and PUBLIC_ORIGIN open before cutover. Carries **gotchas**. |
| 2026-09-11 | [email-dns-check](2026-09-11-email-dns-check.md) | Email is Google Workspace + Brevo, not on the WP host, so it survives the move if the new Cloudflare zone gets the records in `docs/dns/ifadentistry.com-email.zone` before the nameserver switch. |
| 2026-09-10 | [rebuild-current-site-scrape](2026-09-10-rebuild-current-site-scrape.md) | Rebuilt the gitignored scrape output lost in the worktree cleanup: mirror, 237 media files, 56 screenshots, all 10 Vimeo clips (the locked ones needed a real Chrome UA, not VPN-off). |

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
