/* =============================================================================
   SECTION: ch-standard
   Registered against .ch-standard; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-standard", function (W) {
  if(W.reduced) return;

  gsap.from('#standard .std-head > *',{opacity:0,y:26,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#standard .std-head',start:'top 82%'}});

  /* Panels rise and un-mask; each image also drifts against the scroll. */
  gsap.utils.toArray('#stdGrid .std-card').forEach(function(card,i){
    gsap.fromTo(card,
      {opacity:0,y:44,clipPath:'inset(12% 0 0 0)'},
      {opacity:1,y:0,clipPath:'inset(0% 0 0 0)',duration:1.05,ease:'power3.out',delay:i*.07,
       scrollTrigger:{trigger:card,start:'top 88%'}});
    gsap.fromTo(card.querySelector('img'),{yPercent:-5},{yPercent:5,ease:'none',
      scrollTrigger:{trigger:card,start:'top bottom',end:'bottom top',scrub:.8}});
  });
});
