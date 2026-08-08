# Livewell Dental — Implants landing page, pasteable payload

**Generated**: 2026-07-29 · **Status**: payload pasted manually by the user (worked first try), then
**rebuilt headlessly via the Data API** on the real target page — see "API paste" below.

## API paste — built headlessly on the live page 2026-07-29

Target: **`ads-landing-pages/dental-implants-landing-page`** (page `6a6a07820a24301858160c48`,
created empty by the user). The entire page was constructed WITHOUT the browser via
`data_whtml_builder` — the first time this method was used in this engagement.

The method (now the template for API pastes):

1. **Serialize the XscpData payload back to HTML** — `.tmp/payload_to_whtml.py` writes
   `.tmp/page-implants/whtml/section_NN_*.html` + `embeds.json`. Serialize the **payload**,
   not the design source: the site's styles came from the manual paste and Webflow matches
   by name, so inserted HTML must carry the payload's post-conversion class STACKS
   (`imp-a-2 imp-btn imp-btn-gold`, sig-deduped content classes like `imp-hero-copy` on
   unrelated elements, dedup section classes like `imp-videos` covering why/doctor/office/faq).
   Serializing the source instead would mint new/forked styles site-wide.
2. **Insert the root** (`<div class="page_implants">`) into the body, then each of the 17
   sections with `data_whtml_builder` (append to root, ≤5 actions/call, single-root HTML per
   action, no `<style>`/`<script>` allowed). `details`/`summary` insert fine as native tags.
