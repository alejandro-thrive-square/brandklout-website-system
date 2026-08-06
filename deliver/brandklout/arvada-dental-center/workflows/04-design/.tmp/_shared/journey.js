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
    smoother: null,
    splitLines: splitLines,
    splitWords: splitWords,
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
