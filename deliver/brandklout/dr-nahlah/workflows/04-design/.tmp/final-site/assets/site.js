/* ===== js/00-runtime.js ===== */
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

/* ===== js/20-pagekit.js ===== */
WZ.add(function (W) {
  var kit = document.body;
  if (!W.reduced) kit.classList.add('wz-kit');

  /* Before/after sliders work with or without GSAP — they are content, not motion. */
  document.querySelectorAll('.pk-ba').forEach(function (ba) {
    var range = ba.querySelector('input[type=range]');
    /* Instatic maps every <input> onto its own form-control module, which only
       knows type="text": the three comparison sliders arrive as text boxes
       showing "50", with the aria-label dropped. Coerce the one input this
       component owns back to a range before wiring it, so the slider works on
       any host that rewrites input types. No-op where it arrived intact. */
    if (!range) {
      var alt = ba.querySelector('input');
      if (alt && alt.getAttribute('max') === '100') {
        alt.type = 'range';
        if (!alt.getAttribute('aria-label')) alt.setAttribute('aria-label', 'Reveal the after photograph');
        range = alt;
      }
    }
    if (!range) return;
    var paint = function () { ba.style.setProperty('--pos', range.value + '%'); };
    range.addEventListener('input', paint);
    paint();
  });

  if (W.reduced) return;

  /* One reveal rule for the whole kit: anything tagged data-rv rises into place
     when it crosses 86% of the viewport. data-rv="stagger" walks its children. */
  gsap.utils.toArray('[data-rv]').forEach(function (el) {
    // A nested data-rv is animated twice — once as its parent's stagger child
    // and once in its own right — and the two `from` tweens fight over opacity,
    // which can strand it invisible. The outer reveal already covers it.
    if (el.parentElement && el.parentElement.closest('[data-rv]')) return;
    var mode = el.getAttribute('data-rv');
    var targets = mode === 'stagger' ? el.children : el;
    gsap.set(el, { opacity: 1 });
    gsap.from(targets, {
      opacity: 0, y: 30, duration: .95, ease: 'power3.out',
      stagger: mode === 'stagger' ? .09 : 0,
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  /* Masked line reveal for anything asking for it. */
  gsap.utils.toArray('[data-split]').forEach(function (el) {
    W.splitLines(el, function (self) {
      return gsap.from(self.lines, {
        yPercent: 108, duration: 1.05, stagger: .08, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
  });

  /* Photos drift against the scroll so a static page still feels alive. */
  gsap.utils.toArray('[data-drift]').forEach(function (img) {
    gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, {
      yPercent: 6, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: .8 }
    });
  });

  /* Counters. Reduced motion prints the final value immediately (above). */
  gsap.utils.toArray('.pk-stats [data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count')),
        dec = parseInt(el.getAttribute('data-decimals') || '0', 10),
        suffix = el.getAttribute('data-suffix') || '',
        obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.9, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: function () {
        el.textContent = obj.v.toLocaleString('en-US',
          { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
      }
    });
  });
});
/* Reduced motion never runs the counter tween, so paint the finals up front. */
(function () {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.pk-stats [data-count]').forEach(function (el) {
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    el.textContent = parseFloat(el.getAttribute('data-count'))
      .toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      + (el.getAttribute('data-suffix') || '');
  });
})();

/* ===== sections/ch-arrival.js ===== */
/* =============================================================================
   SECTION: ch-arrival
   Registered against .ch-arrival; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-arrival", function (W) {
  var root = document.getElementById('arrival');
  var reveal = root.querySelectorAll('[data-anim="hide"]');
  /* Resolved by CLASS with an id fallback, and every use guarded. Instatic's
     HTML importer maps <video> onto its own Video module, which has no
     htmlAttributes escape hatch, so the `id` is dropped on import: the film
     came through fine but `getElementById` returned null and the first
     onEnter threw, taking the rest of the chapter's ScrollTriggers with it.
     A class is data the importer keeps, so this survives the trip. */
  var film = root.querySelector('.ar-film') || document.getElementById('heroFilm');
  gsap.set(reveal,{visibility:'visible'});

  /* Reduced motion keeps the poster frame — a looping background film is
     exactly the kind of motion that setting asks us to stop. */
  if(W.reduced){ gsap.set(reveal,{opacity:1,y:0}); return; }

  /* Plays only while the chapter is on screen: no background decode, and no
     battery burned on a video nobody is looking at. */
  ScrollTrigger.create({
    trigger:root, start:'top bottom', end:'bottom top',
    onEnter:    function(){ if(!film) return; var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
    onEnterBack:function(){ if(!film) return; var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
    onLeave:    function(){ if(film) film.pause(); },
    onLeaveBack:function(){ if(film) film.pause(); }
  });

  /* Entrance — headline splits into masked lines and rises. */
  var tl = gsap.timeline({delay:.15});
  var split = W.splitLines(document.getElementById('heroTitle'));
  if(split && split.lines && split.lines.length){
    gsap.set(split.lines,{yPercent:110});
    tl.to(split.lines,{yPercent:0,duration:1.15,stagger:.09,ease:'power4.out'},0);
  }else{
    tl.from('#heroTitle',{opacity:0,y:40,duration:1,ease:'power3.out'},0);
  }
  tl.from(root.querySelector('.chapter-tag'),{opacity:0,x:-24,duration:.9,ease:'power3.out'},.05)
    .from('#heroLead',       {opacity:0,y:26,duration:.9,ease:'power3.out'},.55)
    .from(root.querySelector('.ar-actions'),{opacity:0,y:26,duration:.9,ease:'power3.out'},.68)
    .from(root.querySelectorAll('.ar-meta div'),{opacity:0,y:22,duration:.8,stagger:.08,ease:'power3.out'},.78)
    .from(root.querySelector('.ar-cue'),{opacity:0,duration:.8},.9)
    .from(film||'#heroFilm',{opacity:0,scale:1.09,duration:1.7,ease:'power3.out'},0);

  /* Departure — the chapter recedes as you leave it. */
  gsap.timeline({scrollTrigger:{trigger:root,start:'top top',end:'bottom top',scrub:.6}})
    .to(root.querySelector('.ar-in'),{yPercent:-16,opacity:.15,ease:'none'},0)
    .to(film||'#heroFilm',{yPercent:5,scale:1.1,ease:'none'},0)
    .to('#heroVeil',{opacity:.55,ease:'none'},0);

  /* Scroll cue nudges until the visitor moves. */
  gsap.to(root.querySelector('.ar-cue i'),{scaleY:.3,transformOrigin:'top',duration:1.1,
    repeat:-1,yoyo:true,ease:'power1.inOut'});
});

/* ===== sections/ch-difference.js ===== */
/* =============================================================================
   SECTION: ch-difference
   Registered against .ch-difference; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-difference", function (W) {
  var root = document.getElementById('difference');

  /* Counters */
  root.querySelectorAll('[data-count]').forEach(function(el){
    var target = parseFloat(el.getAttribute('data-count')),
        dec    = parseInt(el.getAttribute('data-decimals')||'0',10),
        suf    = el.getAttribute('data-suffix')||'';
    function paint(v){
      el.textContent = (dec ? v.toFixed(dec) : Math.floor(v).toLocaleString('en-US')) + suf;
    }
    if(W.reduced){ paint(target); return; }
    var o = {v:0};
    gsap.to(o,{v:target,duration:1.9,ease:'power2.out',onUpdate:function(){ paint(o.v); },
      scrollTrigger:{trigger:el,start:'top 88%'}});
  });

  if(W.reduced) return;

  gsap.fromTo(root.querySelectorAll('.df-stat'),
    {opacity:0,y:26},
    {opacity:1,y:0,duration:.9,stagger:.1,ease:'power3.out',
     scrollTrigger:{trigger:'#diffStats',start:'top 85%'}});

  /* Marquee: loops continuously, and scroll velocity bends its speed and
     direction — the page feels physically connected to the wheel. */
  var row = document.getElementById('mqRow');
  row.innerHTML += row.innerHTML;                       // seamless loop needs a duplicate
  var half = row.scrollWidth / 2;
  var loop = gsap.to(row,{x:-half,duration:26,ease:'none',repeat:-1,
    modifiers:{x:function(x){ return (parseFloat(x) % half) + 'px'; }}});

  var vt = gsap.quickTo(loop,'timeScale',{duration:.5,ease:'power2'});
  ScrollTrigger.create({
    onUpdate:function(self){
      var v = self.getVelocity()/380;
      vt(gsap.utils.clamp(-7, 7, v === 0 ? 1 : (v < 0 ? Math.min(-1,v) : Math.max(1,v))));
    }
  });
  /* Settle back to a gentle drift when scrolling stops. */
  ScrollTrigger.addEventListener('scrollEnd', function(){ vt(1); });

  /* Comparison table: header first, then rows deal in from the left. */
  gsap.from('#versus .vs-head > *',{opacity:0,y:24,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#versus',start:'top 78%'}});
  gsap.from('#versus .vs-row',{opacity:0,x:-34,duration:.85,stagger:.1,ease:'power3.out',
    scrollTrigger:{trigger:'#versus .vs-table',start:'top 82%'}});
});

/* ===== sections/ch-invitation.js ===== */
/* =============================================================================
   SECTION: ch-invitation
   Registered against .ch-invitation; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-invitation", function (W) {
  if(W.reduced) return;
  gsap.from('#locs .iv-loc',{opacity:0,y:34,duration:1,stagger:.14,ease:'power3.out',
    scrollTrigger:{trigger:'#locs',start:'top 82%'}});
  W.splitLines(document.getElementById('ctaTitle'), function(self){
    return gsap.from(self.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
      scrollTrigger:{trigger:'#ctaTitle',start:'top 85%'}});
  });
});

/* ===== sections/ch-path.js ===== */
/* =============================================================================
   SECTION: ch-path
   Registered against .ch-path; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-path", function (W) {
  var pin   = document.getElementById('pathPin'),
      track = document.getElementById('pathTrack'),
      bar   = document.getElementById('pathBar');

  if(W.reduced){
    /* Fall back to a normal horizontal scroll region. */
    pin.style.height = 'auto';
    track.style.overflowX = 'auto';
    track.style.width = '100%';
    return;
  }

  /* Horizontal travel = track width beyond the viewport. Recomputed on
     refresh so it stays correct across resize and font loading. */
  function distance(){ return Math.max(0, track.scrollWidth - window.innerWidth + 40); }

  var tween = gsap.to(track,{
    x: function(){ return -distance(); },
    ease:'none',
    scrollTrigger:{
      trigger: pin,
      start:'top top',
      end: function(){ return '+=' + (distance() + window.innerHeight*0.6); },
      pin: true,
      scrub: .3,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function(self){ gsap.set(bar,{scaleX:self.progress}); }
    }
  });

  /* Each card lights its underline as it reaches centre stage. */
  gsap.utils.toArray('#pathTrack .pa-card').forEach(function(card){
    gsap.to(card,{'--x':1,duration:.1});
    ScrollTrigger.create({
      trigger: card,
      containerAnimation: tween,
      start: 'left 72%',
      end: 'right 28%',
      onEnter:      function(){ gsap.to(card,{borderColor:'rgba(138,126,78,.55)',duration:.5});
                                gsap.to(card.querySelector('.pa-shot img'),{filter:'grayscale(0)',duration:.6}); },
      onLeave:      function(){ gsap.to(card,{borderColor:'rgba(20,20,22,.13)',duration:.5}); },
      onEnterBack:  function(){ gsap.to(card,{borderColor:'rgba(138,126,78,.55)',duration:.5}); },
      onLeaveBack:  function(){ gsap.to(card,{borderColor:'rgba(20,20,22,.13)',duration:.5});
                                gsap.to(card.querySelector('.pa-shot img'),{filter:'grayscale(1)',duration:.6}); }
    });
    gsap.fromTo(card.querySelector('.pa-no'),{opacity:.35},{opacity:1,duration:.4,
      scrollTrigger:{trigger:card,containerAnimation:tween,start:'left 78%',toggleActions:'play none none reverse'}});
  });
});