3. **HtmlEmbeds can't ride WHTML** — the serializer replaces each with a
   `<div data-embed-slot="N">` placeholder. After insertion: query placeholders by attribute,
   `data_element_builder` creates an HtmlEmbed (`set_style` with the embed's payload class)
   positioned `before` each placeholder, `data_element_settings_tool > set_settings key:"code"`
   writes the embed HTML (byte-identical to the payload's `v`), then remove the placeholders.
4. **Bind images** — WHTML's URL→asset lookup missed all 20 CDN URLs ("does not exist in
   asset library"), so every `<img>` inserted unmanaged, exactly like a clipboard paste.
   Bound all 20 with `set_image_asset` (altText join, batches of 3–4; two 429 waves, ~70s
   backoff each, failed actions retried verbatim).

Verified after the build: **0 style forks** (the imp-* style list is byte-identical to the
pre-insert query; all " 2" styles on the site pre-date this work), root has exactly **17
children in source order**, 9 embeds carry their code, 20/20 images managed.

Gotchas specific to this path:

- The WHTML Cloudflare worker threw a **transient 1101** ("do not retry") on the header
  insert; every sub-piece then passed individually and the identical retry succeeded.
  Treat 1101 as retryable once despite the error text.
- The MCP token **cannot publish** (`publish_site` → 403 insufficient_permissions).
  Publish to staging from the Designer, then verify on a focused tab.
- Designer sessions cache aggressively — reload the Designer to see headless changes.

**Not yet visually verified** — nobody has seen this page render (publish is blocked for
the token). Before handoff: publish to staging, then run checks E.1–E.8 of the method
directive on a focused tab (slider, form swap, FAQ toggles, sticky header/form card).

## Recolored to the brand palette — 2026-07-29

On Brandklout's request the page was remapped from the client file's forest-green/gold
art direction to the site's brand tokens: navy `#0b2c41`, deep navy `#071e2d`, gold
`#d3aa5a`, bone `#f6f3ee`, pale navy tint `#e3edf1`, ink `#101820` (full map in
`prep_source_implants.py` § PALETTE_HEX/PALETTE_RGBA; salmon ✕ marks kept).

- **Artifacts**: remap lives in the prep script, so source + payload + whtml serialization
  all regenerated on-brand (QA re-passed, behaviours re-verified, zero old colors left).
- **Live page**: patched headlessly — **79 `update_style` actions** (computed by diffing
  old vs new payload styleLess per class/breakpoint/pseudo, combos addressed via
  `parent_style_names`) plus **4 embed code rewrites** (hero video, form, iframe, ceramist
  video). Verified: `query_styles` sweep for all seven old palette values returns **0
  matches site-wide**. Styles are site-wide, so the manual-paste page recolored too.

### Dark-on-dark bug found and fixed while recoloring

`.journey .sub` / `.final .sub` recolor the sub paragraph via a CONTEXT rule
(`#B9CCC1` light-on-dark). **The converter drops a context override of a property that a
thin class record in the stack already declares** (residual coverage is by property name),
so both paragraphs rendered muted-dark on the dark navy band on BOTH pasted pages — the
data-level QA never sees it. Fixed twice:

- **Artifacts**: the two paragraphs now carry an explicit `sub-light` modifier
  (`.sub-light{color:#b6c8d3}`) so the light color rides a real combo record.
- **Live page**: `update_style` set `color:#b6c8d3` on the `.imp-p-3.imp-sub` and
  `.imp-p-7.imp-sub` combos directly.

Same mechanism, smaller impact, accepted as-is: the price-tag eyebrow's inline
`color:var(--green-dk)` override is also dropped, so it renders brand gold instead of a
dark override — on-brand, left alone.

## Slider drag — root-caused 2026-07-29: API-created script embeds don't run in preview

The reported "photo slider drag does not work" (preview WITH custom-code compilation,
while the cosmetic page's `section_csm-hero` compare works in the same context):

- The built structure is correct — proven with a local replica of the published DOM
  driven by **real CDP mouse events** (hit test lands on `#ba-range`, drag moves
  50→81, clip/divider/knob follow, zero JS errors), and by diffing every
  slider-critical live style and reading back both embed codes (verbatim).
- The differentiator: the cosmetic page's script embeds arrived via **clipboard paste**,
  whose payload marks them `embed.meta.script: true`. The implants embeds were created
  via `data_element_builder` + `set_settings code`, which exposes only
  domId/visibility/code — **the internal script flag cannot be set through the Data API**,
  and without it the embed's `<script>` is not executed by preview code compilation.
- **Fix**: the two behaviours are additionally installed as a **registered page script**
  — `implantslandingbehaviours` v1.0.0 (`register_inline_script` + `set_page_scripts`,
  footer). This is the official custom-code path: it loads in preview compilation and on
  the published site. Both IIFEs are double-init guarded, so if the embed copies also
  execute on publish, whichever runs first wins and nothing double-binds.
- Two dead ends worth remembering: `set_page_freeform_code` returns **HTTP 406 for any
  content containing a `<script>` tag** (WAF-style filter — even
  `<script>console.log(1)</script>`), and `add_page_script` 404s ("Custom code block not
  found") when the page has no code block yet — use `set_page_scripts` (direct PUT).

Still to do: **publish to staging and verify on a focused tab.**

---

**Payload history**: generated, QA-passed and behaviour-verified 2026-07-29; pasted manually by the user (clean)

## What this is

A **straight conversion** of the client-sent `livewell-implants-landing (1).html`
(the newer of the two implants files in `04-design/.tmp/final-design/`; the
sibling `livewell-dental-implants-landing.html` was NOT converted). Unlike the
cosmetic page — which was rebuilt from scratch onto the Livewell design system —
this page was converted **as sent**, per instruction: Archivo + Inter type,
forest-green `#0F3D2E` / gold `#C79A3C` palette, the client's own structure.
See open item 1 before pasting.

The file arrived with bare generic class names (`btn`, `card`, `wrap`, `hero`,
`a`, …), one page-level `<script>`, CSS step counters, and `summary::after`
content toggles — none of which survive the clipboard format or a paste into
the live site (Webflow merges classes **by name, site-wide**). All of that is
normalized by `.tmp/prep_source_implants.py`:

| Prep transformation | Why |
|:---|:---|
| Every class prefixed `imp-` (markup + selectors) | a class literally named `btn`/`card` would merge with the live site's own classes |
| Single `.page_implants` root wrapper | one-paste single-root payload (multi-root is what crashes the Designer) |
| Page script split into per-section `<script data-embed>` IIFEs (lead form → hero, before/after slider → journey), each double-init guarded | sections must be self-contained and movable |
| Google Fonts `@import` as a `<style data-embed>` in the hero | Archivo/Inter are NOT the site fonts and are not installed in the project; this makes the paste self-hosting |
| `.step h3::before{content:counter(step)}` → explicit `.stepnum` spans (1/2/3) | `counter()` content cannot be extracted to a materialized pseudo div |
| `summary::after` +/− content toggle → explicit `.fmark-open`/`.fmark-close` spans + a FAQ `<style data-embed>` with `details[open][open]` display rules | state-dependent `content` cannot ride; `details`/`summary` themselves paste natively with the real tag, so the browser toggle works |
| `<s>` → `.strike` span, `<small>` → `.price-unit` span | neither tag is in the converter's native map; both would become needless HtmlEmbeds |
| Unclassed / inline-styled sections given real classes (`videos`, `gallery`, `why`, `options`, `doctor`, `story`, `office`, `how`, `faq`, …) | Designer-friendly names instead of `imp-div-7` residuals |
| Stripped: prefers-reduced-motion block, `html{scroll-behavior}` (re-applied via JS), unused `.compare s`, `summary::-webkit-details-marker` | rules with no attachable element force head CSS |

## The payload

`.tmp/page-implants/paste_01_page_implants.html` — **ONE paste, 581 nodes, 154 styles.**

| Artifact | What it is |
|:---|:---|
| `paste_01_page_implants.html` | The clipboard copy page. This is the deliverable. |
| `source.html` | Converter input. Regenerate with `python .tmp/prep_source_implants.py`. |
| `webflow-asset-map.json` | The 20 `<img>` elements mapped to their **existing** Livewell asset IDs (parsed from the CDN filename prefix). All 20 alt texts are unique — binding is unambiguous. |
| `webflow-runtime-states.css` | **Redundant — discard.** The `@import` rides in the hero style embed and the body base (Inter, ink color, white bg, line-height) is baked onto the `page_implants` root class. |
| `animation-manifest.json` | 14 ids the embeds query (`ba*`, `lead-form`, `f-*`, `form-view`, `thanks-view`, `book`, `top`) — all present in the payload (QA check 3 = 0 missing). |

There is **no `webflow-custom-code.js`** and **no head CSS requirement** —
nothing goes in Site Settings or Page Settings. The paste is fully self-contained.

## Regenerate

```bash
cd deliver/brandklout/livewell-dental/workflows/07-webflow-build
python .tmp/prep_source_implants.py
python html_to_webflow.py --html ".tmp/page-implants/source.html" \
  --page-prefix imp --split .tmp/page-implants
python wf_tools.py qa .tmp/page-implants --against .tmp/page-veneers,.tmp/page-cosmetic
```

`--page-prefix imp` is **not optional** (residual auto-names must not ship as
bare `p`/`div`). `--avoid` is unnecessary here: the prep's whole-vocabulary
`imp-` prefix already makes every class name page-unique by construction.

## Verified before handoff

| Check | Result |
|:---|:---|
| `wf_tools.py qa --against page-veneers,page-cosmetic` | ALL CHECKS PASSED (escapes 0, conflicts 0, missing JS hooks 0, blocked stickies 0, form embed 2,484 chars OK, cross-page collisions 0) |
| Root count | **1** (`.page_implants`) |
| Bare tag-named classes | **0** · every class `imp-*` (or the root) |
| Class names with >1 distinct definition | **0** — nothing can fork to `-2` |
| Embeds | 9 = fonts style, FAQ-state style, hero script, journey script, lead `<form>`, slider range `<input>`, hero `<video>`, testimonial `<iframe>`, ceramist `<video>` — largest 2,484 chars, all far under 10k |
| Head CSS / Page Settings code required | **none** |

Behaviour verified headlessly on the prepped source with motion enabled
(`04-design/.tmp/behave-implants.mjs`, Chrome CDP): the before/after slider
drives clip-path/divider/knob to 80% on input; the lead form blocks an empty
submit (focus guard holds) and swaps to the thanks view when filled; all 6 FAQ
`details` toggle natively with the +/− marks swapping and the answer showing;
step numbers render 1-2-3; both stickies (header, form card) have **no
overflow ancestor**; **zero JS errors**.

```bash
cd deliver/brandklout/livewell-dental/workflows/04-design/.tmp
node behave-implants.mjs "file:///<abs>/07-webflow-build/.tmp/page-implants/source.html" 8000
```

Visual: `scratchpad/implants-source-1440.png` matched the authored design
(step circles, FAQ marks, strike-through competitor price all intact).

## Paste procedure

1. **Throwaway page first.** Paste onto a scratch page; confirm no `-2` classes
   appeared, the 9 embeds render, layout is right. Then paste onto the real page.
2. Create/open the target page (**slug unconfirmed**, open item 4). This is a
   stand-alone ad landing page carrying its own header/footer/sticky-bar — no
   site nav/footer components needed around it.
3. Paste `paste_01_page_implants.html` **once** onto the page body.
4. Bind the 20 images to their existing assets via `data_element_tool >
   set_image_asset` using `webflow-asset-map.json` (join key = altText, all
   unique). Batch **3–4 actions per call** — larger batches 429 partway; failed
   actions retry verbatim. Do **not** upload anything: all 20 already exist as
   site assets.
5. Publish to staging; verify on a **focused tab** (background tabs freeze
   timers/rAF). Post-paste, diff load-bearing styles against the payload via
   `data_style_tool > query_styles` — Webflow has silently dropped base-breakpoint
   `height` declarations before (veneers, 2026-07-28). Load-bearing here:
   `imp-form-card{position:sticky;top:90px}`, `imp-ba` aspect/overflow, header sticky.

### Gotchas that have bitten this toolchain before

- Do **not** read the payload with PowerShell `Get-Content` — it corrupts UTF-8
  glyphs. Use `[IO.File]::ReadAllText(path, [Text.Encoding]::UTF8)`.
- Keep the Designer at 100% zoom (`Ctrl+0`); re-copy fresh on a paste miss; the
  copy click must be a standalone action.
- Designer may show external images as grey placeholders; they load on staging.
- Never re-paste over a Designer-edited page — patch via the Data API instead.

## Open items

1. **Design-system divergence — needs a Brandklout call.** This page keeps the
   client's own art direction (Archivo/Inter, forest green) while the veneers and
   cosmetic pages use the Livewell system (Marcellus/Lato, navy/gold/teal). The
   cosmetic precedent was a from-scratch rebuild; this one was converted as sent.
   If Brandklout wants it re-staged on the brand system, that is a 04-design
   rebuild, not a converter change.
2. **The lead form does not deliver leads yet.** Its submit handler only swaps in
   the thanks panel (TODO comment inside the hero script embed). Before launch,
   POST to a real endpoint (CRM/Zapier) or replace the embed with a native
   Webflow Form so submissions land in the Forms panel.
3. **`noindex` must be set in Webflow Page Settings.** The source's
   `<meta name="robots" content="noindex, follow">` (ad page, out of organic
   search) does not ride the paste.
4. **Target slug unconfirmed.** Reads as a paid-traffic page for implants;
   confirm placement before pasting.
5. **Breakpoint bucketing.** Source media widths 940/580 bucket to Webflow
   medium (991) and tiny (479). Net effect: the 480–580 band renders the 2-col
   tablet layout where the source had 1-col. Accepted as within tolerance.
6. **Copy claims carried from the client's file** ("320+ five-star reviews",
   $1,900–$2,800 pricing, hours) — confirm still accurate before launch.
7. The Vimeo testimonial iframe and the two `<video>` elements ride as embeds
   pointing at the live CDN — they play on staging but are not Asset-panel
   managed (nothing to bind; only `<img>` elements take `set_image_asset`).

## Version Control

Follows [SYSTEM_RULES.md - Section 4](../../../../../../SYSTEM_RULES.md). The
payload, source, prep script and manifests are lightweight `.tmp/` artifacts
committed for continuity.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
