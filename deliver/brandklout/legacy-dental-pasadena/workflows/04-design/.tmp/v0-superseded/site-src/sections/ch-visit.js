/* =============================================================================
   SECTION: ch-visit
   Three steps, staggered in, and the clock line last so it reads as a footnote
   to them rather than as a fourth step.
   ============================================================================= */
WZ.section('ch-visit', '#vsGrid', function (W) {
  if (W.reduced) return;
  gsap.from('#vsGrid .vs__step', {
    opacity: 0, y: 34, duration: .9, stagger: .09, ease: 'power3.out',
    scrollTrigger: { trigger: '#vsGrid', start: 'top 80%', once: true }
  });
  gsap.from('.vs__clock', {
    opacity: 0, duration: .8, delay: .35, ease: 'power2.out',
    scrollTrigger: { trigger: '#vsGrid', start: 'top 80%', once: true }
  });
});
