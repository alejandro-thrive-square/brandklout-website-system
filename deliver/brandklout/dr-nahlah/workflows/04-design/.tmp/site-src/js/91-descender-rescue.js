/* ==========================================================================
   DESCENDER RESCUE
   SplitText(mask:'lines') sizes every line mask to the line box. Playfair
   Display paints about 1.34em of ink against this design's 1.02 line-height,
   so g/p/y/j stay clipped long after the reveal has finished — measured at
   ~8px on 52px type and ~21px on the 132px hero. The mask is only needed
   while a line is travelling, so the clip is dropped once the line lands.

   Polled rather than hooked to the tween: SplitText autoSplit rebuilds the
   masks on every resize, and the rebuilt ones come back clipped.

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
    var masks = document.getElementsByClassName('wz-mask-line-mask');
    for (var i = 0; i < masks.length; i++) {
      var line = masks[i].firstElementChild;
      if (!line) continue;
      masks[i].style.overflow = Math.abs(ty(line)) < EPS ? 'visible' : 'hidden';
    }
  }
  sweep();
  setInterval(sweep, 200);
  window.addEventListener('load', sweep);
})();
