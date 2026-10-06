# Class standard: Client-First + Relume on Instatic

> [!IMPORTANT]
> **Every class on every Brandklout Instatic site follows this standard from the first line of CSS.**
> It is what lets a client, a marketer or the next developer edit the site in the Styles panel, and it
> is what lets AI uploads and hand edits share one class system. Fixing it after launch costs a
> fleet-wide migration (2026-10-05); building it right costs nothing.
>
> **Gates, both must pass before the first push and after every publish:**
> - `node tools/instatic-api-sync/class-audit.mjs --local <site-src>` (the build) and
>   `--site <client>:staging` (the published site): **0 out of bounds**.
> - `node tools/instatic-api-sync/editability.mjs --site <client>:staging --published`: **EDITABLE**
>   ([INSTATIC-FRAMEWORK.md](./INSTATIC-FRAMEWORK.md)).

Sources: Finsweet Client-First v2 ([`deliver/docs/CLIENT-FIRST.md`](../../../docs/CLIENT-FIRST.md):
*Classes strategy 1 and 2*, *Core Structure*, *Typography*, *Utility class systems*) and the Relume
style guide we build from ([`README.md`](./README.md), `assets/*.css`, 248 classes).

## 0. Start every build from the starter

- [`client-first-starter.css`](./client-first-starter.css) → `site-src/css/10-client-first.css`: the
  complete utility vocabulary (structure, spacing, type roles, text styles, widths, layering,
  visibility incl. `hide-visually`, backgrounds, icons, buttons + combos), every class in bounds,
  reading the token names below. Change values, never names.
- [`framework-spec.template.json`](./framework-spec.template.json): those tokens for the Framework
  (`framework.mjs apply` after the first push; the `:root` part needs the registry `:root` the push
  creates). Colours as roles over primitives; sizes whole at two rem decimals.
- Custom classes start in `20-*.css` as `folder_element`; chapters are `section_<beat>`.

## 1. The three kinds of class, and how to tell them apart by name

| Kind | Name shape | Example | Where its values live |
| --- | --- | --- | --- |
| **Utility** | dashes only, **no underscore**, general → specific: `<property-family>-<value>` | `text-size-medium`, `max-width-large`, `pointer-events-none`, `text-color-accent` | Styles panel class; values read Framework tokens |
| **Custom** | `folder_element`, **exactly one underscore**, dashes inside each half | `review_card`, `review_card-image`, `section_reviews`, `footer_link` | Styles panel class |
| **Combo** | `is-<variant>`, only ever stacked on a base class | `button is-secondary`, `section_hero is-home`, `nav_menu is-open` | Styles panel combo |

Anything else is **out of bounds**: an abbreviation (`btn`, `rv-card`, `ch`, `pk`, `pa-no`), a
dash-only custom name (`eyebrow`, `wrap`, `skip-link`, `doctor-card`), BEM (`hero__title`,
`card--wide`), camelCase, two underscores (`a_b_c`), a builder's leftovers (`brxe-block`, `w-full`,
`flex`), or a name that says nothing (`u-fill`, `block`, `height`, `no-user-select`).

### Naming rules (Client-First, *Naming convention*)

- **No abbreviations, no shorthand.** `button` not `btn`, `review` not `rv`, `chapter` not `ch`.
  A client must understand the class from its name alone.
- **General to specific.** `text-size-large`, not `large-text`; `team-list_headshot-wrapper`, not
  `headshot-wrapper-team`.
- **The folder is the component, in words.** Everything inside the reviews component starts
  `review_` (or `reviews_`; pick one per site and keep it). The section around it is
  `section_reviews`.
- **One underscore.** `doctor-card_image`, never `doctor_card_image`.
- Lower case, `a-z0-9` and `-` only.

## 2. The vocabulary: use the library before inventing anything

The library is the Relume style guide. Before creating a class, search it (this list is the whole
utility set; values are set per site, the names are fixed):

