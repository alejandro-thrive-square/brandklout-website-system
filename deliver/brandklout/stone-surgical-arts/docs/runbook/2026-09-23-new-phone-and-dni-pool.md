# 2026-09-23 — New phone number (817) 767-4188 and the GoHighLevel number pool

Asked: "update the Westlake with this phone number +1 817-767-4188" and add the number pool
(`…/loc/AtD362nKfN6w4mwob4iV/pool/1ULKyOcYiRRAikT9TnhK/number_pool.js` + `user_session.js`).
It was first applied to the **med spa** (westlaketxmedspa.com) by mistake. "Westlake" meant
**this** site. The med spa was reverted the same hour (live and in git, in `bk-stone-med-spa`),
then the change was made here. Scope, as agreed: production in place, plus staging.

## Done

- **Source** (`site-src/`, 14 files) and the rebuilt `final-site/`: `(817) 918-3666` →
  `(817) 767-4188`, `tel:+18179183666` → `tel:+18177674188`, and `+1-817-767-4188` in
  `seo.json`. The only content changes are phone lines. Some `final-site` files also lost stray
  CRLF line endings. The two `(817) 383-8361` mentions in comments are the sister practice's
  number and were left alone. The archive copies in `01-content-intake/.tmp/` were left alone too.
- **Production** `https://www.dfwsurgicalarts.com`: `set-dni-pool.mjs --apply` added the pool and
  session helper to Embed Origins `siteScripts` after Sienna and Termly, and granted
  `services.leadconnectorhq.com` + `services.msgsndr.com` in `connectOrigins`. There is no consent
  hold, per the 2026-09-22 instruction. Then `swap-phone.mjs --apply` changed 437 strings on
  52 pages and published (seq 39, `{"publishedPages":52}`).
- **Staging** `https://staging.dfwsurgicalarts.com`: `swap-phone.mjs --apply` changed 459 strings
  on 54 pages and published. **No pool**: the script refuses the staging host.
- `verify-live.mjs` fixed: it was checking the first script on the page, which has been Termly's
  consent script since 2026-09-22, and so reported "no `js` bootstrap / no drawer logic" on a
  healthy site. It now checks `entries/site-*.js`.
- Backups: `21-instatic-upload/.tmp/backup-<host>-2026-09-23-pre-phone/`.

## Verified

Every route's live HTML: production 52/52 and staging 54/54 have no `918-3666` and do have
`767-4188`. Pool tags are on 52/52 production pages and 0 staging pages. The production CSP
`script-src` has `backend.leadconnectorhq.com`, and `connect-src` has
`services.leadconnectorhq.com`. `verify-live` fails only on `/privacy-policy` and
`/terms-of-service`, which exist on staging alone.

**Not verified: that the pool swaps.** `number_pool.js` fetches its forwarding number at runtime,
and every fresh visit uses up a pool number. Prove it with one single-visitor walk (dr-nahlah
`dni-proof.mjs`, clearing cookies once), or check in GHL that `(817) 767-4188` is this pool's
forwarding number.

## Gotchas

- **"Westlake" is ambiguous.** Both Stone sites are at the Westlake address, and the med spa is
  literally *Westlake* Medical Aesthetics. Ask which domain before touching either one.
- `verify-live.mjs` used to report `site.js` failures because of the ordering bug above. If it
  names `site.js` again, check which script it fetched before believing it.

## Version Control

Tracked. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
