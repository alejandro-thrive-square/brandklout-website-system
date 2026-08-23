# Client-First Mapping — v2 design → live Relume style guide

Target site: **Dr. Nahlah** `6a6b84cc7fe55ddeabc0b314`.
Style guide: **Relume Style Guide v3.0**, page `6a6b84cf7fe55ddeabc0b3c3`, already installed.
Live vocabulary: **296 classes** → `mcp-servers/webflow-clientfirst/.tmp/vocab-live-nahlah.json`.
Variable collections: Primitives · Color Schemes · Typography · UI Styles.

## Why this file exists

`suggest_reuse` proved reuse cannot be inferred from CSS similarity (4% honest coverage).
This is the hand-authored mapping instead. Each row becomes a `data-cf` attribute in the
design package; the converter then **applies the class and emits no style**, so the
element inherits the style guide's existing variable bindings for free.

## Type scale

Our fluid `clamp()` values resolve to concrete px per breakpoint. Where a Relume class
already covers the role, use it and drop our value entirely.

| Our token | Desktop / Tablet / Mobile | `data-cf` | Note |
| :--- | :--- | :--- | :--- |
| `--d1` hero | 118 / 81 / 62 px | `heading-style-h1` | Size override on the combo, not a new class |
| `--d2` | 79 / 54 / 42 px | `heading-style-h2` | |
| `--h2` | 51.84 / 35.68 / 30.4 px | `heading-style-h2` | |
| `--h3` | 32 / 22 / 21.6 px | `heading-style-h4` | |
| `--body-lg` | 18 / 16.8 / 16.8 px | `text-size-medium` | |
| `--body` | 15.6 px (flat) | `text-size-regular` | |
| `--label` | 11.2 / 7.7 / 10.9 px | `text-size-tiny` + `text-style-allcaps` | |

Weights: 300 → `text-weight-light`, 400 → `text-weight-normal`, 500 → `text-weight-medium`,
600 → `text-weight-semibold`, 700 → `text-weight-bold`.

## Layout & spacing

| Our CSS | `data-cf` |
| :--- | :--- |
| `.wrap` (max-width 1560 + gutter) | `container-large` inside `padding-global` |
| `.section` (`padding-block: clamp(4.5rem,9vw,9.5rem)`) | `padding-section-large` |
| Chapter shell | `page-wrapper` > `main-wrapper` > `section_*` |
| Vertical rhythm between blocks | `spacer-medium` / `spacer-large` / `spacer-xlarge` |
| Constrained copy columns | `max-width-medium` / `max-width-large` |
| `.btn-primary` / `.btn-ghost` / `.btn-dark` | `button` (+ combo for variants), group in `button-group` |
| `.chapter-tag`, ticker rows | `align-center`, `text-style-allcaps` |

## What stays bespoke (namespaced, not reused)

These have no Relume equivalent and should be emitted as **prefixed** custom classes
(`nahlah-*`) — never as bare tag names:

- Chapter 04 pinned before/after wipe: `.cmp`, `.cmp .aft`, `.cmp .handle`, `--pos`
- Chapter 05 horizontal track: `.ch-path .track`, `.card`, `.bar`
- Chapter 00 hero portrait plate and scrim stack
- Chapter 02 us-vs-them table gold gradient column
- Chapter 06 `.std` panel clip-path masks
- Chapter 03 portrait plate + signature block
- The nav progress bar

Everything else — headings, body copy, labels, buttons, containers, section padding,
spacers — should resolve to a style-guide class.

## Conversion contract

A payload may only be pasted when `webflow-clientfirst > validate_payload` returns:

```
pass: true          // 0 CSS functions, 0 bare tag names
reuse.reusePct >= 60
```

Current state, unconverted: **258 styles, 186 CSS functions, 126 bare names, 0% reuse.**

## Order of operations

