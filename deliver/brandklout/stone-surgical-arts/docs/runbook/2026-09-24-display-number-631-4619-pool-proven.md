# 2026-09-24, later — Display number (817) 631-4619; the pool swap works

Alejandro reframed it as the final word: display number **+1 817-631-4619**, and the pool script
`…/loc/AtD362nKfN6w4mwob4iV/pool/1ULKyOcYiRRAikT9TnhK/number_pool.js` + `user_session.js`, with
cookie consent not blocking the swap. This replaces 674-2061 (2026-09-23) and the earlier diagnosis run.

## Done

- `site-src/` (13 files plus `seo.json`): `674-2061` → `631-4619`, rebuilt `final-site/`. Build,
  audit and check-copy all report `FAIL none`.
- `swap-phone.mjs` `MAP` retargeted; `--apply` on production (459 strings, 54 pages, seq 42,
  published) and on staging (459 strings, 54 pages, seq 7, published).
- The pool tags already matched the supplied scripts exactly (`set-dni-pool.mjs` plan: keep/keep).
  Only its header comment changed.

## Verified

- Live HTML on every route: production 54/54 and staging 54/54 have `631-4619`, with no 674-2061,
  767-4188 or 918-3666 left. Pool tags are on 54/54 production pages and 0/54 staging pages.
  Production `verify-live`: `FAIL none`.
- **The swap is proven.** In one headless Chrome visit the banner was left unanswered, so there
  was no consent. `assign-number` returned 201 with forwardingNumber `+18176314619` (GHL had been
  updated) and assigned `(817) 609-8231`. The page's `tel:` links and text showed
  `(817) 609-8231`.
- Consent does not block the pool: Termly runs `autoBlock=off`, the pool tags have no
  `type="text/plain"`/`data-categories`, and the CSP allows `backend.`/`services.leadconnectorhq.com`
  and `services.msgsndr.com`.

## Gotchas

- Each proof visit claims a real pool number; this day used three in total.
- Backups: `21-instatic-upload/.tmp/backup-<host>-2026-09-24-pre-phone/` (the 674-2061 state).
  A second swap today would overwrite them.

## Version Control

Tracked. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
