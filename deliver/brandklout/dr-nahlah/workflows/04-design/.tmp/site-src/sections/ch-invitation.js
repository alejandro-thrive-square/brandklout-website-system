/* =============================================================================
   SECTION: ch-invitation
   Registered against .ch-invitation; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-invitation", function (W) {
  if(W.reduced) return;
  gsap.from('#locs .iv-loc',{opacity:0,y:34,duration:1,stagger:.14,ease:'power3.out',
    scrollTrigger:{trigger:'#locs',start:'top 82%'}});
  W.splitLines(document.getElementById('ctaTitle'), function(self){
    return gsap.from(self.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
      scrollTrigger:{trigger:'#ctaTitle',start:'top 85%'}});
  });
});
