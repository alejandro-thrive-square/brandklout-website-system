(() => {
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
        smooth: 1.05, effects: false, smoothTouch: false, normalizeScroll: false
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
    onToggle:function(self){ nav.classList.toggle('solid', self.isActive); }});

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

  /* --- mobile drawer --- */
  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer');
  function closeDrawer(){
    burger.classList.remove('open'); drawer.classList.remove('open');
    burger.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true');
    document.body.classList.remove('is-locked');
    if(W.smoother) W.smoother.paused(false);
  }
  burger.addEventListener('click',function(){
    var open = drawer.classList.toggle('open');
    burger.classList.toggle('open',open);
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
    if(e.key==='Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  /* Pinned sections measure wrong if fonts or images land late. */
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
})();
