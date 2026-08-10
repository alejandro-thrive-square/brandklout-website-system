/* CHAPTER 07 — THE INVITATION: the glow breathes with scroll. */
WZ.add(function (W) {
  gsap.fromTo(
    '.invitation__glow',
    { scale: 0.82, opacity: 0.45 },
    {
      scale: 1.18,
      opacity: 1,
      ease: 'none',
      scrollTrigger: { trigger: '#invitation', start: 'top bottom', end: 'bottom bottom', scrub: 0.7 },
    }
  );
});
