/**
 * page-transitions.js
 * ===========================================================================
 * Page transition effects for multi-page sites. Intercepts same-origin link
 * clicks, plays an outgoing animation, then navigates. Falls back to instant
 * navigation if GSAP is not loaded.
 *
 * Dependencies:
 *   - GSAP 3.x (optional but recommended)
 *     https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
 *
 * Usage:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
 *   <script src="page-transitions.js"></script>
 *
 *   <!-- Set default transition on body -->
 *   <body data-transition="fade">
 *
 *   <!-- Or per-link override -->
 *   <a href="/about" data-transition="slide-left">About</a>
 *   <a href="/work" data-transition="slide-up">Work</a>
 *   <a href="/contact" data-transition="curtain">Contact</a>
 *
 * Transition types:
 *   fade        — Opacity fade out
 *   slide-left  — Content slides to the left
 *   slide-up    — Content slides upward
 *   curtain     — Overlay curtain wipes across
 *
 * Version: 1.0.0
 * ===========================================================================
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof gsap !== 'undefined';
  var isTransitioning = false;

  var TRANSITION_DURATION = 0.5; // seconds

  /* ---- Overlay element for curtain transition ---- */
  var overlay = null;

  function getOrCreateOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'pt-overlay';
    overlay.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100%',
      'height: 100%',
      'background: #000',
      'z-index: 999999',
      'pointer-events: none',
      'transform: scaleX(0)',
      'transform-origin: left center'
    ].join(';');
    document.body.appendChild(overlay);
    return overlay;
  }

  /* ---- Transition implementations ---- */

  function transitionFade(callback) {
    if (!hasGSAP) { callback(); return; }
    gsap.to(document.body, {
      opacity: 0,
      duration: TRANSITION_DURATION,
      ease: 'power2.inOut',
      onComplete: callback
    });
  }

  function transitionSlideLeft(callback) {
    if (!hasGSAP) { callback(); return; }
    gsap.to(document.body, {
      x: '-100%',
      opacity: 0,
      duration: TRANSITION_DURATION,
      ease: 'power3.inOut',
      onComplete: callback
    });
  }

  function transitionSlideUp(callback) {
    if (!hasGSAP) { callback(); return; }
    gsap.to(document.body, {
      y: '-100%',
      opacity: 0,
      duration: TRANSITION_DURATION,
      ease: 'power3.inOut',
      onComplete: callback
    });
  }

  function transitionCurtain(callback) {
    if (!hasGSAP) { callback(); return; }
    var ol = getOrCreateOverlay();
    gsap.set(ol, { transformOrigin: 'left center', scaleX: 0 });
    gsap.to(ol, {
      scaleX: 1,
      duration: TRANSITION_DURATION,
      ease: 'power2.inOut',
      onComplete: callback
    });
  }

  var transitions = {
    'fade': transitionFade,
    'slide-left': transitionSlideLeft,
    'slide-up': transitionSlideUp,
    'curtain': transitionCurtain
  };

  /**
   * Determine the transition type for a given link element.
   * Priority: link's data-transition > body's data-transition > 'fade'
   */
  function getTransitionType(link) {
    return link.getAttribute('data-transition') ||
      document.body.getAttribute('data-transition') ||
      'fade';
  }

  /**
   * Check if a link is a same-origin, navigable link.
   */
  function isSameOriginNav(link) {
    // Not a link
    if (!link || !link.href) return false;

    // External link
    try {
      var url = new URL(link.href, window.location.origin);
      if (url.origin !== window.location.origin) return false;
    } catch (e) {
      return false;
    }

    // Hash-only link on same page
    if (link.getAttribute('href').charAt(0) === '#') return false;

    // Has target
    if (link.target && link.target !== '_self') return false;

    // Download link
    if (link.hasAttribute('download')) return false;

    // Prevented via data attribute
    if (link.hasAttribute('data-no-transition')) return false;

    return true;
  }

  /* ---- Click handler ---- */

  function handleClick(e) {
    // Find closest <a>
    var link = e.target.closest('a');
    if (!link) return;
    if (!isSameOriginNav(link)) return;

    // Meta/ctrl clicks open in new tab — don't interfere
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // Already transitioning
    if (isTransitioning) {
      e.preventDefault();
      return;
    }

    // Reduced motion — navigate instantly
    if (prefersReducedMotion || !hasGSAP) {
      return; // default browser navigation
    }

    e.preventDefault();
    isTransitioning = true;

    var type = getTransitionType(link);
    var transitionFn = transitions[type] || transitions['fade'];
    var href = link.href;

    transitionFn(function () {
      window.location.href = href;
    });
  }

  /* ---- Intro animation on page load ---- */

  function introAnimation() {
    if (prefersReducedMotion || !hasGSAP) return;

    var type = document.body.getAttribute('data-transition') || 'fade';

    switch (type) {
      case 'fade':
        gsap.set(document.body, { opacity: 0 });
        gsap.to(document.body, { opacity: 1, duration: TRANSITION_DURATION, ease: 'power2.inOut' });
        break;
      case 'slide-left':
        gsap.set(document.body, { x: '100%', opacity: 0 });
        gsap.to(document.body, { x: '0%', opacity: 1, duration: TRANSITION_DURATION, ease: 'power3.out' });
        break;
      case 'slide-up':
        gsap.set(document.body, { y: '100%', opacity: 0 });
        gsap.to(document.body, { y: '0%', opacity: 1, duration: TRANSITION_DURATION, ease: 'power3.out' });
        break;
      case 'curtain':
        var ol = getOrCreateOverlay();
        gsap.set(ol, { scaleX: 1, transformOrigin: 'right center' });
        gsap.to(ol, { scaleX: 0, duration: TRANSITION_DURATION, ease: 'power2.inOut' });
        break;
    }
  }

  /* ---- Init ---- */

  function init() {
    document.addEventListener('click', handleClick);
    introAnimation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Public API ---- */
  window.PageTransitions = {
    init: init,
    navigate: function (href, type) {
      if (isTransitioning) return;
      isTransitioning = true;
      type = type || 'fade';
      var fn = transitions[type] || transitions['fade'];
      fn(function () { window.location.href = href; });
    }
  };
})();
