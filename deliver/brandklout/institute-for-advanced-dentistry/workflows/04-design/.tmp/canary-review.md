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
| Journey architecture | `journey-audit.mjs` | PASS: 8 chapters, 4 `pin: true`, 17 scrubs, 0 IntersectionObserver, 0 band sections |
| Fluid root | `fluid-root.mjs --check` | exit 0 |
| Visual review | viewport-step frames with motion on, all seven widths, looked at | see findings |

**50 / 50** in `qa/gate-report.json`.

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

## Review round 1 — Alejandro, 2026-09-21

- **Hero, at a 1347×614 window:** the left column was too tall for a stage locked to one viewport,
  and the film was cropped hard inside its clipped window. **Changed:** the stage is now as tall as
  its content (`min-height: 100svh`, no fixed height, no short-window special cases); the film sits
  in a true 16:9 frame so nothing is cropped at rest; opening it is a plain scale of that same box
  until it covers the window (full width only on a portrait screen). When the stage is taller than
  the window it pins from its bottom edge, so the buttons and the figures are read first. Two gate
  checks added: the frame is 16:9 like the film, and the opened film covers the window and is still 16:9.

## Review round 3 — light grounds only, 2026-09-21

Jessica (Brandklout): dark-theme sites do not convert. Five of the eight chapters were dark. The
stylesheet was dark-by-default with light as the exception; it is now light-by-default on ground-aware
tokens, every chapter is `data-theme="light"`, and the grounds run bone, sand, white, mist, bone,
ivory, white, sand. Gold is fills and rules only; gold text is `#74560f`. The glass panels over the
discipline photographs, the patient cards, the compare chips, the drawer, the phone call bar and the
footer all went light. Dark remains only behind a playing film and over the hero film. Gates after
the change: 50/50 local, 52/52 on staging, contrast pass clean, unlit statement 4.81:1.

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
