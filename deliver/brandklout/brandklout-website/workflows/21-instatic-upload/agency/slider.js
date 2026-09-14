/* ---- agency/slider.js: the home hero's results slider (patches/index.html.mjs). ----
   Every slide is ordinary markup inside [data-slider-track], so it can be edited, duplicated,
   reordered or deleted in the Instatic editor. This script counts the slides when the page loads and
   builds one dot per slide, so nothing here needs changing when a slide is added. The track is a
   CSS scroll-snap strip, so it still swipes and scrolls without this script.
   Autoplay: off for reduced motion, paused on hover, focus, a hidden tab or an off-screen slider,
   and stopped for good after the visitor moves it themselves. */
(function () {
  'use strict';
  const DELAY = 6500;
  const reduced = () =>
    document.documentElement.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-slider]').forEach((slider) => {
    if (slider.dataset.sliderBound) return;
    slider.dataset.sliderBound = 'true';
    const track = slider.querySelector('[data-slider-track]');
    if (!track) return;
    const slides = [...track.children];
    const controls = slider.querySelector('[data-slider-controls]');
    if (slides.length < 2) {
      if (controls) controls.hidden = true;
      return;
    }
    const dotsBox = slider.querySelector('[data-slider-dots]');
    let index = 0;
    let timer = 0;
    let settle = 0;
    let manual = false;
    let paused = false;
    let onScreen = true;
    let programmatic = false;

    const mark = (i) => {
      index = i;
      slides.forEach((slide, n) => {
        slide.inert = n !== i;
        slide.classList.toggle('is-active', n === i);
      });
      dots.forEach((dot, n) => {
        dot.classList.toggle('is-active', n === i);
        dot.setAttribute('aria-current', n === i ? 'true' : 'false');
      });
    };
    const schedule = () => {
      clearTimeout(timer);
      if (manual || paused || !onScreen || document.hidden || reduced()) return;
      timer = setTimeout(() => go(index + 1), DELAY);
    };
    const go = (i) => {
      const n = (i + slides.length) % slides.length;
      programmatic = true;
      track.scrollTo({ left: slides[n].offsetLeft - slides[0].offsetLeft, behavior: reduced() ? 'auto' : 'smooth' });
      mark(n);
      schedule();
    };
    const move = (i) => {
      manual = true;
      go(i);
    };

    const dots = slides.map((slide, i) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'bk-slider-dot';
      dot.setAttribute('aria-label', `Show result ${i + 1} of ${slides.length}`);
      dot.addEventListener('click', () => move(i));
      dotsBox?.append(dot);
      return dot;
    });

    slider.querySelector('[data-slider-prev]')?.addEventListener('click', () => move(index - 1));
    slider.querySelector('[data-slider-next]')?.addEventListener('click', () => move(index + 1));
    track.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      move(index + (event.key === 'ArrowRight' ? 1 : -1));
    });
    // A swipe or trackpad scroll lands on a slide by itself (scroll-snap); follow it with the dots.
    track.addEventListener(
      'scroll',
      () => {
        clearTimeout(settle);
        settle = setTimeout(() => {
          if (programmatic) {
            programmatic = false;
            return;
          }
          const n = Math.min(Math.max(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)), 0), slides.length - 1);
          if (n !== index) {
            manual = true;
            mark(n);
            schedule();
          }
        }, 120);
      },
      { passive: true },
    );
    slider.addEventListener('pointerenter', () => { paused = true; schedule(); });
    slider.addEventListener('pointerleave', () => { paused = false; schedule(); });
    slider.addEventListener('focusin', () => { paused = true; schedule(); });
    slider.addEventListener('focusout', () => { paused = false; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        schedule();
      }).observe(slider);
    }
    mark(0);
    schedule();
  });
})();
