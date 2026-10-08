/* Institute for Advanced Dentistry — the frozen motion core (split from the approved home.js, 2026-10-01).
   ONE script runs on every page (Instatic has a single script asset), so every module guards on its own
   elements. Everything is readable with this file absent: initial hidden states are written here, never in
   CSS. Reduced motion (or ?motion=off) skips every pin and scrub and leaves the controls working.

   A section module registers with IFA.module({ init: fn(ctx), motion: fn(ctx) }) and is called in file order:
   init always, motion only when GSAP is present and motion is allowed, after the smoother exists and the
   faces have loaded. 90-boot.js starts it all. */
(function () {
  'use strict';

  var html = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]motion=off/.test(location.search);
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var motion = hasGsap && !reduce;

  var IFA = window.IFA = {
    $: $, $$: $$, html: html, reduce: reduce, fine: fine, motion: motion, smoother: null,
    GOLD: '#74560f',   /* gold as TEXT on a light ground */
    LIT: '#1d1b1c',
    mods: [],
    module: function (m) { IFA.mods.push(m); }
  };

  if (!motion) html.classList.add('is-reduced-motion');

  IFA.unveil = function () { html.classList.add('is-ready'); };
  /* Elements inside a page's own entrance (the home arrival, any [data-intro] hero) are animated by that
     entrance, not by the shared scroll reveals. */
  IFA.inIntro = function (el) { return !!el.closest('.section_arrival, [data-intro]'); };

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
    if (!nav) return;
    var max = Math.max(1, html.scrollHeight - window.innerHeight);
    var y = window.pageYOffset || html.scrollTop;
    if (progress) progress.style.transform = 'scaleX(' + Math.min(1, Math.max(0, y / max)).toFixed(4) + ')';
    nav.classList.toggle('is-solid', y > 40);
    var ch = chapters.length ? chapterAt(nav.offsetHeight / 2) : null;
    nav.classList.toggle('is-light', !ch || ch.getAttribute('data-theme') === 'light');
    if (ask && callbar) {
      var a = ask.getBoundingClientRect();
      callbar.classList.toggle('is-away', a.top < window.innerHeight - 80 && a.bottom > 80);
    }
  }
  function queueChrome() { if (!queued) { queued = true; requestAnimationFrame(updateChrome); } }
  IFA.queueChrome = queueChrome;
  window.addEventListener('scroll', queueChrome, { passive: true });
  window.addEventListener('resize', queueChrome);

  /* ------------------------------------------------------------ in-page links */
  function goTo(target) {
    if (IFA.smoother) IFA.smoother.scrollTo(target, true, 'top top');
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  IFA.goTo = goTo;

  /* ------------------------------------------------------------------ drawer */
  var burger = $('[data-burger]'), drawer = $('[data-drawer]');
  function lockScroll(lock) {
    if (IFA.smoother) IFA.smoother.paused(lock);
    document.body.style.overflow = lock ? 'hidden' : '';
  }
  IFA.lockScroll = lockScroll;
  /* An overlay (drawer, story modal, lightbox) is closed by default in CSS and open with the `is-open` combo;
     `hidden` goes with it for assistive tech. The editor canvas drops `hidden`, so CSS never relies on it. */
  function setOpen(el, open) { el.hidden = !open; el.classList.toggle('is-open', open); }
  IFA.setOpen = setOpen;
  function openDrawer() {
    setOpen(drawer, true);
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    lockScroll(true);
    if (motion) {
      gsap.fromTo(drawer, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: .9, ease: 'expo.inOut' });
      gsap.from($$('nav a', drawer), { yPercent: 60, autoAlpha: 0, stagger: .05, duration: .8, delay: .25, ease: 'expo.out' });
    }
  }
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    lockScroll(false);
    if (motion) gsap.to(drawer, { clipPath: 'circle(0% at 100% 0%)', duration: .6, ease: 'expo.inOut', onComplete: function () { setOpen(drawer, false); } });
    else setOpen(drawer, false);
  }
  IFA.closeDrawer = closeDrawer;

  /* ------------------------------------------------------------- story modal */
  var modal = $('[data-modal]'), modalVideo = $('[data-modal-video]'), lastFocus = null;
  function openModal(src, name) {
    lastFocus = document.activeElement;
    setOpen(modal, true);
    modal.setAttribute('aria-label', name + ' tells the story');
    modalVideo.src = src;
    var p = modalVideo.play(); if (p && p.catch) p.catch(function () {});
    lockScroll(true);
    if (motion) gsap.fromTo(modal, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4 });
    if (motion) gsap.fromTo($('.modal_box', modal), { scale: .92, y: 30 }, { scale: 1, y: 0, duration: .7, ease: 'expo.out' });
    $('[data-modal-close]').focus();
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
    setOpen(modal, false);
    lockScroll(false);
    if (lastFocus) lastFocus.focus();
  }
  IFA.openModal = openModal;
  IFA.closeModal = closeModal;

  /* --------------------------------------------------- count-up on the scroll */
  IFA.countTo = function (el, trigger, startAt, endAt) {
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
  };

  /* =================================================================== INIT */
  IFA.module({
    init: function () {
      updateChrome();
      var yr = $('[data-year]'); if (yr) yr.textContent = String(new Date().getFullYear());

      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href');
          if (id.length < 2) return;
          var t = $(id);
          if (!t) return;
          e.preventDefault();
          closeDrawer();
          goTo(t);
        });
      });

      if (burger && drawer) burger.addEventListener('click', function () { if (drawer.hidden) openDrawer(); else closeDrawer(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); closeModal(); } });

      if (modal) {
        $$('[data-story]').forEach(function (b) {
          b.addEventListener('click', function () { openModal(b.getAttribute('data-story'), b.getAttribute('data-story-name')); });
        });
        $('[data-modal-close]').addEventListener('click', closeModal);
        modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
      }

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
        /* The reviews turn on their own, stop while the pointer or keyboard focus is on them (WCAG 2.2.2)
           and while they are off screen; the arrows still work and restart the clock. */
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
      /* Without this file every answer is open. With it, the first of each list stays open and the rest fold. */
      $$('[data-faq]').forEach(function (list) {
        $$('[data-faq-item]', list).forEach(function (item, i) {
          var btn = $('[data-faq-btn]', item), ans = $('[data-faq-a]', item);
          var set = function (open) { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); ans.hidden = !open; };
          set(i === 0);
          btn.addEventListener('click', function () {
            var open = btn.getAttribute('aria-expanded') !== 'true';
            set(open);
            if (open && motion) gsap.fromTo(ans, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: .6, ease: 'expo.out', clearProps: 'height,opacity,visibility' });
            if (IFA.refreshSoon) IFA.refreshSoon();
          });
        });
      });

      /* ------------------------------------------------------------------- form */
      if (ask && ask.tagName === 'FORM') {
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
    },

    /* ==================================================== shared scroll reveals */
    motion: function () {
      $$('[data-tag]').forEach(function (tag) {
        if (IFA.inIntro(tag)) return;
        gsap.from(tag.children, { x: -28, autoAlpha: 0, stagger: .08, duration: .9, scrollTrigger: { trigger: tag, start: 'top 88%', once: true } });
      });
      $$('[data-split="lines"]').forEach(function (el) {
        if (IFA.inIntro(el)) return;
        SplitText.create(el, { type: 'lines', linesClass: 'split_line', mask: 'lines', autoSplit: true, onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 112, stagger: .09, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
        } });
      });
      $$('[data-rise]').forEach(function (el) {
        if (IFA.inIntro(el)) return;
        gsap.from(el, { y: 34, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });
      $$('[data-wipe]').forEach(function (el, i) {
        if (IFA.inIntro(el)) return;
        gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round 11px)' }, { clipPath: 'inset(0% 0% 0% 0% round 11px)', duration: 1.4, delay: (i % 3) * .15, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
        var img = $('img', el);
        if (img) gsap.from(img, { scale: 1.25, duration: 1.8, delay: (i % 3) * .15, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      });
      $$('[data-parallax]').forEach(function (img) {
        var amt = parseFloat(img.getAttribute('data-parallax'));
        gsap.fromTo(img, { yPercent: 0 }, { yPercent: -amt, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }
  });
})();
