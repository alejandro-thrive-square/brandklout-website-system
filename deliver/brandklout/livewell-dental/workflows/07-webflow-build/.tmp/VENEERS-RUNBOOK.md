# Livewell Dental — /services/no-prep-veneers, pasteable payload

**Generated**: 2026-07-28 · **Status**: generated + QA-passed, **not yet pasted**

## The payload

`.tmp/page-veneers/paste_01_page_veneers.html` — **ONE paste, 637 nodes, 196 styles.**

Open it in the logged-in Chrome, click **Copy to Webflow clipboard**, then paste once
onto the page body in the Designer. Everything lives inside the single `.page_veneers`
root, so this is one paste and not sixteen. A **multi-root** payload is what crashes the
Designer (Giovanni precedent), not size.

| Artifact | What it is |
|:---|:---|
| `paste_01_page_veneers.html` | The clipboard copy page. This is the deliverable. |
| `source.html` | Converter input: the 04-design package with preview chrome stripped. Regenerate with `python .tmp/prep_source.py`. |
| `webflow-runtime-states.css` | **Only a Google Fonts `@import`.** See "Fonts" below. No other head CSS is required. |
| `webflow-variable-map.json` / `-import.json` / `-bindings.json` | Optional post-paste variable binding (not required for the page to render). |
| `animation-manifest.json` | Inventory of the JS behaviours carried in the section embeds. |

There is **no `webflow-custom-code.js`** — nothing needs to go in Page Settings.

## Regenerate

```bash
cd deliver/brandklout/livewell-dental/workflows/07-webflow-build
python .tmp/prep_source.py                       # strip nav/footer preview chrome
python html_to_webflow.py --html ".tmp/page-veneers/source.html" \
  --page-prefix vnr --split .tmp/page-veneers
python wf_tools.py qa .tmp/page-veneers
```

`--page-prefix vnr` is **not optional**. Without it the payload ships classes named
literally `p`, `div`, `span`, `a`, `h3`, and Webflow merges classes by name site-wide,
so they would collide with Livewell's existing Relume-derived classes. See
[07-webflow-build.md](../07-webflow-build.md) §Raw converter access.

## Verified before handoff

| Check | Result |
|:---|:---|
| `wf_tools.py qa` | ALL CHECKS PASSED (escapes 0, class conflicts 0, missing JS hooks 0, unsafe overflow+sticky 0, form embeds 0) |
| `wf_tools.py collisions` | 0 |
| Root count | **1** (`.page_veneers`) |
| Bare tag-named classes | **0** (14 residuals namespaced to `vnr-p`, `vnr-div`, …) |
| Class names with >1 distinct definition | **0** — nothing can fork to `-2` |
| Section embeds | 20 = 10 `<style>` + 10 `<script>`, two per section |
| Head CSS required | font `@import` only |
| Page Settings custom code required | none |

Behaviour was verified on the design source with motion enabled (headless Chrome CDP):
scrub at p=0.85 gives traditional 17%/13% and no-prep 8.5%/30% with the rail at 85%;
three selected candidacy traits light three ticks and swap the verdict; the accordion
keeps exactly one item open; the marquee transform advances; six hero word masks are
created. **Zero JS errors.**

## Paste procedure

1. **Throwaway page first.** Paste onto a scratch page in the Designer. Confirm in the
   Style panel that **no `-2` classes appeared**, the ten embeds render, and the layout
   is right. Only then paste onto the real page.
2. Create/open `/services/no-prep-veneers`. Nav and footer are site-wide components and
   are deliberately **not** in the payload — add them around it.
3. Paste `paste_01_page_veneers.html` **once** onto the page body.
4. Publish to staging and verify on a **focused tab**. Background tabs freeze
   IntersectionObserver and rAF, so the scrub, the marquee and every reveal will look
   broken if the tab is not focused. This is a testing artifact, not a bug.

### Gotchas that have bitten this toolchain before

- Do **not** read the payload with PowerShell `Get-Content` — it corrupts UTF-8 glyphs.
  Use `[IO.File]::ReadAllText(path, [Text.Encoding]::UTF8)`.
