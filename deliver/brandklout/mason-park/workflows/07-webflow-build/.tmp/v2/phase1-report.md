# Phase 1 Report — Kit Theming + Variable Layer (Mason Park, 2026-08-17)

Site 6a60bdc0340e5f1784b4d553. All work styles+variables only; no pages/elements touched; nothing published. Artifacts: `theme-extract.md` (live-theme analysis), `theme-rollback.json` (pre-change snapshot), `raw/mp-variables-created.json` (full name→id→value map).

## 1. What the live theme actually is (surprise)

The "serif display + sans body" expectation is FALSE on the live LPs. Everything renders **Montserrat** (body tag + inheritance); Fraunces + Inter are loaded via Google Fonts and `--display:"Fraunces"…` is declared in the parity head block, but **zero selectors consume them** (verified across invisalign, new-patient-special, new-patient-thank-you and the full shared stylesheet). The published Home ("moodboard") has an **empty body** — nothing to extract; the Home canvas has no elements either. Palette per the imp-* live CSS: accent/CTA **#00bde0**, ink **#2e3634**, muted text #4a5b66, off-white #f5f4f0, borders #d8e0e4, on-accent ink #12211f, gold #d3aa5a, hovers #376b7b/#071e2d. Full counts + mapping rationale in theme-extract.md.

## 2. Variables created (46 across 4 new collections)

- **Primitives** `collection-b6d0463a-b1e6-0f2a-692e-93ab748f8f16` — 30 vars: White #ffffff; neutral ramp Lightest #f5f4f0 / Lighter #d8e0e4 / Light #b6c8d3 / Neutral #8b958e / Dark #535e61 / Darker #4a5b66 / Darkest #2e3634; brand Accent #00bde0, Accent Deep #376b7b, Ink #12211f, Ink Navy #071e2d, Gold #d3aa5a; Opacity/Transparent + White 5–60 + Neutral Darkest 5–60 (rgba(16,24,32,x) — the #101820 base every live shadow uses).
- **Color Schemes** `collection-47c1d09c-07b3-34b7-28f6-86dd14189896` — 10 vars, all aliases (existing_variable_id): Scheme 1 (light) Text→Darkest, Background→White, Foreground→Lightest, Border→Lighter, Accent→Accent; Scheme 2 (dark) Text→White, Background→Darkest, Foreground→Dark, Border→Opacity/White 15, Accent→Accent.
- **Typography** `collection-ff614e7a-a918-8d18-8be1-6f44a4aaaaab` — Heading = Montserrat, Body = Montserrat (LP-CSS-wins decision; Fraunces disagreement documented).
- **UI Styles** `collection-0d6f7fe4-797b-8e48-c09a-91f395a241a6` — Radius Small 12px / Medium 16px / Large 999px (pill); Border Width 1px; Divider Width 1px.

All ids in `raw/mp-variables-created.json`. The pre-existing empty "Base collection" was left untouched (API cannot rename/delete collections).

## 3. Classes rebound/themed (15 styles written, all verified by read-back)

| Style | Change |
|---|---|
| `body` (tag) | font-family→Body var, color→S1 Text, background→S1 Background, **14px/20px → 1rem/1.5** |
| `h1` (tag) | font-family→Heading var, color→S1 Text, 3.5rem/1.2/700, margins 0 (was 38px/44px, margins 20/10) |
| `heading-style-h1,h3,h4,h5,h6` | font-family→Heading var (sizes kept stock Relume) |
| `heading-style-h2` | font var + **LP size 2.5rem/600** (was 3rem/700); medium 2.25, small 2rem |
| `button` | bg/border→Accent var, color→Ink var, radius×4→Radius Large var (pill), padding 1rem/1.75rem, 0.875rem/700/uppercase/ls .08em; **:hover** bg/border→Accent Deep, color→White |
| `button.is-secondary` | ghost per LP: bg→White, color→Darkest, border 2px→Neutral Dark; **:hover** bg/border→Gold |
| `button.is-alternate` | bg/border→White var, color→Darkest var |
| `button.is-small` / `is-icon` | untouched (padding/layout deltas only — nothing brandable) |
| `text-color-white` | color→White var |
| `background-color-black` (global) | bg→Darkest var |
| `color-scheme-1` | bg→S1 Background, color→S1 Text |
| `tag` | bg/border→Lightest var, color→Darkest var |
| `form_input` | border→S1 Border, bg→White, color→Darkest, radius×4→Radius Small |
| `text-style-quote` | border-left-color→S1 Text |

`divider-horizontal` does not exist in Mason Park's kit copy (not pasted) — nothing to bind.

## 4. Failures + workarounds

- **h2–h6 tag styles cannot be created headlessly.** They don't exist on this site (only body/h1 did); `update_style` → "Style not found", `create_style` with a tag name → internal error. Workaround: heading-style-h* classes carry the Heading font var, and bare tags inherit family/color from the themed body. **Phase 2 rule: every heading level 2+ must carry its `heading-style-h*` class** (h1 tag is fully themed, bare h1 is fine).
- **Duplicate style names shadow globals.** `update_style("background-color-black")` kept resolving to the empty styleguide combo `.rl-styleguide_form-wrapper.background-color-black` even with `parent_style_names: []`. Workaround that works: temporarily `rename_style` the combo, update the global by name, rename back, then strip the accidental property off the combo. Combo is back to `{}` (verified).

## 5. Legacy-page exposure (accepted risk, rollback ready)

`theme-rollback.json` holds pre-change values. What legacy pages will see: body color #333→#2e3634 (subtle; font stays Montserrat via var; the site-head `body{font-size:1.125rem;line-height:1.65}` custom code still wins over the tag font-size everywhere); bare-h1 margin-top 20px→0 (landing-hero-h1 sets its own margin-bottom; minor shift possible on LP heroes); `.button/.tag/.form_input/.color-scheme-1` etc. are kit-only classes used on the draft Style Guide page — zero legacy usage. **Post-publish screenshot diff of the 6 legacy pages remains a mandatory Phase 3 gate** (per PLAN).
