## DONE 2026-08-26 (session 15e): the mobile flicker, actually fixed

Pins #4/#5 came back: "the flickering keeps going on". They were right, and the
earlier fix (swipe fallback on Chapter 05, grayscale off touch) addressed a real
cost but not THE cause.

### The cause: ScrollTrigger's pin strategy, flipped by ScrollSmoother's presence

ScrollTrigger pins one of two ways and chooses SILENTLY. No smoother -> native
`position:fixed`, the browser holds the chapter, zero per-frame work. Smoother
present -> `pinType:'transform'`, and the pinned element's `translateY` is
rewritten from JS on EVERY scroll update. Measured mid-pin, same scroll depth:

    Webflow  (no smoother)  #tPin  position:fixed   transform: identity
    Instatic (smoother on)  #tPin  position:static  transform: translateY(1350.5px)

On a phone those writes land late whenever the main thread is busy — and it is
busy, see the third-party note below — so the pinned chapter drifts against the
finger. That is the flicker.

**`smoothTouch:false` does NOT prevent this.** It disables the EASING on touch;
the smoother is still instantiated, and instantiation alone flips the pin
strategy. Both sites had byte-identical `create()` options, which is exactly why
a source diff found nothing and a runtime probe found it immediately.

### Why Webflow looked "fixed" — it never was

Webflow's `#smooth-wrapper` element never survived the conversion, and its boot
carries a guard Instatic had lost:

    // Webflow  — skipped, the wrapper is not in the DOM
    if(!W.reduced && window.ScrollSmoother && document.getElementById('smooth-wrapper')){
    // Instatic — no guard, wrapper present, always creates
    if(!W.reduced && window.ScrollSmoother){

There was no custom-code fix on Webflow to copy. It is smooth by accident.

### The fix  `push-mobile-smoother-fix.mjs`

Smoother is now desktop-only (`(hover:none) and (pointer:coarse)` gates it, the
same condition ch-path.js uses), and `<html>` gets `.wz-smooth` ONLY after
`create()` succeeds. Verified live: mobile has no smoother, `position:fixed`,
identity transform; desktop unchanged (smoother on, `wz-smooth`, wrapper clipped).

### Gotchas earned this session

- **`#smooth-wrapper{overflow:hidden}` must be scoped to `.wz-smooth`.** Ship the
  JS without the CSS and a phone gets no smoother AND a clipping full-height
  wrapper: the page cannot scroll AT ALL. Both halves go in ONE `saveShell` —
  `files[]` and `styleRules` both live on the shell, so that is possible.
- **A scroll harness that does not assert it MOVED is measuring nothing.** The
  first A/B stubbed the plugin alone, so two of three runs travelled 0px and
  reported a flattering p50 16.7ms / 0% long frames — for a stationary page. Any
  frame-timing run now gates on `moved > 1000` before it counts.
- **Printing a regex `.source` raw hides ``** — the terminal eats the
  backspace and a correct pattern reads as broken. `JSON.stringify` it.
- **Emulation.setTouchEmulationEnabled DOES flip `(pointer:coarse)`/`(hover:none)`**
  under `mobile:true`, so headless runs exercise the real touch branches —
  confirmed rather than assumed (`probe-pointer.mjs`).
- **Third-party JS still dominates the main thread.** Same chapter, live vs the
  identical local build: 87,276ms vs 35,442ms total, with ~9.3s in one
  `normal?lang=auto` script from inside a third-party iframe. The home page
  carries three: the LeadConnector/reputationhub review widget, YouTube and
  Vimeo. NOT addressed — it is the largest remaining lever and it needs a
  decision (defer the widget, poster-click the videos).
- Chapter 04 remains the only pinned section on mobile; Chapter 05 stays on the
  swipe build.

### Analysis tooling added (08-qa/.tmp)

`probe-pointer.mjs`, `probe-pintype.mjs` (DESKTOP=1 for the desktop half),
`probe-nosmoother-regressions.mjs`, `smoothness-ab.mjs`, and a `--no-smoother`
flag on `mobile-pin-profile.mjs`.
