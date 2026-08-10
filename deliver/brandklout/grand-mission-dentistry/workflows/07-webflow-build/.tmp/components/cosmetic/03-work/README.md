# Cosmetic LP — 03-work

Section `#work`, position 3 of 7 inside `main#top`.

| | |
| :--- | :--- |
| Page | **Cosmetic LP** (`cosmetic-ai`, page `6a723ad5534774f35f17d119`, site `698111847e9608eb30ee21c6`) |
| Payload | `final.json` — 61 nodes, 64 styles, 1 assets, 1 HtmlEmbeds (1 scripted), 1 root |
| Behaviour | rides INSIDE the section as `WZ.add`/`WZ.onReady` embeds — the section stays movable and reorderable |
| Paste target | `main#top`, after component 02 |

## Prerequisites — once per page, BEFORE any paste

1. **Fonts**: Montserrat and Great Vibes enabled in Site Settings → Fonts.
   Webflow silently strips `font-family` from pasted styles for unregistered
   families — no error, the page just renders in system-ui.
2. **Page-level custom code** (installed by the agent over the Data API MCP —
   the blocks exceed the 10k page-settings UI cap; the API takes 50k):
   - head ← `.tmp/_shared-install/head.html` (GSAP CDN tags → WZ bootstrap →
     runtime-states CSS union). Identical on all three LP pages.
   - footer ← `.tmp/_shared-install/footer.html` (registerPlugin +
     ScrollSmoother.create + WZ.flush + the shared kit).
   **Never install at site level** (303-page production site) **and never
   twice** — a second ScrollSmoother.create kills every trigger.

## Paste steps

1. Open this folder's `PASTE.html` in the SAME browser the Designer is
   logged into, and click **Copy to Webflow clipboard** yourself — execCommand
   needs a real user gesture.
2. In the Designer, select the target parent in the **Navigator** (see the
   page's PASTE-QUEUE.md), keep the canvas at **100% zoom** (`Ctrl+0`), and
   press `Ctrl+V` **once**.
3. If the paste misses, re-copy fresh — a stale clipboard is the usual cause.

## After pasting

Ask the agent to patch content over the Data API MCP (`set_text`,
`set_image_asset`, `set_attributes`) — **never re-paste to fix a typo**; a
re-paste with a hand-edited definition forks `-2` twin classes.
