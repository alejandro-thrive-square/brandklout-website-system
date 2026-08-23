# Kit Foundation V1 — Design-System Spec

Read-only audit of site `6a7a804cfed7e6e46272c6b0` ("Kit Foundation V1", Brandklout workspace) — a stock **Relume Style Guide v3.0** built on Finsweet **Client-First**. 668 styles (424 globals, 244 combos), 4 variable collections, 1 component. Pages: Home (`6a7a804efed7e6e46272c753`), Style Guide (`6a7a804efed7e6e46272c757`, draft), 404, 401.

Raw data: `raw/kit-styles.json` (full inventory + load-bearing properties), `raw/kit-variables.json`, `raw/kit-components.json`.

Breakpoint names as the API reports them: `base/main` = desktop, `medium` = ≤991px (tablet), `small` = ≤767px (mobile landscape), `tiny` = ≤479px (mobile portrait). No larger-than-desktop breakpoints are styled anywhere in the kit.

## 1. Class inventory by family (names verbatim)

**Page structure**: `page-wrapper` (empty), `main-wrapper` (empty; tag `main`), `padding-global` (padding-left/right **5%** — not rem), `padding-section-large|medium|small` (vertical rhythm), `container-large|medium|small` (width:100% + max-width + auto margins), `spacing-clean` (all margin/padding 0).

**Section markers**: `section_home_hero-header`, `section_home_feature`, `section_home_services`, … — pattern **`section_[page]_[section-name]`**. All are **empty classes** (checked all 11: `{}`) that exist purely for navigator/selector identity. Inner elements use **`[page]_[section]_[part]`**: `home_hero-header_component`, `home_services_grid-list`, `home_services_card-large`, `home_testimonial_card`, etc. Shared organisms use their Relume names: `navbar10_*`, `footer2_*`, `form_*`, `dropdown2_*`, `menu-icon1_*`/`menu-icon5`.

**Spacing utilities** — three-part system:
- Direction classes: `margin-top|bottom|left|right|horizontal|vertical` and `padding-…` (each zeroes the *other* sides; duplicated with `!important` in the Global Styles embed so they always win).
- Size classes: `margin-tiny|xxsmall|xsmall|small|medium|large|xlarge|xxlarge|huge|xhuge|xxhuge|0|custom1|custom2|custom3` and identical `padding-*` set — each sets **all four sides**.
- Usage is always the pair: `margin-bottom margin-small`. All 90 direction×size combos pre-exist as Webflow combo classes.
- `spacer-tiny…spacer-xxhuge`: empty divs with `width:100%` + `padding-top` at the same scale.

**Scale (rem, all-sides)**: tiny .25 | xxsmall .5 | xsmall 1 (→.75 @small) | small 1.5 (→1.25) | medium 2 (→1.5) | large 3 (→2.5 @medium, 2 @small) | xlarge 4 (→3.5, 2.5) | xxlarge 5 (→4.5, 3) | huge 6 (→5, 3.5) | xhuge 7 (→6, 4) | xxhuge 10 (→7.5, 5). `custom1-3` are empty slots.

**Section padding**: `padding-section-large` 7rem (→6 @medium, 4 @small); `-medium` 5rem (→4, 3); `-small` 3rem (→2 @small).

**Containers / max-width**: `container-large` 80rem, `container-medium` 64rem, `container-small` 48rem. `max-width-xxsmall` 20 / `xsmall` 25 / `small` 30 / `medium` 35 / `large` 48 / `xlarge` 64 / `xxlarge` 80rem / `full` none; `max-width-full-tablet|-mobile-landscape|-mobile-portrait` go full at that breakpoint only. `align-center` = auto side margins (pairs with max-width-*).

**Headings/text**: `heading-style-h1…h6`; `text-size-large|medium|regular|small|tiny`; `text-weight-light|normal|medium|semibold|bold|xbold` (300–800); `text-style-allcaps|italic|link|muted|nowrap|quote|strikethrough|2lines|3lines|tagline` (+`text-style-tagline-parent`); `text-color-white` (only color utility); `text-align-left|center|right`; `text-rich-text` (rich-text wrapper — descendant tag styles like `.text-rich-text h2 {margin: 1.5rem 0 1rem}` hang off it).

**Buttons**: `button`, `button-group`; modifiers `is-secondary`, `is-alternate`, `is-small`, `is-icon`, `is-link` (stack in that family), `button-group is-center|is-right`. `tag` + `is-alternate|is-text` for badges.

**Hide**: `hide` (always, `!important` via embed), `hide-tablet` (≤991), `hide-mobile-landscape` (≤767), `hide-mobile-portrait` (≤479).

