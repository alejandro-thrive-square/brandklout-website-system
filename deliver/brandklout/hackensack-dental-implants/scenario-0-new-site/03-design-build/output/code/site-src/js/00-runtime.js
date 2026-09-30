/* WZ runtime for the Hackensack build.
 *
 * Two layers. The interface layer (drawer, menus, tabs, FAQ, films, anchors, call bar) runs on
 * every visit and needs nothing but the DOM. The motion layer runs only when <html> carries
 * .motion: GSAP loaded and the visitor has not asked for reduced motion. No visibility observers
 * anywhere: every reveal is a ScrollTrigger and every scene is bound to scroll progress.
 *
 * Contract with the gates (tools/instatic-site/gates/check-pages.mjs): window.WZ.ok, WZ.smoother,
 * WZ.active, and a pinned trigger that carries an id.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var WZ = (window.WZ = { ok: false, smoother: null, active: [], build: 'hackensack-home-1' });
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mark = function (name) { WZ.active.push(name); };
  var MOTION = root.classList.contains('motion') && !!(window.gsap && window.ScrollTrigger);
  var refreshSoon = (function () {
    var t;
    return function () { clearTimeout(t); t = setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 120); };
  })();

  /* ================= interface ================= */

  /* drawer */
  var burger = $('#burger');
  var drawer = $('#drawer');
  function setDrawer(open) {
    if (!burger || !drawer) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    root.classList.toggle('drawer-open', open);
    if (WZ.smoother) WZ.smoother.paused(open);
  }
  if (burger) burger.addEventListener('click', function () { setDrawer(burger.getAttribute('aria-expanded') !== 'true'); });
  if (drawer) drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setDrawer(false); });

  /* desktop menus: hover and focus are CSS; the button makes them work by click, touch and keyboard */
  var groups = $$('.nav__group');
  function closeMenus(except) {
    groups.forEach(function (g) {
      if (g === except) return;
      g.classList.remove('is-open');
      $('.nav__top', g).setAttribute('aria-expanded', 'false');
    });
  }
  groups.forEach(function (g) {
    var btn = $('.nav__top', g);
    btn.addEventListener('click', function () {
      var open = !g.classList.contains('is-open');
      closeMenus(g);
      g.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav__group')) closeMenus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenus(); setDrawer(false); } });

  /* tabs (the doctor, the visit) */
  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    var ink = $('.tabs__ink', box);
    var panelOf = function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); };
    function moveInk(tab) {
      if (!ink) return;
      ink.style.width = tab.offsetWidth - parseFloat(getComputedStyle(tab).paddingRight) + 'px';
      ink.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    }
    function activate(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panelOf(t).classList.toggle('is-active', on);
      });
      moveInk(tab);
      if (focus) tab.focus();
      var panel = panelOf(tab);
      if (MOTION) {
        var media = $('.visit__main', panel);
        if (media) gsap.fromTo(media, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'power4.out' });
        var inset = $('.visit__inset', panel);
        if (inset) gsap.fromTo(inset, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, delay: 0.15, ease: 'power3.out' });
        gsap.fromTo($$(':scope > p, :scope > ul, :scope > .more, :scope > a', panel), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: 'power3.out' });
      }
      refreshSoon();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(tab); });
      tab.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        activate(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
    var first = $('.is-active[role="tab"]', box) || tabs[0];
    moveInk(first);
    window.addEventListener('resize', function () { moveInk($('.is-active[role="tab"]', box) || first); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk($('.is-active[role="tab"]', box) || first); });
  });

  /* FAQ: one answer open at a time */
  $$('[data-faq]').forEach(function (list) {
    var qs = $$('.faq__q', list);
    qs.forEach(function (q) {
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') !== 'true';
        qs.forEach(function (other) {
          var on = other === q && open;
          other.setAttribute('aria-expanded', String(on));
          document.getElementById(other.getAttribute('aria-controls')).classList.toggle('is-open', on);
        });
        setTimeout(refreshSoon, 650);
      });
    });
  });

  /* patient films: the player is only requested when someone presses play */
  $$('[data-vimeo]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = 'https://player.vimeo.com/video/' + btn.getAttribute('data-vimeo') + '?autoplay=1&title=0&byline=0&portrait=0';
      frame.title = btn.getAttribute('aria-label').replace(/^Play /, '');
      frame.allow = 'autoplay; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      var holder = document.createElement('div');
      holder.className = 'film__play';
      holder.appendChild(frame);
      btn.closest('.film').classList.add('is-playing');
      btn.replaceWith(holder);
      refreshSoon();
    });
  });

  /* in-page anchors */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var target = a.getAttribute('href').length > 1 && document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    setDrawer(false);
    var offset = $('#nav') ? $('#nav').offsetHeight + 12 : 0;
    if (WZ.smoother) WZ.smoother.scrollTo(target, true, 'top ' + offset + 'px');
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - offset, behavior: MOTION ? 'smooth' : 'auto' });
  });

  /* mobile call bar steps aside while the consultation form is on screen */
  var callbar = $('.callbar');
  var form = $('#consultation');
  if (callbar && form) {
    var ticking = false;
    var check = function () {
      ticking = false;
      var r = form.getBoundingClientRect();
      callbar.classList.toggle('is-away', r.top < window.innerHeight * 0.7 && r.bottom > window.innerHeight * 0.3);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
    check();
  }

  if (!MOTION) { WZ.ok = true; mark('interface'); return; }

  /* ================= motion ================= */
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  var INK = '#030405';
  var mm = gsap.matchMedia();

  /* smooth scroll on desktop only */
  if (window.matchMedia('(min-width: 992px)').matches && ScrollTrigger.isTouch !== 1) {
    WZ.smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1, effects: false });
    root.classList.add('smooth');
    mark('smoother');
  }

  root.classList.add('is-armed');

  /* headline reveals: lines rise out of a mask; the split redoes itself when fonts or width change */
  $$('[data-split]').forEach(function (el) {
    var hero = el.getAttribute('data-split') === 'hero';
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.lines, {
          yPercent: 112, duration: hero ? 1.3 : 1.1, stagger: 0.09, ease: 'power4.out', delay: hero ? 0.15 : 0,
          scrollTrigger: hero ? null : { trigger: el, start: 'top 88%', once: true }
        });
      }
    });
  });
  mark('split');

  /* ---- 0 · arrival ---- */
  var arrival = $('#arrival');
  if (arrival) {
    var heroFrame = $('[data-hero-frame]', arrival);
    var heroImg = $('[data-hero-img]', arrival);
    gsap.fromTo(heroFrame, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 1.6, ease: 'power4.inOut' });
    gsap.fromTo(heroImg, { scale: 1.3 }, { scale: 1.08, duration: 2.2, ease: 'power3.out' });
    gsap.from($$('[data-tag]', arrival), { x: -28, autoAlpha: 0, duration: 0.9, ease: 'power3.out', delay: 0.1 });
    gsap.from($$('[data-rise]', arrival), { y: 32, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.7 });
    /* departure: leaving the chapter feels like leaving a room */
    gsap.timeline({ scrollTrigger: { trigger: arrival, start: 'top top', end: 'bottom top', scrub: true } })
      .to(heroImg, { yPercent: 9, ease: 'none' }, 0)
      .to($('.arrival__copy', arrival), { y: -70, autoAlpha: 0.15, ease: 'none' }, 0)
      .to($('.arrival__proof', arrival), { y: -36, ease: 'none' }, 0);
    mark('arrival');
  }

  /* chapter tags, rises, rows */
  $$('[data-tag]').forEach(function (el) {
    if (arrival && arrival.contains(el)) return;
    gsap.from(el, { x: -28, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  $$('[data-rise]').forEach(function (el) {
    if (arrival && arrival.contains(el)) return;
    gsap.from(el, { y: 28, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  gsap.set('[data-row]', { y: 34, autoAlpha: 0 });
  ScrollTrigger.batch('[data-row]', {
    start: 'top 90%', once: true,
    onEnter: function (els) { gsap.to(els, { y: 0, autoAlpha: 1, duration: 0.95, stagger: 0.09, ease: 'power3.out', overwrite: true }); }
  });

  /* media windows: the frame wipes open, the picture inside drifts against the scroll */
  $$('[data-wipe]').forEach(function (frame) {
    var from = { left: 'inset(0 100% 0 0)', right: 'inset(0 0 0 100%)', up: 'inset(100% 0 0 0)' }[frame.getAttribute('data-wipe')] || 'inset(100% 0 0 0)';
    gsap.fromTo(frame, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power4.inOut', scrollTrigger: { trigger: frame, start: 'top 86%', once: true } });
  });
  $$('[data-parallax]').forEach(function (frame) {
    var img = $('img', frame);
    var p = parseFloat(frame.getAttribute('data-parallax')) || 0.1;
    gsap.set(img, { scale: 1.02 + p * 1.2 });
    gsap.fromTo(img, { yPercent: -p * 50 }, { yPercent: p * 50, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  mark('reveals');

  /* departures for the unpinned chapter heads */
  $$('[data-depart]').forEach(function (el) {
    gsap.to(el, { yPercent: -5, autoAlpha: 0.3, ease: 'none', scrollTrigger: { trigger: el, start: 'bottom 30%', end: 'bottom top', scrub: true } });
  });

  /* ---- 1 · the difference: the page holds and the sentence is written by the scroll ---- */
  var stage = $('#difference-stage');
  if (stage) {
    var statement = $('[data-words]', stage);
    var split = SplitText.create(statement, { type: 'words', wordsClass: 'wd' });
    gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: '+=150%', pin: true, scrub: 0.4 } })
      /* each word settles a few pixels as it fills: colour alone is invisible to a gate that samples transforms */
      .fromTo(split.words, { y: 7 }, { y: 0, color: INK, duration: 0.2, stagger: 0.2, ease: 'none' })
      .to({}, { duration: 0.6 })
      .to($('.difference__stage-in', stage), { y: -50, autoAlpha: 0.25, duration: 1.2, ease: 'power1.in' });
    mark('statement');
  }

  /* ---- 2 · a new way to live: a marquee that answers to how fast and which way you scroll ---- */
  $$('[data-marquee]').forEach(function (m) {
    var inner = m.firstElementChild;
    inner.innerHTML += inner.innerHTML;
    var loop = gsap.to(inner, { xPercent: -50, ease: 'none', duration: 34, repeat: -1 });
    ScrollTrigger.create({
      trigger: m, start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var boost = gsap.utils.clamp(0, 7, Math.abs(self.getVelocity()) / 220);
        gsap.to(loop, { timeScale: (1 + boost) * (self.direction < 0 ? -1 : 1), duration: 0.25, overwrite: true });
        gsap.to(loop, { timeScale: self.direction < 0 ? -1 : 1, duration: 1.4, delay: 0.3, overwrite: false });
      }
    });
    mark('marquee');
  });

  /* ---- 3 · the specialist: figures count with the scroll, the team rises in steps ---- */
  $$('[data-figures]').forEach(function (dl) {
    $$('[data-count]', dl).forEach(function (el) {
      var end = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var o = { v: 0 };
      var write = function () { el.textContent = Number(o.v.toFixed(dec)).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix; };
      gsap.to(o, { v: end, ease: 'power1.out', onUpdate: write, scrollTrigger: { trigger: dl, start: 'top 95%', end: 'top 55%', scrub: true } });
    });
    mark('counters');
  });
  $$('[data-team]').forEach(function (list) {
    $$('.team__card', list).forEach(function (card, i) {
      gsap.fromTo(card, { y: 70 + i * 50 }, { y: 0, ease: 'none', scrollTrigger: { trigger: list, start: 'top bottom', end: 'top 45%', scrub: true } });
    });
  });

  /* ---- 4 · under one roof: scroll places the implant and seats the teeth ---- */
  var tx = $('#tx');
  if (tx) {
    var q = gsap.utils.selector(tx);
    var panels = q('[data-tx-panel]');
    var ticks = q('.tx__ticks li');
    var part = function (name) { return q('[data-tx="' + name + '"]'); };
    gsap.set(panels.slice(1), { autoAlpha: 0, y: 30 });
    /* the ticks follow the timeline itself, not the trigger: with a smoothed scrub the trigger stops reporting before the scene has caught up */
    var txTl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onUpdate: function () {
        var t = txTl.time();
        var i = t >= txTl.labels.full + 0.4 ? 2 : t >= txTl.labels.bridge + 0.4 ? 1 : 0;
        ticks.forEach(function (tick, k) { tick.classList.toggle('is-on', k <= i); });
      },
      scrollTrigger: { trigger: tx, start: 'top top', end: '+=330%', pin: true, scrub: 0.6 }
    });
    txTl
      /* one tooth: the post rises into the gap, the crown comes down onto it */
      .fromTo(part('implant-a'), { y: 210, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0)
      .fromTo(part('crown-a'), { y: -230, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.6)
      .to({}, { duration: 0.5 })
      /* a bridge: two posts carry three teeth */
      .addLabel('bridge')
      .to(panels[0], { autoAlpha: 0, y: -30, duration: 0.4 }, 'bridge')
      .to(panels[1], { autoAlpha: 1, y: 0, duration: 0.45 }, 'bridge+=0.35')
      .to(part('crown-a'), { y: -230, opacity: 0, duration: 0.6 }, 'bridge')
      .to(part('implant-a'), { y: 50, opacity: 0, duration: 0.5 }, 'bridge+=0.1')
      .to(q('[data-t="3"], [data-t="5"]'), { y: -30, opacity: 0, duration: 0.5 }, 'bridge+=0.1')
      .fromTo(part('implant-b'), { y: 210, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 'bridge+=0.55')
      .fromTo(part('bridge'), { y: -230, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 'bridge+=1.05')
      .to({}, { duration: 0.5 })
      /* a full arch: a few posts carry every tooth */
      .addLabel('full')
      .to(panels[1], { autoAlpha: 0, y: -30, duration: 0.4 }, 'full')
      .to(panels[2], { autoAlpha: 1, y: 0, duration: 0.45 }, 'full+=0.35')
      .to(part('bridge'), { y: -230, opacity: 0, duration: 0.6 }, 'full')
      .to(q('.tx-natural use, .tx-roots use'), { y: -30, opacity: 0, duration: 0.55, stagger: 0.02 }, 'full+=0.1')
      .fromTo(part('implant-c'), { y: 210, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 'full+=0.6')
      .fromTo(part('arch'), { y: -250, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 'full+=1.1')
      .to({}, { duration: 0.7 });
    mark('treatments');
  }

  /* ---- 5 · the proof: scroll is the before/after slider, three patients in turn ---- */
  var scene = $('#cases-scene');
  if (scene) {
    var track = $('[data-cases-track]', scene);
    var cases = $$('[data-case]', scene);
    var slideTo = function (i) {
      var over = track.scrollWidth - scene.clientWidth;
      if (over <= 0) return 0;
      var c = cases[i];
      return -gsap.utils.clamp(0, over, c.offsetLeft - (scene.clientWidth - c.offsetWidth) / 2);
    };
    var casesTl = gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top top', end: '+=300%', pin: true, scrub: 0.5, invalidateOnRefresh: true } });
    cases.forEach(function (c, i) {
      if (i) casesTl.to(track, { x: function () { return slideTo(i); }, duration: 0.5, ease: 'power2.inOut' });
      casesTl
        .fromTo($('.case__after', c), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'none' })
        .fromTo($('.case__line', c), { left: '0%' }, { left: '100%', duration: 1, ease: 'none' }, '<')
        .to($('.case__line', c), { autoAlpha: 0, duration: 0.08 }, '>-0.08')
        .to({}, { duration: 0.3 });
    });
    mark('cases');
  }

  /* ---- 6 · the visit: the path travels sideways; below 768 it is a swipe rail (same width as the CSS) ---- */
  mm.add('(min-width: 768px)', function () {
    var pathScene = $('#path-scene');
    if (!pathScene) return;
    var rail = $('[data-path-track]', pathScene);
    var bar = $('[data-path-bar]', pathScene);
    var travel = function () { return Math.max(0, rail.scrollWidth - window.innerWidth); };
    gsap.to(rail, {
      x: function () { return -travel(); }, ease: 'none',
      scrollTrigger: {
        trigger: pathScene, start: 'top top', end: function () { return '+=' + travel(); },
        pin: true, scrub: 0.6, invalidateOnRefresh: true,
        onUpdate: function (self) { gsap.set(bar, { scaleX: Math.max(0.04, self.progress) }); }
      }
    });
    mark('path');
  });

  /* sticky columns under ScrollSmoother: a scrubbed translate, never a pin */
  if (WZ.smoother) {
    mm.add('(min-width: 992px)', function () {
      $$('[data-sticky]').forEach(function (el) {
        var parent = el.parentElement;
        var room = function () { return Math.max(0, parent.offsetHeight - el.offsetHeight); };
        var top = function () { return $('#nav').offsetHeight + 40; };
        gsap.to(el, {
          y: room, ease: 'none',
          scrollTrigger: { trigger: parent, start: function () { return 'top ' + top() + 'px'; }, end: function () { return '+=' + room(); }, scrub: true, invalidateOnRefresh: true }
        });
      });
    });
  }

  /* continuity: reading progress on the navbar, and the name of the chapter you are in */
  gsap.to('#navProgress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  var navName = $('#navName');
  $$('section[data-chapter]').forEach(function (ch) {
    ScrollTrigger.create({
      trigger: ch, start: 'top 55%', end: 'bottom 55%',
      onToggle: function (self) { if (self.isActive && navName) navName.textContent = ch.getAttribute('data-chapter-name'); }
    });
  });

  /* magnetic calls to action: pointer devices only */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.magnetic').forEach(function (el) {
      var x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      var y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.22);
        y((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener('mouseleave', function () { x(0); y(0); });
    });
    mark('magnetic');
  }

  /* Triggers were created by kind, not in page order, and pins higher up push everything below
     them. Sort by position and measure again, or a reveal below a pin fires a scene early. */
  ScrollTrigger.sort();
  ScrollTrigger.refresh();

  /* heights move when pictures and fonts land */
  window.addEventListener('load', refreshSoon);
  if (document.fonts && document.fonts.load) document.fonts.load('800 1rem "Nunito Sans"').then(refreshSoon);

  WZ.ok = true;
})();
