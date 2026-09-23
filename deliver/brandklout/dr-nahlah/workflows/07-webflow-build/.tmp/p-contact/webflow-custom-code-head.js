// External script from source design: assets/gsap/gsap.min.js

// External script from source design: assets/gsap/ScrollTrigger.min.js

// External script from source design: assets/gsap/ScrollToPlugin.min.js

// External script from source design: assets/gsap/ScrollSmoother.min.js

// External script from source design: assets/gsap/SplitText.min.js

// External script from source design: assets/gsap/Observer.min.js

/* ==========================================================================
   BOOTSTRAP (the only shared script)
   Section scripts push their setup into WZ.add(). We create ScrollSmoother
   first, then flush the queue, so every ScrollTrigger measures against the
   final smoothed layout. Without this ordering, triggers registered mid-parse
   measure a half-built page.
   ========================================================================== */
window.WZ = (function(){
  var q = [], flushed = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ok = !!(window.gsap && window.ScrollTrigger);

  /* NOTE: plugins are deliberately NOT registered here. This script runs inside
     <head>, where document.body does not exist yet — registering ScrollTrigger
     that early leaves its internals half-initialised, and ScrollSmoother then
     dies on `getScrollFunc` with "Cannot read properties of undefined". The
     flush block at the end of <body> does the registration instead. */

  /* Split into masked lines, with graceful degradation if SplitText is absent. */
  /* Pass `build` when the lines carry a tween: it runs on the first split and
     again on every re-split, and whatever it returns is killed before the next
     one so tweens never point at dead nodes. Omit it for one-shot entrances —
     the lines still re-flow, they just do not re-animate. */
  function splitLines(el, build){
    if(!window.SplitText) return null;
    try{
      var opts = {type:'lines', mask:'lines', linesClass:'wz-line', autoSplit:true};
      if(build) opts.onSplit = function(self){ return build(self); };
      return (SplitText.create ? SplitText.create(el,opts) : new SplitText(el,opts));
    }catch(e){
      try{ return new SplitText(el,{type:'lines',linesClass:'wz-line'}); }catch(e2){ return null; }
    }
  }
  function splitWords(el){
    if(!window.SplitText) return null;
    try{
      var opts = {type:'words', wordsClass:'wz-word'};
      return (SplitText.create ? SplitText.create(el,opts) : new SplitText(el,opts));
    }catch(e){ return null; }
  }

  return {
    reduced: reduced,
    ok: ok,
    smoother: null,
    splitLines: splitLines,
    splitWords: splitWords,
    add: function(fn){ flushed ? this.run(fn) : q.push(fn); },
    run: function(fn){ try{ fn(this); }catch(e){ console.error('[WZ section]', e); } },
    flush: function(){
      flushed = true;
      var self = this;
      q.forEach(function(fn){ self.run(fn); });
      q.length = 0;
    }
  };
})();
