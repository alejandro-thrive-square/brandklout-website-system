# 07 Webflow Build - HTML/CSS/JS to Clipboard Paste

Convert an approved HTML/CSS/JS design package into Webflow's clipboard paste
format (`@webflow/XscpData`), import source CSS variables into Webflow before
paste, then paste generated sections into the Webflow Designer. This is the
primary Webflow build method for this delivery workflow.

> [!WARNING]
> The clipboard payload is reverse-engineered from real Webflow clipboard
> captures, not an official Webflow API. Always paste into a scratch page first.

> [!NOTE]
> This is the canonical, project-agnostic method directive. When this workflow
> folder is cloned into a client project (`deliver/[client-name]/workflows/07-webflow-build/`),
> replace the placeholders below with that engagement's values and keep any
> project-specific deviations in a `## Project Notes` section at the end.

| Placeholder | Meaning |
|:---|:---|
| `[client-name]` | The client folder slug under `deliver/`. |
| `<DEPLOYED_SITE_URL>` | Vercel/preview URL hosting the approved design assets (e.g. `https://[client-name].vercel.app`). |
| `<client>.webflow.io` | The target Webflow staging subdomain. |

## Build → Paste → Verify Protocol

The exact loop for every build iteration. Skipping or reordering steps causes
the documented regressions, so follow it verbatim.

### A. Generate

> [!WARNING]
> **Paste artifacts are point-in-time snapshots — design-revision drift.**
> `paste_*.html` payloads capture the design source as of the converter run.
> A design revision made afterwards does NOT propagate; a stale segment
> pasted (or an unnoticed skipped re-paste) ships the old design. Two rules
> (Giovanni Serrano 2026-07-08: a revision added a CTA link to the featured
> portfolio block, the segments predated it, and the block shipped unclickable):
>
> 1. After ANY design revision, regenerate the affected page's payloads before
>    pasting, and treat all earlier payload folders as historical.
> 2. If the built page has since diverged from the paste artifacts (CMS
>    conversion, headless Data API patches), do NOT re-paste old segments over
>    it — that regresses the divergence. Instead diff the revised design source
>    against the previous source, enumerate every delta, and apply each one via
>    the Data API (elements: `data_element_builder` / `data_element_tool`;
>    new classes incl. hover pseudos: `data_style_tool`).

1. If the page mixes sources (e.g. a runtime/API-fed section that cannot exist
   on Webflow, transplanted from a static fallback), rebuild the hybrid source
   first; otherwise use the approved design HTML directly. Record any hybrid
   source path and its rationale in `## Project Notes`.
2. **Cross-page class duplication — the shared-class-system flow (preferred).**
   Webflow reconciles pasted classes BY NAME (both our payloads and the Relume
   reference fixtures use fresh random `_id`s, so the id is not the matcher). A
   class merges cleanly only when the name AND definition match; a same-named
   class with a DIFFERENT definition is forked (`scene-head-2`) or, with the old
   `--avoid`, verbosely suffixed. The root cause is the converter inventing
   per-page definitions: it auto-names anonymous elements positionally
   (`div-33`, `p-5`) via a per-run counter, and bakes slightly different concrete
   values for the SAME source class on different pages. Fix it at generation:

   1. Write a sources manifest `.tmp/build-sources.json` mapping each page name
      to its approved source HTML. `python build_vocab.py --sources
      .tmp/build-sources.json` reads the no-`--avoid` payloads of every page
      (`.tmp/_raw/<page>` — regenerate those once with no flags) and writes
      `.tmp/style-vocabulary.json`: for each SOURCE class used on >=2 pages it
      picks ONE canonical definition (identical -> as-is; trivial drift such as
      a missing `box-sizing` -> order-preserving union; genuine per-page value
      differences such as a section whose grid color or marker size differs ->
      `pending`, recorded for a human call, NOT auto-unified).
   2. Generate each page with `--vocab .tmp/style-vocabulary.json` (auto-derives
      `--page-prefix <page>`). The converter then (a) emits the canonical
      definition for vocab classes so they are byte-identical on every page ->
      Webflow merges by name, no duplicate; and (b) page-prefixes tag-derived
      auto-names (`div` -> `invest-div`) so page-specific residuals are unique by
      construction and can never fork. Source-class names and JS/state hooks are
      left untouched.
   3. Keep `--avoid` as the RESIDUAL pass for the classes vocab left `pending`
      (genuinely different per page). With vocab applied, the shared classes are
      already identical so `--avoid` leaves them alone and renames ONLY the
      divergent remainder. Use `--avoid-suffix <page>` for clean names
      (`foot-mark-invest`). `--avoid` still forces colliding JS-queried tokens
      (e.g. `top`) through the thin-utility split and rewrites renamed tokens in
      the runtime-state CSS artifact **and inside HtmlEmbed `meta.html`** (an
      HtmlEmbed stores its HTML in BOTH `node["v"]` and
      `node["data"]["embed"]["meta"]["html"]`; the rename must touch both).

   Verify after generating: `python wf_tools.py collisions .tmp/*-wholepage`
   must report 0 different-def collisions, and every `querySelector` hook token
   in `webflow-custom-code.js` must still exist verbatim as a style name
   (runtime STATE tokens added by JS — `in`, `open`, `active`, `dragging` —
   legitimately do not). Caveat (benign, pre-existing): when a layout class is
   suffixed on one page, `verify.mjs`/`wf_tools.py inspect` may probe for the
   bare selector and report MISSING — styling still applies (it is baked into
   the class, not the literal selector).
