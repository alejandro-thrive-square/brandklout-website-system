/* THE PRODUCT page — the piece lands on its stage, angles swap with a swing,
   the copy rises; the detail chapter's specs write in row by row; the related
   rail is draggable with inertia; the CTA bar rides the bottom on phones. */
WZ.section('pd-arrival', function(W){
  var root = document.getElementById('pdArrival'), gallery = document.getElementById('pdGallery'),
      shots = gsap.utils.toArray('.pd-shot', root), thumbs = gsap.utils.toArray('.pd-thumb', root), cur = 0;
  gsap.set(root.querySelectorAll('[data-anim="hide"]'),{visibility:'visible'});
  document.body.classList.add('has-mob-bar');

  function show(i){
    if(i===cur || !shots[i]) return;
    var from = shots[cur], to = shots[i], dir = i>cur?1:-1; cur = i;
    thumbs.forEach(function(t,k){ t.classList.toggle('is-on',k===i); });
    if(W.reduced){ from.classList.remove('is-on'); to.classList.add('is-on'); return; }
    gsap.timeline()
      .to(from.querySelector('img, .pd-glyph'),{xPercent:-40*dir,rotate:-10*dir,scale:.8,opacity:0,duration:.4,ease:'power2.in',onComplete:function(){ from.classList.remove('is-on'); gsap.set(from.querySelector('img, .pd-glyph'),{clearProps:'all'}); }})
      .add(function(){ to.classList.add('is-on'); })
      .fromTo(to.querySelector('img, .pd-glyph'),{xPercent:40*dir,rotate:10*dir,scale:.8,opacity:0},{xPercent:0,rotate:0,scale:1,opacity:1,duration:.6,ease:'power3.out'});
  }
  thumbs.forEach(function(t){ t.addEventListener('click',function(){ show(parseInt(t.dataset.i,10)); }); });
  /* Arrow keys and a swipe on the stage. */
  document.addEventListener('keydown',function(e){ if(e.key==='ArrowRight') show((cur+1)%shots.length); if(e.key==='ArrowLeft') show((cur-1+shots.length)%shots.length); });
  if(window.Observer && shots.length>1) Observer.create({target:root.querySelector('.pd-shots'),type:'touch,pointer',tolerance:30,
    onLeft:function(){ show((cur+1)%shots.length); }, onRight:function(){ show((cur-1+shots.length)%shots.length); }});

  if(W.reduced) return;
  var tl = gsap.timeline({delay:.1});
  var split = W.splitLines(root.querySelector('h1'));
  if(split && split.lines.length){ gsap.set(split.lines,{yPercent:110}); tl.to(split.lines,{yPercent:0,duration:1.1,stagger:.09,ease:'power4.out'},.15); }
  tl.from(root.querySelector('.pd-crumbs'),{opacity:0,y:-10,duration:.7},0)
    .from(root.querySelector('.chapter-tag'),{opacity:0,x:-24,duration:.9,ease:'power3.out'},.05)
    .from(root.querySelectorAll('[data-arrive]'),{opacity:0,y:26,duration:.9,stagger:.12,ease:'power3.out'},.55)
    .from(root.querySelector('.pd-plate'),{opacity:0,scale:.6,duration:1.4,ease:'power3.out'},.2)
    .from(shots[0].querySelector('img, .pd-glyph'),{opacity:0,y:70,rotate:-8,scale:.85,duration:1.4,ease:'power4.out'},.35);
  if(thumbs.length) tl.from(thumbs,{opacity:0,y:12,duration:.6,stagger:.06},.9);

  /* The piece leans toward the cursor and floats. */
  var img = function(){ return shots[cur].querySelector('img, .pd-glyph'); };
  if(W.fine){
    gsap.set(gallery,{perspective:1200});
    gallery.addEventListener('pointermove',function(e){
      var r = gallery.getBoundingClientRect(), el = img(); if(!el) return;
      gsap.to(el,{rotationY:((e.clientX-r.left)/r.width-.5)*18,rotationX:-((e.clientY-r.top)/r.height-.5)*14,duration:.9,ease:'power3'});
    });
    gallery.addEventListener('pointerleave',function(){ var el = img(); if(el) gsap.to(el,{rotationX:0,rotationY:0,duration:.9,ease:'power3'}); });
  }
  gsap.to(root.querySelector('.pd-plate'),{scale:1.05,opacity:.85,duration:2.8,repeat:-1,yoyo:true,ease:'sine.inOut'});

  /* Departure: the stage sinks and the copy lifts away. */
  gsap.timeline({scrollTrigger:{trigger:root,start:'top top',end:'bottom top',scrub:.5}})
    .to(gallery,{yPercent:-10,scale:.9,opacity:.2,ease:'none'},0)
    .to(root.querySelector('.pd-copy'),{yPercent:-16,opacity:.15,ease:'none'},0);
});

WZ.section('pd-detail', function(W){
  var root = document.getElementById('pdDetail');
  W.arrive(root);
  if(W.reduced) return;
  var rows = gsap.utils.toArray('.specs > div', root);
  gsap.set(rows,{opacity:0,x:30});
  rows.forEach(function(r){
    gsap.to(r,{opacity:1,x:0,ease:'none',scrollTrigger:{trigger:r,start:'top 92%',end:'top 70%',scrub:.3}});
  });
});

WZ.section('pd-fit', function(W){
  var root = document.getElementById('pdFit'), rail = document.getElementById('pdRail');
  W.arrive(root);
  if(!W.reduced){
    var cards = gsap.utils.toArray('.pcard', rail);
    gsap.from(cards,{x:80,opacity:0,duration:1,stagger:.08,ease:'power3.out',scrollTrigger:{trigger:rail,start:'top 85%',once:true}});
  }
  /* Drag to scroll with a little inertia. Draggable's scrollLeft mode wraps
     the children in a block div and breaks the flex row, so this is by hand. */
  if(W.fine && rail.scrollWidth > rail.clientWidth){
    var down = false, sx = 0, sl = 0, vx = 0, lastX = 0, lastT = 0, moved = false;
    rail.addEventListener('pointerdown',function(e){ down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; lastX = e.clientX; lastT = performance.now(); vx = 0; gsap.killTweensOf(rail); rail.setPointerCapture(e.pointerId); });
    rail.addEventListener('pointermove',function(e){
      if(!down) return;
      var dx = e.clientX - sx; if(Math.abs(dx) > 4){ moved = true; rail.classList.add('is-dragging'); }
      rail.scrollLeft = sl - dx;
      var now = performance.now(); vx = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
    });
    function up(){
      if(!down) return; down = false;
      if(moved) gsap.to(rail,{scrollLeft: rail.scrollLeft - vx*260, duration:.9, ease:'power3.out'});
      setTimeout(function(){ rail.classList.remove('is-dragging'); },50);
    }
    rail.addEventListener('pointerup',up); rail.addEventListener('pointercancel',up); rail.addEventListener('pointerleave',up);
    rail.addEventListener('click',function(e){ if(moved) e.preventDefault(); },true);
    rail.querySelectorAll('img').forEach(function(i){ i.draggable = false; });
  }
});

WZ.section('pd-invite', function(W){
  var root = document.getElementById('pdInvite');
  W.arrive(root);
  if(!W.reduced) gsap.to(root.querySelector('.in-glow'),{scale:1.15,opacity:.8,duration:4,repeat:-1,yoyo:true,ease:'sine.inOut'});
});
