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
