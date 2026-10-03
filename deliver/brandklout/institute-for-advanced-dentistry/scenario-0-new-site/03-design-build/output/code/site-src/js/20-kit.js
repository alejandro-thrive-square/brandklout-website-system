/* Kit — shared sections that appear on many pages: the memberships marquee and the invitation (form slot).
   Every block guards on its own elements. */
(function () {
  'use strict';
  var IFA = window.IFA, $ = IFA.$, $$ = IFA.$$;

  IFA.module({
    late: function () {
      /* velocity-reactive memberships marquee (any number per page) */
      $$('[data-marquee]').forEach(function (mq) {
        var track = $('[data-marquee-track]', mq), set = $('.marquee__set', track);
        for (var c = 0; c < 3; c++) { var clone = set.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.appendChild(clone); }
        var loop = gsap.to(track, { x: function () { return -set.offsetWidth; }, duration: 28, ease: 'none', repeat: -1 });
        loop.totalTime(28 * 40);
        var mqHold = false;
        var mqStop = function () { mqHold = true; gsap.killTweensOf(loop); gsap.to(loop, { timeScale: 0, duration: .35, ease: 'power2.out' }); };
        var mqGo = function () { mqHold = false; gsap.to(loop, { timeScale: 1, duration: .8, ease: 'power2.in' }); };
        mq.addEventListener('pointerenter', mqStop); mq.addEventListener('pointerleave', mqGo);
        mq.addEventListener('focusin', mqStop); mq.addEventListener('focusout', mqGo);
        ScrollTrigger.create({ trigger: mq, start: 'top bottom', end: 'bottom top', onUpdate: function (self) {
          if (mqHold) return;
          var v = gsap.utils.clamp(-7, 7, self.getVelocity() / 260), dir = v < 0 ? -1 : 1;
          gsap.to(loop, { timeScale: dir * (1 + Math.abs(v)), duration: .2, overwrite: true, onComplete: function () { gsap.to(loop, { timeScale: dir, duration: 1.4, ease: 'power2.out' }); } });
        } });
      });

      /* ---- the invitation ----
         The form card is NEVER pinned and never faded. A pin lifts its element out of the page and puts
         it back on every ScrollTrigger refresh, and a browser reloads an <iframe> each time it is moved:
         pinned, the GoHighLevel form reloaded 25 times in four seconds ("submission in progress") and
         its card was frozen at the height it had before the form grew. A lead form must also never
         depend on an animation to be visible. It only rises a little. */
      var ask = $('[data-ask]');
      if (ask) gsap.from(ask, { y: 40, duration: 1.2, scrollTrigger: { trigger: ask, start: 'top 92%', once: true } });
      $$('.includes').forEach(function (list) {
        gsap.from($$('li', list), { x: -24, autoAlpha: 0, stagger: .07, duration: .9, scrollTrigger: { trigger: list, start: 'top 86%', once: true } });
      });
    }
  });
})();
