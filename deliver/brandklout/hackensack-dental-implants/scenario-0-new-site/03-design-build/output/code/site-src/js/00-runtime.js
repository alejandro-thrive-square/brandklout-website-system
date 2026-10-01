/* WZ runtime for the Hackensack home page (concept 04, elevated).
 *
 * The composition at rest is the concept's. The motion layer is editorial: a curtain on arrival, a
 * cursor that names what it is over, buttons that roll their label, headlines that rise word by
 * word, a hero film the scroll opens to the full window, and scenes where scroll drives the content
 * (the patient's sentence, the four steps, the before and after, the closing words). Between them:
 * the practice's numbers counting up, implant drawings that draw themselves, a CBCT scan line that
 * sweeps its photograph, a circle that opens onto the full-arch patient, and an accordion that eases.
 *
 * Two layers. The interface layer (anchors, FAQ, call bar, the hero film and its light box, staging
 * noindex) runs on every visit.
 * The motion layer runs only when GSAP loaded and the visitor has not asked for reduced motion.
 * Every reveal is a ScrollTrigger; no visibility observers. Everything the motion layer adds to
 * the page (curtain, cursor, drawings, scan line) is created here, so the imported page never
 * carries markup that only motion needs.
 *
 * Contract with the gates (tools/instatic-site/gates/check-pages.mjs): window.WZ.ok, WZ.smoother,
 * WZ.active, and pinned triggers that carry an id.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var WZ = (window.WZ = { ok: false, smoother: null, active: [], build: 'hackensack-home-concept-04-film' });
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mark = function (name) { WZ.active.push(name); };
  /* Decided here, not in <head>: Instatic serves one script asset, as a deferred module. */
  var MOTION = !!(window.gsap && window.ScrollTrigger && window.SplitText) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (MOTION) root.classList.add('motion');
  var refreshSoon = (function () {
    var t;
    return function () { clearTimeout(t); t = setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 150); };
  })();

  /* ================= interface ================= */

  /* Staging stays out of Google. Before launch staging is a Railway host that no Cloudflare rule
     can reach, so the page says it itself. Host-conditional, never a deletion: on production this
     is a no-op, so the asset is safe to promote. */
  if (/-staging[.]up[.]railway[.]app$|^staging[.]/i.test(location.hostname)) {
    var robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
  }

  /* in-page anchors */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    /* ScrollSmoother keeps a focused element in view, and a mouse click focuses the link: left
       there, it held the page near the top. A mouse click lets go of focus; a keyboard press
       (detail 0) hands it to the destination, as an in-page link should. */
    if (e.detail === 0) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    } else a.blur();
    if (WZ.smoother) WZ.smoother.scrollTo(target, true, 'top 12px');
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 12, behavior: MOTION ? 'smooth' : 'auto' });
  });

  /* FAQ: one answer open at a time, as the concept opens with its first. With motion the answer
     eases open and shut; without it the native <details> behaviour is untouched. */
  $$('.js-faq').forEach(function (list) {
    var items = $$('details', list);
    items.forEach(function (d) {
      var summary = $('summary', d);
      var answer = $('p', d);
      d.addEventListener('toggle', function () {
        /* the others shut at once, so only one answer is ever open */
        if (d.open) items.forEach(function (other) { if (other !== d && other.open) { if (MOTION) { gsap.killTweensOf($('p', other)); gsap.set($('p', other), { clearProps: 'all' }); } other.open = false; } });
        refreshSoon();
      });
      if (!MOTION || !summary || !answer) return;
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        if (d.open) close(d);
        else {
          d.open = true;
          gsap.fromTo(answer, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: 0.55, ease: 'power3.out', clearProps: 'height', onComplete: refreshSoon });
        }
      });
    });
    function close(d) {
      var answer = $('p', d);
      if (!MOTION || !answer) { d.open = false; return; }
      gsap.to(answer, { height: 0, autoAlpha: 0, duration: 0.4, ease: 'power2.inOut', onComplete: function () { d.open = false; gsap.set(answer, { clearProps: 'all' }); refreshSoon(); } });
    }
  });

  /* the phone call bar steps aside while the consultation form is on screen */
  var callbar = $('.mobile-cta');
  var form = $('#consultation');
  if (callbar && form) {
    var ticking = false;
    var check = function () {
      ticking = false;
      var r = form.getBoundingClientRect();
      callbar.classList.toggle('is-away', r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.25);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
    check();
  }

  /* ---- the hero film: a muted loop of the practice's own patient films ----
     Its src lives in data-src (data-src-mobile under 768px) because the importer keeps a tag's
     attributes but not <source> children. A visitor who asked for reduced motion keeps the poster.
     It plays only while on screen, and a control stops it (WCAG 2.2.2). */
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heroVideo = $('.js-hero-video');
  var heroFrame = $('.js-hero-frame');
  if (heroVideo && heroFrame && !REDUCED) {
    var vsrc = (window.matchMedia('(max-width: 767px)').matches && heroVideo.getAttribute('data-src-mobile')) || heroVideo.getAttribute('data-src');
    heroVideo.muted = true;
    heroVideo.loop = true;
    heroVideo.playsInline = true;
    heroVideo.setAttribute('muted', '');
    heroVideo.setAttribute('playsinline', '');
    heroVideo.preload = 'auto';
    heroVideo.src = vsrc;
    var held = false; /* the visitor paused it */
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'film-toggle';
    heroFrame.appendChild(toggle);
    var label = function () {
      var paused = heroVideo.paused;
      toggle.classList.toggle('is-paused', paused);
      toggle.setAttribute('aria-label', paused ? 'Play the background video' : 'Pause the background video');
    };
    var play = function () { var pr = heroVideo.play(); if (pr && pr.catch) pr.catch(function () { label(); }); };
    toggle.addEventListener('click', function () {
      if (heroVideo.paused) { held = false; play(); } else { held = true; heroVideo.pause(); }
    });
    heroVideo.addEventListener('play', label);
    heroVideo.addEventListener('pause', label);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { if (!held) play(); } else heroVideo.pause(); });
      }).observe(heroFrame);
    } else play();
    label();
    WZ.film = heroVideo;
    mark('film');
  }

  /* ---- the full patient film, with sound, in a light box ----
     The play button is a plain link to the file, so without a script it still opens the film. */
  var lastFocus = null;
  var closeFilm = function () {
    var box = $('.film');
    if (!box) return;
    var v = $('video', box);
    if (v) v.pause();
    box.remove();
    document.removeEventListener('keydown', filmKeys);
    if (WZ.smoother) WZ.smoother.paused(false);
    if (heroVideo && heroVideo.src && !held) heroVideo.play().catch(function () {});
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  var filmKeys = function (e) {
    if (e.key === 'Escape') { closeFilm(); return; }
    if (e.key !== 'Tab') return;
    /* keep focus inside the light box: the close button and the player */
    var box = $('.film');
    var f = box ? $$('button, video', box) : [];
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  $$('.js-film').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      lastFocus = link;
      if (heroVideo) heroVideo.pause();
      if (WZ.smoother) WZ.smoother.paused(true);
      var box = document.createElement('div');
      box.className = 'film';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', "Isaac's story, a patient film");
      box.innerHTML = '<div class="film__box"><p class="film__title">Isaac\u2019s story</p><button type="button" class="film__close">Close</button><video controls playsinline preload="auto"></video></div>';
      var v = $('video', box);
      v.src = link.getAttribute('href');
      document.body.appendChild(box);
      box.addEventListener('click', function (ev) { if (ev.target === box) closeFilm(); });
      $('.film__close', box).addEventListener('click', closeFilm);
      document.addEventListener('keydown', filmKeys);
      $('.film__close', box).focus();
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () {});
    });
  });

  if (!MOTION) { WZ.ok = true; mark('interface'); return; }

  /* ================= motion ================= */
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  var INK = '#292824';
  var EASE = 'power3.out';
  var mm = gsap.matchMedia();
  var el = function (tag, cls, parent) { var n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };

  /* smooth scroll on desktop only */
  if (window.matchMedia('(min-width: 992px)').matches && ScrollTrigger.isTouch !== 1) {
    WZ.smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, effects: false });
    root.classList.add('smooth');
    mark('smoother');
  }
  root.classList.add('is-armed');

  /* ---- arrival curtain: the round mark, a line that fills, then the page is uncovered ----
     Once per session, and never longer than about a second. */
  var intro = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  var seen = false;
  try { seen = sessionStorage.getItem('hk-curtain') === '1'; sessionStorage.setItem('hk-curtain', '1'); } catch (e) { seen = false; }
  /* A script that arrives late would put the curtain over a page the visitor is already reading. */
  if (!seen && window.pageYOffset < 10 && performance.now() < 2500) {
    var curtain = el('div', 'curtain', document.body);
    curtain.setAttribute('aria-hidden', 'true');
    var logo = $('.brand img');
    if (logo) { var mk = el('img', 'curtain__mark', curtain); mk.src = logo.currentSrc || logo.src; mk.alt = ''; }
    var bar = el('span', 'curtain__bar', curtain);
    intro
      .from('.curtain__mark', { scale: 0.8, autoAlpha: 0, duration: 0.45, ease: EASE })
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.55 }, '<0.1')
      .to(curtain, { clipPath: 'inset(0 0 100% 0)', duration: 0.75 }, '+=0.05')
      .add(function () { curtain.remove(); });
    mark('curtain');
  }

  /* ---- headlines: words rise out of line masks; the split redoes itself when fonts or width change ---- */
  $$('.js-split').forEach(function (h) {
    var hero = h.classList.contains('js-split-hero');
    SplitText.create(h, {
      type: 'lines,words', mask: 'lines', linesClass: 'ln', wordsClass: 'wh', autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.words, {
          yPercent: 115, rotate: 3, transformOrigin: '0% 100%', duration: hero ? 1.25 : 1.05, stagger: hero ? 0.06 : 0.035, ease: 'power4.out',
          delay: hero ? intro.duration() * 0.72 : 0,
          scrollTrigger: hero ? null : { trigger: h, start: 'top 88%', once: true }
        });
      }
    });
  });
  /* kickers type themselves in */
  $$('.kicker').forEach(function (k) {
    var chars = SplitText.create(k, { type: 'chars', charsClass: 'kc' }).chars;
    gsap.from(chars, { autoAlpha: 0, y: 6, duration: 0.5, stagger: 0.018, ease: EASE, delay: k.closest('.hero') ? intro.duration() * 0.7 : 0, scrollTrigger: k.closest('.hero') ? null : { trigger: k, start: 'top 90%', once: true } });
  });
  mark('split');

  /* ---- hero: the film rises into its frame; scrolling away, the frame opens to the full window ---- */
  var hero = $('.hero');
  if (hero) {
    var frame = $('.js-hero-frame', hero);
    var film = $('.hero-film', hero);
    var heroVid = $('.js-hero-video', hero);
    var d0 = intro.duration() * 0.6;
    /* how far the page margin is from the window edge: the film starts inside it */
    var side = function () { return Math.max(0, $('.hero-grid', hero).getBoundingClientRect().left); };
    var inset = function (top, x, r) { return 'inset(' + top + '% ' + x + 'px 0% ' + x + 'px round ' + r + 'px)'; };
    var radius = function () { return parseFloat(getComputedStyle(frame).borderTopLeftRadius) || 28; };
    gsap.from($$('.js-rise', hero), { y: 34, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: EASE, delay: d0 + 0.35 });
    gsap.from([$('.hero-doctor', hero), $('.hero-play', hero)], { y: 40, autoAlpha: 0, duration: 1, stagger: 0.12, ease: EASE, delay: d0 + 0.9 });
    gsap.fromTo(heroVid, { scale: 1.25 }, { scale: 1.04, duration: 2.4, ease: EASE, delay: d0 });
    mm.add({ wide: '(min-width: 992px)', narrow: '(max-width: 991px)' }, function (ctx) {
      if (ctx.conditions.narrow) {
        gsap.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1.4, ease: 'power4.inOut', delay: d0, clearProps: 'clipPath' });
        return;
      }
      /* the margins become a clip-path (25-interaction.css drops them under .motion), so the frame
         can open to the window without moving the cards that sit on the page grid */
      var r = radius();
      frame.style.borderRadius = '0';
      gsap.fromTo(frame, { clipPath: function () { return inset(100, side(), r); } }, { clipPath: function () { return inset(0, side(), r); }, duration: 1.5, ease: 'power4.inOut', delay: d0 });
      gsap.timeline({ scrollTrigger: { id: 'hero-film', trigger: hero, start: 'top top', end: 'bottom 55%', scrub: 0.6, invalidateOnRefresh: true } })
        .fromTo(frame, { clipPath: function () { return inset(0, side(), r); } }, { clipPath: inset(0, 0, 0), ease: 'none', immediateRender: false }, 0)
        .to($('h1', hero), { y: -40, ease: 'none' }, 0)
        .to($('.hero-copy', hero), { y: -70, ease: 'none' }, 0);
      return function () { frame.style.borderRadius = ''; gsap.set(frame, { clearProps: 'clipPath' }); };
    });
    mark('hero');
  }

  /* ---- the practice in numbers: each figure counts up once, the first time it is seen ---- */
  $$('.js-stats .stat strong').forEach(function (n, i) {
    var end = parseFloat(n.getAttribute('data-count'));
    if (isNaN(end)) return;
    var dec = parseInt(n.getAttribute('data-decimals') || '0', 10);
    var suffix = n.getAttribute('data-suffix') || '';
    var fmt = function (v) { return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix; };
    var o = { v: 0 };
    n.textContent = fmt(0);
    gsap.to(o, { v: end, duration: 1.8, delay: i * 0.12, ease: 'power2.out', onUpdate: function () { n.textContent = fmt(dec ? o.v : Math.round(o.v)); }, onComplete: function () { n.textContent = fmt(end); }, scrollTrigger: { trigger: n, start: 'top 90%', once: true } });
    gsap.from(n.parentNode, { y: 30, autoAlpha: 0, duration: 0.9, delay: i * 0.12, ease: EASE, scrollTrigger: { trigger: n, start: 'top 90%', once: true } });
  });
  mark('stats');

  /* ---- reveals: 34px up and in, as the concept has them ---- */
  $$('.js-rise').forEach(function (n) {
    if (hero && hero.contains(n)) return;
    gsap.from(n, { y: 34, autoAlpha: 0, duration: 0.85, ease: EASE, scrollTrigger: { trigger: n, start: 'top 90%', once: true } });
  });
  $$('.js-stagger').forEach(function (box) {
    if (box.classList.contains('solutions')) return; /* scrubbed below */
    gsap.from(box.children, { y: 24, autoAlpha: 0, duration: 0.75, stagger: 0.09, ease: EASE, scrollTrigger: { trigger: box, start: 'top 88%', once: true } });
  });
  $$('.js-wipe').forEach(function (n) {
    if (n.closest('.feature-photo')) return; /* opens as a circle below */
    gsap.fromTo(n, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: n, start: 'top 86%', once: true } });
  });
  $$('.js-parallax').forEach(function (n) {
    var img = $('img', n);
    gsap.set(img, { scale: 1.12 });
    gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: n, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  mark('reveals');

  /* ---- scene: the patient's sentence is written, then Eat / Smile / Live arrive ---- */
  var story = $('#story-scene');
  var quote = story && $('.js-words', story);
  var words = quote ? SplitText.create(quote, { type: 'words', wordsClass: 'wd' }).words : [];
  var benefits = story ? $$('.js-lit > div', story) : [];
  var storyImg = story ? $('.story-photo img', story) : null;
  var writeStory = function (tl) {
    tl.fromTo(words, { y: 6 }, { y: 0, color: INK, duration: 0.2, stagger: 0.2, ease: 'none' })
      .fromTo(benefits, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.6, ease: 'power2.out' }, '>-0.2')
      .to({}, { duration: 0.5 });
    /* ends at the parallax's own scale, so its drift never shows an edge */
    if (storyImg) tl.fromTo(storyImg, { scale: 1.26 }, { scale: 1.12, ease: 'none', duration: tl.duration() }, 0);
    return tl;
  };

  /* ---- the three treatments draw themselves: one implant, a bridge on two, an arch on four ---- */
  var crown = function (cx) { return 'M' + (cx - 8) + ' 48C' + (cx - 9.5) + ' 38 ' + (cx - 9) + ' 29 ' + (cx - 6.5) + ' 25.5C' + (cx - 4) + ' 22 ' + (cx + 4) + ' 22 ' + (cx + 6.5) + ' 25.5C' + (cx + 9) + ' 29 ' + (cx + 9.5) + ' 38 ' + (cx + 8) + ' 48Z'; };
  var implant = function (cx, tilt) {
    var g = '<g class="ti"' + (tilt ? ' transform="rotate(' + tilt + ' ' + cx + ' 50)"' : '') + '><path d="M' + (cx - 3.2) + ' 50h6.4l-1 22h-4.4z"/>';
    for (var y = 54; y <= 68; y += 4) g += '<path d="M' + (cx - 4.2) + ' ' + y + 'h8.4"/>';
    return g + '</g>';
  };
  var DRAWINGS = [
    '<path class="gum" d="M4 49Q60 45 116 49"/><path class="old" d="' + crown(36) + '"/><path class="old" d="' + crown(84) + '"/><path class="new" d="' + crown(60) + '"/>' + implant(60),
    '<path class="gum" d="M4 49Q60 45 116 49"/><path class="new" d="M40 46H80"/><path class="new" d="' + crown(40) + '"/><path class="new" d="' + crown(60) + '"/><path class="new" d="' + crown(80) + '"/>' + implant(40) + implant(80),
    '<path class="gum" d="M4 49Q60 45 116 49"/><path class="new" d="M14 46H106"/><path class="new" d="' + crown(15) + '"/><path class="new" d="' + crown(33) + '"/><path class="new" d="' + crown(51) + '"/><path class="new" d="' + crown(69) + '"/><path class="new" d="' + crown(87) + '"/><path class="new" d="' + crown(105) + '"/>' + implant(20, 14) + implant(46) + implant(74) + implant(100, -14)
  ];
  $$('.solution').forEach(function (card, i) {
    var holder = el('div', 'drawing');
    card.insertBefore(holder, card.firstChild);
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = '<svg viewBox="0 0 120 80" fill="none">' + DRAWINGS[i % 3] + '</svg>';
    var paths = $$('path', holder);
    paths.forEach(function (p) { var len = p.getTotalLength() + 1; p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });
    gsap.to(paths, { strokeDashoffset: 0, ease: 'none', stagger: 0.04, scrollTrigger: { trigger: card, start: 'top 92%', end: 'top 45%', scrub: 0.6 } });
  });
  var cards = $$('.solution');
  /* each row of the index slides in from the right, its numeral from further out */
  mm.add('(min-width: 768px)', function () {
    cards.forEach(function (card) {
      gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 60%', scrub: 0.6 } })
        .fromTo($$('h3, p, .go', card), { x: 80 }, { x: 0, ease: 'none', stagger: 0.08 }, 0)
        .fromTo($('.num', card), { x: 160 }, { x: 0, ease: 'none' }, 0);
    });
  });
  mm.add('(max-width: 767px)', function () {
    cards.forEach(function (card) { gsap.from(card, { y: 30, autoAlpha: 0, duration: 0.8, ease: EASE, scrollTrigger: { trigger: card, start: 'top 90%', once: true } }); });
  });
  mark('drawings');

  /* ---- full arch: a circle opens onto the patient ---- */
  var featurePhoto = $('.feature-photo .photo');
  if (featurePhoto) {
    gsap.fromTo(featurePhoto, { clipPath: 'circle(20% at 50% 55%)' }, { clipPath: 'circle(75% at 50% 55%)', ease: 'none', scrollTrigger: { trigger: featurePhoto, start: 'top 95%', end: 'center 50%', scrub: 0.6 } });
    mark('feature');
  }

  /* ---- scene: the four steps light up in order, a gold rule runs along them ---- */
  var proc = $('#process-scene');
  var steps = proc ? $$('.step', proc) : [];
  var grid = proc ? $('.processgrid', proc) : null;
  var rule = grid ? el('span', 'process-rule', grid) : null;
  var lightSteps = function (tl) {
    if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: steps.length }, 0);
    steps.forEach(function (step, i) {
      tl.fromTo(step, { '--lit': 0 }, { '--lit': 1, duration: 1, ease: 'none' }, i)
        .fromTo($$('h3, p', step), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12, ease: 'power2.out' }, i + 0.15)
        .fromTo($('.n', step), { scale: 0.8, autoAlpha: 0.35 }, { scale: 1, autoAlpha: 1, transformOrigin: 'left bottom', duration: 0.7, ease: 'power2.out' }, i);
    });
    return tl.to({}, { duration: 0.4 });
  };

  /* ---- scene: scroll is the before and after; then the pointer can drag it ---- */
  var gallery = $('#results-scene');
  var cases = gallery ? $$('.js-case', gallery) : [];
  var wipe = function (tl, c, at) {
    return tl
      .fromTo($('.result__after', c), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'none' }, at)
      .fromTo($('.result__line', c), { left: '0%' }, { left: '100%', duration: 1, ease: 'none' }, '<')
      .to($('.result__line', c), { autoAlpha: 0, duration: 0.06 }, '>-0.06');
  };
  if (FINE) {
    cases.forEach(function (c) {
      var after = $('.result__after', c);
      var line = $('.result__line', c);
      var setClip = gsap.quickSetter(after, 'clipPath');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var p = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
        setClip('inset(0 ' + (100 - p).toFixed(1) + '% 0 0)');
        gsap.set(line, { left: p + '%', autoAlpha: 1 });
      });
      c.addEventListener('pointerleave', function () {
        gsap.to(after, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: EASE });
        gsap.to(line, { left: '100%', autoAlpha: 0, duration: 0.6, ease: EASE });
      });
    });
  }

  /* ---- the CBCT photograph: a scan line sweeps it while it settles ---- */
  var tech = $('.tech-image');
  if (tech) {
    var scan = el('span', 'scanline', tech);
    scan.setAttribute('aria-hidden', 'true');
    gsap.fromTo(scan, { top: '0%', autoAlpha: 0 }, { top: '100%', autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: tech, start: 'top 80%', end: 'bottom 30%', scrub: 0.5 } });
    mark('scan');
  }

  /* ---- headlines lit by the scroll: words go from the readable grey (#77736b, 4.5:1) to ink ---- */
  $$('.js-light').forEach(function (h) { SplitText.create(h, { type: 'words', wordsClass: 'wl' }); });
  var consultH = $('.consult .js-light');
  if (consultH) {
    gsap.fromTo($$('.wl', consultH), { color: '#77736b' }, { color: INK, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: consultH, start: 'top 80%', end: 'bottom 45%', scrub: 0.5 } });
  }

  /* ---- scene: the closing words, one at a time, while the photograph settles ---- */
  var fin = $('#final-scene');
  var finWords = fin ? $$('.js-light .wl', fin) : [];
  var finImg = fin ? $('.final-photo img', fin) : null;
  var closeScene = function (tl) {
    tl.fromTo(finWords, { color: '#77736b', y: 10 }, { color: INK, y: 0, stagger: 0.35, duration: 0.35, ease: 'none' }, 0);
    if (finImg) tl.fromTo(finImg, { scale: 1.26 }, { scale: 1.12, ease: 'none', duration: tl.duration() }, 0);
    return tl.to({}, { duration: 0.3 });
  };

  /* how far the row of steps travels left: until the last step clears the right edge */
  var travel = function () {
    var left = grid.getBoundingClientRect().left - gsap.getProperty(grid, 'x');
    return Math.min(0, window.innerWidth - left - grid.scrollWidth - 48);
  };

  /* desktop: the page holds while each scene plays. A scene is pinned only where it fits the
     window; on a short laptop screen the same timeline is scrubbed while it passes, unpinned. */
  var scene = function (el, length, scrub) {
    return el.offsetHeight <= window.innerHeight - 24
      ? { trigger: el, start: 'center center', end: '+=' + length, pin: true, scrub: scrub, invalidateOnRefresh: true }
      : { trigger: el, start: 'top 75%', end: 'bottom 25%', scrub: scrub, invalidateOnRefresh: true };
  };
  mm.add('(min-width: 992px)', function () {
    if (story) writeStory(gsap.timeline({ scrollTrigger: scene(story, '110%', 0.4) }));
    if (proc) {
      var ptl = gsap.timeline({ scrollTrigger: scene(proc, '180%', 0.5) });
      if (grid) ptl.to(grid, { x: travel, ease: 'none', duration: steps.length + 0.4 }, 0);
      lightSteps(ptl);
    }
    if (gallery) {
      var tl = gsap.timeline({ scrollTrigger: scene(gallery, '220%', 0.5) });
      cases.forEach(function (c, i) { wipe(tl, c, i ? '>+0.25' : 0); });
      tl.to({}, { duration: 0.3 });
    }
    if (fin) closeScene(gsap.timeline({ scrollTrigger: scene(fin, '90%', 0.5) }));
    mark('scenes');
  });

  /* tablet and phone: nothing is pinned; the same scenes are scrubbed by where they are on screen */
  mm.add('(max-width: 991px)', function () {
    if (quote) writeStory(gsap.timeline({ scrollTrigger: { trigger: quote, start: 'top 82%', end: 'bottom 35%', scrub: 0.4 } }));
    steps.forEach(function (step) {
      gsap.timeline({ scrollTrigger: { trigger: step, start: 'top 88%', end: 'top 45%', scrub: 0.4 } })
        .fromTo(step, { '--lit': 0 }, { '--lit': 1, duration: 1, ease: 'none' }, 0)
        .fromTo($$('h3, p', step), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12 }, 0);
    });
    cases.forEach(function (c) { wipe(gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 70%', end: 'top 12%', scrub: 0.4 } }), c, 0); });
    if (fin) closeScene(gsap.timeline({ scrollTrigger: { trigger: fin, start: 'top 75%', end: 'bottom 60%', scrub: 0.4 } }));
    mark('scrubbed');
  });

  /* ---- doctor: his surname, very large, drifts behind the portrait ---- */
  var teamGrid = $('.doc-grid');
  if (teamGrid) {
    var tm = el('div', 'team-mark');
    tm.setAttribute('aria-hidden', 'true');
    tm.textContent = 'Meskin';
    teamGrid.insertBefore(tm, teamGrid.firstChild);
    gsap.fromTo(tm, { xPercent: 6 }, { xPercent: -10, ease: 'none', scrollTrigger: { trigger: teamGrid, start: 'top bottom', end: 'bottom top', scrub: true } });
    mark('doctor');
  }

  /* ---- footer: the practice name rises line by line ---- */
  var fb = $('.footer-brand');
  if (fb) SplitText.create(fb, { type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true, onSplit: function (self) { return gsap.from(self.lines, { yPercent: 110, duration: 1, stagger: 0.1, ease: 'power4.out', scrollTrigger: { trigger: fb, start: 'top 95%', once: true } }); } });

  /* ================= pointer ================= */
  if (FINE) {
    /* buttons roll their label and lean toward the pointer */
    $$('.btn').forEach(function (b) {
      var label = b.textContent.trim();
      b.innerHTML = '<span class="roll"><span>' + label + '</span><span aria-hidden="true">' + label + '</span></span>';
      b.classList.add('is-magnetic');
      var x = gsap.quickTo(b, 'x', { duration: 0.5, ease: EASE });
      var y = gsap.quickTo(b, 'y', { duration: 0.5, ease: EASE });
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener('mouseleave', function () { x(0); y(0); });
    });

    /* a cursor that names what it is over. pointer-events: none, so it can never take a click */
    var cur = el('div', 'cursor', document.body);
    cur.setAttribute('aria-hidden', 'true');
    var dot = el('span', 'cursor__dot', cur);
    var ring = el('span', 'cursor__ring', cur);
    var tag = el('span', 'cursor__label', ring);
    var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    var dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    var ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); cur.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
    var state = function (e) {
      var t = e.target;
      var name = '';
      var mode = '';
      if (t.closest('.js-case')) { mode = 'is-media'; name = 'Drag'; }
      else if (t.closest('.hero-play')) { mode = 'is-media'; name = 'Play'; }
      else if (t.closest('.photo, .doc-portrait, .story-photo')) { mode = 'is-media'; name = 'View'; }
      else if (t.closest('a, button, summary')) mode = 'is-link';
      cur.classList.toggle('is-media', mode === 'is-media');
      cur.classList.toggle('is-link', mode === 'is-link');
      tag.textContent = name;
    };
    document.addEventListener('pointerover', state);
    mark('pointer');
  }

  /* continuity: reading progress along the top edge */
  gsap.to('#navProgress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* Triggers were created by kind, not in page order, and pins higher up push everything below
     them. Sort by position and measure again, or a reveal below a pin fires early. */
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  window.addEventListener('load', refreshSoon);
  if (document.fonts && document.fonts.load) document.fonts.load('400 1rem "Newsreader"').then(refreshSoon);

  WZ.ok = true;
})();
