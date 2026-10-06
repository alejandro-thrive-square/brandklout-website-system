/* Home — the eight approved chapters (split from home.js, 2026-10-01). Runs only where .ch-arrival exists. */
(function () {
  'use strict';
  var IFA = window.IFA, $ = IFA.$, $$ = IFA.$$;
  if (!$('.section_arrival')) return;
  var reduce = IFA.reduce;

  /* -------------------------------------------------------------- hero video */
  /* BugHerd 4: Safari would not start the film until it had been scrolled past and back. WebKit
     refuses or pauses a muted inline video it judges invisible, and at first play() the film is
     inside an opacity:0 box and a clip-path closed to nothing (the entrance). So the film is asked
     again whenever it could newly be allowed: data arriving, the entrance finishing, the first
     scroll, pointer or key, and whenever it comes back on screen. The flags are set as properties
     too, because a muted ATTRIBUTE alone does not always make the element muted. */
  var heroVideo = $('[data-hero-video]');
  var heroOn = true;
  function heroPlay() {
    if (!heroVideo || reduce || !heroOn || !heroVideo.paused) return;
    var p = heroVideo.play(); if (p && p.catch) p.catch(function () {});
  }

  /* ------------------------------------------------------------- compare */
  var compare = $('[data-compare]'), handle = $('[data-handle]');
  var cmp = { pos: 0 };
  function paintCompare() {
    var v = Math.max(0, Math.min(100, cmp.pos));
    compare.style.setProperty('--pos', v.toFixed(2) + '%');
    compare.classList.toggle('is-past', v > 14);
    compare.classList.toggle('is-done', v > 96);
    handle.setAttribute('aria-valuenow', String(Math.round(v)));
  }
  /* BugHerd 18/19: the three steps are controls. A click goes to that step: with motion it scrolls
     the pinned scene to where that step plays; without, it sets the divider. Dragging the divider
     walks the steps too: studied on the before, worn at the midpoint, made on the after. */
  var steps = $$('[data-design-step]'), stepNow = 0, designST = null;
  var STEP_POS = [0, 52, 100], STEP_AT = [.3, .64, .95];
  function setStep(n) {
    if (n === stepNow) return;
    stepNow = n;
    steps.forEach(function (s, i) { s.classList.toggle('is-on', i === n); });
  }
  function stepFromPos() { setStep(cmp.pos < 26 ? 0 : cmp.pos < 76 ? 1 : 2); }
  function goStep(i) {
    setStep(i);
    if (designST) {
      var y = designST.start + (designST.end - designST.start) * STEP_AT[i];
      if (IFA.smoother) IFA.smoother.scrollTo(y, true);
      else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    } else { cmp.pos = STEP_POS[i]; paintCompare(); }
  }

  var panels = $$('[data-disc-panel]');
  function openPanel(p) { panels.forEach(function (o) { o.classList.toggle('is-open', o === p); }); }

  IFA.module({
    init: function () {
      if (heroVideo) {
        heroVideo.muted = true; heroVideo.defaultMuted = true; heroVideo.playsInline = true;
        heroVideo.setAttribute('playsinline', ''); heroVideo.setAttribute('webkit-playsinline', '');
        heroVideo.src = heroVideo.getAttribute(window.innerWidth < 768 ? 'data-src-sm' : 'data-src-lg');
        if (!reduce) {
          heroVideo.autoplay = true;
          ['loadeddata', 'canplay'].forEach(function (n) { heroVideo.addEventListener(n, heroPlay); });
          var nudge = function () { heroPlay(); if (!heroVideo.paused) ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (n) { window.removeEventListener(n, nudge); }); };
          ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (n) { window.addEventListener(n, nudge, { passive: true }); });
          if (window.IntersectionObserver) new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; if (heroOn) heroPlay(); else heroVideo.pause(); }).observe(heroVideo.parentNode);
          heroPlay();
        } else heroVideo.controls = true;
      }

      panels.forEach(function (p) {
        p.addEventListener('mouseenter', function () { if (window.innerWidth > 991) openPanel(p); });
        p.addEventListener('focusin', function () { if (window.innerWidth > 991) openPanel(p); });
        p.addEventListener('click', function () { if (window.innerWidth > 991) openPanel(p); });
      });

      steps.forEach(function (s, i) { s.addEventListener('click', function () { goStep(i); }); });
      if (compare) {
        var dragging = false;
        var fromEvent = function (e) {
          var r = compare.getBoundingClientRect();
          cmp.pos = (e.clientX - r.left) / r.width * 100;
          paintCompare();
          stepFromPos();
        };
        compare.addEventListener('pointerdown', function (e) {
          dragging = true;
          compare.setPointerCapture(e.pointerId);
          fromEvent(e);
        });
        compare.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
        ['pointerup', 'pointercancel'].forEach(function (n) { compare.addEventListener(n, function () { dragging = false; }); });
        handle.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          cmp.pos = Math.max(0, Math.min(100, cmp.pos + (e.key === 'ArrowRight' ? 5 : -5)));
          paintCompare();
          stepFromPos();
        });
        if (!IFA.motion) { cmp.pos = 50; paintCompare(); stepFromPos(); }
      }
    },

    motion: function (ctx) {
      var mm = ctx.mm, GOLD = IFA.GOLD, LIT = IFA.LIT;

      /* ---- 00 · arrival ----
         The stage is as tall as its content. The film sits in a true 16:9 frame, uncropped, and opening
         it is one transform: the same box scaled until it covers the viewport. If the stage is taller
         than the window it pins from its bottom edge, so everything has been read before it opens. */
      var stage = $('[data-arrival-stage]'), fig = $('[data-arrival-fig]'), media = $('[data-arrival-media]');
      var copy = $('[data-arrival-copy]'), facts = $('[data-arrival-facts]'), second = $('[data-arrival-second]');
      var shade = $('.arrival_shade'), h1 = $('.section_arrival .heading-style-h1');

      var heroSplit = SplitText.create(h1, { type: 'lines', linesClass: 'split_line', mask: 'lines' });
      var intro = gsap.timeline({ delay: .15 });
      intro
        .fromTo(media, { clipPath: 'inset(50% 0% 50% 0% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.6, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
        .fromTo(heroVideo, { scale: 1.25 }, { scale: 1, duration: 2.1, clearProps: 'transform' }, 0)
        .from($('.section_arrival .tag').children, { x: -28, autoAlpha: 0, stagger: .08, duration: .9 }, .35)
        .from(heroSplit.lines, { yPercent: 112, stagger: .1, duration: 1.3 }, .45)
        .from($$('.section_arrival [data-rise]'), { y: 30, autoAlpha: 0, stagger: .12, duration: 1 }, .9)
        .from($$('li', facts), { y: 24, autoAlpha: 0, stagger: .08, duration: .9 }, 1.1)
        .call(heroPlay, null, 1.7);
      IFA.unveil();

      /* Where the visible window sits inside the stage while it is pinned, and the one scale that covers it. */
      var open = function () {
        var vw = stage.offsetWidth, vh = window.innerHeight;
        var vt = Math.max(0, stage.offsetHeight - vh);
        var bw = fig.offsetWidth, bh = fig.offsetHeight;
        /* Landscape: cover the window. Portrait (a tablet held upright): full width only, because covering
           a tall window with a 16:9 film would crop it down to a sliver of the doctor's coat. */
        var sc = (vh > vw ? vw / bw : Math.max(vw / bw, vh / bh)) * 1.001;
        return { vt: vt, scale: sc, x: (vw - bw * sc) / 2 - fig.offsetLeft, y: vt + (vh - bh * sc) / 2 - fig.offsetTop };
      };
      var placeSecond = function () { stage.style.setProperty('--vt', open().vt + 'px'); };
      placeSecond();
      ScrollTrigger.addEventListener('refreshInit', placeSecond);

      mm.add('(min-width: 768px)', function () {
        var tl = gsap.timeline({ scrollTrigger: { trigger: stage, pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
          start: function () { return stage.offsetHeight > window.innerHeight + 2 ? 'bottom bottom' : 'top top'; }, end: '+=115%' } });
        tl.to(media, { x: function () { return open().x; }, y: function () { return open().y; }, scale: function () { return open().scale; }, borderRadius: 0, ease: 'power2.inOut', duration: .62 }, 0)
          .to(copy, { y: -90, autoAlpha: 0, ease: 'power1.in', duration: .3 }, 0)
          .to(facts, { y: 30, autoAlpha: 0, ease: 'power1.in', duration: .22 }, 0)
          .to(shade, { opacity: 1, ease: 'none', duration: .6 }, 0)
          .fromTo(second, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: .3 }, .52)
          .to(second, { autoAlpha: 0, y: -50, ease: 'power1.in', duration: .12 }, .9)
          .to({}, { duration: .01 }, .99);
      });
      mm.add('(max-width: 767px)', function () {
        gsap.to(media, { scale: function () { return stage.offsetWidth / fig.offsetWidth * 1.001; }, borderRadius: 0, ease: 'none',
          scrollTrigger: { trigger: fig, start: 'top 15%', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
      });
      ScrollTrigger.create({ trigger: stage, start: 'top bottom', end: 'bottom top', onToggle: function (self) {
        heroOn = self.isActive; if (heroOn) heroPlay(); else heroVideo.pause();
      } });

      /* ---- 01 · the question: the page holds while the copy is written ---- */
      var qStage = $('[data-question-stage]');
      var s1 = $('[data-statement]'), s2 = $('[data-statement-answer]');
      qStage.classList.add('is-live');
      var w1 = SplitText.create(s1, { type: 'words', wordsClass: 'split_word' }).words;
      var w2 = SplitText.create(s2, { type: 'words', wordsClass: 'split_word' }).words;
      var lit = function (i, el) { return el.closest('strong') ? GOLD : LIT; };
      gsap.set(s2, { autoAlpha: 0, y: 50 });
      gsap.timeline({ scrollTrigger: { trigger: qStage, pin: true, start: 'top top', end: '+=100%', scrub: true, anticipatePin: 1 } })
        .to(w1, { color: lit, stagger: .06, duration: .3, ease: 'none' }, 0)
        .to(s1, { autoAlpha: 0, y: -50, ease: 'power1.in', duration: .5 }, '>+.3')
        .to(s2, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: .5 }, '>-.1')
        .to(w2, { color: lit, stagger: .06, duration: .3, ease: 'none' }, '>-.2')
        .to({}, { duration: .5 });
      gsap.fromTo('[data-question-meter]', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: qStage, start: 'top top', end: '+=100%', scrub: true } });
      var qImg = $('.question_image img');
      gsap.fromTo(qImg, { scale: 1.3 }, { scale: 1.001, ease: 'none', scrollTrigger: { trigger: qStage, start: 'top bottom', end: '+=200%', scrub: true } });
      gsap.from($('.question_image'), { clipPath: 'inset(0% 0% 100% 0% round 10px)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: qStage, start: 'top 60%', once: true } });

      /* ---- 02 · disciplines ---- */
      var disc = $('[data-disc]');
      gsap.from(panels, { y: 90, clipPath: 'inset(100% 0% 0% 0% round 13px)', stagger: .16, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: disc, start: 'top 82%', once: true } });
      $$('[data-count]', disc).forEach(function (el) { IFA.countTo(el, disc, 'top 78%', 'top 22%'); });
      gsap.to($('.section_disciplines .chapter_heading'), { y: -50, ease: 'none', scrollTrigger: { trigger: disc, start: 'top 60%', end: 'top top', scrub: true } });

      /* ---- 03 · the design: one pin, scroll is the slider ---- */
      var dStage = $('[data-design-stage]'), notes = $$('[data-note]'), hint = $('[data-design-hint]');
      dStage.classList.add('is-live');
      var drawn = [], faded = [];
      $$('[data-line]').forEach(function (l) {
        if (l.classList.contains('is-soft')) { faded.push(l); return; }
        var len = l.getTotalLength();
        l.style.strokeDasharray = len;
        l.style.strokeDashoffset = len;
        drawn.push(l);
      });
      gsap.set(faded, { autoAlpha: 0 });
      gsap.set(notes, { autoAlpha: 0, y: 8 });
      cmp.pos = 0; paintCompare();
      /* The guide lines and their labels stay on to the end (BugHerd 19): when the scene says "drag",
         the whole design is on screen, and dragging walks the three steps. */
      designST = gsap.timeline({ scrollTrigger: { trigger: dStage, pin: true, start: 'top top', end: '+=300%', scrub: true, anticipatePin: 1,
        onUpdate: function (self) { setStep(self.progress < .33 ? 0 : self.progress < .66 ? 1 : 2); hint.textContent = self.progress > .93 ? 'Drag to compare' : 'Scroll, then drag to compare'; } } })
        .to(drawn, { strokeDashoffset: 0, stagger: .025, duration: .2, ease: 'power1.inOut' }, 0)
        .to(faded, { autoAlpha: .85, stagger: .04, duration: .1 }, .12)
        .to(notes, { autoAlpha: 1, y: 0, stagger: .04, duration: .08 }, .16)
        .to(cmp, { pos: 52, duration: .27, ease: 'power1.inOut', onUpdate: paintCompare }, .36)
        .to(cmp, { pos: 100, duration: .22, ease: 'power1.inOut', onUpdate: paintCompare }, .69)
        .to({}, { duration: .08 }, .92).scrollTrigger;
      gsap.from(compare, { clipPath: 'inset(0% 0% 100% 0% round 11px)', scale: 1.06, duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: dStage, start: 'top 65%', once: true } });

      /* ---- 04 · the specialist ---- */
      var spec = $('.specialist_layout');
      $$('[data-count]', spec).forEach(function (el) { IFA.countTo(el, $('[data-creds]'), 'top 92%', 'top 45%'); });
      gsap.from($$('[data-creds] li'), { y: 30, autoAlpha: 0, stagger: .1, duration: 1, scrollTrigger: { trigger: '[data-creds]', start: 'top 88%', once: true } });
      gsap.fromTo('[data-spin]', { rotation: -35 }, { rotation: 55, ease: 'none', scrollTrigger: { trigger: spec, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to('.specialist_inset', { y: -70, ease: 'none', scrollTrigger: { trigger: spec, start: 'top bottom', end: 'bottom top', scrub: true } });

      /* ---- 05 · the path: the treatment travels sideways ---- */
      var pStage = $('[data-path-stage]'), pRail = $('[data-path-rail]'), pBar = $('[data-path-bar]'), pNow = $('[data-path-now]');
      var pSteps = $$('.path_step', pRail);
      var travel = function () { return Math.max(0, pRail.scrollWidth - window.innerWidth); };
      var ride = gsap.to(pRail, { x: function () { return -travel(); }, ease: 'none', scrollTrigger: { trigger: pStage, pin: true, start: 'top top', end: function () { return '+=' + travel(); }, scrub: true, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (self) {
          pBar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
          var mid = window.innerWidth / 2, best = 0, bestD = 1e9;
          for (var i = 0; i < 6; i++) { var r = pSteps[i].getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bestD) { bestD = d; best = i; } }
          pNow.textContent = '0' + (best + 1);
        } } });
      $$('.path_step-image img', pRail).forEach(function (img) {
        gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: img.parentNode, containerAnimation: ride, start: 'left right', end: 'right left', scrub: true } });
      });
      gsap.from(pSteps, { y: 70, autoAlpha: 0, stagger: .1, duration: 1.2, scrollTrigger: { trigger: pStage, start: 'top 70%', once: true } });

      /* ---- 06 · the proof: the deck is dealt by the scroll ---- */
      var deck = $('[data-deck]'), cards = $$('[data-card]', deck);
      var deckFrom = function (axis) {
        return function (i, el) {
          return axis === 'x' ? deck.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2) : deck.offsetHeight / 2 - (el.offsetTop + el.offsetHeight / 2) + 80;
        };
      };
      gsap.fromTo(cards,
        { x: deckFrom('x'), y: deckFrom('y'), rotation: function (i) { return (i - 1.5) * 7; }, scale: .86 },
        { x: 0, y: 0, rotation: 0, scale: 1, ease: 'power2.out', stagger: .06, immediateRender: false, scrollTrigger: { trigger: deck, start: 'top 92%', end: 'top 30%', scrub: true, invalidateOnRefresh: true } });
      if ($('[data-voices]')) gsap.from('.voices_component > *', { y: 40, autoAlpha: 0, stagger: .12, scrollTrigger: { trigger: '[data-voices]', start: 'top 85%', once: true } });
    },

    /* ---- departures: leaving a chapter is animated too (after the invitation, as on the approved page) ---- */
    late: function () {
      [['.section_disciplines', '.disciplines_panels'], ['.section_specialist', '.specialist_layout'], ['.section_proof', '.section_proof > .container-large']].forEach(function (pair) {
        gsap.to(pair[1], { y: -70, scale: .985, transformOrigin: '50% 100%', ease: 'none', scrollTrigger: { trigger: pair[0], start: 'bottom 70%', end: 'bottom top', scrub: true } });
      });
    }
  });
})();
