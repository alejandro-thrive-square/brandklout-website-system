/* =============================================================================
   SECTION: ch-terms
   The three figures count up as the chapter arrives. Small numbers and a short
   count, because this is reassurance rather than a set piece: the drama on
   this funnel belongs to the landing page.
   ============================================================================= */
WZ.section('ch-terms', '#trGrid', function (W) {
  var cells = document.querySelectorAll('#trGrid .tr__cell b');

  if (W.reduced) return;

  cells.forEach(function (el) {
    /* Parse the target out of the printed value rather than duplicating it in
       script: the copy stays the single source of the number. */
    var raw = el.textContent.trim();
    var target = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
    var prefix = raw.replace(/[0-9.,]+/g, '');
    var state = { v: 0 };
    gsap.to(state, {
      v: target, duration: 1.1, ease: 'power2.out',
      onUpdate: function () {
        el.textContent = prefix + Math.round(state.v).toLocaleString('en-US');
      },
      onComplete: function () { el.textContent = raw; },
      scrollTrigger: { trigger: '#trGrid', start: 'top 78%', once: true }
    });
  });

  gsap.from('#trGrid .tr__cell', {
    opacity: 0, y: 30, duration: .85, stagger: .1, ease: 'power3.out',
    scrollTrigger: { trigger: '#trGrid', start: 'top 80%', once: true }
  });
});
