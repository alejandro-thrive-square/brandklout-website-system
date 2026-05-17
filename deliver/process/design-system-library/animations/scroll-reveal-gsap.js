/**
 * scroll-reveal-gsap.js
 * ===========================================================================
 * Automatically animates elements with [data-reveal] on scroll using GSAP
 * ScrollTrigger. Supports multiple reveal styles and configurable timing.
 *
 * Dependencies:
 *   - GSAP 3.x          (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js)
 *   - ScrollTrigger 3.x  (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js)
 *
 * Usage:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
 *   <script src="scroll-reveal-gsap.js"></script>
 *
 *   <div data-reveal="fade-up">Hello</div>
 *   <div data-reveal="fade-left" data-reveal-delay="0.3" data-reveal-duration="1">Hi</div>
 *   <ul data-reveal-stagger="0.1">
 *     <li data-reveal="fade-up">One</li>
 *     <li data-reveal="fade-up">Two</li>
 *   </ul>
 *
 * Supported reveal types:
 *   fade-up | fade-down | fade-left | fade-right | scale | rotate
 *
 * Optional attributes:
 *   data-reveal-delay="0.2"      Delay in seconds before animation starts
 *   data-reveal-duration="0.8"   Animation duration in seconds
 *   data-reveal-stagger="0.1"    Stagger children (place on parent element)
 *
 * Version: 1.0.0
 * ===========================================================================
 */
(function () {
  'use strict';

  /* ---- Reduced-motion guard ---- */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Dependency check ---- */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn(
      '[scroll-reveal-gsap] GSAP and/or ScrollTrigger not detected. ' +
      'Please load them before this script.'
    );
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---- Default config ---- */
  var DEFAULTS = {
    duration: 0.8,
    delay: 0,
    ease: 'power2.out',
    start: 'top 85%',
    toggleActions: 'play none none none'
  };

  /* ---- Animation presets (from → to) ---- */
  var presets = {
    'fade-up':    { from: { opacity: 0, y: 60 },  to: { opacity: 1, y: 0 } },
    'fade-down':  { from: { opacity: 0, y: -60 }, to: { opacity: 1, y: 0 } },
    'fade-left':  { from: { opacity: 0, x: -60 }, to: { opacity: 1, x: 0 } },
    'fade-right': { from: { opacity: 0, x: 60 },  to: { opacity: 1, x: 0 } },
    'scale':      { from: { opacity: 0, scale: 0.8 }, to: { opacity: 1, scale: 1 } },
    'rotate':     { from: { opacity: 0, rotation: 15 }, to: { opacity: 1, rotation: 0 } }
  };

  /**
   * Parse a numeric data attribute or return fallback.
   */
  function num(el, attr, fallback) {
    var val = el.getAttribute(attr);
    if (val === null) return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  }

  /**
   * Apply reveal to a single element.
   */
  function revealElement(el, stagger) {
    var type = el.getAttribute('data-reveal') || 'fade-up';
    var preset = presets[type];

    if (!preset) {
      console.warn('[scroll-reveal-gsap] Unknown reveal type: "' + type + '"');
      preset = presets['fade-up'];
    }

    var duration = num(el, 'data-reveal-duration', DEFAULTS.duration);
    var delay = num(el, 'data-reveal-delay', DEFAULTS.delay);

    if (prefersReducedMotion) {
      // Instantly show without motion
      gsap.set(el, preset.to);
      return;
    }

    // Set initial state
    gsap.set(el, preset.from);

    var tweenVars = Object.assign({}, preset.to, {
      duration: duration,
      delay: delay + (stagger || 0),
      ease: DEFAULTS.ease,
      scrollTrigger: {
        trigger: el,
        start: DEFAULTS.start,
        toggleActions: DEFAULTS.toggleActions
      }
    });

    gsap.to(el, tweenVars);
  }

  /**
   * Process stagger containers — parents with data-reveal-stagger
   * whose children carry data-reveal.
   */
  function processStaggerContainers() {
    var containers = document.querySelectorAll('[data-reveal-stagger]');
    var staggeredEls = new Set();

    containers.forEach(function (parent) {
      var staggerVal = num(parent, 'data-reveal-stagger', 0.1);
      var children = parent.querySelectorAll('[data-reveal]');

      children.forEach(function (child, index) {
        staggeredEls.add(child);
        revealElement(child, index * staggerVal);
      });
    });

    return staggeredEls;
  }

  /**
   * Initialise all reveals.
   */
  function init() {
    // Process stagger groups first
    var staggeredEls = processStaggerContainers();

    // Batch-process remaining (non-staggered) elements
    var allRevealEls = document.querySelectorAll('[data-reveal]');
    var batch = [];

    allRevealEls.forEach(function (el) {
      if (!staggeredEls.has(el)) {
        batch.push(el);
      }
    });

    // Use ScrollTrigger.batch for large sets when not staggered
    if (batch.length > 0) {
      if (prefersReducedMotion) {
        batch.forEach(function (el) { revealElement(el, 0); });
      } else {
        batch.forEach(function (el) { revealElement(el, 0); });
      }
    }
  }

  /* ---- Auto-initialise ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