**Layout/misc helpers**: `layer` (overlay), `overflow-auto|hidden|scroll|visible`, `pointer-events-auto|none` (+embed `-on/-off`), `z-index-1|2`, `display-inlineflex`, `aspect-ratio-square|portrait|landscape|widescreen`, `divider-horizontal`, `background-color-black`, `inherit-color`, `shadow-xxsmall…xxlarge`, `icon-1x1-*`, `icon-height-*`, `icon-embed-*` (xxsmall…xlarge+custom1; medium = 3rem), `color-scheme-1` (+ embed-driven `color-scheme-2…10`), `global-styles`, `style-overrides`, `color-schemes`, `rl-styleguide_*`/`stylesystem_*` (style-guide-page chrome only — never use on real pages).

## 2. Combo-class conventions

Modifiers are named **`is-*`** and are Webflow combo classes on a base. The base carries the full default; the combo overrides only deltas. Order in the family is canonical (e.g. `.button.is-secondary.is-small.is-icon.is-alternate`). Five concrete examples:

1. `.button.is-secondary` → `background-color: var(transparent)`, `color: var(neutral-darkest)` (border stays — outline button).
2. `.button.is-alternate` → border/background `var(white)`, `color: var(neutral-darkest)` (for dark sections).
3. `.button.is-small` → `padding: 0.5rem 1.25rem` (base is 0.75/1.5).
4. `.button.is-link` → padding `0.25rem 0`, `border-style:none`, transparent bg, text color, `line-height:1`.
5. `.button-group.is-center` → `justify-content:center; align-items:center` (base is flex/wrap/1rem gaps).

Also: `.form_input.is-text-area|is-select-input|is-alternate`, `.tag.is-text|is-alternate`, `.dropdown2_component.is-width-full-tablet`, slider `.slider-arrow.is-bottom-next|…`. Spacing combos (§1) are the other big combo family. Non-`is-` combo: `.max-width-large.align-center`, `.text-size-small.text-weight-semibold` (utility stacking, no own properties).

## 3. Variable system

Four collections, each with a single mode (`base`):

| Collection | Vars | Naming (Designer) | CSS name pattern |
|---|---|---|---|
| **Primitives** | 25 colors | `Colors/White`, `Colors/Neutral Lightest`…`Darkest`; `Opacity/White 5…60`, `Opacity/Neutral Darkest 5…60`, `Opacity/Transparent` | `--_primitives---colors--neutral-darkest` |
| **Color Schemes** | 5 | `Color Scheme 1/Text|Background|Foreground|Border|Accent` — each **aliases a Primitive** | `--color-scheme-1--text` |
| **Typography** | 2 FontFamily | `Font Styles/Heading`, `Font Styles/Body` (both `system-ui` in stock kit) | `--_typography---font-styles--heading` |
| **UI Styles** | 5 Size | `Radius/Small|Medium|Large` (0px), `Stroke/Border Width`, `Stroke/Divider Width` (1px) | `--_ui-styles---radius--medium` |

Variable ids are stable strings like `relume-variable--neutral-shade-7` — pass these as `variable_as_value` when creating styles. Sample bindings read from style properties:

| Class | Property | Variable |
|---|---|---|
| `body` (tag) | background-color / color / font-family | color-scheme-1-background / -text / font-style-body |
| `h1`–`h6` (tags) | font-family | font-style-heading |
| `button` | border-color, background-color / color | neutral-shade-7 / neutral-white |
| `button.is-secondary` | background-color / color | transparent / neutral-shade-7 |
| `text-color-white` | color | neutral-white |
| `divider-horizontal` | height / background-color | divider-width / color-scheme-1-border |
| `color-scheme-1` | background-color / color | color-scheme-1-background / -text |
| `tag` | border+background / color | neutral-shade-1 / neutral-shade-7 |
| `form_input` | border / background / color | neutral-shade-7 / neutral-white / neutral-shade-7 |
| `text-style-quote` | border-left-color | color-scheme-1-text |

**Theming rule**: component classes bind **Scheme or Primitive** variables, never hex. Re-theming a clone = repoint the 8 neutral primitives + the 5 Scheme-1 aliases + 2 fonts + 3 radii; every class follows. Extra schemes: wrap a section in `color-scheme-2`…`10` — the `color-schemes` embed remaps `--color-scheme-1--*` to `--color-scheme-N--*` inside it (you must define those N vars yourself; stock kit ships Scheme 1 only).

## 4. Structure conventions (canonical nesting)

Every page: `Body > .page-wrapper > [Global Styles instance] + navbar + .main-wrapper(main) > section stack + footer`. Every section:

```
Block(section|header) .section_home_feature          ← empty marker class, semantic tag
└─ Block .padding-global                              ← 5% side gutters
   └─ Block .container-large                          ← 80rem centered
      └─ Block .padding-section-large                 ← 7/6/4rem vertical rhythm
         └─ content…
```

Real excerpt (Home hero, annotated):

