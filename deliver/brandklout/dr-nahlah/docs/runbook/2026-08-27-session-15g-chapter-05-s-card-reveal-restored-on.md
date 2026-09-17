## DONE 2026-08-27 (session 15g): Chapter 05's card reveal, restored on touch

Client: "I can scroll horizontally but it is not animated like on Webflow (mobile
only)". Not a bug — a gap I created and never flagged. Session 14 swapped the
pinned scrub for a native swipe on touch to kill the flicker, and the per-card
reveal went with it: the gold border, the number up from 35% and the
grayscale->colour photo ALL hang off `containerAnimation`, which only exists when
there is a scrubbed tween. Webflow still pins on mobile, so it kept them. That
was the whole difference the client was seeing.

### Restored without reintroducing the cost  `push-path-reveal.mjs`

An `IntersectionObserver` rooted on the TRACK, `rootMargin: '0px -35% 0px -35%'`
so only the middle ~30% counts, toggling `.is-live`; the animation is then CSS
transitions. One callback per card per crossing instead of per-frame JS — which
is the point, since per-frame work is why the swipe build exists at all.

The grayscale reveal is back on touch even though `.wz-fine` withholds it
elsewhere. What made it expensive was repainting a filtered image on every frame
of a SCRUB. There is no scrub here, so it transitions once per crossing.

Measured live, real touch gestures, 390x844:

    swipe across the track   p50 16.7ms, 1% of frames over 32ms
    vertical drag over it    p50 16.7ms, 0%  (page still scrolls — not trapped)
    ScrollTriggers on cards  0

### Gotchas

- **`containerAnimation` is load-bearing.** Any per-card effect written against
  it silently disappears the moment a build stops pinning. When adding a
  no-pin variant of a section, enumerate what the pinned build animates and
  decide for EACH one — do not assume the CSS carries it.
- **`track.scrollLeft = n` proves the element scrolls; it does not prove a
  finger can scroll it**, and it says nothing about whether a vertical drag over
  a horizontal scroller still moves the page. `probe-chpath-gestures.mjs`
  dispatches real touch sequences and asserts both, with frame timings.
- **NEVER `taskkill /F /IM chrome.exe`.** It matches by process NAME and killed
  the user's own browser twice. Probes now kill only their own child in a
  `finally`.
