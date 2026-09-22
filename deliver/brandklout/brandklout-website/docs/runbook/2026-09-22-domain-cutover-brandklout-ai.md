## 2026-09-22: brandklout.ai cutover — PUBLIC_ORIGIN set, admin login works on the domain

### Done

- **The new domain is `brandklout.ai`.** Both `brandklout.ai` and `www.brandklout.ai` were already
  attached as Railway custom domains on service `Brandklout`, both Cloudflare-proxied
  (`104.21.58.124` / `172.67.204.10`), both certificates `VALID`, and both already served the site
  and `/admin`. Railway had also switched `RAILWAY_PUBLIC_DOMAIN` to `brandklout.ai`.
- **But nobody could have logged in.** `PUBLIC_ORIGIN` was still
  `https://brandklout-production.up.railway.app` alone, so `check-origins.mjs https://brandklout.ai`
  reported **both** new hosts as `TRAP`: login page renders, login POST answers
  `403 Forbidden: invalid origin`. This is the failure shape
  [`20-instatic-domain-origins`](../../../../process/20-instatic-domain-origins/20-instatic-domain-origins.md)
  exists to prevent — it reads as a password problem and is not one.
- **Set, canonical first, platform host last** (merged, nothing dropped):
  ```
  PUBLIC_ORIGIN=https://brandklout.ai,https://www.brandklout.ai,https://brandklout-production.up.railway.app
  ```
  via `railway variables --service "Brandklout" --set`, which auto-triggered deployment
  `a127e9f6-8501-468e-8366-253554a11490` → `SUCCESS`. Apex is first, so it is what `expectedOrigin()`
  returns and what sets the secure-cookie flag.
- **Proved against the running server, not the dashboard**: `node check-origins.mjs --all` → all
  three Brandklout hosts `OK`, zero `TRAP`, exit 0, and Dr. Nahlah and Mason Park still clean.
- **Proved with a real login**, which is the thing that was actually broken: one
  `POST https://brandklout.ai/admin/api/cms/login` with `Origin: https://brandklout.ai` →
  `200 {"ok":true,"mfaRequired":false}` with a session cookie. `GET /admin/api/cms/users` on that
  session lists both accounts `active` — `alejandro@thrivesquare.com` (owner) and
  `sang@thrivesquare.com` (admin), neither with MFA. **Send Sang `https://brandklout.ai/admin`.**
- **`sites.json` updated**: `adminUrl` is `https://brandklout.ai`, the railway host is the alternate.
  `www` is deliberately *not* listed — `check-origins.mjs` derives the www/apex twin itself.
- **`~/.webzite/.env` `[brandklout-website]` → `INSTATIC_BASE_URL=https://brandklout.ai`**, matching
  the house convention (a client with a live domain uses it; only domainless instances keep the
  railway host). Previous file kept at `~/.webzite/.env.bak-2026-09-22-brandklout-origin`, and
  `node scripts/env-sync.mjs` regenerated the worktree `.env`.

### Next

1. **FormSubmit almost certainly needs re-activating for the new origin.** Every form on the site
   posts to FormSubmit for `sales@brandklout.com`, and it was never activated on the railway host
   either — so the lead forms are silent from `brandklout.ai` too. One labelled test submission,
   then whoever reads sales@ clicks Activate, then a second test to confirm.
2. Tell Sang the admin address changed: `https://brandklout.ai/admin`, same password. The old
   railway link still works and stays working — it is the toolkit's way in.
3. Everything else on [`../RUNBOOK.md`](../RUNBOOK.md) → Next is unchanged.

### Gotchas

- **Railway reports `www.brandklout.ai` as `DNS_RECORD_STATUS_REQUIRES_UPDATE` and it is fine.**
  Railway wants a CNAME to `mr1qdyds.up.railway.app` and reads back nothing, because the record is
  **proxied by Cloudflare** — the orange cloud hides the target, so Railway's check can never see
  its own value. The certificate is `VALID`, the host serves the site, and it accepts the login.
  Do not "fix" it by un-proxying. (Same shape as the apex, which Railway *does* call `PROPAGATED`.)
- **The origin gate passed within ~13s of setting the variable**, before
  `railway deployment list` showed `SUCCESS`. Do not read an early green probe as "the deploy is
  done" — confirm the deployment row separately, as done here.
- **`nslookup` cannot resolve these here** (VPN; times out on UDP and TCP). Query
  `cloudflare-dns.com/dns-query` with `accept: application/dns-json` from Node instead.
- **Five failed logins lock the account.** Verify with exactly one login attempt and read the
  password from the worktree `.env`; never guess it.
- Listing Railway domains needs GraphQL — `domains(projectId, environmentId, serviceId)` with the
  token at `user.accessToken` in `~/.railway/config.json`. `railway status` shows only the one
  `url:` it considers primary, which is not the full list.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). IDs and public URLs only. No secrets.
