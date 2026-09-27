# 2026-09-24 - PRODUCTION LAUNCH: masonparkpediatricdental.com serves the new site

The user asked to back up production and push staging to production. There is one Instatic
instance. Staging and production are two domains on the same Railway service, so the launch moved
the domain, not the content. **Since 22:31 UTC, `masonparkpediatricdental.com` serves the Instatic
site** (the one staging showed), no longer the old WordPress static copy on Cloudflare Pages.

### Backups (all taken before any change)

`C:\Users\ACER\Backups\mason-park-kids\2026-09-24-prelaunch\` (README inside says how to restore):
- `old-production-wordpress-mirror-clean.zip`: the site that was live. It is also still deployed as
  Pages project `mason-park-kids-wp`, deployment `a5475d72`, at `mason-park-kids-wp.pages.dev`.
- `cloudflare-zone-masonparkpediatricdental.json`: every DNS record, SSL mode, routes and the Pages
  domains, pre-launch.
- `instatic-api-snapshot.json`: `backup-site.mjs`, shell seq 59, 215 pages, 186 media.
- DB: `/app/storage/backups/cms-2026-09-24-pre-production-launch.db` on the Railway volume (1.78 GB,
  VACUUM INTO via `db-backup-prelaunch.mjs`, base64-shipped so no quote survives two shells).
- Git tag `mason-park-kids-prelaunch-2026-09-24` (local, not pushed).

**Rollback:** in zone `190398a3…`, point the apex and `www` CNAMEs back at `mason-park-kids-wp.pages.dev`,
proxied (both are still Pages custom domains), and delete the two Worker routes. Takes about 2 minutes.

### The cutover

1. **Railway** (`railway-domains.mjs --create`): apex and `www` custom domains, port 8080. CNAME
   targets are `moxr4blo` / `vettcdkx.up.railway.app`.
2. **PUBLIC_ORIGIN** = apex, www, staging, railway host. Deployment `be1f493e` came up SUCCESS; staging
   was unaffected.
3. **Canonical:** `configure-seo.mjs` SITE -> `https://masonparkpediatricdental.com` (`--apply`). That was
   not enough, because all 215 `brandklout.open-graph` per-page overrides carried their own
   `pediatricdentistkatytx.com` url. `rehost-og-overrides.mjs` rewrote only the host of each (so
   `populate-seo.mjs` did not regenerate descriptions), then `publish.mjs`. `populate-seo.mjs` SITE changed too.
4. **DNS:** `_railway-verify` TXT for apex/www, then CNAMEs -> Railway, DNS only. Both certificates were
   **VALID within ~1 minute**. Apex/www were then proxied; SSL stays **Full (strict)**.
5. **Edge Worker `masonparkpediatricdental-edge`** on `masonparkpediatricdental.com/*` and `www…/*`,
   routes **fail open** (`workflows/.tmp/production-edge/`: `build-map.py` -> `build-worker.mjs` ->
   `worker.js`; `test-worker.mjs` for local tests):
   `www` 301s to the apex; **170 old WordPress URLs 301** (157 blog posts `/<slug>/` -> `/blog/<slug>/`,
   13 retired pages); `/robots.txt` and a 215-URL `/sitemap.xml`, which Instatic did not serve; everything
   else is `fetch(request)` to Railway.
6. `sites.json` adminUrl is now the apex. Temp CF token `c892fd5e…` revoked.

### Verified

- `production-edge/verify.mjs`: **all pass**. 5 pages 200 with the apex canonical; www 301; all 170
  old URLs 301 to pages that answer 200; robots; sitemap 215 URLs; staging and railway host 200.
- `check-origins --all`: apex, staging and railway host OK. www redirects to the apex.
- `render-prod.mjs` (Chrome, 1440 + 390, 4 pages): images decode, Marcellus painted, no overflow.
  The only console error is **Cloudflare Web Analytics' auto-injected beacon, blocked by Instatic's
  CSP**. It is harmless but noisy; turn off automatic Web Analytics for the zone in the dashboard.

### Still open, not blockers the user raised

- **Hours in the structured data are still unconfirmed by the practice** (since 09-21).
- BugHerd #34 (no enquiry form; needs the GHL URL), #38, #82, #174/#176/#182 (Drive auth).
- `pediatricdentistkatytx.com` -> here is prepped and waits on the Squarespace NS change.
- **Staging is not a separate copy.** An edit made "on staging" is live in production at once. A real
  staging environment is Scenario 0's model (a duplicated Railway env, with its own volume).
- Submit `https://masonparkpediatricdental.com/sitemap.xml` in Search Console.

### Gotchas

- **The Open Graph plugin's per-page overrides store absolute URLs.** Changing `siteUrl` leaves 215
  canonicals on the old host. `rehost-og-overrides.mjs` is the fix; check a rendered page, not the setting.
- **Bash heredocs halve backslashes in Python too**, not only in `.mjs`: `'\\'` became `'\'` and a `\n`
  inside a match string became `n`. Write the file with the editor.
- `import-pages.mjs --only` takes a comma-separated list now.

## Version Control

Tracked with the client runbook, per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
