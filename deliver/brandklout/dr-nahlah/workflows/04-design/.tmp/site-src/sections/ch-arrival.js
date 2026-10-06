/* =============================================================================
   SECTION: ch-arrival
   Registered against .ch-arrival; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("section_arrival", function (W) {
  var root = document.getElementById('arrival');
  var reveal = root.querySelectorAll('[data-anim="hide"]');
  /* Resolved by CLASS with an id fallback, and every use guarded. Instatic's
     HTML importer maps <video> onto its own Video module, which has no
     htmlAttributes escape hatch, so the `id` is dropped on import: the film
     came through fine but `getElementById` returned null and the first
     onEnter threw, taking the rest of the chapter's ScrollTriggers with it.
     A class is data the importer keeps, so this survives the trip. */
  var film = root.querySelector('.arrival_film') || document.getElementById('heroFilm');
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
  tl.from(root.querySelector('.tagline_component'),{opacity:0,x:-24,duration:.9,ease:'power3.out'},.05)
    .from('#heroLead',       {opacity:0,y:26,duration:.9,ease:'power3.out'},.55)
    .from(root.querySelector('.arrival_actions'),{opacity:0,y:26,duration:.9,ease:'power3.out'},.68)
    .from(root.querySelectorAll('.arrival_meta div'),{opacity:0,y:22,duration:.8,stagger:.08,ease:'power3.out'},.78)
    .from(root.querySelector('.arrival_scroll-cue'),{opacity:0,duration:.8},.9)
    .from(film||'#heroFilm',{opacity:0,scale:1.09,duration:1.7,ease:'power3.out'},0);

  /* Departure — the chapter recedes as you leave it. */
  gsap.timeline({scrollTrigger:{trigger:root,start:'top top',end:'bottom top',scrub:.6}})
    .to(root.querySelector('.arrival_content'),{yPercent:-16,opacity:.15,ease:'none'},0)
    .to(film||'#heroFilm',{yPercent:5,scale:1.1,ease:'none'},0)
    .to('#heroVeil',{opacity:.55,ease:'none'},0);

  /* Scroll cue nudges until the visitor moves. */
  gsap.to(root.querySelector('.arrival_scroll-cue i'),{scaleY:.3,transformOrigin:'top',duration:1.1,
    repeat:-1,yoyo:true,ease:'power1.inOut'});
});
