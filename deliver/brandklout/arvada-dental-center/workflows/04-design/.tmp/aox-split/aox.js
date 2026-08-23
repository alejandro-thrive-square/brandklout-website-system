/* BEHAVIOUR — Arvada Dental Center · aox landing page
Generated from 04-design/.tmp/aox/index.html by _shared/split-page.mjs.
Do not hand-edit: edit the source page and re-run the script.

REQUIRES, in this order, before this file:
  https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js
  https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js
  https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollToPlugin.min.js
  https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollSmoother.min.js
  https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js

Order inside this file is load-bearing: WZ is defined first, each chapter
queues its choreography into WZ.add(), and the boot block at the bottom
registers the plugins, creates ScrollSmoother and only then flushes the
queue — so every ScrollTrigger measures the final, smoothed layout. */

/* ==========================================================================
   1. WZ — chapter queue and shared motion helpers  (_shared/journey.js)
   ========================================================================== */

/* ==========================================================================
   WZ — journey bootstrap (loaded in <head>).

   Chapter scripts push their setup into WZ.add(). The queue is flushed by
   journey-boot.js at the end of <body>, AFTER ScrollSmoother exists, so every
   ScrollTrigger measures against the final smoothed layout. A trigger
   registered mid-parse measures a half-built page and lands in the wrong place.

   Plugins are deliberately NOT registered here: this runs inside <head> where
   document.body does not exist yet, and registering ScrollTrigger that early
   leaves its internals half-initialised — ScrollSmoother then dies silently on
   getScrollFunc and the page merely feels flat, with no console error to
   explain it. journey-boot.js does the registration.
   ========================================================================== */
