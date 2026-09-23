# Livewell Dental — Cosmetic dentistry landing page, pasteable payload

**Generated**: 2026-07-28 · **Status**: regenerated, QA-passed and behaviour-verified, **not yet pasted**

## What this is

The client sent `livewell-cosmetic-dentistry-landing.html` built on an unrelated palette
(forest green / wine red / sand, Fraunces serif) with a flat section stack. It was
**rebuilt from scratch**, not restyled: brand tokens, component structure, motion and
copy discipline now match the Livewell system established by the home package and
`page-no-prep-veneers`.

| | Client's file | This build |
|:---|:---|:---|
| Palette | forest `#2C4438` / wine `#8C3B40` / sand | navy `#0b2c41` / gold `#d3aa5a` / teal `#376b7b` / bone `#f6f3ee` |
| Type | Fraunces + Inter | Marcellus + Lato (the site's own brand fonts) |
| Structure | flat sections, no roots | `section_csm-*` roots, BEM `__` parts, `is--` modifiers |
| Packaging | one page-level `<script>` | two HtmlEmbeds per section (style + script), self-contained |
| Motion | one slider, one accordion | 3 signature sections + 3 supporting behaviours |
| Non-native tags | `button` ×5, `cite` ×1, `form` ×1, inline SVG ×14 | `form` ×1 only |
| Em dashes in copy | throughout | zero |

This is a **stand-alone conversion landing page**: it carries its own review bar, sticky
header, footer and mobile CTA rail, so unlike `page-no-prep-veneers.html` there is no
site-wide nav/footer held outside the root. Only a preview reset sits outside.

## Section map

| # | Root | What it is |
|:--|:---|:---|
| 1 | `csm-bar` | Review + phone bar |
| 2 | `csm-head` | Sticky header, logo + phone + CTA |
| 3 | `section_csm-hero` | Dark hero: masked word roll-up H1, chips, dual CTA, drag-to-compare before/after with keyboard support |
| 4 | `section_csm-marks` | Credential logo marquee (the client's own AAD / FAG / GKC / ICOI / IACI assets) |
| 5 | `section_csm-stakes` | The hesitation: pull-quote + four numbered cards |
| 6 | `section_csm-collection` | **Signature.** Smile Collection scope selector driving a real upper arch |
| 7 | `section_csm-gallery` | **Signature.** Draggable case marquee |
| 8 | `section_csm-process` | **Signature.** Three steps with a scroll progress line against a sticky aside |
| 9 | `section_csm-guide` | Meet Dr. Chris + four credential rows |
| 10 | `section_csm-words` | Dark band, oversized drifting type backdrop, quote + three facts |
| 11 | `section_csm-faq` | Five-item single-open accordion |
| 12 | `section_csm-cta` | Closing CTA + lead form |
| 13 | `csm-foot` | Footer + results-vary disclaimer |
| 14 | `csm-rail` | Mobile sticky CTA rail |

### The signature section

`section_csm-collection` turns the offer names into something legible. Selecting a scope
lights exactly those teeth on a ten-tooth upper arch: Perfect 1 lights the central,
Magic 4 lights the four front teeth, Social 10 lights all ten, and the verdict line and
CTA label swap with it. The arch is built from **native Blocks, not an SVG**, so it stays
Designer-editable and adds no embed. On first view it cycles once to teach the
interaction, then stops permanently the moment the visitor selects anything. The default
markup state is Magic 4 lit, so the section is fully legible with JS off.

> [!IMPORTANT]
> The arch is a **scope diagram, not a diagnosis**, and the section says so in-page.
> Do not add clinical claims to it without Dr. Chris.

## The payload

`.tmp/page-cosmetic/paste_01_page_cosmetic.html` — **ONE paste, 539 nodes, 187 styles.**

| Artifact | What it is |
|:---|:---|
| `paste_01_page_cosmetic.html` | The clipboard copy page. This is the deliverable. |
| `source.html` | Converter input: the 04-design package with the preview reset stripped. Regenerate with `python .tmp/prep_source_cosmetic.py`. |
| `webflow-runtime-states.css` | **Only a Google Fonts `@import`.** See "Fonts" below. |
| `webflow-variable-*.json` | Optional post-paste variable binding, not required to render. |
| `animation-manifest.json` | Inventory of the JS behaviours carried in the section embeds. |
| `webflow-asset-map.json` | The 16 referenced images mapped to their **existing** Livewell asset IDs. |

## Assets — already on the site, do NOT re-upload

Every image the package references is already an asset in the Livewell Webflow project.
Verified 2026-07-28 against site `69d03fdbe999e9907724a69d` with `data_assets_tool >
get_asset`: **16 of 16 exist, zero missing.**

Webflow CDN URLs embed the asset ID as the filename prefix — `/{siteId}/{assetId}_{name}` —
so an asset can be confirmed directly from the markup without paginating the site's 1,622
assets. That is how `webflow-asset-map.json` was built.

> [!WARNING]
> Do **not** run `asset_tool > upload_image_by_url` for these. It would create 16 duplicate
> assets in a live client's library, and there is no bulk-delete. Re-upload only applies to
> images that are genuinely new to the site.

**Open gap: all 16 assets have `altText: null` on the site**, while the design package
carries proper alt text for every one (`altTextInDesign` in the map). Setting it via
`data_assets_tool > update_asset` is a cheap accessibility and SEO win, but it is a mutating
write on a live site and needs explicit confirmation first. (Element-level alt text is
already set on the page and is unaffected by this.)

### Binding the pasted images to those assets — DONE 2026-07-28

Page: **`cosmetic-dentistry-2`** (`6a6856e29d14cd95a2d88fa6`), the pasted payload
(`page_cosmetic` root, 278 `csm-*` elements).

A pasted image arrives with **`assetId: null`** — it is an unmanaged `<img>` pointing at an
external URL, so it gets no Webflow responsive variants, no asset-panel link, and no
alt-inheritance. All 15 image elements on the page were bound to their existing assets with
`data_element_tool > set_image_asset`, then each was re-read to confirm `assetId` persisted.
**15 of 15 verified.** Element alt text survived the binding unchanged.

Three things to know before repeating this on another page:

1. **The Data API does not expose an image's `src`.** `get_attributes name:"src"` returns
   null (it is an intrinsic setting, not an xattr) and `get_settings` exposes only
   `assetId` / `altText` / `domId` / `visibility` / `attributes`. So after a paste there is
   no way to read back which file an image points at — the only reliable join key is
   **altText**. Author unique, descriptive alt text per image in the design package and this
   mapping stays mechanical. Where alt text legitimately repeats (three gallery cards share
   one), document order holds, and neighbouring uniquely-identified images pin it.
2. **Rate limits bite.** `set_image_asset` performs an internal `GET /v2/assets` per call, so
   a 15-action batch returned 429 after the 7th. Batch **3 to 4 actions per call**; the same
   limit hit `GET /v2/pages` while verifying. Failed actions are safe to retry as-is.
3. **The header logo image is not on the page** (15 image elements, not the payload's 16),
   consistent with the header having been swapped for the site's own nav during Designer
   edits. Nothing to bind there.

> [!NOTE]
> Do this **on the live page via MCP, not by re-pasting.** Once the page has been edited in
> the Designer, re-pasting a regenerated payload discards those edits. Two classes also
> forked on the original paste (`page_cosmetic 2`, `csm-img 2`), which is a separate cleanup.

There is **no `webflow-custom-code.js`** — nothing goes in Page Settings.

## Regenerate

```bash
cd deliver/brandklout/livewell-dental/workflows/07-webflow-build
python .tmp/prep_source_cosmetic.py
python html_to_webflow.py --html ".tmp/page-cosmetic/source.html" \
  --page-prefix csm --split .tmp/page-cosmetic
python wf_tools.py qa .tmp/page-cosmetic --against .tmp/page-veneers
```

`--page-prefix csm` is **not optional**. Without it the payload ships classes named
literally `p`, `div`, `span`, and Webflow merges classes by name site-wide, so they
collide with Livewell's existing Relume-derived classes.

## Verified before handoff

| Check | Result |
|:---|:---|
| `wf_tools.py qa` | ALL CHECKS PASSED |
| Cross-page collisions vs `page-veneers` | **0** |
| Root count | **1** (`.page_cosmetic`) |
| Class names with >1 distinct definition | **0** — nothing can fork to `-2` |
| Bare tag-named classes | **0** |
| Shared `lw-*` atoms vs veneers | **9 of 9 byte-identical** (`lw-btn`, `lw-btn--gold`, `lw-btn--ghost`, `lw-btn--ghost-light`, `lw-ar`, `lw-eyebrow`, `lw-eyebrow-before`, `lw-sec`, `lw-shell`) |
| Section embeds | 21 = 10 `<style>` + 10 `<script>` + 1 form |
| Non-native tags embedded | `form` ×1 only (by design, see below) |
| Head CSS required | font `@import` only |
| Page Settings custom code | none |

Behaviour verified headlessly with **motion enabled** (`04-design/.tmp/behave-cosmetic.mjs`,
Chrome CDP): 9 hero word masks created and the compare slider tracks keyboard input
(52 → 60 on two ArrowRight, `aria-valuenow` follows); Perfect 1 lights tooth `[4]`, Magic 4
lights `[3,4,5,6]`, Social 10 lights all ten with exactly one option active and the verdict
swapping; both marquees advance while on screen; the process rail fills to 100% with all
three bullets lit; the accordion keeps exactly one item open and closes to zero;
the form swaps to its confirmation panel; and after a full scroll walk **50 of 50 reveals
resolve with 0 stuck**. **Zero JS errors.**

```bash
cd deliver/brandklout/livewell-dental/workflows/04-design/.tmp
node behave-cosmetic.mjs "file:///<abs-path>/final-design/livewell-cosmetic-dentistry-landing.html" 13000
```

### Two conversion traps this page hit, and the fixes

1. **A shared atom silently forked.** `lw-eyebrow` resolved *differently* from the veneers
   payload (it had absorbed `box-sizing` and `margin:0`). Cause: the converter only routes
   an element's base rules onto a companion class via `_split_single_utility`, which fires
   **only for class names that appear in a multi-class stack somewhere on the page**.
   Veneers has such a stack; this page did not, so the base rules baked into the shared
   name. Since Webflow merges by name and the first-pasted definition wins, that would have
   stripped the eyebrow's margin reset on whichever page pasted second. Fixed by giving the
   atom a real modifier (`lw-eyebrow--center`, used on the dark band) so it re-enters the
   thin-utility split. **`--avoid` would not have caught this** — it only renames
   *auto-named* classes, and `lw-eyebrow` is a source class name.
2. **An unused tag rule forced head CSS.** The heading reset listed `h4` while the markup
   has no `<h4>`. A rule with no element to attach to cannot become a Webflow class, so the
   converter emitted it as head CSS. Dropping `h4` returned the head CSS to the font import
   alone. Same class of bug as the four unused atoms removed from the veneers package.

Both are worth checking on every future page: run `qa --against` every already-built page,
and confirm `webflow-runtime-states.css` contains nothing but the font import.

## Fonts

`webflow-runtime-states.css` contains only the Marcellus + Lato `@import`. Both are already
the live site's brand fonts (`--_typography---font-styles--heading` / `--body`), so they are
almost certainly installed. **Check Site Settings → Fonts before pasting.** If present,
discard the file; if not, add them natively rather than pasting the `@import` into head code.

## Paste procedure

1. **Throwaway page first.** Paste onto a scratch page. Confirm no `-2` classes appeared,
   the 21 embeds render, and the layout is right. Only then paste onto the real page.
2. Create/open the target page (**slug unconfirmed, see open items**).
3. Paste `paste_01_page_cosmetic.html` **once** onto the page body.
4. Publish to staging and verify on a **focused tab**. Background tabs freeze
   IntersectionObserver and rAF, so the marquees, the arch cycle and every reveal will look
   broken if the tab is not focused. Testing artifact, not a bug.

### Gotchas that have bitten this toolchain before

- Do **not** read the payload with PowerShell `Get-Content` — it corrupts UTF-8 glyphs.
  Use `[IO.File]::ReadAllText(path, [Text.Encoding]::UTF8)`.
- Keep the Designer at 100% zoom (`Ctrl+0`). Zoom drift breaks paste.
- If a paste appears to miss, re-open the copy page and copy fresh. The copy click must be
  a standalone action.
- Designer may show external images as grey placeholders; they load on staging.

## Before this goes on a second page

Pass `--avoid` with the split folders of every page already pasted into this site, and
always run `qa --against` them:

```bash
python html_to_webflow.py --html ".tmp/<next>/source.html" --page-prefix <slug> \
  --split .tmp/<next> --avoid .tmp/page-cosmetic,.tmp/page-veneers
python wf_tools.py qa .tmp/<next> --against .tmp/page-cosmetic,.tmp/page-veneers
```

Neither this page nor `page-veneers` nor the home package has been pasted yet. Whichever
goes first becomes the `--avoid` baseline for the others.

## Open items

1. **Target slug unconfirmed.** This file arrived without a site-map placement. It reads as
   a stand-alone paid-traffic landing page (own header/footer, no site nav), which is *not*
   the same as `/services/cosmetic-dentistry` that the veneers breadcrumb points at.
   Confirm with Brandklout before pasting, and decide whether it keeps its own chrome or
   gets wrapped in the site nav components.
2. **The lead form does not deliver leads yet.** `<form>`, `<input>`, `<select>` and
   `<label>` have no native Webflow element type in this toolchain, so the form converts to
   one self-contained HtmlEmbed (2,684 chars, styles inlined, well under the 10k QA limit).
   It renders and validates, but its submit handler only swaps in the confirmation panel.
   Before launch either replace it with a **native Webflow Form** in the Designer (so
   submissions land in the Forms panel) or POST it to the practice's CRM/booking endpoint.
   This is flagged in a comment inside the section's script embed. Related: the audit found
   54 of 57 pages have no form at all.
3. **Hero before/after pairing.** `SmileGallery_m_01 before/after` is the only matched pair
   in the client's assets and it is a tight macro. If Brandklout wants a more aspirational
   hero, `6a31506bb6ac6b428e1f6a1b_Amanda-6 cropped.webp` is the full-face alternative used
   in the veneers hero, but the drag-to-compare would then move down the page.
4. **Gallery captions** are labelled by treatment type ("Veneers", "Implants"). If any are
   before/after pairs, we need to know which is which before relabelling.
5. **"320+ five star reviews" and the $0 consultation** are carried from the client's own
   copy. Confirm both are still accurate before this goes live.

## Version Control

Follows [SYSTEM_RULES.md - Section 4](../../../../../../SYSTEM_RULES.md). The payload,
source and manifests are lightweight `.tmp/` artifacts and are committed for continuity.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
