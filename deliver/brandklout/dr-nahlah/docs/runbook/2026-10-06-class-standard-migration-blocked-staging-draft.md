# 2026-10-06 — Class-standard migration on STAGING: blocked at step 0 by an undocumented draft edit

Fleet brief: `deliver/process/tools/instatic-api-sync/output/fleet/BRIEF-common.md` +
`BRIEF-dr-nahlah.md` (main checkout). Standard: `CLASS-STANDARD.md` §8. **Nothing was written to
staging, nothing was published, production was not touched.** Status for the coordinator:
`output/fleet/dr-nahlah/STATUS.md` (first line `BLOCKED: …`).

## Found
`status.mjs --site dr-nahlah:staging` → `draftMatchesPublished: false` (last publish
2026-10-05T03:37:45Z). The REST API cannot read the published document, so the draft was compared
with the published snapshot **inside the staging database, read-only** (`railway ssh` into the
`staging` environment, `bun:sqlite` opened `{ readonly: true }`; `site_snapshots.site_json` holds
the published shell and all 59 page trees). Evidence and scripts:
`output/fleet/dr-nahlah/preflight/` in the main checkout (gitignored).

Everything that is pending on staging's draft:

| Pending | Documented in | Finished? |
| --- | --- | --- |
| `title` / `seoTitle` / `seoDescription` cells on 30 page rows (2026-10-06 02:15Z) | 2026-10-05d, "Staging synced to production" | yes |
| 26 `jsonld/*.js` scripts retired, `seo-head.js` trimmed, `site.js` no longer appends the blog FAQ JSON-LD | 2026-10-05d | yes |
| Plugin stores: aeo-schema 1.3.0 + settings, OG overrides, AEO blocks | 2026-10-05d, 2026-10-05g | yes |
| **Registry rule `.ch-services .sv-grid` (`XN7-JIZ098SDMaMIRqN2N`) gained `grid-template-rows: repeat(2, 1fr)` at 2026-10-05T03:57:44Z** | nowhere | **unknown** |
| **Class `flex-test` (`YmzqpiqVdfPpsBXkZPIVS`) created empty at 03:59:54Z, on no element** | nowhere | **unknown** |
| `index` row re-saved 04:04:19Z | — | body identical to published |

- **Page bodies: 0 of 59 differ.** Framework, runtime map, conditions and breakpoints are identical.
- The two registry edits are Styles-panel saves under the owner account, 20 minutes after the
  2026-10-04 session's last publish. No tool run made them (the only earlier transcript that names
  `flex-test` first saw it at 14:02Z while preparing the class map). The user was at the keyboard
  at 04:02Z and 04:09Z, so the likeliest author is the user trying the Styles panel by hand. That is
  an inference; the instance keeps no audit record of editor saves.
- Measured on the published home page with the declaration injected in the browser only, at 1440,
  1100, 800, 600 and 390: **no change** (rows 1 and 2 of the services grid are already equal).
  `flex-test` has no declarations.

The brief says to publish staging once only if every pending change is documented finished work, and
otherwise to stop. Two are not documented, so the migration stopped here.

## Corrected
Three earlier runs (2026-10-05, 2026-10-05b, 2026-10-05d) say staging's draft "holds the unreviewed
class map". It never did: the class map (`5f93a76c`) was only ever dry-run. What the draft held on
2026-10-05 was the two Styles-panel edits above; the SEO sync was added to it later that day.

## Ready for the restart (read-only checks, all on the current draft, seq 198)
- `editability.mjs --published` → **EDITABLE** (58 pages, 3 stylesheets): §8 step 2 can be skipped.
- `class-audit.mjs`: 364 classes in use, 354 out of bounds; **every one is in the committed map**
  (`workflows/22-instatic-api-sync/class-standard/class-map.json`, 377 renames, 0 merges). The SEO
  work added no class. The map needs no extension.
- `class-rename.mjs` dry run: 374 class rules renamed, 2,721 selector tokens rewritten, 0 page node
  edits, 4 script assets (62 selectors, 20 classList/className tokens). REVIEW lines (11, all left
  unchanged, all fine): `label`, `nav`, `section`, `burger`, `drawer` are tag names / data values in
  `site.js`; `'bl-toc'` is a `className` the engine rewrites in its class context; and
  `brandklout-consent-preferences.js` selects `[class*="foot"]`, which the new `footer_*` names
  still match.
- The map renames `ch-services` → `section_services` and `sv-grid` → `services_grid`, so the hand
  edit's declaration travels with its rule if it is published first. `flex-test` is left out of the
  map on purpose (notes: delete it).

## Next (one decision, then the brief runs as written)
1. Decide the two hand edits: **publish as is** (`node output/publish.mjs --site dr-nahlah:staging`,
   ships them with the SEO sync; no visible change measured) **or drop them** (remove
   `gridTemplateRows` from rule `XN7-JIZ098SDMaMIRqN2N`, delete rule `YmzqpiqVdfPpsBXkZPIVS`), then
   publish the SEO sync.
2. Then §8 from step 0: status true → `backup-site.mjs` → `migration-gates.mjs snapshot before`
   (59 pages + the 43 post entries; gates include collection entries since main `c0397383`) → skip
   step 2 (EDITABLE) → `class-rename --apply` → publish → `snapshot after` → `diff` → `final`.
3. After that publish: `push-footer-social.mjs` on staging (2026-10-05 run) will stop on the renamed
   `foot-grid` / `foot-blurb`; point it at the new names first.

## Gotchas
- **`draftMatchesPublished: false` does not say what differs, and `updatedAt` on a row lies about
  it**: the home row showed a 04:04Z save with a byte-identical body. The published truth is
  `site_snapshots` (newest row) on the container: `pages[]` = `{id, slug, title, nodes,
  rootNodeId}`, plus the whole shell. `data_row_versions.cells_json` for a page holds only
  `title` + `slug`.
- `railway ssh "<long command>"` echoes a command line over ~8 KB back instead of running it. Ship a
  script base64 in ≤3,000-char chunks with `printf %s … >>`, and give `railway` `</dev/null` inside
  a `while read` loop or it swallows the remaining chunks. Project `2536e8b9-…`, environment
  `staging` = `bfaded13-…`; the script prints `PUBLIC_ORIGIN` first as the staging proof.
- Editor saves (`PUT /site-document`) are not in `audit_events`; row PATCHes, publishes, plugin
  changes and logins are.
- With three fleet sessions capturing, a plain `page.goto(..., 'load')` on the home page timed out at
  90 s; `domcontentloaded` + a fixed wait worked.

## Version Control
Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Committed on
`bk-dr-nahlah` only.
