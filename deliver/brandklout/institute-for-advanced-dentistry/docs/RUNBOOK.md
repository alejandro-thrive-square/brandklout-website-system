# Institute for Advanced Dentistry — standing runbook

Live state of this worktree (`bk-ifa-dentistry`). Run history is in [runbook/INDEX.md](runbook/INDEX.md).

## Where things are

- **Stage**: 01 content intake. The current site (ifadentistry.com, WordPress + Bricks) is scraped. Start at `workflows/01-content-intake/.tmp/current-site-scrape/current-site-inventory.md`.
- **Local only, not in git**: `site/` (a working `file://` mirror), `raw-html/`, `screenshots/desktop/` (55 full-page PNGs), `media-library/` (237 WP originals plus `vimeo/`). If they are missing, rebuild them; see the intake directive's Version Control section.

## Open

- 7 of 10 Vimeo clips are domain-locked on the outgoing agency's account (Gilleard Marketing), including the 4 patient testimonials. Ask for the source files, or retry `node vimeo.mjs` with the VPN off.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
