/* ==========================================================================
   IMPLANT LANDING PAGE — chapter choreography
   Asana task 1217133289235653

   Eight chapters. Three of them are scenes the page holds still for:

     01  The Loss      pin + scrub — the sentence is written word by word and
                       the ridge gauge narrows in step with it
     02  The Answer    pin + scrub — a scan line travels the implant, the photo
                       resolves behind it, six reasons light as it passes
     03  The Options   pin + scrub — horizontal travel driven by self.progress

   Everything else arrives and departs: each chapter has an exit timeline on
   start:'top top', end:'bottom top', so leaving one feels like leaving a room.

   All of it runs inside WZ.add(), so it executes after ScrollSmoother exists
   and never runs at all under prefers-reduced-motion.
   ========================================================================== */
WZ.add(function (W) {
  var mm = gsap.matchMedia();

  /* A scrubbed ScrollTrigger with no animation attached never calls onUpdate —
     it has nothing to interpolate. Scrubbing a proxy object gives us a real
     0→1 progress signal we can paint anything from, and returns a cleanup
     function so matchMedia can tear the scene down on a breakpoint change. */
  function scrubScene(config, paint) {
    var proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: config,
      onUpdate: function () { paint(proxy.p); },
    });
    /* The cleanup deliberately does NOT kill the tween or its ScrollTrigger.
       Everything created inside a matchMedia callback is already owned by that
       context and reverted for us; killing it here as well double-reverts, and
       the second revert strips the pin spacers out of the layout while the
       triggers keep their old start/end values. The page then looks fine and
       is silently thousands of pixels shorter than ScrollTrigger believes, so
       every scrollTo lands in the wrong chapter. Only the class state is ours
       to reset — GSAP does not know about it. */
    return function () { paint(1); };
  }

  /* ======================================================================
     CHAPTER 00 — ARRIVAL
     ====================================================================== */
  (function () {
    var root = document.getElementById('arrival');
    if (!root) return;

    var tl = gsap.timeline({ delay: 0.12, defaults: { ease: 'power3.out' } });
    var title = document.getElementById('arrivalTitle');
    var split = W.splitLines(title);

    if (split && split.lines && split.lines.length) {
      gsap.set(split.lines, { yPercent: 115 });
      tl.to(split.lines, { yPercent: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out' }, 0);
    } else {
      tl.from(title, { opacity: 0, y: 40, duration: 1 }, 0);
    }
    tl.from(root.querySelector('.chapter-tag'), { opacity: 0, x: -22, duration: 0.85 }, 0.05)
      .from('#arrivalImg', { opacity: 0, scale: 1.12, duration: 1.7 }, 0)
      .from('#quiz', { opacity: 0, y: 40, duration: 1 }, 0.5);

    /* Departure — the chapter recedes and dims into the seam. */
    gsap
      .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.5 } })
      .to('#arrivalInner', { yPercent: -12, opacity: 0.2, ease: 'none' }, 0)
      .to('#arrivalImg', { yPercent: 6, scale: 1.1, ease: 'none' }, 0)
      .to('#arrivalVeil', { opacity: 0.75, ease: 'none' }, 0);
  })();

  /* ======================================================================
     CHAPTER 01 — THE LOSS   (pinned, scrubbed)
     ====================================================================== */
  (function () {
    var pin = document.getElementById('lossPin');
    var big = document.getElementById('lossBig');
    var bar = document.getElementById('ridgeBar');
    var num = document.getElementById('lossCount');
    var rail = document.getElementById('lossRail');
    if (!pin || !big || !bar) return;

    var sp = W.splitWords(big);
    var words = sp && sp.words && sp.words.length ? sp.words : null;

    /* The client's own figure. The gauge is the sentence made visible: the
       ridge keeps its full width at the start and ends at what is left. */
    var LOST = 25;

    var paint = function (p) {
      if (words) {
        /* Words brighten one at a time. Each word owns its own colour — two
           tweens writing colour on one word over overlapping ranges flicker,
           because they overwrite each other every frame. */
        var reached = p * (words.length + 2);
        for (var i = 0; i < words.length; i++) {
          var local = Math.min(1, Math.max(0, reached - i));
          words[i].style.color = 'rgba(255,255,255,' + (0.22 + local * 0.78).toFixed(3) + ')';
        }
      }
      /* Never lands exactly on 1: a scrubbed scale that resolves to 1 snaps
         its rasterisation and flickers at the edge. */
      gsap.set(bar, { scaleX: 1 - (LOST / 100) * p });
      if (num) num.textContent = 'Up to ' + Math.round(LOST * p) + '%';
      if (rail) gsap.set(rail, { scaleX: p });
    };

    mm.add('(min-width: 760px)', function () {
      return scrubScene(
        { trigger: pin, start: 'top top', end: '+=130%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
        paint
      );
    });
    /* Below 760px the pin would eat the whole screen on a device that has
       little of it. The same scene plays, driven by the section passing. */
    mm.add('(max-width: 759px)', function () {
      return scrubScene({ trigger: pin, start: 'top 80%', end: 'bottom 55%', scrub: 0.35 }, paint);
    });
  })();

  /* ======================================================================
     CHAPTER 02 — THE ANSWER   (pinned, scrubbed scan)
     ====================================================================== */
  (function () {
    var pin = document.getElementById('answerPin');
    var lit = document.getElementById('scanLit');
    var line = document.getElementById('scanLine');
    var plate = lit && lit.parentElement;
    var reasons = gsap.utils.toArray('[data-reason]');
    var survival = document.getElementById('survivalNum');
    var years = document.getElementById('yearsNum');
    var rail = document.getElementById('answerRail');
    if (!pin || !lit || !plate) return;

    var paint = function (p) {
      var travelled = (p * 100).toFixed(2);
      lit.style.clipPath = 'inset(0 0 ' + (100 - travelled) + '% 0)';
      gsap.set(line, { y: plate.clientHeight * p });
      reasons.forEach(function (row, i) {
        /* Each reason owns a sixth of the travel and lights once the line has
           actually reached it. */
        row.classList.toggle('is-lit', p >= i / reasons.length + 0.02);
      });
      if (survival) survival.textContent = (96.8 * p).toFixed(1) + '%';
      if (years) years.textContent = Math.round(40 * p) + ' yrs';
      if (rail) gsap.set(rail, { scaleX: p });
    };

    mm.add('(min-width: 760px)', function () {
      return scrubScene(
        { trigger: pin, start: 'top top', end: '+=150%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
        paint
      );
    });
    mm.add('(max-width: 759px)', function () {
      return scrubScene({ trigger: pin, start: 'top 82%', end: 'bottom 60%', scrub: 0.35 }, paint);
    });

    gsap.from('.answer__copy > .chapter-tag, .answer__title, .answer__lede', {
      opacity: 0,
      y: 26,
      duration: 0.9,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: pin, start: 'top 72%' },
    });
  })();

  /* ======================================================================
     CHAPTER 03 — THE OPTIONS   (pinned horizontal journey)
     ====================================================================== */
  (function () {
    var pin = document.getElementById('optionsPin');
    var railTrack = document.getElementById('optionsRail');
    var bar = document.getElementById('optionsBar');
    if (!pin || !railTrack) return;

    /* Travel is whatever the track overhangs the viewport by. Recomputed on
       refresh so it survives resize and late font loading. */
    function distance() {
      return Math.max(0, railTrack.scrollWidth - window.innerWidth + 40);
    }

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
      /* No kill here either — see scrubScene. matchMedia already owns
         this tween and its pin; reverting it twice strips the pin
         spacer out of the layout and leaves the trigger's start/end
         pointing at scroll positions the document no longer has. */
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
  })();

  /* ======================================================================
     CHAPTERS 04-06 — arrivals and departures
     A section that fades in and then sits there is a band with an animation
     on it. Each of these recedes as you leave it.
     ====================================================================== */
  ['candidacy', 'specialist', 'terms'].forEach(function (id) {
    var sec = document.getElementById(id);
    if (!sec) return;
    /* The range deliberately starts late. These chapters are several screens
       tall, and dimming one while its middle is still being read would cost
       legibility to buy an effect — the recession only touches the tail that
       is already leaving the viewport. */
    gsap.to(sec, {
      opacity: 0.35,
      yPercent: -3,
      ease: 'none',
      scrollTrigger: { trigger: sec, start: 'bottom 30%', end: 'bottom top', scrub: 0.5 },
    });
  });

  /* Case gallery: the four cases rise on a slight diagonal, and each drifts
     against the scroll so the block never sits completely still. */
  gsap.from('#gallery .gallery__item', {
    opacity: 0,
    y: 40,
    duration: 0.9,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#gallery', start: 'top 86%' },
  });
  gsap.utils.toArray('#gallery img').forEach(function (img, i) {
    gsap.fromTo(
      img,
      { yPercent: -4 - i, scale: 1.1 },
      {
        yPercent: 4 + i,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: { trigger: '#gallery', start: 'top bottom', end: 'bottom top', scrub: 0.7 },
      }
    );
  });

  /* Financing matrix: rows deal in from the left, so the table is read as a
     sequence of routes rather than a wall of text. */
  gsap.from('#matrixBody tr', {
    opacity: 0,
    x: -30,
    duration: 0.75,
    stagger: 0.09,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#matrixBody', start: 'top 85%' },
  });

  /* ======================================================================
     Service marquee — velocity-reactive
     Speed and direction bend with how fast you are scrolling, so the page
     feels physically connected to the wheel.
     ====================================================================== */
  (function () {
    var row = document.getElementById('svcTrack');
    if (!row) return;
    row.innerHTML += row.innerHTML; // a seamless loop needs a duplicate
    var half = row.scrollWidth / 2;
    var loop = gsap.to(row, {
      x: -half,
      duration: 30,
      ease: 'none',
      repeat: -1,
      modifiers: { x: function (x) { return (parseFloat(x) % half) + 'px'; } },
    });
    var vt = gsap.quickTo(loop, 'timeScale', { duration: 0.5, ease: 'power2' });
    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = self.getVelocity() / 380;
        vt(gsap.utils.clamp(-7, 7, v === 0 ? 1 : v < 0 ? Math.min(-1, v) : Math.max(1, v)));
      },
    });
    ScrollTrigger.addEventListener('scrollEnd', function () { vt(1); });
  })();

  /* ======================================================================
     CHAPTER 07 — THE INVITATION
     ====================================================================== */
  gsap.fromTo(
    '.invitation__glow',
    { scale: 0.82, opacity: 0.45 },
    {
      scale: 1.18,
      opacity: 1,
      ease: 'none',
      scrollTrigger: { trigger: '#invitation', start: 'top bottom', end: 'bottom bottom', scrub: 0.7 },
    }
  );
});

/* ==========================================================================
   Reduced motion never runs any of the above, so the pinned scenes have to be
   painted at their resolved state. Motion off must never mean content off —
   an unlit reason list and a 0.0% survival figure are worse than no scene.
   ========================================================================== */
(function () {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-reason]').forEach(function (r) { r.classList.add('is-lit'); });
    var lit = document.getElementById('scanLit');
    if (lit) lit.style.clipPath = 'none';
    var line = document.getElementById('scanLine');
    if (line) line.style.display = 'none';
  });
})();
