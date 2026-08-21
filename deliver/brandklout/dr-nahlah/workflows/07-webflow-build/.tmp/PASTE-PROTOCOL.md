# Paste Protocol — Dr. Nahlah journey page (whole page, one paste)

Supersedes `SPIKE-PROTOCOL.md`, which described the nine-per-chapter payloads.
Those payloads are withdrawn — see "Why the first paste failed" below.

## What to paste

| | |
| :--- | :--- |
| Site | Dr. Nahlah `6a6b84cc7fe55ddeabc0b314` |
| Payload | `.tmp/wholepage/final.json` — 226 styles, 672 nodes, 31 HtmlEmbeds, 16 payload assets, **1 root** |
| Paste page | `.tmp/wholepage/PASTE-full-page.html` |
| Head code | `.tmp/wholepage/install-head.html` |
| Footer code | `.tmp/wholepage/install-footer.html` |
| Breakpoints | merged into the payload's style `variants` (no post-paste step) |

One paste, not nine. The payload has a single root (`page-wrapper`), which is
what makes a whole-page paste safe — the Designer crash is caused by a
MULTI-root merge, not by size.

> [!CAUTION]
> **The custom code is not optional and its absence looks like a broken paste.**
> Pasted 2026-07-30 without it: the entire hero (`h1`, lead, buttons, meta, cue)
> is `visibility:hidden` by design, waiting for `.wz-ready` — a class only the
> head bootstrap adds. All three case slides sit at `opacity:0` waiting for
> `.on`, whose rule only exists in the head CSS. Nothing animates because GSAP
> is only in the footer block. The paste itself was perfect — 672 nodes, 31
> embeds, 9 chapters, 21 headings, all verified present via the Data API — and
> the page still rendered as an empty dark column.
>
> Install head + footer **first**, then paste. Both blocks are now installed on
> this site (verified 2026-07-30); `get_site_freeform_code` confirms them.

## Order of operations

0. **Site Settings -> Fonts.** Enable **Playfair Display** and **Raleway**
   BEFORE pasting. Webflow strips `font-family` from pasted styles when the
   family is not registered — silently, with no error. Skipping this ships the
   whole page in `system-ui` and shifts every `ch`-based width.
1. **Site Settings -> Custom Code -> Head.** Open `install-head.html`, click
   Copy HEAD, paste into the head slot. This carries two things:
   - the `WZ` bootstrap, which **must** be in the head (see below);
   - `webflow-runtime-states.css`, the state CSS the clipboard cannot carry.
   The head block also carries the six **GSAP CDN tags** — the library must
   load before the bootstrap, which tests for `window.gsap`.
2. **Site Settings -> Custom Code -> Footer.** Open `install-footer.html`,
   click Copy FOOTER, paste into the footer slot: `registerPlugin(...)`,
   `ScrollSmoother.create()`, `WZ.flush()` and the page code.
   **Install at SITE level only.** A second copy in Page Settings is not
   harmless duplication — see defect 6.
3. Open `PASTE-full-page.html` in the same browser as the Designer and click
   **Copy to Webflow clipboard**. You must click it yourself — `execCommand`
   needs a real user gesture.
4. In the Designer, select **Body** on a blank page and `Ctrl+V` **once**.
   Re-copy fresh if the paste misses; a stale clipboard is the usual cause.
   Keep the Designer at 100% zoom (`Ctrl+0`) — zoom drift breaks paste.
5. Nothing. The per-breakpoint values now ride in the payload's style
   `variants` (see defect 9 below), so there is no post-paste API step.
   `resolved.breakpoints.json` is kept only as a readable record.

### Head vs footer — the split that actually matters

GSAP and the bootstrap go in the **head**; registration and the flush go in
the **footer**. Loading and registering are different things:

- The 31 section embeds are **inline in the body** and call `WZ.add(...)` as
  the parser reaches them. A bootstrap installed in the footer is defined too
  late: every chapter throws `WZ is not defined`, the page renders, and
  nothing animates. `SPIKE-PROTOCOL.md` told you to put the whole bootstrap in
  the footer. That was wrong.
