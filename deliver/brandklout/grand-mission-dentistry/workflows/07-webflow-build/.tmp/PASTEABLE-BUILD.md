# Grand Mission — pasteable-component build (state of record)

Built 2026-08-07 to `deliver/process/07-webflow-build/PASTEABLE-COMPONENTS.md`
(the manual-paste standard; supersedes the headless embed build that is
currently live on staging). Site `698111847e9608eb30ee21c6` · pages
implant-ai `6a724b6977f9b0019d2a03f8`, cosmetic-ai `6a723ad5534774f35f17d119`,
thank-u-landing-ai `6a7268a862a728c1cd4df73b`. **Nothing has been pasted or
published — these are the artifacts, gated and ready.**

## What to paste

27 components under `.tmp/components/<page>/` — one folder per component with
`final.json` + `PASTE.html` + `README.md`, plus a `PASTE-QUEUE.md` per page:

| Page | Components | Queue |
| :--- | :--- | :--- |
| implant | shell + 8 sections + footer (10) | `.tmp/components/implant/PASTE-QUEUE.md` |
| cosmetic | shell + 7 sections + footer (9) | `.tmp/components/cosmetic/PASTE-QUEUE.md` |
| thank-you | shell + 6 sections + footer (8) | `.tmp/components/thank-you/PASTE-QUEUE.md` |

One-paste alternative per page: `.tmp/<page>/PASTE-full-page.html`
(single-root whole page, 680/457/310 nodes).

## Shared page-level layer (identical ×3, installed once per page)

`.tmp/_shared-install/head.html` (14,968 chars: 5 GSAP 3.13 CDN tags → WZ
bootstrap → runtime-states CSS union) and `footer.html` (14,499 chars:
register + ScrollSmoother.create + WZ.flush + the selector-driven kit).
**Install over the Data API (`data_scripts_tool`, 50k/block)** — both blocks
exceed the page-settings UI's 10k validation on purpose. Site-wide custom
code stays FORBIDDEN, and a second copy of the footer kills every trigger.
Textarea copy-pages also live at `.tmp/<page>/install-head|footer.html`
(simulator input + human fallback).

## Gates — all green 2026-08-07

- `simulate_paste.mjs` per whole page: **10/10, 10/10, 10/10** (3 checks
  N/A: carousel/wipe/drawer components this design does not have).
- `gate_components.mjs`: **27/27** — 1 root each, style closure complete,
  0 relative asset refs, every embed < 10k (max 8,451 = the implant quiz).
- Local design verify (`04-design/.tmp/verify.mjs`) after the re-authoring:
  **3/3 pages clean** (incl. scrub proofs at 25/50/75% and the
  reduced-motion pass).
- Assets: all 31 already in the site library (`.tmp/asset-map.json` from the
  previous session); `gm_rebind.mjs` bound 31 Image refs + 6 xattr
  (`data-icon`) + 48 embed-markup refs (`src`/`data-lightbox`); 0 relative
  refs remain.
- CSS functions left in styleLess: 10/11/7 per page — all `.shell`-family
  `min(1280px, 100% - 2*gutter)` widths with no px equivalent at any band
  (the style panel reads 0 for them; canvas and published page render
  correctly — same accepted leftover class as Dr. Nahlah).

## Fonts — the one manual prerequisite

Enable **Montserrat** (400-800) and **Great Vibes** in Site Settings → Fonts
BEFORE pasting. Not verifiable headlessly (`data_fonts_tool` covers uploaded
custom fonts only). The head block's `body{font-family}` + `@import` soften a
miss, but pasted class-level `font-family` still strips for unregistered
families.

## How this build was produced (re-runnable)

