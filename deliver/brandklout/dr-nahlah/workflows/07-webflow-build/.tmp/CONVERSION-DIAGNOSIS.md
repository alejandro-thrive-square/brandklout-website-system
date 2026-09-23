# Webflow Conversion — Diagnosis (2026-07-30)

Measured against the v2 GSAP journey page (9 chapters), converted per-section with
the existing `html_to_webflow.py`. **258 styles across 9 sections.**

Reproduce:
```bash
for id in arrival reality difference specialist transformation path standard proof invitation; do
  python html_to_webflow.py --html "../04-design/.tmp/final-design-gsap/index.html" \
    --root "#$id" --out ".tmp/probe/$id.json"
done
```

## Root cause 1 — the "font-size 0px" bug is `clamp()`

**Confirmed.** Nothing in the payload is zero. What is actually emitted:

```
font-size: clamp(1.9rem,3.6vw,3.75rem)     -> class "h2"
font-size: clamp(1.15rem,1.9vw,1.6rem)     -> class "b"
```

Webflow stores the raw string in `styleLess`, and the **browser** parses it — which is
why the Designer *canvas* renders at the correct size. But the Designer's **style panel**
input cannot parse a CSS function into a number+unit, so it displays **0**. Canvas right,
panel wrong, value uneditable.

**Blast radius across the 9 chapters:**

| CSS function | Instances |
| :--- | ---: |
| `clamp()` | 182 |
| `calc()` | 11 |
| `min()` | 4 |
| **Total** | **197** |

| Property affected | Instances |
| :--- | ---: |
| `font-size` | **47** |
| `padding-left` / `-right` / `-top` / `-bottom` / `-block` | 91 |
| `width` | 16 |
| `grid-row-gap` / `grid-column-gap` | 14 |
| `margin-top` | 7 |

This is not an edge case — the entire design system is `clamp()`-based fluid type and
spacing, so it hits nearly every text and layout style.

**Fix**: resolve fluid values to **concrete per-breakpoint values** at conversion time.
Webflow has no native fluid-type support; Client-First handles this with per-breakpoint
overrides. Evaluate each `clamp(min, pref, max)` at Webflow's four breakpoint widths and
emit four concrete values:

| Webflow breakpoint | Eval width |
| :--- | ---: |
| Desktop (base) | 1440px |
| Tablet (≤991) | 991px |
| Mobile landscape (≤767) | 767px |
| Mobile portrait (≤478) | 478px |

`calc()` and `min()`/`max()` resolve the same way. Result: editable numbers in the panel,
visually near-identical, and it survives hand-editing by the client.

## Root cause 2 — 44% of classes are bare tag names

**114 of 258** emitted class names are raw tags:

```
div(9)  i(9)  span(8)  img(7)  section(7)  h2(7)  p(7)  b(6)
i-2(6)  div-2(5)  div-3(4)  span-2(4)  a(3)  h3(3)  ...
```

`page_prefix` **exists in the code** (`html_to_webflow.py:692`, applied at :807) but is
**not exposed as a CLI flag** — `--help` lists no `--page-prefix`. A previous note claimed
this was wired up on 2026-07-28; the CLI output disproves it.

Why this is severe: **Webflow merges pasted classes by NAME site-wide.** A class called
`div` or `h2` will collide with every other page and with the style guide, and the
existing definition wins. This alone can corrupt a site.

**Fix**: expose `--page-prefix`, and more importantly stop auto-naming at all for
elements that should map to existing style-guide classes (see Root cause 4).

## Root cause 3 — whole-page conversion of v2 falls back to an embed

```
python html_to_webflow.py --root "body" ...
[html_to_webflow] embedded unsupported tags as HtmlEmbed: bodyx1
wrote full.json  (1 nodes, 1 styles)
```

The v2 architecture puts a `<style>` **and** `<script>` inside every section. The
converter treats those as unsupported and embeds the entire body as one HtmlEmbed —
silently producing a 1-node payload instead of failing loudly.

**Fix**: strip and re-attach section `<style>`/`<script>` as Webflow custom-code embeds
during conversion, and make the converter **error** rather than degrade to a
whole-body embed. Per-section conversion (the unit we actually want) works fine.

## Root cause 4 — variable bindings cannot travel in the clipboard

Already documented in `html-to-webflow-clipboard.md`: Webflow's clipboard format has no
field representing a variable binding, so bindings are stripped on copy. Two viable
paths, both established:

