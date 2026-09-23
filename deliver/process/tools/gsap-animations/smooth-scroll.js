/**
 * smooth-scroll.js
 * ===========================================================================
 * Implements smooth anchor scrolling for all a[href^="#"] links with an
 * optional scroll progress indicator. Uses vanilla JS with
 * requestAnimationFrame — no GSAP dependency required (but coexists fine).
 *
 * Dependencies: None (vanilla JS)
 *
 * Usage:
 *   <script src="smooth-scroll.js"></script>
 *
 *   <!-- Set global offset for a fixed header (px) -->
 *   <body data-scroll-offset="80">
 *
 *   <a href="#features">Go to features</a>
 *   <section id="features">...</section>
 *
 *   <!-- Optional: add a progress bar -->
 *   <div data-scroll-progress
 *        style="position:fixed;top:0;left:0;height:3px;background:#0066ff;z-index:9999;"></div>
 *
 * Attributes:
 *   data-scroll-offset="80"  (on <body>) Pixel offset for fixed headers
 *   data-scroll-progress     Creates / powers a scroll progress bar
 *
 * Version: 1.0.0
 * ===========================================================================
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Config ---- */
  var DURATION = 800; // ms

  /**
   * Easing — ease-in-out cubic
   */
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Get the offset value from <body data-scroll-offset>.
   */
  function getOffset() {
    var val = document.body.getAttribute('data-scroll-offset');
    if (val === null) return 0;
    var n = parseInt(val, 10);
    return isNaN(n) ? 0 : n;
  }

  /**
   * Smoothly scroll to a target Y position.
   */
  function smoothScrollTo(targetY, duration) {
    var startY = window.pageYOffset || document.documentElement.scrollTop;
    var diff = targetY - startY;
    var startTime = null;

    if (Math.abs(diff) < 1) return;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var easedProgress = easeInOutCubic(progress);

      window.scrollTo(0, startY + diff * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /**
   * Handle anchor link clicks.
   */
  function handleClick(e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    var target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();

    var offset = getOffset();
    var targetRect = target.getBoundingClientRect();
    var targetY = targetRect.top + (window.pageYOffset || document.documentElement.scrollTop) - offset;

    if (prefersReducedMotion) {
      window.scrollTo(0, targetY);
    } else {
      smoothScrollTo(targetY, DURATION);
    }

    // Update URL hash without jumping
    if (history.pushState) {
      history.pushState(null, null, hash);
    }
  }

  /* ---- Scroll progress indicator ---- */

  function initProgressBar() {
    var bar = document.querySelector('[data-scroll-progress]');
    if (!bar) return;

    // Ensure basic styles
    bar.style.transformOrigin = 'left center';
    bar.style.transform = 'scaleX(0)';
    bar.style.width = '100%';
    bar.style.pointerEvents = 'none';

    function updateProgress() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = 'scaleX(' + Math.min(Math.max(progress, 0), 1) + ')';
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Initial
    updateProgress();
  }

  /* ---- Init ---- */

  function init() {
    // Delegate click events for anchor links
    document.addEventListener('click', handleClick);

    // Progress bar
    initProgressBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Public API ---- */
  window.SmoothScroll = {
    init: init,
    scrollTo: function (selector, duration) {
      var target = document.querySelector(selector);
      if (!target) return;
      var offset = getOffset();
      var targetY = target.getBoundingClientRect().top +
        (window.pageYOffset || document.documentElement.scrollTop) - offset;
      smoothScrollTo(targetY, duration || DURATION);
    }
  };
})();
