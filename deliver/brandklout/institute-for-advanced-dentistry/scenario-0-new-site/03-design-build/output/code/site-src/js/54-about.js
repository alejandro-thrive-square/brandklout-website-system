/* About group — motion for the ab- sections (css/54-about.css). Each block guards on its own elements. */
(function () {
  'use strict';
  var IFA = window.IFA, $$ = IFA.$$;

  IFA.module({
    motion: function () {
      /* the Phoenix Magazine seal turns with the scroll */
      $$('.recognition_seal').forEach(function (seal) {
        gsap.fromTo(seal, { rotation: -30 }, { rotation: 40, ease: 'none', scrollTrigger: { trigger: seal.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      /* written testimonials are dealt in rows */
      $$('.testimonial_grid').forEach(function (grid) {
        ScrollTrigger.batch($$('.testimonial_card', grid), { start: 'top 90%', once: true, onEnter: function (els) {
          gsap.from(els, { y: 60, autoAlpha: 0, stagger: .12, duration: 1.1, overwrite: true });
        } });
      });

      /* ways to pay and the lenders arrive one after another */
      $$('.payment_ways, .payment_lenders').forEach(function (list) {
        gsap.from(list.children, { y: 30, autoAlpha: 0, stagger: .1, duration: .9, scrollTrigger: { trigger: list, start: 'top 88%', once: true } });
      });

      /* the films grid: each frame opens a little later than its neighbour */
      if (window.matchMedia('(min-width: 768px)').matches) $$('.film_grid').forEach(function (grid) {
        $$('.film_component', grid).forEach(function (f, i) {
          gsap.fromTo(f, { yPercent: i % 2 ? 14 : 0 }, { yPercent: i % 2 ? -4 : 0, ease: 'none', scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      });
    }
  });
})();
