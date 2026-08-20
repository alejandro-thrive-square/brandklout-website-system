/* =============================================================================
   SECTION: ch-path
   Registered against .ch-path; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-path", function (W) {
  var pin   = document.getElementById('pathPin'),
      track = document.getElementById('pathTrack'),
      bar   = document.getElementById('pathBar'),
      sec   = document.querySelector('.ch-path');

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

  /* On a wide enough monitor all four cards are on screen at once and there is
     nothing to travel. Pinning anyway held the section still for 0.6 of a
     viewport height -- about 1300px of dead scroll on a 4K display -- while the
     reader stared at a row that never moved. So above that width the chapter is
     an ordinary static row, and the cards reveal instead of scrubbing.
     The threshold is measured, not a breakpoint: it is simply whether the track
     overflows, which depends on the card clamp and the gutter as much as on the
     viewport. Rebuilt on resize because a window can cross it either way. */
  var built = null;

  function buildStatic(){
    sec.classList.add('is-static');
    gsap.set(track,{x:0});
    gsap.set(bar,{scaleX:0});
    gsap.utils.toArray('#pathTrack .pa-card').forEach(function(card,i){
      gsap.from(card,{opacity:0,y:30,duration:.9,ease:'power3.out',delay:i*.07,
        scrollTrigger:{trigger:pin,start:'top 72%'}});
    });
  }

  function buildPinned(){
    sec.classList.remove('is-static');
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
  }

  function build(){
    if (built) built.revert();
    built = gsap.context(distance() > 0 ? buildPinned : buildStatic);
  }
  build();

  var t;
  window.addEventListener('resize', function(){
    clearTimeout(t);
    t = setTimeout(function(){
      var wants = distance() > 0;
      if (wants !== !sec.classList.contains('is-static')) build();
    }, 250);
  });
});
