/**
 * counter-animation.js
 * ===========================================================================
 * Animates numbers from 0 to a target value when scrolled into view.
 * Uses IntersectionObserver for efficient triggering and an eased
 * requestAnimationFrame loop for smooth counting.
 *
 * Dependencies: None (vanilla JS)
 *
 * Usage:
 *   <script src="counter-animation.js"></script>
 *
 *   <span data-counter="1500">0</span>
 *   <span data-counter="99.9" data-counter-decimals="1" data-counter-suffix="%">0</span>
 *   <span data-counter="25000" data-counter-prefix="$" data-counter-suffix="+">0</span>
 *   <span data-counter="3500" data-counter-duration="3">0</span>
 *
 * Attributes:
 *   data-counter="1500"            Target number
 *   data-counter-duration="2"      Animation duration in seconds (default: 2)
 *   data-counter-prefix="$"        Text before the number
 *   data-counter-suffix="+"        Text after the number
 *   data-counter-decimals="0"      Decimal places (default: 0)
 *
 * Features:
 *   - Formats numbers with commas (e.g., 1,500)
 *   - Eased animation curve for natural feel
 *   - Only animates once per element
 *   - Respects prefers-reduced-motion
 *
 * Version: 1.0.0
 * ===========================================================================
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Helpers ---- */

  /**
   * Ease-out cubic for natural deceleration.
   */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Format a number with commas as thousands separators.
   */
  function formatNumber(num, decimals) {
    var fixed = num.toFixed(decimals);
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /**
   * Parse a numeric attribute.
   */
  function numAttr(el, attr, fallback) {
    var val = el.getAttribute(attr);
    if (val === null) return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  }

  /**
   * Animate a single counter element.
   */
  function animateCounter(el) {
    var target = numAttr(el, 'data-counter', 0);
    var duration = numAttr(el, 'data-counter-duration', 2) * 1000; // ms
    var prefix = el.getAttribute('data-counter-prefix') || '';
    var suffix = el.getAttribute('data-counter-suffix') || '';
    var decimals = Math.max(0, Math.round(numAttr(el, 'data-counter-decimals', 0)));

    // Reduced motion — show final value immediately
    if (prefersReducedMotion) {
      el.textContent = prefix + formatNumber(target, decimals) + suffix;
      return;
    }

    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var easedProgress = easeOutCubic(progress);
      var current = easedProgress * target;

      el.textContent = prefix + formatNumber(current, decimals) + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Ensure exact final value
        el.textContent = prefix + formatNumber(target, decimals) + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  /* ---- IntersectionObserver ---- */

  function init() {
    var elements = document.querySelectorAll('[data-counter]');
    if (!elements.length) return;

    // Fallback: if IntersectionObserver not available, animate immediately
    if (typeof IntersectionObserver === 'undefined') {
      elements.forEach(function (el) {
        animateCounter(el);
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.3
    });

    elements.forEach(function (el) {
      // Set initial text to 0 with prefix/suffix
      var prefix = el.getAttribute('data-counter-prefix') || '';
      var suffix = el.getAttribute('data-counter-suffix') || '';
      var decimals = Math.max(0, Math.round(numAttr(el, 'data-counter-decimals', 0)));
      el.textContent = prefix + formatNumber(0, decimals) + suffix;

      observer.observe(el);
    });
  }

  /* ---- Auto-initialise ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Public API ---- */
  window.CounterAnimation = {
    init: init,
    animate: animateCounter
  };
})();
