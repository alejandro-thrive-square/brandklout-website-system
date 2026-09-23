WZ.add(function(W){
    var root = document.getElementById('arrival');
    var reveal = root.querySelectorAll('[data-anim="hide"]');
    gsap.set(reveal,{visibility:'visible'});

    if(W.reduced){ gsap.set(reveal,{opacity:1,y:0}); return; }

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
      .from(root.querySelector('.actions'),{opacity:0,y:26,duration:.9,ease:'power3.out'},.68)
      .from(root.querySelectorAll('.meta div'),{opacity:0,y:22,duration:.8,stagger:.08,ease:'power3.out'},.78)
      .from(root.querySelector('.cue'),{opacity:0,duration:.8},.9)
      .from('#portrait',{opacity:0,scale:1.08,xPercent:4,duration:1.6,ease:'power3.out'},0);

    /* Departure — the chapter recedes as you leave it. */
    gsap.timeline({scrollTrigger:{trigger:root,start:'top top',end:'bottom top',scrub:.6}})
      .to(root.querySelector('.in'),{yPercent:-16,opacity:.15,ease:'none'},0)
      .to('#portrait',{yPercent:10,scale:1.07,ease:'none'},0)
      .to('#heroVeil',{opacity:.55,ease:'none'},0);

    /* Scroll cue nudges until the visitor moves. */
    gsap.to(root.querySelector('.cue i'),{scaleY:.3,transformOrigin:'top',duration:1.1,
      repeat:-1,yoyo:true,ease:'power1.inOut'});
  });

WZ.add(function(W){
    var root = document.getElementById('reality');
    var big  = document.getElementById('realityBig');

    if(W.reduced) return;

    /* Words brighten one by one, tied to scroll position. */
    var sp = W.splitWords(big);
    if(sp && sp.words && sp.words.length){
      gsap.to(sp.words,{
        color:'#ffffff', stagger:.4, ease:'none',
        scrollTrigger:{trigger:root,start:'top 62%',end:'center 42%',scrub:.5}
      });
      /* Final clause lands in gold. */
      var tail = sp.words.slice(-7);
      gsap.to(tail,{color:'#AB9E6A',ease:'none',
        scrollTrigger:{trigger:root,start:'center 55%',end:'bottom 60%',scrub:.5}});
    }

    gsap.from('#realityAfter p',{opacity:0,y:28,duration:.9,stagger:.14,ease:'power3.out',
      scrollTrigger:{trigger:'#realityAfter',start:'top 82%'}});

    /* Case photo drifts and un-crops as the chapter passes. */
    gsap.fromTo('#realityImg',{yPercent:-8,scale:1.14},{yPercent:8,scale:1,ease:'none',
      scrollTrigger:{trigger:root,start:'top bottom',end:'bottom top',scrub:.8}});
  });

WZ.add(function(W){
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

    gsap.fromTo(root.querySelectorAll('.stat'),
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

WZ.add(function(W){
    if(W.reduced) return;

    var t = W.splitLines(document.getElementById('specTitle'));
    if(t && t.lines){
      gsap.from(t.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
        scrollTrigger:{trigger:'#specTitle',start:'top 84%'}});
    }
    gsap.from('#specBio p',{opacity:0,y:26,duration:.9,stagger:.13,ease:'power3.out',
      scrollTrigger:{trigger:'#specBio',start:'top 82%'}});

    /* Credentials deal in one line at a time — the length of the list is the point. */
    gsap.from('#credList li',{opacity:0,x:-22,duration:.6,stagger:.07,ease:'power2.out',
      scrollTrigger:{trigger:'#credList',start:'top 85%'}});

    /* Portrait rises slightly out of its plate as the chapter passes. */
    gsap.fromTo('#specPortrait',{yPercent:6},{yPercent:-4,ease:'none',
      scrollTrigger:{trigger:'#specialist',start:'top bottom',end:'bottom top',scrub:.8}});
  });

WZ.add(function(W){
    var root  = document.getElementById('transformation'),
        pin   = document.getElementById('tPin'),
        cmp   = document.getElementById('cmp'),
        cap   = document.getElementById('tCaption'),
        dots  = document.getElementById('tDots').children,
        slides= cmp.querySelectorAll('.slide'),
        handle= document.getElementById('tHandle');

    var CAPTIONS = [
      'Porcelain veneers with implant restoration · upper and lower arch',
      'Double-arch All-on-4 · full fixed teeth on four implants per arch',
      'Single-arch All-on-4 · upper arch restored on four implants'
    ];

    function show(i){
      for(var s=0;s<slides.length;s++) slides[s].classList.toggle('on', s===i);
      for(var d=0;d<dots.length;d++) dots[d].classList.toggle('on', d===i);
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
        scrub: .7,
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

    gsap.from(root.querySelectorAll('.head > *'),{opacity:0,y:24,duration:.9,stagger:.1,
      ease:'power3.out',scrollTrigger:{trigger:root,start:'top 70%'}});
  });

WZ.add(function(W){
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
        scrub: .6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function(self){ gsap.set(bar,{scaleX:self.progress}); }
      }
    });

    /* Each card lights its underline as it reaches centre stage. */
    gsap.utils.toArray('#pathTrack .card').forEach(function(card){
      gsap.to(card,{'--x':1,duration:.1});
      ScrollTrigger.create({
        trigger: card,
        containerAnimation: tween,
        start: 'left 72%',
        end: 'right 28%',
        onEnter:      function(){ gsap.to(card,{borderColor:'rgba(171,158,106,.5)',duration:.5});
                                  gsap.to(card.querySelector('.shot img'),{filter:'grayscale(0)',duration:.6}); },
        onLeave:      function(){ gsap.to(card,{borderColor:'rgba(255,255,255,.13)',duration:.5}); },
        onEnterBack:  function(){ gsap.to(card,{borderColor:'rgba(171,158,106,.5)',duration:.5}); },
        onLeaveBack:  function(){ gsap.to(card,{borderColor:'rgba(255,255,255,.13)',duration:.5});
                                  gsap.to(card.querySelector('.shot img'),{filter:'grayscale(1)',duration:.6}); }
      });
      gsap.fromTo(card.querySelector('.no'),{opacity:.35},{opacity:1,duration:.4,
        scrollTrigger:{trigger:card,containerAnimation:tween,start:'left 78%',toggleActions:'play none none reverse'}});
    });
  });