| Family | Classes |
| --- | --- |
| Core structure | `page-wrapper`, `main-wrapper`, `section_[name]`, `padding-global`, `container-small/medium/large`, `padding-section-small/medium/large` |
| Headings | `heading-style-h1` … `heading-style-h6` (plain `h1`–`h6` tags first; the class only when the look differs from the tag) |
| Text | `text-size-tiny/small/regular/medium/large`, `text-weight-light/normal/medium/semibold/bold/xbold`, `text-style-allcaps/italic/link/muted/nowrap/quote/strikethrough/tagline`, `text-align-left/center/right`, `text-color-*`, `text-rich-text` |
| Spacing | `margin-0`, `padding-0`, `margin-{top,bottom,left,right,horizontal,vertical}` + `margin-{tiny…xxhuge}`, same for `padding-`, `spacer-{tiny…xxhuge}` |
| Layout | `max-width-{xxsmall…xxlarge,full}`, `max-width-full-{tablet,mobile-landscape,mobile-portrait}`, `align-center`, `overflow-{hidden,auto,scroll}`, `layer`, `z-index-1/2`, `aspect-ratio-{square,portrait,landscape,widescreen}` |
| Visibility | `hide`, `hide-tablet`, `hide-mobile-landscape`, `hide-mobile-portrait`, `pointer-events-none/auto` |
| Media | `icon-1x1-{xxsmall…xlarge}`, `icon-height-*`, `icon-embed-*` |
| Colour | `background-color-*`, `text-color-*` (one per Framework colour role) |
| Components | `button` (+ `is-secondary`, `is-alternate`, `is-small`, `is-link`, `is-icon`), `button-group`, `tag`, `form_*` |
| Effects | `shadow-{xxsmall…xxlarge}` |

**New utility systems are allowed** (Client-First, *Typography strategy*) when a property recurs
site-wide and has no library class: name it as a family, general → specific, and keep the family
complete: `text-color-accent`, `text-style-display-accent`, `text-opacity-low`. A one-off is a
custom class instead, never a utility.

Common cases and the right answer:

| Need | Not this | This |
| --- | --- | --- |
| Visually hidden text for screen readers | `u-sr-only`, `sr-only` | `hide-visually` utility (one per site, the standard sr-only declarations) |
| Skip link | `skip-link` | `skip-link_component` custom (or `nav_skip-link`) |
| `height: 100%` on a media wrapper | `u-fill`, `height`, `h-full` | the component's custom class (`gallery_image-wrapper`) |
| `display: block` | `block`, `d-block` | the custom class of that element |
| `user-select: none` | `no-user-select` | the component's custom class |
| `display: none` | `hidden`, `d-none` | `hide` |
| Small caps label above a heading | `eyebrow`, `label`, `kicker` | `text-style-tagline` |
| Content width wrapper | `wrap`, `inner` | `container-large` (site value) or `padding-global` + `container-*` |
| Section vertical padding | `section`, `pad` | `padding-section-large` (site value) |
| Button | `btn`, `cta`, `btn-ghost` | `button`, `button is-secondary` |

## 3. Typography

- Plain tags first: `h1`–`h6`, `p` carry the default type, set on the tag selectors.
- `heading-style-h#` when a heading must look like another level (SEO tag ≠ design level).
- `text-size-*` for body sizes. Font sizes read Framework tokens.
- A custom class may set its own `font-size` only for **unique text** (`footer_copyright-text`),
  a **managed group** (`footer_link`), or a **responsive exception**, as Client-First allows. Keep
  these rare; the audit counts them (`font-size outside a role`), a rising count is a smell.

## 4. Spacing, colour, tokens

All values come from the Framework ([INSTATIC-FRAMEWORK.md](./INSTATIC-FRAMEWORK.md)): colours,
type sizes, spacing, radii. A class never carries a raw hex or a magic px value that a token covers.

## 5. Reuse, and what not to do

