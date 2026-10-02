/* ==========================================================================
   THE RUNTIME
   Every section's behaviour lives in its own file under site-src/sections/ and
   registers itself here by name. A section only runs if its markup is on the
   page, so moving `<section class="ch-arrival">` to a different page carries
   its behaviour with it and leaving it off costs nothing — which is the whole
   reason the JS is split per section rather than per page.

   Registration queues; it does not run. ScrollSmoother is created first and the
   queue is flushed afterwards (js/90-boot.js), so every ScrollTrigger measures
   against the final smoothed layout. Without that ordering, triggers registered
   mid-parse measure a half-built page.
   ========================================================================== */
window.WZ = (function(){
  var q = [], flushed = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ok = !!(window.gsap && window.ScrollTrigger);

  /* NOTE: plugins are deliberately NOT registered here. Registering
     ScrollTrigger before document.body exists leaves its internals
     half-initialised, and ScrollSmoother then dies on `getScrollFunc` with
     "Cannot read properties of undefined". js/90-boot.js does the registration
     instead, and this whole file ships at the end of <body> for the same
     reason. */

  /* The registry. `modules` records what each section guards on, so a gate can
     check the property that matters — a module runs exactly when its markup is
     on the page, and never otherwise — rather than assuming it. */
  var registered = [], active = [], modules = [];

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
      var opts = {type:'words', wordsClass:'wz-word', aria:'none'}; /* no aria-label on the <p>: axe aria-prohibited-attr (QA 2026-09-28) */
      return (SplitText.create ? SplitText.create(el,opts) : new SplitText(el,opts));
    }catch(e){ return null; }
  }

  return {
    reduced: reduced,
    ok: ok,
    smoother: null,
    splitLines: splitLines,
    splitWords: splitWords,
    registered: registered,
    active: active,
    modules: modules,

    /* WZ.section(name[, selector], fn)
       `name` identifies the module; `selector` is what has to be on the page for
       it to run, defaulting to `.<name>`. Pass a selector when the section's own
       class is not unique enough to guard on — the gallery filter guards on
       `#gaGrid`, because its section carries the generic `.pk` class that every
       interior page uses. */
    section: function(name, selector, fn){
      if (typeof selector === 'function') { fn = selector; selector = '.' + name; }
      registered.push(name); modules.push({name: name, selector: selector, mode: 'queued'});
      if (!document.querySelector(selector)) return;
      active.push(name);
      this.add(fn);
    },

    /* Same registration, but runs straight away instead of queueing.
       For behaviour that is plain DOM work and must survive GSAP being absent:
       the queue is only flushed once ScrollSmoother has been created, and when
       GSAP fails to load the boot sequence reveals the content and returns
       without flushing — so a queued click handler would never be attached. */
    dom: function(name, selector, fn){
      if (typeof selector === 'function') { fn = selector; selector = '.' + name; }
      registered.push(name); modules.push({name: name, selector: selector, mode: 'immediate'});
      if (!document.querySelector(selector)) return;
      active.push(name);
      this.run(fn);
    },

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
