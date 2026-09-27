# 2026-09-27 - A real staging environment: staging.masonparkpediatricdental.com is its own instance

Until today, staging and production were **two domains on one Instatic instance**, so every "staging"
edit was live. The user asked for a proper staging environment. It now exists, built with
[process 21](../../../../process/21-instatic-staging-clone/21-instatic-staging-clone.md):
**`staging.masonparkpediatricdental.com` is its own Railway environment, with its own volume and
database**, seeded from production and de-indexed. **This worktree now publishes to staging by
default;** production is reached only with `PROMOTE=production`.

### Live state

| | |
| :-- | :-- |
| Railway | project `a135c5ec…`, service `d1d1ce4a…`; envs `production` `f9cddccd…` / **`staging` `2433658d-4971-46e9-8dfc-e83cd8c96a2c`** |
| Volume | staging `eca481f9-9c82-4727-8f13-884c83e858d9` at `/app/storage` (production keeps `8a02136a…`) |
| Domain | `staging.masonparkpediatricdental.com` (custom domain `f05ba5ab…`), moved off production's service. CNAME `zy3jhhdl.up.railway.app`, **proxied**, certificate VALID |
| Service domain | minted as `mason-park-kids-staging.up.railway.app` and **deleted before the first deploy** |
| `PUBLIC_ORIGIN` staging | `https://staging.masonparkpediatricdental.com` only |
| `PUBLIC_ORIGIN` production | unchanged: apex, www, staging, railway host. The staging entry is now dead but harmless; removing it restarts production, so it was left |
| Admin users | owner alejandro@ (claimed by setup within seconds of the DNS change), plus gage@ and jessica@ (client role), copied from production with their password hashes, so every login works on both |
| Indexing | Cloudflare response-header rule `afd975c1…` sets `X-Robots-Tag: noindex, nofollow` on the staging host only. Open Graph `siteUrl` = staging, `emitCanonical: false`; AEO Schema `siteUrl` = staging; all 215 per-page OG overrides rehosted to staging. robots.txt is untouched (the managed one is account-wide) |
| Analytics | production loads none (Termly consent only), so there is nothing to guard |

### Gates (all against staging through Cloudflare)

- `diff-sites.mjs` production vs staging: **215/215 content-equivalent, 0 differences** (srcset a=1632 b=0, the known variant loss of a `--media` clone: visually identical).
- `check-noindex.mjs`: exit 0, staging de-indexed, production untouched.
- `verify-staging-clean.mjs --no-analytics` on /, /contacts, /services/invisalign, /blog, /about-us: exit 0. No canonical, `og:url` or meta robots points off staging.
- `check-origins.mjs` on staging: clean; a real login works.
- The one-page chain (`publish-0926c.sh`, /financing) ran end to end against staging: ssh into the staging container, convert, 215 pages read back, publish (00:51 UTC, `draftMatchesPublished`). `diff-sites` afterwards: still 215/215.

### What changed in the tooling

- `insta.mjs`: accepts the `masonparkpediatricdental` hosts; **refuses a production host unless `PROMOTE=production`**.
- `railway-ssh.mjs`: `ENVIRONMENT` follows `INSTATIC_BASE_URL` (staging -> staging container). It exports `PRODUCTION` and `STAGING`, and drops the dead shared `RAILWAY_TOKEN` from the CLI's environment.
- `configure-seo.mjs` / `populate-seo.mjs`: `SITE` is the staging host on staging; `configure-seo` keeps `emitCanonical` off there.
- New: `staging-env.mjs` (create / volume / domain / state), `rw-state.mjs`, `staging-seo.mjs`, `og-export.mjs`, `og-count.mjs`, `users.mjs`, `users-copy.mjs`.
- `upload-media.mjs` (from round five): a same-name, same-size duplicate is reused, not fatal.
- Master `.env` `[mason-park-kids]` `INSTATIC_BASE_URL` = staging (was the production railway host); `env-sync.mjs` run.
- `process/21-instatic-staging-clone/` copied here from `bk-brandklout-website` (the newest copy), with this run's lessons added. `process/20-instatic-domain-origins/sites.json` has staging as its own entry.

### How to work from now on

1. Every chain (`publish-*.sh`) runs against **staging** by default. BugHerd reviews staging.
2. When staging is approved, promote: `PROMOTE=production INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app bash publish-XXXX.sh`,
   then check production (`verify-*.mjs`, one render). **Never run `staging-seo.mjs` or copy plugin settings to production.**
3. A change made by hand in staging's admin is NOT in `home/`. Port it to the files before the next chain runs, or the chain overwrites it.
4. Re-seeding staging from production: process 21 section B, then `og-export.mjs` against production, then `staging-seo.mjs` against staging, then `publish.mjs`.

### Gotchas

- **Plugin runtime data does not travel in an export bundle.** Staging came up with 0 of 215 Open Graph overrides, and `diff-sites` still passed. Now row 7 in process 21.
- **Users do not travel either.** gage@ and jessica@ were copied by `users-copy.mjs`.
- **Importing `insta.mjs` into `railway-ssh.mjs` loads the worktree `.env`**, whose shared `RAILWAY_TOKEN` is dead, and every `railway ssh` answered Unauthorized. The CLI must use its own OAuth login (the fix strips the variable).
- **The local resolver kept the old CNAME target** for the whole session. Requests reached Railway directly, with no Cloudflare and no noindex header. Node gates ran with a `dns.lookup` preload pinning the host to `104.21.77.23`, and Chrome ran with `STAGING_RESOLVE`.
- **Cloudflare's API needs a query string** on PATCH/PUT from here (`10404 No route for that URI`), as process 21 says. The temp token could not be given Transform Rules; the account token writes that phase itself.
- **Publishing staging goes through Cloudflare, which cuts a response off at 100 s.** The chain's publish came back as a Cloudflare 502 HTML page while the server finished the publish. Production's tooling talks to the railway host directly and never saw this. `insta.mjs` `publish()` now waits for `publish/status` to show a newer, matching publish on a 502/503/504/52x.
- **The Cloudflare temp token** `3db46b0a…` (DNS Write) was revoked at the end.

## Version Control

Tracked with the client runbook, per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
