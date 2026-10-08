# Everything editable on Instatic: the Framework and the Styles panel

> [!IMPORTANT]
> **Every style on an Instatic site must be editable by hand in the editor**, and stay editable after
> every AI upload, whole site or per page. Since 2026-10-04:
> - **Design tokens** (colour palette, type sizes, spacing, radii from the Relume / Client-First style
>   guide) live in the **Framework panel** (`site.settings.framework`).
> - **Every other declaration** lives in the **style registry**, the Styles panel's class chips and
>   selectors (`site.styleRules`).
> - **No code-asset stylesheet carries rules.** The only thing left in one is `@font-face` (variable
>   fonts the font library cannot install), which the registry cannot hold.
>
> Gate: `node tools/instatic-api-sync/editability.mjs --site <client>[:staging] --published` must end
> `EDITABLE`, and `editor-canvas.mjs --site <client>:staging` must end `ok`: the editor has to SHOW the
> page. It renders with React and no site scripts, so an overlay closed only by the `hidden` attribute
> (React drops `hidden=""`) covers every page there while the live site is fine (IFA, 2026-10-07).
> Close overlays in CSS by default; open them with a runtime class or a `data-` attribute.

## Why

Code-asset stylesheets (`site.files`, type `style`) are served as `userStyles-*.css`, **last** in the
cascade (`reset → framework → style → userStyles`), and the Styles panel cannot see them. Anything in
one beats every panel and Framework edit at equal specificity. On earlier sites the push pipeline put
the tokens and every declaration Instatic's converter loses (custom properties, `clamp()`, layered
backgrounds, `!important`) in such a file (`tokens.css`), and older sites kept their whole design in
one (`site.css`). Hand edits looked saved and never showed.

The converter (happy-dom) is what drops those declarations, not the registry: the registry stores any
of them verbatim, `!important` and `@keyframes` included. So the tools below write them there
directly.

The Framework is a separate store from pages and registry. Both upload paths keep it
(`push-site.mjs` spreads the live `site.settings`; page writes never touch it), so it is the one place
a manual edit and an AI upload never collide, **provided nothing later in the cascade re-declares the
same variable at `:root`**.

## Who owns what

| What | Lives in | Edited in |
| --- | --- | --- |
| Colours, type sizes, spacing, radii | **Framework** → `framework.css` | Framework panel |
| Fonts | Font library (`install-fonts.mjs`) → `--font-<slug>` in `framework.css` | Fonts panel |
| Every rule: Client-First classes, components, `:root` formulas, `@media` overrides, `@keyframes` | Style registry → `style-*.css` | Styles panel |
| Variable-font `@font-face` only | `tokens.css` code asset | Code tab (developer) |

**Rule:** no `:root` / `html` rule in the registry or a code asset declares a variable the Framework
owns. It loads after `framework.css` and wins. Scoped redefinitions (`[data-theme="dark"] { --bg }`)
are fine: they are meant to override inside their section.

## The tools (`tools/instatic-api-sync/`)

All take `--site <client>[:staging|:production]` (credentials from the master env and `sites.json`
through `target.mjs`), are dry runs unless `--apply`, save a shell backup to `output/` first, and never
publish.

| Script | Does |
| --- | --- |
| `framework.mjs show` | What the Framework owns and emits |
| `framework.mjs extract <tokens.css>` | Drafts a spec from a stylesheet's `:root` (colours, aliases, fixed rem/px); lists what it left out |
| `framework.mjs apply <spec.json> --apply` | Upserts preferences, colours and fixed sizes, and rewrites registry `:root` declarations **in the same save**; refuses if anything at `:root` would still shadow the Framework |
| `framework.mjs pull --out <file>` | Writes the site-src mirror of the live Framework |
| `css-to-registry.mjs --files <asset,...> --apply` | Moves a code-asset stylesheet into the registry (bare `.class` rules into their class chip, the rest as selector rules, in source order) and switches the asset off. No container needed |
| `registry-repair.mjs` | Library used by `push-site.mjs`: puts every declaration the converter lost back into its own rule |
| `editability.mjs [--published]` | **The gate** |
| `editor-canvas.mjs` | The editor gate: opens /admin/site headlessly, fails on a closed overlay showing in any frame, screenshots it |
| `css-parity.mjs snapshot/diff --site … --all-pages` | Computed-style parity, every page, before vs after |