- GSAP must LOAD in the head: the bootstrap and the section embeds both test
  for `window.gsap`. Deferring the library to the footer made `WZ.ok` false
  forever and silently skipped every animation (defect 5).
- GSAP must REGISTER in the footer: ScrollTrigger initialises against
  `document.body`, and registering before it exists leaves ScrollSmoother to
  die in `getScrollFunc`.

`gen_install_pages.py` now emits exactly this split, so just use the two
install pages rather than assembling code by hand.

## Gate — all green as of 2026-07-30

```
styles 226 | nodes 672 | embeds 31 | payload assets 16 (+1 video in an embed) | roots 1
cssFunctions 1   (clip-path: circle(0% at calc(100% - 42px) 42px) — see note)
bareTagNames 0
OVERWRITES of live style-guide classes 0   <- the one that can damage the site
simulate_paste.mjs 10/10  (incl. motion layer, images, payload structure)
converter unit tests 22/22
```

The single remaining CSS function is a `circle()` clip-path whose radius is a
percentage of the element — it has no px equivalent at any breakpoint, and
Webflow's style panel has no clip-path control to show `0` in anyway. Correct
to leave live.

## Verify BEFORE pasting

```bash
node simulate_paste.mjs .tmp/wholepage/final.json .tmp/wholepage
```

This renders the payload under Webflow's own rules — every style record as a
FLAT `.name{...}` rule, head/footer artifacts installed as above — and drives
it over CDP. It asserts on computed style, not pixels, because the two bugs
that broke the first paste (a state class baked onto the wrong element, a
JS-written custom property frozen at its fallback) are both invisible in a
screenshot and dead on interaction.

## Verify AFTER pasting

1. Diff the style guide: `get_styles` on page `6a6b84cf7fe55ddeabc0b3c3` and
   compare against `.tmp/styleguide-before.json`. `heading-style-h2` must
   still be `3rem / 1.2 / 700`, `container-large` still `max-width: 80rem`,
   `padding-section-large` still `7rem`. Any change means undo the paste.
2. Style panel, not just canvas: select a heading; the font size must read a
   real number. A `0` means a CSS function survived into `styleLess`.
3. Scrub chapter 04 on a **focused** tab. Background tabs freeze transitions,
   IntersectionObserver and timers, so reveals will look broken when they are
   not.

## Images — done 2026-07-30

All 16 design images plus the b-roll video are in the site's asset library and all 21 `<img>` nodes
are rebound. Reproduce with:

```bash
node upload_assets.mjs .tmp/wholepage/asset-uploads.json \
  ../04-design/.tmp/final-design-gsap/assets          # 16/16 -> HTTP 201
node rebind_assets.mjs .tmp/wholepage/resolved.json \
  .tmp/wholepage/asset-uploads.json .tmp/wholepage/final.json
```

A relative `src` obviously breaks, but a bare external URL is not the fix
either — Webflow drops images it does not recognise as its own assets. Each
node needs the CDN `hostedUrl` **and** `data.img.id`, plus a matching
`payload.assets[]` entry, so the image arrives as a real re-selectable asset.

`asset-uploads-all.json` holds the presigned S3 POSTs from `create_asset`.
Those policies **expire after ~1 hour** — a 403 AccessDenied on re-run means
re-issue `create_asset`, not that anything is wrong.

Two things that are easy to miss, both found by checking rather than assuming:

- **HtmlEmbeds carry their own relative paths.** The proof chapter's
  `<video src="assets/broll.mp4">` lives inside an embed, so no Image-node
  pass touches it. It is uploaded (17th asset) and rewritten now.
- **The embed markup exists twice** — at `node.v` and at
  `node.data.embed.meta.html`. Rewriting only `v` leaves the relative path
  alive in the payload.

Verified: 0 relative asset refs anywhere in the payload, 17/17 CDN URLs
return 200, 21/21 images load in the simulator.


## Live debugging log — 2026-07-30

The payload passed every local gate and the published page was still wrong.
Five further defects, all found only by loading `dr-nahlah.webflow.io` and
measuring it. Each one is now covered by a check in `simulate_paste.mjs`.

