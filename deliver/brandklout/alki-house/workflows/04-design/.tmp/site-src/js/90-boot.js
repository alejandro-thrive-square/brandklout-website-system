/* ==========================================================================
   BOOT — register plugins, create the smoother, flush every chapter, then
   wire the global UI: reading progress, chapter readout, magnetic buttons,
   drawer, anchors.
   ========================================================================== */
(function(){
  var W = window.WZ;
  document.documentElement.classList.add('wz-ready');

  if(!W || !W.ok){
    document.querySelectorAll('[data-anim="hide"]').forEach(function(el){ el.style.visibility='visible'; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  if(window.ScrollSmoother) gsap.registerPlugin(ScrollSmoother);
  if(window.SplitText)      gsap.registerPlugin(SplitText);
  if(window.Observer)       gsap.registerPlugin(Observer);
  if(window.Draggable)      gsap.registerPlugin(Draggable);
  if(window.InertiaPlugin)  gsap.registerPlugin(InertiaPlugin);

  if(!W.reduced && window.ScrollSmoother){
    try{
      W.smoother = ScrollSmoother.create({
        wrapper:'#smooth-wrapper', content:'#smooth-content',
        smooth:1.15, effects:true, smoothTouch:false, normalizeScroll:false, ignoreMobileResize:true
      });
    }catch(e){ console.warn('ScrollSmoother unavailable', e); }
  }

  W.flush();

  /* ---- reading progress + chapter readout ---- */
  var navCh = document.getElementById('navCh'), navNm = document.getElementById('navName'),
      navBar = document.getElementById('navBar'), navPr = document.getElementById('navProgress'),
      nav = document.getElementById('nav');
  if(navPr) gsap.to(navPr,{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.25}});
  var chapters = gsap.utils.toArray('section[data-chapter]');
  chapters.forEach(function(sec){
    var i = parseInt(sec.getAttribute('data-chapter'),10), name = sec.getAttribute('data-chapter-name');
    function activate(){
      if(navCh) navCh.textContent = String(i).padStart(2,'0');
      if(navNm) navNm.textContent = name;
      if(navBar) navBar.style.setProperty('--p', (chapters.length>1 ? i/(chapters.length-1) : 1).toFixed(3));
      document.body.setAttribute('data-chapter-theme', sec.getAttribute('data-theme')||'dark');
    }
    ScrollTrigger.create({trigger:sec,start:'top 55%',end:'bottom 45%',onEnter:activate,onEnterBack:activate});
  });
  if(nav) ScrollTrigger.create({start:40,end:99999,onToggle:function(self){ nav.classList.toggle('is-solid', self.isActive); }});

  /* ---- anchors through the smoother so pinned chapters land right ---- */
  document.querySelectorAll('a[href*="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var href = a.getAttribute('href'), hash = href.slice(href.indexOf('#'));
      if(hash.length < 2) return;
      var path = href.slice(0, href.indexOf('#'));
      if(path && path !== location.pathname.split('/').pop()) return;
      var t = document.querySelector(hash);
      if(!t) return;
      e.preventDefault();
      if(W.smoother) W.smoother.scrollTo(t, true, 'top top');
      else gsap.to(window,{duration:W.reduced?0:1,scrollTo:{y:t,autoKill:true},ease:'power2.inOut'});
    });
  });

  /* ---- magnetic buttons, pointer-fine only ---- */
  if(!W.reduced && W.fine){
    document.querySelectorAll('.magnetic').forEach(function(el){
      var xTo = gsap.quickTo(el,'x',{duration:.5,ease:'power3'}), yTo = gsap.quickTo(el,'y',{duration:.5,ease:'power3'});
      el.addEventListener('pointermove',function(e){
        var r = el.getBoundingClientRect();
        xTo((e.clientX-r.left-r.width/2)*.24); yTo((e.clientY-r.top-r.height/2)*.4);
      });
      el.addEventListener('pointerleave',function(){ xTo(0); yTo(0); });
    });
  }

  /* ---- product cards: the second angle slides in on hover ---- */
  if(!W.reduced && W.fine){
    document.querySelectorAll('.pcard').forEach(function(card){
      var alt = card.querySelector('.pcard-alt'), main = card.querySelector('.pcard-main');
      if(!alt || !main) return;
      card.addEventListener('pointerenter',function(){
        gsap.to(alt,{opacity:1,scale:1,duration:.6,ease:'power3.out'});
        gsap.to(main,{scale:1.06,duration:.8,ease:'power3.out'});
      });
      card.addEventListener('pointerleave',function(){
        gsap.to(alt,{opacity:0,scale:1.04,duration:.5,ease:'power3.out'});
        gsap.to(main,{scale:1,duration:.7,ease:'power3.out'});
      });
    });
  }

  /* ---- mobile drawer ---- */
  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer');
  if (!burger || !drawer) { if (burger) burger.hidden = true; return finishBoot(); }
  function closeDrawer(){
    burger.classList.remove('is-open'); drawer.classList.remove('is-open');
    burger.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true');
    document.body.classList.remove('is-locked');
    if(W.smoother) W.smoother.paused(false);
  }
  burger.addEventListener('click',function(){
    var open = drawer.classList.toggle('is-open');
    burger.classList.toggle('is-open',open);
    burger.setAttribute('aria-expanded',String(open)); drawer.setAttribute('aria-hidden',String(!open));
    burger.setAttribute('aria-label', open?'Close menu':'Open menu');
    document.body.classList.toggle('is-locked',open);
    if(W.smoother) W.smoother.paused(open);
  });
  drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape' && drawer.classList.contains('is-open')) closeDrawer(); });

  finishBoot();

  function finishBoot(){
    /* document.fonts.ready resolves before the CSS declaring the faces has
       parsed, so wait on the faces themselves — pinned scenes measure wrong
       if the display face lands late. */
    var faces = ['600 1em "Bricolage Grotesque"','500 1em Manrope','400 1em "JetBrains Mono"'];
    if(document.fonts && document.fonts.load){
      Promise.all(faces.map(function(f){ return document.fonts.load(f).catch(function(){}); })).then(function(){ ScrollTrigger.refresh(); });
    }
    window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
  }
})();
