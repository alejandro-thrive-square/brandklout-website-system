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

       tl.to(body, { color:'#fff',    stagger:.32 }, 0)
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

    if (body.length) tl.to(body, { color: '#ffffff', stagger: step, duration: dur, ease: 'none' }, at);
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