/* ===== sections/ch-proof.js ===== */
/* =============================================================================
   SECTION: ch-proof
   Registered against .ch-proof; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-proof", function (W) {
  /* Resolved by CLASS with an id fallback, and every use guarded. Instatic's
     HTML importer maps <video> onto its own Video module, which has no
     htmlAttributes escape hatch, so the `id` is dropped on import: the film
     came through fine but `getElementById` returned null and the first
     onEnter threw, taking the rest of the chapter's ScrollTriggers with it.
     A class is data the importer keeps, so this survives the trip. */
  var film = document.querySelector('.pf-film video') || document.getElementById('film');

  /* Play only while on screen — saves battery and avoids background decode. */
  ScrollTrigger.create({
    trigger:'#proofFilm', start:'top 90%', end:'bottom 10%',
    onEnter:    function(){ if(!film) return; var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
    onEnterBack:function(){ if(!film) return; var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
    onLeave:    function(){ if(film) film.pause(); },
    onLeaveBack:function(){ if(film) film.pause(); }
  });

  if(W.reduced){ gsap.set('#storyShot',{clipPath:'inset(0 0 0% 0)'}); return; }

  if(film) gsap.fromTo(film,{scale:1.18},{scale:1.04,ease:'none',
    scrollTrigger:{trigger:'#proofFilm',start:'top bottom',end:'bottom top',scrub:.8}});

  W.splitLines(document.getElementById('filmTitle'), function(self){
    return gsap.from(self.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
      scrollTrigger:{trigger:'#proofFilm',start:'top 55%'}});
  });
  gsap.from('#filmSub',{opacity:0,y:20,duration:.9,ease:'power3.out',
    scrollTrigger:{trigger:'#proofFilm',start:'top 50%'}});

  /* Image wipes open from the bottom, photo counter-drifts inside it. */
  gsap.to('#storyShot',{clipPath:'inset(0 0 0% 0)',duration:1.3,ease:'power4.inOut',
    scrollTrigger:{trigger:'#storyShot',start:'top 82%'}});
  gsap.fromTo('#storyImg',{scale:1.24,yPercent:-6},{scale:1.06,yPercent:6,ease:'none',
    scrollTrigger:{trigger:'#storyShot',start:'top bottom',end:'bottom top',scrub:.8}});
  gsap.from('#storyCopy > *',{opacity:0,y:26,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#storyCopy',start:'top 80%'}});

  /* Reviews: header, then cards deal in on a slight diagonal. */
  gsap.from('#reviews .rv-head > *',{opacity:0,y:24,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#reviews',start:'top 80%'}});
  /* The review wall is generated markup as of 2026-08-19, so it gets the kit's
     own stagger back. [data-rv="stagger"] on .rv-wall drives it; nothing needed
     here beyond letting that rule find it. */

  /* --- upgrade the cards to the LIVE feed, where the host permits it ---
     The client wants reviews that update the moment a patient leaves one, and
     the vendor's script + iframe do exactly that. They cannot run everywhere:
     Instatic assembles each page's CSP from module contributions, and
     base/video is the only module in its codebase that declares any, so
     frame-src ever only names YouTube and both the frame and the vendor script
     are refused there. Rather than pick one platform and lose on the other,
     the generated cards ship as the content and this quietly swaps in the live
     widget wherever it actually loads.

     Success is judged on the vendor's own postMessage, not on the iframe's
     load event: a blocked frame still fires load (about:blank), so trusting
     that would leave an empty well exactly where the reviews should be. If no
     height arrives, everything added here is removed and the cards stay. */
  (function () {
    var slot = document.querySelector('.rv-live');
    var wall = document.querySelector('.rv-wall');
    if (!slot || !slot.dataset.widget) return;

    var widgetId = (slot.dataset.widget.match(/[?&]widgetId=([^&]+)/) || [])[1];
    var settled = false;

    var f = document.createElement('iframe');
    f.className = 'lc_reviews_widget';
    f.title = 'Patient reviews';
    f.src = slot.dataset.widget;
    f.setAttribute('frameborder', '0');
    f.setAttribute('scrolling', 'no');
    f.style.cssText = 'min-width:100%;width:100%';
    slot.appendChild(f);

    function accept() {
      if (settled) return;
      settled = true;
      slot.removeAttribute('data-probing');
      if (wall) wall.hidden = true;      /* keep it in the DOM: it is the copy
                                            a crawler without JS will read. */
    }
    function reject() {
      if (settled) return;
      settled = true;
      slot.remove();
    }

    window.addEventListener('message', function (e) {
      if (!/reputationhub\.site$/.test(new URL(e.origin).hostname)) return;
      var name = e.data && e.data[0], data = e.data && e.data[1];
      if (name !== 'lc.setHeight') return;
      if (widgetId && data && data.widgetId && data.widgetId !== widgetId) return;
      accept();
    });

    var sc = document.createElement('script');
    sc.src = 'https://reputationhub.site/reputation/assets/review-widget.js';
    sc.async = true;
    sc.onerror = reject;
    document.body.appendChild(sc);

    /* The widget renders server-side and reports within a second or two on a
       normal connection. Eight is generous, and the cost of being wrong is
       only that the visitor keeps the static cards. */
    setTimeout(reject, 8000);
  })();

  /* Aggregate score counts up like the other stats. The target is READ FROM THE
     MARKUP rather than written here as well. It was hardcoded to 5.0, so when
     the client corrected the rating the counter silently animated the new number
     straight back to the old one and the page showed 5.0 whatever the HTML
     said. One number, one home. */
  var sc = document.getElementById('rvScore');
  if(sc){
    var target = parseFloat(sc.textContent);
    if(!isNaN(target)){
      var o = {v:0};
      gsap.to(o,{v:target,duration:1.6,ease:'power2.out',
        onUpdate:function(){ sc.textContent = o.v.toFixed(1); },
        scrollTrigger:{trigger:'#reviews',start:'top 78%'}});
    }
  }
});

/* ===== sections/ch-reality.js ===== */
/* =============================================================================
   SECTION: ch-reality
   Registered against .ch-reality; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-reality", function (W) {
  var root = document.getElementById('reality');
  var big  = document.getElementById('realityBig');

  if(W.reduced) return;

  /* Words brighten one by one, tied to scroll position. */
  var sp = W.splitWords(big);
  if(sp && sp.words && sp.words.length){
    /* The final clause is excluded here and owned by the gold tween below.
       Two scrubbed tweens writing the same property on the same element,
       over overlapping scroll ranges, flicker — they overwrite each other
       every frame. One word, one owner. */
    var tail = sp.words.slice(-7);
    var body = sp.words.slice(0, -7);
    gsap.to(body,{
      color:'#141416', stagger:.4, ease:'none',
      scrollTrigger:{trigger:root,start:'top 62%',end:'center 42%',scrub:.5}
    });
    gsap.to(tail,{color:'#8A7E4E',ease:'none',stagger:.3,
      scrollTrigger:{trigger:root,start:'center 52%',end:'bottom 62%',scrub:.5}});
  }

  gsap.from('#realityAfter p',{opacity:0,y:28,duration:.9,stagger:.14,ease:'power3.out',
    scrollTrigger:{trigger:'#realityAfter',start:'top 82%'}});

  /* Case photo drifts and un-crops as the chapter passes. */
  /* Scale stays above 1 + drift so the photo always overfills its frame. */
  gsap.fromTo('#realityImg',{yPercent:-6,scale:1.2},{yPercent:6,scale:1.14,ease:'none',
    scrollTrigger:{trigger:root,start:'top bottom',end:'bottom top',scrub:.8}});
});

/* ===== sections/ch-specialist.js ===== */
/* =============================================================================
   SECTION: ch-specialist
   Registered against .ch-specialist; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-specialist", function (W) {
  if(W.reduced) return;

  W.splitLines(document.getElementById('specTitle'), function(self){
    return gsap.from(self.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
      scrollTrigger:{trigger:'#specTitle',start:'top 84%'}});
  });
  gsap.from('#specBio p',{opacity:0,y:26,duration:.9,stagger:.13,ease:'power3.out',
    scrollTrigger:{trigger:'#specBio',start:'top 82%'}});

  /* Credentials deal in one line at a time — the length of the list is the point. */
  gsap.from('#credList li',{opacity:0,x:-22,duration:.6,stagger:.07,ease:'power2.out',
    scrollTrigger:{trigger:'#credList',start:'top 85%'}});

  /* Portrait rises slightly out of its plate as the chapter passes. */
  gsap.fromTo('#specPortrait',{xPercent:-50,yPercent:6},{xPercent:-50,yPercent:-4,ease:'none',
    scrollTrigger:{trigger:'#specialist',start:'top bottom',end:'bottom top',scrub:.8}});
});

