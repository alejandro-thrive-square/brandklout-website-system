/* ==========================================================================
   DESCENDER RESCUE
   SplitText(mask:'lines') sizes every line mask to the line box. Playfair
   Display paints about 1.34em of ink against this design's 1.02 line-height,
   so g/p/y/j stay clipped long after the reveal has finished — measured at
   ~8px on 52px type and ~21px on the 132px hero. The mask is only needed
   while a line is travelling, so the clip is dropped once the line lands.

   Polled rather than hooked to the tween: SplitText autoSplit rebuilds the
   masks on every resize, and the rebuilt ones come back clipped.

   TWO class names, deliberately. SplitText builds each mask by cloning the
   line and suffixing every class it carries with `-mask`, so the mask's name
   is whatever `linesClass` is plus `-mask`. The live Webflow build splits with
   `wz-mask-line` and gets `wz-mask-line-mask`; this package's runtime splits
   with `wz-line` (js/00-runtime.js) and gets `wz-line-mask`. This swept only
   for the Webflow name, so on every page built from this package it matched
   nothing and never ran — which is why the descenders were still clipped
   after the fix was written. Matching both is what stops the two vocabularies
   drifting apart again.

   Kept as its own block so it converts to a single Webflow footer script; it
   is registered there as `wzDescenderRescue`.
   ========================================================================== */
(function () {
  var EPS = 0.6;
  function ty(el) {
    var t = getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    var m = t.match(/matrix\(([^)]+)\)/);
    if (m) return parseFloat(m[1].split(',')[5]) || 0;
    var m3 = t.match(/matrix3d\(([^)]+)\)/);
    if (m3) return parseFloat(m3[1].split(',')[13]) || 0;
    return 0;
  }
  function sweep() {
    var masks = document.querySelectorAll('.wz-line-mask,.wz-mask-line-mask');
    for (var i = 0; i < masks.length; i++) {
      var line = masks[i].firstElementChild;
      if (!line) continue;
      masks[i].style.overflow = Math.abs(ty(line)) < EPS ? 'visible' : 'clip';
    }
  }
  /* The poll used to run every 200ms for the life of the page. There are 8
     masks, `ty()` calls getComputedStyle on each and the loop then writes
     `style.overflow` back, so that was a forced style recalc five times a
     second, for ever, on every page -- 336ms of TimerFire in an 11s mobile
     trace, all of it after the lines had long since landed.

     A line only needs sweeping while it is TRAVELLING, so the poll now stops
     once nothing has moved for three consecutive passes and re-arms on the two
     events that can put a clipped mask back on the page: `load`, and the
     resize that makes SplitText autoSplit rebuild them. Same behaviour, no
     standing timer. */
  var timer = null, idle = 0;

  function pass() {
    var masks = document.querySelectorAll('.wz-line-mask,.wz-mask-line-mask');
    var moving = 0;
    for (var i = 0; i < masks.length; i++) {
      var line = masks[i].firstElementChild;
      if (!line) continue;
      var clipped = Math.abs(ty(line)) >= EPS;
      if (clipped) moving++;
      masks[i].style.overflow = clipped ? 'clip' : 'visible';
    }
    if (moving) idle = 0;
    else if (++idle >= 3) stop();
  }
  function start() { if (!timer) { idle = 0; timer = setInterval(pass, 200); } }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  pass();
  start();
  window.addEventListener('load', function () { pass(); start(); });
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(start, 120);   // autoSplit rebuilds masks clipped
  });
})();
