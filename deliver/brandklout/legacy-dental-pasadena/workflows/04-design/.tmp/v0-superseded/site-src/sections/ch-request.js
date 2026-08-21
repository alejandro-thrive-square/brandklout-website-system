/* =============================================================================
   SECTION: ch-request
   The consultation hero. The form card is the point of the page, so it arrives
   last and settles after everything reassuring is already in place.

   There is no submit handling and no endpoint here. `Form creation and
   redirect to thank you page` (Asana 1217658612249899) is Gauge Hill's task.
   The only behaviour is the entrance, plus surfacing the browser's own
   validation so a failed submit does not silently do nothing on a phone.
   ============================================================================= */
WZ.section('ch-request', function (W) {
  var sec  = document.querySelector('.ch-request'),
      card = document.getElementById('consultForm');

  if (!W.reduced) {
    gsap.timeline({ delay: .2 })
      .from(sec.querySelector('.label'), { opacity: 0, y: 14, duration: .7, ease: 'power3.out' })
      .from(sec.querySelector('.rq__doc'), { opacity: 0, y: 20, duration: .8, ease: 'power3.out' }, .5)
      .from(sec.querySelectorAll('.rq__assure li'), { opacity: 0, x: -14, duration: .6,
        stagger: .07, ease: 'power3.out' }, '<0.1')
      .from(card, { opacity: 0, y: 46, duration: 1.1, ease: 'power4.out' }, .35);
  }

  if (!card) return;
  card.addEventListener('submit', function (e) {
    if (card.checkValidity()) return;
    e.preventDefault();
    var bad = card.querySelector(':invalid');
    if (bad) {
      bad.focus();
      if (bad.reportValidity) bad.reportValidity();
    }
  });
});
