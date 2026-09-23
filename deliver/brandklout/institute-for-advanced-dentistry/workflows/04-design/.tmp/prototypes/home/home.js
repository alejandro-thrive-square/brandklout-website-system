/* Institute for Advanced Dentistry — home. Motion layer.
   Everything is readable with this file absent: initial hidden states are written here, never in CSS.
   Reduced motion (or ?motion=off) skips every pin and scrub and leaves the controls working. */
(function () {
  'use strict';

  var html = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]motion=off/.test(location.search);
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var motion = hasGsap && !reduce;
  var smoother = null;

  var GOLD = '#74560f';   /* gold as TEXT on a light ground */
  var LIT = '#1d1b1c';

  if (!motion) html.classList.add('no-motion');

  function unveil() { html.classList.add('is-ready'); }

  /* ------------------------------------------------------------------ chrome */
  var nav = $('[data-nav]'), progress = $('[data-progress]');
  var callbar = $('[data-callbar]'), ask = $('[data-ask]');
  var chapters = $$('[data-chapter]');
  var queued = false;

  function chapterAt(y) {
    for (var i = chapters.length - 1; i >= 0; i--) {
      var r = chapters[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) return chapters[i];
    }
    return chapters[0];
  }

  function updateChrome() {
    queued = false;
    var max = Math.max(1, html.scrollHeight - window.innerHeight);
    var y = window.pageYOffset || html.scrollTop;
    progress.style.transform = 'scaleX(' + Math.min(1, Math.max(0, y / max)).toFixed(4) + ')';
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-light', chapterAt(nav.offsetHeight / 2).getAttribute('data-theme') === 'light');
    if (ask) {
      var a = ask.getBoundingClientRect();
      callbar.classList.toggle('is-away', a.top < window.innerHeight - 80 && a.bottom > 80);
    }
  }
  function queueChrome() { if (!queued) { queued = true; requestAnimationFrame(updateChrome); } }
  window.addEventListener('scroll', queueChrome, { passive: true });
  window.addEventListener('resize', queueChrome);
  updateChrome();

  $('[data-year]').textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------ in-page links */
  function goTo(target) {
    if (smoother) smoother.scrollTo(target, true, 'top top');
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      closeDrawer();
      goTo(t);
    });
  });

  /* ------------------------------------------------------------------ drawer */
  var burger = $('[data-burger]'), drawer = $('[data-drawer]');
  function lockScroll(lock) {
    if (smoother) smoother.paused(lock);
    document.body.style.overflow = lock ? 'hidden' : '';
  }
  function openDrawer() {
    drawer.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    lockScroll(true);
    if (motion) {
      gsap.fromTo(drawer, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: .9, ease: 'expo.inOut' });
      gsap.from($$('nav a', drawer), { yPercent: 60, autoAlpha: 0, stagger: .05, duration: .8, delay: .25, ease: 'expo.out' });
    }
  }
  function closeDrawer() {
    if (drawer.hidden) return;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    lockScroll(false);
    if (motion) gsap.to(drawer, { clipPath: 'circle(0% at 100% 0%)', duration: .6, ease: 'expo.inOut', onComplete: function () { drawer.hidden = true; } });
    else drawer.hidden = true;
  }
  burger.addEventListener('click', function () { if (drawer.hidden) openDrawer(); else closeDrawer(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); closeModal(); } });

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

  /* ------------------------------------------------------------- story modal */
  var modal = $('[data-modal]'), modalVideo = $('[data-modal-video]'), lastFocus = null;
  function openModal(src, name) {
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-label', name + ' tells the story');
    modalVideo.src = src;
    var p = modalVideo.play(); if (p && p.catch) p.catch(function () {});
    lockScroll(true);
    if (motion) gsap.fromTo(modal, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4 });
    if (motion) gsap.fromTo($('.modal__box', modal), { scale: .92, y: 30 }, { scale: 1, y: 0, duration: .7, ease: 'expo.out' });
    $('[data-modal-close]').focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
    modal.hidden = true;
    lockScroll(false);
    if (lastFocus) lastFocus.focus();
  }
  $$('[data-story]').forEach(function (b) {
    b.addEventListener('click', function () { openModal(b.getAttribute('data-story'), b.getAttribute('data-story-name')); });
  });
  $('[data-modal-close]').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  /* ----------------------------------------------------------------- voices */
  var voices = $('[data-voices]');
  if (voices) {
    var vs = $$('[data-voice]', voices), vi = 0, vCount = $('[data-voice-count]', voices), vBusy = false;
    voices.classList.add('is-live');
    var showVoice = function (next, dir) {
      if (vBusy || next === vi) return;
      var from = vs[vi], to = vs[next];
      vi = next;
      vCount.textContent = '0' + (vi + 1) + ' / 0' + vs.length;
      if (!motion) { from.classList.remove('is-on'); to.classList.add('is-on'); return; }
      vBusy = true;
      gsap.to(from, { y: -24 * dir, autoAlpha: 0, duration: .45, ease: 'power2.in', onComplete: function () {
        from.classList.remove('is-on'); gsap.set(from, { clearProps: 'all' });
        to.classList.add('is-on');
        gsap.fromTo(to, { y: 30 * dir, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .8, ease: 'expo.out', onComplete: function () { vBusy = false; } });
      } });
    };
    /* BugHerd 33: the reviews turn on their own, stop while the pointer or keyboard focus is on
       them (WCAG 2.2.2) and while they are off screen; the arrows still work and restart the clock. */
    var vHold = false, vSeen = false, vTimer = null;
    var vArm = function () {
      clearTimeout(vTimer);
      if (reduce) return;
      vTimer = setTimeout(function () { if (!vHold && vSeen && !document.hidden) showVoice((vi + 1) % vs.length, 1); vArm(); }, 6500);
    };
    voices.addEventListener('pointerenter', function () { vHold = true; });
    voices.addEventListener('pointerleave', function () { vHold = false; vArm(); });
    voices.addEventListener('focusin', function () { vHold = true; });
    voices.addEventListener('focusout', function (e) { if (!voices.contains(e.relatedTarget)) { vHold = false; vArm(); } });
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { vSeen = es[0].isIntersecting; if (vSeen) vArm(); }, { threshold: .4 }).observe(voices);
    else vSeen = true;
    $('[data-voice-next]', voices).addEventListener('click', function () { showVoice((vi + 1) % vs.length, 1); vArm(); });
    $('[data-voice-prev]', voices).addEventListener('click', function () { showVoice((vi - 1 + vs.length) % vs.length, -1); vArm(); });
    vArm();
  }

  /* -------------------------------------------------------------------- faq */
  /* Without this file every answer is open. With it, the first stays open and the rest fold. */
  $$('[data-faq-item]').forEach(function (item, i) {
    var btn = $('[data-faq-btn]', item), ans = $('[data-faq-a]', item);
    var set = function (open) { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); ans.hidden = !open; };
    set(i === 0);
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      set(open);
      if (open && motion) gsap.fromTo(ans, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: .6, ease: 'expo.out', clearProps: 'height,opacity,visibility' });
    });
  });

  /* ------------------------------------------------------------ disciplines */
  var panels = $$('[data-disc-panel]');
  function openPanel(p) { panels.forEach(function (o) { o.classList.toggle('is-open', o === p); }); }
  panels.forEach(function (p) {
    p.addEventListener('mouseenter', function () { if (window.innerWidth > 991) openPanel(p); });
    p.addEventListener('focusin', function () { if (window.innerWidth > 991) openPanel(p); });
    p.addEventListener('click', function () { if (window.innerWidth > 991) openPanel(p); });
  });

  /* ---------------------------------------------------------------- compare */
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
      if (smoother) smoother.scrollTo(y, true);
      else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    } else { cmp.pos = STEP_POS[i]; paintCompare(); }
  }
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
    if (!motion) { cmp.pos = 50; paintCompare(); stepFromPos(); }
  }

  /* ------------------------------------------------------------------- form */
  if (ask) {
    ask.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = 0;
      $$('input[required]', ask).forEach(function (i) {
        var ok = i.value.trim() !== '' && i.checkValidity();
        i.parentNode.classList.toggle('is-bad', !ok);
        i.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) bad++;
      });
      $('[data-ask-note]', ask).textContent = bad
        ? 'Please complete the highlighted fields.'
        : 'Design preview: on the live site this slot is the practice\'s own GoHighLevel form, so nothing was sent.';
    });
  }

  if (!motion) { unveil(); return; }

  /* ==========================================================================
     MOTION
     ========================================================================== */
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
  gsap.defaults({ ease: 'expo.out', duration: 1.1 });

  if (fine && window.innerWidth > 991 && !/[?&]smooth=off/.test(location.search)) {
    smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, effects: false, normalizeScroll: false });
  }

  /* document.fonts.ready resolves before the faces are parsed; ask for the faces by name. */
  var faces = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('300 1em Jost'), document.fonts.load('italic 400 1em "Instrument Serif"'), document.fonts.load('400 1em "IBM Plex Mono"')])
    : Promise.resolve();
  var started = false;
  function start() { if (started) return; started = true; build(); }
  faces.then(start, start);
  setTimeout(start, 2500);

  function countTo(el, trigger, startAt, endAt) {
    var target = parseFloat(el.getAttribute('data-count'));
    var from = parseFloat(el.getAttribute('data-from') || '0');
    var suffix = el.getAttribute('data-suffix') || '';
    var comma = el.hasAttribute('data-comma');
    var o = { v: from };
    var write = function () {
      var n = Math.round(o.v);
      el.textContent = (comma ? n.toLocaleString('en-US') : String(n)) + suffix;
    };
    gsap.to(o, { v: target, ease: 'power2.out', onUpdate: write, scrollTrigger: { trigger: trigger, start: startAt, end: endAt, scrub: true } });
  }

  function build() {
    var mm = gsap.matchMedia();

    /* ---- arrivals shared by every chapter ---- */
    $$('[data-tag]').forEach(function (tag) {
      if (tag.closest('.ch-arrival')) return;
      gsap.from(tag.children, { x: -28, autoAlpha: 0, stagger: .08, duration: .9, scrollTrigger: { trigger: tag, start: 'top 88%', once: true } });
    });
    $$('[data-split="lines"]').forEach(function (el) {
      if (el.closest('.ch-arrival')) return;
      SplitText.create(el, { type: 'lines', linesClass: 'ln', mask: 'lines', autoSplit: true, onSplit: function (self) {
        return gsap.from(self.lines, { yPercent: 112, stagger: .09, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
      } });
    });
    $$('[data-rise]').forEach(function (el) {
      if (el.closest('.ch-arrival')) return;
      gsap.from(el, { y: 34, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-wipe]').forEach(function (el, i) {
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round 11px)' }, { clipPath: 'inset(0% 0% 0% 0% round 11px)', duration: 1.4, delay: i * .15, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      gsap.from($('img', el), { scale: 1.25, duration: 1.8, delay: i * .15, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    $$('[data-parallax]').forEach(function (img) {
      var amt = parseFloat(img.getAttribute('data-parallax'));
      gsap.fromTo(img, { yPercent: 0 }, { yPercent: -amt, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* ---- 00 · arrival ----
       The stage is as tall as its content. The film sits in a true 16:9 frame, uncropped, and opening
       it is one transform: the same box scaled until it covers the viewport. If the stage is taller
       than the window it pins from its bottom edge, so everything has been read before it opens. */
    var stage = $('[data-arrival-stage]'), fig = $('[data-arrival-fig]'), media = $('[data-arrival-media]');
    var copy = $('[data-arrival-copy]'), facts = $('[data-arrival-facts]'), second = $('[data-arrival-second]');
    var shade = $('.arrival__shade'), h1 = $('.ch-arrival .d1');

    var heroSplit = SplitText.create(h1, { type: 'lines', linesClass: 'ln', mask: 'lines' });
    var intro = gsap.timeline({ delay: .15 });
    intro
      .fromTo(media, { clipPath: 'inset(50% 0% 50% 0% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.6, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
      .fromTo(heroVideo, { scale: 1.25 }, { scale: 1, duration: 2.1, clearProps: 'transform' }, 0)
      .from($('.ch-arrival .tag').children, { x: -28, autoAlpha: 0, stagger: .08, duration: .9 }, .35)
      .from(heroSplit.lines, { yPercent: 112, stagger: .1, duration: 1.3 }, .45)
      .from($$('.ch-arrival [data-rise]'), { y: 30, autoAlpha: 0, stagger: .12, duration: 1 }, .9)
      .from($$('li', facts), { y: 24, autoAlpha: 0, stagger: .08, duration: .9 }, 1.1)
      .call(heroPlay, null, 1.7);
    unveil();

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
    var w1 = SplitText.create(s1, { type: 'words', wordsClass: 'w' }).words;
    var w2 = SplitText.create(s2, { type: 'words', wordsClass: 'w' }).words;
    var lit = function (i, el) { return el.closest('strong') ? GOLD : LIT; };
    gsap.set(s2, { autoAlpha: 0, y: 50 });
    gsap.timeline({ scrollTrigger: { trigger: qStage, pin: true, start: 'top top', end: '+=100%', scrub: true, anticipatePin: 1 } })
      .to(w1, { color: lit, stagger: .06, duration: .3, ease: 'none' }, 0)
      .to(s1, { autoAlpha: 0, y: -50, ease: 'power1.in', duration: .5 }, '>+.3')
      .to(s2, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: .5 }, '>-.1')
      .to(w2, { color: lit, stagger: .06, duration: .3, ease: 'none' }, '>-.2')
      .to({}, { duration: .5 });
    gsap.fromTo('[data-question-meter]', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: qStage, start: 'top top', end: '+=100%', scrub: true } });
    var qImg = $('.question__img img');
    gsap.fromTo(qImg, { scale: 1.3 }, { scale: 1.001, ease: 'none', scrollTrigger: { trigger: qStage, start: 'top bottom', end: '+=200%', scrub: true } });
    gsap.from($('.question__img'), { clipPath: 'inset(0% 0% 100% 0% round 10px)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: qStage, start: 'top 60%', once: true } });

    /* ---- 02 · disciplines ---- */
    var disc = $('[data-disc]');
    gsap.from(panels, { y: 90, clipPath: 'inset(100% 0% 0% 0% round 13px)', stagger: .16, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: disc, start: 'top 82%', once: true } });
    $$('[data-count]', disc).forEach(function (el) { countTo(el, disc, 'top 78%', 'top 22%'); });
    gsap.to($('.ch-disciplines .ch__head'), { y: -50, ease: 'none', scrollTrigger: { trigger: disc, start: 'top 60%', end: 'top top', scrub: true } });

    /* ---- 03 · the design: one pin, scroll is the slider ---- */
    var dStage = $('[data-design-stage]'), notes = $$('[data-note]'), hint = $('[data-design-hint]');
    dStage.classList.add('is-live');
    var drawn = [], faded = [];
    $$('[data-line]').forEach(function (l) {
      if (l.classList.contains('g--soft')) { faded.push(l); return; }
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
    var spec = $('.specialist');
    $$('[data-count]', spec).forEach(function (el) { countTo(el, $('[data-creds]'), 'top 92%', 'top 45%'); });
    gsap.from($$('[data-creds] li'), { y: 30, autoAlpha: 0, stagger: .1, duration: 1, scrollTrigger: { trigger: '[data-creds]', start: 'top 88%', once: true } });
    gsap.fromTo('[data-spin]', { rotation: -35 }, { rotation: 55, ease: 'none', scrollTrigger: { trigger: spec, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.specialist__inset', { y: -70, ease: 'none', scrollTrigger: { trigger: spec, start: 'top bottom', end: 'bottom top', scrub: true } });

    /* velocity-reactive memberships marquee */
    var track = $('[data-marquee-track]'), set = $('.marquee__set', track);
    for (var c = 0; c < 3; c++) { var clone = set.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.appendChild(clone); }
    var loop = gsap.to(track, { x: function () { return -set.offsetWidth; }, duration: 28, ease: 'none', repeat: -1 });
    loop.totalTime(28 * 40);
    var mq = $('[data-marquee]'), mqHold = false;
    var mqStop = function () { mqHold = true; gsap.killTweensOf(loop); gsap.to(loop, { timeScale: 0, duration: .35, ease: 'power2.out' }); };
    var mqGo = function () { mqHold = false; gsap.to(loop, { timeScale: 1, duration: .8, ease: 'power2.in' }); };
    mq.addEventListener('pointerenter', mqStop); mq.addEventListener('pointerleave', mqGo);
    mq.addEventListener('focusin', mqStop); mq.addEventListener('focusout', mqGo);
    ScrollTrigger.create({ trigger: '[data-marquee]', start: 'top bottom', end: 'bottom top', onUpdate: function (self) {
      if (mqHold) return;
      var v = gsap.utils.clamp(-7, 7, self.getVelocity() / 260), dir = v < 0 ? -1 : 1;
      gsap.to(loop, { timeScale: dir * (1 + Math.abs(v)), duration: .2, overwrite: true, onComplete: function () { gsap.to(loop, { timeScale: dir, duration: 1.4, ease: 'power2.out' }); } });
    } });

    /* ---- 05 · the path: the treatment travels sideways ---- */
    var pStage = $('[data-path-stage]'), pRail = $('[data-path-rail]'), pBar = $('[data-path-bar]'), pNow = $('[data-path-now]');
    var pSteps = $$('.step', pRail);
    var travel = function () { return Math.max(0, pRail.scrollWidth - window.innerWidth); };
    var ride = gsap.to(pRail, { x: function () { return -travel(); }, ease: 'none', scrollTrigger: { trigger: pStage, pin: true, start: 'top top', end: function () { return '+=' + travel(); }, scrub: true, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: function (self) {
        pBar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
        var mid = window.innerWidth / 2, best = 0, bestD = 1e9;
        for (var i = 0; i < 6; i++) { var r = pSteps[i].getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bestD) { bestD = d; best = i; } }
        pNow.textContent = '0' + (best + 1);
      } } });
    $$('.step__img img', pRail).forEach(function (img) {
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
    gsap.from('.voices > *', { y: 40, autoAlpha: 0, stagger: .12, scrollTrigger: { trigger: voices, start: 'top 85%', once: true } });

    /* ---- 07 · the invitation ---- */
    /* The form card is NEVER pinned and never faded. A pin lifts its element out of the page and puts
       it back on every ScrollTrigger refresh, and a browser reloads an <iframe> each time it is moved:
       pinned, the GoHighLevel form reloaded 25 times in four seconds ("submission in progress") and
       its card was frozen at the height it had before the form grew. A lead form must also never
       depend on an animation to be visible. It only rises a little. */
    gsap.from(ask, { y: 40, duration: 1.2, scrollTrigger: { trigger: ask, start: 'top 92%', once: true } });
    gsap.from('.includes li', { x: -24, autoAlpha: 0, stagger: .07, duration: .9, scrollTrigger: { trigger: '.includes', start: 'top 86%', once: true } });

    /* ---- departures: leaving a chapter is animated too ---- */
    [['.ch-disciplines', '.disc'], ['.ch-specialist', '.specialist'], ['.ch-proof', '.ch-proof > .wrap']].forEach(function (pair) {
      gsap.to(pair[1], { y: -70, scale: .985, transformOrigin: '50% 100%', ease: 'none', scrollTrigger: { trigger: pair[0], start: 'bottom 70%', end: 'bottom top', scrub: true } });
    });

    /* ---- pointer craft ---- */
    if (fine) {
      $$('[data-magnetic]').forEach(function (el) {
        var mx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          mx((e.clientX - r.left - r.width / 2) * .28); my((e.clientY - r.top - r.height / 2) * .38);
        });
        el.addEventListener('pointerleave', function () { mx(0); my(0); });
      });

      $$('.card__btn').forEach(function (el) {
        var rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3' });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - .5) * 12); rx(-((e.clientY - r.top) / r.height - .5) * 10);
        });
        el.addEventListener('pointerleave', function () { rx(0); ry(0); });
      });
    }

    /* A change in page height moves every trigger after it; re-measure when it happens. */
    var lastH = 0, rt = null;
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        var h = $('#smooth-content').offsetHeight;
        if (Math.abs(h - lastH) < 4) return;
        lastH = h;
        clearTimeout(rt);
        rt = setTimeout(function () { ScrollTrigger.refresh(); queueChrome(); }, 200);
      }).observe($('#smooth-content'));
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    ScrollTrigger.addEventListener('refresh', queueChrome);
    if (smoother) gsap.ticker.add(queueChrome);
  }
})();
