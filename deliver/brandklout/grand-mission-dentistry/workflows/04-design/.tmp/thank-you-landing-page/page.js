/* ==========================================================================
   THANK YOU LANDING PAGE — chapter choreography
   Asana task 1217162605683014

   Six chapters. Three of them are scenes the page holds still for:

     02  The Path         pin + scrub — the rail draws through the three steps
     03  The Preparation  pin + scrub — the two things worth bringing
     05  The Place        pin + scrub — a marker travels the practice details
                          while the map settles behind them

   Plus the signature: the receipt stamp in chapter 00.

   Runs inside WZ.add(), so it executes after ScrollSmoother exists and never
   runs at all under prefers-reduced-motion.
   ========================================================================== */
WZ.add(function (W) {
  var mm = gsap.matchMedia();

  /* A scrubbed ScrollTrigger with no animation attached never fires onUpdate.
     Scrubbing a proxy gives a real 0→1 signal, and the returned function lets
     matchMedia tear the scene down cleanly at a breakpoint change. */
  function scrubScene(config, paint) {
    var proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: config,
      onUpdate: function () { paint(proxy.p); },
    });
    /* The cleanup deliberately does NOT kill the tween or its ScrollTrigger.
       Everything created inside a matchMedia callback is already owned by that
       context and reverted for us; killing it here as well double-reverts, and
       the second revert strips the pin spacers out of the layout while the
       triggers keep their old start/end values. The page then looks fine and
       is silently thousands of pixels shorter than ScrollTrigger believes, so
       every scrollTo lands in the wrong chapter. Only the class state is ours
       to reset — GSAP does not know about it. */
    return function () { paint(1); };
  }

  /* ======================================================================
     CHAPTER 00 — ARRIVAL   (the receipt stamp — SIGNATURE)
     ====================================================================== */
  (function () {
    var stamp = document.getElementById('stamp');
    var path = document.getElementById('stampPath');
    if (!stamp || !path) return;

    var length = path.getTotalLength();
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('#stampRing', { scale: 0.4, opacity: 0, duration: 0.55, ease: 'back.out(2)' })
      .fromTo(
        path,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' },
        '-=0.15'
      )
      /* The ripple starts at the ring's own size and expands past it. It never
         settles on scale 1 — a transform landing exactly on 1 can flicker as
         the browser re-rasterises. */
      .fromTo(
        '#stampRipple',
        { scale: 1.02, opacity: 0.85 },
        { scale: 1.85, opacity: 0, duration: 1.1, ease: 'power2.out' },
        '-=0.35'
      );

    var title = document.getElementById('arrivalTitle');
    var split = W.splitLines(title);
    if (split && split.lines && split.lines.length) {
      gsap.set(split.lines, { yPercent: 115 });
      tl.to(split.lines, { yPercent: 0, duration: 1, stagger: 0.09, ease: 'power4.out' }, 0.45);
    }

    /* Departure — the whole confirmation recedes as you leave it. */
    gsap
      .timeline({ scrollTrigger: { trigger: '#arrival', start: 'top top', end: 'bottom top', scrub: 0.5 } })
      .to('#arrivalInner', { yPercent: -14, opacity: 0.25, ease: 'none' }, 0)
      .to('#stamp', { yPercent: -40, ease: 'none' }, 0)
      .to('#arrivalImg', { yPercent: 6, scale: 1.08, ease: 'none' }, 0)
      .to('#arrivalVeil', { opacity: 0.7, ease: 'none' }, 0);
  })();

  /* ======================================================================
     CHAPTER 01 — THE FAST TRACK
     ====================================================================== */
  (function () {
    var callBox = document.querySelector('.call-box');
    if (!callBox) return;
    gsap.from(callBox, {
      y: 40,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: callBox, start: 'top 92%' },
    });
  })();

  /* ======================================================================
     CHAPTER 02 — THE PATH   (pinned, scrubbed)
     ====================================================================== */
  (function () {
    var pin = document.getElementById('pathPin');
    var railFill = document.getElementById('pathRail');
    var cards = gsap.utils.toArray('[data-step-card]');
    if (!pin || !railFill || !cards.length) return;

    /* The rail runs along whichever axis the steps do at this width. */
    var vertical = function () { return window.matchMedia('(max-width: 859px)').matches; };

    var paint = function (p) {
      gsap.set(railFill, vertical() ? { scaleY: p, scaleX: 1 } : { scaleX: p, scaleY: 1 });
      cards.forEach(function (card, i) {
        card.classList.toggle('is-active', p >= i / cards.length + 0.04);
      });
    };

    mm.add('(min-width: 760px)', function () {
      return scrubScene(
        { trigger: pin, start: 'top top', end: '+=130%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
        paint
      );
    });
    mm.add('(max-width: 759px)', function () {
      return scrubScene({ trigger: pin, start: 'top 78%', end: 'bottom 60%', scrub: 0.35 }, paint);
    });

    gsap.from(cards, {
      y: 28,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: pin, start: 'top 82%' },
    });
  })();

  /* ======================================================================
     CHAPTER 03 — THE PREPARATION   (pinned, scrubbed)
     ====================================================================== */
  (function () {
    var pin = document.getElementById('prepPin');
    var items = gsap.utils.toArray('[data-prep]');
    var bar = document.getElementById('prepBar');
    if (!pin || !items.length) return;

    var paint = function (p) {
      if (bar) gsap.set(bar, { scaleX: p });
      items.forEach(function (item, i) {
        item.classList.toggle('is-active', p >= i / items.length + 0.03);
      });
    };

    mm.add('(min-width: 760px)', function () {
      return scrubScene(
        { trigger: pin, start: 'top top', end: '+=120%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
        paint
      );
    });
    mm.add('(max-width: 759px)', function () {
      return scrubScene({ trigger: pin, start: 'top 80%', end: 'bottom 58%', scrub: 0.35 }, paint);
    });
  })();

  /* ======================================================================
     CHAPTER 05 — THE PLACE   (pinned, scrubbed)
     ====================================================================== */
  (function () {
    var pin = document.getElementById('placePin');
    var list = document.getElementById('placeDetails');
    var marker = document.getElementById('placeMarker');
    var details = gsap.utils.toArray('[data-detail]');
    var map = document.getElementById('placeMap');
    var bar = document.getElementById('placeBar');
    if (!pin || !list || !marker || !details.length) return;

    var paint = function (p) {
      var span = list.clientHeight - marker.clientHeight;
      gsap.set(marker, { y: span * p });
      details.forEach(function (d, i) {
        d.classList.toggle('is-on', p >= i / details.length && p < (i + 1) / details.length + 0.001);
      });
      /* The map settles as the panel is read. Scale stays above 1 at both ends
         so the frame never lands exactly on 1 and flickers its edge. */
      if (map) gsap.set(map, { scale: 1.06 - 0.045 * p });
      if (bar) gsap.set(bar, { scaleX: p });
    };

    mm.add('(min-width: 760px)', function () {
      return scrubScene(
        { trigger: pin, start: 'top top', end: '+=120%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
        paint
      );
    });
    mm.add('(max-width: 759px)', function () {
      return scrubScene({ trigger: pin, start: 'top 78%', end: 'bottom 60%', scrub: 0.35 }, paint);
    });
  })();

  /* ======================================================================
     CHAPTER 04 — THE TEAM: departure
     The range starts late on purpose — dimming a chapter while its middle is
     still being read would cost legibility to buy an effect.
     ====================================================================== */
  (function () {
    var sec = document.getElementById('team');
    if (!sec) return;
    gsap.to(sec, {
      opacity: 0.35,
      yPercent: -3,
      ease: 'none',
      scrollTrigger: { trigger: sec, start: 'bottom 30%', end: 'bottom top', scrub: 0.5 },
    });
  })();
});

/* ==========================================================================
   Reduced motion never runs any of the above, so every scene has to ship in
   its resolved state. An undrawn check would leave an empty circle, and an
   unlit step list would read as a page that failed to load.
   ========================================================================== */
(function () {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('DOMContentLoaded', function () {
    var rail = document.getElementById('pathRail');
    if (rail) rail.style.transform = 'none';
    document.querySelectorAll('[data-step-card]').forEach(function (c) { c.classList.add('is-active'); });
    document.querySelectorAll('[data-prep]').forEach(function (p) { p.classList.add('is-active'); });
    document.querySelectorAll('[data-detail]').forEach(function (d) { d.classList.add('is-on'); });
  });
})();
