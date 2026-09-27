/* ==========================================================================
   THE RUNTIME
   Every chapter's behaviour lives in its own file under sections/ and
   registers here by name. A module runs only if its markup is on the page,
   so the same bundle serves the home page, the catalogue and every product
   page and each one pays only for what it renders.

   Registration queues; it does not run. ScrollSmoother is created first and
   the queue is flushed afterwards (90-boot.js), so every ScrollTrigger
   measures against the final smoothed layout.
   ========================================================================== */
window.WZ = (function(){
  var q = [], flushed = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ok = !!(window.gsap && window.ScrollTrigger);
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var registered = [], active = [], modules = [];

  /* Plugins are NOT registered here: ScrollTrigger must init after
     document.body exists. 90-boot.js does it. */

  function splitLines(el, build){
    if(!window.SplitText || !el) return null;
    try{
      var opts = {type:'lines', mask:'lines', linesClass:'wz-line', autoSplit:true};
      if(build) opts.onSplit = function(self){ return build(self); };
      return SplitText.create ? SplitText.create(el,opts) : new SplitText(el,opts);
    }catch(e){
      try{ return new SplitText(el,{type:'lines',linesClass:'wz-line'}); }catch(e2){ return null; }
    }
  }
  function splitWords(el){
    if(!window.SplitText || !el) return null;
    try{ return SplitText.create ? SplitText.create(el,{type:'words',wordsClass:'wz-word'}) : new SplitText(el,{type:'words',wordsClass:'wz-word'}); }
    catch(e){ return null; }
  }
  function splitChars(el){
    if(!window.SplitText || !el) return null;
    try{ return SplitText.create ? SplitText.create(el,{type:'chars,words',charsClass:'wz-char'}) : new SplitText(el,{type:'chars,words',charsClass:'wz-char'}); }
    catch(e){ return null; }
  }

  /* Standard chapter entrance: tag slides in from the left, the headline
     rises line by line out of a mask, the lead and actions follow. Returns
     the timeline so a chapter can append its own beats. */
  function arrive(root, opts){
    opts = opts || {};
    var tag = root.querySelector('.chapter-tag'),
        head = root.querySelector('[data-split]'),
        rest = root.querySelectorAll('[data-arrive]');
    var tl = gsap.timeline({paused:true});
    if(tag) tl.from(tag,{opacity:0,x:-28,duration:.9,ease:'power3.out'},0);
    var split = splitLines(head, function(self){
      var t = gsap.from(self.lines,{yPercent:110,duration:1.1,stagger:.08,ease:'power4.out',paused:true});
      tl.add(t.play(),.05);
      return t;
    });
    if(!split && head) tl.from(head,{opacity:0,y:36,duration:1,ease:'power3.out'},.05);
    if(rest.length) tl.from(rest,{opacity:0,y:28,duration:.9,stagger:.09,ease:'power3.out'},.45);
    if(opts.trigger !== false){
      ScrollTrigger.create({trigger:root,start:opts.start||'top 72%',once:true,onEnter:function(){ tl.play(); }});
    }
    return tl;
  }

  /* Standard chapter departure: the content recedes as the next chapter
     covers it. Leaving a room, not scrolling past a band. */
  function depart(root, inner, amount){
    if(reduced) return null;
    return gsap.to(inner || root.children, {yPercent:-(amount||12), opacity:.12, ease:'none',
      scrollTrigger:{trigger:root, start:'bottom 70%', end:'bottom top', scrub:.4}});
  }

  return {
    reduced:reduced, ok:ok, fine:fine, smoother:null,
    splitLines:splitLines, splitWords:splitWords, splitChars:splitChars,
    arrive:arrive, depart:depart,
    registered:registered, active:active, modules:modules,

    section: function(name, selector, fn){
      if (typeof selector === 'function') { fn = selector; selector = '.' + name; }
      registered.push(name); modules.push({name:name, selector:selector, mode:'queued'});
      if (!document.querySelector(selector)) return;
      active.push(name);
      this.add(fn);
    },
    dom: function(name, selector, fn){
      if (typeof selector === 'function') { fn = selector; selector = '.' + name; }
      registered.push(name); modules.push({name:name, selector:selector, mode:'immediate'});
      if (!document.querySelector(selector)) return;
      active.push(name);
      this.run(fn);
    },
    add: function(fn){ flushed ? this.run(fn) : q.push(fn); },
    run: function(fn){ try{ fn(this); }catch(e){ console.error('[WZ section]', e); } },
    flush: function(){ flushed = true; var self = this; q.forEach(function(fn){ self.run(fn); }); q.length = 0; }
  };
})();
