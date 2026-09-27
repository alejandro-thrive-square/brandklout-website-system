/* 04 THE SET — each kit card wipes open under scroll, and the ground turns
   from apricot to coffee beneath them: the light chapter hands back to dark. */
WZ.section('ch-set', function(W){
  var root = document.querySelector('.ch-set'), cards = gsap.utils.toArray('.set-card', root);
  W.arrive(root);
  if(W.reduced){ gsap.set(cards,{clipPath:'inset(0 0 0% 0 round 1.1rem)'}); return; }

  cards.forEach(function(card,i){
    gsap.fromTo(card,{clipPath:'inset(0 0 100% 0 round 1.1rem)'},{clipPath:'inset(0 0 0% 0 round 1.1rem)',ease:'none',
      scrollTrigger:{trigger:card,start:'top 88%',end:'top 38%',scrub:.3}});
    var img = card.querySelector('.set-media img');
    if(img) gsap.fromTo(img,{scale:1.25,yPercent:6},{scale:1.02,yPercent:-4,ease:'none',
      scrollTrigger:{trigger:card,start:'top bottom',end:'bottom top',scrub:true}});
    gsap.from(card.querySelectorAll('.set-body > *'),{y:26,opacity:0,duration:.8,stagger:.08,ease:'power3.out',
      scrollTrigger:{trigger:card,start:'top 60%',once:true}});
  });

  /* Theme shift: the section's own ground darkens as the reader goes down. */
  var head = root.querySelector('.sec-head');
  gsap.timeline({scrollTrigger:{trigger:root,start:'top 30%',end:'bottom 90%',scrub:.4}})
    .to(root,{backgroundColor:'#1E100A',ease:'none'},0)
    .to(head.querySelectorAll('h2, .lead'),{color:'#FFF3D6',ease:'none'},0)
    .to(head.querySelectorAll('.chapter-tag'),{color:'#E9CD8F',ease:'none'},0)
    .to(head.querySelectorAll('.chapter-tag b'),{color:'#FFF3D6',ease:'none'},0);
});
