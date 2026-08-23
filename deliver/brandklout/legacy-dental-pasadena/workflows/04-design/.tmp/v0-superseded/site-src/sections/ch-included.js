/* =============================================================================
   SECTION: ch-included
   The seven items tick in one at a time as the list is read, and the
   photograph drifts against the scroll so the pair is never still.
   ============================================================================= */
WZ.section('ch-included', function (W) {
  var list  = document.getElementById('incList'),
      media = document.getElementById('incMedia'),
      img   = media.querySelector('img'),
      rows  = list.querySelectorAll('li'),
      paths = list.querySelectorAll('.inc__tick svg path');

  if (W.reduced) {
    /* The tween that would have drawn the ticks never runs, so they are
       revealed here instead. Motion removed, nothing hidden. */
    gsap.set(paths, { strokeDashoffset: 0 });
    return;
  }

  gsap.from(rows, {
    opacity: 0, x: -18, duration: .7, stagger: .09, ease: 'power3.out',
    scrollTrigger: { trigger: list, start: 'top 78%', once: true }
  });

  /* The tick draws itself rather than appearing: 24 units of dash on a 24-unit
     path, offset to hidden in CSS and run back to 0 here. */
  gsap.to(paths, {
    strokeDashoffset: 0, duration: .5, stagger: .09, ease: 'power2.out',
    scrollTrigger: { trigger: list, start: 'top 78%', once: true }
  });

  gsap.fromTo(img, { yPercent: -6 }, {
    yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: .4 }
  });
});
