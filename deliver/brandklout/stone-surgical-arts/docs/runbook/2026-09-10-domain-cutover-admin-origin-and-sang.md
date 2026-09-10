# 2026-09-10 — Domain cutover: the admin reopened at dfwsurgicalarts.com, and Sang added

`dfwsurgicalarts.com` and `www.dfwsurgicalarts.com` had been connected in Railway. The admin had
to be reachable there, and Sang needed an account like the one on Mason Park and Dr. Nahlah.

## What was wrong

- Railway **detached** `stone-surgical-arts-production.up.railway.app` when the custom domains
  went on. It now answers 404 for every path, the admin included.
- `PUBLIC_ORIGIN` still named only that dead host. Both custom hosts served a normal-looking
  login page that **refused the login** (`403 invalid origin`). There was no address at all
  from which anyone could log in.

## Done

- `PUBLIC_ORIGIN=https://www.dfwsurgicalarts.com,https://dfwsurgicalarts.com,https://stone-surgical-arts-production.up.railway.app`.
  - `www` comes first because it is Railway's `RAILWAY_PUBLIC_DOMAIN`.
  - The dead host is kept last, per module 20's rule.
  - This auto-deployed `57fb6ec3` (SUCCESS, 2026-09-10 19:04 EDT).
- `check-origins.mjs`: both hosts `OK`, exit 0. **Send `https://www.dfwsurgicalarts.com/admin`.**
- Master `~/.webzite/.env` `[stone-surgical-arts]` `INSTATIC_BASE_URL` changed to
  `https://www.dfwsurgicalarts.com`, then `env-sync` re-ran in this worktree.
- `verify-live.mjs` changed from a hardcoded dead host to
  `INSTATIC_BASE_URL || https://www.dfwsurgicalarts.com`.
- **Sang added**: `sang@thrivesquare.com`, display name `Sang`, role `admin`, active, no MFA.
  This matches the Mason Park row.
  - The password hash was **copied byte-for-byte from Mason Park's row**. Instatic hashes with
    plain `Bun.password.hash(pw, {algorithm:'argon2id'})`: no pepper, and the salt is inside the
    hash. So the same hash means the same password on any instance.
  - A `user.create` audit event was written with the owner as actor.
  - Done over `railway ssh` + `bun:sqlite`. It checks for an existing active Sang first, so a
    re-run changes nothing.
- `sites.json` has the new entry, and module 20 has the Stone rows plus the new failure shape.

## Gotchas

- **Connecting a custom domain takes the generated `*.up.railway.app` host away.** As of today,
  Mason Park's and Dr. Nahlah's railway hosts 404 too. They survived only because their
  `PUBLIC_ORIGIN` already listed the custom domain. Merging `PUBLIC_ORIGIN` is not enough when the
  one allowed host has gone: run `check-origins` against the custom hosts **and** the old host
  before you trust anything.
- **Which password "Sang's" is.** Mason Park's was set by the owner on 2026-08-27, and that is the
  one copied. On Dr. Nahlah, Sang **changed his own password** on 2026-09-10 at 22:55 UTC and has
  MFA on. If he now uses that newer password, it will not work here.
- `railway ssh --project` wants the project **id**. A project name answers "Project not found".
- `DATABASE_URL` is `sqlite:/app/storage/data/cms.db`. Strip the `sqlite:` scheme before opening it.

## Next

- Any published page or script that still names `stone-surgical-arts-production.up.railway.app`
  is a dead link. The **med spa footer's switch link** is one (see that worktree's run for today).
  Several `.tmp/` probes in this worktree are the same, but they are throwaway.

## Version Control

Tracked. Committed with the work it describes.