/* ===== sections/ch-standard.js ===== */
/* =============================================================================
   SECTION: ch-standard
   Registered against .ch-standard; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-standard", function (W) {
  if(W.reduced) return;

  gsap.from('#standard .std-head > *',{opacity:0,y:26,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#standard .std-head',start:'top 82%'}});

  /* Panels rise and un-mask; each image also drifts against the scroll. */
  gsap.utils.toArray('#stdGrid .std-card').forEach(function(card,i){
    gsap.fromTo(card,
      {opacity:0,y:44,clipPath:'inset(12% 0 0 0)'},
      {opacity:1,y:0,clipPath:'inset(0% 0 0 0)',duration:1.05,ease:'power3.out',delay:i*.07,
       scrollTrigger:{trigger:card,start:'top 88%'}});
    gsap.fromTo(card.querySelector('img'),{yPercent:-5},{yPercent:5,ease:'none',
      scrollTrigger:{trigger:card,start:'top bottom',end:'bottom top',scrub:.8}});
  });
});

/* ===== sections/ch-transformation.js ===== */
/* =============================================================================
   SECTION: ch-transformation
   Registered against .ch-transformation; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-transformation", function (W) {
  var root  = document.getElementById('transformation'),
      pin   = document.getElementById('tPin'),
      cmp   = document.getElementById('cmp'),
      cap   = document.getElementById('tCaption'),
      dots  = document.getElementById('tDots').children,
      slides= cmp.querySelectorAll('.tf-slide'),
      handle= document.getElementById('tHandle');

  var CAPTIONS = [
    'Porcelain veneers with implant restoration · upper and lower arch',
    'Double-arch All-on-4 · full fixed teeth on four implants per arch',
    'Single-arch All-on-4 · upper arch restored on four implants'
  ];

  function show(i){
    for(var s=0;s<slides.length;s++) slides[s].classList.toggle('is-on', s===i);
    for(var d=0;d<dots.length;d++) dots[d].classList.toggle('is-on', d===i);
    cap.innerHTML = CAPTIONS[i];
  }
  function setPos(p){ cmp.style.setProperty('--pos', p + '%'); }

  if(W.reduced){
    /* Show the finished result rather than an un-wiped "before". */
    setPos(0); show(0);
    cmp.style.setProperty('--pos','0%');
    return;
  }

  setPos(100); // start fully on "before"; scrubbing wipes toward "after"
  gsap.set(handle,{opacity:1});

  /* Pin the chapter and drive three wipes from one scroll distance.
     Each case gets a wipe, then hands over to the next. */
  var state = {p:100, idx:0};
  var tl = gsap.timeline({
    scrollTrigger:{
      trigger: pin,
      start: 'top top',
      end: '+=' + (window.innerHeight * 3.2),
      pin: true,
      scrub: .3,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  for(var i=0;i<3;i++){
    (function(idx){
      tl.call(function(){ if(state.idx!==idx){ state.idx=idx; show(idx); } }, null, tl.duration())
        .fromTo(state,{p:100},{p:0,duration:1,ease:'none',
          onUpdate:function(){ setPos(state.p); }})
        .to({},{duration:.22});   // a beat to read the result before moving on
    })(i);
  }
  /* Reverse scrolling needs the slide index restored too. */
  tl.eventCallback('onUpdate', function(){
    var seg = Math.min(2, Math.floor(tl.progress() * 3));
    if(state.idx !== seg){ state.idx = seg; show(seg); }
  });

  gsap.from(root.querySelectorAll('.tf-head > *'),{opacity:0,y:24,duration:.9,stagger:.1,
    ease:'power3.out',scrollTrigger:{trigger:root,start:'top 70%'}});
});

/* ===== sections/gallery-filter.js ===== */
/* =============================================================================
   SECTION: gallery-filter
   Registered against #gaGrid; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
/* Filtering is plain DOM work — it must keep working with GSAP absent, so this
   module uses WZ.dom, which runs immediately instead of queueing. It still goes
   through WZ.section so the registry knows about it and the gates can tell
   "this section is not on the page" apart from "this section is broken". */
WZ.dom('gallery-filter', '#gaGrid', function () {
  var bar = document.getElementById('gaFilters'),
      grid = document.getElementById('gaGrid');
  if (!bar || !grid) return;
  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    var cat = btn.getAttribute('data-cat');
    bar.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b === btn));
    });
    grid.querySelectorAll('.ga-item').forEach(function (item) {
      item.hidden = !(cat === 'all' || item.getAttribute('data-cat') === cat);
    });
    /* Pinned/scrubbed triggers elsewhere on the page measured the old height. */
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
});

