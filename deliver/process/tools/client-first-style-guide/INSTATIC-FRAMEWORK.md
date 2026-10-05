# Client-First on the Instatic Framework

> [!IMPORTANT]
> **Every Instatic site keeps its design tokens in the Instatic Framework** (left rail → *Framework*,
> stored at `site.settings.framework`): the colour palette, the type scale, the spacing scale and the
> radii. Anyone can then change a brand colour, a heading size or the section padding by hand in the
> editor, and AI can still push pages and updates on top, by either upload path, without undoing that
> edit. Standard since 2026-10-04.

## Why

On earlier sites the tokens went up inside the `src/styles/tokens.css` code asset
(`push/push-site.mjs`). That asset loads **last** (`reset → framework → style → userStyles`), so it
beats anything set in the Framework or the Styles panel. A token changed by hand was silently
overridden, and the only way to change a colour was a developer and a re-push.

The Framework is a separate store from the pages and the style registry. Pushes keep it
(`push-site.mjs` spreads the live `site.settings`), so it is the one place where a manual edit and an
AI upload never conflict, **provided nothing else re-declares the same variables.**

## The four layers, and who owns what

| What | Lives in | Edited in |
| --- | --- | --- |
| Colours, type sizes, spacing, radii (the Relume/Client-First tokens) | **Framework** (`settings.framework`) → `framework.css` | Framework panel |
| Fonts | Font library (`install-fonts.mjs`) → `--font-<slug>` in `framework.css` | Fonts panel |
| Client-First classes (`heading-style-h2`, `padding-section-large`, `button`, components) | Style registry (`site.styleRules`), values are `var(--token)` | Styles panel |
| Fluid root, `@font-face` fallbacks, math the converter cannot hold | `tokens.css` code asset | Code tab (developer only) |

**Rule: the `tokens.css` asset declares no variable the Framework owns.** It loads last, so one
duplicate is enough to freeze that token.

## Setting it up (Scenario 0 step 03, first push)

1. **Preferences** (Framework → settings): root font size **16**, unit **rem**, tree-shake generated
   utilities **on**. The default root is 10 (Core Framework's 62.5% convention); left at 10, every rem
   the Framework writes is 1.6× too small on our 16px fluid root.
2. **Colours.** One colour token per Relume primitive and per colour-scheme role, from the style
   pick: `neutral-darkest` … `neutral-lightest`, `white`, the brand colours, then `scheme-1-text`,
   `scheme-1-background`, `scheme-1-accent`, `scheme-1-border` (and scheme 2, 3 as the design uses
   them). A role's value may be `var(--neutral-darkest)`, so changing a primitive moves every role
   that uses it. Utilities, shades and tints off unless the build uses them. Light themes only
   (Brandklout rule): dark mode off.
3. **Typography.** One group, mode **Manual**, one size per Client-First type role: `heading-h1` …
   `heading-h6`, `text-large`, `text-medium`, `text-regular`, `text-small`, `text-tiny`. **Min = max**
   on every size: the step is then a fixed rem, and the house fluid root does the scaling
   (`FLUID-ROOT.md`). Unequal min/max puts a `vw` slope on top of the fluid root and double-scales.
   No class generators: the role classes already exist in the registry and set
   `font-size: var(--heading-h2)`; a breakpoint override on a role class points at another variable.
4. **Spacing.** One group, mode **Manual**, min = max, Client-First names: `space-tiny`, `space-xxsmall`
   … `space-xxhuge`, `section-small`, `section-medium`, `section-large`, `global`. No class generators:
   `padding-section-*`, `padding-global` and the `margin-*` / `spacer-*` utilities stay registry classes
   that read these variables.
5. **Radii and strokes.** A second spacing group named *UI*, Manual, min = max: `radius-small`,
   `radius-medium`, `radius-large`, `border-width`, `divider-width`. No class generators.
6. **site-src mirrors it.** `css/01-tokens.css` declares exactly the same names and values, so the VPS
   build, the local gates and `visual-diff` see what Instatic serves. Every stylesheet in site-src
   reads tokens through `var()`, never a raw hex or px value for something a token covers.

### Naming

The Framework lower-cases a colour slug and collapses every run of other characters to one `-`.
Relume's own names (`--_primitives---colors--neutral-darkest`, `--color-scheme-1--text`) therefore
**cannot be kept**: they publish as `--primitives-colors-neutral-darkest` and every `var()` written
against the original misses. Name tokens in the Framework form from the first line of CSS: lower
case, single dashes, no leading underscore. Two slugs that normalise to the same name get `-2`.

## Keeping it editable on every upload

- **Whole site** (`push-site.mjs --apply --force`) and **per page / update** (`push-site.mjs --update`)
  both keep `settings.framework`. Neither may carry a Framework-owned variable in the `tokens.css`
  asset: before the push, strip those declarations from what `TOKEN_FILES` sends
  (`TOKEN_FILES=00-fluid-root.css` once the tokens are in the Framework).
- **The Framework is the source of truth after launch.** Before any build or push, read the live
  `settings.framework` and bring `01-tokens.css` into line with it, so site-src never re-asserts an old
  value through a hard-coded fallback. A token change the client asks for is made in the Framework
  (by hand or by API), then mirrored into `01-tokens.css`, never the other way round.
- **After every push**, check the published CSS: every Framework token appears in `framework.css`, and
  none appears in `userStyles-*.css`. A token in both = the Framework edit is dead.

```bash
# names declared by each published stylesheet (link hrefs from the home page)
curl -s https://<host>/ | grep -o 'href="[^"]*\(framework\|userStyles\)[^"]*\.css"'
curl -s https://<host>/<framework.css> | grep -o -- '--[a-z0-9-]*:' | sort -u > fw.txt
curl -s https://<host>/<userStyles.css> | grep -o -- '--[a-z0-9-]*:' | sort -u > us.txt
comm -12 fw.txt us.txt     # must print nothing
```

- **Manual-edit proof (once per site, on staging):** change one colour and one spacing step in the
  Framework panel, publish, confirm the live page moved, run an `--update` push of one page, publish,
  confirm the edit is still there. Then put the values back.

## Existing sites

Sites pushed before 2026-10-04 carry their tokens in the code asset. Move them when the site next
comes in for work (Scenario 2): seed the Framework from `01-tokens.css`, rename Relume-style
variables to Framework names across site-src, drop the moved tokens from `TOKEN_FILES`, push the
shell (`--update --shell-only --apply`), then the check above. Dr. Nahlah already has 25 colour tokens
in the Framework; confirm the code asset no longer re-declares them.

## Not automated yet

There is no script yet that writes `settings.framework` from `01-tokens.css`, pulls it back, or strips
Framework-owned names from the token asset inside `push-site.mjs`; set the Framework in the panel (or
through `PUT /site-document`, read-merge-write) and run the check above by hand. Instatic's model for
it is in the source: `src/core/framework/` and `src/core/publisher/frameworkCss.ts`.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
