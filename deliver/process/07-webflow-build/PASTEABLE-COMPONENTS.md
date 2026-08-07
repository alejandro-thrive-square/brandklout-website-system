# Pasteable components — the manual-paste build standard

**Status: the house standard for putting designed pages into Webflow** (user
decision 2026-08-07). Headless builds (verbatim-embed and `whtml_builder`
element builds) produced local-vs-Webflow discrepancies and layout regressions
when patched, and their custom code sits in page settings where it blocks
moving sections around. The reference for "done right" is the **Dr. Nahlah
site** (`6a6b84cc7fe55ddeabc0b314`) — inspect it over the Webflow MCP and in
`deliver/brandklout/dr-nahlah/workflows/07-webflow-build/.tmp/` (in `main`'s
working tree; the folder is untracked, so use the absolute path from a
worktree).

## The pipeline (end to end)

1. **Scrape** every reference the team or client has (assets download, not URL
   lists — see `feedback_scrape_means_download_assets`).
2. **Structure** from the references: the sections, their order, functionality.
3. **Design** to the awwwards bar: named chapters, scroll-driven pins, an
   interactive journey — not animated colour bands.
4. **Review** locally until good (interaction tests, not screenshots).
5. **Build the pasteable components** for Webflow, with the right indications
   (this document).
6. **Paste via the Claude Chrome extension** (or by hand): components paste
   into the Designer to create/rebuild pages. Paste is manual on purpose —
   it is Webflow's own native format and the only lossless route.
7. **Publish to staging** and verify live-vs-local: screenshots per
   breakpoint, computed-style parity, scrub proofs (`parity.mjs`,
   `staging-verify.mjs`). Same output or it is not done.

After the paste, changes are made surgically over the Data API MCP
(`set_text`, `set_image_asset`, `set_attributes`) — never by rebuilding
sections headlessly.

## What a component is

One **top-level section** of a page, shipped as a single-root Webflow
clipboard payload (`@webflow/XscpData`):

- **Single root, always.** Multi-root payloads crash the Designer.
- **The section's behaviour rides INSIDE it** as its own HtmlEmbed
  (`<script>WZ.add(function(W){ ... })</script>`), never in page-settings
  custom code. That is what makes a section movable, reorderable, and
  pasteable onto another page without breaking. Manual-paste embeds must stay
  **under 10,000 characters** (the API accepts 50k, the Designer does not).
- **Style records are verbatim** from the page conversion. Webflow merges
  pasted classes by NAME when the definition is identical; any hand-edited
  definition forks a `-2` twin. Regenerate, never hand-tune a payload.
- Real Webflow elements throughout (Section/Heading/Paragraph/Link/Image),
  so everything stays client-editable. Element ids survive the clipboard,
  which is what keeps the section JS working.

Two layers of shared code sit OUTSIDE components, installed **once per site**:

- **Site head**: GSAP CDN tags (all plugins free since 3.13) → the `WZ`
  bootstrap (must be in the head — embeds call `WZ.add` mid-parse) → the
  runtime-states CSS (state classes the clipboard cannot carry).
- **Site footer**: `gsap.registerPlugin(...)`, `ScrollSmoother.create()`,
  `WZ.flush()`, nav/drawer wiring. Register in the footer or ScrollSmoother
  silently dies; and never install a second copy at page level — a duplicate
  `ScrollSmoother.create()` kills every trigger (Dr. Nahlah defect 6).
- A page-generic, selector-driven kit (`[data-rv]` reveals, counters,
  `.pk-ba` sliders) may ride at page level or in the page-shell component;
  it must be identical across pages and idempotent.

## Producing components

```bash
# 1. Whole-page conversion (per page; --vocab for cross-page class sharing)
python html_to_webflow_wholepage.py --html <design>/index.html --css <design>/styles.css \
       --wrap --page-prefix <pfx> --out .tmp/<page>
# 2. Resolve clamp()/fluid type into per-breakpoint style variants
#    (webflow-clientfirst resolve_fluid + resolve_wholepage.mjs — see the
#    Dr. Nahlah 07-webflow-build for the working copies; Webflow's ladder is
#    large=1280, xl=1440, xxl=1920, and bands evaluate at their MIDPOINT)
# 3. Upload + rebind assets (upload_assets.mjs / rebind_assets.mjs) so every
#    image has a CDN hostedUrl AND data.img.id AND a payload.assets[] entry
# 4. Split into per-section components
node extract_section_components.mjs .tmp/<page> <page-slug> .tmp/components
# 5. One paste page per component (execCommand/application-json mechanism —
#    do NOT hand-roll; navigator.clipboard cannot set the MIME Webflow reads)
python make_paste_page.py --payload .tmp/components/<page>/<nn>-<id>/final.json \
                          --out .tmp/components/<page>/<nn>-<id>/PASTE.html
```

