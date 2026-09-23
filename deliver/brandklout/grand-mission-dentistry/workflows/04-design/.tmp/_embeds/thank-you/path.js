/* CHAPTER 02 — THE PATH (pinned, scrubbed): the rail draws through the
   three steps. */
WZ.add(function (W) {
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

  var mm = gsap.matchMedia();
  mm.add('(min-width: 760px)', function () {
    return W.scrub(
      { trigger: pin, start: 'top top', end: '+=130%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
      paint
    );
  });
  mm.add('(max-width: 759px)', function () {
    return W.scrub({ trigger: pin, start: 'top 78%', end: 'bottom 60%', scrub: 0.35 }, paint);
  });

  gsap.from(cards, {
    y: 28,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: { trigger: pin, start: 'top 82%' },
  });
});
/* An unlit step list would read as a page that failed to load. */
WZ.staticPaint(function () {
  var rail = document.getElementById('pathRail');
  if (rail) rail.style.transform = 'none';
  document.querySelectorAll('[data-step-card]').forEach(function (c) { c.classList.add('is-active'); });
});
