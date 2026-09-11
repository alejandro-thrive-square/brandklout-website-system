# Institute for Advanced Dentistry — standing runbook

Live state of this worktree (`bk-ifa-dentistry`). Run history is in [runbook/INDEX.md](runbook/INDEX.md).

## Where things are

- **LIVE since 2026-09-11 ~22:20Z**: `https://www.ifadentistry.com` serves the Instatic clone of the WordPress site (Railway project `Institute for Advanced Dentistry`, fallback host `https://institute-for-advanced-dentistry-production.up.railway.app`). The apex 301s to `www`. Admin: `https://www.ifadentistry.com/admin`. The pipeline is at `workflows/21-instatic-upload/21-instatic-upload.md`; the top section is this client's, and the rest is sibling history kept for its traps.
- **DNS / email**: Cloudflare zone `223386e4…` on Brandklout's account, nameservers `ajay`/`ruth` set at Squarespace (whose own DNS records are now inactive; leave them). Email records are intact: Google Workspace plus Brevo. State and scripts: [`dns/DNS-CUTOVER.md`](dns/DNS-CUTOVER.md), [`dns/URL-RULES.md`](dns/URL-RULES.md), `dns/set-url-rules.mjs`, `dns/set-redirect-rules.mjs`. The latest run is [runbook/2026-09-11-cloudflare-conflicts.md](runbook/2026-09-11-cloudflare-conflicts.md).
- **Contact form**: the practice's GoHighLevel form on 58 pages (gate `verify-ghl-form.mjs`).
- **Scrape**: `workflows/01-content-intake/.tmp/current-site-scrape/current-site-inventory.md`, which is now the only copy of the WordPress site we control.
- **Local only, not in git**: `site/` (a working `file://` mirror), `raw-html/`, `screenshots/desktop/`, `media-library/` (237 WP originals plus `vimeo/`, `vimeo-instatic/` re-encodes, `vimeo-posters/`), and `21-instatic-upload/.tmp/` except the media map. If they are missing, rebuild them; see the intake directive's Version Control section.

## Open

- **Refer a Patient** (`patient-referrals`, Fluent #3) still posts to WordPress `admin-ajax.php`, which no longer exists at this domain. It needs its own GHL form, or a decision to drop it.
- **After WordPress is retired**: drop `a:bill.wordkeeper.net`, `mx` and `a` from SPF. Cancel the agency's hosting only once the client confirms nothing else lives there.
- `verify-live-wp.mjs` compares against www.ifadentistry.com, which is Instatic now. Retarget it or retire it.
- Checks to re-run after any change: `verify-wp-urls.mjs https://www.ifadentistry.com`, `verify-ghl-form.mjs https://www.ifadentistry.com`, and `20-instatic-domain-origins/check-origins.mjs --all`.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