If the design keeps its JS in shared files (`app.js` / `page.js`), it must be
**re-authored into per-section `WZ.add` embeds** placed inside each section
before conversion — that is design work, not converter work. Only the
page-generic kit and the bootstrap stay shared. Dr. Nahlah's
`04-design/.tmp/site-src/pages/home.body.html` is the model.

`EMIT_SHELL=1` on the extractor also emits a `00-page-shell` component (nav +
drawer + smooth wrapper + empty `<main>` + footer) — paste it first on a NEW
page, then paste sections into `main#top` in order.

## The indications that ship with every component

Each component folder carries `final.json` + `PASTE.html` + a README stating:

- what it is (section id, chapter name, page, position N of M);
- prerequisites: site head/footer blocks installed, fonts enabled in Site
  Settings **before** pasting (Webflow silently strips `font-family` for
  unregistered families);
- paste steps: open `PASTE.html` in the same browser as the Designer, click
  Copy (a real user gesture is required), select the target parent in the
  Navigator, `Ctrl+V` once at 100% zoom (`Ctrl+0`); re-copy fresh on a miss;
- what to do after: ask the agent to patch content over the MCP — never
  re-paste to fix a typo.

## Lessons from the Mason Park build (2026-08-07)

- **The queue namespace is per-project** (`WZ.add` on Dr. Nahlah, `MPD.add` on
  Mason Park — same pattern); the extractor detects both.
- **A theme-varying `var()` on a SHARED class forks the class.** The resolver
  bakes `var()` per element, so `.lead{color:var(--fg-body)}` under
  `[data-theme="dark"]` emits a second record under the same name — and
  Webflow's merge-by-name keeps only one (`wf_tools qa` check 2 catches it).
  Fix at the design source: concrete value on the shared class + an explicit
  `[data-theme="dark"] .lead{...}` descendant override, which the converter
  banks on the per-element content class. Same computed values either way.
- **Token-ladder designs need a bake pass.** A design that steps type by
  overriding `:root` tokens inside media queries loses the WHOLE ladder in
  conversion (`var()` resolves once, at the base). Mason Park's
  `bake_display_ladder.mjs` is the model: 991/767 rungs become real
  medium/small variants, the 1439 rung and the <=478 reading tier are emitted
  for the site head (selector lists with combo chains resolved, boosted one
  class level so they win on specificity regardless of stylesheet order, the
  1439 rung band-bounded with `min-width:992px` so it cannot override the real
  breakpoint variants). It also strips the converter's re-hang of <=478 rules
  onto tiny (<=479) — that re-hang IS the 479/480 root-seam bug.
- **Section `data-chapter-name`/`data-theme` ride in `data.xattr`**, not
  `data.attr` — the extractor reads both and records the theme per component.
- **Structural gate**: `check_components.mjs` (1 root, closure complete,
  embeds <10k, 0 relative refs incl. inside embed html, images CDN-bound,
  paste pages round-trip) — run it on every extraction.

## Gates

- `simulate_paste.mjs` on the payload before anyone pastes — a payload can
  pass every static gate and still be dead on interaction.
- After paste: style-guide diff (no overwritten classes), style panel shows
  real numbers (a `0` font size means a CSS function survived), scrub on a
  **focused** tab.
- After publish: `parity.mjs` (computed-style diff local vs live) and
  `staging-verify.mjs` (pins discovered from the live ScrollTrigger registry,
  3 distinct states at 25/50/75%, zero 404s/console errors).

## Version Control

Follows the root-level version control rules in
[SYSTEM_RULES.md — Section 4](../../../SYSTEM_RULES.md). Update this file
whenever the component pipeline changes (Documentation Integrity Rule).
