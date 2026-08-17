/* =============================================================================
   SECTION: ch-proof
   Registered against .ch-proof; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-proof", function (W) {
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

  gsap.fromTo(film,{scale:1.18},{scale:1.04,ease:'none',
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
  gsap.from('#rvGrid .rv-card',{opacity:0,y:34,duration:.8,stagger:{each:.08,from:'start'},
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
