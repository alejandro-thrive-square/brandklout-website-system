/* 03 THE PROMISE — the marquee reacts to scroll velocity, the counters are
   written by scroll position, the photograph drifts against it. */
WZ.section('ch-promise', function(W){
  var root = document.querySelector('.ch-promise');
  W.arrive(root);

  /* Counters: scrubbed, so half way through the trigger they read half the value. */
  root.querySelectorAll('[data-count]').forEach(function(el){
    var end = parseInt(el.getAttribute('data-count'),10)||0, obj = {v:0};
    if(W.reduced){ el.textContent = end; return; }
    gsap.to(obj,{v:end,ease:'none',scrollTrigger:{trigger:el,start:'top 92%',end:'top 45%',scrub:.4},
      onUpdate:function(){ el.textContent = Math.round(obj.v); }});
  });
  if(W.reduced) return;

  /* Velocity-reactive marquee. */
  var track = root.querySelector('.pr-track');
  if(track){
    track.innerHTML += track.innerHTML;
    var loop = gsap.to(track,{xPercent:-50,duration:32,ease:'none',repeat:-1});
    var ts = gsap.quickTo(loop,'timeScale',{duration:.6,ease:'power2'});
    ScrollTrigger.create({trigger:root,start:'top bottom',end:'bottom top',
      onUpdate:function(self){
        var v = self.getVelocity()/400;
        var s = gsap.utils.clamp(-6,6,v);
        ts(Math.abs(s) < 1 ? (s<0?-1:1) : s);
      }});
  }

  /* Photograph parallax + list items. */
  var img = root.querySelector('.pr-fig img');
  if(img) gsap.fromTo(img,{yPercent:-12},{yPercent:0,ease:'none',scrollTrigger:{trigger:root.querySelector('.pr-fig'),start:'top bottom',end:'bottom top',scrub:true}});
  gsap.from(root.querySelectorAll('.pr-list li'),{opacity:0,x:40,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:root.querySelector('.pr-list'),start:'top 80%',once:true}});

  W.depart(root, root.querySelector('.pr-in'), 8);
});
