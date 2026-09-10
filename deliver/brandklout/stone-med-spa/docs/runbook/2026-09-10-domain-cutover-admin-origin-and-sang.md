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

## Open — needs a rebuild and republish

- **The published footer's "switch" link to Stone Surgical Arts points at
  `https://stone-surgical-arts-production.up.railway.app/`, which is now a 404.** It should point
  at `https://www.dfwsurgicalarts.com/`.
- `site-src/seo.json` still sets `origin` and the JSON-LD `@id` to the dead med-spa host.
- Both need the build rerun and a ship. That was **not done here**: `05-instatic-upload/` holds
  uncommitted in-progress work (`ship.sh`, the directive, `check-link.mjs`, an import) that is not
  this session's, and it was left untouched.

## Gotchas

- Sang's Dr. Nahlah password was changed **by Sang** on 2026-09-10 at 22:55 UTC, and MFA is on
  there. The copied password is the one the owner set on Mason Park. If Sang uses the newer one,
  it will not work here.
- Scripts under `05-instatic-upload/.tmp/` still hardcode the dead host. They are throwaway, but
  they will fail.

## Version Control

Tracked. Committed with the work it describes.
