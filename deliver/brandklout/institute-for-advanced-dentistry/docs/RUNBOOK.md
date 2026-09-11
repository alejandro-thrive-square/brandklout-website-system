# Institute for Advanced Dentistry — standing runbook

Live state of this worktree (`bk-ifa-dentistry`). Run history is in [runbook/INDEX.md](runbook/INDEX.md).

## Where things are

- **Stage**: the WordPress site is cloned, as it is, onto its own Instatic instance: `https://institute-for-advanced-dentistry-production.up.railway.app` (admin `/admin`), 59 pages, published 2026-09-11. Start at `workflows/21-instatic-upload/21-instatic-upload.md` (the top section is this client's; the rest is sibling history kept for its traps).
- **Scrape**: `workflows/01-content-intake/.tmp/current-site-scrape/current-site-inventory.md`. Refreshed 2026-09-11 (59 pages incl. the new post), proven complete by `scrapers/verify-mirror.mjs`.
- **Local only, not in git**: `site/` (a working `file://` mirror), `raw-html/`, `screenshots/desktop/`, `media-library/` (237 WP originals plus `vimeo/`, `vimeo-instatic/` re-encodes, `vimeo-posters/`), and `21-instatic-upload/.tmp/` except the media map. If they are missing, rebuild them; see the intake directive's Version Control section.

- **DNS / email**: [`dns/DNS-CUTOVER.md`](dns/DNS-CUTOVER.md). The domain is still on the agency's Cloudflare account. Brandklout's new zone is `initializing` and holds no records yet.

## Open

- Before any nameserver switch at Squarespace: import `dns/ifadentistry.com-email.zone` into the new zone, and point `@`/`www` at the WordKeeper origin or at Instatic. The Cloudflare proxy IPs will not work as an origin.
- Before the domain points at Instatic: the contact form has no destination (it posts to WordPress `admin-ajax.php`), the nested WordPress URLs need the Cloudflare rules in [`dns/URL-RULES.md`](dns/URL-RULES.md) (written and proven 61/61 by `verify-wp-urls.mjs`, not yet created in the zone), and `www.ifadentistry.com` must be added to `PUBLIC_ORIGIN`. Details in [runbook/2026-09-11-wordpress-clone-to-instatic.md](runbook/2026-09-11-wordpress-clone-to-instatic.md).
- The 10 Vimeo clips are re-hosted in the Instatic media library; they still also live on the outgoing agency's Vimeo account (Gilleard Marketing), which no longer matters to the clone.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