| # | Symptom on the live page | Cause | Fix |
| :--- | :--- | :--- | :--- |
| 5 | Nothing animated; 13,000px static wall | `WZ.ok` captured `!!(window.gsap)` in the HEAD while GSAP was installed in the FOOTER, so it was false forever and the flush took its "GSAP missing" branch and returned | GSAP **loads** in the head (where the design loads it) and is **registered** in the footer; `ok` is now a lazy getter |
| 6 | Only 11 of 47 ScrollTriggers; 0 pins | Custom code installed **twice** — page-level (old copy) on top of site-level. The second `ScrollSmoother.create()` killed the first smoother and every section trigger with it | Page-level head/footer cleared; site-level is the single source |
| 7 | Footer stacked in one column | `@media(min-width:720px)` nearest-matched to Webflow's **xl (1280px)** breakpoint, so the 4-column rule never applied at 1424px | `_invert_mobile_first`: sub-1280 min-width blocks bake at BASE and push the narrow value down to small/tiny |
| 8 | Desktop nav links missing, burger showing | Same mis-mapping on `@media(min-width:1024px){.nav-mid{display:flex};.burger{display:none}}` | same |
| 9 | Hero rendered 106px on a 500px viewport | `resolve_fluid` wrote per-breakpoint values to a **side file** that then had to be applied by ~235 post-paste API calls. Skipping that step is silent and total | `resolve_wholepage.mjs` now merges all 235 overrides into each style's `variants`, so they travel with the paste |

### What this changes about verification

A payload gate is necessary and not sufficient. Three of these five were
invisible to any static check of the payload, because the payload was correct —
the **installation** was wrong. The live probes now live in
`.tmp/scratchpad`-style scripts and should be re-run after every publish:

```bash
node diagnose.mjs      https://<site>.webflow.io    # libs, wzOk, smoother, visibility, images
node live-interact.mjs https://<site>.webflow.io    # scroll and assert the wipe/nav/pins move
node shots.mjs         https://<site>.webflow.io . 7
```

`shots.mjs` takes VIEWPORT frames while driving `WZ.smoother.scrollTop()`.
A full-page `captureBeyondViewport` screenshot is worthless on a ScrollSmoother
page — the transform makes everything below the fold render black.

### Duplicate installs are the trap to watch

Check BOTH levels before concluding anything about custom code:

```
data_scripts_tool > get_site_freeform_code   (site-wide)
data_scripts_tool > get_page_freeform_code   (per page)
```

Two copies do not merely duplicate work — the second `ScrollSmoother.create()`
tears down the first smoother and every ScrollTrigger attached to it, leaving a
page that looks installed and behaves as if nothing ran.


## Parity ceiling — fluid vs editable (2026-07-30)

`parity.mjs` diffs computed style between the local design and the live page on
the 54 ids both share.

The design sizes type and spacing with `clamp()`, which scales continuously.
`resolve_fluid` converts that to concrete px per Webflow breakpoint, because the
Designer's style panel cannot parse a CSS function and shows `0` for one. So the
build matches exactly AT each breakpoint and steps between them. Keeping
`clamp()` would give pixel parity at every width and an uneditable panel.

**This is a trade, not a defect** — but the gap is much smaller than it first
looked, because the original ladder was wrong twice over.

### Two bugs that made the gap look inherent

1. **Every band was evaluated at its MAXIMUM width** (1440/991/767/478), so the
   baked value was the largest the band ever needs and rendered oversized
   everywhere except the exact edge. Bands are now evaluated at their MIDPOINT,
   which minimises the worst-case error.
2. **Webflow's large-screen ladder was mis-mapped.** The converter had
   `xl = min-width 1280`. Webflow's actual ladder is **large = 1280, xl = 1440,
   xxl = 1920** — the `large` breakpoint was never used, so one value from 1440
   governed everything from 992 upward.

`xl` stays pinned to 1440, the design's reference width, so the build remains
pixel-exact where it was signed off.

### Measured effect on the hero (`clamp()`-sized h1)

| Viewport | Design | Old 4-band | New 7-band |
| ---: | ---: | ---: | ---: |
| 1024 | 74.80px | +42.5% | **+12.4%** |
| 1280 | 93.54px | +13.9% | **+7.6%** |
| 1360 | 99.40px | +7.2% | **+1.2%** |
| 1440 | 106.56px | exact | **exact** |

