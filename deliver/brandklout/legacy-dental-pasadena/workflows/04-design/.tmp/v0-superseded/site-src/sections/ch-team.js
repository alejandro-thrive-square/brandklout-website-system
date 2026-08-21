/* =============================================================================
   SECTION: ch-team
   One wide photograph of the actual team, wiped in and drifting against the
   scroll.
   ============================================================================= */
WZ.section('ch-team', '#tmMedia', function (W) {
  var media = document.getElementById('tmMedia');
  if (W.reduced) return;

  gsap.fromTo(media.querySelector('img'), { yPercent: -4 }, {
    yPercent: 4, ease: 'none',
    scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: .4 }
  });
  gsap.from(media, {
    clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: media, start: 'top 80%', once: true }
  });
});
