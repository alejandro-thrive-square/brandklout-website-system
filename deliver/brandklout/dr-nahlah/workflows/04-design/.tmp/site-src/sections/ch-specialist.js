/* =============================================================================
   SECTION: ch-specialist
   Registered against .ch-specialist; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-specialist", function (W) {
  if(W.reduced) return;

  W.splitLines(document.getElementById('specTitle'), function(self){
    return gsap.from(self.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
      scrollTrigger:{trigger:'#specTitle',start:'top 84%'}});
  });
  gsap.from('#specBio p',{opacity:0,y:26,duration:.9,stagger:.13,ease:'power3.out',
    scrollTrigger:{trigger:'#specBio',start:'top 82%'}});

  /* Credentials deal in one line at a time — the length of the list is the point. */
  gsap.from('#credList li',{opacity:0,x:-22,duration:.6,stagger:.07,ease:'power2.out',
    scrollTrigger:{trigger:'#credList',start:'top 85%'}});

  /* Portrait rises slightly out of its plate as the chapter passes. */
  gsap.fromTo('#specPortrait',{xPercent:-50,yPercent:6},{xPercent:-50,yPercent:-4,ease:'none',
    scrollTrigger:{trigger:'#specialist',start:'top bottom',end:'bottom top',scrub:.8}});
});