```bash
# 04-design/.tmp — re-authoring (idempotent; edit index.src.html/_embeds/_shared)
node _shared/rename-collisions.mjs      # 9 live-site class collisions -> gm-*
node _shared/rename-page-specific.mjs   # 6 same-name-different-def classes -> imp-/cos-/ty-
node _shared/retool.mjs                 # bootstrap head, runtime footer, main#top, embeds
node verify.mjs                         # behaviour gate (must stay 3/3)

# 07-webflow-build
#  combined css = assets/kit.css + styles.css  ->  .tmp/_css/<page>.css
node expand_type_tier.mjs .tmp/_css/<p>.css .tmp/_css/<p>.tier.css
python html_to_webflow_wholepage.py --html <design>/index.html --css .tmp/_css/<p>.tier.css \
       --wrap --wrap-class <pfx>-page --page-prefix <pfx> --out .tmp/_raw/<p>          # raw ×3
python build_vocab.py --sources .tmp/build-sources.json --raw-dir .tmp/_raw \
       --out .tmp/style-vocabulary.json                                                # 55 shared, 0 pending
python html_to_webflow_wholepage.py ... --vocab .tmp/style-vocabulary.json --out .tmp/<p>  # final ×3
node resolve_wholepage.mjs .tmp/<p>/paste_00_full-page.html .tmp/<p>/resolved
node gm_rebind.mjs .tmp/<p>/resolved.json .tmp/asset-map.json .tmp/<p>/final.json
node gen_shared_install.mjs
EMIT_SHELL=1 node ../../../../process/07-webflow-build/extract_section_components.mjs \
       .tmp/<p> <p> .tmp/components
python ../../../../process/07-webflow-build/make_paste_page.py --payload ... --out ...PASTE.html
node gate_components.mjs .tmp/components
node gen_paste_docs.mjs .tmp/components
node simulate_paste.mjs .tmp/<p>/final.json .tmp/<p> ../04-design/.tmp/<page>/assets
```

## What this build fixed on the way (all in this folder's tooling)

1. **Runtime-states CSS was empty for linked stylesheets** — the converter
   extracted state CSS from inline `<style>` only; `write_text_artifacts` now
   takes the external CSS. Without it every JS-toggled class pastes empty.
2. **Shared-kit designs over-collected state CSS** (thank-you artifact hit
   21k): an unknown-class rule now ships only when the page's JS mentions the
   class in a string literal (dotted selector or whole literal).
3. **The type tier was invisible to conversion** — fluid root (12→16→18→20px)
   × `--tx` (0.8292 ≥1024px) × the `--d1`/`--h2` media staircase all expand
   at base values, so every band got the 1440 value (tablet hero 100.8px vs
   the design's 70.4px). `expand_type_tier.mjs` evaluates every base-rule
   font-size at the 7 band widths (validated exact against the live design at
   all six probe widths) and emits canonical media overrides pre-conversion.
   Known residual: small rem paddings drift ±14% at phone bands (root curve);
   `--section`/`--gutter` spacing is vw-clamp and resolves exactly.
4. **Materialized pseudo divs inside `<p>` are invalid HTML** — the parser
   auto-closes the paragraph, publishing empty eyebrows. `_make_pseudo` now
   emits `<span>` for paragraph/inline hosts.
5. **CSS counters cannot convert** (`content: counter()`): the implant
   reasons' 01-06 numbers moved into the markup (`.reason__n`).
6. **9 class names collided with the live 303-page site** (`header`, `card`,
   `step`...) → renamed `gm-*` at source; 6 shared-by-name classes with real
   per-page value differences → `imp-/cos-/ty-` prefixes; vocabulary now
   resolves 55 canonical shared classes with 0 pending.
7. **simulate_paste.mjs is now faithful to Webflow's embed rendering**
   (`div.w-embed` wrappers — which the `.wz-js{display:none}` class
   neutralises for script-only embeds) and supports both nav shapes, expected-
   hidden content, and empty-src stage images.

## After pasting

Patch content over the Data API MCP only (`set_text`, `set_image_asset`,
`set_attributes`) — never re-paste for a typo. Publish to STAGING only
(GHL endpoint still null; forms log to console by design). Then
`parity.mjs` + `deliver/brandklout/scripts/staging-verify.mjs`.

## Version Control
Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