- **One look, one class.** Two custom classes with identical declarations in the SAME component are
  one class: keep the better-named one. Identical classes in different components may stay (each
  component owns its classes and may diverge); the audit lists *identical custom classes* as advice.
- **Don't invent a utility the library has.** A utility-shaped name whose declarations equal a
  library utility fails the audit (*reimplements a library utility*): use the library class. A custom
  `folder_element` class that happens to hold one utility's declarations (`invitation_image
  { margin: 0 }`) is fine: Client-First gives every element its own class. The audit lists those as
  *reuse hints*, for new builds to prefer the utility.
- **Don't deep stack.** More than 3 classes on one element means a custom class is missing.
- **Don't style by context.** `.section_reviews p { … }` beats every edit made on the `p`'s own class
  in the Styles panel. Give the element a class. Allowed contexts: `text-rich-text` children (CMS
  bodies) and `:hover`/`:focus` states.

## 6. Scripts never select by styling classes

Scripts (GSAP, menus, sliders, forms) find elements by **`data-` attributes**
(`data-reveal`, `data-slider="reviews"`, `data-menu-toggle`), never by a styling class. State goes
on as a combo class (`is-open`, `is-active`, `is-scrolled`) or an attribute. Then a class can be
renamed or restyled in the panel without breaking behaviour. The local audit lists every
`querySelector`/`closest`/`classList` that names a styling class.

## 7. Where this is checked

| When | What | Tool |
| --- | --- | --- |
| Scenario 0 step 03, before the first push | the local build | `class-audit.mjs --local <site-src>` |
| After every publish (S0 03, S2 03, S3 03) | the published registry | `class-audit.mjs --site <client>:staging` |
| Migrating an existing site | rename map, scripts, page trees, embeds | `class-rename.mjs` (§8) |

`class-audit.mjs` exit codes: `--strict` exits 1 on any out-of-bounds class or reimplemented utility.

## 8. Migrating an existing site (the 2026-10-05 fleet migration)

Per site, on **staging**, in this order, from `tools/instatic-api-sync/` (`$S` = `<client>:staging`).
Instatic is the source of truth for a launched site; the same map is applied to its local source
where one is still maintained. Two steps, each proven on its own, so a difference always has one
cause.

0. `node output/status.mjs --site $S` style check: `draftMatchesPublished` must be true (a publish
   ships the whole draft; never ship someone's unpublished work). Then **back up**:
   `node with-site.mjs $S -- node ../instatic-site/ops/backup-site.mjs --out output/fleet/<c>/backup-pre-migration`.
1. **Baseline**: `node migration-gates.mjs snapshot before --site $S` (css-parity at 1440/390/1920,
   runtime-parity at 1440/390, every page; needs `PUPPETEER_DIR`). "Every page" is
   `insta-api.mjs pageSlugs()`: the page rows minus templates, plus every published collection entry
   (`<routeBase>/<slug>`). Before 2026-10-06 the gates read only the page rows, so a collection's
   entries (blog articles, legal pages) were never captured: a `before` taken then must be re-taken.
   `css-parity --all-pages --prefix blog/` captures one collection on its own.
2. **Editability** ([INSTATIC-FRAMEWORK.md](./INSTATIC-FRAMEWORK.md)):
   - a code asset holding declarations the converter lost (`tokens.css`):
     `css-to-registry.mjs --site $S --files <path> --in-place` (into the rule they came from);
     a design-system asset (`site.css`, `mason-park.css`): without `--in-place` (appended in order);
   - tokens: `framework.mjs extract <tokens css> > framework-spec.json`, review, `framework.mjs apply`.
     Sizes the Framework cannot write exactly (more than 2 rem decimals) stay in the registry `:root`:
     no visual change. Moving them is a separate, listed sub-pixel decision.
   - publish staging, `migration-gates.mjs snapshot mid`, `migration-gates.mjs diff before mid`.
3. **Classes**: `class-audit.mjs --site $S --json …`, write `class-map.json` (§9) in the client's
   step folder, `class-rename.mjs --site $S --map …` (dry run: read the REVIEW lines), `--apply`,
   publish, `migration-gates.mjs snapshot after`, `diff mid after`.
   **SEO cells:** a site-document page write keeps only title/slug/body/template, so `--apply` used
   to blank every rewritten page's `seoTitle`/`seoDescription` (the publish then served the home
   description; no style or behaviour gate sees it). Since 2026-10-06 `insta-api.mjs` puts those cells
   back after every page save, and refuses a save that would drop them on a nested slug (`a/b`: a
   PATCH flattens its URL). Still compare the published head (title, meta description, og:*,
   canonical, JSON-LD) on every page before vs after: `ops/restore-page-seo-cells.mjs` repairs from
   the step-0 backup.
4. **Prove**: `migration-gates.mjs final --site $S --map class-map.json`: editability EDITABLE,
   class-audit `--strict` IN BOUNDS, `class-rename --verify` CLEAN (no old name published anywhere).
   Diffs: css 0 at 1440/390 (1920 within its own noise: two snapshots of an unchanged site), runtime
   parity OK.
5. **Local source**, where one is maintained: back it up first (`tar --force-local -czf …`: Git
   Bash's tar reads `C:` as a remote host without it), `class-rename.mjs --files <site-src> --map
   <class-map.json>` (uses `class-map.expanded.json`), rebuild, then
   `class-sync-check.mjs --site $S --build <built html dir>`: the build and the site must list the
   same classes. What it finds is a class name the build **computes** (`is-m${month}`), which no
   static rename can see: fix those lines by hand and rebuild. Regex literals in build scripts
   (`/class="legal_num"/`) are rewritten by the engine since 2026-10-05.
6. Runbook (client + system). **Production only after review**, the same steps.

Rollback: `rollback-registry.mjs output/fleet/<c>/backup-pre-migration/site.json --apply` restores
the registry; the code assets come back by re-enabling them (`runtime.styles[id].enabled`); page
trees from `pages.json` (`restore-pages.mjs`, Dr. Nahlah worktree).

## 9. The rename map

```json
{
  "site": "stone-med-spa",
  "rename": {
    "eyebrow": "text-style-tagline",
    "u-sr-only": "hide-visually",
    "skip-link": "skip-link_component"
  },
  "merge": {
    "doors_lede": "lead_text"
  },
  "notes": { "eyebrow": "is the tagline role: small caps label above headings" }
}
```

- `rename`: the class keeps its rule, id and every element it is on; its name and every selector
  that mentions it change. The new name must not already exist.
- `merge`: the old class's elements take the existing class instead and the old rule is deleted.
  Refused unless both have the same declarations (base and every breakpoint), so a merge can never
  change how the page looks. The target may be a class the same map renames.
- `folders`: `{"tl": "timeline"}` renames every `tl_*` class to `timeline_*`.
- `prefixes`: `{"rv-": "review_"}` renames every class starting `rv-` (`rv-card-head` →
  `review_card-head`): the shape most pre-standard sites used. Longest prefix wins.
- `scriptClassCalls`: `["Kit.mount"]` — functions whose first string argument is a class name
  (`WZ.section` and `WZ.dom` are built in).
- Explicit `rename`/`merge` entries win over `folders` and `prefixes`. The site-mode dry run writes
  `<map>.expanded.json` (every resulting rename); `--verify` and `--files` use it.

What the engine rewrites in scripts: selectors in strings (chains and `tag.class` included), class
attributes in HTML strings, `classList`/`className`/`getElementsByClassName`/`setAttribute('class')`
arguments, `*Class:` option keys (SplitText `linesClass`), the calls above, and regex literals
(`/class="x"/`, `\.x`). It cannot see a class name a script **computes** (`'is-m' + n`, `` `x-${i}` ``):
`class-sync-check.mjs` and the runtime gate find those.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
