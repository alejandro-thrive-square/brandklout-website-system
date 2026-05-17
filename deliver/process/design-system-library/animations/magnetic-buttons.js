/**
 * magnetic-buttons.js
 * ===========================================================================
 * Creates a magnetic hover effect on elements with [data-magnetic]. The
 * element subtly moves toward the cursor when hovering, then smoothly
 * returns to its original position on mouse leave.
 *
 * Dependencies: None (vanilla JS + requestAnimationFrame)
 *
 * Usage:
 *   <script src="magnetic-buttons.js"></script>
 *
 *   <button data-magnetic>Hover me</button>
 *   <a href="#" data-magnetic data-magnetic-strength="0.5">Strong pull</a>
 *   <div data-magnetic data-magnetic-strength="0.1">Subtle pull</div>
 *
 * Attributes:
 *   data-magnetic                     Marks element for magnetic effect
 *   data-magnetic-strength="0.3"      Pull strength (0-1, default: 0.3)
 *
 * Notes:
 *   - Disabled on touch devices
 *   - Uses requestAnimationFrame for smooth animation
 *   - Respects prefers-reduced-motion (disables effect)
 *
 * Version: 1.0.0
 * ===========================================================================
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Touch device guard ---- */
  function isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  if (isTouchDevice() || prefersReducedMotion) return;

  /* ---- State ---- */
  var activeElements = [];

  /* ---- Helpers ---- */

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Set up magnetic behaviour for a single element.
   */
  function setupMagnetic(el) {
    var strength = parseFloat(el.getAttribute('data-magnetic-strength'));
    if (isNaN(strength) || strength < 0 || strength > 1) strength = 0.3;

    var state = {
      el: el,
      strength: strength,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      isHovering: false,
      rafId: null
    };

    // Ensure the element has relative/absolute positioning for transform
    var computed = window.getComputedStyle(el);
    if (computed.position === 'static') {
      el.style.position = 'relative';
    }

    // Set will-change for performance
    el.style.willChange = 'transform';

    function animate() {
      var smoothing = 0.15;

      state.currentX = lerp(state.currentX, state.targetX, smoothing);
      state.currentY = lerp(state.currentY, state.targetY, smoothing);

      // Stop animating if close enough to target
      if (
        Math.abs(state.currentX - state.targetX) < 0.01 &&
        Math.abs(state.currentY - state.targetY) < 0.01 &&
        !state.isHovering
      ) {
        state.currentX = state.targetX;
        state.currentY = state.targetY;
        el.style.transform = 'translate(0px, 0px)';
        state.rafId = null;
        return;
      }

      el.style.transform =
        'translate(' + state.currentX.toFixed(2) + 'px, ' + state.currentY.toFixed(2) + 'px)';

      state.rafId = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (!state.rafId) {
        state.rafId = requestAnimationFrame(animate);
      }
    }

    function onMouseMove(e) {
      var rect = el.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;

      var distX = e.clientX - centerX;
      var distY = e.clientY - centerY;

      state.targetX = distX * state.strength;
      state.targetY = distY * state.strength;
      state.isHovering = true;
      startAnimation();
    }

    function onMouseEnter() {
      state.isHovering = true;
      el.addEventListener('mousemove', onMouseMove, { passive: true });
    }

    function onMouseLeave() {
      state.isHovering = false;
      state.targetX = 0;
      state.targetY = 0;
      el.removeEventListener('mousemove', onMouseMove);
      startAnimation();
    }

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);

    state.cleanup = function () {
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mousemove', onMouseMove);
      if (state.rafId) cancelAnimationFrame(state.rafId);
      el.style.transform = '';
      el.style.willChange = '';
    };

    activeElements.push(state);
  }

  /* ---- Init ---- */

  function init() {
    var elements = document.querySelectorAll('[data-magnetic]');
    if (!elements.length) return;

    elements.forEach(function (el) {
      // Avoid double-init
      if (el.hasAttribute('data-magnetic-initialized')) return;
      el.setAttribute('data-magnetic-initialized', 'true');
      setupMagnetic(el);
    });
  }

  /* ---- Auto-initialise ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Public API ---- */
  window.MagneticButtons = {
    init: init,
    destroy: function () {
      activeElements.forEach(function (state) {
        state.cleanup();
        state.el.removeAttribute('data-magnetic-initialized');
      });
      activeElements = [];
    }
  };
})();
