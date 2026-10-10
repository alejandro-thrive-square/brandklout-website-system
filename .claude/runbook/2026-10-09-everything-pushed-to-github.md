# 2026-10-09 — Every branch pushed to GitHub

The user's brief: push main and every branch to `alejandro-thrive-square/brandklout-website-system`
so GitHub holds everything.

## Done
- `git push -u origin --all`: main (+225 commits) and 20 client branches fast-forwarded, none
  behind; **three branches were local only and are now on GitHub**: `bk-dentalpro-toolkit`,
  `bk-dentiq`, `bk-hackensack-dental-implants`. Every local branch now tracks its origin copy.
- Uncommitted work committed in its own worktree and pushed:
  - `assets.tsv` (R2 media manifest): arvada `4750d5bb`, brandklout-website `0cc5218c`, dentiq
    `52cbe682` (first manifest), dr-nahlah `96be597a`, ifa-dentistry `dc916f4f`, livewell `b8bf99ec`,
    mason-park `891d2390`, oceanic-dental `d0f6b449`, stone `24b71478`, stone-med-spa `ab8325af`.
    stone-dental's diff was line endings only, nothing to commit.
  - mason-park-kids `f3ac352d`: the tracked BugHerd snapshot `workflows/.tmp/bugherd/tasks.json`.
  - hackensack `6597855e`: the face gate (`faces.py`, `01-faces.js`, `face-gate.mjs`) and
    face-aware crops, idle 2 h when committed. Its session should check it before building on it.
  - dr-nahlah `b60f8a82`: `02-on-page/output/schema/sections.json`.
  - west-la-implants `3cd35353`: the tracked process copy refreshed to main (every changed file was
    byte-identical to `main:deliver/process/...`), and the Instatic session file untracked.
- Re-checked after the push: every branch in sync with origin.

## Left uncommitted on purpose
- Every `.tmp/` snapshot (stone, stone-med-spa, mason-park, brandklout-website): scratch backups.
- dr-nahlah: ~32 MB of staging backups under `02-on-page/output/2026-10-07-staging/` and
  `04-content-depth/output/backups/`, `schema/schemaorg.jsonld` (the full schema.org vocabulary, a
  download), and `deliver/process/22-instatic-api-sync/` (pre-v2 path shim, outside the client folder).

## Gotchas
- **bk-west-la-implants tracked a live Instatic session cookie**:
  `tools/instatic-api-sync/output/.session-west-la-implants-production.up.railway.app`, committed in
  `b9b96a5c` and on GitHub since. Now untracked (still gitignored by `/deliver/brandklout/*/tools/`),
  but the old value stays in history: log that session out / rotate the Instatic password.
- bk-west-la-implants still tracks ~58 more mirror files (scenario-3 directives and scripts, `tools/`)
  that every other client branch leaves untracked, so each `scenario.mjs sync` shows them modified.
  Untracking them (`git ls-files -ci --exclude-standard` in that worktree, then `git rm --cached`) is
  the clean fix. Not done here. Older tracked-but-ignored leftovers also exist on arvada (20),
  dr-nahlah (187, `workflows/01-content-intake`), stone-dental (18); every branch tracks 2 under
  `deliver/process`.

## Next
- Rotate the West LA production Instatic session (gotcha above).
- Decide whether to untrack the west-la-implants mirror and the older ignored leftovers.

## Version Control
Run file under `.claude/runbook/`, tracked on main per [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
