/* =============================================================================
   SECTION: ch-evidence            PINNED + SCRUBBED. The signature moment.

   Five real cases, each a single file with the before stacked above the after.
   One pin drives five reveals: the divider rises from the bottom edge to the
   top, uncovering the after half, then the stage hands over to the next case.

   --rev is written continuously, so stopping halfway leaves the divider
   halfway. That is the point: a scene that snaps between two states is a
   triggered scene, not a scrubbed one.
   ============================================================================= */
WZ.section('ch-evidence', function (W) {
  var pin   = document.getElementById('evPin'),
      stage = document.getElementById('evStage'),
      cases = stage.querySelectorAll('.ev__case'),
      dots  = document.getElementById('evDots').children,
      no    = document.getElementById('evNo');

  var N = cases.length;

  function show(i) {
    for (var c = 0; c < N; c++) cases[c].classList.toggle('is-on', c === i);
    for (var d = 0; d < dots.length; d++) dots[d].classList.toggle('is-on', d === i);
    no.textContent = String(i + 1);
  }
  function setRev(v) { stage.style.setProperty('--rev', v.toFixed(4)); }

  if (W.reduced) {
    /* Show the result rather than an uncovered "before": a still page that
       only ever shows the problem is worse than no reveal at all. */
    show(0); setRev(1);
    return;
  }

  show(0); setRev(0);

  var state = { rev: 0, idx: 0 };
  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: '+=' + Math.round(window.innerHeight * 4.2),
      pin: true,
      scrub: 0.3,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  for (var i = 0; i < N; i++) {
    (function (idx) {
      tl.call(function () {
        if (state.idx !== idx) { state.idx = idx; show(idx); }
      }, null, tl.duration())
        .fromTo(state, { rev: 0 }, {
          rev: 1, duration: 1, ease: 'none',
          onUpdate: function () { setRev(state.rev); }
        })
        /* A beat at the top so the finished result is actually read before the
           stage moves on. */
        .to({}, { duration: 0.25 });
    })(i);
  }

  /* Scrolling back up has to restore the case index too, or the divider
     re-runs over whichever case happened to be showing. */
  tl.eventCallback('onUpdate', function () {
    var seg = Math.min(N - 1, Math.floor(tl.progress() * N));
    if (state.idx !== seg) { state.idx = seg; show(seg); }
  });
});
