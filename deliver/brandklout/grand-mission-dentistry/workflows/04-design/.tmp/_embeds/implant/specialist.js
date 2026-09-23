/* CHAPTER 05 — THE SPECIALIST: case gallery drift + velocity-reactive
   service marquee. */
WZ.add(function (W) {
  /* Case gallery: the four cases rise on a slight diagonal, and each drifts
     against the scroll so the block never sits completely still. */
  gsap.from('#gallery .gallery__item', {
    opacity: 0,
    y: 40,
    duration: 0.9,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#gallery', start: 'top 86%' },
  });
  gsap.utils.toArray('#gallery img').forEach(function (img, i) {
    gsap.fromTo(
      img,
      { yPercent: -4 - i, scale: 1.1 },
      {
        yPercent: 4 + i,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: { trigger: '#gallery', start: 'top bottom', end: 'bottom top', scrub: 0.7 },
      }
    );
  });

  /* Service marquee — speed and direction bend with how fast you scroll, so
     the page feels physically connected to the wheel. */
  var row = document.getElementById('svcTrack');
  if (!row) return;
  row.innerHTML += row.innerHTML; /* a seamless loop needs a duplicate */
  var half = row.scrollWidth / 2;
  var loop = gsap.to(row, {
    x: -half,
    duration: 30,
    ease: 'none',
    repeat: -1,
    modifiers: { x: function (x) { return (parseFloat(x) % half) + 'px'; } },
  });
  var vt = gsap.quickTo(loop, 'timeScale', { duration: 0.5, ease: 'power2' });
  ScrollTrigger.create({
    onUpdate: function (self) {
      var v = self.getVelocity() / 380;
      vt(gsap.utils.clamp(-7, 7, v === 0 ? 1 : v < 0 ? Math.min(-1, v) : Math.max(1, v)));
    },
  });
  ScrollTrigger.addEventListener('scrollEnd', function () { vt(1); });
});
