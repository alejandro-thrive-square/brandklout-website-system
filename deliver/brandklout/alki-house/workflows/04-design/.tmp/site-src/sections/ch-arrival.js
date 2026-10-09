/* 00 ARRIVAL — the film walks the aisles in one dark studio; the caption on the
   right names the aisle on screen and links to it, one pill per aisle fills as it
   plays and jumps the film there; split headline; the chapter recedes as you leave. */
WZ.section('ch-arrival', function(W){
  var root = document.getElementById('arrival');
  var hide = root.querySelectorAll('[data-anim="hide"]');
  var video = root.querySelector('.ar-video'), poster = root.querySelector('.ar-poster');
  var scene = root.querySelector('.ar-scene');
  gsap.set(hide,{visibility:'visible'});

  /* ---- what is on screen ---- */
  var scenes = [], cur = 0;
  try{ scenes = JSON.parse(scene.getAttribute('data-scenes') || '[]'); }catch(e){}
  var link = scene.querySelector('.ar-cap-name'), inner = scene.querySelector('.ar-cap-in'),
      dots = scene.querySelectorAll('.ar-dot');
  function fill(s){
    link.href = s.href;
    inner.querySelector('b').textContent = s.label;
    inner.querySelector('.mono').textContent = s.n + ' →';
  }
  function show(i){
    if(i === cur || !scenes[i]) return;
    cur = i;
    dots.forEach(function(d, k){ d.classList.toggle('is-on', k === i); if(k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    if(W.reduced){ fill(scenes[i]); return; }
    gsap.timeline({overwrite:true})
      .to(inner,{yPercent:-60,opacity:0,duration:.32,ease:'power2.in'})
      .add(function(){ fill(scenes[i]); })
      .fromTo(inner,{yPercent:60,opacity:0},{yPercent:0,opacity:1,duration:.6,ease:'power3.out'});
  }
  function at(t){ var i = 0; for(var k = 0; k < scenes.length; k++) if(t >= scenes[k].t) i = k; return i; }
  function progress(t){
    dots.forEach(function(d, k){
      var a = scenes[k].t, b = k + 1 < scenes.length ? scenes[k + 1].t : (video && video.duration) || a + 5;
      d.style.setProperty('--p', t < a ? 0 : t >= b ? (k === cur ? 1 : 0) : ((t - a) / (b - a)).toFixed(3));
    });
  }

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
    video.addEventListener('timeupdate', function(){ var t = video.currentTime; show(at(t)); progress(t); });
  }

  /* A pill jumps the film to its aisle; with no film (reduced motion) it just names it. */
  dots.forEach(function(d){
    d.addEventListener('click', function(){
      var i = parseInt(d.getAttribute('data-i'), 10);
      if(video && video.classList.contains('is-live') && scenes[i]){ video.currentTime = scenes[i].t + .9; var p = video.play(); if(p && p.catch) p.catch(function(){}); }
      show(i);
    });
  });

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
    .from(root.querySelector('.ar-cap'),{opacity:0,x:24,duration:.9,ease:'power3.out'},1.0)
    .from(dots,{opacity:0,scaleX:0,transformOrigin:'right',duration:.6,stagger:.06,ease:'power3.out'},1.15)
    .from(root.querySelector('.ar-ticker'),{opacity:0,y:20,duration:.9},1.0)
    .from(root.querySelector('.ar-cue'),{opacity:0,duration:.8},1.2)
    .from(root.querySelector('.ar-film'),{opacity:0,scale:1.08,duration:1.8,ease:'power3.out'},0);

  /* Ticker drifts on its own. */
  var track = root.querySelector('.ar-track');
  if(track){
    track.innerHTML += track.innerHTML;
    gsap.to(track,{xPercent:-50,duration:28,ease:'none',repeat:-1});
  }

  /* Departure — the chapter recedes; the film sinks, the copy lifts away. */
  gsap.timeline({scrollTrigger:{trigger:root,start:'top top',end:'bottom top',scrub:.5}})
    .to(root.querySelector('.ar-copy'),{yPercent:-18,opacity:.1,ease:'none'},0)
    .to(scene,{yPercent:-14,opacity:.15,ease:'none'},0)
    .to(root.querySelector('.ar-film'),{yPercent:10,scale:1.08,ease:'none'},0)
    .to(root.querySelector('.ar-veil'),{opacity:.5,ease:'none'},0);

  gsap.to(root.querySelector('.ar-cue i'),{scaleY:.25,transformOrigin:'top',duration:1.1,repeat:-1,yoyo:true,ease:'power1.inOut'});
});
