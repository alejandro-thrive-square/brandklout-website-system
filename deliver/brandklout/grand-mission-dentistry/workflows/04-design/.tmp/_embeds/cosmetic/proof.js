/* CHAPTER 04 — THE PROOF (pinned horizontal ribbon): eight real cases
   travel sideways. */
WZ.add(function (W) {
  var pin = document.getElementById('proofPin');
  var rail = document.getElementById('ribbonRail');
  var bar = document.getElementById('ribbonBar');
  if (!pin || !rail) return;

  function distance() {
    return Math.max(0, rail.scrollWidth - window.innerWidth + 40);
  }

  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', function () {
    var cases = gsap.utils.toArray('.case');
    gsap.to(rail, {
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
          /* Whichever case is nearest the middle is the one being looked
             at, so it is the one that comes up to full colour. */
          var mid = window.innerWidth / 2;
          var best = 0,
            bestD = Infinity;
          cases.forEach(function (c, i) {
            var r = c.getBoundingClientRect();
            var d = Math.abs(r.left + r.width / 2 - mid);
            if (d < bestD) { bestD = d; best = i; }
          });
          cases.forEach(function (c, i) { c.classList.toggle('is-centre', i === best); });
        },
      },
    });
    /* No kill here — matchMedia already owns this tween and its pin;
       reverting it twice strips the pin spacer out of the layout. */
    return function () { gsap.set(bar, { scaleX: 1 }); };
  });

  mm.add('(max-width: 900px)', function () {
    var onScroll = function () {
      var max = rail.scrollWidth - rail.clientWidth;
      gsap.set(bar, { scaleX: max > 0 ? rail.scrollLeft / max : 1 });
    };
    onScroll();
    rail.addEventListener('scroll', onScroll, { passive: true });
    return function () { rail.removeEventListener('scroll', onScroll); };
  });
});
