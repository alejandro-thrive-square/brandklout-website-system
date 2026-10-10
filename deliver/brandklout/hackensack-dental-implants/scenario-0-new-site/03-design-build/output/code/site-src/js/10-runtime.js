/* WZ runtime: Hackensack Center for Dental Implants, every page.
 *
 * Every element is found by a data- attribute, never by a styling class (CLASS-STANDARD §6), so a
 * class can be renamed or restyled in the Instatic Styles panel without breaking behaviour. State
 * goes on as a combo class (`is-open`, `is-motion`, `is-away`).
 *
 * Two layers. The interface layer runs on every visit: the menu and its drawer, in-page anchors,
 * FAQ, the call bar, the hero film and the light box, staging noindex. The motion layer runs only
 * when GSAP loaded and the visitor has not asked for reduced motion; everything it adds to the page
 * (curtain, drawings, film control, name mark) is created here, so the imported page never carries
 * markup that only motion needs. Every reveal is a ScrollTrigger; no visibility observers.
 *
 * Contract with the gates (tools/instatic-site/gates/check-pages.mjs): window.WZ.ok, WZ.smoother,
 * WZ.active, and pinned triggers that carry an id.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var WZ = (window.WZ = { ok: false, smoother: null, active: [], build: 'hackensack-site-2026-10' });
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- heads: a photograph with a face (js/01-faces.js) keeps every wipe, zoom and drift off the head.
     Instatic serves /uploads/<21-character id>-<name>[-w<width>].webp; the name without them is the key. ---- */
  var FACES = window.WZFaces || {};
  var photoName = function (img) {
    var src = (img.currentSrc || img.getAttribute('src') || '').split('?')[0];
    var name = src.slice(src.lastIndexOf('/') + 1).replace(/\.[a-z0-9]+$/i, '');
    if (src.indexOf('/uploads/') !== -1) name = name.slice(22).replace(/-w\d+$/, '');
    return name;
  };
  var headsOf = function (node) {
    var img = !node ? null : node.tagName === 'IMG' ? node : $('img', node);
    return img && FACES[photoName(img)] ? { img: img, heads: FACES[photoName(img)] } : null;
  };
  /* where the heads sit in the <img> box (object-fit and object-position applied), in % of the box:
     a zoom anchored there grows around the face instead of pushing it out of the frame */
  var headOrigin = function (img) {
    var h = headsOf(img);
    if (!h || !img.naturalWidth || !img.offsetWidth) return '50% 50%';
    var l = 1, t = 1, r = 0, b = 0;
    h.heads.forEach(function (q) { l = Math.min(l, q[0]); t = Math.min(t, q[1]); r = Math.max(r, q[0] + q[2]); b = Math.max(b, q[1] + q[3]); });
    var cs = getComputedStyle(img), ow = img.offsetWidth, oh = img.offsetHeight, nw = img.naturalWidth, nh = img.naturalHeight;
    var s = cs.objectFit === 'cover' ? Math.max(ow / nw, oh / nh) : 1, dw = cs.objectFit === 'cover' ? nw * s : ow, dh = cs.objectFit === 'cover' ? nh * s : oh;
    var pos = cs.objectPosition.split(' ').map(function (v) { return parseFloat(v) / 100; });
    var x = (ow - dw) * (isNaN(pos[0]) ? 0.5 : pos[0]) + ((l + r) / 2) * dw;
    var y = (oh - dh) * (isNaN(pos[1]) ? 0.5 : pos[1]) + ((t + b) / 2) * dh;
    return (100 * x / ow).toFixed(1) + '% ' + (100 * y / oh).toFixed(1) + '%';
  };
  var anchorZoom = function (img) {
    if (!headsOf(img)) return;
    var set = function () { gsap.set(img, { transformOrigin: headOrigin(img) }); };
    if (img.complete && img.naturalWidth) set(); else img.addEventListener('load', set, { once: true });
    window.addEventListener('resize', set);
  };
  var mark = function (name) { if (WZ.active.indexOf(name) < 0) WZ.active.push(name); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Decided here, not in <head>: Instatic serves one script asset, as a deferred module. */
  var MOTION = !!(window.gsap && window.ScrollTrigger && window.SplitText) && !REDUCED;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var DESKTOP_NAV = window.matchMedia('(min-width: 1280px)');
  var refreshSoon = (function () {
    var t;
    return function () { clearTimeout(t); t = setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 150); };
  })();
  var setOpen = function (el, on) { if (el) el.classList.toggle('is-open', !!on); };

  /* ================= interface ================= */

  /* Staging stays out of Google. Before launch staging is a Railway host that no Cloudflare rule
     can reach, so the page says it itself. Host-conditional: a no-op on production. */
  if (/-staging[.]up[.]railway[.]app$|^staging[.]/i.test(location.hostname)) {
    var robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
  }

  /* the hero holds back with a CSS animation until this script arms; without motion it shows now */
  var releaseHolds = function () { $$('[data-hero-hold], [data-split="hero"]').forEach(function (n) { n.style.animation = 'none'; }); };
  if (!MOTION) releaseHolds();

  /* ---- menu: the burger opens the drawer; each parent opens its list ---- */
  var menu = $('[data-menu]');
  var burger = $('[data-menu-button]');
  var drops = $$('[data-dropdown]');
  var closeDrop = function (d) {
    var t = $('[data-dropdown-toggle]', d);
    setOpen($('[data-dropdown-list]', d), false);
    setOpen($('[data-dropdown-icon]', d), false);
    if (t) t.setAttribute('aria-expanded', 'false');
  };
  var openDrop = function (d) {
    drops.forEach(function (o) { if (o !== d) closeDrop(o); });
    setOpen($('[data-dropdown-list]', d), true);
    setOpen($('[data-dropdown-icon]', d), true);
    $('[data-dropdown-toggle]', d).setAttribute('aria-expanded', 'true');
  };
  var isOpen = function (d) { return $('[data-dropdown-toggle]', d).getAttribute('aria-expanded') === 'true'; };
  drops.forEach(function (d) {
    var t = $('[data-dropdown-toggle]', d);
    if (!t) return;
    /* desktop: hover opens, leaving closes (a short grace so the pointer can cross the gap). A click
       that follows the hover which just opened the list keeps it open rather than shutting it. */
    var timer;
    var hoveredAt = 0;
    t.addEventListener('click', function () {
      if (isOpen(d) && DESKTOP_NAV.matches && FINE && Date.now() - hoveredAt < 800) return;
      if (isOpen(d)) closeDrop(d); else openDrop(d);
    });
    d.addEventListener('mouseenter', function () { if (!DESKTOP_NAV.matches || !FINE) return; clearTimeout(timer); if (!isOpen(d)) hoveredAt = Date.now(); openDrop(d); });
    d.addEventListener('mouseleave', function () { if (!DESKTOP_NAV.matches || !FINE) return; timer = setTimeout(function () { closeDrop(d); }, 180); });
    d.addEventListener('focusout', function (e) { if (DESKTOP_NAV.matches && !d.contains(e.relatedTarget)) closeDrop(d); });
  });
  document.addEventListener('click', function (e) {
    if (!DESKTOP_NAV.matches) return;
    drops.forEach(function (d) { if (!d.contains(e.target)) closeDrop(d); });
  });
  var drawerOpen = false;
  var setDrawer = function (on) {
    drawerOpen = !!on;
    setOpen(menu, on);
    $$('[data-menu-line]').forEach(function (l) { l.classList.toggle('is-' + l.getAttribute('data-menu-line'), !!on); });
    if (burger) { burger.setAttribute('aria-expanded', on ? 'true' : 'false'); burger.setAttribute('aria-label', on ? 'Close the menu' : 'Open the menu'); }
    root.style.overflow = on ? 'hidden' : '';
    if (WZ.smoother) WZ.smoother.paused(!!on);
    if (!on) drops.forEach(closeDrop);
  };
  if (burger && menu) {
    burger.addEventListener('click', function () {
      setDrawer(!drawerOpen);
      if (drawerOpen) { var first = $('a, button', menu); if (first) first.focus({ preventScroll: true }); }
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a[href]')) setDrawer(false); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drawerOpen) { setDrawer(false); if (burger) burger.focus(); }
    drops.forEach(function (d) { if (isOpen(d)) { closeDrop(d); var t = $('[data-dropdown-toggle]', d); if (DESKTOP_NAV.matches && t) t.focus(); } });
  });
  DESKTOP_NAV.addEventListener('change', function () { setDrawer(false); });
  mark('menu');

  /* ---- in-page anchors ---- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    var hash = href.slice(href.indexOf('#') + 1);
    var path = href.slice(0, href.indexOf('#'));
    if (path && path.replace(/\/$/, '') !== location.pathname.replace(/\/$/, '')) return;
    var target = hash && document.getElementById(hash);
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
  /* arriving with a hash (from another page): ScrollTrigger refreshes move the page, so land again */
  if (location.hash && document.getElementById(location.hash.slice(1))) {
    var land = function () { var t = document.getElementById(location.hash.slice(1)); if (!t) return; if (WZ.smoother) WZ.smoother.scrollTo(t, false, 'top 12px'); else window.scrollTo(0, t.getBoundingClientRect().top + window.pageYOffset - 12); };
    window.addEventListener('load', function () { setTimeout(land, 60); setTimeout(land, 700); });
  }

  /* ---- FAQ: one answer open at a time. With motion the answer eases open and shut; without it the
     native <details> behaviour is untouched. ---- */
  $$('[data-faq]').forEach(function (list) {
    var items = $$('details', list);
    var body = function (d) { return d.querySelector('summary + *'); };
    var close = function (d) {
      var answer = body(d);
      if (!MOTION || !answer) { d.open = false; return; }
      gsap.to(answer, { height: 0, autoAlpha: 0, duration: 0.4, ease: 'power2.inOut', onComplete: function () { d.open = false; gsap.set(answer, { clearProps: 'all' }); refreshSoon(); } });
    };
    items.forEach(function (d) {
      var summary = $('summary', d);
      var answer = body(d);
      d.addEventListener('toggle', function () {
        if (d.open) items.forEach(function (o) { if (o !== d && o.open) { if (MOTION && body(o)) { gsap.killTweensOf(body(o)); gsap.set(body(o), { clearProps: 'all' }); } o.open = false; } });
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
  });
  /* folded copy (<details data-fold>) refreshes the scroll positions below it when it opens */
  $$('details[data-fold]').forEach(function (d) { d.addEventListener('toggle', refreshSoon); });

  /* ---- the phone call bar steps aside while a consultation form is on screen ---- */
  var callbar = $('[data-callbar]');
  var form = $('[data-form]');
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
  var heroVideo = $('[data-hero-video]');
  var heroFrame = $('[data-hero-frame]');
  var held = false; /* the visitor paused it */
  if (heroVideo && heroFrame && !REDUCED) {
    var vsrc = (window.matchMedia('(max-width: 767px)').matches && heroVideo.getAttribute('data-src-mobile')) || heroVideo.getAttribute('data-src');
    heroVideo.muted = true;
    heroVideo.loop = true;
    heroVideo.playsInline = true;
    heroVideo.setAttribute('muted', '');
    heroVideo.setAttribute('playsinline', '');
    heroVideo.preload = 'auto';
    heroVideo.src = vsrc;
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'arrival_film-toggle';
    toggle.setAttribute('data-film-toggle', '');
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

  /* ---- a patient film, with sound, in a light box ----
     Every [data-film] is a plain link to the file, so without a script it still opens the film. */
  var lastFocus = null;
  var filmKeys;
  var closeFilm = function () {
    var box = $('[data-film-box]');
    if (!box) return;
    var v = $('video', box);
    if (v) v.pause();
    box.remove();
    document.removeEventListener('keydown', filmKeys);
    if (WZ.smoother) WZ.smoother.paused(false);
    if (heroVideo && heroVideo.src && !held) heroVideo.play().catch(function () {});
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  filmKeys = function (e) {
    if (e.key === 'Escape') { closeFilm(); return; }
    if (e.key !== 'Tab') return;
    /* keep focus inside the light box: the close button and the player */
    var box = $('[data-film-box]');
    var f = box ? $$('button, video', box) : [];
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  $$('[data-film]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      lastFocus = link;
      var title = link.getAttribute('data-film') || 'A patient film';
      if (heroVideo) heroVideo.pause();
      if (WZ.smoother) WZ.smoother.paused(true);
      var box = document.createElement('div');
      box.className = 'film_component';
      box.setAttribute('data-film-box', '');
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', title + ', a patient film');
      box.innerHTML = '<div class="film_box"><p class="film_title"></p><button type="button" class="film_close" data-film-close>Close</button><video class="film_video" controls playsinline preload="auto"></video></div>';
      $('.film_title', box).textContent = title;
      var v = $('video', box);
      v.src = link.getAttribute('href');
      document.body.appendChild(box);
      box.addEventListener('click', function (ev) { if (ev.target === box) closeFilm(); });
      $('[data-film-close]', box).addEventListener('click', closeFilm);
      document.addEventListener('keydown', filmKeys);
      $('[data-film-close]', box).focus();
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () {});
    });
  });

  /* ---- before and after: a mouse can drag the divider (any page) ---- */
  var cases = $$('[data-case]');
  if (FINE) {
    cases.forEach(function (c) {
      var after = $('[data-case-after]', c);
      var line = $('[data-case-line]', c);
      if (!after || !line) return;
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var p = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
        after.style.clipPath = 'inset(0 ' + (100 - p).toFixed(1) + '% 0 0)';
        line.style.left = p + '%';
        line.style.opacity = 1;
        line.style.visibility = 'visible';
      });
      c.addEventListener('pointerleave', function () {
        if (MOTION) {
          gsap.to(after, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power3.out' });
          gsap.to(line, { left: '100%', autoAlpha: 0, duration: 0.6, ease: 'power3.out' });
        } else { after.style.clipPath = 'inset(0 50% 0 0)'; line.style.left = '50%'; }
      });
    });
  }

  if (!MOTION) { WZ.ok = true; mark('interface'); return; }

  /* ================= motion ================= */
  root.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  var INK = '#292824';
  var DIM = '#77736b'; /* the readable grey unlit words start from: 4.5:1 on every light ground */
  var EASE = 'power3.out';
  var mm = gsap.matchMedia();
  var el = function (tag, cls, parent) { var n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };
  var motionOn = function (nodes) { nodes.forEach(function (n) { if (n) n.classList.add('is-motion'); }); };

  /* smooth scroll on desktop only, where the menu is a bar (the drawer must stay position: fixed) */
  if (DESKTOP_NAV.matches && ScrollTrigger.isTouch !== 1) {
    WZ.smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, effects: false });
    mark('smoother');
  }
  releaseHolds();

  /* ---- arrival curtain: the round mark, a line that fills, then the page is uncovered ----
     Once per visit, and never longer than about a second. */
  var intro = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  var seen = false;
  try { seen = sessionStorage.getItem('hk-curtain') === '1'; sessionStorage.setItem('hk-curtain', '1'); } catch (e) { seen = false; }
  /* A script that arrives late would put the curtain over a page the visitor is already reading. */
  if (!seen && window.pageYOffset < 10 && performance.now() < 2500) {
    var curtain = el('div', 'curtain_component', document.body);
    curtain.setAttribute('aria-hidden', 'true');
    var logo = $('[data-navbar] img');
    var mk = null;
    if (logo) { mk = el('img', 'curtain_mark', curtain); mk.src = logo.currentSrc || logo.src; mk.alt = ''; }
    var bar = el('span', 'curtain_bar', curtain);
    if (mk) intro.from(mk, { scale: 0.8, autoAlpha: 0, duration: 0.45, ease: EASE });
    intro
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.55 }, '<0.1')
      .to(curtain, { clipPath: 'inset(0 0 100% 0)', duration: 0.75 }, '+=0.05')
      .add(function () { curtain.remove(); });
    mark('curtain');
  }
  var heroDelay = intro.duration();

  /* ---- headlines: words rise out of line masks; the split redoes itself when fonts or width change ---- */
  $$('[data-split]').forEach(function (h) {
    var hero = h.getAttribute('data-split') === 'hero';
    SplitText.create(h, {
      type: 'lines,words', mask: 'lines', linesClass: 'split_line', wordsClass: 'split_word', autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.words, {
          yPercent: 115, rotate: 3, transformOrigin: '0% 100%', duration: hero ? 1.25 : 1.05, stagger: hero ? 0.06 : 0.035, ease: 'power4.out',
          delay: hero ? heroDelay * 0.72 : 0,
          scrollTrigger: hero ? null : { trigger: h, start: 'top 88%', once: true }
        });
      }
    });
  });
  /* taglines type themselves in */
  $$('[data-type]').forEach(function (k) {
    var inHero = !!k.closest('[data-hero], [data-page-hero]');
    var chars = SplitText.create(k, { type: 'chars', charsClass: 'split_char' }).chars;
    gsap.from(chars, { autoAlpha: 0, y: 6, duration: 0.5, stagger: 0.018, ease: EASE, delay: inHero ? heroDelay * 0.7 : 0, scrollTrigger: inHero ? null : { trigger: k, start: 'top 90%', once: true } });
  });
  mark('split');

  /* ---- home hero: the film rises into its frame; scrolling away, the frame opens to the window ---- */
  var hero = $('[data-hero]');
  if (hero) {
    var frame = $('[data-hero-frame]', hero);
    var film = $('[data-hero-film]', hero);
    var heroVid = $('[data-hero-video]', hero);
    var heroGrid = film ? film.previousElementSibling : null;
    var d0 = heroDelay * 0.6;
    /* how far the page margin is from the window edge: the film starts inside it */
    var side = function () { return Math.max(0, heroGrid ? heroGrid.getBoundingClientRect().left : 0); };
    var inset = function (top, x, r) { return 'inset(' + top + '% ' + x + 'px 0% ' + x + 'px round ' + r + 'px)'; };
    var radius = function () { return parseFloat(getComputedStyle(frame).borderTopLeftRadius) || 28; };
    gsap.from($$('[data-reveal]', hero), { y: 34, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: EASE, delay: d0 + 0.35 });
    gsap.from($$('[data-hero-hold]', film), { y: 40, autoAlpha: 0, duration: 1, stagger: 0.12, ease: EASE, delay: d0 + 0.9 });
    if (heroVid) gsap.fromTo(heroVid, { scale: 1.25 }, { scale: 1.04, duration: 2.4, ease: EASE, delay: d0 });
    mm.add({ wide: '(min-width: 992px)', narrow: '(max-width: 991px)' }, function (ctx) {
      if (ctx.conditions.narrow) {
        gsap.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1.4, ease: 'power4.inOut', delay: d0, clearProps: 'clipPath' });
        return;
      }
      /* the margins become a clip-path, so the frame can open to the window without moving the
         cards that sit on the page grid */
      var parts = [film].concat($$('[data-hero-hold]', film)).concat([$('[data-film-toggle]', film)]);
      motionOn(parts);
      var r = radius();
      frame.style.borderRadius = '0';
      gsap.fromTo(frame, { clipPath: function () { return inset(100, side(), r); } }, { clipPath: function () { return inset(0, side(), r); }, duration: 1.5, ease: 'power4.inOut', delay: d0 });
      gsap.timeline({ scrollTrigger: { id: 'hero-film', trigger: hero, start: 'top top', end: 'bottom 55%', scrub: 0.6, invalidateOnRefresh: true } })
        .fromTo(frame, { clipPath: function () { return inset(0, side(), r); } }, { clipPath: inset(0, 0, 0), ease: 'none', immediateRender: false }, 0)
        .to($('[data-split="hero"]', hero), { y: -40, ease: 'none' }, 0)
        .to($('[data-hero-copy]', hero), { y: -70, ease: 'none' }, 0);
      return function () { frame.style.borderRadius = ''; gsap.set(frame, { clearProps: 'clipPath' }); parts.forEach(function (n) { if (n) n.classList.remove('is-motion'); }); };
    });
    mark('hero');
  }

  /* ---- numbers count up once, the first time they are seen ---- */
  $$('[data-count]').forEach(function (n, i) {
    var end = parseFloat(n.getAttribute('data-count'));
    if (isNaN(end)) return;
    var dec = parseInt(n.getAttribute('data-decimals') || '0', 10);
    var suffix = n.getAttribute('data-suffix') || '';
    var prefix = n.getAttribute('data-prefix') || '';
    var fmt = function (v) { return prefix + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix; };
    var o = { v: 0 };
    var k = $$('[data-count]', n.closest('[data-stats]') || n.parentNode.parentNode).indexOf(n);
    var delay = Math.max(0, k) * 0.12;
    n.textContent = fmt(0);
    gsap.to(o, { v: end, duration: 1.8, delay: delay, ease: 'power2.out', onUpdate: function () { n.textContent = fmt(dec ? o.v : Math.round(o.v)); }, onComplete: function () { n.textContent = fmt(end); }, scrollTrigger: { trigger: n, start: 'top 90%', once: true } });
    var item = n.closest('[data-stat]');
    if (item) gsap.from(item, { y: 30, autoAlpha: 0, duration: 0.9, delay: delay, ease: EASE, scrollTrigger: { trigger: n, start: 'top 90%', once: true } });
  });
  mark('stats');

  /* ---- reveals: 34px up and in, as the concept has them ---- */
  $$('[data-reveal="rise"]').forEach(function (n) {
    if (hero && hero.contains(n)) return;
    if (n.closest('[data-page-hero]')) return;
    gsap.from(n, { y: 34, autoAlpha: 0, duration: 0.85, ease: EASE, scrollTrigger: { trigger: n, start: 'top 90%', once: true } });
  });
  $$('[data-reveal="stagger"]').forEach(function (box) {
    if (box.closest('[data-page-hero]')) return;
    gsap.from(box.children, { y: 24, autoAlpha: 0, duration: 0.75, stagger: 0.09, ease: EASE, scrollTrigger: { trigger: box, start: 'top 88%', once: true } });
  });
  $$('[data-reveal="wipe"]').forEach(function (n) {
    if (n.closest('[data-page-hero]')) return;
    if (headsOf(n)) { gsap.from(n, { y: 40, autoAlpha: 0, duration: 1.1, ease: EASE, scrollTrigger: { trigger: n, start: 'top 86%', once: true } }); return; }
    gsap.fromTo(n, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: n, start: 'top 86%', once: true } });
  });
  $$('[data-parallax]').forEach(function (n) {
    var img = $('img', n);
    if (!img) return;
    img.style.willChange = 'transform';
    var face = !!headsOf(img);
    anchorZoom(img);
    gsap.set(img, { scale: face ? 1.08 : 1.12 });
    gsap.fromTo(img, { yPercent: face ? -3 : -5 }, { yPercent: face ? 3 : 5, ease: 'none', scrollTrigger: { trigger: n, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  mark('reveals');

  /* ---- scene: the patient's sentence is written, then Eat / Smile / Live arrive ---- */
  var story = $('[data-scene="story"]');
  var quote = story && $('[data-words]', story);
  var words = quote ? SplitText.create(quote, { type: 'words', wordsClass: 'split_word' }).words : [];
  var benefits = story ? $$('[data-lit]', story) : [];
  var storyImg = story ? $('[data-parallax] img', story) : null;
  if (storyImg) anchorZoom(storyImg);
  if (words.length) gsap.set(words, { color: DIM });
  var writeStory = function (tl) {
    tl.fromTo(words, { y: 6 }, { y: 0, color: INK, duration: 0.2, stagger: 0.2, ease: 'none' })
      .fromTo(benefits, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.6, ease: 'power2.out' }, '>-0.2')
      .to({}, { duration: 0.5 });
    /* ends at the parallax's own scale, so its drift never shows an edge */
    if (storyImg) tl.fromTo(storyImg, { scale: 1.26 }, { scale: 1.12, ease: 'none', duration: tl.duration() }, 0);
    return tl;
  };

  /* ---- treatments draw themselves: one implant, a bridge on two, an arch on four ---- */
  var crown = function (cx) { return 'M' + (cx - 8) + ' 48C' + (cx - 9.5) + ' 38 ' + (cx - 9) + ' 29 ' + (cx - 6.5) + ' 25.5C' + (cx - 4) + ' 22 ' + (cx + 4) + ' 22 ' + (cx + 6.5) + ' 25.5C' + (cx + 9) + ' 29 ' + (cx + 9.5) + ' 38 ' + (cx + 8) + ' 48Z'; };
  var path = function (d, kind) { return '<path class="drawing_path' + (kind ? ' is-' + kind : '') + '" d="' + d + '"/>'; };
  var implant = function (cx, tilt) {
    var g = '<g' + (tilt ? ' transform="rotate(' + tilt + ' ' + cx + ' 50)"' : '') + '>' + path('M' + (cx - 3.2) + ' 50h6.4l-1 22h-4.4z', 'titanium');
    for (var y = 54; y <= 68; y += 4) g += path('M' + (cx - 4.2) + ' ' + y + 'h8.4', 'titanium');
    return g + '</g>';
  };
  var gum = path('M4 49Q60 45 116 49', 'gum');
  var DRAWINGS = {
    single: gum + path(crown(36), 'old') + path(crown(84), 'old') + path(crown(60)) + implant(60),
    bridge: gum + path('M40 46H80') + path(crown(40)) + path(crown(60)) + path(crown(80)) + implant(40) + implant(80),
    arch: gum + path('M14 46H106') + [15, 33, 51, 69, 87, 105].map(function (x) { return path(crown(x)); }).join('') + implant(20, 14) + implant(46) + implant(74) + implant(100, -14),
    revision: gum + path(crown(36), 'old') + path(crown(84), 'old') + path(crown(60)) + implant(60, 8),
    smile: gum + [24, 42, 60, 78, 96].map(function (x) { return path(crown(x)); }).join('')
  };
  var drawIn = function (holder, kind, trigger) {
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = '<svg class="drawing_svg" viewBox="0 0 120 80" fill="none">' + (DRAWINGS[kind] || DRAWINGS.single) + '</svg>';
    var paths = $$('path', holder);
    paths.forEach(function (p) { var len = p.getTotalLength() + 1; p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });
    gsap.to(paths, { strokeDashoffset: 0, ease: 'none', stagger: 0.04, scrollTrigger: { trigger: trigger || holder, start: 'top 92%', end: 'top 45%', scrub: 0.6 } });
  };
  var solutions = $$('[data-solution]');
  solutions.forEach(function (row) {
    var holder = el('div', 'solutions_drawing');
    row.insertBefore(holder, row.firstChild);
    drawIn(holder, row.getAttribute('data-drawing'), row);
  });
  /* drawings placed by the inner pages: <div data-drawing="arch"> */
  $$('[data-drawing]:not([data-solution])').forEach(function (holder) { holder.classList.add('drawing_component'); drawIn(holder, holder.getAttribute('data-drawing')); });
  /* each row of the index slides in from the right, its numeral from further out */
  mm.add('(min-width: 768px)', function () {
    solutions.forEach(function (row) {
      gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 95%', end: 'top 60%', scrub: 0.6 } })
        .fromTo($$('[data-solution-part]', row), { x: 80 }, { x: 0, ease: 'none', stagger: 0.08 }, 0)
        .fromTo($('[data-solution-number]', row), { x: 160 }, { x: 0, ease: 'none' }, 0);
    });
  });
  mm.add('(max-width: 767px)', function () {
    solutions.forEach(function (row) { gsap.from(row, { y: 30, autoAlpha: 0, duration: 0.8, ease: EASE, scrollTrigger: { trigger: row, start: 'top 90%', once: true } }); });
  });
  mark('drawings');

  /* ---- a circle opens onto the photograph ---- */
  $$('[data-circle]').forEach(function (n) {
    var h = headsOf(n);
    if (!h) { gsap.fromTo(n, { clipPath: 'circle(20% at 50% 55%)' }, { clipPath: 'circle(75% at 50% 55%)', ease: 'none', scrollTrigger: { trigger: n, start: 'top 95%', end: 'center 50%', scrub: 0.6 } }); return; }
    var iris = function (open) {
      var img = h.img, r = n.getBoundingClientRect(), ir = img.getBoundingClientRect();
      var o = headOrigin(img).split(' ').map(parseFloat);
      var cx = ir.left - r.left + ir.width * o[0] / 100, cy = ir.top - r.top + ir.height * o[1] / 100;
      var span = 0;
      h.heads.forEach(function (q) { span = Math.max(span, q[2] * ir.width, q[3] * ir.height); });
      var rad = open ? Math.hypot(r.width, r.height) : span * 0.8;
      return 'circle(' + rad.toFixed(0) + 'px at ' + cx.toFixed(0) + 'px ' + cy.toFixed(0) + 'px)';
    };
    gsap.fromTo(n, { clipPath: function () { return iris(false); } }, { clipPath: function () { return iris(true); }, ease: 'none', scrollTrigger: { trigger: n, start: 'top 95%', end: 'center 50%', scrub: 0.6, invalidateOnRefresh: true } });
  });

  /* ---- scene: the four steps light up in order, a gold rule runs along them ---- */
  var journey = $('[data-scene="journey"]');
  var steps = journey ? $$('[data-step]', journey) : [];
  var track = journey ? $('[data-steps]', journey) : null;
  var rule = track ? el('span', 'journey_rule', track) : null;
  /* the parts that change layout while the scene runs sideways (desktop) */
  var journeyParts = journey ? [journey, $('[data-journey-head]', journey), track].concat(steps).concat(steps.map(function (s) { return $('[data-step-number]', s); })) : [];
  var lightSteps = function (tl) {
    if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: steps.length }, 0);
    steps.forEach(function (step, i) {
      tl.fromTo(step, { '--lit': 0 }, { '--lit': 1, duration: 1, ease: 'none' }, i)
        .fromTo($$('[data-step-part]', step), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12, ease: 'power2.out' }, i + 0.15)
        .fromTo($('[data-step-number]', step), { scale: 0.8, autoAlpha: 0.35 }, { scale: 1, autoAlpha: 1, transformOrigin: 'left bottom', duration: 0.7, ease: 'power2.out' }, i);
    });
    return tl.to({}, { duration: 0.4 });
  };

  /* ---- scene: scroll is the before and after ---- */
  var gallery = $('[data-scene="gallery"]');
  var galleryCases = gallery ? $$('[data-case]', gallery) : [];
  var wipe = function (tl, c, at) {
    return tl
      .fromTo($('[data-case-after]', c), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'none' }, at)
      .fromTo($('[data-case-line]', c), { left: '0%' }, { left: '100%', duration: 1, ease: 'none' }, '<')
      .to($('[data-case-line]', c), { autoAlpha: 0, duration: 0.06 }, '>-0.06');
  };
  /* every case starts on the "before" */
  cases.forEach(function (c) { gsap.set($('[data-case-after]', c), { clipPath: 'inset(0 100% 0 0)' }); gsap.set($('[data-case-line]', c), { left: '0%' }); });

  /* ---- headlines lit by the scroll: words go from the readable grey to ink ---- */
  $$('[data-light]').forEach(function (h) {
    var ws = SplitText.create(h, { type: 'words', wordsClass: 'split_word' }).words;
    gsap.fromTo(ws, { color: DIM }, { color: INK, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: h, start: 'top 80%', end: 'bottom 45%', scrub: 0.5 } });
  });

  /* ---- scene: the closing words, one at a time, while the photograph settles ---- */
  var fin = $('[data-scene="invitation"]');
  var finWords = fin ? $$('[data-light-word]', fin) : [];
  var finImg = fin ? $('[data-parallax] img', fin) : null;
  if (finImg) anchorZoom(finImg);
  var closeScene = function (tl) {
    tl.fromTo(finWords, { color: DIM, y: 10 }, { color: INK, y: 0, stagger: 0.35, duration: 0.35, ease: 'none' }, 0);
    if (finImg) tl.fromTo(finImg, { scale: 1.26 }, { scale: 1.12, ease: 'none', duration: tl.duration() }, 0);
    return tl.to({}, { duration: 0.3 });
  };

  /* how far the row of steps travels left: until the last step clears the right edge */
  var travel = function () {
    var left = track.getBoundingClientRect().left - gsap.getProperty(track, 'x');
    return Math.min(0, window.innerWidth - left - track.scrollWidth - 48);
  };

  /* desktop: the page holds while each scene plays. A scene is pinned only where it fits the
     window; on a short laptop screen the same timeline is scrubbed while it passes, unpinned. */
  var scene = function (node, length, scrub, id) {
    /* the pinned element carries the scene's id, so the gates (and anyone reading the page) can find it */
    if (id && !node.id) node.id = id;
    return node.offsetHeight <= window.innerHeight - 24
      ? { id: id, trigger: node, start: 'center center', end: '+=' + length, pin: true, scrub: scrub, invalidateOnRefresh: true }
      : { id: id, trigger: node, start: 'top 75%', end: 'bottom 25%', scrub: scrub, invalidateOnRefresh: true };
  };
  mm.add('(min-width: 992px)', function () {
    if (story) writeStory(gsap.timeline({ scrollTrigger: scene(story, '55%', 0.3, 'story') }));
    if (journey) {
      motionOn(journeyParts);
      var ptl = gsap.timeline({ scrollTrigger: scene(journey, '180%', 0.5, 'journey') });
      if (track) ptl.to(track, { x: travel, ease: 'none', duration: steps.length + 0.4 }, 0);
      lightSteps(ptl);
    }
    if (gallery) {
      var tl = gsap.timeline({ scrollTrigger: scene(gallery, '220%', 0.5, 'gallery') });
      galleryCases.forEach(function (c, i) { wipe(tl, c, i ? '>+0.25' : 0); });
      tl.to({}, { duration: 0.3 });
    }
    /* not pinned (BugHerd #13, #25: the pin held an empty screen); played while it passes */
    if (fin) closeScene(gsap.timeline({ scrollTrigger: { trigger: fin, start: 'top 85%', end: 'center 55%', scrub: 0.4, invalidateOnRefresh: true } }));
    mark('scenes');
    return function () { journeyParts.forEach(function (n) { if (n) n.classList.remove('is-motion'); }); };
  });

  /* tablet and phone: nothing is pinned; the same scenes are scrubbed by where they are on screen */
  mm.add('(max-width: 991px)', function () {
    if (quote) writeStory(gsap.timeline({ scrollTrigger: { trigger: quote, start: 'top 82%', end: 'bottom 35%', scrub: 0.4 } }));
    steps.forEach(function (step) {
      gsap.timeline({ scrollTrigger: { trigger: step, start: 'top 88%', end: 'top 45%', scrub: 0.4 } })
        .fromTo(step, { '--lit': 0 }, { '--lit': 1, duration: 1, ease: 'none' }, 0)
        .fromTo($$('[data-step-part]', step), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12 }, 0);
    });
    galleryCases.forEach(function (c) { wipe(gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 70%', end: 'top 12%', scrub: 0.4 } }), c, 0); });
    if (fin) closeScene(gsap.timeline({ scrollTrigger: { trigger: fin, start: 'top 75%', end: 'bottom 60%', scrub: 0.4 } }));
    mark('scrubbed');
  });

  /* cases outside a gallery scene (inner pages) wipe as they pass */
  cases.filter(function (c) { return galleryCases.indexOf(c) < 0; }).forEach(function (c) {
    wipe(gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 75%', end: 'center 40%', scrub: 0.4 } }), c, 0);
  });

  /* ---- a name, very large, drifting behind a portrait ---- */
  $$('[data-name-mark]').forEach(function (grid) {
    var tm = el('div', 'doctor_name-mark');
    tm.setAttribute('aria-hidden', 'true');
    tm.textContent = grid.getAttribute('data-name-mark');
    grid.insertBefore(tm, grid.firstChild);
    gsap.fromTo(tm, { xPercent: 6 }, { xPercent: -10, ease: 'none', scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true } });
    mark('name-mark');
  });

  /* ---- footer: the practice name rises line by line ---- */
  var fb = $('[data-footer-brand]');
  if (fb) SplitText.create(fb, { type: 'lines', mask: 'lines', linesClass: 'split_line', autoSplit: true, onSplit: function (self) { return gsap.from(self.lines, { yPercent: 110, duration: 1, stagger: 0.1, ease: 'power4.out', scrollTrigger: { trigger: fb, start: 'top 95%', once: true } }); } });

  /* inner-page scenes, registered by js/00-scenes.js (loaded first) */
  (window.WZScenes || []).forEach(function (fn) { try { fn({ gsap: gsap, ScrollTrigger: ScrollTrigger, SplitText: SplitText, mm: mm, $: $, $$: $$, el: el, EASE: EASE, INK: INK, DIM: DIM, scene: scene, mark: mark, refreshSoon: refreshSoon, drawIn: drawIn, headsOf: headsOf, anchorZoom: anchorZoom }); } catch (err) { if (window.console) console.warn('scene', err); } });

  /* ================= pointer ================= */
  if (FINE) {
    /* buttons roll their label and lean toward the pointer */
    $$('[data-button]').forEach(function (b) {
      var text = b.textContent.trim();
      b.textContent = '';
      var roll = el('span', 'button_roll', b);
      el('span', 'button_roll-text', roll).textContent = text;
      var copy = el('span', 'button_roll-text', roll);
      copy.textContent = text;
      copy.setAttribute('aria-hidden', 'true');
      b.style.transition = 'filter 0.3s ease, background-color 0.3s ease, color 0.3s ease';
      var x = gsap.quickTo(b, 'x', { duration: 0.5, ease: EASE });
      var y = gsap.quickTo(b, 'y', { duration: 0.5, ease: EASE });
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener('mouseleave', function () { x(0); y(0); });
    });
    mark('pointer');
  }

  /* continuity: reading progress along the top edge */
  var fill = $('[data-progress]');
  if (fill) gsap.to(fill, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* Triggers were created by kind, not in page order, and pins higher up push everything below
     them. Sort by position and measure again, or a reveal below a pin fires early. */
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  window.addEventListener('load', refreshSoon);
  if (document.fonts && document.fonts.load) document.fonts.load('400 1rem "Newsreader"').then(refreshSoon);

  WZ.ok = true;
})();
