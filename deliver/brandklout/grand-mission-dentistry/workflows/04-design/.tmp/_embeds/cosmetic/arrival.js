/* CHAPTER 00 — ARRIVAL: entrance timeline + scrubbed departure. */
WZ.add(function (W) {
  var root = document.getElementById('arrival');
  if (!root) return;

  var tl = gsap.timeline({ delay: 0.12, defaults: { ease: 'power3.out' } });
  var title = document.getElementById('arrivalTitle');
  var split = W.splitLines(title);

  if (split && split.lines && split.lines.length) {
    gsap.set(split.lines, { yPercent: 115 });
    tl.to(split.lines, { yPercent: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out' }, 0);
  } else {
    tl.from(title, { opacity: 0, y: 40, duration: 1 }, 0);
  }
  tl.from(root.querySelector('.chapter-tag'), { opacity: 0, x: -22, duration: 0.85 }, 0.05)
    .from('#arrivalImg', { opacity: 0, scale: 1.12, duration: 1.7 }, 0)
    .from('#book', { opacity: 0, y: 40, duration: 1 }, 0.5);

  /* Departure. */
  gsap
    .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.5 } })
    .to('#arrivalInner', { yPercent: -12, opacity: 0.2, ease: 'none' }, 0)
    .to('#arrivalImg', { yPercent: 6, scale: 1.1, ease: 'none' }, 0)
    .to('#arrivalVeil', { opacity: 0.75, ease: 'none' }, 0);
});
