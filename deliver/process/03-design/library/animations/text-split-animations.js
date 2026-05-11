/**
 * text-split-animations.js
 * ===========================================================================
 * Splits text elements into characters, words, or lines and animates them
 * individually using GSAP. Perfect for hero headings and feature callouts.
 *
 * Dependencies:
 *   - GSAP 3.x  (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js)
 *
 * Usage:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
 *   <script src="text-split-animations.js"></script>
 *
 *   <h1 data-text-split="chars" data-text-anim="slide-up">Hello World</h1>
 *   <p  data-text-split="words" data-text-anim="fade-in">Some text here</p>
 *   <h2 data-text-split="lines" data-text-anim="typewriter">Line one. Line two.</h2>
 *   <h3 data-text-split="chars" data-text-anim="wave">Wavy text</h3>
 *
 * Split modes:
 *   chars  — each character wrapped in a span
 *   words  — each word wrapped in a span
 *   lines  — text split on <br> or rendered line breaks
 *
 * Animation types:
 *   fade-in    — opacity 0 → 1 with stagger
 *   slide-up   — translates up from below with opacity
 *   typewriter — characters appear one by one
 *   wave       — characters animate in a wave pattern
 *
 * Version: 1.0.0
 * ===========================================================================
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof gsap === 'undefined') {
    console.warn(
      '[text-split-animations] GSAP not detected. Please load GSAP before this script.'
    );
    return;
  }

  /* ---- Helpers ---- */

  /**
   * Wrap each character in a span, preserving whitespace as &nbsp; between words.
   */
  function splitChars(el) {
    var text = el.textContent;
    var html = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ') {
        html += '<span class="tsa-char" style="display:inline-block;">&nbsp;</span>';
      } else if (ch === '\n') {
        html += '<br>';
      } else {
        html += '<span class="tsa-char" style="display:inline-block;">' + ch + '</span>';
      }
    }
    el.innerHTML = html;
    return el.querySelectorAll('.tsa-char');
  }

  /**
   * Wrap each word in a span.
   */
  function splitWords(el) {
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    var html = words.map(function (w) {
      return '<span class="tsa-word" style="display:inline-block;">' + w + '</span>';
    }).join('<span class="tsa-space" style="display:inline-block;">&nbsp;</span>');
    el.innerHTML = html;
    return el.querySelectorAll('.tsa-word');
  }

  /**
   * Wrap each line in a span. Uses <br> as delimiter first; falls back to
   * computed line breaks via a temporary measurement.
   */
  function splitLines(el) {
    var rawHTML = el.innerHTML;

    // If <br> tags exist, split on them
    if (/<br\s*\/?>/i.test(rawHTML)) {
      var parts = rawHTML.split(/<br\s*\/?>/i);
      el.innerHTML = parts.map(function (line) {
        return '<span class="tsa-line" style="display:block;">' + line.trim() + '</span>';
      }).join('');
      return el.querySelectorAll('.tsa-line');
    }

    // Otherwise, measure rendered lines
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) {
      return '<span class="tsa-measure" style="display:inline;">' + w + ' </span>';
    }).join('');

    var spans = el.querySelectorAll('.tsa-measure');
    var lines = [];
    var currentLine = [];
    var lastTop = null;

    spans.forEach(function (span) {
      var top = span.getBoundingClientRect().top;
      if (lastTop !== null && Math.abs(top - lastTop) > 2) {
        lines.push(currentLine.join(' '));
        currentLine = [];
      }
      currentLine.push(span.textContent.trim());
      lastTop = top;
    });
    if (currentLine.length) lines.push(currentLine.join(' '));

    el.innerHTML = lines.map(function (line) {
      return '<span class="tsa-line" style="display:block; overflow:hidden;">' +
        '<span class="tsa-line-inner" style="display:block;">' + line + '</span></span>';
    }).join('');

    return el.querySelectorAll('.tsa-line-inner');
  }

  /* ---- Animation presets ---- */

  function animFadeIn(units, el) {
    gsap.set(units, { opacity: 0 });
    gsap.to(units, {
      opacity: 1,
      duration: 0.6,
      stagger: 0.03,
      ease: 'power2.out',
      scrollTrigger: buildTrigger(el)
    });
  }

  function animSlideUp(units, el) {
    gsap.set(units, { opacity: 0, y: '100%' });
    gsap.to(units, {
      opacity: 1,
      y: '0%',
      duration: 0.6,
      stagger: 0.04,
      ease: 'power3.out',
      scrollTrigger: buildTrigger(el)
    });
  }

  function animTypewriter(units, el) {
    gsap.set(units, { opacity: 0 });
    gsap.to(units, {
      opacity: 1,
      duration: 0.01,
      stagger: 0.05,
      ease: 'none',
      scrollTrigger: buildTrigger(el)
    });
  }

  function animWave(units, el) {
    gsap.set(units, { y: 0 });
    gsap.fromTo(units,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: {
          each: 0.04,
          ease: 'sine.inOut'
        },
        ease: 'elastic.out(1, 0.5)',
        scrollTrigger: buildTrigger(el)
      }
    );
  }

  var animations = {
    'fade-in': animFadeIn,
    'slide-up': animSlideUp,
    'typewriter': animTypewriter,
    'wave': animWave
  };

  /**
   * Build a ScrollTrigger config if ScrollTrigger is available, otherwise null.
   */
  function buildTrigger(el) {
    if (typeof ScrollTrigger !== 'undefined') {
      return {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      };
    }
    return undefined;
  }

  /* ---- Init ---- */

  function init() {
    var elements = document.querySelectorAll('[data-text-split]');

    if (!elements.length) return;

    // Register ScrollTrigger if available
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    elements.forEach(function (el) {
      var splitMode = el.getAttribute('data-text-split') || 'chars';
      var animType = el.getAttribute('data-text-anim') || 'fade-in';
      var units;

      // Store original HTML for potential re-init
      if (!el.hasAttribute('data-tsa-original')) {
        el.setAttribute('data-tsa-original', el.innerHTML);
      }

      // Split
      switch (splitMode) {
        case 'chars':
          units = splitChars(el);
          break;
        case 'words':
          units = splitWords(el);
          break;
        case 'lines':
          units = splitLines(el);
          break;
        default:
          console.warn('[text-split-animations] Unknown split mode: "' + splitMode + '"');
          units = splitChars(el);
      }

      if (!units || !units.length) return;

      // Reduced motion — just show immediately
      if (prefersReducedMotion) {
        gsap.set(units, { opacity: 1, y: 0, x: 0 });
        return;
      }

      // Animate
      var animFn = animations[animType];
      if (!animFn) {
        console.warn('[text-split-animations] Unknown animation: "' + animType + '"');
        animFn = animations['fade-in'];
      }
      animFn(units, el);
    });
  }

  /* ---- Auto-initialise ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Expose re-init for SPA use ---- */
  window.TextSplitAnimations = { init: init };
})();
