/* ==========================================================================
   THANK YOU LANDING PAGE — bespoke choreography
   Asana task 1217162605683014

     1. the receipt stamp   ← the signature moment
     2. scrubbed 3-step timeline, rail drawing as you move through it
     3. call box lift + practice map depth

   All inside WZ.add(), so it runs after ScrollSmoother exists and never runs
   at all under prefers-reduced-motion.
   ========================================================================== */
WZ.add(function (W) {
  /* ---------- 1. the receipt stamp — SIGNATURE ------------------------- */
  /* A confirmation page has one emotional job: make it look like something
     actually happened. The ring lands, the check draws itself stroke-first,
     and a ripple leaves the mark — then the headline rises. */
  var stamp = document.getElementById('stamp');
  var path = document.getElementById('stampPath');
  if (stamp && path) {
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

    /* The whole stamp drifts up a little faster than the copy on scroll. */
    gsap.to(stamp, {
      yPercent: -30,
      ease: 'none',
      scrollTrigger: { trigger: '.hero--status', start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
  }

  /* ---------- call box lifts in ---------------------------------------- */
  var callBox = document.querySelector('.call-box');
  if (callBox) {
    gsap.from(callBox, {
      y: 40,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: callBox, start: 'top 92%' },
    });
  }

  /* ---------- 2. scrubbed 3-step timeline ------------------------------ */
  /* The rail draws against scroll position and each step activates as the
     draw passes it, so "what happens next" is literally progressed through
     rather than listed. */
  var railFill = document.getElementById('expectRail');
  var cards = gsap.utils.toArray('[data-step-card]');
  if (railFill && cards.length) {
    var vertical = window.matchMedia('(max-width: 859px)').matches;

    var paint = function (progress) {
      gsap.set(railFill, vertical ? { scaleY: progress } : { scaleX: progress });
      cards.forEach(function (card, i) {
        /* Each step owns a third of the draw, and lights up once the rail has
           reached it. */
        card.classList.toggle('is-active', progress >= i / cards.length + 0.04);
      });
    };

    var proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.expect__body',
        start: 'top 78%',
        end: 'bottom 62%',
        scrub: 0.4,
      },
      onUpdate: function () { paint(proxy.p); },
    });

    /* The cards themselves rise in behind the draw. */
    gsap.from(cards, {
      y: 28,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.expect__body', start: 'top 85%' },
    });
  }

  /* ---------- 3. map depth --------------------------------------------- */
  var map = document.querySelector('.practice__map');
  if (map) {
    gsap.fromTo(
      map,
      { y: 26 },
      {
        y: -26,
        ease: 'none',
        scrollTrigger: { trigger: '#practice', start: 'top bottom', end: 'bottom top', scrub: 0.7 },
      }
    );
  }
});

/* Reduced motion never runs the timeline above, so the check has to be drawn
   already — an undrawn stroke would leave an empty circle. */
(function () {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('DOMContentLoaded', function () {
    var rail = document.getElementById('expectRail');
    if (rail) rail.style.transform = 'none';
    document.querySelectorAll('[data-step-card]').forEach(function (c) {
      c.classList.add('is-active');
    });
  });
})();
