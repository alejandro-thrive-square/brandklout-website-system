/* =============================================================================
   SECTION: ch-reality
   Registered against .ch-reality; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-reality", function (W) {
  var root = document.getElementById('reality');
  var big  = document.getElementById('realityBig');

  if(W.reduced) return;

  /* Words brighten one by one, tied to scroll position. */
  var sp = W.splitWords(big);
  if(sp && sp.words && sp.words.length){
    /* The final clause is excluded here and owned by the gold tween below.
       Two scrubbed tweens writing the same property on the same element,
       over overlapping scroll ranges, flicker — they overwrite each other
       every frame. One word, one owner. */
    var tail = sp.words.slice(-7);
    var body = sp.words.slice(0, -7);
    gsap.to(body,{
      color:'#141416', stagger:.4, ease:'none',
      scrollTrigger:{trigger:root,start:'top 62%',end:'center 42%',scrub:.5}
    });
    gsap.to(tail,{color:'#8A7E4E',ease:'none',stagger:.3,
      scrollTrigger:{trigger:root,start:'center 52%',end:'bottom 62%',scrub:.5}});
  }

  gsap.from('#realityAfter p',{opacity:0,y:28,duration:.9,stagger:.14,ease:'power3.out',
    scrollTrigger:{trigger:'#realityAfter',start:'top 82%'}});

  /* Case photo drifts and un-crops as the chapter passes. */
  /* Scale stays above 1 + drift so the photo always overfills its frame. */
  gsap.fromTo('#realityImg',{yPercent:-6,scale:1.2},{yPercent:6,scale:1.14,ease:'none',
    scrollTrigger:{trigger:root,start:'top bottom',end:'bottom top',scrub:.8}});
});
