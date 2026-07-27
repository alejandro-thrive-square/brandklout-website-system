# NOTES — "The Ledger"

- **The one idea:** the thesis equation is staged as an accounting ledger, not
  a centered slogan — an itemized line ("Strategy + Experience + Function")
  sits above a ruled total row where "= Profit" is set at nearly double the
  size under a double hairline (an accountant's total bar), in an asymmetric
  hero (statement left, offset case-reel theater lower-right) instead of the
  centered/pinned hero the brand has already tried twice. Section-to-section
  "color fields" (ink → ink-2 → amber-tinted-near-black → blue-tinted-near-
  black → ink) replace the wandering-orb morph, and Engagement/Pricing is the
  one bold accent block: a full-bleed solid `--wz-yellow` field, which is the
  most literal "profit" moment on the page.
- **Key motion moments:** a GSAP curtain-up on the hero (no scroll-jack, just
  a staggered fade/rise keyed off `data-boot-delay`); per-element `ScrollTrigger`
  reveals that respect each section's original `data-delay` stagger; a native
  (no-GSAP) word-fill on the mid-page statement; native count-up stats on
  `IntersectionObserver`; a capability marquee with a real play/pause control;
  a desktop-only custom cursor; and a light desktop-only scroll parallax on
  the hero theater card via `ScrollTrigger` scrub (not a pin).
- **Removed:** the always-on `initDust` canvas and `grain` overlay entirely
  (no ambient rAF loop anywhere on the page); the 300svh pinned hero and its
  manual `--hp` scroll-jack lerp; the wandering `.scene-orb`.
- **Offline/robustness stance:** GSAP, ScrollTrigger, and Lenis are loaded
  from CDN but treated as 100% optional — every hidden/animated start state is
  set *by the script itself* (`gsap.set(...)`), never by default CSS, so a
  blocked or offline CDN leaves the page fully visible, laid out, and usable
  with zero motion rather than stuck mid-transition. `prefers-reduced-motion`
  short-circuits every JS animation block up front, plus a CSS catch-all.
- **Biggest risk:** the "total bar" hero readability at small viewports — the
  double-rule under "= Profit" and the two-tier ledger type scale needed
  explicit mobile overrides (see `@media (max-width: 680px)` in `style.css`)
  to avoid the total line ever out-scaling its container; worth a real-device
  pass before shipping. Second risk: the yellow accent block is a strong,
  unapologetic move — if the advisor wants a quieter pricing section, it's a
  fast revert to a `field-ink-2` background with no other structural change.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
