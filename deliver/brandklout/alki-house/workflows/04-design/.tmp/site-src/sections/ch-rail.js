/* 01 THE RAIL — pinned; scroll walks the category panels sideways. Progress
   bar and the 01/11 count are driven from the trigger's own progress. */
WZ.section('ch-rail', function(W){
  var root = document.querySelector('.ch-rail'), pin = root.querySelector('.rail-pin'),
      track = document.getElementById('railTrack'), bar = document.getElementById('railBar'),
      count = document.getElementById('railCount');
  var panels = track.querySelectorAll('.rail-panel'), n = panels.length;
  W.arrive(root,{start:'top 60%'});

  if(W.reduced){
    /* Reduced motion: a plain horizontal scroller, no pin. */
    track.style.overflowX = 'auto'; track.style.width = 'auto';
    return;
  }

  function dist(){ return Math.max(0, track.scrollWidth - window.innerWidth); }
  var tween = gsap.to(track,{x:function(){ return -dist(); }, ease:'none',
    scrollTrigger:{
      trigger:pin, pin:true, start:'top top', end:function(){ return '+=' + (dist() + window.innerHeight*.4); },
      scrub:.35, invalidateOnRefresh:true, anticipatePin:1,
      onUpdate:function(self){
        if(bar) bar.style.setProperty('--p', self.progress.toFixed(3));
        /* n - 1: the last panel is the "whole catalogue" card, not an aisle. */
        if(count) count.textContent = String(Math.min(n - 1, 1 + Math.floor(self.progress * n))).padStart(2,'0') + ' / ' + String(n - 1).padStart(2,'0');
      }
    }});

  /* Each panel eases up and un-blurs as it enters the viewport horizontally. */
  panels.forEach(function(p){
    gsap.fromTo(p,{y:60,opacity:.35},{y:0,opacity:1,ease:'none',
      scrollTrigger:{trigger:p, containerAnimation:tween, start:'left 95%', end:'left 55%', scrub:true}});
    var img = p.querySelector('.rail-media img');
    if(img) gsap.fromTo(img,{xPercent:-8},{xPercent:8,ease:'none',
      scrollTrigger:{trigger:p, containerAnimation:tween, start:'left right', end:'right left', scrub:true}});
  });
});