1. Annotate the v2 package with `data-cf` per the tables above.
2. Teach `html_to_webflow.py` to honour `data-cf` — apply the class, skip style emission.
3. Wire `--page-prefix nahlah` so any residual auto-name is namespaced.
4. `resolve_fluid` over what remains (174/186 already resolve cleanly).
5. `validate_payload` as the gate.
6. Paste **one chapter** into a duplicate of Home as a spike. Verify the style panel shows
   real numbers, not 0, and that no style-guide class was overwritten.
7. Only then convert the remaining eight.

## Risk to watch on the spike

The Relume style guide is **live on this site**. Webflow merges pasted classes by name
site-wide, so a payload containing `h2` or `button` with our definitions could silently
redefine the style guide. Paste into a duplicated page first, and diff the style guide
before/after (`get_styles` on page `6a6b84cf7fe55ddeabc0b3c3`) to confirm nothing moved.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).

---

## PROVEN RISK — do not paste the current payloads

Validated one chapter (`specialist`, 27 styles) against the **live** site vocabulary:

```
pass: false | cssFunctions 12 | bareTagNames 16 | reuse 26% (7 reused / 20 forked)
```

The 26% is not reuse. **All 7 "matches" are bare tag names that already exist as
tag-level styles in the live Relume style guide.** Pasting would overwrite them
site-wide:

| Class | What our payload would push onto the live style guide |
| :--- | :--- |
| `img` | `position: absolute; left: 50%; max-width: none` — on **every image on the site** |
| `h2` | our margins, replacing the Relume heading rhythm |
| `h4` | same |
| `p` | our margins |
| `ul` | `list-style: none` globally |
| `li` | `display: grid` globally |
| `label` | a `clamp()` font-size — which then reads **0** in the style panel |

That is one chapter of nine. Webflow merges by name and the pasted definition wins for
properties it sets, so this would silently damage the style guide the whole site depends
on — and the damage would look like "the site randomly broke", not like a bad paste.

**Gate before any paste**: `validate_payload` must return `pass: true` **and** the
`collisions` array must be empty. Currently it returns `pass: false` with 7 collisions on
a single chapter.

This is exactly why `--page-prefix` must be wired up and `data-cf` annotation added
before anything touches the site.

---

## RESOLVED 2026-07-30 — all nine chapters pass the gate

| Metric | Before | After |
| :--- | ---: | ---: |
| CSS functions in `styleLess` | 198 | **0** |
| Bare tag-name classes | 128 | **0** |
| Style-guide classes reused | 3 | **73** |
| **Style-guide overwrites (corruption risk)** | **41** | **0** |

`validate_payload` returns `pass: true` for all nine. Payloads:
`07-webflow-build/.tmp/final/<chapter>.json` + `<chapter>.breakpoints.json`.

### What changed

**Converter (`html_to_webflow.py`)**
- New `data-cf` support. `classes_for()` now checks the attribute first; matched
  Client-First classes are emitted with an **empty `styleLess`** so Webflow's
  merge-by-name leaves the site's definition — and its variable bindings — intact.
  An element with only `data-cf` emits no style of its own at all.
- `--page-prefix` exposed on the CLI. The plumbing already existed through
  `_setup`/`convert_sections`; `convert()` (the `--root` path) never accepted it,
  which is why single-section conversions shipped classes literally named `h2`/`p`/`img`.
- 22/22 existing tests still pass.

**Annotator (`annotate_cf.py`)** — 79 elements annotated across 9 chapters, plus two
authored class renames that collided with live tag-level styles
(`.label` → `.eyebrow`, `.section` → `.sec-pad`) and exact rewrites for the
single-letter `.tag.b` / `.tag.a` before/after labels.

**Validator (`webflow-clientfirst`)** — two semantics bugs found and fixed by running
it against real data:
1. It counted *intentional* reuse as a collision. A name match is only dangerous when
   the payload also declares properties; an empty definition is reuse. Now reported as
   `overwrites` (must be 0) versus `reused`.
2. `button` and `label` are both HTML tags and real Client-First classes, so legitimate
   reuse was flagged as a bare tag name. A known vocabulary name with an empty
   definition is no longer a violation.

