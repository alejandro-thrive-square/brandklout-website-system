/* CHAPTER 03 — THE STANDARD (pinned, scrubbed pillars). */
WZ.add(function (W) {
  var pin = document.getElementById('pillarsPin');
  var pillars = gsap.utils.toArray('[data-pillar]');
  var bar = document.getElementById('pillarBar');
  if (!pin || !pillars.length) return;

  var paint = function (p) {
    if (bar) gsap.set(bar, { scaleX: p });
    pillars.forEach(function (pl, i) {
      pl.classList.toggle('is-active', p >= i / pillars.length + 0.03);
    });
  };

  var mm = gsap.matchMedia();
  mm.add('(min-width: 760px)', function () {
    return W.scrub(
      { trigger: pin, start: 'top top', end: '+=140%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
      paint
    );
  });
  mm.add('(max-width: 759px)', function () {
    return W.scrub({ trigger: pin, start: 'top 80%', end: 'bottom 55%', scrub: 0.35 }, paint);
  });
});
/* A dimmed pillar list would read as a page that failed to load. */
WZ.staticPaint(function () {
  document.querySelectorAll('[data-pillar]').forEach(function (p) { p.classList.add('is-active'); });
});
