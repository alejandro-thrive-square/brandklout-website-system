# Institute for Advanced Dentistry — runbook index

One row per run, newest first. Read the rows you need, not the whole history.

| Date | Run | Summary |
| :--- | :--- | :--- |
| 2026-09-11 | [email-dns-check](2026-09-11-email-dns-check.md) | Email is Google Workspace + Brevo, not on the WP host, so it survives the move if the new Cloudflare zone gets the records in `docs/dns/ifadentistry.com-email.zone` before the nameserver switch. |
| 2026-09-10 | [rebuild-current-site-scrape](2026-09-10-rebuild-current-site-scrape.md) | Rebuilt the gitignored scrape output lost in the worktree cleanup: mirror, 237 media files, 56 screenshots, all 10 Vimeo clips (the locked ones needed a real Chrome UA, not VPN-off). |

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
