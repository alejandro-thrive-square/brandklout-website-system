/* ==========================================================================
   FLUSH — smoother first, then every section's queued setup, then refresh.
   ========================================================================== */
(function(){
  var W = window.WZ;
  document.documentElement.classList.add('wz-ready');

  /* Pointer capability as a class, so CSS can branch on it without a media
     query. Instatic stores a non-viewport media query as a custom condition
     ordered by raw array position, which is a cascade trap; a class is not.
     Set before flush() so a section's setup sees it. */
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.documentElement.classList.add('wz-fine');
  }

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

  /* THE SMOOTHER IS DESKTOP-ONLY, and this is the mobile flicker fix.

     ScrollTrigger has two ways to pin. With NO smoother it uses native
     `position:fixed` and the browser holds the chapter still for free. With a
     smoother present it switches to `pinType:'transform'`, because fixed
     positioning cannot be trusted inside a smoothed container -- and then the
     pinned element's `translateY` has to be rewritten from JS on every single
     scroll update. Measured on the two live builds at the same scroll depth,
     mid-pin:

       Webflow  (no smoother)  #tPin  position:fixed   transform: identity
       Instatic (smoother on)  #tPin  position:static  transform: translateY(1350.5px)

     On a phone that per-frame write lands late whenever the main thread is
     busy, and the pinned chapter drifts against the finger. That is what the
     client has been reporting as flicker on Chapters 04 and 05.

     The Webflow build is smooth by accident, not by configuration: its
     `#smooth-wrapper` never survived the conversion, so `create()` is skipped
     and the page scrolls natively. `smoothTouch:false` does NOT get us there --
     it only disables the EASING on touch; the smoother is still instantiated,
     and its mere existence is what flips the pin strategy.

     Touch is the condition, not width -- same reasoning as sections/ch-path.js.
     A narrow desktop window keeps the smoother; a large tablet does not. */
  var TOUCH = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

  if(!W.reduced && !TOUCH && window.ScrollSmoother && document.getElementById('smooth-wrapper')){
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
      /* `#smooth-wrapper{overflow:hidden}` is scoped to this class. Without a
         smoother the wrapper must NOT clip, or the page cannot scroll at all —
         which is exactly what happened when this was A/B tested by stubbing the
         plugin alone: two runs travelled 0px and reported a flattering 16.7ms
         for a stationary page. Set only on success, never optimistically. */
      document.documentElement.classList.add('wz-smooth');
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

  var CHAPTERS = gsap.utils.toArray('section[data-chapter]');
  var LAST = CHAPTERS.reduce(function(m, s){
    return Math.max(m, parseInt(s.getAttribute('data-chapter'), 10) || 0);
  }, 1);
  CHAPTERS.forEach(function(sec){
    var i = parseInt(sec.getAttribute('data-chapter'),10),
        name = sec.getAttribute('data-chapter-name');
    function activate(){
      if(navCh) navCh.textContent = String(i).padStart(2,'0');
      if(navNm) navNm.textContent = name;
      /* Divisor is the LAST chapter index, not a constant: Chapter 07 (The
         Services) was added on 2026-08-26 and Proof/Invitation shifted to 08
         and 09, so a hardcoded 8 would have driven the nav progress bar past
         100% on the final two sections. Derived so the next insertion cannot
         reintroduce the bug. */
      if(navBar) navBar.style.setProperty('--p', (i/LAST).toFixed(3));
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
  /* Both halves have to be present. The Instatic post template shipped with a
     .burger and no #drawer, so `drawer.querySelectorAll` threw on all 43 blog
     posts -- taking the Escape handler and both ScrollTrigger.refresh() calls
     below it down with it, on top of a menu button that did nothing. Skip the
     block instead, and leave the rest of boot to run. */
  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer');
  if (!burger || !drawer) { if (burger) burger.hidden = true; return finishBoot(); }
  function closeDrawer(){
    burger.classList.remove('is-open'); drawer.classList.remove('is-open');
    document.getElementById('nav').classList.remove('is-menu-open');
    burger.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true'); drawer.inert = true;
    document.body.classList.remove('is-locked');
    if(W.smoother) W.smoother.paused(false);
  }
  burger.addEventListener('click',function(){
    var open = drawer.classList.toggle('is-open');
    burger.classList.toggle('is-open',open);
    document.getElementById('nav').classList.toggle('is-menu-open',open);
    burger.setAttribute('aria-expanded',String(open));
    drawer.setAttribute('aria-hidden',String(!open)); drawer.inert = !open;
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

  finishBoot();

  /* Pinned sections measure wrong if fonts or images land late. This is a
     declaration, so it is hoisted and reachable from the early return above. */
  function finishBoot(){
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
    window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
  }
})();