/* ===== sections/video-library.js ===== */
/* =============================================================================
   SECTION: video-library
   Registered against .vl-grid, so it only runs on the page that has one, and
   registered with WZ.dom rather than WZ.section: the queue is only flushed once
   ScrollSmoother exists, so if GSAP ever fails to load a QUEUED click handler
   would never attach and every film on the page would be dead. Playing a video
   is not decoration.

   Click-to-play: the card is a facade (YouTube thumbnail + play button) until
   someone asks for the film, then it is replaced in place by a real iframe with
   autoplay=1. Fourteen eager embeds would cost about a megabyte and fourteen
   third-party connections before anyone watches anything.

   The swap is one-way and the node is replaced, so a second click cannot stack
   two players, and there is nothing to tear down on the way out.
   ============================================================================= */
WZ.dom("vl-grid", function () {
  var grid = document.querySelector('.vl-grid');
  if (!grid) return;

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.vl-card');
    if (!card || !grid.contains(card)) return;
    var id = card.getAttribute('data-yt');
    if (!id) return;

    var shot = card.querySelector('.vl-shot');
    var frame = document.createElement('div');
    frame.className = 'vl-frame';
    var f = document.createElement('iframe');
    /* autoplay only because this IS the click that asked for it. */
    f.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
    f.title = card.querySelector('.vl-title').textContent.trim();
    f.setAttribute('allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    f.setAttribute('allowfullscreen', '');
    frame.appendChild(f);

    /* The <button> becomes a plain container: a button that now holds a video
       player is no longer a button, and leaving it as one strands a screen
       reader on a control that does nothing. */
    var open = document.createElement('div');
    open.className = 'vl-card';
    open.appendChild(frame);
    open.appendChild(card.querySelector('.vl-title'));
    card.replaceWith(open);
    if (shot) shot.remove();
  });
});

