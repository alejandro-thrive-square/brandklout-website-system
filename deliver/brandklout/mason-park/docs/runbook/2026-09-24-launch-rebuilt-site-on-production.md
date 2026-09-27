# 2026-09-24 — Launch: the rebuilt site is live on www.masonparkdental.com

We were asked to back up production and push staging to it, and confirmed that the client had
approved going live. **The rebuilt site is now what production serves.** It went on as a
**merge**, not a cutover: the 63 rebuilt pages overwrote or joined production's rows by slug, the
blog came over as its CMS collection, and the 31 production pages the rebuild does not have were
left in place and still serve.

## Backups (all taken before any write)

| What | Where |
| :--- | :--- |
| API snapshot | `workflows/09-static-rebuild/.tmp/backup-www.masonparkdental.com-2026-09-24T22-10-33.json` (78 pages, 153 media, shell seq 37, draft == published, last published 2026-09-22T20:06) |
| Database | on the production volume: `/app/storage/backups/cms-2026-09-24-seq37-pre-launch.db` (463 MB, `VACUUM INTO`) |
| Source | git tag `mason-park-pre-launch-2026-09-24` (commit `5b894779`) |
| Old stylesheet | `.tmp/bugherd/prod-mason-park-css-pre-launch.css` (the 26 KB Webflow-port `mason-park.css` the launch replaced) |

**Rollback:** stop the service, copy the `.db` over `/app/storage/data/cms.db`, delete `-wal`/`-shm`,
start. See the memory note on `VACUUM INTO` and process 21.

## What was decided

- **Merge, keep the old pages** (asked, answered): the 31 production-only rows stay. They are the
  six Webflow-port ad pages at the root slugs the live ads and GHL form redirects use
  (`/invisalign`, `/new-patient-special` and their consultation and thank-you pages),
  `privacy-policy`, `cookie-policy`, and 23 old URLs (team, FAQs, old service slugs, cost pages,
  `appointment`, `pearl-ai` and others). Nothing was deleted, and nothing about the ads, GHL, or
  Cloudflare had to change for launch.
- The rebuilt ad pages are live too, under `/ads-landing-pages/`, with their forms and call
  tracking. The ads still point at the root pages.

## How it was run

`.tmp/bugherd/push-production-2026-09-24.sh`: the staging chain against production, plus the
steps production lacked. **Nothing deletes**: `import-pages` (incremental, overwrite by slug),
`import-styles` (additive class rules, upsert of `src/styles/mason-park.css`) and `import-scripts`
(upsert of `src/scripts/mason-park.js`). The consent bridge, consent preferences, `lp-faq.js`
and `mason-park-lp.css` are untouched.

1. Media uploaded to production (983 files), pages converted in the **production** container
   (`RAILWAY_ENV_NAME=production`), alt text and body classes, `place-ad-embeds.mjs` (4 forms,
   6 tracking blocks), `import-pages --overwrite`, `import-fonts`, `import-styles`.
2. Blog: `articles-table.mjs` created the `Articles` postType table (routeBase `/blog`) from
   staging's definition, `import-articles` 161 rows, the two template pages built, converted and
   imported, `apply-blog-template`, `apply-404-template`.
3. `add-frame-origin.mjs https://www.google.com`: the Contact map's click-to-play iframe
   (read-merge-write; Termly and Sienna in `siteScripts` untouched).
4. `import-scripts --publish` (94 pages published), `publish-articles` (161 rows, oldest first).

The staging-only guards on `apply-blog-template`, `apply-404-template`, `import-articles` and
`publish-articles` now accept `ALLOW_PRODUCTION=launch`, which only the launch script sets.
`import-bugherd`, `reset-to-deliverable` and `retire-old-ad-routes` stay staging-only.

The first run stopped at the table step (a Node child process on a pipe hit the Windows libuv
assertion). Nothing was published at that point: production showed 92 draft pages against 78
published, and the live site was still the old one. `push-production-2026-09-24-resume.sh`
finished the run from that step.

### After launch: the old ad pages under the new stylesheet