window.WZ = (function () {
  var queue = [], flushed = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ok = !!(window.gsap && window.ScrollTrigger);

  /* Pinning only works while the whole scene fits in one viewport. Below
     900px these chapters collapse to a single column and routinely need one
     and a half to two viewports — so the pin held the top of the scene on
     screen and let the rest of it scroll off the bottom, behind the sticky
     action bar. On the implants anatomy chapter that meant the three numbered
     steps, which ARE the chapter, were never visible on a phone at all.

     Under 900px the chapters run as ordinary flowing sections instead, and
     their timelines scrub against the section as it passes. Same choreography,
     same order, no scene held still over content it is hiding. */
  var canPin = window.matchMedia('(min-width: 900px)').matches;

  /* The ScrollTrigger config for a scrubbed chapter, in whichever of those two
     shapes applies. `run` is how many viewports of scroll the pinned version
     is scrubbed over; it has no meaning unpinned, where the section's own
     height sets the pace. */
  function scene(trigger, vars) {
    vars = vars || {};
    if (canPin) {
      return {
        trigger: trigger, start: 'top top',
        end: '+=' + Math.round(window.innerHeight * (vars.run || 2.4)),
        pin: true, scrub: vars.scrub == null ? .3 : vars.scrub,
        anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: vars.onUpdate
      };
    }
    return {
      trigger: trigger, start: vars.startFlow || 'top 78%',
      end: vars.endFlow || 'bottom 35%',
      scrub: vars.scrub == null ? .45 : vars.scrub,
      invalidateOnRefresh: true, onUpdate: vars.onUpdate
    };
  }

  /* Masked line reveal. Degrades to null when SplitText is missing, and every
     caller falls back to a plain fade rather than leaving the text hidden. */
  function splitLines(el, build) {
    if (!el || !window.SplitText) return null;
    try {
      var opts = { type: 'lines', mask: 'lines', linesClass: 'wz-line', autoSplit: true };
      if (build) opts.onSplit = function (self) { return build(self); };
      return (SplitText.create ? SplitText.create(el, opts) : new SplitText(el, opts));
    } catch (e) {
      try { return new SplitText(el, { type: 'lines', linesClass: 'wz-line' }); }
      catch (e2) { return null; }
    }
  }

  function splitWords(el) {
    if (!el || !window.SplitText) return null;
    try {
      var opts = { type: 'words', wordsClass: 'wz-word' };
      return (SplitText.create ? SplitText.create(el, opts) : new SplitText(el, opts));
    } catch (e) { return null; }
  }

  /* Scrubbed reading sweep. Words take white in reading order and the closing
     clause carries on into the accent colour — ONE continuous left-to-right
     pass, not two racing each other.

     It was two racing each other. Each chapter ran its own pair of tweens:

       tl.to(body, { color:'#403830',    stagger:.32 }, 0)
         .to(tail, { color:'#c8b282', stagger:.26 }, .4)

     The accent tween started at a fixed 0.4s regardless of how long the white
     sweep took, so on a 23-word paragraph the last word was already accent by
     ~2.7s while white was still crawling through word 15 at ~5.0s. The
     highlight arrived before the sentence it was supposed to finish, on every
     page that used the pattern.

     The accent run now starts at `cut * step` — the moment the white run
     reaches the handover word — so the two are one sweep by construction and
     cannot drift apart when the copy length changes.

     Returns { end, tail }: where the sweep finishes, and where the closing
     clause begins. Callers hang what follows off those instead of off a
     guessed constant, which is the other half of the same bug — a chapter
     whose cards dealt in at a hardcoded 0.55 was also unrelated to how long
     its own sentence took to read. */
  function sweepWords(tl, el, vars) {
    vars = vars || {};
    var accent = vars.accent || '#c8b282';
    var tailN = vars.tail == null ? 5 : vars.tail;
    var step = vars.step || .3;
    var dur = vars.duration || step * 2.4;
    var at = vars.at || 0;

    var sp = splitWords(el);
    var words = (sp && sp.words && sp.words.length) ? sp.words : null;
    if (!words) {
      /* No SplitText: the paragraph still has to arrive, and it still has to
         hand the timeline back sane positions. */
      var fallback = Math.max(2, dur);
      tl.from(el, { opacity: .2, ease: 'none', duration: fallback }, at);
      return { end: at + fallback, tail: at + fallback * .6 };
    }

    var cut = Math.max(0, words.length - tailN);
    var body = words.slice(0, cut), tail = words.slice(cut);
    var tailAt = at + cut * step;

    if (body.length) tl.to(body, { color: '#403830', stagger: step, duration: dur, ease: 'none' }, at);
    if (tail.length) tl.to(tail, { color: accent, stagger: step, duration: dur, ease: 'none' }, tailAt);

    return { end: at + (words.length - 1) * step + dur, tail: tailAt };
  }

  /* A horizontal chapter with no pin driving it.
     Six chapters travel sideways as you scroll down, which needs a pin to
     convert one axis into the other. Each already degraded to a native
     scroller under reduced motion; that same fallback is the right answer
     below 900px, where there is no pin either — and it is the behaviour a
     phone expects anyway, since a swipeable rail is how horizontal content
     works on a touch screen.

     The progress rule keeps its meaning: it reads the rail's own scrollLeft
     rather than a ScrollTrigger's progress. Cards are lit on arrival instead
     of by containerAnimation, which has no container animation to observe. */
  function rail(pin, track, bar, light) {
    if (pin) {
      pin.style.height = 'auto';
      pin.style.minHeight = '0';
      pin.style.paddingBlock = 'clamp(3rem,6vw,5rem)';
    }
    if (!track) return;
    track.setAttribute('data-rail', 'on');

    if (bar) {
      var paint = function () {
        var max = track.scrollWidth - track.clientWidth;
        bar.style.transform = 'scaleX(' + (max > 0 ? track.scrollLeft / max : 0).toFixed(4) + ')';
      };
      track.addEventListener('scroll', paint, { passive: true });
      window.addEventListener('resize', paint);
      paint();
    }

    if (typeof light === 'function' && window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          light(e.target, e.target.querySelector('.shot img, img'), e.isIntersecting);
        });
      }, { root: track, threshold: .55 });
      Array.prototype.forEach.call(track.children, function (c) { io.observe(c); });
    }
  }

  /* Headline entrance used by every chapter: masked lines rise on arrival.
     Returns the timeline so a caller can slot it into a larger sequence. */
  function headline(el, vars) {
    vars = vars || {};
    if (!el) return null;
    var start = vars.start || 'top 84%';
    var split = splitLines(el, function (self) {
      return gsap.from(self.lines, {
        yPercent: 108, duration: 1.05, stagger: .085, ease: 'power4.out',
        scrollTrigger: vars.trigger === false ? null : { trigger: el, start: start }
      });
    });
    if (!split) {
      gsap.from(el, {
        opacity: 0, y: 30, duration: .9, ease: 'power3.out',
        scrollTrigger: vars.trigger === false ? null : { trigger: el, start: start }
      });
    }
    return split;
  }

  return {
    reduced: reduced,
    ok: ok,
    canPin: canPin,
    scene: scene,
    rail: rail,
    smoother: null,
    splitLines: splitLines,
    splitWords: splitWords,
    sweepWords: sweepWords,
    headline: headline,
    add: function (fn) { flushed ? this.run(fn) : queue.push(fn); },
    run: function (fn) { try { fn(this); } catch (e) { console.error('[WZ chapter]', e); } },
    flush: function () {
      flushed = true;
      var self = this;
      queue.forEach(function (fn) { self.run(fn); });
      queue.length = 0;
    }
  };
})();

