/**
 * marquee-infinite.js
 * ===========================================================================
 * Creates infinite scrolling marquee from elements with [data-marquee].
 * Content is cloned to fill the viewport and animated via CSS transforms
 * for silky smooth, GPU-accelerated movement.
 *
 * Dependencies: None (vanilla JS + CSS transforms)
 *
 * Usage:
 *   <script src="marquee-infinite.js"></script>
 *
 *   <div data-marquee data-marquee-speed="1" data-marquee-direction="left">
 *     <span>Item One</span>
 *     <span>Item Two</span>
 *     <span>Item Three</span>
 *   </div>
 *
 *   <!-- Vertical marquee -->
 *   <div data-marquee data-marquee-direction="up" data-marquee-speed="0.5"
 *        style="height:300px; overflow:hidden;">
 *     <div>Row 1</div>
 *     <div>Row 2</div>
 *     <div>Row 3</div>
 *   </div>
 *
 *   <!-- Pause on hover -->
 *   <div data-marquee data-marquee-pause-hover="true">
 *     <img src="logo1.svg" alt=""> <img src="logo2.svg" alt="">
 *   </div>
 *
 * Attributes:
 *   data-marquee                          Marks element as a marquee
 *   data-marquee-speed="1"                Speed multiplier (default: 1)
 *   data-marquee-direction="left"         Direction: left, right, up, down
 *   data-marquee-pause-hover="true"       Pause on hover (default: false)
 *
 * Version: 1.0.0
 * ===========================================================================
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Inject base styles ---- */
  var STYLE_ID = 'marquee-infinite-styles';
  if (!document.getElementById(STYLE_ID)) {
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.mi-wrapper {',
      '  display: flex;',
      '  width: max-content;',
      '  will-change: transform;',
      '}',
      '.mi-wrapper--vertical {',
      '  flex-direction: column;',
      '  width: 100%;',
      '  height: max-content;',
      '}',
      '.mi-clone { flex-shrink: 0; }',
      '[data-marquee] { overflow: hidden; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ---- Helpers ---- */

  function toBool(val, fallback) {
    if (val === null || val === undefined) return fallback;
    return val === 'true' || val === '1';
  }

  /* ---- Marquee instances ---- */
  var instances = [];

  /**
   * Set up a single marquee element.
   */
  function setupMarquee(el) {
    var speed = parseFloat(el.getAttribute('data-marquee-speed'));
    if (isNaN(speed) || speed <= 0) speed = 1;

    var direction = (el.getAttribute('data-marquee-direction') || 'left').toLowerCase();
    var pauseOnHover = toBool(el.getAttribute('data-marquee-pause-hover'), false);
    var isVertical = direction === 'up' || direction === 'down';
    var isReverse = direction === 'right' || direction === 'down';

    // Reduced motion — do nothing, show static content
    if (prefersReducedMotion) return;

    // Create wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'mi-wrapper' + (isVertical ? ' mi-wrapper--vertical' : '');

    // Move children into a content container
    var contentHTML = el.innerHTML;
    var contentEl = document.createElement('div');
    contentEl.className = 'mi-clone';
    contentEl.innerHTML = contentHTML;

    // Clear original and build structure
    el.innerHTML = '';
    wrapper.appendChild(contentEl);

    // Clone content enough times to fill the viewport + extra
    // We start with 2 clones and add more after measurement
    var clone1 = contentEl.cloneNode(true);
    wrapper.appendChild(clone1);

    el.appendChild(wrapper);

    // Measure and add clones if needed
    requestAnimationFrame(function () {
      var containerSize = isVertical ? el.offsetHeight : el.offsetWidth;
      var contentSize = isVertical ? contentEl.offsetHeight : contentEl.offsetWidth;

      if (contentSize === 0) return;

      // Ensure we have enough clones to fill the container seamlessly
      var clonesNeeded = Math.ceil(containerSize / contentSize) + 1;
      var currentClones = 2; // original + clone1

      while (currentClones < clonesNeeded + 1) {
        var extraClone = contentEl.cloneNode(true);
        wrapper.appendChild(extraClone);
        currentClones++;
      }

      // Animation state
      var position = 0;
      var paused = false;
      var pixelsPerFrame = speed * 0.8; // base speed

      function animate() {
        if (!paused) {
          position += pixelsPerFrame;

          // Reset position when we've scrolled one content-width/height
          if (position >= contentSize) {
            position -= contentSize;
          }
        }

        var translateVal = isReverse ? position : -position;

        if (isVertical) {
          wrapper.style.transform = 'translate3d(0, ' + translateVal + 'px, 0)';
        } else {
          wrapper.style.transform = 'translate3d(' + translateVal + 'px, 0, 0)';
        }

        rafId = requestAnimationFrame(animate);
      }

      var rafId = requestAnimationFrame(animate);

      // Pause on hover
      if (pauseOnHover) {
        el.addEventListener('mouseenter', function () { paused = true; });
        el.addEventListener('mouseleave', function () { paused = false; });
      }

      // Store for cleanup
      instances.push({
        el: el,
        wrapper: wrapper,
        originalHTML: contentHTML,
        destroy: function () {
          cancelAnimationFrame(rafId);
          el.innerHTML = contentHTML;
        }
      });
    });
  }

  /* ---- Init ---- */

  function init() {
    var elements = document.querySelectorAll('[data-marquee]');
    if (!elements.length) return;

    elements.forEach(function (el) {
      if (el.hasAttribute('data-marquee-initialized')) return;
      el.setAttribute('data-marquee-initialized', 'true');
      setupMarquee(el);
    });
  }

  /* ---- Auto-initialise ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Public API ---- */
  window.MarqueeInfinite = {
    init: init,
    destroy: function () {
      instances.forEach(function (inst) {
        inst.destroy();
        inst.el.removeAttribute('data-marquee-initialized');
      });
      instances = [];
    }
  };
})();
