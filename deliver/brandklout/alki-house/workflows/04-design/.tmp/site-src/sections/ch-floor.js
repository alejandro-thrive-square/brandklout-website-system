/* 05 THE FLOOR — cards rise in a staggered batch as the grid enters. */
WZ.section('ch-floor', function(W){
  var root = document.querySelector('.ch-floor');
  W.arrive(root);
  if(W.reduced) return;
  var cards = gsap.utils.toArray('.fl-grid .pcard');
  gsap.set(cards,{y:48,opacity:0});
  ScrollTrigger.batch(cards,{start:'top 90%',once:true,
    onEnter:function(batch){ gsap.to(batch,{y:0,opacity:1,duration:.9,stagger:.08,ease:'power3.out',overwrite:true}); }});
  W.depart(root, root.querySelector('.wrap'), 8);
});
