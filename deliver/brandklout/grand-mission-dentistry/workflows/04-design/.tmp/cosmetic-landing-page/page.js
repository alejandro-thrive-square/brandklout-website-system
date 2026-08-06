/* ==========================================================================
   COSMETIC LANDING PAGE — bespoke choreography
   Asana task 1217072657902270

   Three scroll-choreographed sections beyond the kit's reveals:
     1. hero entrance timeline (media wipe → headline → form assembles)
     2. sticky "why us" column where each pillar takes the stage in turn
     3. pinned horizontal patient ribbon  ← the signature moment
   ========================================================================== */
WZ.add(function (W) {
  var mm = gsap.matchMedia();

  /* ---------- 1. hero entrance ----------------------------------------- */
  var heroMedia = document.querySelector('.hero__media');
  if (heroMedia) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(
      heroMedia,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut' }
    );

    var panel = document.getElementById('book');
    if (panel) {
      tl.from(panel, { y: 46, opacity: 0, duration: 1 }, 0.35);
      tl.from(
        panel.querySelectorAll('.panel__head, .field, .consent, #formSubmit'),
        { y: 16, opacity: 0, duration: 0.5, stagger: 0.06 },
        0.6
      );
    }

    gsap.to(heroMedia, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
  }

  /* ---------- doctors: portraits counter-move --------------------------- */
  gsap.utils.toArray('[data-doc]').forEach(function (doc, i) {
    gsap.fromTo(
      doc.querySelector('.doc__portrait'),
      { y: 34 },
      {
        y: -34,
        ease: 'none',
        scrollTrigger: { trigger: doc, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
      }
    );
  });

  /* ---------- 2. pillars take the stage in turn ------------------------- */
  /* Each pillar inverts as it reaches the middle of the viewport, and the rail
     under the sticky heading tracks how far through the set you are. */
  var pillars = gsap.utils.toArray('[data-pillar]');
  var pillarBar = document.getElementById('pillarBar');
  if (pillars.length) {
    pillars.forEach(function (pillar, i) {
      ScrollTrigger.create({
        trigger: pillar,
        start: 'top 62%',
        end: 'bottom 42%',
        onToggle: function (self) {
          pillar.classList.toggle('is-active', self.isActive);
        },
      });
    });

    if (pillarBar) {
      gsap.to(pillarBar, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.pillars__list',
          start: 'top 75%',
          end: 'bottom 60%',
          scrub: 0.4,
        },
      });
    }
  }

  /* ---------- 3. pinned patient ribbon — SIGNATURE ---------------------- */
  var rail = document.getElementById('ribbonRail');
  var ribbonBar = document.getElementById('ribbonBar');
  if (rail) {
    mm.add('(min-width: 901px)', function () {
      var distance = function () {
        return rail.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(rail).paddingLeft) * 2;
      };

      var tween = gsap.to(rail, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: '.ribbon',
          start: 'top top',
          end: function () { return '+=' + distance(); },
          pin: '.ribbon__pin',
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (ribbonBar) gsap.set(ribbonBar, { scaleX: self.progress });
          },
        },
      });

      /* Each photo counter-moves inside its frame so the ribbon has depth.
         Scale never lands on exactly 1 — that flickers at the edges. */
      gsap.utils.toArray('[data-ribbon-img]').forEach(function (img) {
        gsap.fromTo(
          img,
          { xPercent: -7, scale: 1.14 },
          {
            xPercent: 7,
            scale: 1.14,
            ease: 'none',
            scrollTrigger: {
              trigger: '.ribbon',
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
