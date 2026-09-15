# Runbook index

15 runs, newest first. Each line is one file in this folder.
**Read this index first and open only what you need** — opening every entry is how a runbook
eats a context window.

| Date | Run | File |
| :--- | :--- | :--- |
| 2026-09-14 | DONE 2026-09-14 - masonparkpediatricdental.com serves the OLD WordPress site as a static copy (the 27-Aug mirror, Cloudflare Pages `mason-park-kids-wp`); the new design is on `staging.masonparkpediatricdental.com`. The real WordPress is suspended at SiteGround. **Gotchas: wrangler 4.131's `pages project create` delegates to Workers and fails, so create through the API; `x-suspended-vhost: 1` means suspended, not crashed.** | [`2026-09-14-domain-masonparkpediatricdental-live.md`](./2026-09-14-domain-masonparkpediatricdental-live.md) |
| 2026-09-10 | 2026-09-10 — plugin ids renamed to brandklout.* (migration, all instances) | [`2026-09-10-plugin-ids-renamed-to-brandklout.md`](./2026-09-10-plugin-ids-renamed-to-brandklout.md) |
| 2026-09-10 | 2026-09-10 — Instatic plugin author changed to Brandklout (live + source) | [`2026-09-10-plugin-author-is-brandklout.md`](./2026-09-10-plugin-author-is-brandklout.md) |
| 2026-09-09 | DONE 2026-09-09 (night) - THE WHOLE SITE ON INSTATIC: 215 PAGES, THE BLOG INCLUDED. All 157 posts built and published; local against live 215/215 on structure, text and geometry. **Gotchas: four browser sweeps on one machine fake timeouts; `populate-seo` drops writes on a busy host; the harvest bakes link rewrites into the JSON; two more gates carried lists; consecutive `<p>` are one prose run; the probes want absolute paths.** Railway needed a re-login and an SSH key on the new account. | [`2026-09-09-the-whole-site-on-instatic-215-pages.md`](./2026-09-09-the-whole-site-on-instatic-215-pages.md) |
| 2026-09-09 | DONE 2026-09-09 (evening) - PICTURES THAT MATCH THE WORDS, AND NO FIGURE LEFT DANGLING. **Local only, not published.** The overlap panel painted under its photo on 19 pages (a transformed sibling); 16 figures hung alone at chapter feet; `waiting` (a wall) was the invitation on 45 pages. 23 new frames: 9 from the client's album (front of house only), 14 bought by id. **Gotchas: per-page gates cannot see composition; a pin spacer looks like empty ground at full page; `check.mjs` only checked refs under `assets/`; Magnific titles lie; a portrait cut to a band is a strip of wall.** | [`2026-09-09-pictures-that-match-the-words.md`](./2026-09-09-pictures-that-match-the-words.md) |
| 2026-09-09 | DONE 2026-09-09 (later) - THE OTHER 46 PAGES, REDESIGNED. Every page now carries the new chrome, the journey layer and a photograph; all 57 live and every gate clean. **Gotchas: a hard-coded page list in a gate; `stamp.mjs` eating the generated marker; build/stamp/check does not commute; `crop-probe.mjs` reports phantom crops on a loaded machine.** Also four inherited content faults: the FAQ questions were missing, the adult practice was named all over the site, a false accessibility claim, and a third party's chart published as the practice's own. | [`2026-09-09-the-other-46-pages-redesigned.md`](./2026-09-09-the-other-46-pages-redesigned.md) |
| 2026-09-09 | DONE 2026-09-09 - THE TITLES, THE IMAGERY, AND LOCAL RECONCILED WITH LIVE. Cropping 131 -> 0, live faults 285 -> 0, images 55 -> 89. **Gotchas: Magnific inventing a real colleague's face; `document.fonts.ready` lying.** | [`2026-09-09-titles-imagery-and-local-against-live.md`](./2026-09-09-titles-imagery-and-local-against-live.md) |
| 2026-09-02 | DONE 2026-09-02 - THE ELEVEN CORE PAGES, designed and LIVE on Instatic. Commit `ad7a2d32`.
 | [`2026-09-02-the-eleven-core-pages-designed-and-live-on-insta.md`](./2026-09-02-the-eleven-core-pages-designed-and-live-on-insta.md) |
| 2026-09-01 | 2026-09-01 - THE LIVE DOMAIN IS A SITE TOOLS REDIRECT, NOT .htaccess. WordPress is intact.
 | [`2026-09-01-the-live-domain-is-a-site-tools-redirect-not-hta.md`](./2026-09-01-the-live-domain-is-a-site-tools-redirect-not-hta.md) |
| 2026-08-31 | 2026-08-31 (later) - CLOUDFLARE ZONE PREPPED. Domain cutover BLOCKED on a registrar transfer.
 | [`2026-08-31-later-cloudflare-zone-prepped-domain-cutover-blo.md`](./2026-08-31-later-cloudflare-zone-prepped-domain-cutover-blo.md) |
| 2026-08-31 | 2026-08-31 - THE SITE IS ON INSTATIC. 54 pages live and published.
 | [`2026-08-31-the-site-is-on-instatic-54-pages-live-and-publis.md`](./2026-08-31-the-site-is-on-instatic-54-pages-live-and-publis.md) |
| 2026-08-30 | 2026-08-30 - `to-instatic.mjs` ported and verified (`9298a94`)
 | [`2026-08-30-to-instatic-mjs-ported-and-verified-9298a94.md`](./2026-08-30-to-instatic-mjs-ported-and-verified-9298a94.md) |
| 2026-08-28 | 2026-08-28 - split out of `bk-mason-park` into this worktree (`28260df`)
 | [`2026-08-28-split-out-of-bk-mason-park-into-this-worktree-28.md`](./2026-08-28-split-out-of-bk-mason-park-into-this-worktree-28.md) |
| 2026-08-28 | 2026-08-28 — pediatric site REBUILT. 54 static pages, building locally.
 | [`2026-08-28-pediatric-site-rebuilt-54-static-pages-building.md`](./2026-08-28-pediatric-site-rebuilt-54-static-pages-building.md) |
| 2026-08-27 | 2026-08-27 (later) — pediatric site RECOVERED. New client folder `mason-park-kids/`.
 | [`2026-08-27-later-pediatric-site-recovered-new-client-folder.md`](./2026-08-27-later-pediatric-site-recovered-new-client-folder.md) |
