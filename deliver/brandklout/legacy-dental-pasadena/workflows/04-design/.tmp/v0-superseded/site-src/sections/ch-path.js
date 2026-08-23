/* =============================================================================
   SECTION: ch-path                PINNED HORIZONTAL

   The six steps travel sideways while the page holds. Distance is measured
   rather than assumed, because on a wide enough monitor the whole track is
   already on screen and pinning would hold the reader still while nothing
   moved. Above that width the chapter becomes an ordinary row and the cards
   reveal instead.
   ============================================================================= */
WZ.section('ch-path', function (W) {
  var sec   = document.querySelector('.ch-path'),
      pin   = document.getElementById('pathPin'),
      track = document.getElementById('pathTrack'),
      bar   = document.getElementById('pathBar');

  if (W.reduced) {
    /* A plain horizontal scroll region, still fully reachable by keyboard. */
    sec.classList.add('is-static');
    track.style.overflowX = 'auto';
    return;
  }

  function distance() { return Math.max(0, track.scrollWidth - window.innerWidth + 40); }

  var ctx = null;

  function buildStatic() {
    sec.classList.add('is-static');
    gsap.set(track, { x: 0 });
    gsap.set(bar, { scaleX: 0 });
    gsap.utils.toArray('#pathTrack .pa-card').forEach(function (card, i) {
      gsap.from(card, {
        opacity: 0, y: 34, duration: .9, ease: 'power3.out', delay: i * .07,
        scrollTrigger: { trigger: pin, start: 'top 72%' }
      });
    });
  }

  function buildPinned() {
    sec.classList.remove('is-static');
    var tween = gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: function () { return '+=' + (distance() + window.innerHeight * 0.6); },
        pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) { gsap.set(bar, { scaleX: self.progress }); }
      }
    });

    /* Each card lifts as it reaches centre stage, driven by the same
       horizontal tween rather than by its own vertical position. */
    gsap.utils.toArray('#pathTrack .pa-card').forEach(function (card) {
      ScrollTrigger.create({
        trigger: card, containerAnimation: tween,
        start: 'left 76%', end: 'right 24%',
        onEnter:     function () { gsap.to(card, { borderColor: 'rgba(88,91,47,.5)', duration: .5 }); },
        onEnterBack: function () { gsap.to(card, { borderColor: 'rgba(88,91,47,.5)', duration: .5 }); },
        onLeave:     function () { gsap.to(card, { borderColor: 'rgba(36,38,15,.12)', duration: .5 }); },
        onLeaveBack: function () { gsap.to(card, { borderColor: 'rgba(36,38,15,.12)', duration: .5 }); }
      });
      gsap.fromTo(card.querySelector('.pa-card__no'), { opacity: .2 }, {
        opacity: .35, duration: .4,
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 80%',
                         toggleActions: 'play none none reverse' }
      });
    });
  }

  function build() {
    if (ctx) ctx.revert();
    ctx = gsap.context(distance() > 0 ? buildPinned : buildStatic);
  }
  build();

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var wants = distance() > 0;
      if (wants !== !sec.classList.contains('is-static')) build();
    }, 250);
  });
});
