# 2026-10-06 — Client-First class names and "everything editable" on staging

Fleet migration (system runbook `.claude/runbook/2026-10-05-fleet-class-standard.md` on main), the IFA
session. Brief: migrate the rebuilt site at the SOURCE, push it, make it editable, prove nothing moved.
**Staging only.** Production (the WordPress clone on `www.ifadentistry.com`) was not touched.

## Done

- **site-src renamed** with `scenario-0-new-site/03-design-build/output/class-standard/class-map.json`
  (371 renames; 83 files: 1,370 selectors, 4,671 class attributes, 73 script selectors, 11 script
  tokens) and `push/` (1 file). One hand edit (`push/prepare.mjs`: `form_embed`). `KIT.md` rewritten with
  the new names plus a *Class names* section. The rebuilt `dist/` is the pre-rename build with the map
  applied, byte for byte (58 pages + `site.css`); local audit `--strict` IN BOUNDS; `tools/sweep.mjs` clean.
- **Pushed to staging and published** (replace push, 58 pages, every existing row id kept). The push
  carried what site-src had queued since 2026-10-01: the **HIPAA Disclosure page** and its **footer
  link** (`ee7f64db`, `ea7dd53c`; approved, already on production). Also one slashless link fixed in
  that page (`/privacy-policy` -> `/privacy-policy/`, the site's own sweep gate).
- **Editable**: `site.css` moved into the style registry (1,037 rules: 293 into their class chip, 38
  folded, 705 selector rules, 1 keyframes; the 8 `@font-face` blocks stay in the code asset), 22 colour
  tokens into the Framework panel (root font size 16), their `:root` copies removed.
- **The pipeline does all of it from now on**: `push/editable.mjs` (after every push: the push replaces
  the registry) and `push/cascade-check.mjs` (gate after the publish). `push/README.md` has the order.
  The final state on staging was produced by that pipeline end to end (second push, below).
- Staging: seq 18, published 2026-10-06 07:38Z, `draftMatchesPublished: true`.

## Gates (staging)

| Gate | Result |
| --- | --- |
| `editability.mjs --published` | **EDITABLE** (Framework owns 22 variables, registry 1,055 rules, asset = `@font-face` only) |
| `class-audit.mjs --site --strict` | **IN BOUNDS**: 349 classes, 0 out of bounds, 0 reimplemented utilities |
| `class-rename.mjs --verify` | **CLEAN**: 57 pages, 173 scripts, 4 stylesheets scanned for 371 old names |
| `class-sync-check.mjs` | build = site on 58 pages, except the form slot the pipeline swaps for the GoHighLevel embed |
| `push/cascade-check.mjs` | **OK**: 3,404 declarations all published, 0 order swaps the cascade can see |
| Published HTML, before vs now | 57 of 57 pages (404 included) byte-identical once the class map is applied and build hashes, the HIPAA link and the new `style-*.css` link are masked |
| Published `<head>`, before vs now | 57 of 57 identical (title, description, robots, canonical, og/twitter, favicon, JSON-LD) |
| css parity `before -> mid` (push, code-asset CSS) and `before -> after2` (end to end) | 112 / 728 / 112 at 1440 / 390 / 1920 both times, **every line the new footer link** (see below) |
| css parity `mid -> after` (registry + Framework) | **0 / 0 / 0 real** at 1440 / 390 / 1920 on the final state (`after2`; 1920 has 2 raw, both capture noise). The first attempt (`after`) read 0 / 3 / 0: the fold swap below |
| All-breakpoints sweep (published registry vs the original stylesheet, same page load) | **0 differences**: 58 pages x 12 viewports, 230,380 element captures, every computed property |
| runtime parity | `mid -> after2` **OK** (no difference survives a second capture). `before -> after2`: one item, an article page at 390 whose BASELINE capture had no form loaded (below) |

`before -> mid`, read line by line: at 1440 and 1920 exactly two lines per page (56 pages): the widths
of the 3rd and 4th links of `footer > p` (`Terms of Service` moved one place right, `HIPAA Disclosure`
took its place). At 390 thirteen per page: the same two widths, then the legal row's height (+38.5px,
it wraps to one more line), and that height carried up through the footer, its grid rows, the section,
its background wrapper/image, `main`, the smooth wrappers and `body`. Nothing else. The row reads
cleanly at 390 (three lines, no overflow) and on one row at 1440.

