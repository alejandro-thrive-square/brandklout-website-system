# SUPERSEDED 2026-07-30 — see [PASTE-PROTOCOL.md](./PASTE-PROTOCOL.md)

> This described the nine per-chapter payloads in `.tmp/final/`, which are
> **withdrawn**. They carried 636 phantom divs, a dead before/after carousel
> and a frozen scrub, and per-chapter conversion never produced the runtime
> state CSS at all. Two instructions here are actively wrong:
> the `WZ` bootstrap belongs in the **head**, not the footer, and reuse via
> `data-cf` replaces the design's own styling rather than adding to it.
> Kept only for the clipboard MIME-type / `</script>`-escaping post-mortem
> at the end, which still holds.

---

# One-Chapter Spike — Transformation

Everything is staged. The paste itself needs a logged-in Webflow Designer session.

## Target (created 2026-07-30)

| | |
| :--- | :--- |
| Site | Dr. Nahlah `6a6b84cc7fe55ddeabc0b314` |
| Spike page | **Spike — Transformation** `6a6bae6862ebb32ff9d61d74`, slug `/spike-transformation`, **draft** |
| Chapter | 04 Transformation — the pinned scroll-scrubbed before/after |
| Payload | `.tmp/final/transformation.json` — 36 styles, 78 nodes, 2 HtmlEmbeds |
| Paste artifact | `.tmp/paste-transformation.html` |
| Breakpoint overrides | `.tmp/final/transformation.breakpoints.json` |

Draft = it cannot publish accidentally. Home and the Style Guide are untouched.

## Before-state

`.tmp/styleguide-before.json` holds the current definitions of the 12 Client-First
classes this payload reuses. This is the diff baseline.

## Steps

1. **Site Settings → Custom Code → Footer** (not Head — ScrollTrigger initialises
   against `document.body`, and registering earlier silently breaks ScrollSmoother):

   ```html
   <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollToPlugin.min.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js"></script>
   ```
   Then the shared `WZ` bootstrap from the design package's `<head>`, followed by
   `gsap.registerPlugin(...)` and `WZ.flush()`. The section embeds only queue work;
   without the bootstrap nothing runs.

2. Open `.tmp/paste-transformation.html` in the same browser as the Designer and click
   **Copy to Webflow clipboard**. You must click it yourself — `execCommand('copy')`
   needs a real user gesture, so a scripted click will not work.

   Regenerate it any time with:
   ```bash
   python make_paste_page.py --payload .tmp/final/transformation.json                              --out .tmp/paste-transformation.html
   ```

3. In the Designer open **Spike — Transformation**, select the **Body**, `Ctrl+V`.
   Re-copy fresh if the paste misses — a stale clipboard is the usual cause.

4. **Diff the style guide immediately.** Re-query the 12 classes and compare against
   `styleguide-before.json`:
   - `heading-style-h2` must still be `3rem / 1.2 / 700`
   - `container-large` must still be `max-width: 80rem`
   - `padding-section-large` must still be `7rem` top/bottom

   Any change means the payload overwrote the style guide — undo the paste and stop.

5. Check the **style panel**, not just the canvas. Select a heading: font size must read
   a real number. A `0` means a CSS function survived into `styleLess`.

6. Apply the per-breakpoint overrides from `transformation.breakpoints.json` via
   `data_style_tool.update_style` (tablet 991 / mobile-landscape 767 / mobile-portrait
   478). Pasting only carries the desktop values.

## Expected — and intended — visual deltas

Reuse means the site's design system wins over ours. Headings will resolve to the
style guide's sizes, not the design package's:

| Element | Design package | After reuse |
| :--- | ---: | ---: |
| `heading-style-h2` | 51.84px | **48px** (3rem) |
| `heading-style-h1` | 118px | **56px** (3.5rem) |
| `text-size-regular` | 15.6px | **16px** (1rem) |

`heading-style-h1` is the big one — the hero drops from 118px to 56px. That is the
style guide asserting itself. Either accept it, or add a combo class carrying the
larger size rather than editing the base class (editing the base changes the whole
site).

## Rollback

The page is a draft and nothing else was touched. Delete
`6a6bae6862ebb32ff9d61d74` to remove all trace. If a style-guide class did change,
restore it from `styleguide-before.json` via `data_style_tool.update_style`.


## "The clipboard is empty" — root cause, fixed 2026-07-30

The first paste artifact was hand-rolled instead of using the converter's own
`write_copy_page`, and it had two independent defects. Either one alone produces
"the clipboard is empty" in the Designer:

1. **Wrong MIME type.** It used `navigator.clipboard.write` with `text/plain`.
   Webflow's paste handler reads **`application/json`**, and only the
   `document.execCommand('copy')` + `copy`-event path can set that flavour — the
   async Clipboard API cannot without a `web ` prefix.
2. **Truncated payload.** The Transformation chapter carries a `<script data-embed>`
   GSAP block, so the JSON contains a literal `</script>`, which closed the host
   `<script type="application/json">` block early and cut the payload in half.
   `write_copy_page` escapes `</` to `<\/`; JSON reads `\/` as `/`, so it round-trips.

The converter was **not** at fault — `write_copy_page` already handled both. The fix is
`make_paste_page.py`, which wraps that same proven function around a post-processed
payload (needed because `--copy-page` runs at conversion time, before `resolve_fluid`).

Verified in a real browser: the payload block parses, `type` is `@webflow/XscpData`,
36 styles / 78 nodes / 2 embeds, 0 CSS functions.

**Never hand-roll a copy page.** Use `make_paste_page.py`.
