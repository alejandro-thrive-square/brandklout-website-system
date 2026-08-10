/* CHAPTER 00 — ARRIVAL: the receipt stamp (SIGNATURE) + scrubbed departure. */
WZ.add(function (W) {
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
});