A spec (`framework-spec.json`, kept in the client's step `output/`):

```json
{
  "preferences": { "rootFontSize": 16, "isRem": true },
  "colors": [{ "slug": "accent", "value": "var(--gold-ink)" }],
  "typography": [{ "group": "Type sizes", "sizes": [{ "name": "size-body", "px": 15.68 }] }],
  "spacing": [{ "group": "Layout", "sizes": [{ "name": "gutter-min", "px": 20 }] }],
  "registry": [{ "selector": ":root", "remove": ["--accent"],
                 "set": { "--body": "calc(var(--size-body) * var(--t-text))" } }]
}
```

## Setting it up (Scenario 0 step 03, before the first push)

1. **Preferences:** root font size **16**, rem. The Framework defaults to 10 (Core Framework's 62.5%
   convention); left at 10, every rem it writes is 1.6× too small on our 16px fluid root.
2. **Colours:** one token per Relume primitive and colour-scheme role (`neutral-darkest` …, brand
   colours, `scheme-1-text`, `scheme-1-background` …). A role may be `var(--neutral-darkest)`, so
   changing a primitive moves every role using it. Utilities, shades and tints off unless used. Light
   themes only: dark mode off.
3. **Type sizes:** one Manual group, one size per Client-First type role (`heading-h1` … `text-tiny`),
   **min = max**: a fixed rem the house fluid root scales (`FLUID-ROOT.md`). Unequal min/max adds a
   `vw` slope on top of the fluid root and double-scales. No class generators: the role classes are
   registry classes reading `var(--heading-h2)`.
4. **Spacing:** one Manual group, min = max, Client-First names (`space-xxsmall` … `section-large`,
   `global`); a second group *UI* for radii and stroke widths. No class generators.
5. **Fluid values:** the Framework emits fixed sizes only. A fluid token keeps its formula in the
   registry `:root` and takes its ends from the Framework, so the ends stay editable:
   `--gutter: clamp(var(--gutter-min), 4vw, var(--gutter-max))`. Per-breakpoint multipliers work the
   same way: `--h2: calc(var(--size-heading-2) * var(--t-lg))`.
6. `node framework.mjs extract site-src/css/01-tokens.css > output/framework-spec.json`, review it,
   `apply` it on staging and production, then build site-src against those names.

### Naming and precision

- The Framework lower-cases a colour slug and collapses other characters to one `-`. Relume's own names
  (`--_primitives---colors--neutral-darkest`) **cannot be kept**: they publish renamed and every
  `var()` written against them misses. Name tokens Framework-safe from the first line of CSS.
- Sizes are written as **two-decimal rem** (`round(px / root, 2)`): `.975rem` becomes `.98rem`. Pick
  sizes that are whole at two decimals.
- A px layout limit (`--maxw: 1560px`) stays in the registry: the Framework would turn it into rem,
  which the fluid root scales above 1440.

## Keeping it editable on every upload

- **`push-site.mjs`** (whole site and `--update`): the converter's losses go back into the registry
  (`output/registry-repair.txt` lists them), Framework-owned tokens are skipped, and the `tokens.css`
  asset carries only `@font-face`. It refuses when site-src declares a custom property that ends up in
  neither the registry nor the Framework. `TOKEN_ASSET=legacy` restores the old asset for one run.
- **The Framework is the source of truth after launch.** A token change is made in the Framework (panel
  or `framework.mjs apply`), then mirrored into site-src (`framework.mjs pull`), never the other way.
- **A registry edit in the browser** is protected by `push-site.mjs --update` (it refuses when the live
  registry changed since the last push: pull the edit into site-src first).
- **After every publish:** `editability.mjs --site <client>:staging --published`.
- **Moving CSS between layers:** `css-parity.mjs snapshot before` → change → publish →
  `snapshot after` → `diff`, at 1440, 390 and 1920, `--all-pages`.
- **Manual-edit proof (once per site, on staging):** change a colour and a size in the Framework
  panel, publish, confirm the page moved; run an upload; confirm the edit survived; put it back.

### What the panel shows (tested 2026-10-04, Dr. Nahlah staging, Codex in Chrome)

- Type and spacing groups show each size in **px** (root 16), editable; an edit writes min and max.
- A colour token whose value is `var(--other)` shows as **`#000000`** in the picker. The value is
  intact (saving other tokens leaves it alone), but editing that token in the panel replaces the
  reference with a fixed colour. To repoint an alias, use `framework.mjs apply`.
- The root font size is not visible in the panel; `framework.mjs apply` sets it (`preferences`).
- Edits save to the draft ("Draft synced"); they go live with the next publish.

## Existing sites

Move a site the first time it comes in for work (Scenario 2):

1. `editability.mjs --site <client>:staging` names what is not editable.
2. Code-asset stylesheets: `css-parity.mjs snapshot before`, then `css-to-registry.mjs --files <path>`
   (dry run, review the selectors it lists, then `--apply`).
3. Tokens: write the spec (`extract` on the site's tokens, or by hand), `framework.mjs apply`.
4. Publish staging, `css-parity diff`, `editability.mjs --published`, the manual-edit proof. Then the
   same on production.

**Dr. Nahlah, 2026-10-04 (staging):** the main stylesheets were already in the registry; the
Framework got the 4 colour aliases, 7 type sizes and the gutter/section ends (40 variables), and
`landing.css` (175 rules, 19 ads pages) moved into the registry. Spec:
`bk-dr-nahlah` `workflows/22-instatic-api-sync/framework/framework-spec.json`.
Proof: computed-style parity on all 59 pages was exact at 1440 and 390 and within capture noise at
1920 (two snapshots of an unchanged site differ by ~50 auto-margin and late-font values there) with
the three rounded sizes held at their old values; the only real change is that rounding (body text
15.6 → 15.68px, labels 11.23 → 11.2px, large body 18 → 18.08px). A colour and a type size changed in
the Framework panel went live and survived a per-page write and a whole-shell save, then were put back.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
