/* CHAPTER 01 — THE FAST TRACK: the call box rises into place. */
WZ.add(function (W) {
  var callBox = document.querySelector('.call-box');
  if (!callBox) return;
  gsap.from(callBox, {
    y: 40,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: callBox, start: 'top 92%' },
  });
});
