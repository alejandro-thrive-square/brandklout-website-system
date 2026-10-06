/* =============================================================================
   SECTION: ch-transformation
   Registered against .ch-transformation; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("section_transformation", function (W) {
  var root  = document.getElementById('transformation'),
      pin   = document.getElementById('tPin'),
      cmp   = document.getElementById('cmp'),
      cap   = document.getElementById('tCaption'),
      dots  = document.getElementById('tDots').children,
      slides= cmp.querySelectorAll('.transformation_slide'),
      handle= document.getElementById('tHandle');

  var CAPTIONS = [
    'Porcelain veneers with implant restoration · upper and lower arch',
    'Double-arch All-on-4 · full fixed teeth on four implants per arch',
    'Single-arch All-on-4 · upper arch restored on four implants'
  ];

  function show(i){
    for(var s=0;s<slides.length;s++) slides[s].classList.toggle('is-on', s===i);
    for(var d=0;d<dots.length;d++) dots[d].classList.toggle('is-on', d===i);
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
      scrub: .3,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      /* REFRESH ORDER MATTERS ONCE TWO SECTIONS PIN. ScrollTrigger measures in
         creation order unless told otherwise, and Chapter 05 is built before
         this one — so it measured #pathPin at its PRE-SPACER position and
         started 2,700px too early, landing inside this chapter's pinned range
         and rendering on top of it. Higher priority refreshes first, so this
         pin's spacer is in the flow before anything downstream measures. */
      refreshPriority: 1
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

  gsap.from(root.querySelectorAll('.transformation_head > *'),{opacity:0,y:24,duration:.9,stagger:.1,
    ease:'power3.out',scrollTrigger:{trigger:root,start:'top 70%'}});
});
