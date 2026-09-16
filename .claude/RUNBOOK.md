# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Standing

- **Google Drive works** through `node scripts/drive.mjs` (search, ls, get, pull), signed in as
  alejandro@thrivesquare.com. The app is in Testing, so the sign-in expires every 7 days:
  `invalid_grant` means run `node scripts/drive.mjs auth`. See
  [2026-09-16](./runbook/2026-09-16-google-drive-access.md).
