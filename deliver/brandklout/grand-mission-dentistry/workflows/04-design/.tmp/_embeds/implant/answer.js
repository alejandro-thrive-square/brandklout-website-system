/* CHAPTER 02 — THE ANSWER (pinned, scrubbed scan): a scan line travels the
   implant, the photo resolves behind it, six reasons light as it passes. */
WZ.add(function (W) {
  var pin = document.getElementById('answerPin');
  var lit = document.getElementById('scanLit');
  var line = document.getElementById('scanLine');
  var plate = lit && lit.parentElement;
  var reasons = gsap.utils.toArray('[data-reason]');
  var survival = document.getElementById('survivalNum');
  var years = document.getElementById('yearsNum');
  var rail = document.getElementById('answerRail');
  if (!pin || !lit || !plate) return;

  var paint = function (p) {
    var travelled = (p * 100).toFixed(2);
    lit.style.clipPath = 'inset(0 0 ' + (100 - travelled) + '% 0)';
    gsap.set(line, { y: plate.clientHeight * p });
    reasons.forEach(function (row, i) {
      /* Each reason owns a sixth of the travel and lights once the line has
         actually reached it. */
      row.classList.toggle('is-lit', p >= i / reasons.length + 0.02);
    });
    if (survival) survival.textContent = (96.8 * p).toFixed(1) + '%';
    if (years) years.textContent = Math.round(40 * p) + ' yrs';
    if (rail) gsap.set(rail, { scaleX: p });
  };

  var mm = gsap.matchMedia();
  mm.add('(min-width: 760px)', function () {
    return W.scrub(
      { trigger: pin, start: 'top top', end: '+=150%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
      paint
    );
  });
  mm.add('(max-width: 759px)', function () {
    return W.scrub({ trigger: pin, start: 'top 82%', end: 'bottom 60%', scrub: 0.35 }, paint);
  });

  gsap.from('.answer__copy > .chapter-tag, .answer__title, .answer__lede', {
    opacity: 0,
    y: 26,
    duration: 0.9,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: { trigger: pin, start: 'top 72%' },
  });
});
/* Motion off must never mean content off: ship the scene resolved. */
WZ.staticPaint(function () {
  document.querySelectorAll('[data-reason]').forEach(function (r) { r.classList.add('is-lit'); });
  var lit = document.getElementById('scanLit');
  if (lit) lit.style.clipPath = 'none';
  var line = document.getElementById('scanLine');
  if (line) line.style.display = 'none';
});
