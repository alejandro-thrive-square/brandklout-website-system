/**
 * parallax-layers.js
 * ===========================================================================
 * Creates parallax scrolling effects on elements with [data-parallax] using
 * GSAP ScrollTrigger for smooth, GPU-accelerated performance.
 *
 * Dependencies:
 *   - GSAP 3.x          (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js)
 *   - ScrollTrigger 3.x  (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js)
 *
 * Usage:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
 *   <script src="parallax-layers.js"></script>
 *
 *   <div data-parallax data-parallax-speed="0.5">Slow layer</div>
 *   <div data-parallax data-parallax-speed="-0.3" data-parallax-direction="horizontal">Reverse horizontal</div>
 *   <img data-parallax data-parallax-speed="0.2" src="bg.jpg" alt="">
 *
 * Attributes:
 *   data-parallax                        Marks element for parallax
 *   data-parallax-speed="0.5"            Speed factor (0 = fixed, 1 = normal, negative = reverse)
 *   data-parallax-direction="vertical"   "vertical" (default) or "horizontal"
 *
 * Version: 1.0.0
 * ===========================================================================
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Dependency check ---- */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn(
      '[parallax-layers] GSAP and/or ScrollTrigger not detected. ' +
      'Please load them before this script.'
    );
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---- Helpers ---- */

  function num(el, attr, fallback) {
    var val = el.getAttribute(attr);
    if (val === null) return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  }

  /* ---- Core ---- */

  function initParallax() {
    var elements = document.querySelectorAll('[data-parallax]');

    if (!elements.length) return;

    elements.forEach(function (el) {
      // Skip if reduced motion
      if (prefersReducedMotion) return;

      var speed = num(el, 'data-parallax-speed', 0.5);
      var direction = (el.getAttribute('data-parallax-direction') || 'vertical').toLowerCase();
      var isHorizontal = direction === 'horizontal';

      // The displacement amount: higher speed → more movement
      // speed=0 means no movement (fixed), speed=1 means normal scroll
      // We invert so speed < 1 feels like "slower" parallax
      var displacement = speed * 200; // px of travel through the viewport

      var fromVars = {};
      var toVars = {};

      if (isHorizontal) {
        fromVars.x = -displacement;
        toVars.x = displacement;
      } else {
        fromVars.y = -displacement;
        toVars.y = displacement;
      }

      toVars.ease = 'none';
      toVars.scrollTrigger = {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true
      };

      // Ensure hardware acceleration
      gsap.set(el, { willChange: 'transform' });
      gsap.fromTo(el, fromVars, toVars);
    });
  }

  /* ---- Auto-initialise ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParallax);
  } else {
    initParallax();
  }

  /* ---- Expose for manual re-init ---- */
  window.ParallaxLayers = { init: initParallax };
})();