Runtime: the only console error kind in any snapshot is a Cloudflare Turnstile line from the
GoHighLevel form iframe (`%c%d font-size:0;color:transparent NaN`), present in 107 of 112 baseline
captures; a "new error" is a page whose baseline capture happened not to have it. Page heights: 0 at
1440, +38/39 at 390 (the footer row); the outliers (+901 on one article at 390) are baseline captures
where the form had not loaded (three re-captures of the published page: 13,688 / 13,688 / 13,628).

## The one real regression, found and fixed forward

`mid -> after` first read 0 at 1440 and 1920 but **3 real at 390**: the home's closing path step
(`li.path_step.is-closing`) was 76vw instead of 84vw at <=767. Cause: `css-to-registry` folded
`.is-closing`'s <=767 override into its class chip but left `.path_step`'s as a later rule, so two bare
classes on one element swapped order. Reported (`output/fleet/ifa-dentistry/TOOL-BUG.md` section 2 on
main; fixed there in `6789a211`). Fixed here at the source: the combo is written compound
(`css/30-home.css`: `.path_step.is-closing`), so specificity decides. Rebuilt, pushed again through
the documented pipeline (`editable.mjs --apply` for real), published, and every gate re-run.

To know it was the only one: a static pair check over all 3,404 declarations (now
`push/cascade-check.mjs`, and `order-pairs.mjs` on main) and a browser sweep written for this run
(`output/fleet/ifa-dentistry/cascade-sweep.mjs` on main): every page at 12 viewports covering every
breakpoint band and both height conditions, all computed properties, the published stylesheets against
the original stylesheet injected in their place in the same page load.

## Next

- **Review staging, then production is a separate decision**: production is still the WordPress clone;
  this build reaches it with the launch (the push pipeline is staging-locked on purpose).
- BugHerd team review continues on staging as before (selectors in old BugHerd notes name old classes).
- Follow-ups listed in `class-standard/README.md` (*Open questions*): `section_<beat>` on kit pages,
  `data-` hooks for the 58 script references to styling classes, tag-level type sizes, merging the 15
  identical class groups, removing the hidden dark logo.

## Gotchas

- **After every push run `node push/editable.mjs --apply` before publishing.** The push replaces the
  registry with bare classes and re-adds `site.css` as an enabled code asset: without the step the site
  works but is not editable (the editability gate fails).
- **Colours live in the Framework panel now.** `editable.mjs` only adds a token the Framework lacks and
  never overwrites one. Change a colour in the panel, then mirror it into `site-src/css/01-tokens.css`
  and `class-standard/framework-spec.json`.
- **A Styles-panel edit is overwritten by the next push** (the push is a replace from site-src). Copy
  it into `site-src/css/` first. Nothing detects it.
- **Combos that set a property their base class also sets are written compound** (`.a.is-x`).
  `push/cascade-check.mjs` fails on a swap; the css gates sample only three widths.
- The registry holds one value per property per rule: the 13 `vh` fallbacks before an `svh` value are
  gone on the site (pre-2022 browsers).
- The parity gates skip template rows, so **the 404 page is not in them**: it was compared by hand
  (published HTML and head identical).
- The worktree `.env` points at production. Staging API steps go through
  `node tools/instatic-api-sync/with-site.mjs institute-for-advanced-dentistry:staging -- <command>`.
- Fleet tool paths use the client folder name: logs are in
  `output/fleet/institute-for-advanced-dentistry/`, this session's backups and STATUS in
  `output/fleet/ifa-dentistry/` (main checkout, gitignored).
- Rollback: `output/fleet/ifa-dentistry/backup-pre-migration/` (site.json + pages.json, seq 12),
  `push/.tmp/staging-snapshot-pre-class-standard-seq12.json.gz`, and the DB copy on the staging volume
  `/app/storage/backups/cms-2026-10-06-pre-class-standard.db`. The pre-rename source is `01502dc3`.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
