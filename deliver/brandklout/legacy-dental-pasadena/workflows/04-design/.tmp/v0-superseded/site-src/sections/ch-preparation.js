/* =============================================================================
   SECTION: ch-preparation
   Three cards, staggered in. Its own module so the chapter can move to another
   page by moving its markup, without carrying a page-level script with it.
   ============================================================================= */
WZ.section('ch-preparation', '#ppGrid', function (W) {
  if (W.reduced) return;
  gsap.from('#ppGrid .card', {
    opacity: 0, y: 34, duration: .9, stagger: .09, ease: 'power3.out',
    scrollTrigger: { trigger: '#ppGrid', start: 'top 80%', once: true }
  });
});
