/* CHAPTER 06 — THE TERMS: financing matrix rows deal in from the left, so
   the table reads as a sequence of routes rather than a wall of text. */
WZ.add(function (W) {
  gsap.from('#matrixBody tr', {
    opacity: 0,
    x: -30,
    duration: 0.75,
    stagger: 0.09,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#matrixBody', start: 'top 85%' },
  });
});
