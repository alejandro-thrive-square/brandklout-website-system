/* 55-journal — articles and legal pages: the aside's contents follow the reader (the current heading lit, a
   gold rule that fills with the article, the aside pinned beside the text on wide screens), and its links land
   the heading below the bar. Guards on .jr-post; everything reads complete without this file. */
(function () {
  'use strict';
  var IFA = window.IFA;
  if (!IFA) return;
  var $ = IFA.$, $$ = IFA.$$;

  IFA.module({
    init: function () {
      var post = $('.is-article');
      if (!post) return;
      var links = $$('.post_contents a', post);
      var heads = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });

      /* contents links: land the heading below the bar (capture phase, ahead of the core's in-page links) */
      document.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('.post_contents a') : null;
        if (!a) return;
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (!t) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        var nav = $('[data-nav]'), off = (nav ? nav.offsetHeight : 80) + 24;
        if (IFA.smoother) IFA.smoother.scrollTo(Math.max(0, IFA.smoother.offset(t, 'top top') - off), true);
        else window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - off, behavior: IFA.reduce ? 'auto' : 'smooth' });
        if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
      }, true);

      /* the current heading */
      var queued = false;
      var spy = function () {
        queued = false;
        var line = window.innerHeight * 0.3, cur = -1;
        heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < line) cur = i; });
        links.forEach(function (a, i) {
          a.classList.toggle('is-on', i === cur);
          if (i === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      };
      var queue = function () { if (!queued) { queued = true; requestAnimationFrame(spy); } };
      window.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', queue);
      IFA.jrSpy = queue;
      spy();
    },

    motion: function (ctx) {
      var post = $('.is-article');
      if (!post) return;
      var aside = $('.post_aside', post), article = $('article', post), bar = $('.post_progress i', post);

      /* the gold rule fills as the article is read */
      if (bar && article) {
        gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: article, start: 'top 35%', end: 'bottom 65%', scrub: true } });
      }

      /* the aside stays beside the text on wide screens, when it fits the window */
      ctx.mm.add('(min-width: 992px)', function () {
        var nav = $('[data-nav]'), top = (nav ? nav.offsetHeight : 80) + 32;
        if (!aside || !article || aside.offsetHeight > window.innerHeight - top - 32) return;
        ScrollTrigger.create({
          trigger: aside, start: 'top ' + top + 'px',
          endTrigger: article, end: function () { return 'bottom ' + (top + aside.offsetHeight) + 'px'; },
          pin: true, pinSpacing: false, invalidateOnRefresh: true
        });
      });

      if (IFA.smoother && IFA.jrSpy) gsap.ticker.add(IFA.jrSpy);
    }
  });
})();
