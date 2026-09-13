/* 06 THE WAY — pinned; the line draws itself down through the three steps
   and each step lights up as the line reaches it. */
WZ.section('ch-way', function(W){
  var root = document.querySelector('.ch-way'), pin = root.querySelector('.way-pin'),
      path = document.getElementById('wayPath'), steps = gsap.utils.toArray('.way-step', root);
  W.arrive(root,{start:'top 60%'});
  function light(p){ steps.forEach(function(s,i){ s.classList.toggle('is-on', p >= (i+.35)/steps.length); }); }
  if(W.reduced){ light(1); return; }

  var len = path.getTotalLength ? path.getTotalLength() : 600;
  gsap.set(path,{strokeDasharray:len,strokeDashoffset:len});
  var desktop = window.matchMedia('(min-width:992px)').matches;
  /* Pinned on desktop; on a phone the chapter is taller than the screen, so
     the line draws as the section passes instead. */
  var st = desktop
    ? {trigger:pin, pin:true, start:'top top', end:'+=120%', scrub:.3, anticipatePin:1}
    : {trigger:root, start:'top 70%', end:'bottom 60%', scrub:.3};
  st.onUpdate = function(self){ light(self.progress); };
  gsap.to(path,{strokeDashoffset:0,ease:'none',scrollTrigger:st});
  var fig = root.querySelector('.way-fig');
  if(fig) gsap.to(fig,{rotate:20,scale:1.1,ease:'none',scrollTrigger:{trigger:root,start:'top bottom',end:'bottom top',scrub:true}});
});
