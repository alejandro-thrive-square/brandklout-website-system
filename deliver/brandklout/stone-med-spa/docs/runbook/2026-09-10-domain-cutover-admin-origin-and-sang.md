# 2026-09-10 — Domain cutover: the admin reopened at westlaketxmedspa.com, and Sang added

`westlaketxmedspa.com` and `www.westlaketxmedspa.com` had been connected in Railway. The admin had
to be reachable there, and Sang needed an account like the one on Mason Park and Dr. Nahlah.

## What was wrong

- Railway **detached** `stone-med-spa-production.up.railway.app` when the custom domains went on.
  It now 404s everywhere.
- `PUBLIC_ORIGIN` still named only that dead host, so both custom hosts refused the login
  (`403 invalid origin`) and nobody could log in anywhere.
- The service was also renamed **`Westlake Medical Aesthetics`**. The project is still
  `Stone Med Spa`.

## Done

- `PUBLIC_ORIGIN=https://westlaketxmedspa.com,https://www.westlaketxmedspa.com,https://stone-med-spa-production.up.railway.app`.
  - The apex comes first because it is Railway's `RAILWAY_PUBLIC_DOMAIN`.
  - The dead host is kept last, per module 20's rule.
  - This auto-deployed `e0f81569` (SUCCESS, 2026-09-10 19:04 EDT).
- `check-origins.mjs`: both hosts `OK`, exit 0. **Send `https://westlaketxmedspa.com/admin`.**
- Master `~/.webzite/.env` `[stone-med-spa]` `INSTATIC_BASE_URL` changed to
  `https://westlaketxmedspa.com`, then `env-sync` re-ran in this worktree.
- `verify-live.mjs` changed from a hardcoded dead host to
  `INSTATIC_BASE_URL || https://westlaketxmedspa.com`.
- **Sang added**: `sang@thrivesquare.com`, display name `Sang`, role `admin`, active, no MFA.
  - The password hash was copied byte-for-byte from Mason Park, so the password is the same.
  - A `user.create` audit event was written with the owner as actor.
  - The method is in the `bk-stone` run of the same date.
- `sites.json`: the entry now names the new domain and the renamed service.

## Later the same evening — republished with the cross-links fixed

The user asked for the republish once the open item was reported.

- **Three links to Stone Surgical Arts pointed at its dead railway host**, not just the footer:
  - `partials/footer.html`, the switch, which is on every page
  - `pages/about.body.html`, the "The surgical practice" button
  - `pages/treatments.body.html`, the `doors_door is-there` card

  All three now go to `https://www.dfwsurgicalarts.com/`. The live site has 13 of those links and
  zero `up.railway.app` strings.
- `seo.json` now uses `origin` and the JSON-LD `@id` of `https://westlaketxmedspa.com`, and its
  note was rewritten. **None of it reaches the live HTML**: neither Stone site serves a canonical,
  an `og:url` or a sitemap. That was already true before today, and it is still open.
- **The link guard was already sitting on disk, uncommitted, from the 2026-09-04 run.** It was
  committed as found (`15726558`) and then used. `check-link` output:
  `Stone Med Spa / production / Westlake Medical Aesthetics serves westlaketxmedspa.com`.
- **The upload scripts could not load.** `upload-media`, `set-alt`, `push-site` and
  `install-fonts` imported `insta-api.mjs` from `dr-nahlah/workflows/15-instatic-api-sync/`. That
  folder moved to `deliver/process/22-instatic-api-sync/` on 2026-09-09, and this sparse
  worktree has no `dr-nahlah/`. They now import `../../../../process/22-instatic-api-sync/`.
- **Before `--force`**, the audit log was checked. Nobody had edited a page since the last push on
  2026-09-04 23:54 UTC, so the full replace discarded nothing.
- The run, in order:
  1. `build-site`, then `audit` (`FAIL none`)
  2. `build-import-input`
  3. `ship.sh`, with `RAILWAY_LINK_DIR` a scratch dir linked by project id and `RAILWAY_*` unset
  4. `push-site --apply --force` (all 11 pages `ok`)
  5. `publish` (`{"publishedPages":11}`)
- Gates:
  - `verify-live`: `FAIL none` (11 routes, 81 URLs, 166 assets)
  - `css-parity`: `FAIL none`
  - `visual-diff` at 1440: 1.15% at worst (`treatments`), inside the 2026-09-04 baseline of 1.6%
  - `visual-diff` at 390: 2.81% at worst (`financing`), inside the baseline of 4.4%

## Gotchas

- Sang's Dr. Nahlah password was changed **by Sang** on 2026-09-10 at 22:55 UTC, and MFA is on
  there. The copied password is the one the owner set on Mason Park. If Sang uses the newer one,
  it will not work here.
- Scripts under `05-instatic-upload/.tmp/` still hardcode the dead host. They are throwaway, but
  they will fail.

## Version Control

Tracked. Committed with the work it describes.
