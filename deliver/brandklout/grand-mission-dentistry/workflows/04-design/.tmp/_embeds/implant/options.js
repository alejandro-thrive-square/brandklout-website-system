/* CHAPTER 03 — THE OPTIONS (pinned horizontal journey). */
WZ.add(function (W) {
  var pin = document.getElementById('optionsPin');
  var railTrack = document.getElementById('optionsRail');
  var bar = document.getElementById('optionsBar');
  if (!pin || !railTrack) return;

  /* Travel is whatever the track overhangs the viewport by. Recomputed on
     refresh so it survives resize and late font loading. */
  function distance() {
    return Math.max(0, railTrack.scrollWidth - window.innerWidth + 40);
  }

  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', function () {
    var cards = gsap.utils.toArray('.opt');
    gsap.to(railTrack, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: function () { return '+=' + (distance() + window.innerHeight * 0.6); },
        pin: true,
        scrub: 0.3,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          gsap.set(bar, { scaleX: self.progress });
          /* Whichever panel is nearest the middle of the screen is the one
             being read, so it is the one that comes up to full colour. */
          var mid = window.innerWidth / 2;
          var best = 0,
            bestD = Infinity;
          cards.forEach(function (c, i) {
            var r = c.getBoundingClientRect();
            var d = Math.abs(r.left + r.width / 2 - mid);
            if (d < bestD) { bestD = d; best = i; }
          });
          cards.forEach(function (c, i) { c.classList.toggle('is-centre', i === best); });
        },
      },
    });
    /* No kill here — matchMedia already owns this tween and its pin;
       reverting it twice strips the pin spacer out of the layout. */
    return function () { gsap.set(bar, { scaleX: 1 }); };
  });

  /* Under 900px the rail is a swipe region (see styles.css), so the bar
     tracks the finger instead of the page. */
  mm.add('(max-width: 900px)', function () {
    var onScroll = function () {
      var max = railTrack.scrollWidth - railTrack.clientWidth;
      gsap.set(bar, { scaleX: max > 0 ? railTrack.scrollLeft / max : 1 });
    };
    onScroll();
    railTrack.addEventListener('scroll', onScroll, { passive: true });
    return function () { railTrack.removeEventListener('scroll', onScroll); };
  });
});