3. Run the split (one converter pass = globally consistent class names):

   ```bash
   python html_to_webflow.py --html ".tmp/[page]/source.html" \
     --css ../04-design/.tmp/final-design/site.css \
     --asset-base "<DEPLOYED_SITE_URL>" \
     --var-map .tmp/[page]/webflow-variable-map.json \
     --split .tmp/[page]
   ```

4. Confirm the build report lists every section with a plausible node count
   (a ~20-node section that should be ~300 means a stub/empty source root).

### B. Payload QA (before touching Webflow)

Run `python wf_tools.py qa .tmp/<page-name> --against .tmp/<other-built-page>,...`
**immediately after the converter run for that page** (the shared
`.tmp/<page>/animation-manifest.json` it reads belongs to the LAST converter run).
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
   a non-queried class into a sig-deduped content record.
4. **No overflow on section roots WITH sticky content** — root overflow only
   fails the check when the payload also contains a `position: sticky` style
   (an overflow ancestor disables sticky descendants). Intentional clipping
   roots (rounded dark bands, marquee masks) with no sticky content print an
   `info:` line and pass.
5. **Form embed carries its `<style>` prefix** and stays under ~10k chars.
6. **Cross-page collisions** (`--against`) — informational when pasting with
   the Relume extension (it dedupes same-named classes at paste time); a hard
   failure only for pastes done without the extension (then regenerate with
   `--avoid`, see step A.2).

`wf_tools.py` also covers the other recurring diagnostic scenarios without
writing ad-hoc scripts: `collisions` (audit any set of built pages), `inspect`
(find nodes/styles in payloads by class, id, or text), `expect` (generate
live-verification expectations + a ready-made browser audit JS snippet from the
approved source), and `audit-diff` (compare the browser audit result against
expectations). Run `python wf_tools.py -h`.

### C. Webflow Designer

1. Delete ALL existing content from the target page — including content from
   older build methods. A page that still carried a scaffold from a retired
   build produces a duplicate nav and orphaned wrappers when pasted into. The
   pasted sections must be the page's only content, as direct children of the body.