WZ.add(function(W){
    if(W.reduced) return;

    gsap.from('#standard .head > *',{opacity:0,y:26,duration:.9,stagger:.12,ease:'power3.out',
      scrollTrigger:{trigger:'#standard .head',start:'top 82%'}});

    /* Panels rise and un-mask; each image also drifts against the scroll. */
    gsap.utils.toArray('#stdGrid .std').forEach(function(card,i){
      gsap.fromTo(card,
        {opacity:0,y:44,clipPath:'inset(12% 0 0 0)'},
        {opacity:1,y:0,clipPath:'inset(0% 0 0 0)',duration:1.05,ease:'power3.out',delay:i*.07,
         scrollTrigger:{trigger:card,start:'top 88%'}});
      gsap.fromTo(card.querySelector('img'),{yPercent:-5},{yPercent:5,ease:'none',
        scrollTrigger:{trigger:card,start:'top bottom',end:'bottom top',scrub:.8}});
    });
  });

WZ.add(function(W){
    var film = document.getElementById('film');

    /* Play only while on screen — saves battery and avoids background decode. */
    ScrollTrigger.create({
      trigger:'#proofFilm', start:'top 90%', end:'bottom 10%',
      onEnter:    function(){ var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
      onEnterBack:function(){ var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
      onLeave:    function(){ film.pause(); },
      onLeaveBack:function(){ film.pause(); }
    });

    if(W.reduced){ gsap.set('#storyShot',{clipPath:'inset(0 0 0% 0)'}); return; }

    gsap.fromTo(film,{scale:1.16},{scale:1,ease:'none',
      scrollTrigger:{trigger:'#proofFilm',start:'top bottom',end:'bottom top',scrub:.8}});

    var ft = W.splitLines(document.getElementById('filmTitle'));
    if(ft && ft.lines){
      gsap.from(ft.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
        scrollTrigger:{trigger:'#proofFilm',start:'top 55%'}});
    }
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
    gsap.from('#rvGrid .rv',{opacity:0,y:34,duration:.8,stagger:{each:.08,from:'start'},
      ease:'power3.out',scrollTrigger:{trigger:'#rvGrid',start:'top 85%'}});

    /* Aggregate score counts up like the other stats. */
    var sc = document.getElementById('rvScore');
    if(sc){
      var o = {v:0};
      gsap.to(o,{v:5.0,duration:1.6,ease:'power2.out',
        onUpdate:function(){ sc.textContent = o.v.toFixed(1); },
        scrollTrigger:{trigger:'#reviews',start:'top 78%'}});
    }
  });

WZ.add(function(W){
    if(W.reduced) return;
    gsap.from('#locs .loc',{opacity:0,y:34,duration:1,stagger:.14,ease:'power3.out',
      scrollTrigger:{trigger:'#locs',start:'top 82%'}});
    var ct = W.splitLines(document.getElementById('ctaTitle'));
    if(ct && ct.lines){
      gsap.from(ct.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
        scrollTrigger:{trigger:'#ctaTitle',start:'top 85%'}});
    }
  });

(() => {

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

  if(!W.reduced && window.ScrollSmoother){
    try{
      W.smoother = ScrollSmoother.create({
        wrapper:'#smooth-wrapper', content:'#smooth-content',
        smooth: 1.05, effects: false, smoothTouch: false, normalizeScroll: false
      });
    }catch(e){ console.warn('ScrollSmoother unavailable', e); }
  }

  W.flush();

  
  var navCh  = document.getElementById('navCh'),
      navNm  = document.getElementById('navName'),
      navBar = document.getElementById('navBar'),
      navPr  = document.getElementById('navProgress'),
      nav    = document.getElementById('nav');

  
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

  
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
})();
