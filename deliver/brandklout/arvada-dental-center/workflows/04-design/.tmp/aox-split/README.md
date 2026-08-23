# AOX landing page — split into HTML / CSS / JS

The All-on-X page as three standalone files, for a component-copy tool that
pushes markup into Webflow. Nothing here points at a local file.

Regenerate with `node ../_shared/split-page.mjs aox` — never hand-edit these
four files, because the next run overwrites them. The page itself is
`../aox/index.html`.

| File | What it is |
| --- | --- |
| `aox.html` | Markup only. No `<style>`, no `<script>`. |
| `aox.css` | The shared journey kit, then the page's motion contract, then all eight chapter style blocks, in the order they appeared. |
| `aox.js` | `WZ` (the chapter queue and motion helpers), then all eight chapter scripts, then the boot block. |
| `preview.html` | Not part of the paste. The three files stitched back together so the split can be opened and proved. |

## Where each piece goes

**Head** — the stylesheet, or paste `aox.css` into Webflow's page custom CSS.
The `@import` at the top of the file pulls Cinzel, Montserrat and Open Sans;
drop it if those are loaded through Webflow's font settings instead.

```html
<link rel="stylesheet" href="aox.css">
```

**Before `</body>`** — GSAP from the CDN first, `aox.js` last:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollToPlugin.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollSmoother.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
<script src="aox.js"></script>
```

All five plugins are free as of GSAP 3.13 — no membership, no auth'd install.

## What will break it

- **Order.** Inside `aox.js`, `WZ` is defined first, each chapter queues its
  choreography into `WZ.add()`, and the boot block flushes that queue only
  after ScrollSmoother exists. Move the boot block and every pinned chapter
  measures a half-built page and lands in the wrong place. Same for the CSS:
  chapter styles override the shared kit by coming after it.
- **`aox.js` running in the head.** `WZ` reads `window.gsap` at definition
  time and the boot block registers plugins against `document.body`. Both
  need the body to exist.
- **Unwrapping `#smooth-wrapper` / `#smooth-content`.** ScrollSmoother
  transforms those two elements; they must stay wrapped around the page
  content and stay direct children of `<body>`.

## Before this goes live

- **Imagery.** The three photographs are the practice's own, but
  `arvadadentalcenter.com` answers cross-origin image requests with a
  SiteGround captcha page, so hotlinking it gives four broken images
  (`ERR_BLOCKED_BY_ORB`). They are served through **wsrv.nl**, a public image
  CDN that fetches server-side, which is a staging arrangement rather than the
  shipped one. Upload the originals to Webflow and swap each `src`; every
  `<img>` carries the practice's own address in `data-src-original`.
- **Two links are `#`.** They pointed at sibling pages in the local review set
  (`../implants/`, `../`), which have no Webflow slug yet. Their old targets
  are in `data-href-original`.
- **The lead form still has no endpoint.** `forms()` in `aox.js` validates the
  payload, shows the thank-you and pushes to `window.__arvadaLeads` — it posts
  nowhere, pending the GHL/CRM destination (Open Question 3).

## Verified

Rendered from `preview.html` in a focused Chrome at 1440×900: GSAP 3.13.0 and
all four plugins resolve from the CDN, ScrollSmoother is created, 48
ScrollTriggers and 3 pins register, Cinzel loads, the FAQ opens, the quiz
advances, the office-hours status resolves, and The Four chapter is genuinely
scrubbed (five distinct intermediate states across its pin range). Console
clean, no failed requests. Viewport captures at four scroll depths are
identical to the same depths on `../aox/index.html`.