Editability is untouched: every value is still a concrete px in the panel.

### Residual diffs at 1440 (all benign)

| Kind | Count | Why |
| :--- | ---: | :--- |
| `width` / `max-width` ~1.1% | ~14 | `ch`-based measures; variable-font advance widths |
| `grid-template-columns` sub-px | 4 | scrollbar / rounding |
| `background-color` on `#nav`, `#smooth-wrapper` | 2 | design transparent over body; live has the body colour stamped on by the page-base carry. Same rendered result |
| `#storyCopy` height | 1 | a 1.1px column difference tips a blockquote line over its wrap boundary |


## Headless paste — no clipboard, no Ctrl+V (2026-07-31)

`data_whtml_builder` accepts HTML + raw CSS and builds **native Webflow
elements**. Verified on real content, not fixtures: a chapter `<section>`
became `type: "Section"`, its `<h1>` a `Heading` with `nahlah-h1`, its `<p>` a
`Paragraph` with `lead`, and a button kept its full four-class stack
`["nahlah-a-2","btn","btn-primary","magnetic"]`. All six breakpoint overrides
came through. Element ids survive.

This removes the manual paste entirely. `headless_paste.mjs` turns a payload
into the insert plan:

```bash
node headless_paste.mjs .tmp/wholepage/final.json .tmp/wholepage/insert-plan.json
# 15 requests, 92 KB total, largest 16.8 KB
```


### Measured against the clipboard path — headless is LOSSY (2026-07-31)

Both paths were built and measured against the same design. The headless build
is at `/home-v2`, the clipboard build at `/`.

| | Clipboard paste | Headless `whtml_builder` |
| :--- | :--- | :--- |
| Human step | 2 clicks | **none** |
| Element ids preserved | **54 / 54** | 47 / 54 |
| Content fidelity | complete | `cite`, `small` and some text silently dropped |
| Class names | exact | 51 elements got a duplicated token (`class="x x"`) |
| Parity diffs @1440 | **38** (3 real) | 60 |
| Native, editable elements | yes | yes |
| Live interaction checks | 5/5 | 5/5 |

**Why the clipboard wins on fidelity**: `@webflow/XscpData` is Webflow's own
native format. It carries explicit node types and falls back to `HtmlEmbed` for
tags Webflow cannot represent natively — which is exactly how `<cite>` and
`<small>` survive. `whtml_builder` re-parses HTML and drops what it cannot map.

**The hard blocker**: dropped ids cannot be repaired. `set_attributes` on `id`
fails with an internal error, and `remove_attribute` is a no-op on it. The page
JS targets `#portrait`, `#reviews`, `#rvScore` and `#navCh` directly, so a
headless build silently loses those behaviours.

**Recommendation**: use the clipboard payload for production builds — it is two
clicks and it is correct. Use the headless path for rapid preview/iteration, or
where the design has no id-dependent JS. To close the gap the generator would
need to pre-map unsupported tags to `<span>` equivalents, and the design's JS
would need to stop selecting by id.


### Why the headless gap cannot be closed from our side (2026-07-31)

The losses are in Webflow's HTML importer, not in the generator. Verified:

- The payload and the generated HTML contain **zero** duplicate class tokens.
  The duplication (`class="nahlah-b-2 nahlah-b-2"`) is introduced server-side.
- Inline tags become **`type: "DOM"`** — a generic HTML wrapper, not a native
  Webflow type. A `<b>` arrives as `DOM` with `settings.dom.tag = "b"`, storing
  its class BOTH as an attribute and as a styleName, which is where the
  duplication comes from. Native types (`Section`, `Heading`, `Paragraph`,
  `Link`, `Image`) convert correctly; everything else degrades.
- `whtml_builder` also RENAMED `nahlah-b` to `nahlah-b-2` on insert.
- Dropped ids cannot be restored: `set_attributes` on `id` throws an internal
  error, `remove_attribute` is a no-op on it.

Generic `DOM` elements are exactly what the original complaint was about — they
are harder to edit in the Designer than native types. So the headless path
undermines the goal it was adopted to serve.

