/* ==========================================================================
   THE RUNTIME — West LA Implants
   Every chapter's behaviour lives in its own file under site-src/sections/ and
   registers itself here by name. A chapter only runs if its markup is on the
   page. Registration queues; ScrollSmoother is created first (js/90-boot.js)
   and the queue is flushed afterwards, so every ScrollTrigger measures against
   the final smoothed layout.

   Plugins are deliberately NOT registered here: registering ScrollTrigger
   before document.body exists leaves ScrollSmoother dead on getScrollFunc.
   This whole bundle ships at the end of <body>.
   ========================================================================== */
window.WZ = (function(){
  var q = [], flushed = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ok = !!(window.gsap && window.ScrollTrigger);
  var registered = [], active = [], modules = [];

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
  function splitChars(el){
    if(!window.SplitText) return null;
    try{
      var opts = {type:'chars,words', charsClass:'wz-char', wordsClass:'wz-word'};
      return (SplitText.create ? SplitText.create(el,opts) : new SplitText(el,opts));
    }catch(e){ return null; }
  }

  return {
    reduced: reduced,
    ok: ok,
    smoother: null,
    splitLines: splitLines,
    splitWords: splitWords,
    splitChars: splitChars,
    registered: registered,
    active: active,
    modules: modules,

    section: function(name, selector, fn){
      if (typeof selector === 'function') { fn = selector; selector = '.' + name; }
      registered.push(name); modules.push({name: name, selector: selector, mode: 'queued'});
      if (!document.querySelector(selector)) return;
      active.push(name);
      this.add(fn);
    },
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
