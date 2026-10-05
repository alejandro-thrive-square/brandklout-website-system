# scenario-6-webflow-sites · 03-qa-and-publish · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-05 · office hours, live
- **Done:** user said "push to production". `wf-publish.mjs live --domains dentiq.dental,www.dentiq.dental --ship-pending` (`publish-live.txt`); 225/225 live pages show the new hours, all `cf-cache-status: MISS`.
- **Next:** none.
- **Gotchas:** `publish_site` now wants custom domain IDs, not hostnames (400 "Please send a valid custom domain ID"); `wf-publish.mjs` fixed on main. After the staging publish, `state` reported CLEAN: a staging publish resets `lastPublished`, so the pending signal is gone, even though the live domains were still on the old build.

## 2026-10-05 · office hours
- **Done:** staging publish (`publish-staging.txt`); `staging-check.txt` shows 225/225 pages clean.
- **Next:** LIVE publish is waiting on the user. A publish ships the two pending items that are not ours: the home-page edit (2026-09-30) and a site-level edit (2026-10-05 07:28 UTC). Run `wf-publish.mjs live --site 6a5f81effe0aee1d204818dd --domains dentiq.dental,www.dentiq.dental --ship-pending --yes` only after the user accepts that.
- **Gotchas:** home's pending timestamp is now ours (the schema write), so `state` no longer shows the 09-30 edit separately.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
