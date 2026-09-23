/* =============================================================================
   SECTION: ch-received
   The signature moment on the thank-you page. The aligner shell draws first,
   then the twelve teeth fill in from the centre outward, which is the order a
   person reads an arch in. Pure stroke work: nothing is fetched to do it.
   ============================================================================= */
WZ.section('ch-received', '#rcStamp', function (W) {
  var stamp = document.getElementById('rcStamp'),
      arc   = stamp.querySelector('.rc-arc'),
      teeth = Array.prototype.slice.call(stamp.querySelectorAll('.rc-tooth'));

  if (W.reduced) {
    gsap.set([arc].concat(teeth), { strokeDashoffset: 0 });
    return;
  }

  /* Order centre outward, so the two central incisors land first. The sort key
     is the tooth's distance from the middle of the arch in its ORIGINAL
     order, captured before the array is reordered. */
  var mid = (teeth.length - 1) / 2;
  var ranked = teeth.map(function (el, i) { return { el: el, d: Math.abs(i - mid) }; });
  ranked.sort(function (a, b) { return a.d - b.d; });
  var ordered = ranked.map(function (r) { return r.el; });

  gsap.timeline({ delay: .35 })
    .to(arc, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' })
    .to(ordered, { strokeDashoffset: 0, duration: .55, stagger: .055, ease: 'power2.out' }, '-=1.05')
    .to(ordered, { fill: 'rgba(234,221,202,.14)', duration: .6, stagger: .03 }, '-=0.35');
});
