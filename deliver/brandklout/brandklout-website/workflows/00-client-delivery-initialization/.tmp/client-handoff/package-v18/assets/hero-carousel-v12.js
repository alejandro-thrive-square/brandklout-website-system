/* BrandKlout V12 - dependency-free hero carousel.
   Autoplay: 8 seconds, suspended on hover/focus, offscreen and background tabs.
   Manual browsing pauses autoplay. Reduced motion defaults to manual browsing.
   Slide markup and claims live in index.html, not in a remote feed. */
(function () {
  'use strict';
  let controllers = [];
  function mount(root) {
    const slides = Array.from(root.querySelectorAll('.hc-slide'));
    const tabs = Array.from(root.querySelectorAll('[data-hero-select]'));
    const badges = Array.from(root.querySelectorAll('[data-hero-badge]'));
    const notes = Array.from(root.querySelectorAll('[data-hero-note]'));
    const stage = root.querySelector('.hc-stage');
    const toggle = root.querySelector('[data-hero-toggle]');
    const toggleLabel = root.querySelector('[data-hero-toggle-label]');
    const hint = root.querySelector('[data-hero-hint]');
    const position = root.querySelector('[data-hero-position]');
    const live = root.querySelector('[data-hero-announcement]');
    if (slides.length < 2 || !stage || !toggle) return { destroy() {} };
    const interval = Math.max(4000, Number(root.dataset.interval) || 8000);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aborter = new AbortController();
    const reduced = () => media.matches || document.documentElement.classList.contains('reduce-motion');
    let index = 0, elapsed = 0, last = 0, frame = 0, destroyed = false;
    let hovering = false, focused = false, onScreen = false, paused = reduced();
    let lastReduced = reduced();
    let chartFrame = 0;
    const animations = new Map();
    const listen = (target, type, fn, options) => target.addEventListener(type, fn, Object.assign({}, options, { signal: aborter.signal }));
    const counters = () => slides.flatMap(slide => Array.from(slide.querySelectorAll('[data-hero-count]')));
    function numberText(el, value) {
      const places = Number(el.dataset.decimals) || 0;
      const n = places ? value.toFixed(places) : Math.round(value).toString();
      return (el.dataset.prefix || '') + n + (el.dataset.suffix || '');
    }
    function settleCounters() {
      animations.forEach(id => cancelAnimationFrame(id)); animations.clear();
      counters().forEach(el => { el.textContent = numberText(el, Number(el.dataset.heroCount)); });
    }
    function animateSlide() {
      cancelAnimationFrame(chartFrame);
      settleCounters();
      const slide = slides[index];
      slides.forEach(s => s.classList.remove('hc-visual-ready'));
      if (reduced() || !onScreen) { slide.classList.add('hc-visual-ready'); return; }
      chartFrame = requestAnimationFrame(() => {
        chartFrame = requestAnimationFrame(() => {
          if (destroyed || !slide.classList.contains('is-active')) return;
          slide.classList.add('hc-visual-ready');
          slide.querySelectorAll('[data-hero-count]').forEach(el => {
            const value = Number(el.dataset.heroCount), start = performance.now();
            const update = now => {
              if (destroyed || !el.isConnected || !slide.classList.contains('is-active')) return;
              const progress = Math.min((now - start) / 950, 1);
              el.textContent = numberText(el, value * (1 - Math.pow(1 - progress, 3)));
              if (progress < 1) animations.set(el, requestAnimationFrame(update));
              else animations.delete(el);
            };
            animations.set(el, requestAnimationFrame(update));
          });
        });
      });
    }
    function runnable() { return !destroyed && root.isConnected && !paused && !reduced() && !hovering && !focused && onScreen && !document.hidden; }
    function paintControls() {
      const manuallyPaused = paused || reduced();
      toggle.dataset.paused = String(manuallyPaused);
      toggle.disabled = reduced();
      toggleLabel.textContent = reduced() ? 'Manual' : manuallyPaused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', reduced() ? 'Automatic rotation is off for reduced motion' : manuallyPaused ? 'Start automatic story rotation' : 'Pause automatic story rotation');
      const state = runnable() ? 'running' : 'paused';
      root.dataset.rotationState = state;
      hint.textContent = reduced() ? 'Reduced motion' : paused ? 'Manual browsing' : (hovering || focused) ? 'Paused to read' : '8s per story';
    }
    function stopClock() { cancelAnimationFrame(frame); frame = 0; last = 0; }
    function tick(now) {
      frame = 0;
      if (!runnable()) { paintControls(); last = 0; return; }
      if (last) elapsed += Math.min(now - last, 100);
      last = now;
      if (elapsed >= interval) show(index + 1, false);
      root.style.setProperty('--hero-progress', String(Math.min(elapsed / interval, 1)));
      if (runnable()) frame = requestAnimationFrame(tick);
    }
    function sync() {
      paintControls();
      if (runnable()) { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } }
      else stopClock();
    }
    function show(next, manual) {
      index = ((next % slides.length) + slides.length) % slides.length;
      elapsed = 0;
      root.style.setProperty('--hero-progress', '0');
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.toggleAttribute('inert', !active);
      });
      tabs.forEach((tab, i) => {
        tab.classList.toggle('is-active', i === index);
        tab.setAttribute('aria-pressed', String(i === index));
      });
      [badges, notes].forEach(group => group.forEach((el, i) => {
        el.classList.toggle('is-active', i === index);
        el.setAttribute('aria-hidden', String(i !== index));
      }));
      root.dataset.activeStory = slides[index].dataset.story;
      position.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      if (manual) {
        paused = true;
        live.textContent = 'Now showing ' + slides[index].getAttribute('aria-label') + '. Automatic rotation paused.';
      }
      animateSlide();
      // Automatic transitions are already inside the running tick.
      if (manual) sync();
    }
    tabs.forEach((tab, i) => listen(tab, 'click', () => show(i, true)));
    listen(root.querySelector('[data-hero-prev]'), 'click', () => show(index - 1, true));
    listen(root.querySelector('[data-hero-next]'), 'click', () => show(index + 1, true));
    listen(toggle, 'click', () => {
      if (reduced()) return;
      paused = !paused;
      elapsed = 0; root.style.setProperty('--hero-progress', '0');
      live.textContent = paused ? 'Automatic story rotation paused.' : 'Automatic story rotation enabled. It resumes when you leave the card.';
      sync();
    });
    listen(root, 'keydown', event => {
      if (!event.target.closest('.hc-controls')) return;
      let next;
      if (event.key === 'ArrowRight') next = index + 1;
      else if (event.key === 'ArrowLeft') next = index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = slides.length - 1;
      else return;
      event.preventDefault(); show(next, true); tabs[index].focus({ preventScroll: true });
    });
    listen(root, 'pointerenter', event => { if (event.pointerType !== 'touch') { hovering = true; sync(); } });
    listen(root, 'pointerleave', event => { if (event.pointerType !== 'touch') { hovering = false; sync(); } });
    listen(root, 'focusin', () => { focused = true; sync(); });
    listen(root, 'focusout', () => queueMicrotask(() => { if (!destroyed) { focused = root.contains(document.activeElement); sync(); } }));
    listen(document, 'visibilitychange', sync);
    let startTouch = null, suppressUntil = 0;
    listen(stage, 'pointerdown', event => {
      if (event.pointerType === 'touch') startTouch = { x:event.clientX, y:event.clientY, id:event.pointerId };
    }, { passive:true });
    listen(stage, 'pointercancel', () => { startTouch = null; });
    listen(stage, 'pointerup', event => {
      if (!startTouch || event.pointerId !== startTouch.id) return;
      const dx = event.clientX - startTouch.x, dy = event.clientY - startTouch.y; startTouch = null;
      if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.5) { suppressUntil = performance.now() + 450; show(index + (dx < 0 ? 1 : -1), true); }
    }, { passive:true });
    listen(stage, 'click', event => { if (performance.now() < suppressUntil) { suppressUntil = 0; event.preventDefault(); event.stopPropagation(); } }, { capture:true });
    const visibility = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const wasVisible = onScreen;
        onScreen = entry.isIntersecting && entry.intersectionRatio >= .35;
        if (onScreen && !wasVisible) animateSlide();
        if (!onScreen) settleCounters();
        sync();
      });
    }, { threshold:[0,.35] }) : null;
    if (visibility) visibility.observe(root); else onScreen = true;
    function motionChange() {
      const nowReduced = reduced();
      if (nowReduced === lastReduced) return;
      lastReduced = nowReduced;
      // Motion being re-enabled never silently starts a stopped carousel.
      if (nowReduced) { paused = true; settleCounters(); slides[index].classList.add('hc-visual-ready'); }
      sync();
    }
    const motionObserver = new MutationObserver(motionChange);
    motionObserver.observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
    listen(media, 'change', motionChange);
    root.classList.add('is-enhanced');
    show(0, false); sync();
    return {
      destroy() {
        destroyed = true; stopClock(); cancelAnimationFrame(chartFrame); settleCounters();
        aborter.abort(); visibility?.disconnect(); motionObserver.disconnect();
      }
    };
  }
  function destroy() { controllers.forEach(c => c.destroy()); controllers = []; }
  function init() {
    destroy();
    document.querySelectorAll('[data-hero-carousel]').forEach(root => controllers.push(mount(root)));
  }
  window.BKHeroCarousel = { init, destroy };
  window.addEventListener('pagehide', destroy);
  window.addEventListener('pageshow', event => { if (event.persisted) init(); });
  init();
})();
