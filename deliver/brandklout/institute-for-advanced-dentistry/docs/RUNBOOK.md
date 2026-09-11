# Institute for Advanced Dentistry — standing runbook

Live state of this worktree (`bk-ifa-dentistry`). Run history is in [runbook/INDEX.md](runbook/INDEX.md).

## Where things are

- **Stage**: 01 content intake. The current site (ifadentistry.com, WordPress + Bricks) is scraped. Start at `workflows/01-content-intake/.tmp/current-site-scrape/current-site-inventory.md`.
- **Local only, not in git**: `site/` (a working `file://` mirror), `raw-html/`, `screenshots/desktop/` (55 full-page PNGs), `media-library/` (237 WP originals plus `vimeo/`). If they are missing, rebuild them; see the intake directive's Version Control section.

- **DNS / email**: [`dns/DNS-CUTOVER.md`](dns/DNS-CUTOVER.md). The domain is still on the agency's Cloudflare account. Brandklout's new zone is `initializing` and holds no records yet.

## Open

- Before any nameserver switch at Squarespace: import `dns/ifadentistry.com-email.zone` into the new zone, and point `@`/`www` at the WordKeeper origin or at Instatic. The Cloudflare proxy IPs will not work as an origin.
- Nothing is open on the scrape. All 10 Vimeo clips, including the 4 patient testimonials, are local in `media-library/vimeo/`. They still live on the outgoing agency's account (Gilleard Marketing), so re-host from these files.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
