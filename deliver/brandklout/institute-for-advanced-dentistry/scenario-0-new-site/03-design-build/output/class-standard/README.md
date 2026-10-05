# IFA class standard: rename map for the local build

`class-map.json` moves every class in the IFA house build (`../code/site-src`) onto the Client-First +
Relume standard ([CLASS-STANDARD.md](../../../../../../process/tools/client-first-style-guide/CLASS-STANDARD.md)),
before launch. **Prepared on 2026-10-05 as a dry run only. Nothing in site-src has been changed.**

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

## Dry run (what the tool printed)

```
node class-rename.mjs --files <site-src> --map class-map.json
  83 file(s) would change: selectors 1370, class attributes 4671, script selectors 73, script tokens 5
```

Its 22 REVIEW lines are all harmless except the SplitText options below: copy that happens to contain a
mapped word (`compare`, `specialist`, `where`, `more`, `say`, `case`, `ask`, `voice`, `statement`, `link`),
the tag selector `'nav a'` in `js/00-core.js`, and in `tools/gen-journal.mjs` a tag list (`'nav'`, line 292)
and a regex flag (`'g'`, line 385).

`push/` (outside site-src) also names classes: `--files ../code/push` would change 1 file (script selectors
2, script tokens 2) and reviews `ask__embed`. `workflows/21-instatic-upload/home/` (2 files would change) is
the home pipeline that `push/README.md` says is replaced; leave it.

`class-audit.mjs --local site-src` before the rename: 356 classes in use, 351 out of bounds (99%),
2 reimplement a utility (`nav__logo--dark` = `hide`, `care-fig--product` = `aspect-ratio-widescreen`; both
are mapped to those library names).

## Hand edits after `--apply` (the engine does not touch these)

| File:line | Now | Change to | Why |
| --- | --- | --- | --- |
| `site-src/js/00-core.js:249` | `linesClass: 'ln'` | `'split_line'` | SplitText option, not a class context. Its mask class is `<linesClass>-mask`, and the CSS rule `.ln-mask` (`css/02-base.css:78`) is renamed to `.split_line-mask`: skip this and the line masks lose their descender room |
| `site-src/js/10-home.js:115` | `linesClass: 'ln'` | `'split_line'` | same |
| `site-src/js/10-home.js:164`, `:165` | `wordsClass: 'w'` | `'split_word'` | `.question__stage.is-live .statement .w` (`css/30-home.css:67`) becomes `.split_word` |
| `site-src/js/30-pages.js:104` | `linesClass: 'ln'` | `'split_line'` | same as 00-core |
| `site-src/js/30-pages.js:138` | `wordsClass: 'w'` | `'split_word'` | same |
| `push/prepare.mjs:103` | `holder('ghl-form', 'ask__embed')` | `'form_embed'` | a bare argument; lines 99 (`'ask ask--live'`) and 102 (`'.ask__title'`, `'.ask__sub'`) are rewritten if `--files ../code/push` is run with the same map, otherwise edit them too (`form_component is-embedded`, `.form_title`, `.form_subtitle`) |

**`build.mjs` needs nothing.** It builds no class names and its regexes read `data-embed`, `aria-current`,
`<h1`, `src`/`srcset` and `{{key}}`, never a class. No page passes a class through a partial argument
(`{{…}}` never appears inside a `class="…"`), and no script concatenates a class name. The one generator that
writes class markup, `tools/gen-journal.mjs`, is inside site-src and is rewritten by the engine (its regexes at
lines 349-350 read the old WordPress markup, `item` / `brxe-*`, which are not in the map).

`site-src/KIT.md` describes the kit by its old class names (the section table, the page anatomy, the
lessons): rewrite it with the new names in the same change (Documentation Integrity Rule).

## How to apply (the session that owns site-src)

```bash
# from deliver/process/tools/instatic-api-sync/ ; SS = .../03-design-build/output
tar --force-local --exclude=site-src/dist --exclude=site-src/media -czf "$LOCALAPPDATA/Temp/ifa-site-src-pre-rename.tgz" -C "$SS/code" site-src push
node class-rename.mjs --files "$SS/code/site-src" --map "$SS/class-standard/class-map.json"          # dry run: expect the numbers above
node class-rename.mjs --files "$SS/code/site-src" --map "$SS/class-standard/class-map.json" --apply
node class-rename.mjs --files "$SS/code/push"     --map "$SS/class-standard/class-map.json" --apply
# the hand edits in the table above, then a FULL build (the audit reads dist/):
cd "$SS/code/site-src" && node build.mjs > build.log 2>&1
node class-audit.mjs --local "$SS/code/site-src" --strict
# then tools/sweep.mjs and walk.mjs at 1440 and 390 on a few pages per group (home, a split hero, gallery,
# an article, 404): the rename must not change a pixel
```

Note: `class-rename.mjs --files` does **not** check collisions or classify new names (only `--site` does);
that check was done when the map was written (see above). If the map is edited, re-check it.

**Expected audit result:** every class in bounds and 0 reimplemented utilities, **except
`elfsight-app-7febe92d-b5da-447f-b53f-9593eec9da53`**, which `build.mjs` copies into `dist/` from
`data/embeds.json` for the local preview. `--strict` will exit 1 on that one name until it is resolved
(open question 1). A rename does not change declarations or selectors' shape, so what today's audit
reports as warnings should carry over under the new names: identical classes (13 groups), `font-size`
outside a role (43, e.g. `invitation_title`, `faq_question`), contextual rules (312) and styling classes
read by scripts (66 references in 7 files): the follow-ups below. (Expected, not run: no `--apply` was made.)

## Open questions

1. **The Elfsight class.** Either `class-audit.mjs` exempts third-party widget classes (`elfsight-app-*`,
   a tool change on main), or the local audit runs on a build without embed previews. Until then the
   local gate cannot read IN BOUNDS with `--strict`.
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
