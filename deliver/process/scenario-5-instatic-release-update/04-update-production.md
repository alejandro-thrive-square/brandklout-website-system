# Scenario 5 · 04 Update Production

## Purpose

Move the live sites to the release staging proved, one at a time, with the owner's go, and stop the
round on the first failure. Same mechanics as staging, stricter gates.

## Inputs

- A PASS `verify.json` from the same project's staging on the same digest (step 03).
- The owner's go, in writing (Asana or chat), for this round.
- A fresh production backup (step 02, with `--railway-backup`), taken minutes before, not the day before.

## Checklist

- [ ] Owner said go
- [ ] Staging proof PASS on the same digest
- [ ] Fresh backup, `seq` unchanged, nobody in the admin
- [ ] Quiet hour picked (no campaign launch, no client review)
- [ ] Image pinned, deployment SUCCESS, digest proven
- [ ] `verify-data` PASS, admin login proven on every host
- [ ] Live pages, forms, number swap and consent checked
- [ ] Runbook written before the next site

## Steps

1. **Pick the site** from the round order. Only one production site is in flight at any time.
2. **Back up** (step 02) with `--apply --railway-backup --label pre-<version>`. Tag git.
3. **Dry run.** `update-image.mjs --site <section> --env production --version <x.y.z> --backup <dir> --allow-production --staging-proof <staging verify dir>`.
   No "blocked" line may remain. A project with no staging instance (West LA Implants today) uses
   `--no-staging` instead, and the runbook says why; test its release on another site's staging first.
4. **Apply** with `--apply`. Same wait and digest proof as staging.
5. **Verify.** `verify-data.mjs --backup <dir> --db --expect <digest>` must say PASS. `check-origins` runs on
   every `PUBLIC_ORIGIN` host (www, apex, the railway host). Then one real admin login.
6. **Live checks.** `tools/cloudflare-launch/verify-launch.mjs` on the priority pages, `gates/dni-proof.mjs`
   (number pool swap), `tools/termly-ghl-consent/consent-kit.mjs check` (nothing fires before a choice),
   one GHL form open in a browser, `sitemap.xml` and `robots.txt`.
7. **Republish only if needed.** If the release fixes something only a publish ships (0.0.20: classes
   switched by scripts, responsive order), publish production only when staging's republish was
   approved and production has no pending drafts the owner has not seen. Gate it like step 03.
8. **Record, then continue.** Client runbook run (backup folder, digests, verify result). Then the next
   site. Close the round in the repo runbook with the final inventory.

## Conditionals

- **If any check fails:** stop the round. Do not start the next site. Go to step 05 for this site only.
- **If a migration changed the schema:** production gets the same migration staging got. Keep the
  backup folder until the site has run a week on the new release.
- **If a plugin breaks only on production** (a plugin or setting staging lacks): roll back, add that
  plugin to staging, repeat step 03.
- **If production has pending unpublished drafts:** update the image, but do not publish. Tell the owner
  what is pending.
- **If the environment is missing its volume:** the tool refuses. Stop.
- **If `latest` moved under us** (the running digest changed since the backup): back up again.

## Do / Don't

- Do one site at a time, backup minutes before, verify before the next.
- Do keep the railway host in `PUBLIC_ORIGIN`; it is the fallback admin door.
- Don't update production on the strength of another project's staging unless the site has no staging.
- Don't batch production sites in one script run, even when all staging passed.
- Don't deploy during a client review, a campaign launch or a BugHerd round.

## Tools

- `tools/instatic-release/backup.mjs`, `update-image.mjs`, `verify-data.mjs`
- `tools/cloudflare-launch/verify-launch.mjs`, `tools/instatic-site/gates/dni-proof.mjs`,
  `tools/termly-ghl-consent/consent-kit.mjs check`
- `tools/instatic-domain-origins/check-origins.mjs --all` at the end of the round

## Outputs

- Per site: `.tmp/instatic-release/<stamp>-update-<project>-production/update.json`, `…-verify-…/verify.json`
- Client runbook run per site; repo runbook run for the round with the closing inventory
- `tools/instatic-domain-origins/sites.json` updated if a host was missing

## Evidence

Repo runbook 2026-08-28 both Instatic admins fixed (redeploy downtime, admin origin checks),
2026-09-12 Sienna rollout (held two sites with pending drafts until the owner said go), 2026-09-22
Termly on 29 sites; bk-stone-med-spa 2026-09-17 production push (backup first, gates after, a gate that
only ever ran on staging missed a production-only script); bk-ifa-dentistry 2026-09-18 staging
(staging host passes production host gates). Inventory 2026-09-23 (West LA Implants has no staging).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
