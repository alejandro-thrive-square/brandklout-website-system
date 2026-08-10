/* CHAPTER 05 — THE PLACE (pinned, scrubbed): a marker travels the practice
   details while the map settles behind them. */
WZ.add(function (W) {
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

  var mm = gsap.matchMedia();
  mm.add('(min-width: 760px)', function () {
    return W.scrub(
      { trigger: pin, start: 'top top', end: '+=120%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
      paint
    );
  });
  mm.add('(max-width: 759px)', function () {
    return W.scrub({ trigger: pin, start: 'top 78%', end: 'bottom 60%', scrub: 0.35 }, paint);
  });
});
WZ.staticPaint(function () {
  document.querySelectorAll('[data-detail]').forEach(function (d) { d.classList.add('is-on'); });
});
