/* =============================================================================
   SECTION: ch-arrival
   The hero. Layered entrance, a price card that arrives after the headline has
   landed, and a slow push on the footage so the chapter departs rather than
   simply scrolling away.
   ============================================================================= */
WZ.section('ch-arrival', function (W) {
  var sec = document.querySelector('.ch-arrival'),
      bg  = sec.querySelector('.ch-arrival__bg'),
      vid = document.getElementById('heroVideo'),
      price = sec.querySelector('.ar-price'),
      meta = sec.querySelectorAll('.ar-meta div'),
      cue  = sec.querySelector('.cue');

  /* Some browsers reject the autoplay promise even when muted. Catching it
     leaves the poster in place instead of throwing into the console. */
  if (vid && vid.play) { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); }

  if (W.reduced) {
    if (vid) { vid.pause(); vid.removeAttribute('autoplay'); }
    return;
  }

  gsap.set(cue, { opacity: 0 });
  gsap.timeline({ delay: .25 })
    .from(sec.querySelector('.label'), { opacity: 0, y: 16, duration: .8, ease: 'power3.out' })
    .from(price, { opacity: 0, y: 30, duration: 1, ease: 'power3.out' }, .55)
    .from(sec.querySelectorAll('.ar-actions > *'), { opacity: 0, y: 18, duration: .7,
      stagger: .08, ease: 'power3.out' }, '<0.1')
    .from(meta, { opacity: 0, y: 20, duration: .7, stagger: .07, ease: 'power3.out' }, '<0.1')
    .to(cue, { opacity: 1, duration: .6 }, '<0.2');

  /* Departure. The footage pushes in slightly and the copy recedes as the
     chapter leaves, so moving on feels like leaving a room rather than
     scrolling past a picture. Scale never lands exactly on 1: that is what
     causes edge flicker. */
  gsap.fromTo(bg, { scale: 1.001 }, {
    scale: 1.14, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: .3 }
  });
  gsap.to(sec.querySelector('.wrap'), {
    opacity: 0, y: -60, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: .3 }
  });
});