1. **Clone a pre-bound style guide** — bind classes to variables once per design system,
   reuse by cloning. This is how Relume actually works, and it is the scalable answer.
2. Bind post-paste via MCP `style_tool.update_style` with `variable_as_value`.

## The real fix: reuse, don't emit

The current converter emits a style for **every** element. For a Client-First site that is
backwards. The correct order is:

1. **Harvest** the target site's style guide into a local vocabulary file — classes,
   variables, and their definitions.
2. **Match** each element against it. If a base component matches (heading, button,
   text-size, padding/spacing utility), **reuse the class and emit no style at all**.
3. **Emit** a namespaced custom class only for what genuinely has no equivalent —
   layout wrappers and the bespoke chapter visuals.
4. **Resolve** any remaining fluid values to per-breakpoint concrete values.

Expected effect: the 258 emitted styles should drop substantially, most text and spacing
becoming reused style-guide classes rather than 114 bare-named forks.

## Scalability notes (the stated bottleneck)

- Keep the site vocabulary **on disk**, never in context. Query it with scripts that
  return counts and diffs, not dumps.
- Convert and verify **per section** — it is already the design unit, it bounds blast
  radius, and it keeps every artifact small.
- Large MCP responses (the Webflow guide is 60KB) persist to disk automatically; read
  only what is needed.
- The conversion contract should be a **test**, not a narrative: a script that asserts
  "0 CSS functions in styleLess, 0 bare-tag class names, N% class reuse" and fails loudly.

## Open — blocked on the client

Target Webflow site is unknown. No Dr. Nahlah site exists, the default `webflow` MCP
returns 401, and the named servers are OAuth-scoped to other clients. Needed before any
paste: which site to build into, and which site carries the Relume/Client-First style
guide to harvest.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).

---

## Built 2026-07-30: `webflow-clientfirst` MCP

Local, dependency-free MCP server at `mcp-servers/webflow-clientfirst/`. Six tools;
every one also runs from the CLI so it is testable without an MCP client. Full docs:
[setup.md](../../../../../mcp-servers/webflow-clientfirst/setup.md).

**Verified against the real style guide and the real payloads:**

| Check | Result |
| :--- | :--- |
| Harvest Webzite Relume style guide | **217 classes, 43 variables** across CF families |
| `clamp(1.9rem,3.6vw,3.75rem)` resolution | desktop 51.84px · tablet 35.68px · mobile 30.4px |
| Fluid values resolved across 9 chapters | **174 of 186**; the 12 failures are `calc(100% - …)`, correctly reported not guessed |
| Payload validation | 186 CSS functions + 126 bare tag names detected, `pass: false` |

## The finding that changes the approach

`suggest_reuse` matches by CSS-declaration overlap. With a naive scorer it produced
22% "coverage" that was mostly false positives (`i-2` → `global-styles` scored 1.0
because both had one trivial declaration in common). Adding a floor of two shared
declarations dropped it to **4% — one honest match**.

**That is the real answer, not a bug to tune away: you cannot infer Client-First class
reuse from CSS similarity.** `heading-style-h2` and a bespoke `.ch-specialist h2` may
share no literal declarations while being semantically the same component; two unrelated
classes may share `display:block` and score highly.

**Reuse has to be authored at design time, not inferred at conversion time.**

### Consequence for the build

The coded design package should carry Client-First intent in the markup, e.g.

```html
<h2 data-cf="heading-style-h2">…</h2>
<p  data-cf="text-size-regular text-weight-light">…</p>
<div data-cf="padding-section-large padding-global">…</div>
```

The converter then emits **no style at all** for annotated elements — it just applies the
existing class — and emits a namespaced custom class only for genuinely bespoke visuals
(the pinned wipe, the horizontal track, the chapter plates).

This flips the default from "emit everything, try to dedupe later" to "reuse by default,
emit only the exceptional". It also makes the variable-binding problem disappear for
annotated elements, because they inherit the style guide's already-bound classes.

### Recommended order for the next run

1. Annotate the v2 design package with `data-cf` on base components (headings, body text,
   spacing, buttons, containers).
2. Teach `html_to_webflow.py` to honour `data-cf`: apply the class, skip style emission.
3. Wire `--page-prefix` to the CLI so any remaining auto-named class is namespaced.
4. Run `resolve_fluid` over what is left, then `validate_payload` as a gate — it must
   return `pass: true` before anything is pasted.
5. Only then authenticate `webflow-dr-nahlah` against a real site and paste one chapter
   as a spike.
