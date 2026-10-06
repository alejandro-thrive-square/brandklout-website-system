# 2026-10-06b — Client-First class standard applied on STAGING (377 renames) and on the local source

Fleet brief: `deliver/process/tools/instatic-api-sync/output/fleet/BRIEF-common.md` +
`BRIEF-dr-nahlah.md` (main checkout). Standard: `CLASS-STANDARD.md` §8. **Staging only; production
was only ever loaded as a public page for a comparison.** Continues the 2026-10-06 run (blocked at
step 0). Logs, backup and captures: `deliver/process/tools/instatic-api-sync/output/fleet/dr-nahlah/`
in the main checkout (gitignored); `STATUS.md` there is the coordinator's copy of this.

## Done
1. **The pending staging draft was published as it stood** (04:29:22Z), on the fleet coordinator's
   decision, relayed in this session after it read the BLOCKED status. Its reason: the two
   undocumented Styles-panel edits (`.ch-services .sv-grid` `grid-template-rows: repeat(2, 1fr)`,
   the empty class `flex-test`) are the user's own manual panel test from the night of 2026-10-05
   (the session record matches the timestamps), and they were measured as invisible at five widths.
   That publish also shipped the documented SEO v2/v3 sync, so **staging's published SEO now matches
   production's** (it was draft-only before).
2. Step 0: `draftMatchesPublished: true`; `backup-site.mjs` → `backup-pre-migration/` (shell seq 198,
   59 rows, published HTML).
3. Baseline `migration-gates.mjs snapshot before`: styles at 1440 / 390 / 1920 (each twice) and
   behaviour at 1440 / 390 on **100 URLs** (57 pages + the 43 Journal posts). Plus a head baseline
   (`head-parity.mjs save before`: title, every meta, canonical, JSON-LD on the same 100 URLs).
4. §8 step 2 skipped: `editability.mjs --published` was already **EDITABLE** (2026-10-04 run).
5. `class-rename.mjs --apply` with the committed map
   (`workflows/22-instatic-api-sync/class-standard/class-map.json`, unchanged: the SEO work added no
   class): **374 class rules renamed, 2,721 selector tokens rewritten, 0 merges, 0 page rows
   written**, 4 script assets (62 selectors, 20 classList/className tokens). Shell seq 198 → 199.
   Before publishing, the draft was compared with the backup: all 59 page rows identical cell for
   cell (31 carry `seoTitle`/`seoDescription`), `post` and `404` keep their template flags, the
   Framework is untouched. Published 06:04:20Z.
6. The user's hand edit travelled with its rule: it is now `.section_services .services_grid`
   with the same declaration. `flex-test` is still in the registry, empty and unused (the strict
   audit does not count unused rules, so it was not deleted).
7. **Local source** `workflows/04-design/.tmp/site-src` (tracked on this branch, so the pre-rename
   copy is commit `6f31c689`; an untracked tgz of it also sits at
   `04-design/.tmp/site-src.before-class-rename.2026-10-06.tgz`): `class-rename.mjs --files`
   → 110 files rewritten (1,405 selectors, 5,827 class attributes, 82 script selectors, 20 script
   tokens), `node build-site.mjs` → 56/56 pages into `final-site/`, `class-sync-check.mjs` on 37
   pages: **no old name on either side**. 168 text files, 12,880 lines replaced one for one,
   committed with this run.

## Gates
| Gate | Result |
| --- | --- |
| css parity 1440 | **0 real of 0 raw** |
| css parity 390 | **0 real of 0 raw** |
| css parity 1920 | 2 raw = one auto margin (`margin-left/right` 0 → 115.2px on `ads-landing-pages/tysons-dental-implants`, hero container). **Proven flipper**: on 2026-10-04 two captures of one unchanged state (`control`, `control2`) read 0px and 115.203px for this same element; the 12 sister pages read 115.203px in all eight captures. Within noise. |
| runtime parity (200 page/width captures) | Gate exit FAIL on one thing: a new console line `%c%d font-size:0;color:transparent NaN` on `index`, `contact-mclean`, `video-library`. **Cause: Cloudflare Turnstile's challenge iframe** inside the Vimeo, ReputationHub and GoHighLevel embeds. Production (old class names, untouched) logs the same line from the same frames today (96 / 32 / 16 vs staging 48 / 32 / 16); a page with no third-party frame logs none. Controls, stuck states and every other error: identical. The coordinator accepted this as the gate evidence and has since made the gate skip cross-origin frames (main `049da0b5`). |
| head parity (100 URLs) | **0 differences** (title, every meta, canonical, JSON-LD) |
| `migration-gates.mjs final` | **EDITABLE · IN BOUNDS** (364 classes in use, 0 out of bounds, 0 reimplemented) **· CLEAN** (100 pages, 319 scripts, 3 stylesheets, 377 old names: none published) |
| script-made elements (scripts on) | `.article_contents` (was `bl-toc`) and `.services_cursor-image` (was `sv-follow`) exist on staging with the same children as production's; the only style difference is the Framework rounding 15.6 → 15.68px that staging has had since 2026-10-04 |

## Next
- **Production**, after review: the block in main's `.claude/runbook/2026-10-05-fleet-class-standard.md`
  (same map; production also still needs the 2026-10-04 editability steps and has `landing.css`).
  Take a head snapshot before and after there too.
- **Client one-off scripts still name the old classes.** `push-footer-social.mjs` (staging never got
  the footer social row, 2026-10-05 run) looks for `foot-grid` / `foot-blurb`, now
  `footer_grid` / `footer_blurb` by the map: check the map before re-running any
  `22-instatic-api-sync/push-*.mjs` on staging. On production the old names stay until it migrates.
- `/doctor-referral` on staging still shows the "About Dr. Nahlah (PDF)" button production dropped
  (2026-10-05b); the draft is clear now, so that one-off can run (with the new class names).
- Local source leftovers, all outside the site registry and therefore outside the map: the 17 `rf-*`
  classes of the retired native referral form (`partials/referral-form.html`), `ct-office-flag`
  (matches nothing), and `bl-when`, which lives in the 43 post bodies in the CMS table and must be
  renamed together with them.
- `flex-test`: delete it in the Styles panel whenever convenient. The grid edit is the user's to
  keep or remove.
- seo-v3 `scan-sections.mjs` and `verify-seo-v3.mjs` read the visible trail from
  `<div class="pk-crumb">`; on staging that class is now `breadcrumb_component`. Both run against
  production today; update the two regexes when production migrates (or before pointing either at
  staging: the breadcrumb check would find no trail there).

## Gotchas
- **`class-rename --apply` writes no page row on this site** (every class is a registry chip, no raw
  class strings), so the SEO-cell drop found on the Brandklout website (main `9aaea03b`) could not
  bite here; the cell-for-cell draft check and the head gate prove it.
- Scripts-off css parity cannot see elements a script creates. The map covers three
  (`bl-toc`, `bl-faq`, `sv-follow`): check them with scripts on (`script-made-elements.mjs` in the
  fleet folder).
- A third-party frame can start logging between two captures. Find the emitter with the message's
  source URL and compare with the untouched host before reading it as a regression
  (`console-source.mjs`).
- The local build and the live site differ in content (the site is ahead through API pushes: Vimeo
  embeds, review widget, referral survey), so `class-sync-check` lists new-name differences on both
  sides; the line that matters is an old name, and there is none.

## Version Control
Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Committed on
`bk-dr-nahlah` only: the run and map status in `6f31c689`, the renamed `site-src` + rebuilt
`final-site` in the commit after it. The tgz backup is not committed.
