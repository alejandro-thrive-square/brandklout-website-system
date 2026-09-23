# Light home — pasteable component (build state)

Site `6a6b84cc7fe55ddeabc0b314` · Home page `6a6b84cf7fe55ddeabc0b3bf`
MCP `webflow-dr-nahlah`. Built 2026-08-03 from
`../04-design/.tmp/final-site/index.html` (the LIGHT design the client asked
for — the earlier dark build in `.tmp/wholepage` is superseded).

The earlier headless `data_whtml_builder` insert run described here is
**abandoned**. Verified 2026-08-03: the Home page holds nothing but `Body`, and
the site holds only its 288 Relume style-guide classes — zero `nahlah-*`. So
this ships as one clipboard paste onto a clean canvas.

## What to paste

| | |
| :--- | :--- |
| Payload | `.tmp/light/final.json` — 259 styles, 793 nodes, 15 HtmlEmbeds, 16 assets, **1 root** (`nahlah-page`) |
| Paste page | `.tmp/light/PASTE-full-page.html` (417 KB) |
| Head code | `.tmp/light/install-head.html` — 6,520 chars |
| Footer code | `.tmp/light/install-footer.html` — 6,257 chars |
| Breakpoints | merged into the payload's style `variants` — no post-paste API step |

Both custom-code blocks fit Webflow's 10,000-character slot. They only do
because the nine chapter scripts ride **inside the payload** as their own
HtmlEmbeds; bundled into the footer they came to 21,546 characters, which
cannot be installed at all. See "self-contained packaging" below.

## Order of operations

0. **Site Settings → Fonts**: enable **Playfair Display** and **Raleway**
   BEFORE pasting. Webflow silently strips `font-family` from pasted styles
   when the family is not registered.
1. **Site Settings → Custom Code → Head** ← `install-head.html`
   (6 GSAP 3.13 CDN tags, then the `WZ` bootstrap, then
   `webflow-runtime-states.css`). The bootstrap must be in the HEAD: the
   section embeds call `WZ.add(...)` mid-parse.
2. **Site Settings → Custom Code → Footer** ← `install-footer.html`
   (`registerPlugin`, `ScrollSmoother.create()`, `WZ.flush()`, nav/drawer).
   **Site level only** — a second page-level copy kills the first smoother.
3. Open `PASTE-full-page.html` in the same browser as the Designer, click
   **Copy to Webflow clipboard** (a real user gesture is required).
4. Select **Body** on the blank Home page and `Ctrl+V` **once**. Keep the
   Designer at 100% zoom (`Ctrl+0`); re-copy fresh if the paste misses.

## Gate — all green 2026-08-03 (two consecutive runs)

```
styles 259 | nodes 793 | embeds 15 | assets 16 | roots 1
OVERWRITES of live style-guide classes 0      <- the one that can damage the site
bareTagNames 0 | wf_tools qa ALL CHECKS PASSED | converter tests 22/22
simulate_paste.mjs 11/11
cssFunctions 3  (drawer clip-path circle(0%…), nahlah-video width/height
                 calc(100% + 4px) — percentage-relative, no px equivalent at
                 any breakpoint; the style panel will read 0 for them)
```

```bash
node simulate_paste.mjs .tmp/light/final.json .tmp/light \
     ../04-design/.tmp/final-site/assets
```

The third argument is not optional — see `simulate_paste.mjs`.

## Rebuild from source

```bash
python prep_light_source.py --html ../04-design/.tmp/final-site/index.html \
       --out .tmp/source/index-light.html
python html_to_webflow_wholepage.py --html .tmp/source/index-light.html \
       --out .tmp/light --wrap --wrap-class page --page-prefix nahlah
node   resolve_wholepage.mjs .tmp/light/paste_00_full-page.html .tmp/light/resolved
node   rebind_assets.mjs .tmp/light/resolved.json .tmp/light/asset-uploads.json \
       .tmp/light/final.json
python make_paste_page.py --payload .tmp/light/final.json \
       --out .tmp/light/PASTE-full-page.html
python gen_install_pages.py .tmp/light
node   simulate_paste.mjs .tmp/light/final.json .tmp/light \
       ../04-design/.tmp/final-site/assets
```

`asset-uploads.json` is reused: all 16 images and both videos are already in
the site's asset library and all 19 CDN URLs return 200.

## Fixed while building this payload (2026-08-03)

1. **Self-contained packaging was not applied.** `extract_custom_code` only
   leaves a section's script inside the section when it carries `data-embed`,
   and the light design marks none — so all nine chapter scripts were hoisted
   into a 21,546-character footer bundle, over Webflow's slot cap.
   `prep_light_source.mark_section_embeds` now tags them (asserting 9), which
   both fits the slot and satisfies this workflow's packaging rule: a pasted
   section works on any page with zero page-settings changes.
2. **`content` declared only inside a media query shipped an empty div.**
   `_make_pseudo` read the literal from the base declarations alone, so
   `@media(max-width:719px){.vs-us::before{content:"Here"}}` produced 10 blank
   divs and the comparison table lost both mobile column labels. It now falls
   back to the first variant that declares one and hides the div at every width
   that does not (Webflow can vary `display` per breakpoint, not text).
3. **The gate could not run at all.** With images on the Webflow CDN, ~11 MB of
   video streams while the standard chapter's clip-path entrance and scrubbed
   image parallax refresh, and the headless renderer wedges permanently — even
   `Debugger.pause` stops answering. `simulate_paste.mjs` takes an optional
   asset directory and mirrors the CDN URLs to local files (same bytes).
4. **Three checks measured the wrong thing.** The phantom-pseudo check counted
   every materialised `::before`/`::after` and failed at 38 legitimate scrims —
   it now asks whether a pseudo div paints nothing at ANY breakpoint (0 here).
   The nav-background, drawer and motion-layer checks used fixed sleeps that a
   busy main thread outran, failing correct builds; they settle-poll now.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
