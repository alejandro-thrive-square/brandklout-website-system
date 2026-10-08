# IFA class standard: the rename map and the Framework spec

`class-map.json` moved every class in the IFA house build (`../code/site-src`) onto the Client-First +
Relume standard ([CLASS-STANDARD.md](../../../../../../process/tools/client-first-style-guide/CLASS-STANDARD.md)),
before launch. `framework-spec.json` holds the tokens the Framework panel owns: the 22 colours, and since
phase 2 (2026-10-08) the 10 house spacing steps and the 6 role-class type bases
([INSTATIC-FRAMEWORK.md](../../../../../../process/tools/client-first-style-guide/INSTATIC-FRAMEWORK.md)).

**Phase 2, structure (2026-10-08; run: `docs/runbook/2026-10-08-phase2-structure.md`, CLASS-STANDARD.md §10):**
`type-map.json` names which role class reads which Framework base (`heading-style-h1` → `size-h1` …; the map
`scale-tokens.mjs --type` takes); `combo-map.json` is the reviewed map of the 17 contextual overrides that
became combo classes (`.footer_column .text-style-label` → `text-style-label is-footer-column`, applied to the
source by `../code/site-src/tools/combo-classes.mjs`, which also proves a build with `--check dist`);
`framework.pulled.css` is `framework.mjs pull` of the live staging Framework (38 variables), the record the
`:root` block of `../code/site-src/css/01-tokens.css` must match. Two overrides stay by hand (three-class
selectors the tool refuses): `.is-cosmetic .checklist_copy .text-style-lede` and
`.is-gallery-lightbox .lightbox_caption .text-style-label`.

**Applied on 2026-10-06, source and staging** (run: `docs/runbook/2026-10-06-class-standard-on-staging.md`):
site-src and `push/` renamed with this map, rebuilt, pushed to `staging.ifadentistry.com`, the stylesheet
moved into the style registry and the colours into the Framework. Staging reads EDITABLE, IN BOUNDS, CLEAN.
Production is the old WordPress clone and is not touched by any of this. The map is now history: it says
what each old name became. New classes follow `../code/site-src/KIT.md` (*Class names*).

- **371 renames**, every one written out (no `folders`: `--files` mode only reads `rename`). They cover the
  audit's 351 out-of-bounds classes, plus 20 that only appear in CSS or are added by scripts
  (`no-motion`, SplitText's `ln` / `ln-mask` / `w`, the unused kit pieces `voices*`, `say__by`, `band__cta`,
  `tiles--2`, `pad--top`, …, and `ask--live`, which `push/prepare.mjs` creates).
- New names: 284 custom (`folder_element`), 63 combos (`is-*`), 16 library, 8 site utilities
  (`text-style-lede`, `text-style-label`, `text-color-muted`, `background-color-{white,sand,mist,bone,paper}`).
  Every one passes `classify()` in `class-audit-lib.mjs`, none already exists in site-src, and no two old
  names share a new one.
