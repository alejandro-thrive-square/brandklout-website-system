/* CHAPTER 02 — THE WORK (pinned, scrubbed index): a marker travels the
   service index and the stage changes to whatever it has reached. */
WZ.add(function (W) {
  var pin = document.getElementById('workPin');
  var rows = gsap.utils.toArray('[data-svc]');
  var marker = document.getElementById('workMarker');
  var card = document.getElementById('workCard');
  var icon = document.getElementById('workIcon');
  var title = document.getElementById('workTitle');
  var tag = document.getElementById('workTag');
  var num = document.getElementById('workNum');
  var rail = document.getElementById('workRail');
  var index = document.getElementById('workIndex');
  if (!pin || !rows.length || !marker) return;

  var current = -1;

  var show = function (i) {
    if (i === current) return;
    current = i;
    var row = rows[i];
    /* The stage swaps rather than cross-fades: one element, one owner of
       opacity, so nothing can be stranded half-visible. */
    gsap.fromTo(
      card,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', overwrite: true }
    );
    icon.src = row.getAttribute('data-icon');
    title.textContent = row.textContent.trim();
    tag.textContent = row.getAttribute('data-tag');
    num.textContent = String(i + 1).padStart(2, '0');
    rows.forEach(function (r, j) { r.classList.toggle('is-on', j === i); });
  };

  var paint = function (p) {
    /* The marker is the continuous readout: it travels the whole index in
       step with scroll, independently of which row happens to be active. */
    var span = index.clientHeight - marker.clientHeight;
    gsap.set(marker, { y: span * p });
    show(Math.min(rows.length - 1, Math.floor(p * rows.length * 0.999)));
    if (rail) gsap.set(rail, { scaleX: p });
  };

  var mm = gsap.matchMedia();
  mm.add('(min-width: 760px)', function () {
    return W.scrub(
      { trigger: pin, start: 'top top', end: '+=190%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
      paint
    );
  });
  mm.add('(max-width: 759px)', function () {
    return W.scrub({ trigger: pin, start: 'top 78%', end: 'bottom 55%', scrub: 0.35 }, paint);
  });
});
/* Without the pin the index cannot drive the stage, so the six services
   become a plain list and the stage shows the first of them. */
WZ.staticPaint(function () {
  document.querySelectorAll('[data-svc]').forEach(function (r) { r.classList.add('is-on'); });
});