- Keep the Designer at 100% zoom (`Ctrl+0`). Zoom drift breaks paste.
- If a paste appears to miss, re-open the copy page and copy fresh. The copy click must
  be a standalone action.
- Designer may show external images as grey placeholders; they load on staging.

## Fonts

`webflow-runtime-states.css` contains only:

```css
@import url("https://fonts.googleapis.com/css2?family=Marcellus&family=Lato:...");
```

Marcellus and Lato are **already the live site's brand fonts** (`--_typography---font-styles--heading`
/ `--body` in the site's compiled CSS), so they are almost certainly installed in the
Webflow project already. **Check Site Settings → Fonts before pasting anything.** If both
are present, discard this file. If not, add the fonts natively rather than pasting the
`@import` into head code.

## Before this goes on a second page

Pass `--avoid` with the split folders of every page already pasted into this site, so
shared classes that drifted get renamed instead of forking:

```bash
python html_to_webflow.py --html ".tmp/<next>/source.html" --page-prefix <slug> \
  --split .tmp/<next> --avoid .tmp/page-veneers
python wf_tools.py qa .tmp/<next> --against .tmp/page-veneers
```

The home package (`04-design/.tmp/final-design/index.html`) has **not** been converted
yet. Whichever of the two is pasted first becomes the `--avoid` baseline for the other.
The shared `lw-*` atoms (`lw-btn`, `lw-eyebrow`, `lw-shell`, `lw-sec`) are deliberately
byte-identical across both design packages so they merge by name instead of forking.

## Assets bound to the live page — DONE 2026-07-28

Page: **`no-prep-veneers-landing-page`** (`6a677f236cd710348c4241bf`), pasted payload
confirmed by its `page_veneers` root. The paste was clean: **no `-2` class fork** here.

A pasted `<img>` arrives with **`assetId: null`** — an unmanaged image pointing at an
external URL, so no Webflow responsive variants, no Assets-panel link, no alt inheritance.
All **10** image elements were bound to their existing Livewell assets with
`data_element_tool > set_image_asset`. Element alt text was preserved.

All ten source images already existed as site assets (nothing was uploaded; re-uploading
would duplicate the client's library). The three used only by this page were confirmed first
via `get_asset`: `Amanda-9 ladnscape.webp`, `photo-42 cropped2.webp`,
`jb-180-cosmetic.implant.elab.perfect1.perfectone.webp`.

| Element | Asset |
|:---|:---|
| `vnr-hero__img` | `Amanda-6 cropped.webp` |
| `vnr-guide__img` | `chris-8 cropped.webp` |
| `vnr-gal__img` ×7 | Amanda-9, Amanda-2, Amanda-3, Amanda-5, Amanda-6, photo-42, jb-180 |
| `vnr-elab__img` | `jb-180…webp` |

Mapping was keyed off **altText**, which is the only reliable join key: the Data API does not
expose an image's `src` (`get_attributes name:"src"` returns null; `get_settings` exposes only
`assetId` / `altText` / `domId` / `visibility` / `attributes`). All ten alt strings on this
page are unique, so the mapping was unambiguous with no reliance on document order. Two assets
are legitimately reused twice with different alt text, which the alt-keyed map handles.

> [!IMPORTANT]
> Do this **on the live page via MCP, never by re-pasting** — once the page has been edited in
> the Designer, re-pasting a regenerated payload discards those edits.

`set_image_asset` performs an internal `GET /v2/assets` per call, so batch **3 to 4 actions
per call**; larger batches return 429 partway. Verification reads 429 on `GET /v2/pages` the
same way. Failed actions are safe to retry verbatim. Full method:
[html-to-webflow-clipboard.md](../html-to-webflow-clipboard.md) §C.4.

## Layers animation fixed — 2026-07-28

The "What are no prep veneers?" scroll-scrub (`section_vnr-layers`) had **two independent
bugs**. The paste-level one masked the source-level one.

### Bug 1 (source, the real one): the stage never pinned

