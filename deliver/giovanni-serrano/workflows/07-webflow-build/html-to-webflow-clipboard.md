# 07 Webflow Build - HTML/CSS/JS to Clipboard Paste

Convert an approved HTML/CSS/JS design package into Webflow's clipboard paste
format (`@webflow/XscpData`), import source CSS variables into Webflow before
paste, then paste generated sections into the Webflow Designer. This is the
primary Webflow build method for this delivery workflow.

> [!WARNING]
> The clipboard payload is reverse-engineered from real Webflow clipboard
> captures, not an official Webflow API. Always paste into a scratch page first.

## Build → Paste → Verify Protocol

The exact loop for every build iteration. Skipping or reordering steps causes
the documented regressions, so follow it verbatim.

### A. Generate

1. If the page mixes sources (e.g. the static `#portfolio` transplant), rebuild
   the hybrid source first; otherwise use the approved design HTML directly.
2. **Cross-page class duplication is handled at paste time by the Relume
   Chrome extension** — paste with the extension active and same-named
   classes from other built pages do not overwrite each other, so the
   converter needs no special flags for additional pages.
   Background, in case a paste must ever happen WITHOUT the extension: one
   converter run is only consistent with itself; a second page converted
   separately reuses the same auto-generated content-class names (`div-N`,
   `section-N`, `p-N`, …) with different definitions, and Webflow's
   site-wide merge-by-name keeps the already-existing definition — silently
   breaking the new page everywhere (the invest regression, 2026-06-12: 134
   colliding names; invest's `.div-33` ledger-row grid was replaced by
   index's 56px display number). For that no-extension case only, pass
   `--avoid` with every built page's split folder: it renames colliding
   classes (`div-33` → `div-33-invest`), forces colliding JS-queried tokens
   (e.g. `top`) through the thin-utility split, and rewrites renamed tokens
   inside the runtime-state CSS artifact.
   One caveat applies even WITH the extension: if it dedupes by renaming a
   pasted class that the custom code queries or the runtime-state CSS
   targets (`reveal`, `track`, `links`, …), those hooks stop matching.
   After pasting, run the section E live verification and check the
   animation-manifest hook classes exist verbatim in the published DOM.
3. Run the split (one converter pass = globally consistent class names):

   ```bash
   python html_to_webflow.py --html ".tmp/hybrid-final-revisions-portfolio04.html" \
     --asset-base "https://giovanni-serrano.vercel.app" \
     --var-map .tmp/webflow-variable-map.json \
     --split .tmp/index
   ```

4. Confirm the build report lists every section with a plausible node count
   (a ~20-node section that should be ~300 means a stub/empty source root).

### B. Payload QA (before touching Webflow)

Run `python wf_tools.py qa .tmp/<page-name> --against .tmp/<other-built-page>,...`
**immediately after the converter run for that page** (the shared
`.tmp/animation-manifest.json` it reads belongs to the LAST converter run).
Pass `--accept name1,name2` only for collisions that were reviewed by hand and
confirmed to have identical intended values. It checks every `paste_*.html`
payload (`<script type="application/json">`):

1. **No literal CSS escapes** — zero text nodes containing `\2014` or `\20`.
2. **No cross-file class conflicts** — every (name, comb) pair must have ONE
   styleLess+variants signature across all generated split files.
3. **JS hook integrity** — every id and every class token the custom code
   *queries* (manifest `querySelectors` + `ids`) must exist verbatim in the
   payload (e.g. `svc-track`, `svc-drag-cursor`, literal `track`, `reveal`,
   `reveal-stagger` class tokens). The manifest `classes` list is the full
   source-document inventory and is informational only: the converter may fold
   a non-queried class into a sig-deduped content record (e.g. the invest
   `.body` floor divs collapsing into a `div-N` record).
4. **No overflow on section roots** — the first class of each section root must
   not contain `overflow`. (Known benign exception: the index `marquee` root
   clips its own scrolling strip by design and contains nothing sticky.)
5. **Form embed carries its `<style>` prefix** and stays under ~10k chars.
6. **Cross-page collisions** (`--against`) — informational when pasting with
   the Relume extension (it dedupes same-named classes at paste time); a
   hard failure only for pastes done without the extension (then regenerate
   with `--avoid`, see step A.2).

`wf_tools.py` also covers the other recurring diagnostic scenarios without
writing ad-hoc scripts: `collisions` (audit any set of built pages),
`inspect` (find nodes/styles in payloads by class, id, or text),
`expect` (generate live-verification expectations + a ready-made browser
audit JS snippet from the approved source), and `audit-diff` (compare the
browser audit result against expectations). Run `python wf_tools.py -h`.

### C. Webflow Designer

1. Delete ALL existing content from the target page — including content from
   older build methods. The invest page still carried a nav + `main` + footer
   scaffold from the retired element-actions MCP build, so pasting into it
   produced a duplicate nav and orphaned wrappers (2026-06-12). The pasted
   sections must be the page's only content, as direct children of the body.
2. Style Manager → **Clean up unused styles**. Never skip: Webflow merges
   styles by class name **site-wide** and existing definitions silently win
   over pasted ones — stale classes resurrect old typography/layout. (Cleanup
   only removes UNUSED classes; other built pages' classes survive it, which
   is exactly why step A.2's `--avoid` is required.)
3. Paste **every** `paste_*.html` page **in filename order**, each after the
   previous one, **with the Relume Chrome extension active** (it dedupes
   same-named classes from other built pages at paste time). Count the
   pasted sections against the build report before moving on — on invest,
   `paste_14_background` was silently skipped and the whole `#background`
   section was missing from staging.

### D. Custom code

1. **Site** Settings → Custom Code → **Head** (NOT Page Settings — page-level
   custom code only applies to that page): replace the entire generated
   `<style>` block with the current `.tmp/webflow-runtime-states.css` content.
   Never hand-edit it; never reduce `body{overflow-x:hidden}` selectors or the
   repeated `.in.in.in` tokens (both are load-bearing, see below).

   *Fonts: keep the `@import`, do NOT rely on Webflow's native font settings.*
   Webflow's Google Fonts integration loads only the variants ticked when the
   font was added — it never infers italics from CSS. Worse, tested 2026-06-12
   on Giovanni Serrano: italic variants added in Site Settings → Fonts were
   **silently reverted after publish/reload** (a known-flaky Webflow area,
   aggravated when font usage lives only in pasted `styleLess` rather than
   Designer typography settings). The artifact's leading `@import` of the
   source fonts URL is the standing solution. The rest of the block likewise
   has no native equivalent short of rebuilding all reveal/drag behavior as
   ix2 interactions.
2. **Page** Settings → Custom Code → **Before `</body>` tag** (NOT Site
   Settings once the site has more than one built page): `<script>` with
   that page's `.tmp/webflow-custom-code.js`. Footer-position, not head —
   the script queries the DOM at execution time. Only update when the
   source JS changed.

   > [!WARNING]
   > **Never stack multiple pages' scripts in Site Settings footer code.**
   > Top-level `const`/`let` share one global lexical scope across every
   > `<script>` tag on a page; with index's and invest's scripts both
   > site-wide, the second died at parse time with `SyntaxError:
   > Identifier 'io' has already been declared` and NONE of it ran — no
   > reveals, no progress bar, no nav toggle (2026-06-12). The generated
   > artifact is now pre-wrapped in an IIFE as a safety net, but the
   > correct model stays per-page: each page's script only queries ids that
   > exist on that page (invest's `progressBar` handler throws elsewhere).
3. Publish to staging.

### E. Live verification (foreground tab only)

> [!WARNING]
> Verify in a tab that is **focused and visible**. Background tabs freeze CSS
> transitions, IntersectionObserver delivery, and timers — every reveal will
> look broken and opacity readings will be mid-transition garbage. This false
> negative has burned two sessions.

Checklist, comparing against the local reference (`python -m http.server` in
the design folder):

1. **Reveals**: scroll the full page — every `.reveal` / `.reveal-stagger`
   block fades in; nothing stays invisible (check contact grid + about
   subheading + about timeline cards specifically: they have 3-class chains).
2. **Sticky**: about-section thesis pull quote and every section number marker
   pin at `top: 130px` while their section scrolls.
3. **Services rail**: cards visible on arrival; drag scrolls the rail;
   scroll-snap disengages while dragging; the "Drag" bubble follows the cursor
   on hover (desktop) and is absent on touch.
4. **Contact form**: underline fields, coral mono labels, navy full-width
   submit with hover — not native browser controls.
5. **Text integrity**: no fused words (heading line breaks render), em-dashes
   render (no literal `\2014`), footer fine print on separate lines.
6. **Footer marquee** animates (`@keyframes` come from the head CSS).
7. **Mobile** (resize ≤767px): hamburger opens the nav (`links.open` rules),
   phone-breakpoint styles apply at `small`, not at tablet width.
8. Console: zero errors.

If a symptom appears, diagnose in this order: (1) head CSS present and current?
(2) class tokens/ids on the element match the manifest? (3) computed style —
which selector wins? (4) only then suspect the JS.

## Operating Model

1. Confirm Webflow MCP runtime auth and the exact target Webflow site.
2. Extract source `:root` CSS variables and import them through Webflow MCP.
3. Generate Webflow clipboard copy pages with resolved CSS values for stable
   paste rendering.
4. Paste sections into the Designer in order.
5. Use MCP/Designer variable tools and the generated binding manifest to bind
   pasted style properties to Webflow variables by variable ID.
6. Install extracted JavaScript as Webflow custom code.
7. Publish staging only after explicit confirmation and QA.

The MCP is used for setup tasks that are safer and more durable through Webflow
APIs, especially CSS variable import. The component structure and styles are
still pasted through the browser copy-page flow because full-page MCP
element-by-element construction was slower and less faithful.

## Webflow MCP Execution Constraints

> [!IMPORTANT]
> The Webflow Designer MCP (bridge/companion app) can take **up to 15 minutes**
> to complete a single action. A slow response is NOT a failure or a dropped
> session — the bridge app is still processing. Watch the bridge app in the
> Designer to confirm progress before assuming an error.

Hard rules when driving the Designer MCP (`style_tool`, `variable_tool`,
`element_tool`, etc.):

1. **One action at a time.** Never issue MCP calls in parallel. Multiple
   concurrent calls (e.g. several `style_tool` batches at once) overload the
   bridge server and degrade or stall every in-flight request.
2. **Wait up to 15 minutes** for each call to return before considering any
   fallback. Do not retry a call that is merely slow — the original is still
   running, and a retry adds parallel load.
3. **Keep batches small.** Prefer ~10 `update_style` actions per call so a
   single call completes well inside the timeout window. Send the next batch
   only after the previous one returns.
4. **Errors like "session expired" or "Unable to connect" under load are
   usually overload symptoms**, not true disconnects. If they appear, stop
   issuing calls, let the bridge drain, and resume sequentially. Reconnect the
   Designer tab (keep it active/foreground) only if the bridge app itself is
   actually down.
5. **Bindings are idempotent.** Re-applying the same `variable_as_value` update
   is safe, so after an ambiguous response, verify with a read before blindly
   re-sending.

## Clipboard Inspector References

Use [Clipboard Inspector](https://evercoder.github.io/clipboard-inspector/) as
the official tool for inspecting Webflow clipboard payloads.

Reference captures in this workflow:

- `.tmp/webflow_navbar.json` - navbar payload reference.
- `.tmp/webflow_section_hero.json` - section payload reference.
- `.tmp/webflow_combo_class.json` - combo-class payload reference.

Capture procedure:

1. In Webflow Designer, copy a known-good component or section.
2. Open `https://evercoder.github.io/clipboard-inspector/`.
3. Inspect the `application/json` clipboard entry.
4. Confirm the JSON root has `"type":"@webflow/XscpData"`.
5. Save the payload as `.tmp/webflow_<case>.json`.

Clipboard Inspector is a reference/debugging tool only. Production paste pages
are generated by `html_to_webflow.py --copy-page` or `--split`.

## Clipboard Format

The payload shape is:

```json
{
  "type": "@webflow/XscpData",
  "payload": {
    "nodes": [],
    "styles": [],
    "assets": [],
    "ix1": [],
    "ix2": { "interactions": [], "events": [], "actionLists": [] }
  },
  "meta": {}
}
```

- `nodes` are flat and parent-first. Element nodes reference children by `_id`.
- `styles` are class records. CSS declarations live in `styleLess`; responsive
  values live in `variants` such as `medium`, `small`, and `tiny`.
- Webflow reads the clipboard payload from `application/json`, not `text/plain`.
  The OS clipboard tools are not enough; the generated browser copy page writes
  the required MIME type.

## CSS Variables Preflight

Before pasting components, extract source CSS custom properties from the approved
design and import them into the target Webflow project through MCP.

Generated artifacts:

- `.tmp/webflow-variable-import.json` - source `:root` variables prepared for MCP
  import.
- `.tmp/webflow-variable-map.json` - record of Webflow variable CSS names and
  variable IDs after import when the MCP step is executed.
- `.tmp/webflow-style-variable-bindings.json` - post-paste binding manifest that
  lists each pasted class/property that should be linked to a Webflow variable.

For production paste pages, omit `--preserve-vars`. The stable workflow is to
paste concrete values first, then bind variables after paste using MCP
`style_tool.update_style` properties with `variable_as_value`.

> [!IMPORTANT]
> **Paste-time variable linking does not work — confirmed 2026-06-04.** Pasting
> raw `var(--name)` declarations does **not** create Designer-linked variable
> chips, even when all variables already exist in the target site with cssNames
> matching the source names exactly. Test: regenerated `paste_02_marquee.html`
> with `--preserve-vars` (raw `var(--terra)`, `var(--canvas)`, `var(--terra-d)`,
> `var(--gold)`) and pasted into the Giovanni Serrano site where those 22
> variables exist. Webflow resolved each `var(...)` to its concrete value
> (e.g. `var(--terra)` → `#E07A5F`) and produced **no** variable chips. So
> Webflow recognizes the variable but inlines the value instead of linking it.
> Do not re-attempt `--preserve-vars` as a shortcut for variable binding — the
> post-paste MCP binding step is required. `--preserve-vars` remains a
> debugging-only flag.
>
> **Root cause (ground truth, 2026-06-04):** Webflow itself strips variable
> bindings to concrete values when copying to the clipboard. Captured a real
> Webflow copy of the navbar whose `top`/`cta`/`em` styles were confirmed
> variable-bound in the Designer (verified via `style_tool.query_styles` showing
> `{"id":"variable-…"}` chips). The clipboard `application/json` for those same
> styles contained only concrete values — `top` → `background-color: #F4F1DE`,
> `cta` → `background-color: #3D405B`, `em` → `color: #E07A5F` — with **no
> `var(...)` and no variable IDs anywhere**. The `@webflow/XscpData` clipboard
> format has no field that represents a variable binding. Therefore no converter
> change, MIME type (`text/html`), or payload tweak can make paste produce
> variable chips. Post-paste Designer API (MCP) binding is the only mechanism.
> Capture saved at `.tmp/webflow_variable_ref_capture.json`.

When applying the post-paste MCP bindings, follow the
[Webflow MCP Execution Constraints](#webflow-mcp-execution-constraints): issue
`style_tool` calls one at a time in small batches (~10 actions), never in
parallel, and wait for each to return.

> [!WARNING]
> **MCP is not the recommended approach for binding a whole project (decided
> 2026-06-04, Giovanni Serrano).** It is the only *programmatic* way to create
> variable chips, but in practice it is too slow and the Designer bridge tends to
> hang or take excessively long, so it does not scale to a full page's worth of
> bindings. Recommended order of preference:
> 1. **Clone a pre-bound style guide** (bind classes to variables once, reuse by
>    cloning per project — the Relume model). Best for scale.
> 2. **Bind by hand in the Designer** for a single project's classes. This was
>    the chosen path for Giovanni Serrano.
> 3. **MCP** only for small, targeted bindings — not bulk/full-project work.

### How Relume-style "paste-and-link" actually works

Relume components appear to keep their variable bindings on paste, but the
binding does **not** ride in the clipboard. Verified against a real Relume copy
(`.tmp/relume_variable_capture.json`): its `styleLess` held only concrete values
(`color: black`, `color: #fff`, `background-color: transparent`,
`background-color: hsla(...)`) — no variable references.

The real mechanism is the **install/clone style guide**:

1. The Relume Style Guide is cloned/installed first, which creates the variables
   **and the classes already bound to them** (e.g. `.text-color-white` already
   has `color` linked to a white variable).
2. Components are elements that **apply those class names**.
3. On paste, Webflow **merges styles by class name** — a pasted element that uses
   an existing bound class adopts that class's existing definition (including its
   variable bindings). The concrete values in the pasted payload do not overwrite
   the already-bound class.

**Implication for this workflow:** variable binding is a one-time, per-design-
system cost that lives on the **style guide / classes**, not on the components.
The scalable pattern is to build a pre-bound style guide once (bind all classes
to variables via MCP), then reuse it by cloning per project — mirroring Relume.
There is no per-paste shortcut, but there is a one-time-then-reuse path.

> [!NOTE]
> Open verification: confirm that re-pasting a component whose class already
> exists **bound** in the target site preserves the binding (rather than
> reverting it to concrete). If confirmed, classes can be bound once and the
> design re-pasted/iterated freely without re-binding.

> [!IMPORTANT]
> **MCP bindings publish correctly even when the Designer panel does not show the
> chip (observed 2026-06-04).** After MCP `update_style` variable binding, the
> published/staging CSS rendered the bindings as `var(--…)` correctly, while the
> Designer style panel did not visually display the variable chips. This is a
> Designer UI refresh gap, not a data problem — the binding is real and ships.
> Verify binding completion via published CSS or `style_tool.query_styles`
> (look for `{"id":"variable-…"}`), **not** by eyeballing the Designer panel.
> Avoid re-binding styles by hand that already publish `var(--…)`.

Do not assume the source CSS custom property name is the same as Webflow's CSS
name. Webflow exposes the reliable name through each variable's CSS field /
`variable.getCSSName()`; this is distinct from the display name and can change
when variables live outside the base collection. After MCP import, update
`.tmp/webflow-variable-map.json` with each actual `cssName` and `variableId`,
then pass it with `--var-map .tmp/webflow-variable-map.json`. For example,
source `--canvas` may need to become `var(--base--canvas)` if that is the CSS
name Webflow reports, but the Designer variable binding uses the variable ID,
not the CSS name.

The binding manifest writes MCP-ready actions in this shape:

```json
{
  "update_style": {
    "style_name": "top",
    "breakpoint_id": "main",
    "pseudo": "noPseudo",
    "properties": [
      {
        "property_name": "background-color",
        "variable_as_value": "<webflow-variable-id>"
      }
    ]
  }
}
```

Bindings marked `missing_variable_id` mean the source CSS variable was detected
but `.tmp/webflow-variable-map.json` does not yet contain the Webflow variable
ID needed for Designer variable chips.

Font family variables are resolved to concrete font stacks **in the clipboard
paste payload** (the default, `--preserve-vars` off): re-copy testing showed
Webflow strips `font-family: var(...)` declarations from pasted `styleLess`,
while concrete font-family values survive. However, the post-paste binding
manifest (`.tmp/webflow-style-variable-bindings.json`, generated internally with
preserve-vars on) **keeps** the `font-family: var(...)` reference and emits a
`font-family` → variable binding action. The clipboard restriction does not
apply to the Designer API: MCP `style_tool.update_style` with `variable_as_value`
binds the font through the API after paste, so headings link to the `--display`
font variable exactly as in the source design instead of pasting a hardcoded
stack. Fill the font variables' `variableId` in `.tmp/webflow-variable-map.json`
(same as colors) for these bindings to report `ready`.

`--preserve-vars` remains useful for debugging raw clipboard behavior, but it is
not the production path for Webflow Designer variable mapping.

The converter also carries source `body` base declarations onto each pasted
top-level root. This is required because Webflow receives pasted components, not
the source document's `body` element. Base declarations such as background,
color, font family, font size, line height, and overflow rules must therefore be
present on the pasted root class for variables to appear correctly across all
components.

## Combo Classes

Webflow-native combo classes are supported for clean source class stacks.
`.tmp/webflow_combo_class.json` is the ground-truth reference.

Rules:

- Base styles use `comb: ""`.
- Combo styles use `comb: "&"`.
- Parent/base styles list combo style IDs in `children`.
- Nodes apply class IDs in order: base class first, combo classes after it.
- Tag-qualified root class selectors such as `section.scene` and
  `section.scene.bone` are treated as native base/combo class rules when the tag
  matches the pasted element.
- Chained combos follow the same order, for example:
  `button + is-secondary + is-alternate`.

Reference examples from `.tmp/webflow_combo_class.json`:

- `margin-bottom + margin-small`
- `margin-top + margin-medium`
- `section_header5 + text-color-white`
- `button + is-alternate`
- `button + is-secondary + is-alternate`

Selectors that cannot map cleanly to an element-owned class stack, such as
descendant selectors, structural selectors, and contextual state selectors, still
use the cascade resolver fallback.

### Contested combo names are demoted to simple rules

A combo record normally absorbs compound `.base.combo` rules whose class chain
is a subset of the element's stack. But the SAME name used in a different stack
context then emits a DIFFERENT record under one name — e.g. on the invest page,
`.sample-line.sub { color }` produced a fat `sub` combo while `.scene-head .sub`
stacks produced a thin empty `sub`. Webflow merges styles by class name
site-wide, so only one record survives the paste and the other context's
declarations are silently lost (the invest sample-section regression,
2026-06-12).

The converter pre-pass now computes every class's per-class emission signature
across all stacks; a name with more than one signature is **contested** and is
demoted to its own simple `.name` rules everywhere (byte-identical records),
while the compound declarations land on the per-element content class via the
residual mechanism. Combo names used in only one stack context (the Relume
`button + is-secondary` pattern) keep the native compound emission. See
`contested_combo_names` and `test_contested_combo_name_records_stay_byte_identical`.

### Shared utility classes are never fat-baked

Webflow merges pasted styles **by class name**. A class name used both as a
sole class on one element and as a combo/utility on others (animation hooks like
`reveal` / `reveal-stagger`, spacing utilities, etc.) is dangerous: if the
converter bakes a single element's full computed cascade under that shared name,
Webflow's merge spreads that element's typography to every other user of the
utility. The classic symptom is a heading's `font-size`/`font-family` leaking
onto every `.reveal` element so unrelated text "goes very large."

Guard: any class name that appears in a multi-class stack anywhere in the
document is treated as a **shared utility**. A single-class element using such a
name is split into `[content, utility]` — the utility keeps only its own
simple-rule declarations (identical to its combo emissions, so the name-merge is
a no-op), and the element's own typography/layout is baked onto a separate
content class (named after the tag) applied as the base with the utility chained
on top. Utility records of the same name are therefore byte-identical across the
payload. Unique single-class elements (names never used in a combo) keep the
normal full-cascade bake. See `_split_single_utility` and the
`test_shared_utility_class_stays_thin_*` regression test.

## Cascade Resolver

Webflow's class model is flat, while hand-authored HTML often relies on
descendant, compound, and state selectors. The resolver:

1. Parses the full stylesheet into selector rules with specificity, source
   order, breakpoint, state, and pseudo-element metadata.
2. Matches rules against the full document with soupsieve.
3. Computes effective declarations per element and emits Webflow-compatible
   `styleLess` classes.

For new designs, prefer Webflow-native class stacks and Client-First style
classes. The resolver exists so existing custom designs still paste correctly.

## CSS Translation Rules

| Source CSS | Webflow output | Reason |
| --- | --- | --- |
| `gap`, `row-gap`, `column-gap` | `grid-row-gap`, `grid-column-gap` | Webflow stores legacy gap properties. |
| `padding: 22px 40px` | `padding-top: 22px; padding-right: 40px; padding-bottom: 22px; padding-left: 40px;` | Webflow stores individual padding longhands. |
| `margin: 0 0 56px` | `margin-top: 0; margin-right: 0; margin-bottom: 56px; margin-left: 0;` | Webflow stores individual margin longhands. |
| `border: 1px solid #3D405B` | `border-top-style: solid; border-top-width: 1px; border-top-color: #3D405B;` (all 4 sides) | Webflow stores per-side border longhands. |
| `border-radius: 50%` | `border-top-left-radius: 50%; ...` (all 4 corners) | Webflow stores per-corner radius longhands. |
| `inset` | `top`, `right`, `bottom`, `left` | Webflow does not parse the shorthand reliably. |
| `repeat(3, 1fr)` | `1fr 1fr 1fr` | Webflow stores explicit grid tracks. |
| `display: grid` | Adds grid auto columns, columns, and rows | Designer needs all grid track fields. |
| `var(--token)` | Resolved for production paste; mapped to `variable_as_value` actions after paste | Clipboard paste does not create Designer-linked variable bindings. |
| `font-family: var(--font-token)` | Concrete stack in clipboard; `font-family` `variable_as_value` action in the post-paste binding manifest | Webflow strips font variable declarations on re-copy, but the Designer API can bind the font variable after paste. |
| `::before`, `::after` | Real child `div` nodes | Webflow has no class-level pseudo-elements. |
| CSS string escapes in `content` (`'\2014'`) | Decoded to the literal character (—) | Otherwise the escape pastes as visible `\2014` text. |
| `<br>` | Each line after the first wraps in a `span` Block with class `br-line` (`display: block`) | The clipboard format has no line-break node; dropping `<br>` fused words ("MoveWith"). |
| Whitespace-only text between inline siblings | Preserved as a `" "` text node | Dropping it fused words around `<em>`/`<span>` boundaries; whitespace between block siblings is still dropped. |
| Inline `style=""` | Folded into the emitted class | More reliable than Webflow `data.style`. |
| Inline SVG | `HtmlEmbed` | Webflow cannot represent SVG as a native tree. |
| Unsupported-tag subtrees (`<form>`, `<button>`) | `HtmlEmbed` prefixed with a `<style>` block of every source rule matching the subtree (vars resolved, media queries reconstructed) | The source `<style>` never rides the clipboard, so embeds previously pasted completely unstyled (the contact form regression). |
| Relative image `src` | Absolutized with `--asset-base` | Prevents broken images after paste. |

### Multi-class elements styled by context selectors

`class_computed` only attributes simple `.a` / `tag.a.b` rules to native
base/combo classes. Declarations that reach a multi-class element through
descendant or compound-context selectors (`.proforma .row`, `.scene-head .sub`)
belong to no class record and were previously dropped — proforma rows lost
their grid layout, `.sub reveal` subtitles lost their Lora italic typography.

The converter now computes the element's full cascade, diffs it against the
union of the per-class records, and when a residual exists emits the element as
`[content, class1, class2, …]` — the residual baked onto a content class named
after the tag (sig-deduped, name-uniquified), the source classes chained after
it as thin utilities. This mirrors `_split_single_utility`. Stacks fully
described by simple rules keep the clean native combo emission.

### Re-paste hygiene (required when iterating)

Webflow merges pasted styles **by class name, site-wide**, and an existing
class definition always wins over the pasted one. Re-pasting regenerated
sections into a site that still holds class records from an earlier paste run
(`p`, `div-3`, `sub`, `row`, …) silently reuses the stale definitions — the
classic symptom is typography reverting to an older iteration. Before
re-pasting regenerated pages:

1. Delete the previously pasted sections from the page.
2. Run Style Manager → **Clean up unused styles** to purge the old class
   records.
3. Paste the new `paste_*.html` pages in order.

## JavaScript Animations

The clipboard payload does not emit native Webflow `ix2` interactions. Source
JavaScript is extracted and installed as Webflow custom code after the sections
are pasted.

Generated artifacts:

- `.tmp/webflow-custom-code.js` - extracted inline page scripts and external
  script references.
- `.tmp/animation-manifest.json` - IDs, classes, query selectors, and inline
  handlers that the pasted DOM must preserve.
- `.tmp/webflow-runtime-states.css` - CSS the clipboard cannot carry, for
  Site Settings → Custom Code → Head inside a `<style>` block:
  1. rules referencing **runtime-toggled classes** (classes the page JS adds
     but that never appear in source markup: `.reveal.in`,
     `.h-stage .track.dragging`, `.svc-drag-cursor.active`, `nav .links.open`).
     Pasted class records only describe markup-time state, so without this the
     JS toggles change nothing — the rail drag feels broken (scroll-snap never
     disengages) and the hover "Drag" cursor never appears;
  2. rules whose class **combination** matches nothing at markup time even
     though every token exists somewhere (`.pin-step.active` while the nav has
     `a.active`) — runtime state the token check alone missed (the invest
     pin-step regression, 2026-06-12). Discriminator tokens get the same
     `.tok.tok.tok` specificity boost;
  3. rules gated on runtime **attribute** state — `details[open]` — shipped
     with an `[open][open][open]` specificity boost (the invest FAQ
     regression);
  4. `@keyframes` blocks (no Webflow representation);
  5. the source `body` overflow rules as `body{...}` (see below);
  6. the source Google Fonts stylesheet as a leading `@import` — Webflow's
     font integration loads upright weights only, so without it italic faces
     (Lora Italic) render as a synthesized slant.
  `::before`/`::after` in shipped selectors are rewritten to the materialized
  child divs (`.bar::before` → `.bar > .bar-before`): the pasted DOM has no
  real pseudo-elements, so a verbatim pseudo selector matches nothing (the
  invest compare-bars regression). Installing the artifact replaces any
  hand-written reveal-fix style block.

### JS / state-CSS class hooks survive renaming

Class names are identity hooks for custom code and runtime-state CSS, so the
converter must never rename them away. Two single-class elements sharing a name
but with different computed styles (marquee `.track` vs services rail
`.h-stage .track`) previously baked two fat records and the uniquifier renamed
one to `track-2` — which removed the literal `track` token from the element and
broke `.h-stage .track.dragging`. Such names are now detected in a pre-pass and
treated as shared utilities: the name stays on the element as a thin class,
styling moves to sig-deduped content classes.

For the same merge-by-name reason, shared-utility and combo records only carry
**unqualified** `.class` rule declarations. Tag-qualified rules (`nav.top`,
`section.scene`) are context-dependent — fat on one tag, empty on another — and
live on the per-element content class instead.

### Sticky positioning vs the page-base carry

`position: sticky` is disabled by ANY ancestor with non-visible overflow. The
page-base carry therefore strips the source `body` overflow declarations
(`overflow-x: hidden`) instead of stamping them onto every pasted section root
— that stamp silently broke the about-section thesis pull quote and all sticky
section markers. The body-level horizontal clip ships in
`.tmp/webflow-runtime-states.css` as `body{overflow-x:hidden}` — **body only,
never `html,body`**: with `html` non-visible, body's overflow stops propagating
to the viewport, body becomes its own clip container, and sticky dies page-wide
(verified live 2026-06-12).

Runtime-state rules in the artifact are emitted with their runtime class token
repeated (`.reveal.in` → `.reveal.in.in.in`). Webflow publishes baked combo
chains like `.span-4.contact-grid.reveal{opacity:0}` at specificity (0,3,0),
which outranks a verbatim `.reveal.in` (0,2,0) — the element then never
reveals (the invisible contact-section regression). The repetition lifts every
state rule above any chain the converter can emit without changing what it
matches.

The converter preserves `id`, `data-*`, `aria-*`, `role`, and other safe custom
attributes in `xattr`. Inline event handlers are not copied as attributes; they
are reported in the animation manifest so they can be moved into delegated
custom code.

## Usage

Recommended full-page section split:

```bash
python html_to_webflow.py --html "../05-design-revisions/.tmp/final revisions/index.html" \
  --asset-base "https://giovanni-serrano.vercel.app" \
  --var-map .tmp/webflow-variable-map.json \
  --split .tmp/index
```

(The client-approved source currently lives in `final revisions/` — quote the
path, it contains a space.)

Sub-pages are fully static (no API stubs), so they convert from the approved
source directly — no hybrid rebuild. Invest (18 sections, QA-passed
2026-06-12; this set happens to carry namespace-avoidance renames from before
the Relume-extension workflow was adopted — harmless, paste as-is):

```bash
python html_to_webflow.py --html "../05-design-revisions/.tmp/final revisions/invest.html" \
  --asset-base "https://giovanni-serrano.vercel.app" \
  --var-map .tmp/webflow-variable-map.json \
  --split .tmp/invest --avoid .tmp/index
python wf_tools.py qa .tmp/invest --against .tmp/index --accept links,nav-toggle
```

Future pages need no `--avoid` when pasting with the Relume extension active
(see step A.2); generate with `--split .tmp/<page>` and run
`wf_tools.py qa .tmp/<page>` as usual.

> [!WARNING]
> **Shared artifacts belong to the LAST converter run.** Each `--split` run
> rewrites `.tmp/webflow-custom-code.js`, `.tmp/animation-manifest.json`,
> `.tmp/webflow-runtime-states.css`, and the variable/binding artifacts in
> `.tmp/` for THAT page. Before converting a different page, copy the current
> set into a per-page folder (`.tmp/index-artifacts/` holds the index set from
> 2026-06-12). The paste pages themselves are unaffected (one folder per page).

> [!IMPORTANT]
> **Multi-page custom code (decided 2026-06-12): JS is per-page.** Each
> page's `<script>` goes in that page's Page Settings → before `</body>`
> (see section D.2 — stacking page scripts site-wide caused the
> `Identifier 'io' has already been declared` SyntaxError that killed all
> invest JS). Head CSS may stay site-wide: rules are class-scoped and safe
> to concatenate (dedupe the `@import` and `body{overflow-x:hidden}`
> lines), or install per-page alongside the script — keep the font
> `@import` on every page either way.

The variable map `.tmp/webflow-variable-map.json` carries the Webflow variable
IDs from the 2026-06-05 MCP import (recovered from
`.tmp/test-01/webflow-variable-map.json`); converter runs preserve filled IDs,
so binding manifests report `ready`.

> [!NOTE]
> **Giovanni Serrano portfolio section (2026-06-12).** The 05 `final revisions`
> page stubs `#portfolio` and fills it at runtime from `/api/portfolio`
> (Airtable via Vercel), which cannot work on Webflow. The production paste set
> in `.tmp/index` is therefore generated from
> `.tmp/hybrid-final-revisions-portfolio04.html` — the 05 page with the static
> `#portfolio` section transplanted from
> `../04-design/.tmp/final-design/index.html`. 05's CSS retains every portfolio
> rule, and the Airtable loader JS is null-guarded on `#portfolio-groups`
> (absent from the static markup), so the custom code stays inert. Regenerate
> the hybrid before re-splitting if either source page changes.

Then open each generated `.tmp/index/paste_*.html` page, click "Copy to
Webflow clipboard", and paste into one Webflow page in filename order.

Targeted section fallback:

```bash
python html_to_webflow.py --html "../05-design-revisions/.tmp/final revisions/index.html" \
  --root "section#home" \
  --asset-base "https://giovanni-serrano.vercel.app" \
  --var-map .tmp/webflow-variable-map.json \
  --copy-page .tmp/paste_hero.html
```

Debug output:

```bash
python html_to_webflow.py --html page.html --out .tmp/out_page.json --indent 2
python html_to_webflow.py --html page.html --no-resolve --out .tmp/out_flat.json
```

## Designer Caveats

- External images may show as gray placeholders in Designer but load on staging.
- Some decorative gradient texture strings may not render in Designer.
- Native `Navbar*`, `Dropdown*`, and Webflow `ix2` interactions are not emitted;
  use custom code or rebuild those pieces natively when required for handoff.

## Files

- [html_to_webflow.py](html_to_webflow.py) - converter, cascade resolver,
  combo-class handler, variable preservation, and JS artifact extraction.
- [wf_tools.py](wf_tools.py) - diagnostics multitool: `qa` (section B checks),
  `collisions`, `inspect`, `expect`, `audit-diff`. Replaces ad-hoc scripts.
- [TRIGGER_PROMPT.txt](TRIGGER_PROMPT.txt) - operational invocation prompt.
- [tests/test_html_to_webflow.py](tests/test_html_to_webflow.py) - converter
  regression tests (`python -m unittest discover -s tests`); runs against the
  root converter (the copy under `.tmp/test-01/` is a stale archive).
- [tests/sample_hero.html](tests/sample_hero.html) - minimal sample.
- `.tmp/webflow_*.json` - Clipboard Inspector reference captures.
- `.tmp/<page-name>/paste_*.html` - generated section paste pages (one folder per page).
- `.tmp/webflow-variable-import.json` - generated variable import artifact.
- `.tmp/webflow-custom-code.js` and `.tmp/animation-manifest.json` - generated
  JavaScript handoff artifacts.
- `.tmp/webflow-runtime-states.css` - runtime-toggled-class CSS, `@keyframes`,
  and the body-only overflow rule for the site's head custom code.

## Version Control

Follows [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Commit converter code,
workflow directives, tests, and lightweight `.tmp` reference/artifact files when
useful for review, replay, or handoff. Never commit secrets or binary/media
assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
