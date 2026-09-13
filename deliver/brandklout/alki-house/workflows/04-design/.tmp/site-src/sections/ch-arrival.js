/* 00 ARRIVAL — film loop, split headline, the product floats on its stage and
   leans toward the cursor; the whole chapter recedes as you leave it. */
WZ.section('ch-arrival', function(W){
  var root = document.getElementById('arrival');
  var hide = root.querySelectorAll('[data-anim="hide"]');
  var video = root.querySelector('.ar-video'), poster = root.querySelector('.ar-poster');
  var product = root.querySelector('.ar-product'), stage = root.querySelector('.ar-stage');
  gsap.set(hide,{visibility:'visible'});

  /* The film only loads and plays while the chapter is on screen, and never
     under reduced motion: the poster frame is the still version. */
  if(video && video.dataset.src && !W.reduced){
    var armed = false;
    function play(){
      if(!armed){ armed = true; video.src = video.dataset.src; video.load(); }
      var p = video.play(); if(p && p.catch) p.catch(function(){});
      video.classList.add('is-live');
    }
    ScrollTrigger.create({trigger:root,start:'top bottom',end:'bottom top',
      onEnter:play,onEnterBack:play,onLeave:function(){ video.pause(); },onLeaveBack:function(){ video.pause(); }});
  }

  if(W.reduced){ gsap.set(hide,{opacity:1,y:0}); return; }

  /* Entrance */
  var tl = gsap.timeline({delay:.1});
  var split = W.splitLines(document.getElementById('heroTitle'));
  if(split && split.lines && split.lines.length){
    gsap.set(split.lines,{yPercent:110});
    tl.to(split.lines,{yPercent:0,duration:1.2,stagger:.1,ease:'power4.out'},.1);
  }else{
    tl.from('#heroTitle',{opacity:0,y:40,duration:1,ease:'power3.out'},.1);
  }
  tl.from(root.querySelector('.chapter-tag'),{opacity:0,x:-24,duration:.9,ease:'power3.out'},0)
    .from(root.querySelectorAll('[data-arrive]'),{opacity:0,y:26,duration:.9,stagger:.12,ease:'power3.out'},.6)
    .from(root.querySelector('.ar-plate'),{opacity:0,scale:.6,duration:1.4,ease:'power3.out'},.3)
    .from(product,{opacity:0,y:80,rotate:-6,scale:.86,duration:1.5,ease:'power4.out'},.45)
    .from(root.querySelector('.ar-cap'),{opacity:0,x:20,duration:.8},1.1)
    .from(root.querySelector('.ar-ticker'),{opacity:0,y:20,duration:.9},1.0)
    .from(root.querySelector('.ar-cue'),{opacity:0,duration:.8},1.2)
    .from(root.querySelector('.ar-film'),{opacity:0,scale:1.08,duration:1.8,ease:'power3.out'},0);

  /* The product leans toward the cursor. */
  if(W.fine && product){
    var rx = gsap.quickTo(product,'rotationY',{duration:.9,ease:'power3'}),
        ry = gsap.quickTo(product,'rotationX',{duration:.9,ease:'power3'}),
        px = gsap.quickTo(product,'x',{duration:.9,ease:'power3'}),
        py = gsap.quickTo(product,'y',{duration:.9,ease:'power3'});
    gsap.set(stage,{perspective:1200});
    root.addEventListener('pointermove',function(e){
      var r = stage.getBoundingClientRect();
      var nx = (e.clientX - r.left - r.width/2)/r.width, ny = (e.clientY - r.top - r.height/2)/r.height;
      rx(nx*16); ry(-ny*12); px(nx*22); py(ny*16);
    });
    root.addEventListener('pointerleave',function(){ rx(0); ry(0); px(0); py(0); });
  }

  /* Idle float, so the stage never looks like a still. */
  gsap.to(product,{y:'-=10',duration:2.6,repeat:-1,yoyo:true,ease:'sine.inOut'});
  gsap.to(root.querySelector('.ar-plate'),{scale:1.04,opacity:.85,duration:2.6,repeat:-1,yoyo:true,ease:'sine.inOut'});

  /* Ticker drifts on its own. */
  var track = root.querySelector('.ar-track');
  if(track){
    track.innerHTML += track.innerHTML;
    gsap.to(track,{xPercent:-50,duration:28,ease:'none',repeat:-1});
  }

  /* Departure — the chapter recedes; the film sinks, the copy lifts away. */
  gsap.timeline({scrollTrigger:{trigger:root,start:'top top',end:'bottom top',scrub:.5}})
    .to(root.querySelector('.ar-copy'),{yPercent:-18,opacity:.1,ease:'none'},0)
    .to(stage,{yPercent:-8,scale:.92,opacity:.25,ease:'none'},0)
    .to(root.querySelector('.ar-film'),{yPercent:10,scale:1.08,ease:'none'},0)
    .to(root.querySelector('.ar-veil'),{opacity:.5,ease:'none'},0);

  gsap.to(root.querySelector('.ar-cue i'),{scaleY:.25,transformOrigin:'top',duration:1.1,repeat:-1,yoyo:true,ease:'power1.inOut'});
});