The launch replaced production's `mason-park.css`. The root ad pages are Webflow ports scoped
under `div.lp-page`, and they had been leaning on some base rules from the old file.
`10-lp-instatic/.tmp/type-diff.mjs --all` (the gate after any stylesheet change) found two
leaks from the new one: `.heading-style-h6` uppercase (7 headings each on `/invisalign` and
`/new-patient-special`) and `.button` centring. The fix is scoped to `.lp-page` at the foot of
`site.css`. The rebuilt ad pages carry `body.is-lp-page` instead, so the selector does not reach
them. After it: **0 text elements styled differently on all six**. The only rows left are
`container-large` 8px side margins that swap sides, appear and vanish between runs with the same
CSS, so they are measurement noise. Pinning the old container widths made it worse, and that
change was reverted.

## Verified

- `publishStatus`: 94 draft == 94 published. 161/161 articles published.
- Sweep of all 92 routable production pages plus 5 articles, at 1440 and 390. The flagged items
  are all either old-page content or noise:
  - `/services/what-is-tmj`, `/services/silver-diamine-fluoride`, `/dental-implant-costs` and
    `/dental-implant-costs-esp` hotlink images from `grandmissiondentistry.com` that 404 at the
    source. These are old pages whose content was not touched.
  - `/appointment` frames `api.leadconnectorhq.com`, which the CSP blocks. It is an old page and
    its content was not touched.
  - The GHL form script logs `%c%d NaN`, and `/favicon.ico` 404s (Chrome asks for it itself).
  - One `appendChild` page error on `/ads-landing-pages/invisalign` at 390 did not come back in
    two re-runs.
- Head checks on the home page, a service page, financing, both ad page sets, the two legal pages
  and the blog: 200, Termly resource blocker, both consent scripts and Sienna on every one, and
  the GHL form plus call tracking on the ad pages (old and new).
- Screenshots: `privacy-policy`, `cookie-policy` and `team/dr-cho` read cleanly under the new
  stylesheet, with their own header.

Staging was re-pushed the same day (`push-2026-09-24.sh`, backup
`backup-staging...2026-09-24T23-00-10.json` first). Two changes: the `.lp-page` CSS, and
**`place-ad-embeds.mjs` added to the chain**. Earlier full pushes had been dropping the
`/ads-landing-pages/` forms on staging since at least round five. They are back (4 forms,
6 tracking blocks).

## Gotchas

- **Production had no canonicals before the launch and still has none.** The Open Graph and AEO
  Schema plugins' `siteUrl` is empty, so no page emits `<link rel=canonical>` or `og:url`, and
  the schema has no site URL. This was not introduced by the launch.
- **No GTM on production.** `siteScripts` holds Sienna and Termly only, and no page loads a
  GTM or GA tag. This was also true before the launch.
- **A full push drops the ad forms** unless `place-ad-embeds.mjs` runs between
  `apply-body-class` and `import-pages`. The round chains did not have it.
- **`instatic-media-map.json` is per instance.** It was written for production during the launch
  and regenerated for staging by the next staging push. Always run `upload-media.mjs` against the
  target before `to-instatic --media`.
- **Node child processes on a pipe crash on Windows** (the `UV_HANDLE_CLOSING` assertion) even
  when their output is complete, and the non-zero exit stops a chain. Write the child's output to
  a file.

## Next

- **Canonicals:** set `siteUrl` = `https://www.masonparkdental.com` on the Open Graph and AEO
  Schema plugins, read-merge-write, then republish. This is not done yet.
- **Legacy redirects** (`workflows/12-legacy-redirects`): production now has the blog, so the
  161 old article URLs can map to `/blog/<slug>` instead of `/`. Rebuild and redeploy the Worker;
  the zone is still pending the nameserver switch.
- The old pages are a decision for later: redirect them to their rebuilt equivalents, or keep them.
  The root ad pages stay until the ads and GHL redirects move to `/ads-landing-pages/`.
- Staging carries real GHL call tracking on its ad pages again, as it did on 09-18. Guard it by
  host if pool numbers matter.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
