/* =============================================================================
   SECTION: ch-practice
   The portrait and the three equipment panels drift at different rates, so the
   chapter has depth as it passes rather than moving as one flat sheet.
   ============================================================================= */
WZ.section('ch-practice', function (W) {
  if (W.reduced) return;

  var portrait = document.getElementById('prPortrait');
  if (portrait) {
    gsap.fromTo(portrait.querySelector('img'), { yPercent: -5 }, {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: portrait, start: 'top bottom', end: 'bottom top', scrub: .4 }
    });
  }

  gsap.utils.toArray('#prRoom .pr__panel').forEach(function (panel, i) {
    /* Each panel drifts a little further than the one before it, which is what
       separates them in depth. The images are 112% tall so there is room to
       move without exposing an edge. */
    gsap.fromTo(panel.querySelector('img'), { yPercent: -(4 + i * 2) }, {
      yPercent: (4 + i * 2), ease: 'none',
      scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: .4 }
    });
    gsap.from(panel, {
      opacity: 0, y: 40, duration: .9, ease: 'power3.out', delay: i * .08,
      scrollTrigger: { trigger: '#prRoom', start: 'top 78%', once: true }
    });
  });

  gsap.from('.pr__claims li', {
    opacity: 0, x: -16, duration: .7, stagger: .08, ease: 'power3.out',
    scrollTrigger: { trigger: '.pr__claims', start: 'top 82%', once: true }
  });
});
