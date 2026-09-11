# Institute for Advanced Dentistry — runbook index

One row per run, newest first. Read the rows you need, not the whole history.

| Date | Run | Summary |
| :--- | :--- | :--- |
| 2026-09-11 | [wordpress-url-parity](2026-09-11-wordpress-url-parity.md) | Instatic cannot route nested page URLs, so 6 Cloudflare rewrites + 3 redirects in `docs/dns/URL-RULES.md` keep every WordPress URL; `verify-wp-urls.mjs` shows 61/61 resolve. |
| 2026-09-11 | [wordpress-clone-to-instatic](2026-09-11-wordpress-clone-to-instatic.md) | WordPress site cloned as it is into a new Instatic instance on Railway (59 pages, 480 assets, all scripts replayed); scrape refreshed and proven complete. Form, nested URLs and PUBLIC_ORIGIN open before cutover. Carries **gotchas**. |
| 2026-09-11 | [email-dns-check](2026-09-11-email-dns-check.md) | Email is Google Workspace + Brevo, not on the WP host, so it survives the move if the new Cloudflare zone gets the records in `docs/dns/ifadentistry.com-email.zone` before the nameserver switch. |
| 2026-09-10 | [rebuild-current-site-scrape](2026-09-10-rebuild-current-site-scrape.md) | Rebuilt the gitignored scrape output lost in the worktree cleanup: mirror, 237 media files, 56 screenshots, all 10 Vimeo clips (the locked ones needed a real Chrome UA, not VPN-off). |

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
