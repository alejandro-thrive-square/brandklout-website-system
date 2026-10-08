/* ==========================================================================
   BOOT — register plugins (body exists now), create the smoother, flush the
   chapters, then the global UI: progress, chapter readout, nav state,
   anchors, magnetic buttons, cursor, drawer.
   ========================================================================== */
(function(){
  var W = window.WZ;
  document.documentElement.classList.add('wz-ready');
  var FINE = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (FINE) document.documentElement.classList.add('wz-fine');

  /* --- re-hydrate what Instatic's importer strips ---
     base.button flattens children to a label string and Link modules unwrap
     an only child, so the <span> inside every .btn (the label's z-index
     guarantee over the hover fill), the burger's two bars and the FAQ
     toggle's <i> glyph do not survive a round trip. Rebuilt here; a no-op
     wherever the markup arrived intact. Runs before the GSAP gate so the
     page is right even if the motion layer is absent. */
  document.querySelectorAll('.button').forEach(function(b){
    if(b.querySelector('span') || !b.firstChild) return;
    var t = b.textContent.trim(); if(!t) return;
    var sp = document.createElement('span'); sp.textContent = t; b.textContent = ''; b.appendChild(sp);
  });
  document.querySelectorAll('.nav_menu-button').forEach(function(b){
    if(b.querySelector('span')) return;
    b.appendChild(document.createElement('span')); b.appendChild(document.createElement('span'));
  });
  document.querySelectorAll('.faq_question').forEach(function(q){
    if(!q.querySelector('span')){ var t = q.textContent.trim(); q.textContent=''; var s=document.createElement('span'); s.textContent=t; q.appendChild(s); }
    if(!q.querySelector('i')) q.appendChild(document.createElement('i'));
    if(!q.hasAttribute('aria-expanded')) q.setAttribute('aria-expanded','false');
  });
  /* the hero film: one src attribute (importers keep attributes, not <source>
     children); phones get the 960 encode before the first play */
  document.querySelectorAll('video[data-src]').forEach(function(v){
    var mobile = v.getAttribute('data-src-mobile');
    v.src = (mobile && window.innerWidth < 768) ? mobile : v.getAttribute('data-src');
  });

  if(!W || !W.ok){
    document.querySelectorAll('[data-anim="hide"]').forEach(function(el){ el.style.visibility='visible'; });
    document.querySelectorAll('[data-wipe],.transformation_photo,.precision_film').forEach(function(el){ el.style.clipPath='none'; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  if(window.ScrollSmoother) gsap.registerPlugin(ScrollSmoother);
  if(window.SplitText)      gsap.registerPlugin(SplitText);
  if(window.Observer)       gsap.registerPlugin(Observer);

  /* Smoother is desktop-only: with a smoother present ScrollTrigger pins by
     transform and phones drift against the finger. Touch is the condition. */
  var TOUCH = window.matchMedia('(hover:none) and (pointer:coarse)').matches;
  if(!W.reduced && !TOUCH && window.ScrollSmoother && document.getElementById('smooth-wrapper')){
    try{
      W.smoother = ScrollSmoother.create({ wrapper:'#smooth-wrapper', content:'#smooth-content',
        smooth: 1.15, effects: false, smoothTouch: false, normalizeScroll: false, ignoreMobileResize: true });
      document.documentElement.classList.add('wz-smooth');
    }catch(e){ console.warn('ScrollSmoother unavailable', e); }
  }

  W.flush();

  /* reading progress + chapter readout */
  var navCh = document.getElementById('navCh'), navNm = document.getElementById('navName'),
      navBar = document.getElementById('navBar'), navPr = document.getElementById('navProgress'),
      nav = document.getElementById('nav');
  gsap.to(navPr,{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.25}});
  var CHAPTERS = gsap.utils.toArray('section[data-chapter]');
  var LAST = CHAPTERS.reduce(function(m,s){ return Math.max(m, parseInt(s.getAttribute('data-chapter'),10)||0); }, 1);
  CHAPTERS.forEach(function(sec){
    var i = parseInt(sec.getAttribute('data-chapter'),10), name = sec.getAttribute('data-chapter-name');
    function activate(){
      if(navCh) navCh.textContent = String(i).padStart(2,'0');
      if(navNm) navNm.textContent = name;
      if(navBar) navBar.style.setProperty('--p', (i/LAST).toFixed(3));
      nav.classList.toggle('on-light', sec.getAttribute('data-theme') === 'light');
    }
    ScrollTrigger.create({trigger:sec,start:'top 55%',end:'bottom 45%',onEnter:activate,onEnterBack:activate});
    if (i === 0) activate();
  });
  ScrollTrigger.create({start:40,end:99999,onToggle:function(self){ nav.classList.toggle('is-solid', self.isActive); }});

  /* anchors through the smoother */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href'); if(id.length < 2) return;
      var t = document.querySelector(id); if(!t) return;
      e.preventDefault();
      if(W.smoother) W.smoother.scrollTo(t, true, 'top top');
      else gsap.to(window,{duration: W.reduced?0:1, scrollTo:{y:t,autoKill:true},ease:'power2.inOut'});
    });
  });

  /* magnetic buttons + cursor, fine pointers only */
  if(!W.reduced && FINE){
    document.querySelectorAll('.is-magnetic').forEach(function(el){
      var xTo = gsap.quickTo(el,'x',{duration:.5,ease:'power3'}), yTo = gsap.quickTo(el,'y',{duration:.5,ease:'power3'});
      el.addEventListener('pointermove',function(e){
        var r = el.getBoundingClientRect();
        xTo((e.clientX-r.left-r.width/2)*.22); yTo((e.clientY-r.top-r.height/2)*.38);
      });
      el.addEventListener('pointerleave',function(){ xTo(0); yTo(0); });
    });
    var cur = document.getElementById('cursor');
    if(cur){
      var cx = gsap.quickTo(cur,'x',{duration:.25,ease:'power3'}), cy = gsap.quickTo(cur,'y',{duration:.25,ease:'power3'});
      window.addEventListener('pointermove',function(e){ cx(e.clientX); cy(e.clientY); }, {passive:true});
      document.querySelectorAll('a,button,label,.answer_card,.proof_quote').forEach(function(el){
        el.addEventListener('pointerenter',function(){ cur.classList.add('is-link'); });
        el.addEventListener('pointerleave',function(){ cur.classList.remove('is-link'); });
      });
    }
  }

  /* drawer */
  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer');
  if (burger && drawer) {
    function closeDrawer(){
      burger.classList.remove('is-open'); drawer.classList.remove('is-open'); nav.classList.remove('is-menu-open');
      burger.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true');
      document.body.classList.remove('is-locked'); if(W.smoother) W.smoother.paused(false);
    }
    burger.addEventListener('click',function(){
      var open = drawer.classList.toggle('is-open');
      burger.classList.toggle('is-open',open); nav.classList.toggle('is-menu-open',open);
      burger.setAttribute('aria-expanded',String(open)); drawer.setAttribute('aria-hidden',String(!open));
      burger.setAttribute('aria-label', open?'Close menu':'Open menu');
      document.body.classList.toggle('is-locked',open); if(W.smoother) W.smoother.paused(open);
    });
    drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeDrawer); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape' && drawer.classList.contains('is-open')) closeDrawer(); });
  }

  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