/* ===== js/90-boot.js ===== */
/* ==========================================================================
   FLUSH — smoother first, then every section's queued setup, then refresh.
   ========================================================================== */
(function(){
  var W = window.WZ;
  document.documentElement.classList.add('wz-ready');

  if(!W || !W.ok){
    /* GSAP missing: reveal everything so the page is still readable. */
    document.querySelectorAll('[data-anim="hide"]').forEach(function(el){ el.style.visibility='visible'; });
    return;
  }

  /* Register here, not in <head> — body must exist before ScrollTrigger inits. */
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  if(window.ScrollSmoother) gsap.registerPlugin(ScrollSmoother);
  if(window.SplitText)      gsap.registerPlugin(SplitText);
  if(window.Observer)       gsap.registerPlugin(Observer);

  if(!W.reduced && window.ScrollSmoother){
    try{
      W.smoother = ScrollSmoother.create({
        wrapper:'#smooth-wrapper', content:'#smooth-content',
        /* THE DIAL FOR "how smooth does the page feel". Higher = longer glide
           after the wheel stops, which is the effect itself:
             .8 -> the page eases for ~750ms
            1.2 -> ~1050ms  (here)
            1.4 -> ~2400ms, which starts to feel like the page is arguing
           This is only half the story. Every scrubbed trigger adds a SECOND
           lag on top, and it is that one — not this one — that reads as
           broken: at smooth 1.05 with scrub .7 the pinned chapters trailed
           the page by ~1.4s. With the pins at scrub .3 they now trail it by
           roughly 0ms, so the glide can be generous without the animation
           appearing to lag behind the scroll. Raise this, not the scrubs. */
        smooth: 1.2, effects: false, smoothTouch: false,
        /* normalizeScroll is deliberately OFF. It was tried: it makes no
           measurable difference to the pinned scrubs (257ms vs 273ms to
           settle) and it swallows touchmove, so on a phone a before/after
           slider jumps to the tap point instead of following the finger.
           Handing those elements back with `ignore` fixes the drag and
           then traps the page: a vertical swipe starting on a slider
           scrolls 0px instead of 535px. Not worth it. */
        normalizeScroll: false, ignoreMobileResize: true
      });
    }catch(e){ console.warn('ScrollSmoother unavailable', e); }
  }

  W.flush();

  /* --- nav state: reading progress + chapter readout (global UI) --- */
  var navCh  = document.getElementById('navCh'),
      navNm  = document.getElementById('navName'),
      navBar = document.getElementById('navBar'),
      navPr  = document.getElementById('navProgress'),
      nav    = document.getElementById('nav');

  /* Whole-page reading progress along the top edge of the nav. */
  gsap.to(navPr,{scaleX:1,ease:'none',
    scrollTrigger:{start:0,end:'max',scrub:.25}});

  gsap.utils.toArray('section[data-chapter]').forEach(function(sec){
    var i = parseInt(sec.getAttribute('data-chapter'),10),
        name = sec.getAttribute('data-chapter-name');
    function activate(){
      if(navCh) navCh.textContent = String(i).padStart(2,'0');
      if(navNm) navNm.textContent = name;
      if(navBar) navBar.style.setProperty('--p', (i/8).toFixed(3));
    }
    ScrollTrigger.create({trigger:sec,start:'top 55%',end:'bottom 45%',
      onEnter:activate,onEnterBack:activate});
  });

  ScrollTrigger.create({start:40,end:99999,
    onToggle:function(self){ nav.classList.toggle('is-solid', self.isActive); }});

  /* --- anchors routed through the smoother so pinned sections land right --- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if(id.length < 2) return;
      var t = document.querySelector(id);
      if(!t) return;
      e.preventDefault();
      if(W.smoother) W.smoother.scrollTo(t, true, 'top top');
      else gsap.to(window,{duration: W.reduced?0:1, scrollTo:{y:t,autoKill:true},ease:'power2.inOut'});
    });
  });

  /* --- magnetic buttons, pointer-fine only --- */
  if(!W.reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.querySelectorAll('.magnetic').forEach(function(el){
      var xTo = gsap.quickTo(el,'x',{duration:.5,ease:'power3'}),
          yTo = gsap.quickTo(el,'y',{duration:.5,ease:'power3'});
      el.addEventListener('pointermove',function(e){
        var r = el.getBoundingClientRect();
        xTo((e.clientX-r.left-r.width/2)*.22); yTo((e.clientY-r.top-r.height/2)*.38);
      });
      el.addEventListener('pointerleave',function(){ xTo(0); yTo(0); });
    });
  }

  /* --- re-hydrate what HTML importers strip ---
     Instatic's importer drops elements it considers empty and unwraps the only
     child of anything it maps onto a Button or Link module. Two live casualties:
     the burger's two <span> bars (so the menu button rendered as a blank 44px
     square on every page) and the <span> inside every .btn (which carries
     `position:relative;z-index:1`, i.e. the label's guarantee of sitting above
     the hover fill). Both are structure the CSS needs and neither survives a
     round trip, so they are rebuilt here rather than hand-patched per platform.
     A no-op wherever the markup arrived intact. */
  document.querySelectorAll('.burger').forEach(function(b){
    if(b.querySelector('span')) return;
    b.appendChild(document.createElement('span'));
    b.appendChild(document.createElement('span'));
  });
  document.querySelectorAll('.btn').forEach(function(b){
    if(b.querySelector('span') || !b.firstChild) return;
    var t = b.textContent.trim();
    if(!t) return;
    var sp = document.createElement('span'); sp.textContent = t;
    b.textContent = ''; b.appendChild(sp);
  });
  /* The filter chips read "All cases 54"; the count is a <b> so it can sit back
     at 78% opacity. Buttons are flattened to plain text on import, so the
     trailing digits are split back out here. */
  document.querySelectorAll('.ga-filters button').forEach(function(btn){
    if(btn.querySelector('b')) return;
    var m = /^(.*?)(\d+)$/.exec(btn.textContent.trim());
    if(!m) return;
    btn.textContent = m[1].trim();
    var b = document.createElement('b'); b.textContent = m[2];
    btn.appendChild(b);
  });

  /* --- mobile drawer --- */
  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer');
  function closeDrawer(){
    burger.classList.remove('is-open'); drawer.classList.remove('is-open');
    document.getElementById('nav').classList.remove('is-menu-open');
    burger.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true');
    document.body.classList.remove('is-locked');
    if(W.smoother) W.smoother.paused(false);
  }
  burger.addEventListener('click',function(){
    var open = drawer.classList.toggle('is-open');
    burger.classList.toggle('is-open',open);
    document.getElementById('nav').classList.toggle('is-menu-open',open);
    burger.setAttribute('aria-expanded',String(open));
    drawer.setAttribute('aria-hidden',String(!open));
    burger.setAttribute('aria-label', open?'Close menu':'Open menu');
    document.body.classList.toggle('is-locked',open);
    if(W.smoother) W.smoother.paused(open);
  });
  drawer.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click',function(){ closeDrawer(); });
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  /* Pinned sections measure wrong if fonts or images land late. */
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();

/* ===== js/91-descender-rescue.js ===== */
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
