## 2026-09-28: Old GTM container removed; number pool restored

### Done

- **`GTM-K8N3JK3Q` (the outgoing agency's container) is off production.** Its inline bootstrap
  was registry item `PIqTbM6cgp` in the `src/scripts/site.js` shell asset. The code is now a
  comment, and the id stays so every page's head list still resolves, the same way UserWay was
  removed on 2026-09-12. `tags/remove-old-gtm.mjs` did it (dry run by default; `--apply` writes
  and publishes, and refuses if the draft differs from live). The draft matched live beforehand.
  Published at seq 18, 59 pages.
- `prepare-wp.mjs` now skips any script that mentions `GTM-K8N3JK3Q`, so a rebuild of the clone
  cannot bring it back.
- Staging was not touched. It never ran `K8N3JK3Q` (dropped by the staging runtime), and
  `GTM-5XR78DN7` stays excluded there on purpose.
- **Found while verifying: the GoHighLevel number pool had not run on production since
  2026-09-22.** Commit `5e8d9bc8` ("pools run without consent") removed the consent hold by
  deleting the whole `ghl()` function but left the `ghl()` call. The asset threw
  `ghl is not defined` after GTM had already booted, so GTM looked healthy, but neither the pool
  nor the `<noscript>` iframe ever ran. `site-tags.js` 1.2.1 restores the function without the
  `text/plain` hold (the client's instruction stands). Pushed with `push-tags.mjs --apply` and
  published at seq 19.
- Gate: `node tags/verify-tags.mjs https://www.ifadentistry.com` passes every check. The asset is
  on 59/59 routes, `google_tag_manager` holds `GTM-5XR78DN7` and not `K8N3JK3Q`, both GHL scripts
  return 200, the noscript comes first in `<body>`, and the pool swapped the CTA to
  `tel:+15204626742` on all three pages.
- `verify-tags.mjs` now reads the expected guard version from `site-tags.js`. It had been
  hardcoded to `1.0.0` and failed on every run since 1.1.0. `push-tags.mjs` now loads the worktree
  `.env` and falls back to the main checkout's `insta-api.mjs`. Its old import path
  (`process/22-instatic-api-sync`) no longer exists anywhere.

### Open

- **Site Kit's Google tag `GT-NBJ3HCBV` still loads** from `site.js` (`_xs27_EDLa` plus inline
  configs `L3gvC6-8vY`, `Yo8kyKPJgf`, `5WxL9JMAn4`). Check in GTM/GA4 whether `GTM-5XR78DN7` sends
  the same property. If it does, blank these four the same way.
- The other `tags/*` and `home/*` scripts still import the removed `process/22-instatic-api-sync`
  path and will not run until they get the same loader.

### Gotchas

- **`node --env-file=.env` ends a value at `#`.** The Instatic password contains one, so the
  first login returned 401 with a 9-character password. Parse the `.env` by hand as `insta-api.mjs`
  does, and do not retry a 401 blindly: five failures lock the account.
- **`insta-api.mjs` walks up from its OWN folder for `.env`.** Imported from the main checkout, it
  would read main's `.env`, which belongs to a different client. Load the worktree `.env` before
  importing it; values that are already set win.
- **A green "gtm.start in dataLayer" does not prove the tags asset finished.** GTM boots in the
  first lines, so a throw further down leaves GTM working and silently kills everything after it.
  Listen for `pageerror`. The gate's pool and noscript checks caught this; its stale version
  check made the whole run look like noise.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
