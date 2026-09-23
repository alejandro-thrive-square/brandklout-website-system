/**
 * lottie-integration.js
 * ===========================================================================
 * Helper for loading and controlling Lottie animations. Auto-initialises
 * elements with [data-lottie] and supports scroll, hover, and autoplay
 * triggers via IntersectionObserver.
 *
 * Dependencies:
 *   - Lottie Web (https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js)
 *
 * Usage:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
 *   <script src="lottie-integration.js"></script>
 *
 *   <!-- Autoplay -->
 *   <div data-lottie="animations/hero.json"
 *        data-lottie-trigger="auto"
 *        data-lottie-loop="true"
 *        style="width:300px;height:300px;"></div>
 *
 *   <!-- Play on scroll into view -->
 *   <div data-lottie="animations/icon.json"
 *        data-lottie-trigger="scroll"></div>
 *
 *   <!-- Play on hover -->
 *   <div data-lottie="animations/button.json"
 *        data-lottie-trigger="hover"
 *        data-lottie-loop="false"></div>
 *
 * Attributes:
 *   data-lottie="path/to/animation.json"  Path to the Lottie JSON file
 *   data-lottie-trigger="scroll"          Trigger: "auto", "scroll", "hover"
 *   data-lottie-loop="true"               Loop animation (default: false)
 *
 * Version: 1.0.0
 * ===========================================================================
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Dependency check ---- */
  if (typeof lottie === 'undefined' && typeof bodymovin === 'undefined') {
    console.warn(
      '[lottie-integration] Lottie library not detected. Please load lottie-web ' +
      '(or bodymovin) before this script.\n' +
      'CDN: https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'
    );
    return;
  }

  var lottieLib = typeof lottie !== 'undefined' ? lottie : bodymovin;

  /* ---- Storage for animation instances ---- */
  var instances = [];

  /* ---- Helpers ---- */

  function toBool(val, fallback) {
    if (val === null || val === undefined) return fallback;
    return val === 'true' || val === '1';
  }

  /**
   * Create and configure a Lottie animation instance for an element.
   */
  function createInstance(el) {
    var path = el.getAttribute('data-lottie');
    if (!path) {
      console.warn('[lottie-integration] Element missing data-lottie path:', el);
      return null;
    }

    var trigger = (el.getAttribute('data-lottie-trigger') || 'auto').toLowerCase();
    var loop = toBool(el.getAttribute('data-lottie-loop'), false);
    var autoplay = trigger === 'auto' && !prefersReducedMotion;

    var anim = lottieLib.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: loop,
      autoplay: autoplay,
      path: path
    });

    // If reduced motion, show first frame only
    if (prefersReducedMotion) {
      anim.goToAndStop(0, true);
      return { el: el, anim: anim, trigger: trigger };
    }

    // Trigger: scroll — play when visible
    if (trigger === 'scroll') {
      anim.goToAndStop(0, true);
      setupScrollTrigger(el, anim);
    }

    // Trigger: hover — play on mouseenter
    if (trigger === 'hover') {
      anim.goToAndStop(0, true);
      setupHoverTrigger(el, anim);
    }

    return { el: el, anim: anim, trigger: trigger };
  }

  /**
   * Set up IntersectionObserver to play animation on scroll into view.
   */
  function setupScrollTrigger(el, anim) {
    var hasPlayed = false;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !hasPlayed) {
          anim.play();
          hasPlayed = true;
          // If not looping, unobserve after first play
          if (!anim.loop) {
            observer.unobserve(el);
          }
        }
        // For looping animations, pause when out of view for performance
        if (!entry.isIntersecting && anim.loop && hasPlayed) {
          anim.pause();
          hasPlayed = false; // allow replay when scrolled back
        }
      });
    }, {
      threshold: 0.2
    });

    observer.observe(el);
  }

  /**
   * Set up hover trigger — play on mouseenter, reverse or reset on mouseleave.
   */
  function setupHoverTrigger(el, anim) {
    el.addEventListener('mouseenter', function () {
      anim.setDirection(1);
      anim.play();
    });

    el.addEventListener('mouseleave', function () {
      if (anim.loop) {
        anim.pause();
      } else {
        anim.setDirection(-1);
        anim.play();
      }
    });
  }

  /* ---- Init ---- */

  function init() {
    var elements = document.querySelectorAll('[data-lottie]');
    if (!elements.length) return;

    elements.forEach(function (el) {
      // Avoid double-init
      if (el.hasAttribute('data-lottie-initialized')) return;
      el.setAttribute('data-lottie-initialized', 'true');

      var instance = createInstance(el);
      if (instance) {
        instances.push(instance);
      }
    });
  }

  /* ---- Auto-initialise ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Public API ---- */
  window.LottieIntegration = {
    init: init,
    getInstances: function () { return instances; },
    /**
     * Destroy all Lottie instances and clean up.
     */
    destroy: function () {
      instances.forEach(function (inst) {
        inst.anim.destroy();
        inst.el.removeAttribute('data-lottie-initialized');
      });
      instances = [];
    }
  };
})();