- **Not renamed:** `tag` (a library name, read by scripts), the existing state combos (`is-on`, `is-open`,
  `is-live`, `is-gold`, …), `elfsight-app-7febe92d-…` (Elfsight needs that exact class), `asw-menu-btn`
  (the Sienna widget's own button, CSS only).
- `notes` in the map explains each non-obvious choice.

## Why every combo name is unique

The CSS writes modifiers bare (`.row--flip { … }`, `.btn--gold:hover`), never compounded with their base
(`.row.row--flip`). So if `row--flip`, `pull--flip` and `signs--flip` all became `is-flip`, the row's
`grid-template-columns` would land on the pull and the signs too. Each flip is named by what comes
first instead: `is-text-first` (row), `is-quote-first` (pull), `is-list-first` (signs), `is-photo-first`
(case), `is-hero-photo-first` (the cosmetic hero). Sharing one combo name is possible later, once the
selectors are compounded by hand (`.row_item.is-flip`).

## What the tool printed (dry run 2026-10-05, the same numbers on the apply of 2026-10-06)

```
node class-rename.mjs --files <site-src> --map class-map.json
  83 file(s) would change: selectors 1370, class attributes 4671, script selectors 73, script tokens 11
```

Its REVIEW lines are all harmless (script tokens rose from 5 to 11 because the engine now rewrites the
SplitText `linesClass` / `wordsClass` options itself): copy that happens to contain a
mapped word (`compare`, `specialist`, `where`, `more`, `say`, `case`, `ask`, `voice`, `statement`, `link`),
the tag selector `'nav a'` in `js/00-core.js`, and in `tools/gen-journal.mjs` a tag list (`'nav'`, line 292)
and a regex flag (`'g'`, line 385).

`push/` (outside site-src) also names classes: `--files ../code/push` would change 1 file (script selectors
2, script tokens 2) and reviews `ask__embed`. `workflows/21-instatic-upload/home/` (2 files would change) is
the home pipeline that `push/README.md` says is replaced; leave it.

`class-audit.mjs --local site-src` before the rename: 356 classes in use, 351 out of bounds (99%),
2 reimplement a utility (`nav__logo--dark` = `hide`, `care-fig--product` = `aspect-ratio-widescreen`; both
are mapped to those library names).

## Hand edits after `--apply` (2026-10-06)

Only one was left: `push/prepare.mjs:103`, `holder('ghl-form', 'ask__embed')` became `'form_embed'` (a bare
argument the engine lists as REVIEW). The six SplitText options (`linesClass: 'ln'` -> `'split_line'`,
`wordsClass: 'w'` -> `'split_word'` in `js/00-core.js`, `js/10-home.js`, `js/30-pages.js`) and
`push/prepare.mjs` lines 99 and 102 were rewritten by the engine. `KIT.md` was rewritten with the new names.

**`build.mjs` needs nothing.** It builds no class names and its regexes read `data-embed`, `aria-current`,
`<h1`, `src`/`srcset` and `{{key}}`, never a class. No page passes a class through a partial argument
(`{{…}}` never appears inside a `class="…"`), and no script concatenates a class name. The one generator that
writes class markup, `tools/gen-journal.mjs`, is inside site-src and is rewritten by the engine (its regexes at
lines 349-350 read the old WordPress markup, `item` / `brxe-*`, which are not in the map).

`workflows/21-instatic-upload/home/` (the retired home pipeline) still carries the old names and was left
alone: it must not be run (`push/README.md`).

## Proof (2026-10-06)

- **Local:** the rebuilt `dist/` is the pre-rename build with the map applied, byte for byte, on all 58 pages
  and `site.css`; `class-audit.mjs --local site-src --strict` reads IN BOUNDS (356 classes, 0 out of bounds,
  0 reimplemented utilities; warnings carried over: 13 identical groups, 37 font sizes outside a role, 285
  contextual rules, 61 script references to styling classes); `tools/sweep.mjs` 58 pages clean.
- **Staging:** see the run file for the gate table (css parity, runtime parity, published HTML and head
  comparison, EDITABLE, IN BOUNDS, CLEAN).
- A backup of the pre-rename source is in git (`01502dc3` and before).

## Framework spec

`framework-spec.json` was drafted with `framework.mjs extract` from the built stylesheet and applied as
drafted: 22 colours (`ink` ... `on-light-dim`; `accent-text` is `var(--gold-deep)`), root font size 16. Its
`stays` list is what remains in the registry `:root` on purpose: the fluid-root numbers, the per-breakpoint
scale multipliers (`--s-d1` ...), `--gutter` and `--nav-h` (redefined per breakpoint), the font stacks and the
easing. Since 2026-10-08 the spec also holds `typography` (`size-h1-base` 96px … `size-text-label-base`
12.48px) and `spacing` (`space-xxsmall` 4px … `space-xxhuge` 192px); the role classes read `var(--size-h1)` …,
formulas kept in the registry `:root` (`--size-h1: calc(var(--size-h1-base) * var(--s-d1))`), and every rem
spacing value that equals a house step reads `var(--space-*)`. `push/editable.mjs` reads this file after every
push and adds only what the Framework lacks (a panel edit is never overwritten).

## Open questions (follow-ups; none blocks the standard)

1. ~~The Elfsight class.~~ Settled: `class-audit.mjs` now counts `elfsight-app-*` as a vendor class; the
   local gate reads IN BOUNDS with `--strict`.
2. **`ch` -> `section_chapter`.** Every chapter carries it (300 uses); the home chapters also get
   `section_<beat>`. The kit pages have no beat class (their beat is only `data-chapter-name`). Adding
   `section_<beat>` per kit page is a markup change, not a rename: wanted?
3. **Kit chapter scaffolding** is named `chapter_header` (`ch__row`), `chapter_intro`, `chapter_heading`
   (`ch__head`, home): fine, or another folder?
4. **Type roles.** `d1`-`d4` -> `heading-style-h1`…`h4` keeps their sizes on the class; the plain `h1`-`h4`
   tag selectors carry no size today. Client-First wants the tags styled first: a follow-up, not a rename.
5. **Library names with site values:** `wrap` -> `container-large` keeps its `padding-inline` gutter (Client-
   First splits that into `padding-global`); `prose` -> `text-rich-text`; `btn` -> `button` with
   `is-primary` (gold) / `is-secondary` (outline) / `is-alternate` (ink). Agree?
6. **`nav__logo--dark` -> `hide`.** The dark logo is `display:none` and no rule ever shows it: the element
   could simply be removed from `partials/chrome.html` instead.
7. **Group scope classes become combos** named for the page group (`cos-ch` -> `is-cosmetic`, `ab-stack` ->
   `is-about-stack`, `care-stack` -> `is-care-stack`, …). Several only patch one rule (a margin, a filter
   start value); folding them into the kit would remove them.
8. **Duplicates the audit lists** (e.g. `ba__*` / `compare__*`, `faq__list` / `more__list`) are left as
   separate classes; merging is a later, visual-diffed step.
9. **Scripts select by styling class** (66 refs: `js/30-pages.js` alone reads `hero--split`, `.line__dot`,
   `.more`, …). The rename keeps them working; CLASS-STANDARD §6 wants `data-` hooks instead.

## Version Control

Follows the root rules in [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md). `class-map.json` and
this README are lightweight step artifacts and may be committed by the session that owns this worktree.
