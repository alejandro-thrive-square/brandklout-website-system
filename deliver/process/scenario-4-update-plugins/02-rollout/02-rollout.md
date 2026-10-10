# Scenario 4 · 02 Rollout

## Purpose

Put the released version on every site that should carry it: read the fleet, do every staging
site, verify, then every production site, verify. One site at a time, a snapshot before each
install, and a full stop at the first failure.

## Inputs

- Step 01 done: the release committed, `plugins.mjs test` green.
- The site list: `--sites expected` (every site the registry names) or an explicit `--sites a,b`.
- `~/.brandklout/.env` sections for those sites, and their hosts in `sites.json`.
- A go-ahead from Alejandro or Sang for any production publish that would ship other drafts.

## Checklist

- [ ] Status read, drift understood
- [ ] Dry run on staging reviewed
- [ ] Staging rolled out, one site at a time
- [ ] Staging verified in a browser on one page
- [ ] Dry run on production reviewed
- [ ] Production rolled out, one site at a time
- [ ] Settings and records kept on every host
- [ ] No PARITY line left

## Steps

1. **Status.** From `deliver/process/tools/instatic-plugins/`:
   `node plugins.mjs status --plugin <name> > output/status.log 2>&1`. Read every line: `OLD` and
   `MISSING` are the work; `AHEAD` means stop (step 01); `DRIFT` means an editor has unpublished
   work on that site; `UNREACHABLE` means fix the host or the credentials first.
2. **Dry run on staging.**
   `node plugins.mjs rollout --plugin <name> --sites expected --env staging > output/ro.log 2>&1`.
   It shows, per host, the installed version, the settings and record counts, the draft state, the
   package's permissions and the plan. Nothing is written.
3. **Roll out staging.** Same command with `--apply --publish`. Per host it snapshots
   `plugin-before.json` and a full `backup-site` copy, installs, checks the settings key by key and
   the record counts, publishes only if the draft matches live, and verifies the published pages. It
   stops at the first failure and prints the snapshot folder.
4. **Look at one staging page yourself** in a browser at 1440 and 390: the head for open-graph and
   aeo-schema, the widget or the site script for embed-origins, the editor panel for link-editor
   (reload the editor tab first).
5. **Dry run on production.**
   `node plugins.mjs rollout --plugin <name> --sites expected --env production`. It refuses any site
   whose staging is not already on the release. Check the `draftMatchesPublished` value of every
   site.
6. **Roll out production** with `--apply --publish`, one site at a time as the script does. For
   open-graph and aeo-schema it also runs `seo-head-check.mjs` before and after and fails if the
   failures grew.
7. **Status again** (`plugins.mjs status --plugin <name>`): no `OLD`, no `MISSING`, no `PARITY`
   for the plugin. Then step 03.

## Conditionals

- **If a site's draft differs from live (`DRIFT`):** do not publish over it. Roll out without
  `--publish` (the code waits for the next publish), or ask the site owner and then pass
  `--allow-drift`. Record the choice in the runbook.
- **If a site is missing the plugin:** the rollout installs it with EMPTY settings and does not
  publish. Configure it first (site URL, organisation, origins; `clone-plugins.mjs` copies from
  another instance), then publish and verify.
- **If a site has no staging host:** add `<client>-staging` to `sites.json` if one exists. If there
  really is none (Kids, West LA today), roll production with `--env production --no-staging-ok`
  after staging passed on every other site.
- **If a site still carries a `webzite.*` id:** the install refuses. Run
  `tools/instatic-api-sync/migrate-plugin-ids.mjs` on that site first.
- **If a host fails to log in:** fix the password in the master and run `node scripts/env-sync.mjs`.
  Do not retry in a loop; five failed logins lock the admin.
- **If staging gains `siteScripts` for the first time:** keep production's trackers off staging.
  Guard them by host; never copy production's `siteScripts` across.

## Do / Don't

- Do run every command from `tools/instatic-plugins/` with output redirected to a file.
- Do keep the production railway host in `PUBLIC_ORIGIN`; the scripts log in through `sites.json`
  hosts, and a host that fails `check-origins` 403s every write.
- Don't install a version older than what a site runs (`--allow-downgrade` only on purpose, written
  in the runbook).
- Don't run production before staging passed.
- Don't publish a site with someone else's drafts without their yes.
- Don't copy plugin settings from production to staging or back.

## Tools

- `tools/instatic-plugins/plugins.mjs`: `status`, `rollout`, `verify`.
- `tools/instatic-plugins/install-plugin.mjs`: one plugin on one site, by hand.
- `tools/instatic-site/ops/backup-site.mjs`: run by `rollout`; `--db-command` for a DB copy.
- `tools/instatic-site/gates/seo-head-check.mjs`: run by `rollout` on production for the SEO pair.
- `tools/instatic-site/staging-clone/clone-plugins.mjs`: plugins and settings onto a new instance.
- `tools/instatic-api-sync/migrate-plugin-ids.mjs`: old `webzite.*` ids.
- `tools/instatic-domain-origins/check-origins.mjs --all`: if a host 403s.

## Outputs

- `tools/instatic-plugins/output/status/status-<stamp>.json`
- `tools/instatic-plugins/output/rollouts/<stamp>-<plugin>-<version>/` with `rollout.json` and, per
  host, `plugin-before.json`, `site/` (backup) and the seo-head-check logs. Not committed; keep it
  until step 03 is done.

## Evidence

Repo runbooks: 2026-09-10 plugin ids renamed (staging first by the user's call, two productions
published teammates' edits), 2026-09-10 plugin author (reinstall keeps settings; staging hosts
missed because they were in no registry), 2026-09-12 Sienna (drift held back two sites, then
`--allow-drift` on the user's go-ahead), 2026-09-22 Termly rollout. bk-dr-nahlah 2026-09-18 and
2026-09-22 (staging's Embed Origins without `siteScripts`, "guard host-conditionally"), bk-mason-park
2026-09-16 and 2026-09-18 (staging on 1.5.1 without Termly), bk-brandklout-website 2026-09-22
staging (a clone carries only the plugins the source has), bk-ifa-dentistry 2026-09-18 staging.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
