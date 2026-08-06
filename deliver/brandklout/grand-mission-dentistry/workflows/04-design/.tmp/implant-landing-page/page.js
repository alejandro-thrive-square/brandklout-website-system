/* ==========================================================================
   IMPLANT LANDING PAGE — bespoke choreography
   Asana task 1217133289235653

   Three scroll-choreographed sections beyond the kit's reveals:
     1. hero entrance timeline (media wipe → headline → panel)
     2. pinned scrubbed stat band
     3. pinned horizontal track  ← the signature moment
   Plus a staggered matrix and a depth-offset gallery.

   Everything here is inside WZ.add(), so it runs after ScrollSmoother exists
   and never runs at all under prefers-reduced-motion.
   ========================================================================== */
WZ.add(function (W) {
  var mm = gsap.matchMedia();

  /* ---------- 1. hero entrance ----------------------------------------- */
  /* The media is uncovered by its own mask while the copy rises — the hero
     arrives as a sequence rather than a fade. */
  var heroMedia = document.querySelector('.hero__media');
  if (heroMedia) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(
      heroMedia,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut' }
    );

    var panel = document.getElementById('quiz');
    if (panel) {
      tl.from(panel, { y: 46, opacity: 0, duration: 1 }, 0.35);
      /* Stagger the panel's own controls in behind it so the form assembles
         rather than appearing whole. */
      tl.from(
        panel.querySelectorAll('.panel__head, .option, .panel__nav'),
        { y: 16, opacity: 0, duration: 0.5, stagger: 0.05 },
        0.6
      );
    }

    /* The hero image drifts up slightly faster than the copy on scroll. */
    gsap.to(heroMedia, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
  }

  /* ---------- 2. pinned, scrubbed stat band ---------------------------- */
  /* Counters bound to scroll progress, not to a one-shot tween: scrub back up
     and the numbers run backwards. The rail underneath reads as the section's
     own progress bar. */
  var stats = document.querySelector('[data-scrub-stats]');
  if (stats) {
    var nums = gsap.utils.toArray('[data-scrub-count]', stats);
    var rail = document.getElementById('statsRail');

    var paint = function (progress) {
      nums.forEach(function (el, i) {
        var target = parseFloat(el.getAttribute('data-scrub-count'));
        var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
        /* Each number gets its own slice of the scroll, so they resolve left
           to right instead of all at once. */
        var slice = gsap.utils.clamp(0, 1, (progress - i * 0.12) / 0.5);
        var value = target * gsap.parseEase('power2.out')(slice);
        el.textContent =
          (el.getAttribute('data-prefix') || '') +
          value.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) +
          (el.getAttribute('data-suffix') || '');
      });
      if (rail) gsap.set(rail, { scaleX: progress });
    };

    /* Scrub a proxy value rather than reading self.progress in onUpdate.
       A bare ScrollTrigger with `scrub` and no animation does not drive
       onUpdate on every tick, and the counters sit at zero — which looks
       exactly like a broken scrub. Give it a tween to scrub. */
    var build = function (config) {
      var proxy = { p: 0 };
      var tween = gsap.to(proxy, {
        p: 1,
        ease: 'none',
        scrollTrigger: config,
        onUpdate: function () { paint(proxy.p); },
      });
      return function () {
        tween.scrollTrigger && tween.scrollTrigger.kill();
        tween.kill();
        paint(1);
      };
    };

    mm.add('(min-width: 900px)', function () {
      return build({ trigger: stats, start: 'top top', end: '+=90%', pin: true, scrub: 0.35 });
    });

    /* No pin on small screens — a pinned band on a phone eats the viewport.
       The numbers still scrub against the section's own travel. */
    mm.add('(max-width: 899px)', function () {
      return build({ trigger: stats, start: 'top 85%', end: 'bottom 60%', scrub: 0.4 });
    });
  }

  /* ---------- 3. pinned horizontal track — SIGNATURE -------------------- */
  var rail = document.getElementById('trackRail');
  var trackBar = document.getElementById('trackBar');
  if (rail) {
    mm.add('(min-width: 901px)', function () {
      var distance = function () { return rail.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(rail).paddingLeft) * 2; };

      var tween = gsap.to(rail, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: '.track',
          start: 'top top',
          end: function () { return '+=' + distance(); },
          pin: '.track__pin',
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (trackBar) gsap.set(trackBar, { scaleX: self.progress });
          },
        },
      });

      /* Each image counter-moves inside its frame, so the panels have depth
         rather than sliding as one flat strip. Scale stays above 1 at both
         ends — a scrubbed scale landing exactly on 1 flickers at the edges. */
      gsap.utils.toArray('[data-track-img]').forEach(function (img) {
        gsap.fromTo(
          img,
          { xPercent: -6, scale: 1.12 },
          {
            xPercent: 6,
            scale: 1.12,
            ease: 'none',
            scrollTrigger: {
              trigger: '.track',
              start: 'top top',
              end: function () { return '+=' + distance(); },
              scrub: 0.4,
            },
          }
        );
      });

      return function () {
        tween.scrollTrigger && tween.scrollTrigger.kill();
        tween.kill();
        gsap.set(rail, { x: 0 });
      };
    });
  }

  /* ---------- staggered matrix rows ------------------------------------ */
  /* The table builds row by row, which makes a dense block of financing terms
     readable instead of a wall. */
  var rows = gsap.utils.toArray('#matrixBody tr');
  if (rows.length) {
    gsap.set(rows, { opacity: 1 });
    gsap.from(rows, {
      opacity: 0,
      y: 18,
      duration: 0.6,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.matrix-wrap', start: 'top 82%' },
    });
  }

  /* ---------- gallery depth -------------------------------------------- */
  /* Alternate cases travel at different rates, so the row breathes instead of
     scrolling as one block. */
  gsap.utils.toArray('[data-case]').forEach(function (item, i) {
    gsap.fromTo(
      item,
      { y: i % 2 ? 40 : 0 },
      {
        y: i % 2 ? -40 : 0,
        ease: 'none',
        scrollTrigger: { trigger: '#gallery', start: 'top bottom', end: 'bottom top', scrub: 0.7 },
      }
    );
  });

  /* ---------- final CTA glow ------------------------------------------- */
  var glow = document.querySelector('.final__glow');
  if (glow) {
    gsap.fromTo(
      glow,
      { yPercent: 18, scale: 1.05 },
      {
        yPercent: -12,
        scale: 1.25,
        ease: 'none',
        scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'bottom top', scrub: 0.8 },
      }
    );
  }
});
