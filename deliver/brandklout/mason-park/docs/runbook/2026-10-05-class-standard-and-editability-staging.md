# 2026-10-05 — Client-First class standard + everything editable, STAGING

Standard: `deliver/process/tools/client-first-style-guide/CLASS-STANDARD.md` and `INSTATIC-FRAMEWORK.md`
on main; tools in `deliver/process/tools/instatic-api-sync/`. Done by a migration agent, Framework
step and final checks by the orchestrator. **Production untouched** (its draft has an unrelated
unpublished edit from 2026-10-04 17:51Z, `.pr-badges-in`: resolve before any production publish).

## Done (staging.masonparkdental.com)
- Backup before any write: `instatic-api-sync/output/fleet/mason-park/backup-pre-migration` (seq 157,
  65 page rows; local). Draft matched published before every write.
- **CSS**: `src/styles/mason-park.css` (1,898 rules + 2 @keyframes) moved into the registry in source
  order (`css-to-registry.mjs`, no `--in-place`), asset disabled. css parity before→mid: 0 real at
  1440/390/1920. Runtime differences (GHL form iframe heights, FAQ summaries, a bottom-of-page reveal)
  were checked A/B against the pre-migration HTML: the same in the old state.
- **Classes**: `workflows/class-standard/class-map.json` (generated with notes; 497 renames + 4
  merges): `ch` → `chapter_component`, `ch-X` → `section_X`, chapter prefixes → full words (`arrival_`,
  `relay_`, `together_`, `range_`, `people_`, `path_`, `proof_`, `invitation_` …), `cp-`/`el-` blocks →
  component names (`ticket_`, `price-list_`, `equipment_`, `tabs_`, `finder_`, `mosaic_` …),
  `svc-card` → `content-card` (`service-card_*` existed), `has-dropdown` → `is-dropdown`, `is-lg` →
  `is-large`, `visually-hidden` → `hide-visually`, `cp-kicker` → `text-style-tagline`, script state
  classes → `is-*`; 4 `ch-*` merged into existing empty `section_*` rules. 425 rules, 3,770 selector
  tokens, 4 page edits, 127 script tokens. css parity mid→after: 0 real of 0 raw.
- **Framework**: `workflows/class-standard/framework-spec.json` (26 colours, 6 exact type sizes,
  `--maxw`) applied once `framework.mjs` learned to edit several `:root` rules (the moved stylesheet
  left 14): the Framework owns 33 variables. css parity after→after2: 0 raw at every width.
- **Final**: editability EDITABLE, class-audit IN BOUNDS (7 custom classes equal to a utility are
  reuse hints), class-rename --verify CLEAN.

## Next
- Production after review: same steps (system run `2026-10-05-fleet-class-standard.md`), after the
  unrelated production draft is published or discarded.
- Advisory: 15 identical-class groups, 89 classes with their own font size, 529 contextual rules.

## Gotchas
- `--verify` used to flag comments and GSAP's `utils.wrap` in `001-mason-park.js`: fixed on main.
- `--maxw` and `--ch-pad`/`--bleed`: the last two change at breakpoints and stay in the registry.
