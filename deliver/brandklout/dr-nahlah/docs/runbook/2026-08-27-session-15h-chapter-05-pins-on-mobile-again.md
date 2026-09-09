## DONE 2026-08-27 (session 15h): Chapter 05 PINS on mobile again

Client: "not currently sticky like it should be". They meant the pinned
horizontal scrub — Webflow pins `pathPin` on mobile and that is the interaction
they compare against. The swipe carousel was never what they asked for.

### refreshPriority is the whole fix

Flipping touch back to `buildPinned` alone renders Chapters 04 and 05 ON TOP OF
EACH OTHER. With two pinned sections ScrollTrigger measures in CREATION order,
and ch-path builds before ch-transformation — so it measured `#pathPin` before
ch-04's 2,700px pin-spacer was in the flow and started 2,700px early, landing
inside ch-04's range:

    broken   tPin 5393->8093   pathPin 6237->7685    (pathPin INSIDE tPin)
    fixed    tPin 5393->8093   pathPin 8937->10385   (starts after tPin ends)
    webflow  tPin 5709->8409   pathPin 9144->10400   (same shape)

`ScrollTrigger.refresh()` does NOT repair it — the ranges come back identical.
`refreshPriority: 1` on ch-transformation (higher refreshes first) and `0` on
ch-path does. Live now: tPin 5644->8345, pathPin 9189->10637.

Grayscale reveal ungated too (`.wz-fine .ch-path .pa-card .pa-shot img` ->
`.ch-path ...`): Webflow shows it on mobile, and the reason it was withheld —
repainting filtered images every frame inside a TRANSFORM-pinned ancestor — no
longer applies now that pinning is native `fixed`.

### The honest cost

Frame delivery through the chapter, 6x CPU, real touch scroll:

    local pinned   p50 33.4ms  p95 116.5ms  long 70.9%
    local swipe    p50 33.2ms  p95  67.1ms  long 55.6%
    LIVE pinned    p50 50.0ms  p95 133.0ms  long 78.2%
    webflow        p50 33.4ms  p95  83.3ms  long 72.3%

p50 is IDENTICAL between pinned and swipe on a clean page — the swipe build never
made vertical scrolling smoother, its win only ever showed on a horizontal swipe.
But live pinned (50ms) is worse than Webflow pinned (33ms), and the difference is
third-party: three iframes here (LeadConnector review widget, YouTube, Vimeo)
against two there. That is the remaining lever, unchanged and unaddressed.

### Gotchas

- **Two pinned sections need `refreshPriority`.** Creation order is not DOM
  order, a stale measurement puts one pin inside another, and `refresh()` will
  not save you. Anything that adds a second pin to a page must set it.
- **`buildSwipe`, its `is-swipe` CSS and the IntersectionObserver reveal are now
  DEAD CODE** — unreachable since touch pins again. Left in place deliberately
  in case the client reverses on the trade-off; strip both (JS and the 7
  `.ch-path.is-swipe*` registry rules) once the pinned build is confirmed on a
  real device.
