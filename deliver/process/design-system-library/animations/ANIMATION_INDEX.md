# Animation Module Index

Reusable JavaScript animation modules. Each file is a standalone script that can be included via `<script>` in HTML files after loading its CDN dependencies.

## Modules

| File | Dependencies | Trigger | Description |
|:---|:---|:---|:---|
| `scroll-reveal-gsap.js` | GSAP + ScrollTrigger | `[data-reveal]` | Scroll-triggered reveal animations (fade, slide, scale, rotate) |
| `text-split-animations.js` | GSAP | `[data-text-split]` | Splits text into chars/words/lines and animates them |
| `parallax-layers.js` | GSAP + ScrollTrigger | `[data-parallax]` | Parallax scrolling effects with configurable speed/direction |
| `smooth-scroll.js` | none | `a[href^="#"]` | Smooth anchor scrolling with offset support |
| `cursor-effects.js` | none | `[data-cursor]` | Custom cursor with grow/text/invert hover effects |
| `page-transitions.js` | GSAP (optional) | `a` clicks | Page exit animations (fade, slide, curtain) |
| `lottie-integration.js` | Lottie Web | `[data-lottie]` | Auto-load and control Lottie animations |
| `counter-animation.js` | none | `[data-counter]` | Animated number counters with formatting |
| `magnetic-buttons.js` | none | `[data-magnetic]` | Magnetic hover effect pulling elements toward cursor |
| `marquee-infinite.js` | none | `[data-marquee]` | Infinite scrolling marquee in any direction |

## CDN Dependencies

```html
<!-- GSAP Core + ScrollTrigger -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

<!-- Lottie Web (only if using lottie-integration.js) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>

<!-- Anime.js (alternative to GSAP for lighter needs) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"></script>
```

## Usage Pattern

```html
<!-- 1. Load CDN dependencies -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

<!-- 2. Load animation module(s) -->
<script src="path/to/scroll-reveal-gsap.js"></script>
<script src="path/to/counter-animation.js"></script>

<!-- 3. Add data attributes to HTML elements -->
<div data-reveal="fade-up" data-reveal-delay="0.2">Content</div>
<span data-counter="1500" data-counter-prefix="$" data-counter-suffix="+">0</span>
```

## Accessibility

All modules respect `prefers-reduced-motion: reduce` by disabling or minimizing animations. Touch-only features (cursor effects, magnetic buttons) are disabled on mobile/touch devices.
