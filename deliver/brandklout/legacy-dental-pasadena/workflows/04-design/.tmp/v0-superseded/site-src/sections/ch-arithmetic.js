/* =============================================================================
   SECTION: ch-arithmetic          PINNED + SCRUBBED

   The chapter pins and the figure is driven from the top of the range the
   practice quotes for comparison ($7,500) down to its own price ($3,379).
   The ledger lines light as the number passes each one, so the figure and the
   reasons are a single animation rather than a number beside a list.

   The number IS scroll progress: at half the pin it reads a genuinely
   intermediate value, which is the check that separates a scrub from a
   trigger wearing a costume.
   ============================================================================= */
WZ.section('ch-arithmetic', function (W) {
  var pin  = document.getElementById('ariPin'),
      fig  = document.getElementById('ariFig'),
      cap  = document.getElementById('ariCap'),
      rows = Array.prototype.slice.call(document.querySelectorAll('#ariLedger li'));

  var FROM = 7500, TO = 3379;
  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };

  function paint(p) {
    var v = FROM + (TO - FROM) * p;
    fig.textContent = fmt(v);
    rows.forEach(function (li) {
      li.classList.toggle('is-on', p >= parseFloat(li.getAttribute('data-at')));
    });
    cap.textContent = p > 0.92
      ? 'All-inclusive, at Legacy Dental Pasadena'
      : 'What clear aligners usually cost';
  }

  if (W.reduced) {
    /* No motion: land on the answer rather than on the opening figure, and
       show every reason at once. */
    paint(1);
    return;
  }

  paint(0);

  var state = { p: 0 };
  gsap.to(state, {
    p: 1, ease: 'none',
    onUpdate: function () { paint(state.p); },
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: '+=' + Math.round(window.innerHeight * 2.4),
      pin: true,
      /* Low scrub on purpose. ScrollSmoother already adds a glide; a second
         lag here is the one that reads as the page arguing with you. */
      scrub: 0.3,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });
});