**Conclusion: use the clipboard payload for production.** It is two clicks, it
preserves every id and every element, it emits native types throughout, and it
measures 38 diffs against the design versus 60. Keep `headless_paste.mjs` for
quick previews and for pages with no id-dependent JS and no inline-tag styling.

### Execution order

1. `data_pages_tool > create_page` (or clear the target page).
2. For each `shells[]` then `chunks[]`, call `data_whtml_builder` with the
   entry's `html` + `css`. Insert order matters: a chunk's `into` names the
   shell it belongs in, and you need the **returned element id** of that shell
   as the next `parent_element_id`.
3. `data_element_tool > set_image_asset` for each `images[]` entry.
4. `data_style_tool > update_style` for each `fonts[]` entry.
5. Page head code <- `headCss`; page footer code <- `footerJs` + the GSAP tags
   and bootstrap.
6. Publish, then `live_diagnose.mjs` / `live_interact.mjs` / `parity.mjs`.

### Four hard contracts, all learned by hitting them

| Constraint | Consequence if ignored |
| :--- | :--- |
| Media queries must be **exactly** one of Webflow's six strings | request rejected outright — note **479px, not 478**, and the space after the colon |
| CSS must be passed **verbatim** from the generator | every hand-trimmed rule forked a class (`nahlah-h1-1`, `nahlah-div-2-1`, `nahlah-header-1`) |
| A class attaches by name only if **combo-ness matches** | inserting `ch-reality` as a base class when the site holds `.nahlah-div.ch-reality` silently creates an EMPTY global twin |
| `<style>` / `<script>` are rejected | embeds must be split out: CSS to head, JS to footer (which also fixes the mid-parse `WZ is not defined` fragility) |

Images always arrive unbound ("does not exist in asset library") even for a
correct CDN URL, and custom-uploaded fonts are not recognised by the builder's
font check — both are repaired in steps 3-4, not worked around in the HTML.

### Before running against an existing page

Webflow classes are **site-wide**. A page already built from an older payload
holds ~225 classes whose definitions have since changed, so a headless run
against it forks all of them into `-1` names rather than merging. Either remove
the stale styles first (`data_style_tool > remove_style`) or build onto a fresh
page and retire the old one.

## Why the first paste failed

Four independent defects, all now fixed in the toolchain:

| # | Defect | Effect | Fix |
| :--- | :--- | :--- | :--- |
| 1 | `*,*::before,*::after{box-sizing:border-box}` was materialised into real divs | **636 phantom empty divs**, 54% of all nodes — broke every flex/grid gap and `nth-child` | `_make_pseudo` now honours CSS: no `content`, no box |
| 2 | `.cmp .slide.on{opacity:1}` baked onto slide 1 | carousel frozen on slide 1; `.on` emitted empty, so every toggle was a no-op | JS-toggled rules are excluded from the bake and ship as boosted runtime-state CSS |
| 3 | `var(--pos,0%)` resolved to its fallback | the scroll-scrubbed wipe could not move | JS-written custom properties keep a live `var()` |
| 4 | The whole bootstrap sent to the footer | `WZ is not defined` per chapter; nothing animated | head/footer split restored in `extract_custom_code` |

Two process errors sat behind them:

- **Per-section conversion.** Only `html_to_webflow_wholepage.py` writes
  `webflow-runtime-states.css`. Converting per chapter with
  `html_to_webflow.py --root` silently produced no state CSS at all, so every
  runtime class was empty by construction. Use the whole-page path.
- **`data-cf` as replacement.** Annotating an element made the converter emit
  *no style at all* for it, so `<h2 data-cf="heading-style-h2">` lost
  `max-width:16ch` and dropped from 51.84px to the style guide's 48px — and
  stacked five classes deep, which Client-First forbids. Reuse is only safe
  when the element's own CSS is purely redundant. It is not, here.

Consequence: this build reuses **no** style-guide classes (`reusePct 0`). That
is deliberate — design fidelity wins, and `--page-prefix nahlah` plus the
`.nav`/`.label`/`.section` renames keep `overwrites` at 0, so the live Relume
style guide cannot be touched.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
