# 2026-09-23c — staging.drnahlah.com re-mirrored from production. LIVE, parity 58/58

Request (Alejandro): "mirror to staging so everything is updated". Run twice. The second run
happened after the 2026-09-23b ChatGPT landing page went live on production (19:26 UTC), so
staging carries that page too.

## Done

Commit: _(see git log for this file)_

- **Document:** `clone-site.mjs --strategy replace` production → staging. 102 rows, 58 pages.
  `publish-rows.mjs` published all 43 posts, then staging was published.
- **Media:** 18 images uploaded to production after the last staging sync were 404 on staging:
  AO4, implant and veneer before/after cases, plus two headshots. Fixed with an
  `includeMedia:true` export (543.6 MB), `chunk-media.py` (7 chunks) and
  `import-media-chunks.mjs` (merge-add). Staging now holds all 521 production media ids.
- **Plugins:** embed-origins on staging went **1.5.1 → 1.8.0**. The RUNBOOK's "1.4.0" was stale.
  The new `sync-plugin-settings.mjs` copies production's embed-origins, aeo-schema and
  open-graph settings onto staging. This also fixed the retired `(571) 702-9900` in staging's
  JSON-LD.
- **Gates:** `diff-sites.mjs` reports 58/58 content-equivalent with 0 differences.
  `check-noindex.mjs` exits 0. A sweep of 98 URLs found all 200, all 312 referenced uploads
  200, no GHL pool or GTM anywhere, and the OpenAI SDK and pixel asset only on
  `ads-landing-pages/alexandria-all-on-4-chatgpt`.

## Deliberately NOT on staging (`sync-plugin-settings.mjs`)

- **GoHighLevel number pools + user_session.js:** every visitor would claim a real tracking number.
- **GTM:** would fire the production container.
- **open-graph `emitCanonical`** stays false, as before.
- Everything else is copied, including Termly, Sienna and the OpenAI SDK line. The pixel asset
  returns unless `location.hostname === 'www.drnahlah.com'`. That was proved on the staging
  thank-you page: no request to bzr.openai.com.

## Gotchas

- **Re-mirror = four commands + publish + gates.** `clone-site.mjs --strategy replace`, then
  `sync-plugin-settings.mjs --apply`, then `publish-rows.mjs --table posts`, then publish
  staging, then `diff-sites.mjs` and `check-noindex.mjs`. If `diff-sites` passes but images
  404, run the media export/chunk/import. diff-sites does not check `/uploads`.
- **Plugin settings PUT needs step-up.** `sync-plugin-settings.mjs` uses `session()` for staging.
- **`18-instatic-embeds/lib/.tmp/.session` is ONE cookie for every base URL.** With
  `INSTATIC_BASE_URL` pointed at another site, `requestForm` 401s with `Unauthorized`, not
  `step_up_required`. Delete the file and rerun.
- **Staging has 20 orphan media rows.** They are its own 2026-09-18 uploads of the same case
  photos, under staging-only ids, and nothing references them. Left in place.
- **Staging has no srcset.** Variants never travel. This is known and accepted.
- **Another session was changing production during this run.** Check `publish/status` and
  `git status` right before seeding, and seed again once production is final.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
