# 2026-09-23 — New phone number (817) 767-4188 and the GoHighLevel number pool

Asked: "update the Westlake with this phone number +1 817-767-4188" and add the number pool
script (`…/loc/AtD362nKfN6w4mwob4iV/pool/1ULKyOcYiRRAikT9TnhK/number_pool.js` +
`user_session.js`). Scope, confirmed with Alejandro: **production in place now, plus staging**.
The BugHerd pass stays on staging, still waiting on its go.

## Done

- **Source** (`site-src/`, 13 files) and the rebuilt `final-site/`: `(817) 383-8361` →
  `(817) 767-4188`, `tel:+18173838361` → `tel:+18177674188`, and the JSON-LD `+1-817-767-4188` in
  `seo.json`. The diff has only phone lines in it.
- **Production** `https://westlaketxmedspa.com`: `swap-phone.mjs --apply` changed 125 strings on
  13 pages plus the shell's `site.js` (the GHL form fallback's `PHONE`), then published
  (seq 19, `{"publishedPages":13}`). `set-dni-pool.mjs --apply` added the pool and session
  helper to Embed Origins `siteScripts` after Sienna and Termly, and granted
  `services.leadconnectorhq.com` + `services.msgsndr.com` in `connectOrigins`. No consent hold,
  per the 2026-09-22 client instruction.
- **Staging** `https://staging.westlaketxmedspa.com`: `swap-phone.mjs --apply` changed 235 strings
  on 24 pages plus the shell, and published `{"publishedPages":24}`. **No pool**: the script
  refuses the staging host.
- Backups: `05-instatic-upload/.tmp/backup-<host>-2026-09-23-pre-phone/`.
- Commit `309b7647`.

## Verified

Live HTML on all 13 production routes: old number 0, new number 4–8 per page, every `tel:` is
`+18177674188`, `number_pool.js` and `user_session.js` tags present, CSP `script-src` has
`backend.leadconnectorhq.com` and `connect-src` has `services.leadconnectorhq.com`. The published
`site.js` bundle carries `767-4188` only. `verify-live.mjs` fails only on the 11 treatment
routes that exist on staging alone (expected until promotion). Staging spot-checked on 4 pages:
old 0, new present, pool 0.

**Not verified: that the pool swaps.** `number_pool.js` fetches its forwarding number at runtime,
so the only proof is a real visit, and each fresh visit uses up a pool number. If you need
proof, run a single-visitor walk like dr-nahlah's `dni-proof.mjs`, clearing cookies once only.

## Next

- Prove the swap once (above), or check in GHL that `(817) 767-4188` is this pool's
  forwarding number. If it is not, the page keeps showing 767-4188 and nothing is tracked.
- Promoting staging later leaves the pool in place, because plugin settings are not part of the
  page push. Still check the tag after the promotion.

## Gotchas

- `verify-live.mjs` reads the local build's route list, which is 24 pages since the BugHerd pass,
  so against production it reports 11 × HTTP 404 until staging is promoted. Those are not
  regressions.
- The number also lives in the shell's `site.js` (the form fallback), and a page-node sweep
  misses it.

## Version Control

Tracked. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