/* ==========================================================================
   2. CHAPTERS  (each was a <script> inside its own <section>, in order)
   ========================================================================== */


  WZ.add(function (W) {
    var root = document.getElementById('arrival');
    var hide = root.querySelectorAll('[data-anim="hide"]');
    gsap.set(hide, { visibility: 'visible' });
    if (W.reduced) { gsap.set(hide, { opacity: 1, y: 0 }); return; }

    var tl = gsap.timeline({ delay: .12 });
    var split = W.splitLines(document.getElementById('arrTitle'));
    if (split && split.lines && split.lines.length) {
      gsap.set(split.lines, { yPercent: 112 });
      tl.to(split.lines, { yPercent: 0, duration: 1.15, stagger: .09, ease: 'power4.out' }, 0);
    } else {
      tl.from('#arrTitle', { opacity: 0, y: 40, duration: 1, ease: 'power3.out' }, 0);
    }
    tl.from(root.querySelector('.chapter-tag'), { opacity: 0, x: -24, duration: .9, ease: 'power3.out' }, .05)
      .from('#arrLead',    { opacity: 0, y: 26, duration: .9, ease: 'power3.out' }, .5)
      .from('#arrActions', { opacity: 0, y: 26, duration: .9, ease: 'power3.out' }, .62)
      .from('#arrTrust > *', { opacity: 0, y: 20, duration: .8, stagger: .08, ease: 'power3.out' }, .72)
      .from('#consult',   { opacity: 0, y: 44, duration: 1.05, ease: 'power3.out' }, .3)
      .from('#arrImg',    { opacity: 0, scale: 1.26, duration: 1.8, ease: 'power3.out' }, 0);

    gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: .6 } })
      .to(root.querySelector('.in'), { yPercent: -14, opacity: .12, ease: 'none' }, 0)
      .to('#arrImg', { yPercent: 6, scale: 1.2, ease: 'none' }, 0);
  });


  WZ.add(function (W) {
    var pin = document.getElementById('vdPin'),
        big = document.getElementById('vdBig'),
        items = gsap.utils.toArray('#vdList .vd-item'),
        foot = document.getElementById('vdFoot');

    if (W.reduced) return;

    gsap.set(items, { opacity: 0, y: 38 });
    gsap.set(foot, { opacity: 0, y: 22 });

    var tl = gsap.timeline({
      scrollTrigger: W.scene(pin, { run: 2.6, scrub: .3 })
    });

    /* One left-to-right sweep, white into cyan. The checklist deals in from
       the closing clause, and the CTA lands once the sentence has finished —
       both tied to the length of this paragraph, not to a constant. */
    var sweep = W.sweepWords(tl, big, { accent: '#c8b282', tail: 9, step: .2 });
    tl.to(items, { opacity: 1, y: 0, stagger: .13, ease: 'none' }, sweep.tail)
      .to(foot, { opacity: 1, y: 0, ease: 'none' }, sweep.end);
  });


  WZ.add(function (W) {
    W.headline(document.getElementById('cmpTitle'), { start: 'top 86%' });
    if (W.reduced) return;
    gsap.from('#cmpBody tr', { opacity: 0, x: -30, duration: .8, stagger: .09, ease: 'power3.out',
      scrollTrigger: { trigger: '#cmpBody', start: 'top 86%' } });
    gsap.from('#benGrid .card', { opacity: 0, y: 38, duration: .9, stagger: .1, ease: 'power3.out',
      scrollTrigger: { trigger: '#benGrid', start: 'top 88%' } });
  });


  WZ.add(function (W) {
    var pin = document.getElementById('fourPin'),
        imps = ['#imp1', '#imp2', '#imp3', '#imp4'].map(function (s) { return document.querySelector(s); }),
        bridge = document.getElementById('archBridge'),
        ticks = document.getElementById('archTicks'),
        count = document.getElementById('fourCount'),
        cap = document.getElementById('fourCap');

    var CAPS = [
      ['Planned before anything is placed', 'Implant positions are worked out on a 3D scan using fully guided All-on-X technique, for accuracy and precision.'],
      ['Anchored where the bone is strongest', 'The posts are angled to use the bone you actually have, which is what avoids grafting in many cases.'],
      ['Four posts carry the whole arch', 'Four or more implants are placed securely into the jawbone — the arch is supported by bone, not by suction or adhesive.'],
      ['Teeth the same day', 'Most patients receive their full mouth implants the same day as surgery, with IV sedation if they want it.']
    ];

    W.headline(document.getElementById('fourTitle'), { start: 'top 86%' });

    if (W.reduced) {
      count.textContent = '4';
      gsap.set(bridge, { opacity: .95 });
      return;
    }

    gsap.set(imps, { opacity: 0, scale: 0, transformOrigin: 'center' });
    gsap.set(bridge, { opacity: 0 });
    gsap.set('#archTicks .tick', { opacity: 0 });

    var state = { v: 0, idx: -1 };
    function paint() {
      var n = Math.min(4, Math.floor(state.v + 0.001));
      count.textContent = String(n);
      var i = Math.max(0, Math.min(3, Math.ceil(state.v) - 1));
      if (i !== state.idx) {
        state.idx = i;
        cap.innerHTML = '<b>' + CAPS[i][0] + '</b><p>' + CAPS[i][1] + '</p>';
      }
    }

    var tl = gsap.timeline({
      scrollTrigger: W.scene(pin, { run: 3.2, scrub: .3 })
    });

    /* One post per segment. The counter is tweened rather than stepped by a
       callback so scrubbing backwards restores it exactly. */
    imps.forEach(function (el, i) {
      tl.to(el, { opacity: 1, scale: 1, ease: 'none', duration: .7 }, i * 1);
    });
    tl.to(state, { v: 4, ease: 'none', duration: 4, onUpdate: paint }, 0)
      .to(bridge, { opacity: .95, ease: 'none', duration: .9 }, 4.1)
      .to('#archTicks .tick', { opacity: 1, ease: 'none', duration: .5, stagger: .08 }, 4.5);
  });


  WZ.add(function (W) {
    var pin = document.getElementById('dayPin'),
        track = document.getElementById('dayTrack'),
        bar = document.getElementById('dayBar');

    /* No pin available — reduced motion, or a screen too narrow to hold one.


       Either way the sideways travel has nothing driving it, so the track


       becomes a swipeable rail and keeps its progress rule and its card


       lighting. See WZ.rail in journey.js. */


    if (W.reduced || !W.canPin) { W.rail(pin, track, bar, light); return; }

    function distance() { return Math.max(0, track.scrollWidth - window.innerWidth + 40); }

    var tween = gsap.to(track, {
      x: function () { return -distance(); }, ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'top top',
        end: function () { return '+=' + (distance() + window.innerHeight * .6); },
        pin: true, scrub: .3, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) { gsap.set(bar, { scaleX: self.progress }); }
      }
    });

    gsap.utils.toArray('#dayTrack .path-card').forEach(function (card) {
      ScrollTrigger.create({
        trigger: card, containerAnimation: tween, start: 'left 72%', end: 'right 28%',
        onEnter: function () { light(card, true); }, onEnterBack: function () { light(card, true); },
        onLeave: function () { light(card, false); }, onLeaveBack: function () { light(card, false); }
      });
      gsap.fromTo(card.querySelector('.no'), { opacity: .35 }, { opacity: 1, duration: .4,
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 78%',
          toggleActions: 'play none none reverse' } });
    });

    function light(card, on) {
      gsap.to(card, { borderColor: on ? 'rgba(154,130,80,.6)' : 'rgba(64,56,48,.14)',
        boxShadow: on ? '0 18px 44px rgba(64,56,48,.1)' : '0 0 0 rgba(0,0,0,0)', duration: .5 });
    }
  });


  WZ.add(function (W) {
    W.headline(document.getElementById('invTitle'), { start: 'top 86%' });
    if (W.reduced) return;
    gsap.fromTo('#invRidge', { yPercent: 12 }, { yPercent: -6, ease: 'none',
      scrollTrigger: { trigger: '#investment', start: 'top bottom', end: 'bottom top', scrub: .9 } });
    gsap.from('#invPrice', { opacity: 0, scale: .88, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '#invPrice', start: 'top 88%' } });
  });


  WZ.add(function (W) {
    W.headline(document.getElementById('prTitle'), { start: 'top 86%' });
    if (W.reduced) { gsap.set('#prPlate', { clipPath: 'inset(0 0 0% 0)' }); return; }
    gsap.to('#prPlate', { clipPath: 'inset(0 0 0% 0)', duration: 1.25, ease: 'power4.inOut',
      scrollTrigger: { trigger: '#prPlate', start: 'top 84%' } });
    gsap.fromTo('#prImg', { scale: 1.22, yPercent: -5 }, { scale: 1.08, yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: '#prPlate', start: 'top bottom', end: 'bottom top', scrub: .8 } });
    gsap.from('#prCreds li', { opacity: 0, x: -22, duration: .65, stagger: .08, ease: 'power2.out',
      scrollTrigger: { trigger: '#prCreds', start: 'top 88%' } });
    gsap.from('#prReviews .review', { opacity: 0, y: 36, duration: .85, stagger: .1, ease: 'power3.out',
      scrollTrigger: { trigger: '#prReviews', start: 'top 88%' } });
  });


  WZ.add(function (W) {
    W.headline(document.getElementById('faqTitle'), { start: 'top 86%' });
    if (W.reduced) return;
    gsap.from('#invitation .faq__item', { opacity: 0, x: -20, duration: .6, stagger: .07,
      ease: 'power2.out', scrollTrigger: { trigger: '#invitation .faq', start: 'top 86%' } });
  });