**Fluid resolver** — two real gaps, previously mis-attributed to "needs container context":
1. Nested functions: `calc(clamp(1.25rem,4vw,4.5rem) + 0px)` (what a `--gutter + --rail`
   variable expands to) failed. Inner functions are now resolved before the arithmetic.
2. Multi-value shorthands: `padding-block: clamp(..) clamp(..)` failed whole. Each
   top-level part now resolves independently.

With both fixed, **every** fluid value resolves — 0 unresolved, down from 12.

### Verification

- Converter: 22/22 unit tests pass.
- Annotated design package: **61/61** interaction checks pass — the renames and
  `data-cf` attributes changed nothing behavioural.
- Payload gate: 9/9 chapters `pass: true`.

### Still to do before pasting

1. Spike **one** chapter into a duplicated page — do not paste into Home.
2. Diff the style guide before/after (`get_styles` on page `6a6b84cf7fe55ddeabc0b3c3`)
   to confirm the 73 reused classes were matched, not redefined.
3. Confirm the Designer style panel shows real numbers rather than 0.
4. Re-attach per-section `<style>`/`<script>` as custom-code embeds — the converter
   still drops them, and the GSAP chapters do not animate without them.

---

## Embed re-attachment — done 2026-07-30

The converter already had the mechanism: `<style data-embed>` / `<script data-embed>`
ride as in-place `HtmlEmbed` nodes (script embeds get `meta.script: true`), and marked
style text is excluded from the CSS cascade so it is not double-baked into classes.
Our design package simply never carried the attribute, so `SKIP_TAGS` dropped both.

`annotate_cf.py` now wires it, following the documented division of labour:

| Goes where | What |
| :--- | :--- |
| **Unmarked `<style>`** → native Webflow classes | All static class styling — stays Designer-editable |
| **`<style data-embed>`** → HtmlEmbed | Only what a class cannot express: `@keyframes`, `@media`, custom-property *declarations*, `::before` / `::after` |
| **`<script data-embed>`** → HtmlEmbed | The whole per-chapter GSAP block |

Custom-property declarations must ride the embed because `_clean_decls` strips `--*`
from class records — and `--pos` is what drives the pinned before/after wipe. Without
this the wipe silently does nothing after paste.

**Result: 22 HtmlEmbeds across 9 chapters** — one script embed per chapter plus 1–3 CSS
embeds. Largest is 2,551 chars, well inside Webflow's 10,000-char limit.

### Bug found and fixed while building it

The first cut sent any rule containing `--` to the embed, which caught `var(--warm)`
*references*, not just declarations. That pushed 11,284 chars of ordinary styling into
embeds and left `.ch-transformation` embed-only instead of a native class. Now only a
`--name:` declaration qualifies:

| | First cut | Fixed |
| :--- | ---: | ---: |
| Embed CSS | 11,284 chars | **2,972 chars** |
| `.ch-transformation` | embed-only | **native class** |

### Final state — all nine chapters

```
styles 292 | cssFunctions 0 | bareTagNames 0 | reused 73 | overwrites 0 | HtmlEmbeds 22
gate: 9/9 pass
```

Verified: converter 22/22 unit tests, annotated design package 61/61 interaction checks,
`--pos` and the per-chapter `WZ.add(...)` animation code both confirmed present in the
payloads.

Payloads ready at `.tmp/final/<chapter>.json` (+ `.breakpoints.json`).
Annotated source: `.tmp/annotated/index.html` (mirrored to
`04-design/.tmp/final-design-gsap/index-cf.html` for browser verification).

### Remaining before the spike

- GSAP itself must load site-wide: add the CDN tags in Webflow **Site** Settings → Custom
  Code → Footer (not Head — ScrollTrigger initialises against `document.body`).
- The shared `WZ` bootstrap is global, not per-section; it belongs in the same footer
  block, before the section embeds run.
- Per-breakpoint overrides in `<chapter>.breakpoints.json` are not applied by the paste —
  they need `data_style_tool.update_style` per breakpoint after pasting.
