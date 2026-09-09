## 2026-09-04 — ship.sh gained a link guard; three ways the Railway target crosses sites

Investigation into whether two parallel Instatic/Railway worktrees were interfering. **Railway's own
linking is not the problem** — `railway link` keys `~/.railway/config.json` by EXACT directory and
does not walk up to a parent (verified: `railway status` in this worktree root says "No linked
project found"), so the six link dirs under this worktree and the med spa's one cannot resolve to
each other. The `.env` files are clean too, one instance each.

`ship.sh` was the hole, and it is closed: it now runs `check-link.mjs` as step 0 and refuses to ship
unless the linked project+environment actually serves `INSTATIC_BASE_URL`. Same file in both Stone
Instatic worktrees. Not committed; both branches still unpushed.

### Gotchas

- **`RAILWAY_PROJECT_ID` in the environment OUTRANKS the linked directory.** Standing in a dir
  linked to Stone Surgical Arts with the med spa's value exported, `railway status` reports *Stone
  Med Spa*. The med spa `.env` contains one, so `set -a; . .env` in a shell you then run `ship.sh`
  from is enough to cross the two sites — `$RAILWAY_LINK_DIR` stops meaning anything. This is the
  real "instances mixing" mechanism, and it is environmental, not link-based.
- **`RAILWAY_TOKEN` in the worktree `.env` is STALE and overrides the CLI's own stored auth.** Any
  script that loads `.env` then shells out to `railway` gets `Invalid RAILWAY_TOKEN` from a CLI that
  works by hand a second later. `check-link.mjs` strips the RAILWAY_* values it injected before
  spawning `railway`; anything else that shells out needs the same treatment.
- **Never put an apostrophe inside `${VAR:?message}`.** The single quote opens a quoted string and
  the closing brace is never seen, so the whole script dies at parse time on line 18 rather than the
  variable failing to expand. `bash -n` catches it; caught mine.
- **`railway status` (plain) is the only output that names the LINKED environment.** `--json`
  returns every environment the project has, which is not enough for a project like Dr. Nahlah that
  has staging and production on different hosts. The guard reads the UUIDs out of the plain text and
  looks the domains up in the JSON.
- **The two worktrees' copies of `insta-api.mjs` have diverged.** This one keys the session cache
  per host (`.session-<host>`); the med spa's is the older shared `.tmp/.session`. Cookies for two
  instances land in one file there.
- **One Instatic admin account serves every instance, and 5 failed logins lock it.** That is genuine
  shared state between parallel worktrees — the one thing here that really is not isolated.
