/* =============================================================================
   SECTION: ch-voices              PINNED HORIZONTAL

   The consultation page's one scroll-driven scene. Six portrait films travel
   sideways in the height of one, which keeps the page short, which is its
   brief. Same measured fallback as ch-path: if the track already fits, the
   chapter does not pin.
   ============================================================================= */
WZ.section('ch-voices', function (W) {
  var sec   = document.querySelector('.ch-voices'),
      pin   = document.getElementById('voPin'),
      track = document.getElementById('voTrack'),
      bar   = document.getElementById('voBar');

  if (W.reduced) { sec.classList.add('is-static'); track.style.overflowX = 'auto'; return; }

  function distance() { return Math.max(0, track.scrollWidth - window.innerWidth + 40); }

  var ctx = null;

  function buildStatic() {
    sec.classList.add('is-static');
    gsap.set(track, { x: 0 }); gsap.set(bar, { scaleX: 0 });
    gsap.utils.toArray('#voTrack .vtile').forEach(function (tile, i) {
      gsap.from(tile, { opacity: 0, y: 30, duration: .85, ease: 'power3.out', delay: i * .06,
        scrollTrigger: { trigger: pin, start: 'top 74%' } });
    });
  }

  function buildPinned() {
    sec.classList.remove('is-static');
    var tween = gsap.to(track, {
      x: function () { return -distance(); }, ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'top top',
        end: function () { return '+=' + (distance() + window.innerHeight * 0.5); },
        pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) { gsap.set(bar, { scaleX: self.progress }); }
      }
    });

    /* Tiles come up out of grayscale as they reach the middle, so the one you
       are looking at is the one in colour. */
    gsap.utils.toArray('#voTrack .vtile').forEach(function (tile) {
      var img = tile.querySelector('img');
      gsap.set(img, { filter: 'grayscale(1)' });
      ScrollTrigger.create({
        trigger: tile, containerAnimation: tween, start: 'left 78%', end: 'right 22%',
        onEnter:     function () { gsap.to(img, { filter: 'grayscale(0)', duration: .6 }); },
        onEnterBack: function () { gsap.to(img, { filter: 'grayscale(0)', duration: .6 }); },
        onLeave:     function () { gsap.to(img, { filter: 'grayscale(1)', duration: .6 }); },
        onLeaveBack: function () { gsap.to(img, { filter: 'grayscale(1)', duration: .6 }); }
      });
    });
  }

  function build() { if (ctx) ctx.revert(); ctx = gsap.context(distance() > 0 ? buildPinned : buildStatic); }
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
