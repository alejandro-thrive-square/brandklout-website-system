# Scenario 5 · 03 Update Staging

## Purpose

Prove the release on every staging instance before any production site sees it: same pages, same
media, same plugins, same admin login, and a published site that still works after a republish.
The staging `verify.json` is the ticket production needs in step 04.

## Inputs

- A fresh backup record per staging instance (step 02), taken on the digest running now.
- The target release and its digest (step 01).
- New plugin packages, if step 01 found a plugin API change.

## Checklist

- [ ] Backup under 24 hours old, `seq` unchanged
- [ ] Image set to the pinned release, not `latest`
- [ ] New deployment appeared and reached SUCCESS
- [ ] Running digest equals the target digest
- [ ] Volume still mounted at `/app/storage`
- [ ] `verify-data` PASS (pages, seq, media, plugins, HTML, DB, origins)
- [ ] Plugins reinstalled or upgraded if needed
- [ ] Staging republished and looked at in a browser

## Steps

1. **Dry run.** `node ../../process/tools/instatic-release/update-image.mjs --site <section> --env staging --version <x.y.z> --backup <backup dir>`.
   It must print no "blocked" line. It refuses `latest`, a missing volume, a stale or foreign backup, and a
   backup taken on another digest.
2. **Apply.** Same command with `--apply`. It sets the service image to `ghcr.io/corebunch/instatic:<x.y.z>`
   through Railway GraphQL, waits to see whether the change started a deployment by itself, requests one
   if not, polls until the new deployment ends, then asserts the digest, the `/app/storage` mount and
   `/health` 200. Expect 5 to 10 seconds of downtime.
3. **Verify the data.** `node ../../process/tools/instatic-release/verify-data.mjs --backup <backup dir> --db --expect <digest>`.
   It snapshots again and compares: site `seq` and every row `seq`, page rows and slugs, page bodies,
   media count, each plugin (present, same version, enabled, no `lastError`), every published route (still
   served, still carrying canonical, `og:`, JSON-LD and site-script tags), database counts and
   `quick_check`, new migrations applied, and `check-origins` on every `PUBLIC_ORIGIN` host (admin login).
   Its `verify.json` must say PASS.
4. **Plugins.** If a plugin shows `lastError` or is disabled, reinstall its current package, or roll out
   the upgraded one prepared in step 01, with `tools/instatic-plugins/plugins.mjs rollout --plugin <name>
   --sites <client> --env staging --apply` (it snapshots settings and records, then checks them key for
   key). `plugins.mjs status` shows every plugin's version per host. Run `verify-data` again.
5. **Republish staging and look.** An image change does not rebuild published pages; the next publish
   does. Publish staging (`tools/instatic-api-sync/insta-api.mjs publish`, only if it has no pending drafts
   the owner has not approved), then run `verify-data` again (HTML differences are WARN here) and the
   site gates: `gates/verify-live.mjs`, `gates/seo-head-check.mjs --render`,
   `staging-clone/verify-staging-clean.mjs`, and one real browser pass at 1440 and 390 with the consent
   banner, forms, reviews and the accessibility widget.
6. **Editor smoke test.** Log in on staging, open a page, edit a text, save, undo, publish nothing.
   This catches editor breaks the API cannot see.
7. **Record.** Client runbook: backup folder, digest before and after, verify result, anything fixed.

## Conditionals

- **If a migration changed the schema:** `verify-data --db` lists the new ids as WARN. That is expected.
  From here the image rollback alone may not be enough; step 05 decides with the DB facts.
- **If a plugin breaks on the new API:** fix it through the plugin (new version, new package), never by
  patching the image. If it cannot be fixed now, roll staging back (step 05) and hold the round.
- **If the site has pending unpublished drafts:** skip the republish in step 5, write it down, and ask
  the owner. A publish ships every draft site-wide.
- **If the environment is missing its volume:** the tool refuses. Do not force it.
- **If `latest` moved under us** (the digest running is not the one in the record): back up again and
  redo the dry run. Something redeployed this service since the backup.
- **If the deployment FAILED or CRASHED:** stop, read `railway logs`, roll back (step 05).

## Do / Don't

- Do pin in place first on sites you are not upgrading now (`--pin-current`): same digest, no code change,
  and `latest` can no longer move them.
- Don't update staging while someone is editing there; the collab socket drops unsaved work.
- Don't call a staging update done before a republish has been looked at in a browser.

## Tools

- `tools/instatic-release/update-image.mjs`: pinned image, deploy, wait, prove digest (`--dry` by default).
- `tools/instatic-release/verify-data.mjs`: before/after comparison, writes `verify.json`.
- `tools/instatic-plugins/plugins.mjs`: plugin status, rebuild, reinstall or upgrade with settings kept.
- `tools/instatic-site/gates/*`, `staging-clone/verify-staging-clean.mjs`: the published site after a republish.
- `tools/instatic-domain-origins/check-origins.mjs`: run by `verify-data`; alone after any domain change.

## Outputs

- `.tmp/instatic-release/<stamp>-update-<project>-staging/update.json`
- `.tmp/instatic-release/<stamp>-verify-<project>-staging/verify.json` (the staging proof for step 04)
- Client runbook run with the digests and the verify result

## Evidence

Repo runbook 2026-08-28 both Instatic admins fixed (redeploy downtime 5 to 10 s, one volume one
container, a variable set redeploys by itself, confirm a new deployment appeared), 2026-08-28 embed
origins (plugin settings survived an upgrade), 2026-09-12 Sienna on every site (publish only with
`--allow-drift` after the owner's go); bk-ifa-dentistry and bk-brandklout-website 2026-09-18/22 staging
environment (a duplicated environment has no volume); upstream CHANGELOG 0.0.20 ("upgrading a plugin no
longer breaks the JavaScript on every published page"). Memory: instatic-public-origin-is-a-separate-action,
instatic-csp-blocks-third-party-scripts.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
