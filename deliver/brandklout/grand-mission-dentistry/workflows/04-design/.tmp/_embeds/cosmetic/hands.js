/* CHAPTER 01 — THE HANDS: the two portraits counter-drift so the pair never
   sits completely still. */
WZ.add(function (W) {
  gsap.utils.toArray('[data-doc]').forEach(function (doc, i) {
    gsap.fromTo(
      doc.querySelector('.doc__portrait'),
      { yPercent: i % 2 ? 5 : -5 },
      {
        yPercent: i % 2 ? -5 : 5,
        ease: 'none',
        scrollTrigger: { trigger: doc, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
      }
    );
  });
});
