/* WZ runtime for the Hackensack home page (concept 04).
 *
 * The composition at rest is the concept's. Motion is layered on top of it and never changes where
 * anything sits: reveals as the concept has them, and three scenes where scroll drives the content
 * (the patient's sentence, the four steps, the before and after).
 *
 * Two layers. The interface layer (anchors, FAQ, call bar) runs on every visit. The motion layer
 * runs only when <html> carries .motion: GSAP loaded and no reduced-motion request. Every reveal
 * is a ScrollTrigger; no visibility observers.
 *
 * Contract with the gates (tools/instatic-site/gates/check-pages.mjs): window.WZ.ok, WZ.smoother,
 * WZ.active, and pinned triggers that carry an id.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var WZ = (window.WZ = { ok: false, smoother: null, active: [], build: 'hackensack-home-concept-04' });
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mark = function (name) { WZ.active.push(name); };
  var MOTION = root.classList.contains('motion') && !!(window.gsap && window.ScrollTrigger);
  var refreshSoon = (function () {
    var t;
    return function () { clearTimeout(t); t = setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 150); };
  })();

  /* ================= interface ================= */

  /* in-page anchors */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (WZ.smoother) WZ.smoother.scrollTo(target, true, 'top 12px');
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 12, behavior: MOTION ? 'smooth' : 'auto' });
  });

  /* FAQ: one answer open at a time, as the concept opens with its first */
  $$('[data-faq]').forEach(function (list) {
    var items = $$('details', list);
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) items.forEach(function (other) { if (other !== d) other.open = false; });
        refreshSoon();
      });
    });
  });

  /* the phone call bar steps aside while the consultation form is on screen */
  var callbar = $('.mobile-cta');
  var form = $('#consultation');
  if (callbar && form) {
    var ticking = false;
    var check = function () {
      ticking = false;
      var r = form.getBoundingClientRect();
      callbar.classList.toggle('is-away', r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.25);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
    check();
  }

  if (!MOTION) { WZ.ok = true; mark('interface'); return; }

  /* ================= motion ================= */
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  var INK = '#292824';
  var EASE = 'power3.out';
  var mm = gsap.matchMedia();

  /* smooth scroll on desktop only */
  if (window.matchMedia('(min-width: 992px)').matches && ScrollTrigger.isTouch !== 1) {
    WZ.smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 0.9, effects: false });
    root.classList.add('smooth');
    mark('smoother');
  }
  root.classList.add('is-armed');

  /* headlines: lines rise out of a mask; the split redoes itself when fonts or width change */
  $$('[data-split]').forEach(function (el) {
    var hero = el.getAttribute('data-split') === 'hero';
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.lines, {
          yPercent: 108, duration: hero ? 1.25 : 1.05, stagger: 0.1, ease: 'power4.out', delay: hero ? 0.1 : 0,
          scrollTrigger: hero ? null : { trigger: el, start: 'top 88%', once: true }
        });
      }
    });
  });
  mark('split');

  /* ---- hero ---- */
  var hero = $('.hero');
  if (hero) {
    var frame = $('[data-hero-frame]', hero);
    var heroImg = $('[data-hero-img]', hero);
    gsap.fromTo(frame, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'power4.inOut' });
    gsap.fromTo(heroImg, { scale: 1.22 }, { scale: 1.06, duration: 2.2, ease: EASE });
    gsap.from($$('[data-rise]', hero), { y: 34, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: EASE, delay: 0.25 });
    gsap.from($('.quote-card', hero), { y: 30, autoAlpha: 0, duration: 0.9, ease: EASE, delay: 1.1 });
    /* leaving: the photograph drifts inside its window */
    gsap.to(heroImg, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    mark('hero');
  }

  /* reveals, as the concept has them: 34px up and in */
  $$('[data-rise]').forEach(function (el) {
    if (hero && hero.contains(el)) return;
    gsap.from(el, { y: 34, autoAlpha: 0, duration: 0.85, ease: EASE, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  $$('[data-stagger]').forEach(function (box) {
    gsap.from(box.children, { y: 24, autoAlpha: 0, duration: 0.75, stagger: 0.09, ease: EASE, scrollTrigger: { trigger: box, start: 'top 88%', once: true } });
  });
  $$('[data-wipe]').forEach(function (el) {
    gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
  });
  $$('[data-parallax]').forEach(function (el) {
    var img = $('img', el);
    var p = parseFloat(el.getAttribute('data-parallax')) || 0.08;
    gsap.set(img, { scale: 1.02 + p * 1.3 });
    gsap.fromTo(img, { yPercent: -p * 50 }, { yPercent: p * 50, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  mark('reveals');

  /* ---- scene 1: the patient's sentence is written by the scroll, then Eat / Smile / Live arrive ---- */
  var story = $('#story-scene');
  var quote = story && $('[data-words]', story);
  var words = quote ? SplitText.create(quote, { type: 'words', wordsClass: 'wd' }).words : [];
  var benefits = story ? $$('[data-lit] > div', story) : [];
  var writeStory = function (tl) {
    return tl
      .fromTo(words, { y: 6 }, { y: 0, color: INK, duration: 0.2, stagger: 0.2, ease: 'none' })
      .fromTo(benefits, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.6, ease: 'power2.out' }, '>-0.2')
      .to({}, { duration: 0.5 });
  };

  /* ---- scene 2: the four steps light up in order ---- */
  var proc = $('#process-scene');
  var steps = proc ? $$('.step', proc) : [];
  var lightSteps = function (tl) {
    steps.forEach(function (step, i) {
      tl.fromTo(step, { '--lit': 0 }, { '--lit': 1, duration: 1, ease: 'none' }, i)
        .fromTo($$('h3, p', step), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12, ease: 'power2.out' }, i + 0.15)
        .fromTo($('.n', step), { scale: 0.86 }, { scale: 1, transformOrigin: 'left bottom', duration: 0.7, ease: 'power2.out' }, i);
    });
    return tl.to({}, { duration: 0.4 });
  };

  /* ---- scene 3: scroll is the before and after ---- */
  var gallery = $('#results-scene');
  var cases = gallery ? $$('[data-case]', gallery) : [];
  var wipe = function (tl, c, at) {
    return tl
      .fromTo($('.result__after', c), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'none' }, at)
      .fromTo($('.result__line', c), { left: '0%' }, { left: '100%', duration: 1, ease: 'none' }, '<')
      .to($('.result__line', c), { autoAlpha: 0, duration: 0.06 }, '>-0.06');
  };

  /* desktop: the page holds while each scene plays (same width as the stylesheet's two-column layouts) */
  mm.add('(min-width: 992px)', function () {
    if (story) {
      writeStory(gsap.timeline({ scrollTrigger: { trigger: story, start: 'center center', end: '+=110%', pin: true, scrub: 0.4 } }));
      mark('story');
    }
    if (proc) {
      lightSteps(gsap.timeline({ scrollTrigger: { trigger: proc, start: 'center center', end: '+=130%', pin: true, scrub: 0.5 } }));
      mark('process');
    }
    if (gallery) {
      var tl = gsap.timeline({ scrollTrigger: { trigger: gallery, start: 'center center', end: '+=220%', pin: true, scrub: 0.5 } });
      cases.forEach(function (c, i) { wipe(tl, c, i ? '>+0.25' : 0); });
      tl.to({}, { duration: 0.3 });
      mark('results');
    }
  });

  /* tablet and phone: nothing is pinned; the same scenes are scrubbed by where they are on screen */
  mm.add('(max-width: 991px)', function () {
    if (quote) writeStory(gsap.timeline({ scrollTrigger: { trigger: quote, start: 'top 82%', end: 'bottom 35%', scrub: 0.4 } }));
    steps.forEach(function (step) {
      gsap.timeline({ scrollTrigger: { trigger: step, start: 'top 88%', end: 'top 45%', scrub: 0.4 } })
        .fromTo(step, { '--lit': 0 }, { '--lit': 1, duration: 1, ease: 'none' }, 0)
        .fromTo($$('h3, p', step), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12 }, 0);
    });
    cases.forEach(function (c) {
      wipe(gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 70%', end: 'top 12%', scrub: 0.4 } }), c, 0);
    });
    mark('scrubbed');
  });

  /* continuity: reading progress along the top edge */
  gsap.to('#navProgress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* Triggers were created by kind, not in page order, and pins higher up push everything below
     them. Sort by position and measure again, or a reveal below a pin fires early. */
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  window.addEventListener('load', refreshSoon);
  if (document.fonts && document.fonts.load) document.fonts.load('400 1rem "Newsreader"').then(refreshSoon);

  WZ.ok = true;
})();