/* ==========================================================================
   3. BOOT — must stay last  (_shared/journey-boot.js)
   ========================================================================== */

/* ==========================================================================
   BOOT — runs at the end of <body>.

   Order matters and is the whole reason this file is separate:
     1. register plugins (body exists now)
     2. create ScrollSmoother
     3. flush every chapter's queued setup
     4. wire the global UI and refresh once fonts/images have landed
   ========================================================================== */
(function () {
  var W = window.WZ;
  var doc = document.documentElement;

  /* ---------- things that must work with or without GSAP ---------- */
  officeStatus();
  faq();
  quiz();
  forms();
  year();

  if (!W || !W.ok) {
    /* GSAP missing: nothing may stay hidden. */
    doc.classList.remove('js-motion');
    document.querySelectorAll('[data-rv],[data-anim="hide"]').forEach(function (el) {
      el.style.opacity = '1'; el.style.visibility = 'visible';
    });
    actionBar();
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  if (window.ScrollSmoother) gsap.registerPlugin(ScrollSmoother);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  if (!W.reduced) doc.classList.add('js-motion');

  /* ScrollSmoother breaks full-page captures — it transforms the content
     rather than scrolling it, so captureBeyondViewport photographs one
     viewport and a lot of empty page. ?nosmooth=1 disables it for the capture
     pass only. It is opt-in via the URL and never shipped in the markup. */
  var noSmooth = /(\?|&)nosmooth=1/.test(location.search);

  if (!W.reduced && !noSmooth && window.ScrollSmoother) {
    try {
      W.smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper', content: '#smooth-content',
        /* Every scrubbed trigger adds a SECOND lag on top of this one, and it
           is that one that reads as broken. The pinned chapters run at
           scrub:.3 so the glide can be generous without the animation
           appearing to trail the wheel. */
        smooth: 1.05, effects: false, smoothTouch: false,
        normalizeScroll: false, ignoreMobileResize: true
      });
    } catch (e) { console.warn('ScrollSmoother unavailable', e); }
  }

  W.flush();

  /* ---------- generic chapter entrance ----------
     Bespoke, scrubbed choreography is authored per chapter in the page. This
     covers the ordinary arrivals so every chapter does not have to restate
     them. [data-rv="stagger"] walks its own children. */
  gsap.utils.toArray('[data-rv]').forEach(function (el) {
    /* A nested [data-rv] would be animated twice — once as its parent's
       stagger child and once in its own right — and the two `from` tweens
       fight over opacity, which can strand it invisible. */
    if (el.parentElement && el.parentElement.closest('[data-rv]')) return;
    var mode = el.getAttribute('data-rv');
    var targets = mode === 'stagger' ? el.children : el;
    gsap.set(el, { opacity: 1 });
    if (W.reduced) { gsap.set(targets, { opacity: 1, y: 0 }); return; }
    gsap.from(targets, {
      opacity: 0, y: 32, duration: .95, ease: 'power3.out',
      stagger: mode === 'stagger' ? parseFloat(el.getAttribute('data-stagger') || .09) : 0,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* ---------- counters ---------- */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var target = parseFloat(String(el.getAttribute('data-count')).replace(/[^0-9.]/g, ''));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    function paint(v) {
      el.textContent = prefix + v.toLocaleString('en-US',
        { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
    }
    if (W.reduced) { paint(target); return; }
    var o = { v: 0 };
    gsap.to(o, {
      v: target, duration: 1.8, ease: 'power2.out',
      onUpdate: function () { paint(o.v); },
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  /* ---------- reading progress ---------- */
  var bar = document.getElementById('navProgress');
  if (bar) {
    if (W.reduced) gsap.set(bar, { scaleX: 0 });
    else gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .25 } });
  }

  /* ---------- chapter readout ---------- */
  var chNum = document.getElementById('navChNum'),
      chName = document.getElementById('navChName'),
      chBar = document.getElementById('navChBar');
  var chapters = gsap.utils.toArray('section[data-chapter]');
  var last = chapters.length ? parseInt(chapters[chapters.length - 1].getAttribute('data-chapter'), 10) : 1;
  chapters.forEach(function (sec) {
    var i = parseInt(sec.getAttribute('data-chapter'), 10);
    var name = sec.getAttribute('data-chapter-name') || '';
    function activate() {
      if (chNum) chNum.textContent = String(i).padStart(2, '0');
      if (chName) chName.textContent = name;
      if (chBar) chBar.style.setProperty('--p', (last ? i / last : 0).toFixed(3));
    }
    ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 45%',
      onEnter: activate, onEnterBack: activate });
  });

  var nav = document.getElementById('nav');
  if (nav) ScrollTrigger.create({ start: 40, end: 99999,
    onToggle: function (self) { nav.classList.toggle('solid', self.isActive); } });

  actionBar();

  /* ---------- anchors routed through the smoother ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (W.smoother) W.smoother.scrollTo(t, !W.reduced, 'top 90px');
      else gsap.to(window, { duration: W.reduced ? 0 : .9, scrollTo: { y: t, offsetY: 80, autoKill: true }, ease: 'power2.inOut' });
    });
  });

  /* ---------- magnetic CTAs, pointer-fine only ---------- */
  if (!W.reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }),
          yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .2);
        yTo((e.clientY - r.top - r.height / 2) * .34);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* Pinned chapters measure wrong if fonts or images land late. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  doc.setAttribute('data-js', 'on');

  /* ======================================================================
     BEHAVIOUR — independent of the motion layer
     ====================================================================== */

  /* Sticky call bar appears on scroll DEPTH rather than when the hero leaves
     the viewport: on a tall mobile hero the hero exit fires late and leaves a
     stretch of page with no reachable offer. */
  function actionBar() {
    var el = document.querySelector('.actionbar');
    if (!el) return;
    function tick() {
      var y = window.scrollY || window.pageYOffset || 0;
      el.classList.toggle('is-on', y > window.innerHeight * 0.6);
    }
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* Real Mon–Fri 08:00–17:00 America/Denver. The practice is not a 24-hour
     service and no page here implies it is. */
  function officeStatus() {
    var nodes = document.querySelectorAll('[data-status]');
    if (!nodes.length) return;
    var open = false;
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Denver', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());
      var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
      var day = get('weekday');
      var mins = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
      open = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(day) > -1 && mins >= 480 && mins < 1020;
    } catch (e) { open = false; }

    nodes.forEach(function (n) {
      n.setAttribute('data-open', String(open));
      var t = n.querySelector('[data-status-text]');
      if (t) t.textContent = open ? 'Open now' : 'Closed · Mon–Fri 8–5';
    });
    document.querySelectorAll('[data-status-swap]').forEach(function (n) {
      var msg = n.getAttribute(open ? 'data-open-text' : 'data-closed-text');
      if (msg) n.textContent = msg;
    });
  }

  function faq() {
    document.querySelectorAll('.faq__q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq__item');
        var open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function quiz() {
    document.querySelectorAll('[data-quiz]').forEach(function (root) {
      var box = root.querySelector('.quiz');
      if (!box) return;
      var steps = Array.prototype.slice.call(box.querySelectorAll('.quiz__step'));
      var live = box.querySelector('[data-quiz-live]');
      var fill = box.querySelector('.quiz__progress i');
      var out = box.querySelector('[data-quiz-answers]');
      var answers = {}, idx = 0;

      function show(n) {
        idx = Math.max(0, Math.min(steps.length, n));
        steps.forEach(function (s, i) { s.setAttribute('data-active', String(i === idx)); });
        box.classList.toggle('is-done', idx >= steps.length);
        if (fill) fill.style.width = Math.round((idx / steps.length) * 100) + '%';
        if (live) live.textContent = idx >= steps.length
          ? 'All questions answered. Please leave your details.'
          : 'Question ' + (idx + 1) + ' of ' + steps.length;
      }

      steps.forEach(function (step) {
        var name = step.getAttribute('data-name');
        step.querySelectorAll('.quiz__opt').forEach(function (opt) {
          opt.addEventListener('click', function () {
            step.querySelectorAll('.quiz__opt').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
            opt.setAttribute('aria-pressed', 'true');
            answers[name] = opt.getAttribute('data-value');
            if (out) out.value = JSON.stringify(answers);
            setTimeout(function () { show(idx + 1); }, 190);
          });
        });
        var back = step.querySelector('.quiz__back');
        if (back) back.addEventListener('click', function () { show(idx - 1); });
      });
      show(0);
    });
  }

  /* Single choke-point for every lead on every page. There is no endpoint
     yet (Open Question 3 — the GHL/CRM destination has not been supplied),
     so the payload is validated, surfaced to the visitor and logged for
     inspection rather than posted somewhere invented. */
  function forms() {
    document.querySelectorAll('form[data-lead]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        form.querySelectorAll('[required]').forEach(function (input) {
          var field = input.closest('.field');
          var err = field ? field.querySelector('.field__err') : null;
          var bad = !input.value.trim() ||
            (input.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value)) ||
            (input.type === 'tel' && input.value.replace(/\D/g, '').length < 10);
          if (field) field.classList.toggle('is-bad', bad);
          if (err) err.textContent = bad
            ? (input.type === 'tel' ? 'Please enter a phone number we can reach you on.' : 'This field is required.')
            : '';
          if (bad) ok = false;
        });
        if (!ok) { var f = form.querySelector('.is-bad input'); if (f) f.focus(); return; }

        var payload = { form: form.getAttribute('data-lead'), page: location.pathname, at: new Date().toISOString() };
        new FormData(form).forEach(function (v, k) { payload[k] = v; });
        (window.__arvadaLeads = window.__arvadaLeads || []).push(payload);

        var done = document.createElement('div');
        done.className = 'form-ok';
        done.setAttribute('role', 'status');
        done.textContent = form.getAttribute('data-thanks') || 'Thank you — we will be in touch.';
        form.replaceWith(done);
      });
    });
  }

  function year() {
    var y = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (n) { n.textContent = y; });
  }
})();
