/* =============================================================================
   SECTION: ch-fasttrack           PINNED + SCRUBBED

   The thank-you page's scroll-driven scene. The rail is drawn downward by the
   scroll and each step lights as the line reaches it, so the three stages
   arrive in the order they will actually happen rather than all at once.
   ============================================================================= */
WZ.section('ch-fasttrack', function (W) {
  var pin   = document.getElementById('ftPin'),
      fill  = document.getElementById('ftFill'),
      steps = Array.prototype.slice.call(document.querySelectorAll('.ft__step'));

  function paint(p) {
    gsap.set(fill, { scaleY: p });
    steps.forEach(function (s) {
      s.classList.toggle('is-on', p >= parseFloat(s.getAttribute('data-at')));
    });
  }

  if (W.reduced) { paint(1); return; }

  paint(0);
  var state = { p: 0 };
  gsap.to(state, {
    p: 1, ease: 'none',
    onUpdate: function () { paint(state.p); },
    scrollTrigger: {
      trigger: pin, start: 'top top',
      end: '+=' + Math.round(window.innerHeight * 1.9),
      pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true
    }
  });
});