2. Style Manager → **Clean up unused styles**. Never skip: Webflow merges
   styles by class name **site-wide** and existing definitions silently win
   over pasted ones — stale classes resurrect old typography/layout. (Cleanup
   only removes UNUSED classes; other built pages' classes survive it, which
   is exactly why step A.2's `--avoid`/vocab is required.)
3. Paste **every** `paste_*.html` page **in filename order**, each after the
   previous one, **with the Relume Chrome extension active** (it dedupes
   same-named classes from other built pages at paste time). Count the pasted
   sections against the build report before moving on — a missed `paste_*`
   silently drops an entire section from staging.

### D. Custom code

> [!IMPORTANT]
> **Per-section embed packaging (standard as of 2026-07-06).** Author HTML,
> CSS, and JS per section, and give every pasteable component two HtmlEmbed
> elements INSIDE the section root: one `<style>` embed (the section's CSS
> beyond the shared class system) and one `<script>` embed (the section's JS;
> omit if the section has no behavior). A pasted section must work on any page
> with zero Page-Settings changes so it can be moved between pages freely.
> Scope embed CSS to the section root class; wrap embed JS in an IIFE, query
> only inside the section root, and guard against double-init (the section may
> exist twice in a project). The head/footer custom-code steps below remain
> only for true site-wide globals: fonts `@import`, design tokens, resets, and
> the runtime-states CSS.
>
> **Converter support (`data-embed` attribute)**: author the section with
> `<style data-embed>` and `<script data-embed>` as the section root's last
> children. `html_to_webflow.py` emits them as in-place **HtmlEmbed nodes**
> (script embeds get `meta.script: true`), excludes the marked style's text
> from the CSS cascade (so its rules are NOT double-baked into classes), and
> excludes the marked script from the `webflow-custom-code.js` artifact.
> Unmarked `<style>`/`<script>` keep the legacy behavior (folded into cascade
> / custom-code artifact). Division of labor: static class styling goes in a
> regular (unmarked) `<style>` so it bakes into native, Designer-editable
> Webflow classes — class styles travel with in-Designer copy/paste anyway;
> the `data-embed` CSS carries only what classes can't: JS-applied state
> rules, ancestor-hover chains, keyframes, and exotic properties
> (`mask-image`, line-clamp). Keep each embed under Webflow's 10,000-char
> HtmlEmbed limit. Regression test:
> `tests/test_html_to_webflow.py::test_data_embed_style_script_ride_as_html_embeds`.

1. **Site** Settings → Custom Code → **Head** (NOT Page Settings — page-level
   custom code only applies to that page): replace the entire generated
   `<style>` block with the current `.tmp/<page>/webflow-runtime-states.css`
   content. Never hand-edit it; never reduce `body{overflow-x:hidden}` selectors
   or the repeated `.in.in.in` tokens (both are load-bearing, see below).

   *Fonts: keep the `@import`, do NOT rely on Webflow's native font settings.*
   Webflow's Google Fonts integration loads only the variants ticked when the
   font was added — it never infers italics from CSS. Worse, italic variants
   added in Site Settings → Fonts can be **silently reverted after
   publish/reload** (a known-flaky Webflow area, aggravated when font usage
   lives only in pasted `styleLess` rather than Designer typography settings).
   The artifact's leading `@import` of the source fonts URL is the standing
   solution.
2. **Page** Settings → Custom Code → **Before `</body>` tag** (NOT Site
   Settings once the site has more than one built page): `<script>` with that
   page's `.tmp/<page>/webflow-custom-code.js`. Footer-position, not head — the
   script queries the DOM at execution time. Only update when the source JS
   changed.

   > [!WARNING]
   > **Never stack multiple pages' scripts in Site Settings footer code.**
   > Top-level `const`/`let` share one global lexical scope across every
   > `<script>` tag on a page; with two pages' scripts both site-wide, the
   > second died at parse time with `SyntaxError: Identifier 'io' has already
   > been declared` and NONE of it ran — no reveals, no interactions. The
   > generated artifact is now pre-wrapped in an IIFE as a safety net, but the
   > correct model stays per-page: each page's script only queries ids that
   > exist on that page.
3. Publish to staging.

### E. Live verification — design vs staging (foreground tab only)

> [!WARNING]
> Verify in a tab that is **focused and visible**. Background tabs freeze CSS
> transitions, IntersectionObserver delivery, and timers — every reveal will
> look broken and opacity readings will be mid-transition garbage.

Test by comparing the **Vercel-hosted final design** (source of truth) against
the **Webflow staging build**, driving a browser automation tool
(Claude-in-Chrome extension, `verify.mjs`, etc.), and iterating on the diffs:

1. `python wf_tools.py compare <DEPLOYED_SITE_URL>/<page> <client>.webflow.io/<page>`
   prints a self-contained page-fingerprint snippet.
2. Open the design and the staging page each in a **focused, visible** tab; run
   the snippet in each console; save the two JSON results.
3. `python wf_tools.py compare --diff design.json staging.json` reports section
   structure, heading-text, element-count, body-text-length, stuck-reveal, and
   computed-style differences. Iterate until the diff is clean.
4. Walk the manual checklist below against the two tabs side by side for
   anything the fingerprint cannot capture (animation feel, drag behaviour,
   hover states):

   1. **Reveals**: scroll the full page — every `.reveal` / `.reveal-stagger`
      block fades in; nothing stays invisible (multi-class chains specifically).
   2. **Sticky**: elements meant to pin (`position: sticky`) hold while their
      section scrolls.
   3. **Custom interactions** (drag rails, scroll-snap, cursors): behave as in
      the design; touch breakpoints disable desktop-only behaviour.
   4. **Forms**: render as styled controls, not native browser defaults.
   5. **Text integrity**: no fused words (heading line breaks render), em-dashes
      render (no literal `\2014`), footer fine print on separate lines.
   6. **Animations** (marquee, keyframes) animate (they come from the head CSS).
   7. **Mobile** (resize <=767px): hamburger/menu toggles open the nav, phone
      styles apply at `small`, not at tablet width.
   8. Console: zero errors.

5. **Link parity audit** — fetch the published HTML and confirm every `<a href>`
   in the approved design source exists in it (grep for each design href and
   link class). A dropped anchor is invisible to style/text verification: the
   page looks pixel-identical and every fingerprint passes, but the element is
   not clickable (the Giovanni Serrano featured-capstone regression,
   2026-07-08). Anchors whose href is rewritten at runtime (CMS slug scripts)
   count as present if the base link element and its rewrite hook both exist.

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
   concurrent calls overload the bridge server and degrade or stall every
   in-flight request.
2. **Wait up to 15 minutes** for each call to return before considering any
   fallback. Do not retry a call that is merely slow.
3. **Keep batches small.** Prefer ~10 `update_style` actions per call. Send the
   next batch only after the previous one returns.
4. **Errors like "session expired" or "Unable to connect" under load are usually
   overload symptoms**, not true disconnects. Stop issuing calls, let the bridge
   drain, and resume sequentially.
5. **Bindings are idempotent.** Re-applying the same `variable_as_value` update
   is safe, so after an ambiguous response, verify with a read before re-sending.

## Clipboard Inspector References

Use [Clipboard Inspector](https://evercoder.github.io/clipboard-inspector/) as
the official tool for inspecting Webflow clipboard payloads.

Reference captures live in `tests/fixtures/` (kept out of `.tmp/`, which holds
only per-page build folders):

- `tests/fixtures/webflow_navbar.json` - navbar payload reference.
- `tests/fixtures/webflow_section_hero.json` - section payload reference.
- `tests/fixtures/webflow_combo_class.json` - combo-class payload reference
  (read by `test_combo_reference_capture_shape`).
- `tests/fixtures/webflow_whole_page.json` - whole-page payload reference.

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

- `.tmp/<page>/webflow-variable-import.json` - source `:root` variables prepared
  for MCP import.
- `.tmp/<page>/webflow-variable-map.json` - record of Webflow variable CSS names
  and variable IDs after import when the MCP step is executed.
- `.tmp/<page>/webflow-style-variable-bindings.json` - post-paste binding manifest
  that lists each pasted class/property that should be linked to a Webflow variable.

For production paste pages, omit `--preserve-vars`. The stable workflow is to
paste concrete values first, then bind variables after paste using MCP
`style_tool.update_style` properties with `variable_as_value`.

> [!IMPORTANT]
> **Paste-time variable linking does not work.** Pasting raw `var(--name)`
> declarations does **not** create Designer-linked variable chips, even when all
> variables already exist in the target site with cssNames matching the source
> names exactly. Webflow resolves each `var(...)` to its concrete value and
> produces **no** variable chips. Do not re-attempt `--preserve-vars` as a
> shortcut for variable binding — the post-paste MCP binding step is required.
> `--preserve-vars` remains a debugging-only flag.
>
> **Root cause (ground truth):** Webflow itself strips variable bindings to
> concrete values when copying to the clipboard. The `@webflow/XscpData`
> clipboard format has no field that represents a variable binding. Therefore no
> converter change, MIME type, or payload tweak can make paste produce variable
> chips. Post-paste Designer API (MCP) binding is the only mechanism.

When applying the post-paste MCP bindings, follow the
[Webflow MCP Execution Constraints](#webflow-mcp-execution-constraints): issue
`style_tool` calls one at a time in small batches (~10 actions), never in
parallel, and wait for each to return.

> [!WARNING]
> **MCP is not the recommended approach for binding a whole project.** It is
> the only *programmatic* way to create variable chips, but in practice it is
> too slow and the Designer bridge tends to hang or take excessively long, so it
> does not scale to a full page's worth of bindings. Recommended order of
> preference:
> 1. **Clone a pre-bound style guide** (bind classes to variables once, reuse by
>    cloning per project — the Relume model). Best for scale.
> 2. **Bind by hand in the Designer** for a single project's classes.
> 3. **MCP** only for small, targeted bindings — not bulk/full-project work.

### How Relume-style "paste-and-link" actually works

Relume components appear to keep their variable bindings on paste, but the
binding does **not** ride in the clipboard. Its `styleLess` held only concrete
values — no variable references.

The real mechanism is the **install/clone style guide**:

1. The Relume Style Guide is cloned/installed first, which creates the variables
   **and the classes already bound to them**.
2. Components are elements that **apply those class names**.
3. On paste, Webflow **merges styles by class name** — a pasted element that
   uses an existing bound class adopts that class's existing definition
   (including its variable bindings).

**Implication:** variable binding is a one-time, per-design-system cost that
lives on the **style guide / classes**, not on the components. The scalable
pattern is to build a pre-bound style guide once, then reuse it by cloning per
project. See [TEMPLATE_LIBRARY_PLAN.md](./TEMPLATE_LIBRARY_PLAN.md).

> [!IMPORTANT]
> **MCP bindings publish correctly even when the Designer panel does not show
> the chip.** After MCP `update_style` variable binding, the published/staging
> CSS renders the bindings as `var(--…)` correctly, while the Designer style
> panel may not visually display the variable chips. This is a Designer UI
> refresh gap, not a data problem — the binding is real and ships. Verify
> binding completion via published CSS or `style_tool.query_styles` (look for
> `{"id":"variable-…"}`), **not** by eyeballing the Designer panel.

Do not assume the source CSS custom property name is the same as Webflow's CSS
name. Webflow exposes the reliable name through each variable's CSS field /
`variable.getCSSName()`; this is distinct from the display name. After MCP
import, update `.tmp/<page>/webflow-variable-map.json` with each actual `cssName`
and `variableId`, then pass it with `--var-map`. The Designer variable binding
uses the variable ID, not the CSS name.

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
but `.tmp/<page>/webflow-variable-map.json` does not yet contain the Webflow
variable ID needed for Designer variable chips.

Font family variables are resolved to concrete font stacks **in the clipboard
paste payload** (the default, `--preserve-vars` off): re-copy testing showed
Webflow strips `font-family: var(...)` declarations from pasted `styleLess`,
while concrete font-family values survive. However, the post-paste binding
manifest (generated internally with preserve-vars on) **keeps** the
`font-family: var(...)` reference and emits a `font-family` -> variable binding
action. The clipboard restriction does not apply to the Designer API: MCP
`style_tool.update_style` with `variable_as_value` binds the font through the
API after paste.

The converter also carries source `body` base declarations onto each pasted
top-level root. This is required because Webflow receives pasted components, not
the source document's `body` element. Base declarations such as background,
color, font family, font size, line height, and overflow rules must therefore be
present on the pasted root class for variables to appear correctly across all
components.

## Combo Classes

Webflow-native combo classes are supported for clean source class stacks.
`tests/fixtures/webflow_combo_class.json` is the ground-truth reference.

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

Selectors that cannot map cleanly to an element-owned class stack, such as
descendant selectors, structural selectors, and contextual state selectors, still
use the cascade resolver fallback.

### Contested combo names are demoted to simple rules

A combo record normally absorbs compound `.base.combo` rules whose class chain
is a subset of the element's stack. But the SAME name used in a different stack
context then emits a DIFFERENT record under one name. Webflow merges styles by
class name site-wide, so only one record survives the paste and the other
context's declarations are silently lost.

The converter pre-pass computes every class's per-class emission signature
across all stacks; a name with more than one signature is **contested** and is
demoted to its own simple `.name` rules everywhere (byte-identical records),
while the compound declarations land on the per-element content class via the
residual mechanism. Combo names used in only one stack context (the Relume
`button + is-secondary` pattern) keep the native compound emission. See
`contested_combo_names` and the regression tests.

### Shared utility classes are never fat-baked

Webflow merges pasted styles **by class name**. A class name used both as a sole
class on one element and as a combo/utility on others (animation hooks like
`reveal` / `reveal-stagger`, spacing utilities, etc.) is dangerous: if the
converter bakes a single element's full computed cascade under that shared name,
Webflow's merge spreads that element's typography to every other user of the
utility. The classic symptom is a heading's `font-size`/`font-family` leaking
onto every `.reveal` element so unrelated text "goes very large."

Guard: any class name that appears in a multi-class stack anywhere in the
document is treated as a **shared utility**. A single-class element using such a
name is split into `[content, utility]` — the utility keeps only its own
simple-rule declarations, and the element's own typography/layout is baked onto
a separate content class applied as the base with the utility chained on top.

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
| `padding: 22px 40px` | `padding-top: 22px; padding-right: 40px; ...` | Webflow stores individual padding longhands. |
| `margin: 0 0 56px` | `margin-top: 0; margin-right: 0; margin-bottom: 56px; ...` | Webflow stores individual margin longhands. |
| `border: 1px solid #3D405B` | per-side `border-*-style/width/color` longhands | Webflow stores per-side border longhands. |
| `border-radius: 50%` | per-corner `border-*-radius` longhands | Webflow stores per-corner radius longhands. |
| `inset` | `top`, `right`, `bottom`, `left` | Webflow does not parse the shorthand reliably. |
| `repeat(3, 1fr)` | `1fr 1fr 1fr` | Webflow stores explicit grid tracks. |
| `display: grid` | Adds grid auto columns, columns, and rows | Designer needs all grid track fields. |
| `var(--token)` | Resolved for production paste; mapped to `variable_as_value` actions after paste | Clipboard paste does not create Designer-linked variable bindings. |
| `font-family: var(--font-token)` | Concrete stack in clipboard; `variable_as_value` action in the post-paste binding manifest | Webflow strips font variable declarations on re-copy, but the Designer API can bind after paste. |
| `::before`, `::after` | Real child `div` nodes | Webflow has no class-level pseudo-elements. |
| CSS string escapes in `content` (`'\2014'`) | Decoded to the literal character (—) | Otherwise the escape pastes as visible `\2014` text. |
| `<br>` | Each line after the first wraps in a `span` Block with class `br-line` (`display: block`) | The clipboard format has no line-break node; dropping `<br>` fused words. |
| Whitespace-only text between inline siblings | Preserved as a `" "` text node | Dropping it fused words around `<em>`/`<span>` boundaries. |
| Inline `style=""` | Folded into the emitted class | More reliable than Webflow `data.style`. |
| Inline SVG | `HtmlEmbed` | Webflow cannot represent SVG as a native tree. |
| Unsupported-tag subtrees (`<form>`, `<button>`) | `HtmlEmbed` prefixed with a `<style>` block of every source rule matching the subtree | The source `<style>` never rides the clipboard, so embeds otherwise paste unstyled. |
| Relative image `src` | Absolutized with `--asset-base` | Prevents broken images after paste. |

### Multi-class elements styled by context selectors

`class_computed` only attributes simple `.a` / `tag.a.b` rules to native
base/combo classes. Declarations that reach a multi-class element through
descendant or compound-context selectors belong to no class record and were
previously dropped.

The converter computes the element's full cascade, diffs it against the union of
the per-class records, and when a residual exists emits the element as
`[content, class1, class2, …]` — the residual baked onto a content class named
after the tag (sig-deduped, name-uniquified), the source classes chained after
it as thin utilities. Stacks fully described by simple rules keep the clean
native combo emission.

### Re-paste hygiene (required when iterating)

Webflow merges pasted styles **by class name, site-wide**, and an existing class
definition always wins over the pasted one. Re-pasting regenerated sections into
a site that still holds class records from an earlier paste run silently reuses
the stale definitions — the classic symptom is typography reverting to an older
iteration. Before re-pasting regenerated pages:

1. Delete the previously pasted sections from the page.
2. Run Style Manager → **Clean up unused styles** to purge the old class records.
3. Paste the new `paste_*.html` pages in order.

## JavaScript Animations

The clipboard payload does not emit native Webflow `ix2` interactions. Source
JavaScript is extracted and installed as Webflow custom code after the sections
are pasted.

Generated artifacts:

- `.tmp/<page>/webflow-custom-code.js` - extracted inline page scripts and
  external script references.
- `.tmp/<page>/animation-manifest.json` - IDs, classes, query selectors, and
  inline handlers that the pasted DOM must preserve.
- `.tmp/<page>/webflow-runtime-states.css` - CSS the clipboard cannot carry, for
  Site Settings → Custom Code → Head inside a `<style>` block:
  1. rules referencing **runtime-toggled classes** (classes the page JS adds but
     that never appear in source markup: `.reveal.in`, `*.dragging`,
     `*.active`, `nav .links.open`). Pasted class records only describe
     markup-time state, so without this the JS toggles change nothing;
  2. rules whose class **combination** matches nothing at markup time even
     though every token exists somewhere — runtime state the token check alone
     missed;
  3. rules gated on runtime **attribute** state — `details[open]` — shipped with
     an `[open][open][open]` specificity boost;
  4. `@keyframes` blocks (no Webflow representation);
  5. the source `body` overflow rules as `body{...}` (see below);
  6. the source Google Fonts stylesheet as a leading `@import` — Webflow's font
     integration loads upright weights only, so without it italic faces render
     as a synthesized slant.
  `::before`/`::after` in shipped selectors are rewritten to the materialized
  child divs (`.bar::before` -> `.bar > .bar-before`): the pasted DOM has no real
  pseudo-elements, so a verbatim pseudo selector matches nothing. Installing the
  artifact replaces any hand-written reveal-fix style block.

### JS / state-CSS class hooks survive renaming

Class names are identity hooks for custom code and runtime-state CSS, so the
converter must never rename them away. Two single-class elements sharing a name
but with different computed styles previously baked two fat records and the
uniquifier renamed one — which removed the literal token from the element and
broke the state CSS. Such names are now detected in a pre-pass and treated as
shared utilities: the name stays on the element as a thin class, styling moves
to sig-deduped content classes.

For the same merge-by-name reason, shared-utility and combo records only carry
**unqualified** `.class` rule declarations. Tag-qualified rules (`nav.top`,
`section.scene`) are context-dependent and live on the per-element content class
instead.

### Sticky positioning vs the page-base carry

`position: sticky` is disabled by ANY ancestor with non-visible overflow. The
page-base carry therefore strips the source `body` overflow declarations
(`overflow-x: hidden`) instead of stamping them onto every pasted section root —
that stamp silently broke every sticky element. The body-level horizontal clip
ships in `.tmp/<page>/webflow-runtime-states.css` as `body{overflow-x:hidden}`
— **body only, never `html,body`**: with `html` non-visible, body's overflow
stops propagating to the viewport, body becomes its own clip container, and
sticky dies page-wide.

Runtime-state rules in the artifact are emitted with their runtime class token
repeated (`.reveal.in` -> `.reveal.in.in.in`). Webflow publishes baked combo
chains at their chain specificity, which outranks a verbatim `.reveal.in` — the
element then never reveals. The repetition lifts every state rule above any
chain the converter can emit without changing what it matches.

The converter preserves `id`, `data-*`, `aria-*`, `role`, and other safe custom
attributes in `xattr`. Inline event handlers are not copied as attributes; they
are reported in the animation manifest so they can be moved into delegated
custom code.

## Output layout — one self-contained folder per page

Each page's entire build — pasteable components **and** every companion
artifact — lands in that page's own `.tmp/<page>/` folder. Nothing is written
to the shared parent `.tmp/`. A single `--split` run produces:

```
.tmp/<page>/
  paste_01_*.html … paste_NN_*.html   # the pasteable components
  webflow-custom-code.js              # page JS (IIFE-wrapped, footer)
  webflow-runtime-states.css          # head CSS the clipboard can't carry
  animation-manifest.json             # JS hook ids/classes/selectors
  webflow-variable-import.json
  webflow-variable-map.json
  webflow-style-variable-bindings.json
  site.css                            # copy of the --css source (handoff)
```

This makes each page folder portable and removes cross-page artifact clobbering.

## Centralized CSS input

The design is authored with **one centralized site CSS file** plus per-page HTML
and per-page JS (see [04-design.md](../04-design/04-design.md)). Pass that shared
CSS to the converter with `--css`; it is the cascade source the components bake
from, and a copy is dropped into the page folder as `site.css`. Because every
page bakes from the **same** CSS, shared components resolve to byte-identical
records across pages — which removes the cross-page collisions that per-page
`<style>` blocks caused.

## Usage

Recommended full-page section split:

```bash
python html_to_webflow.py --html "../05-design-revisions/.tmp/final-design/[page].html" \
  --css ../04-design/.tmp/final-design/site.css \
  --asset-base "<DEPLOYED_SITE_URL>" \
  --var-map .tmp/[page]/webflow-variable-map.json \
  --split .tmp/[page]
python wf_tools.py qa .tmp/[page]
```

> [!IMPORTANT]
> **Multi-page custom code: JS is per-page.** Each page's `<script>` goes in
> that page's Page Settings → before `</body>`. Head CSS may stay site-wide:
> rules are class-scoped and safe to concatenate (dedupe the `@import` and
> `body{overflow-x:hidden}` lines), or install per-page alongside the script —
> keep the font `@import` on every page either way.

The variable map lives per-page at `.tmp/<page>/webflow-variable-map.json`. Pass
it with `--var-map`; converter runs preserve any filled-in Webflow variable IDs
so binding manifests report `ready`. Seed a new page's map by copying a page
that already has the IDs filled in.

Then open each generated `.tmp/[page]/paste_*.html` page, click "Copy to
Webflow clipboard", and paste into one Webflow page in filename order.

Targeted section fallback:

```bash
python html_to_webflow.py --html "../05-design-revisions/.tmp/final-design/[page].html" \
  --root "section#home" \
  --css ../04-design/.tmp/final-design/site.css \
  --asset-base "<DEPLOYED_SITE_URL>" \
  --var-map .tmp/[page]/webflow-variable-map.json \
  --copy-page .tmp/paste_hero.html
```

The config-driven orchestrator `07-webflow-build.py` wraps these into one
command per project once `webflow-build.config.json` is filled in. See
[07-webflow-build.md](./07-webflow-build.md).

## Designer Caveats

- External images may show as gray placeholders in Designer but load on staging.
- Some decorative gradient texture strings may not render in Designer.
- Native `Navbar*`, `Dropdown*`, and Webflow `ix2` interactions are not emitted;
  use custom code or rebuild those pieces natively when required for handoff.

## Files

- [html_to_webflow.py](html_to_webflow.py) - converter, cascade resolver,
  combo-class handler, variable preservation, and JS artifact extraction.
- [html_to_webflow_wholepage.py](html_to_webflow_wholepage.py) - whole-page
  variant that merges every section slice into ONE paste payload (experimental;
  imports the core engine so it never drifts).
- [wf_tools.py](wf_tools.py) - diagnostics multitool: `qa` (section B checks),
  `collisions`, `inspect`, `expect`, `audit-diff`, and `compare` (design vs
  staging). Replaces ad-hoc scripts.
- [build_vocab.py](build_vocab.py) - shared-class vocabulary builder (multi-page
  canonical definitions; pass `--sources`).
- [gen_install_pages.py](gen_install_pages.py) /
  [gen_code_helpers.py](gen_code_helpers.py) - generate clipboard-helper pages
  for pasting custom code into Webflow's head/footer fields.
- [verify.mjs](verify.mjs) - token-light Playwright staging-vs-design diff
  (pulls the fingerprint JS from `wf_tools.py` so it never drifts).
- [TRIGGER_PROMPT.txt](TRIGGER_PROMPT.txt) - operational invocation prompt.
- [tests/test_html_to_webflow.py](tests/test_html_to_webflow.py) - converter
  regression tests (`python -m unittest discover -s tests`).
- [tests/sample_hero.html](tests/sample_hero.html) - minimal sample.
- `tests/fixtures/webflow_*.json` - Clipboard Inspector reference captures.

## Version Control

Follows [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Commit converter code,
workflow directives, tests, and lightweight `.tmp` reference/artifact files when
useful for review, replay, or handoff. Never commit secrets or binary/media
assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
