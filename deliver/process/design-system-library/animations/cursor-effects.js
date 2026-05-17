/**
 * cursor-effects.js
 * ===========================================================================
 * Custom cursor effects for desktop: a small dot cursor and a larger follower.
 * Elements can trigger grow, text label, or invert effects on hover.
 * Automatically hidden on touch devices.
 *
 * Dependencies: None (vanilla JS + CSS transitions)
 *
 * Usage:
 *   <script src="cursor-effects.js"></script>
 *
 *   <a href="#" data-cursor="grow">Hover me</a>
 *   <div data-cursor="text:View Project">Card</div>
 *   <section data-cursor="invert">Dark section</section>
 *
 * Attributes:
 *   data-cursor="grow"          Cursor grows on hover
 *   data-cursor="text:Label"    Shows text label on hover
 *   data-cursor="invert"        Inverts cursor colors (mix-blend-mode)
 *
 * The script injects its own styles. No external CSS needed.
 *
 * Version: 1.0.0
 * ===========================================================================
 */
(function () {
  'use strict';

  /* ---- Touch device detection ---- */
  function isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  if (isTouchDevice()) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Inject styles ---- */
  var STYLE_ID = 'cursor-effects-styles';
  if (!document.getElementById(STYLE_ID)) {
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '/* cursor-effects.js injected styles */',
      '.ce-cursor-dot {',
      '  position: fixed;',
      '  top: 0; left: 0;',
      '  width: 8px; height: 8px;',
      '  background: #000;',
      '  border-radius: 50%;',
      '  pointer-events: none;',
      '  z-index: 99999;',
      '  transform: translate(-50%, -50%);',
      '  transition: width 0.25s ease, height 0.25s ease, background 0.25s ease, opacity 0.25s ease;',
      '  mix-blend-mode: difference;',
      '}',
      '.ce-cursor-follower {',
      '  position: fixed;',
      '  top: 0; left: 0;',
      '  width: 36px; height: 36px;',
      '  border: 1.5px solid rgba(0,0,0,0.3);',
      '  border-radius: 50%;',
      '  pointer-events: none;',
      '  z-index: 99998;',
      '  transform: translate(-50%, -50%);',
      '  transition: width 0.35s ease, height 0.35s ease, border-color 0.35s ease, opacity 0.35s ease, background 0.35s ease;',
      '}',
      '.ce-cursor-dot.ce-grow { width: 50px; height: 50px; opacity: 0.5; }',
      '.ce-cursor-follower.ce-grow { width: 70px; height: 70px; }',
      '.ce-cursor-dot.ce-invert { background: #fff; }',
      '.ce-cursor-follower.ce-invert { border-color: #fff; }',
      '.ce-cursor-label {',
      '  position: fixed;',
      '  top: 0; left: 0;',
      '  pointer-events: none;',
      '  z-index: 100000;',
      '  transform: translate(-50%, -50%);',
      '  font-family: inherit;',
      '  font-size: 12px;',
      '  font-weight: 600;',
      '  letter-spacing: 0.05em;',
      '  text-transform: uppercase;',
      '  color: #000;',
      '  background: #fff;',
      '  padding: 6px 14px;',
      '  border-radius: 20px;',
      '  white-space: nowrap;',
      '  opacity: 0;',
      '  transition: opacity 0.25s ease;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ---- Create cursor elements ---- */
  var dot = document.createElement('div');
  dot.className = 'ce-cursor-dot';
  var follower = document.createElement('div');
  follower.className = 'ce-cursor-follower';
  var label = document.createElement('div');
  label.className = 'ce-cursor-label';

  /* ---- State ---- */
  var mouse = { x: 0, y: 0 };
  var dotPos = { x: 0, y: 0 };
  var followerPos = { x: 0, y: 0 };
  var currentEffect = null;

  /* ---- Lerp for smooth following ---- */
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /* ---- Animation loop ---- */
  function animate() {
    var dotSpeed = prefersReducedMotion ? 1 : 0.8;
    var followerSpeed = prefersReducedMotion ? 1 : 0.15;

    dotPos.x = lerp(dotPos.x, mouse.x, dotSpeed);
    dotPos.y = lerp(dotPos.y, mouse.y, dotSpeed);
    followerPos.x = lerp(followerPos.x, mouse.x, followerSpeed);
    followerPos.y = lerp(followerPos.y, mouse.y, followerSpeed);

    dot.style.left = dotPos.x + 'px';
    dot.style.top = dotPos.y + 'px';
    follower.style.left = followerPos.x + 'px';
    follower.style.top = followerPos.y + 'px';
    label.style.left = dotPos.x + 'px';
    label.style.top = (dotPos.y - 30) + 'px';

    requestAnimationFrame(animate);
  }

  /* ---- Event listeners ---- */

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  function findCursorTarget(el) {
    while (el) {
      if (el.hasAttribute && el.hasAttribute('data-cursor')) return el;
      el = el.parentElement;
    }
    return null;
  }

  function onMouseOver(e) {
    var target = findCursorTarget(e.target);
    if (!target) return;

    var value = target.getAttribute('data-cursor');

    if (value === 'grow') {
      currentEffect = 'grow';
      dot.classList.add('ce-grow');
      follower.classList.add('ce-grow');
    } else if (value === 'invert') {
      currentEffect = 'invert';
      dot.classList.add('ce-invert');
      follower.classList.add('ce-invert');
    } else if (value.indexOf('text:') === 0) {
      currentEffect = 'text';
      var text = value.substring(5);
      label.textContent = text;
      label.style.opacity = '1';
      dot.style.opacity = '0';
    }
  }

  function onMouseOut(e) {
    var target = findCursorTarget(e.target);
    if (!target) return;

    clearEffects();
  }

  function clearEffects() {
    dot.classList.remove('ce-grow', 'ce-invert');
    follower.classList.remove('ce-grow', 'ce-invert');
    label.style.opacity = '0';
    dot.style.opacity = '1';
    currentEffect = null;
  }

  /* ---- Init ---- */
  function init() {
    document.body.appendChild(dot);
    document.body.appendChild(follower);
    document.body.appendChild(label);

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);

    // Hide default cursor on the whole page
    var bodyCursorStyle = document.createElement('style');
    bodyCursorStyle.textContent = '*, *::before, *::after { cursor: none !important; }';
    document.head.appendChild(bodyCursorStyle);

    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Public API ---- */
  window.CursorEffects = {
    init: init,
    destroy: function () {
      dot.remove();
      follower.remove();
      label.remove();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
    }
  };
})();
