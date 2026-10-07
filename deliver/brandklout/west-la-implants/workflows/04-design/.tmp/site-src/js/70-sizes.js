/* ==========================================================================
   SHARP CROPS — the right srcset variant for an object-fit:cover box.
   Instatic writes every image as sizes="auto, 100vw" (or 25vw / 33.33vw),
   which asks for a variant as wide as the BOX. A landscape photo cropped into
   a portrait or square box needs one as wide as the box's height times the
   photo's aspect: the rooms cards (320x401) were served 320px-wide files and
   upscaled 2.5x, the thank-you hero 2x (review 2026-10-06, "super blurry").
   This sets `sizes` to the width the crop actually needs; the browser then
   picks the right variant itself. Local builds carry no srcset: a no-op there.
   ========================================================================== */
(function(){
  function fit(img){
    if(!img.srcset || !img.naturalWidth || !img.naturalHeight) return;
    var r = img.getBoundingClientRect();
    if(r.width < 2 || r.height < 2) return;
    var w = r.width, fitMode = getComputedStyle(img).objectFit;
    if(fitMode === 'cover') w = Math.max(r.width, r.height * img.naturalWidth / img.naturalHeight);
    var want = Math.ceil(w) + 'px';
    /* only ever grow: a shrinking `sizes` would swap a sharp file for a softer one mid-scroll */
    var had = parseFloat(img.getAttribute('data-wz-sizes') || '0');
    if(Math.ceil(w) <= had) return;
    img.setAttribute('data-wz-sizes', String(Math.ceil(w)));
    img.sizes = want;
  }
  function all(){ document.querySelectorAll('img[srcset]').forEach(fit); }
  document.addEventListener('load', function(e){ if(e.target && e.target.tagName === 'IMG') fit(e.target); }, true);
  var t; window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(all, 200); });
  /* a wipe or reveal holds some frames at 0px until they scroll in: look again as the page moves */
  var busy = false;
  window.addEventListener('scroll', function(){ if(busy) return; busy = true; setTimeout(function(){ busy = false; all(); }, 250); }, { passive: true });
  setTimeout(all, 1500); setTimeout(all, 4000);
  if(document.readyState === 'complete') all(); else window.addEventListener('load', all);
  all();
})();
