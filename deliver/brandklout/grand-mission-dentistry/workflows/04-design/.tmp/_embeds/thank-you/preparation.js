/* CHAPTER 03 — THE PREPARATION (pinned, scrubbed): the two things worth
   bringing. */
WZ.add(function (W) {
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

  var mm = gsap.matchMedia();
  mm.add('(min-width: 760px)', function () {
    return W.scrub(
      { trigger: pin, start: 'top top', end: '+=120%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
      paint
    );
  });
  mm.add('(max-width: 759px)', function () {
    return W.scrub({ trigger: pin, start: 'top 80%', end: 'bottom 58%', scrub: 0.35 }, paint);
  });
});
WZ.staticPaint(function () {
  document.querySelectorAll('[data-prep]').forEach(function (p) { p.classList.add('is-active'); });
});
