# Canary review — home page

The home page is the canary for this client: the shared shell (nav, drawer, rail, call bar, footer)
plus the most demanding sections on the site. Nothing else is built from it until the direction is
approved. 2026-09-21, local only: `node prototypes/serve.mjs` then `http://localhost:4173/home/`.

## Status

**Built and gated. Awaiting Alejandro's review of the direction; not yet shown to Brandklout.**
On approval, freeze `design-tokens.json`, the shell, the component vocabulary and `home.js` for
the rest of the batch.

## What was checked, and how

| Check | Instrument | Result |
| :--- | :--- | :--- |
| Every pinned chapter pins, is at a **different** state at 25 / 50 / 75 %, and releases | `qa/gate.mjs`, scroll-stepped at 1440 and again at 390 | Arrival, The Question, The Design, The Path: all pass, both widths |
| Scroll-written copy readable before it fills | computed colour vs ground | 5.18:1 unlit |
| Controls answer a **real click** | `page.click` / `tap` / mouse drag, never `el.click()` | review arrows, patient film open + Escape, panel hover, compare drag and arrow keys, burger open/close, form validation |
| Reading progress tracks the document | transform at 50 % scroll | 0.50 |
| Reduced motion | emulated `prefers-reduced-motion` | 0 pins, no smoother, nothing hidden, before/after at 50 % and draggable |
| Contrast | every text node against its nearest opaque ground | 0 failures at AA |
| ScrollSmoother | default URL, desktop | registered, running, 0 console errors |
| Mobile | 390×844 touch | 0 overflow, call bar on screen from the first pixel and never over the submit button, body copy 17.5 px, no text under 12.5 px |
| Horizontal overflow | `qa/walk.mjs` | 0 px at 360, 390, 768, 1024, 1440, 1920, 2560 |
| Journey architecture | `journey-audit.mjs` | PASS: 8 chapters, 4 `pin: true`, 18 scrubs, 0 IntersectionObserver, 0 band sections |
| Fluid root | `fluid-root.mjs --check` | exit 0 |
| Visual review | viewport-step frames with motion on, all seven widths, looked at | see findings |

**48 / 48** in `qa/gate-report.json`.

## Findings fixed during the canary

1. **The review arrows did nothing when clicked.** The chapter rail, fixed over the right gutter,
   sat on top of them and swallowed the click. Every visual check was clean; only the written
   click found it. The rail is now `pointer-events: none`.
2. **On phones the whole page rendered 7 % too small and the call bar fell off the screen.** The
   hero film is scaled 1.14 inside a `clip-path` window, and a clip does not contain layout
   overflow: the layout viewport grew to 418 px. `scrollWidth - innerWidth` reported 0 because
   `innerWidth` had grown with it. The window now has `overflow: hidden`, and the walk measures
   against the configured width.
3. The cosmetic panel's text box covered the patient's face; the image now re-frames as the panel
   opens, and the stacked layout is used up to 991.
4. Font URLs in `fonts/fonts.css` are relative to that file, not to the page.

## Open before this goes to the client

- **2,500+ or 2,800+ implants**: the brief says both. The page says 2,500+.
- **The complimentary first visit** is taken from the live site; confirm it is current.
- **Patient consent** for the before/after used in chapter 03 (Drive › Smile Gallery › Smile
  Makeovers, a 20-veneer case) and for the four filmed patients on a redesigned home page. The
  films are already public on the live site; the before/after pair is from the practice's own
  gallery folder. The caption names no one.
- **The Asana "Style Guide" task** is still open; this page works from the logo colour guide.
- The form is the design of the slot. Production puts the practice's GoHighLevel form there, and
  Turnstile hides that form on localhost, so it can only be proven on the staging domain.
- Not yet tested in WebKit. Brandklout's reviewer uses Safari at 1512×735; do that before staging.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../SYSTEM_RULES.md).
