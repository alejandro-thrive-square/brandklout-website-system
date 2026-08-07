/* WZ bootstrap — HEAD ONLY. The section embeds call WZ.add mid-parse, so this
   must be defined before the first section arrives; a footer-installed
   bootstrap throws "WZ is not defined" per chapter. GSAP must already be
   loaded above (the CDN tags), but `ok` is a lazy getter so a slow tag cannot
   freeze it false. Registration stays in the FOOTER — registering
   ScrollTrigger before document.body exists kills ScrollSmoother silently. */
window.WZ = (function () {
  var q = [], flushed = false;
  var W = {
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    fine: window.matchMedia('(hover:hover) and (pointer:fine)').matches,
    smoother: null,
    get ok() { return !!(window.gsap && window.ScrollTrigger); },
    /* Masked per-line split; degrades to null when SplitText is absent. */
    splitLines: function (el, build) {
      if (!window.SplitText) return null;
      try {
        var o = { type: 'lines', mask: 'lines', linesClass: 'wz-line', autoSplit: true };
        if (build) o.onSplit = function (self) { return build(self); };
        return SplitText.create ? SplitText.create(el, o) : new SplitText(el, o);
      } catch (e) { return null; }
    },
    splitWords: function (el) {
      if (!window.SplitText) return null;
      try {
        var o = { type: 'words', wordsClass: 'wz-word' };
        return SplitText.create ? SplitText.create(el, o) : new SplitText(el, o);
      } catch (e) { return null; }
    },
    /* A scrubbed trigger with no tween never fires onUpdate; scrubbing a proxy
       yields a real 0-1 signal. The cleanup deliberately does NOT kill the
       tween or its trigger: a matchMedia context already owns and reverts
       them, and a second revert strips the pin spacers while the triggers
       keep stale start/end values — the page then measures thousands of px
       shorter than ScrollTrigger believes. Only class/paint state is ours. */
    scrub: function (config, paint) {
      var proxy = { p: 0 };
      gsap.to(proxy, { p: 1, ease: 'none', scrollTrigger: config, onUpdate: function () { paint(proxy.p); } });
      return function () { paint(1); };
    },
    add: function (fn) { flushed ? W.run(fn) : q.push(fn); },
    run: function (fn) { try { fn(W); } catch (e) { console.error('[WZ]', e); } },
    flush: function () { flushed = true; q.forEach(function (fn) { W.run(fn); }); q.length = 0; },
    onReady: function (fn) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
      else fn();
    },
    /* Resolved-state painter: runs only when the motion layer will not, so a
       pinned scene ships lit instead of stranded at its "not yet" state.
       Motion off must never mean content off. */
    staticPaint: function (fn) {
      W.onReady(function () {
        if (W.reduced || !W.ok) { try { fn(); } catch (e) { console.error('[WZ]', e); } }
      });
    },
  };
  return W;
})();