```
Block(header) .section_home_hero-header
└─ .home_hero-header_component                  ← section-scoped layout wrapper (optional layer)
   ├─ .padding-global
   │  └─ .container-large
   │     └─ .padding-section-large
   │        └─ .text-align-center
   │           └─ .max-width-large.align-center         ← copy width clamp
   │              ├─ .margin-bottom.margin-small        ← spacing DIV wraps the heading
   │              │  └─ H1 .heading-style-h1
   │              ├─ P .text-size-medium
   │              └─ .margin-top.margin-medium
   │                 └─ .button-group.is-center
   │                    ├─ Link .button
   │                    └─ Link .button.is-secondary
   └─ .home_hero-header_image-wrapper > Img .home_hero-header_image
```

Key habits: **spacing lives on wrapper divs** (`.margin-bottom.margin-small`), never on the text element; taglines are `div.text-style-tagline`; footer skips `padding-section-*` and uses `.padding-vertical.padding-xxlarge` directly; full-bleed sections (hero, CTA) put the image wrapper as a sibling of `.padding-global` inside a `_component` wrapper. Style Guide page follows the same shell (`page-wrapper > Global Styles + main-wrapper > padding-global …`) with `rl-styleguide_*` chrome inside.

## 5. Grid patterns

Multi-column layout = **Webflow Grid element** (node type `Grid`, renders `.w-layout-grid`) + a **section-scoped class** holding `grid-template-columns` and `grid-column-gap`/`grid-row-gap` (display:grid comes from `w-layout-grid` itself when not restated). There are **no shared generic grid utility classes** — each section names its own `…_grid-list` / `…_list` / `…_row`. Collapse at breakpoints by overriding `grid-template-columns`:

| Class | base | medium | small |
|---|---|---|---|
| `home_features-list_list` | `1fr 1fr 1fr`, gap 3/4rem | col-gap 2rem | `1fr`, row-gap 3rem |
| `home_testimonial_grid-list` | `1fr 1fr 1fr`, gap 2rem | `1fr 1fr` | `1fr` |
| `home_stats_list` | `1fr 1fr 1fr`, gap 2/3rem | `1fr`, gap 2rem | `1fr` |
| `home_locations_grid-list` | `1fr 1fr`, gap 4rem | col-gap 3rem | `1fr`, row-gap 3rem |
| `home_services_row` | `1fr 1fr 1fr 1fr`, gap 2rem | `1fr 1fr` | `1fr 1fr`, gap 1.5rem |

Flexbox is used for one-dimensional rows (`button-group`, navbar menus, card content columns via `flex-direction:column`). Common gaps: 2rem desktop / 1.5rem mobile for cards; 3–4rem for feature lists.

## 6. Typography scale (desktop / tablet≤991 / mobile≤767)

Bare tags `h1…h6` carry the same numbers as `heading-style-h1…h6` (+ margin 0 + heading font var), so headings render right unclassed; the `heading-style-*` classes exist to restyle any element to any level. Weight 700 all levels.

| Class | base | medium | small |
|---|---|---|---|
| h1 / heading-style-h1 | 3.5rem (56px) lh1.2 | 3.25rem | 2.5rem |
| h2 | 3rem (48px) lh1.2 | 2.75rem | 2.25rem |
| h3 | 2.5rem (40px) lh1.2 | 2.25rem | 2rem |
| h4 | 2rem (32px) lh1.3 | 1.75rem | 1.5rem lh1.4 |
| h5 | 1.5rem (24px) lh1.4 | — | 1.25rem |
| h6 | 1.25rem (20px) lh1.4 | — | 1.125rem |
| text-size-large | 1.25rem | — | 1.125rem |
| text-size-medium | 1.125rem | — | 1rem |
| text-size-regular | 1rem | — | — |
| text-size-small | 0.875rem | — | — |
| text-size-tiny | 0.75rem | — | — |
| body (tag) | 1rem lh1.5 | — | — |

## 7. Build gotchas for replicating on another site

- The **Global Styles component** (2 HtmlEmbeds: `style-overrides` = Client-First utility CSS with `!important` direction resets, `color-schemes` = scheme remaps + slider dots) must be recreated and dropped as first child of `page-wrapper` on every page — the direction-spacing system and `.hide` depend on it.
- `padding-global` is **5%**, not a rem value.
- Buttons have **no hover states** in the stock kit — add them per client brief.
- `container-*` centering is `!important`-guarded in the embed; `text-style-2lines/3lines` and `pointer-events-*` only work via the embed.
- Empty-by-design classes (don't "fix" them): `section_*`, `page-wrapper`, `main-wrapper`, `margin/padding-custom1-3`, `text-style-tagline-parent`, `rl-styleguide_max-width`.
- Duplicate style entries exist (two `container-small`, `h1`, `margin-bottom.margin-small` — one empty each): clone artifacts; the populated one wins by cascade. Match on the populated definition.

## Version Control

Audit artifact of the Brandklout kit site; regenerate by re-running the read-only audit (data_style_tool / data_variable_tool / data_element_tool) against site `6a7a804cfed7e6e46272c6b0`. Raw pulls live in `raw/`.