`.section_vnr-layers` had `overflow:hidden`. An ancestor whose `overflow` is anything but
`visible`/`clip` becomes the **sticky scrollport**, and since that box never scrolls, the
`.vnr-lay__stage{position:sticky}` never pinned. The whole 280vh track scrolled past with the
diagram fixed inside it, so the scrub played off-screen.

This was present **in the design package from the start**, not introduced by conversion.
Measured directly (`../../04-design/.tmp/behave-layers.mjs`): `stageTop` tracked `trackTop`
one-to-one (0, -218, -435, -725, -1014, -1232, -1449) instead of holding at 0.

The scrub *numbers* were correct the entire time — rail 0→100%, traditional
porcelain 0→20% / enamel 30→10%, no-prep porcelain 0→10% / enamel held at 30. **That is why
the original behaviour probe passed: it measured the data and never the pinning.**

**Fix**: `overflow: clip`, which clips identically without creating a scroll container.
Applied to the design source, the regenerated payload, and the live page
(`data_style_tool > update_style`). After the fix `stageTop` holds at **0** across the full
scrub while `trackTop` runs to -1449.

**Swept both pages** with `../../04-design/.tmp/sticky-audit.mjs`: veneers 3/3 stickies OK
(`shell-nav`, `vnr-lay__stage`, `vnr-vc__aside`), cosmetic 2/2 OK (`csm-head`,
`csm-proc__aside`), and no horizontal overflow introduced on either.

**Toolchain gap closed**: `wf_tools.py qa` check `[4]` was supposed to catch exactly this and
did not — it only inspected top-level ROOT nodes, so on a single-root whole-page payload it
only ever saw `.page_veneers`. It now walks every element and names the offending ancestor.
Regression-verified: reintroducing `overflow:hidden` makes it report
`.vnr-lay__stage blocked by .section_vnr-layers {overflow:hidden}`. All 22 converter tests
still pass; propagated to `deliver/process/07-webflow-build/`.

### Bug 2 (paste): Webflow dropped two base-breakpoint `height` declarations

| Class | Payload had | Live had |
|:---|:---|:---|
| `vnr-lay__track` | `height: 280vh` | *(absent)* |
| `vnr-lay__stage` | `height: 100vh` | *(absent)* |

Both are present and correct in `paste_01_page_veneers.html` and in the design source, so
this was not a converter or authoring fault. The `medium`/`small`/`tiny` height overrides on
`vnr-lay__track` (230/200/180vh) **did** survive, which is why the animation still worked on
tablet and mobile and only looked broken on desktop. Without a track height the track
collapses to content height, so there is no scroll distance, the sticky stage never pins and
the scrub never advances. It reads like a JS bug and is not.

**Fix**: restored both via `data_style_tool > update_style` (`breakpoint_id: "main"`) — a
live-page patch, **no re-paste**, so Designer edits were preserved.

**Audited the rest**: all 21 payload styles carrying a base `height`/`min-height` were
checked against the live site. The other 19 came through intact, so the loss was isolated to
these two. JS hooks and embeds are also intact: `data-vnr-layers` on the section root,
`data-vnr-track` on the track, and 20 HtmlEmbeds on the page (10 `<style>` + 10 `<script>`).

Method and the general warning: [html-to-webflow-clipboard.md](../html-to-webflow-clipboard.md)
§"Webflow can silently DROP a property on paste".

> [!IMPORTANT]
> **Not yet visually verified.** The style values are confirmed via the Data API, but nobody
> has seen the animation run since the fix. Verify on a **focused tab** once the page is
> published to staging — background tabs freeze rAF and IntersectionObserver, so the scrub
> will look broken regardless.

## Known open items (carried from the design package)

1. Gallery photo labelling needs client confirmation if any are before/after pairs.
2. No millimetre figures on the layers diagram by design — clinical claims need Dr. Chris.
3. No form on the page; it keeps the live page's CTA-only pattern. The audit's finding
   that 54 of 57 pages have no form is a separate, larger decision.

## Version Control

Follows [SYSTEM_RULES.md - Section 4](../../../../../../SYSTEM_RULES.md). The payload,
source, and manifests are lightweight `.tmp/` artifacts and are committed for continuity.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
