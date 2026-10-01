/* Pages — controls and motion for the section kit (css/40-pages.css). Each block guards on its own elements.
   No IntersectionObserver reveals: everything that moves on the scroll is a ScrollTrigger (journey standard). */
(function () {
  'use strict';
  var IFA = window.IFA, $ = IFA.$, $$ = IFA.$$;
  var reduce = IFA.reduce;

  /* ------------------------------------------------------- before / after */
  /* One slider per [data-ba]. Drag, click, or arrow keys. A scroll sweep runs until the visitor takes hold. */
  function makeBA(el) {
    if (el._ba) return el._ba;
    var handle = $('.ba__handle', el), state = { pos: parseFloat(el.getAttribute('data-start') || '50'), held: false };
    var paint = function () {
      var v = Math.max(0, Math.min(100, state.pos));
      el.style.setProperty('--pos', v.toFixed(2) + '%');
      if (handle) handle.setAttribute('aria-valuenow', String(Math.round(v)));
    };
    var dragging = false;
    var fromEvent = function (e) { var r = el.getBoundingClientRect(); state.pos = (e.clientX - r.left) / r.width * 100; paint(); };
    el.addEventListener('pointerdown', function (e) { dragging = true; state.held = true; el.setPointerCapture(e.pointerId); fromEvent(e); });
    el.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    ['pointerup', 'pointercancel'].forEach(function (n) { el.addEventListener(n, function () { dragging = false; }); });
    if (handle) handle.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault(); state.held = true;
      state.pos = e.key === 'Home' ? 0 : e.key === 'End' ? 100 : Math.max(0, Math.min(100, state.pos + (e.key === 'ArrowRight' ? 5 : -5)));
      paint();
    });
    paint();
    el._ba = { state: state, paint: paint };
    return el._ba;
  }
  IFA.makeBA = makeBA;

  IFA.module({
    init: function () {
      $$('[data-ba]').forEach(makeBA);

      /* folds: a page grows when one opens; the triggers below it must move with it */
      $$('details.fold').forEach(function (d) { d.addEventListener('toggle', function () { if (IFA.refreshSoon) IFA.refreshSoon(); }); });

      /* ---------------------------------------------------------- gallery */
      var gal = $('[data-gal]');
      if (gal) {
        var items = $$('[data-gal-item]', gal);
        var chips = $$('[data-filter]');
        chips.forEach(function (c) {
          c.addEventListener('click', function () {
            var f = c.getAttribute('data-filter');
            chips.forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
            items.forEach(function (it) { it.hidden = !(f === 'all' || (' ' + it.getAttribute('data-tags') + ' ').indexOf(' ' + f + ' ') >= 0); });
            if (IFA.refreshSoon) IFA.refreshSoon();
          });
        });
        var lb = $('[data-lb]');
        if (lb) {
          var lbBefore = $('[data-lb-before]', lb), lbAfter = $('[data-lb-after]', lb), lbTitle = $('[data-lb-title]', lb), lbSub = $('[data-lb-sub]', lb);
          var lbBA = makeBA($('[data-ba]', lb)), cur = 0, last = null;
          var visible = function () { return items.filter(function (it) { return !it.hidden; }); };
          var show = function (it) {
            var b = $('[data-gal-btn]', it);
            cur = visible().indexOf(it);
            lbBefore.src = b.getAttribute('data-before'); lbBefore.alt = 'Before: ' + b.getAttribute('data-title');
            lbAfter.src = b.getAttribute('data-after'); lbAfter.alt = 'After: ' + b.getAttribute('data-title');
            lbTitle.textContent = b.getAttribute('data-title');
            lbSub.textContent = b.getAttribute('data-sub') || '';
            lbBA.state.pos = 50; lbBA.paint();
          };
          var open = function (it) {
            last = document.activeElement;
            show(it);
            lb.hidden = false; IFA.lockScroll(true);
            if (IFA.motion) gsap.fromTo($('.lb__box', lb), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, ease: 'expo.out' });
            $('[data-lb-close]', lb).focus();
          };
          var close = function () { if (lb.hidden) return; lb.hidden = true; IFA.lockScroll(false); if (last) last.focus(); };
          var step = function (d) { var v = visible(); if (!v.length) return; show(v[(cur + d + v.length) % v.length]); };
          items.forEach(function (it) { $('[data-gal-btn]', it).addEventListener('click', function () { open(it); }); });
          $('[data-lb-close]', lb).addEventListener('click', close);
          $('[data-lb-prev]', lb).addEventListener('click', function () { step(-1); });
          $('[data-lb-next]', lb).addEventListener('click', function () { step(1); });
          lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
          document.addEventListener('keydown', function (e) {
            if (lb.hidden) return;
            if (e.key === 'Escape') close();
            if (e.key === 'PageDown') step(1);
            if (e.key === 'PageUp') step(-1);
          });
        }
      }

      /* ---------------------------------------------------- related list */
      var floatBox = $('[data-more-float]');
      if (floatBox && IFA.fine && window.innerWidth > 991) {
        $$('[data-more]').forEach(function (list) { list.closest('.more').classList.add('is-live'); });
      }
    },

    motion: function (ctx) {
      var mm = ctx.mm, GOLD = IFA.GOLD, LIT = IFA.LIT;

      /* ---- hero entrances (on load, not on scroll) ---- */
      $$('[data-intro]').forEach(function (hero) {
        var h1 = $('h1', hero), split = h1 ? SplitText.create(h1, { type: 'lines', linesClass: 'ln', mask: 'lines' }) : null;
        var media = $('.hero__img, .hero__window', hero), img = media ? $('img, video', media) : null;
        var tl = gsap.timeline({ delay: .1 });
        if (media) tl.fromTo(media, { clipPath: 'inset(100% 0% 0% 0% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' }, 0);
        if (img) tl.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2, clearProps: 'scale' }, 0);
        tl.from($$('.crumbs li', hero), { y: 14, autoAlpha: 0, stagger: .06, duration: .7 }, .25);
        var tag = $('.tag', hero); if (tag) tl.from(tag.children, { x: -28, autoAlpha: 0, stagger: .08, duration: .9 }, .3);
        if (split) tl.from(split.lines, { yPercent: 112, stagger: .1, duration: 1.3 }, .4);
        tl.from($$('[data-rise]', hero), { y: 30, autoAlpha: 0, stagger: .12, duration: 1 }, .85);
        tl.from($$('.hero__note', hero), { y: 40, autoAlpha: 0, duration: 1.1 }, 1.1);
        tl.from($$('.hero__facts li, .hero__strip figure', hero), { y: 40, autoAlpha: 0, stagger: .08, duration: 1 }, .9);

        /* and on the scroll */
        if (hero.classList.contains('hero--split') && img) {
          gsap.to(img, { yPercent: 8, scale: 1.08, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
          gsap.to($('.hero__copy', hero), { y: -60, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        }
        if (hero.classList.contains('hero--wide') && media) {
          mm.add('(min-width: 768px)', function () {
            gsap.fromTo(media, { marginLeft: function () { return getComputedStyle(media).marginLeft; }, marginRight: function () { return getComputedStyle(media).marginRight; }, borderRadius: 16 },
              { marginLeft: 0, marginRight: 0, borderRadius: 0, ease: 'none', scrollTrigger: { trigger: media, start: 'top 75%', end: 'top 10%', scrub: true, invalidateOnRefresh: true } });
            gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
          });
        }
        if (hero.classList.contains('hero--index')) {
          $$('.hero__strip figure', hero).forEach(function (f, i) {
            gsap.to(f, { y: [-40, -130, -80][i % 3], ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
            gsap.fromTo($('img', f), { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
          });
        }
      });

      /* ---- say: the scroll writes the statement in ink ---- */
      $$('[data-say]').forEach(function (el) {
        var words = SplitText.create(el, { type: 'words', wordsClass: 'w' }).words;
        gsap.set(words, { color: getComputedStyle(document.documentElement).getPropertyValue('--fg-unlit').trim() || '#67625d' });
        gsap.to(words, { color: function (i, w) { return w.closest('strong') ? GOLD : LIT; }, stagger: .05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true } });
      });
      $$('.say__fig img').forEach(function (img) {
        gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      /* ---- stack: the options are dealt onto one another while the chapter holds ---- */
      $$('[data-stack]').forEach(function (stack) {
        var cards = $$('[data-stack-card]', stack), now = $('[data-stack-now]', stack);
        if (cards.length < 2) return;
        stack.classList.add('is-live');
        gsap.set(cards.slice(1), { yPercent: 115 });
        var tl = gsap.timeline({ scrollTrigger: { trigger: stack, pin: true, start: 'top top', end: function () { return '+=' + (cards.length - 1) * window.innerHeight * .8; }, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) { if (now) now.textContent = '0' + Math.min(cards.length, 1 + Math.floor(self.progress * (cards.length - 1) + .5)); } } });
        cards.forEach(function (c, i) {
          if (!i) return;
          tl.to(c, { yPercent: 0, ease: 'none', duration: 1 }, i - 1)
            .to(cards[i - 1], { scale: .93, yPercent: -4, filter: 'brightness(.94)', ease: 'none', duration: 1 }, i - 1);
        });
        tl.to({}, { duration: .25 });
      });

      /* ---- before / after: the scroll sweeps the divider across once ---- */
      $$('[data-ba]').forEach(function (el) {
        if (el.closest('[data-lb]')) return;
        var ba = makeBA(el), o = { p: 6 };
        gsap.to(o, { p: 72, ease: 'none', onUpdate: function () { if (!ba.state.held) { ba.state.pos = o.p; ba.paint(); } }, scrollTrigger: { trigger: el, start: 'top 85%', end: 'center 40%', scrub: true } });
      });

      /* ---- line: the rule draws and each visit lights as it passes ---- */
      $$('[data-line-list]').forEach(function (list) {
        var bar = $('.line__bar', list.parentNode), items = $$('.line__item', list);
        list.closest('.line').classList.add('is-live');
        gsap.fromTo(bar, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 70%', end: 'bottom 55%', scrub: true,
          onUpdate: function () {
            var b = bar.getBoundingClientRect().bottom;
            items.forEach(function (it) { it.classList.toggle('is-on', $('.line__dot', it).getBoundingClientRect().top < b); });
          } } });
      });
      $$('.line__fig img').forEach(function (img) {
        gsap.fromTo(img, { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      /* ---- figs: counted on the scroll ---- */
      $$('.figs').forEach(function (f) {
        $$('[data-count]', f).forEach(function (el) { IFA.countTo(el, f, 'top 88%', 'top 40%'); });
        gsap.from($$('.figs > div', f.parentNode), { y: 40, autoAlpha: 0, stagger: .1, duration: 1, scrollTrigger: { trigger: f, start: 'top 88%', once: true } });
      });

      /* ---- signs: each mark is drawn as the list scrolls through ---- */
      $$('.signs__list').forEach(function (list) {
        var paths = $$('path', list);
        paths.forEach(function (p) { var l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
        gsap.to(paths, { strokeDashoffset: 0, stagger: .25, ease: 'none', scrollTrigger: { trigger: list, start: 'top 80%', end: 'bottom 55%', scrub: true } });
        gsap.from($$('li', list), { x: -24, autoAlpha: 0, stagger: .07, duration: .9, scrollTrigger: { trigger: list, start: 'top 86%', once: true } });
      });

      /* ---- mosaic: three columns, three speeds ---- */
      $$('.mosaic').forEach(function (m) {
        $$('.mosaic__col', m).forEach(function (col, i) {
          gsap.fromTo(col, { y: [0, -60, 40][i % 3] }, { y: [-260, 160, -380][i % 3], ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      });

      /* ---- band: the line of type slides with the scroll ---- */
      $$('[data-band]').forEach(function (band) {
        var track = $('.band__track', band);
        gsap.fromTo(track, { x: function () { return window.innerWidth * .15; } }, { x: function () { return -(track.scrollWidth - window.innerWidth * .85); }, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
      });

      /* ---- film: the frame opens as it arrives ---- */
      $$('.film').forEach(function (f) {
        gsap.fromTo(f, { scale: .86, borderRadius: 28 }, { scale: 1, borderRadius: 16, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'top 25%', scrub: true } });
      });

      /* ---- rows: the text follows its photograph a little late ---- */
      $$('.row__body').forEach(function (b) {
        gsap.from(b.children, { y: 36, autoAlpha: 0, stagger: .08, duration: 1, scrollTrigger: { trigger: b, start: 'top 82%', once: true } });
      });

      /* ---- tiles and gallery: dealt in rows ---- */
      $$('.tiles, .gal').forEach(function (grid) {
        ScrollTrigger.batch($$('.tile, .gal__item', grid), { start: 'top 90%', once: true, onEnter: function (els) {
          gsap.from(els, { y: 60, autoAlpha: 0, stagger: .1, duration: 1.1, overwrite: true });
        } });
      });

      /* ---- article lead photograph ---- */
      $$('.post__lead img').forEach(function (img) {
        gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    },

    late: function () {
      /* ---- related list: a photograph follows the cursor (fine pointers, wide screens) ---- */
      var floatBox = $('[data-more-float]');
      if (!floatBox || !IFA.fine || window.innerWidth <= 991) return;
      var fImg = $('img', floatBox);
      var fx = gsap.quickTo(floatBox, 'x', { duration: .55, ease: 'power3' }), fy = gsap.quickTo(floatBox, 'y', { duration: .55, ease: 'power3' });
      $$('[data-more] .more__link').forEach(function (a) {
        var src = $('.more__thumb img', a);
        a.addEventListener('pointerenter', function () { if (src) fImg.src = src.currentSrc || src.src; gsap.to(floatBox, { autoAlpha: 1, scale: 1, duration: .4 }); });
        a.addEventListener('pointerleave', function () { gsap.to(floatBox, { autoAlpha: 0, scale: .9, duration: .35 }); });
        a.addEventListener('pointermove', function (e) { fx(e.clientX + 24); fy(e.clientY - floatBox.offsetHeight / 2); });
      });
    }
  });
})();
