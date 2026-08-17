/* ==========================================================================
   COSMETIC LANDING PAGE — chapter choreography
   Asana task 1217072657902270

   Seven chapters. Three of them are scenes the page holds still for:

     02  The Work      pin + scrub — a marker travels the service index and the
                       stage changes to whatever it has reached
     03  The Standard  pin + scrub — the three reasons advance with scroll
     04  The Proof     pin + scrub — eight real cases travel sideways

   Runs inside WZ.add(), so it executes after ScrollSmoother exists and never
   runs at all under prefers-reduced-motion.
   ========================================================================== */
WZ.add(function (W) {
  var mm = gsap.matchMedia();

  /* A scrubbed ScrollTrigger with no animation attached never fires onUpdate.
     Scrubbing a proxy gives a real 0→1 signal, and the returned function lets
     matchMedia tear the scene down cleanly at a breakpoint change. */
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
      .from('#book', { opacity: 0, y: 40, duration: 1 }, 0.5);

    /* Departure. */
    gsap
      .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.5 } })
      .to('#arrivalInner', { yPercent: -12, opacity: 0.2, ease: 'none' }, 0)
      .to('#arrivalImg', { yPercent: 6, scale: 1.1, ease: 'none' }, 0)
      .to('#arrivalVeil', { opacity: 0.75, ease: 'none' }, 0);
  })();

  /* ======================================================================
     CHAPTER 01 — THE HANDS
     The two portraits counter-drift so the pair never sits completely still.
     ====================================================================== */
  gsap.utils.toArray('[data-doc]').forEach(function (doc, i) {
    gsap.fromTo(
      doc.querySelector('.doc__portrait'),
      { yPercent: i % 2 ? 5 : -5 },
      {
        yPercent: i % 2 ? -5 : 5,
        ease: 'none',
        scrollTrigger: { trigger: doc, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
      }
    );
  });

  /* ======================================================================
     CHAPTER 02 — THE WORK   (pinned, scrubbed index)
     ====================================================================== */
  (function () {
    var pin = document.getElementById('workPin');
    var rows = gsap.utils.toArray('[data-svc]');
    var marker = document.getElementById('workMarker');
    var card = document.getElementById('workCard');
    var icon = document.getElementById('workIcon');
    var title = document.getElementById('workTitle');
    var tag = document.getElementById('workTag');
    var num = document.getElementById('workNum');
    var rail = document.getElementById('workRail');
    var index = document.getElementById('workIndex');
    if (!pin || !rows.length || !marker) return;

    var current = -1;

    var show = function (i) {
      if (i === current) return;
      current = i;
      var row = rows[i];
      /* The stage swaps rather than cross-fades: one element, one owner of
         opacity, so nothing can be stranded half-visible. */
      gsap.fromTo(
        card,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', overwrite: true }
      );
      icon.src = row.getAttribute('data-icon');
      title.textContent = row.textContent.trim();
      tag.textContent = row.getAttribute('data-tag');
      num.textContent = String(i + 1).padStart(2, '0');
      rows.forEach(function (r, j) { r.classList.toggle('is-on', j === i); });
    };

    var paint = function (p) {
      /* The marker is the continuous readout: it travels the whole index in
         step with scroll, independently of which row happens to be active. */
      var span = index.clientHeight - marker.clientHeight;
      gsap.set(marker, { y: span * p });
      show(Math.min(rows.length - 1, Math.floor(p * rows.length * 0.999)));
      if (rail) gsap.set(rail, { scaleX: p });
    };

    mm.add('(min-width: 760px)', function () {
      return scrubScene(
        { trigger: pin, start: 'top top', end: '+=190%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
        paint
      );
    });
    mm.add('(max-width: 759px)', function () {
      return scrubScene({ trigger: pin, start: 'top 78%', end: 'bottom 55%', scrub: 0.35 }, paint);
    });
  })();

  /* ======================================================================
     CHAPTER 03 — THE STANDARD   (pinned, scrubbed pillars)
     ====================================================================== */
  (function () {
    var pin = document.getElementById('pillarsPin');
    var pillars = gsap.utils.toArray('[data-pillar]');
    var bar = document.getElementById('pillarBar');
    if (!pin || !pillars.length) return;

    var paint = function (p) {
      if (bar) gsap.set(bar, { scaleX: p });
      pillars.forEach(function (pl, i) {
        pl.classList.toggle('is-active', p >= i / pillars.length + 0.03);
      });
    };

    mm.add('(min-width: 760px)', function () {
      return scrubScene(
        { trigger: pin, start: 'top top', end: '+=140%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
        paint
      );
    });
    mm.add('(max-width: 759px)', function () {
      return scrubScene({ trigger: pin, start: 'top 80%', end: 'bottom 55%', scrub: 0.35 }, paint);
    });
  })();

  /* ======================================================================
     CHAPTER 04 — THE PROOF   (pinned horizontal ribbon)
     ====================================================================== */
  (function () {
    var pin = document.getElementById('proofPin');
    var rail = document.getElementById('ribbonRail');
    var bar = document.getElementById('ribbonBar');
    if (!pin || !rail) return;

    function distance() {
      return Math.max(0, rail.scrollWidth - window.innerWidth + 40);
    }

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
      /* No kill here either — see scrubScene. matchMedia already owns
         this tween and its pin; reverting it twice strips the pin
         spacer out of the layout and leaves the trigger's start/end
         pointing at scroll positions the document no longer has. */
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
  })();

  /* ======================================================================
     CHAPTERS 01, 05 — departures
     The range starts late on purpose: these chapters are several screens
     tall, and dimming one while its middle is still being read would cost
     legibility to buy an effect.
     ====================================================================== */
  ['hands', 'voices'].forEach(function (id) {
    var sec = document.getElementById(id);
    if (!sec) return;
    gsap.to(sec, {
      opacity: 0.35,
      yPercent: -3,
      ease: 'none',
      scrollTrigger: { trigger: sec, start: 'bottom 30%', end: 'bottom top', scrub: 0.5 },
    });
  });

  /* ======================================================================
     CHAPTER 06 — THE INVITATION
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
   Reduced motion never runs any of the above, so every scene has to ship in
   its resolved state. A dimmed pillar list and an empty service stage would
   be worse than no scene at all.
   ========================================================================== */
(function () {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-pillar]').forEach(function (p) { p.classList.add('is-active'); });
    /* Without the pin the index cannot drive the stage, so the six services
       become a plain list and the stage shows the first of them. */
    document.querySelectorAll('[data-svc]').forEach(function (r) { r.classList.add('is-on'); });
  });
})();
