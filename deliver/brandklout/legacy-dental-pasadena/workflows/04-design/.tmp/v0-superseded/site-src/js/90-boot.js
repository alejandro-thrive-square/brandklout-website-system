/* ==========================================================================
   BOOT — create the smoother first, then flush every section's queued setup,
   then wire the global chrome.

   Order is load-bearing. ScrollSmoother has to exist before any ScrollTrigger
   is created, or the triggers measure against a layout that is about to be
   transformed under them.
   ========================================================================== */
(function () {
  var W = window.WZ;
  document.documentElement.classList.add('wz-ready');

  if (!W || !W.ok) {
    /* GSAP missing: reveal everything, because a readable page beats a
       beautiful one that never appears. */
    document.querySelectorAll('[data-anim="hide"]').forEach(function (el) {
      el.style.visibility = 'visible';
    });
    return;
  }

  /* Registered here and not in <head>: registering ScrollTrigger before
     document.body exists leaves its internals half-initialised, and
     ScrollSmoother then dies on getScrollFunc with "Cannot read properties of
     undefined". This whole file ships at the end of <body> for that reason. */
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  if (window.ScrollSmoother) gsap.registerPlugin(ScrollSmoother);
  if (window.SplitText)      gsap.registerPlugin(SplitText);
  if (window.Observer)       gsap.registerPlugin(Observer);

  if (!W.reduced && window.ScrollSmoother) {
    try {
      W.smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper', content: '#smooth-content',
        /* How long the page glides after the wheel stops. Every scrubbed
           trigger adds a SECOND lag on top of this one, and it is that one
           that reads as broken, so the pins run at scrub .3 and this can
           afford to be generous. */
        smooth: 1.15, effects: false, smoothTouch: false,
        /* normalizeScroll stays off. It swallows touchmove, which on a phone
           makes a pinned horizontal track fight the finger. */
        normalizeScroll: false, ignoreMobileResize: true
      });
    } catch (e) { console.warn('ScrollSmoother unavailable', e); }
  }

  W.flush();

  /* --- reading progress along the top edge of the nav --------------------- */
  var navPr = document.getElementById('navProgress');
  if (navPr) {
    gsap.to(navPr, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .25 } });
  }

  /* --- the chapter readout ----------------------------------------------- */
  var navCh = document.getElementById('navCh'),
      navNm = document.getElementById('navName'),
      navBar = document.getElementById('navBar'),
      nav = document.getElementById('nav');

  var chapters = gsap.utils.toArray('section[data-chapter]');
  /* The denominator is this page's own chapter count, not a constant: the
     three pages run 8, 3 and 6 chapters, and a hard-coded 8 would leave the
     consultation page's bar stuck at a third. */
  var last = Math.max(1, chapters.length - 1);

  chapters.forEach(function (sec) {
    var i = parseInt(sec.getAttribute('data-chapter'), 10),
        name = sec.getAttribute('data-chapter-name');
    function activate() {
      if (navCh) navCh.textContent = String(i).padStart(2, '0');
      if (navNm) navNm.textContent = name;
      if (navBar) navBar.style.setProperty('--p', (i / last).toFixed(3));
    }
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 45%',
      onEnter: activate, onEnterBack: activate
    });
  });

  if (nav) {
    ScrollTrigger.create({
      start: 40, end: 99999,
      onToggle: function (self) { nav.classList.toggle('is-solid', self.isActive); }
    });
  }

  /* --- anchors routed through the smoother, so pinned sections land right -- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (W.smoother) W.smoother.scrollTo(t, true, 'top top');
      else gsap.to(window, { duration: W.reduced ? 0 : 1, scrollTo: { y: t, autoKill: true }, ease: 'power2.inOut' });
    });
  });

  /* --- magnetic CTAs, pointer-fine only ----------------------------------- */
  if (!W.reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }),
          yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .22);
        yTo((e.clientY - r.top - r.height / 2) * .38);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* --- mobile drawer ------------------------------------------------------
     Both halves have to exist. Guarding rather than assuming keeps a page
     without a drawer from taking the refresh calls below down with it. ---- */
  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer');
  if (!burger || !drawer) { if (burger) burger.hidden = true; return finishBoot(); }

  function closeDrawer() {
    burger.classList.remove('is-open'); drawer.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked');
    if (W.smoother) W.smoother.paused(false);
  }
  burger.addEventListener('click', function () {
    var open = drawer.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
    if (W.smoother) W.smoother.paused(open);
  });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { closeDrawer(); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  finishBoot();

  /* Pinned sections measure wrong if fonts or images land late. A declaration,
     so it is hoisted and reachable from the early return above. */
  function finishBoot() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
})();
