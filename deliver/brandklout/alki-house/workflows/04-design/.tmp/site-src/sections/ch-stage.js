/* 02 THE STAGE — the signature moment. One spotlight, five pieces. The page
   holds while scroll turns the stage: each product swings out to the left as
   the next arrives from the right, its copy rising line by line. Progress
   is the scroll position, so 25/50/75% of the pin are three different pieces. */
WZ.section('ch-stage', function(W){
  var root = document.querySelector('.ch-stage'), pin = root.querySelector('.stage-pin'),
      slides = gsap.utils.toArray('.stage-slide', root), n = slides.length,
      num = document.getElementById('stageNum'), dots = document.getElementById('stageDots'),
      spot = root.querySelector('.stage-spot');
  if(!n) return;
  for(var i=0;i<n;i++){ var li = document.createElement('li'); dots.appendChild(li); }
  var dotEls = dots.querySelectorAll('li');
  gsap.set(slides,{visibility:'visible'});
  W.arrive(root,{start:'top 60%'});

  function setDial(i, p){
    if(num) num.textContent = String(i+1).padStart(2,'0');
    dotEls.forEach(function(d,k){ d.style.setProperty('--p', k<i?1:(k===i?p:0)); });
  }

  if(W.reduced){
    /* Reduced motion: stack the slides, no pin. */
    slides.forEach(function(s){ s.style.position='relative'; s.style.marginBottom='4rem'; });
    pin.style.height = 'auto';
    setDial(0,1);
    return;
  }

  /* Initial state: only slide 0 on stage. */
  slides.forEach(function(s,i){
    var fig = s.querySelector('.stage-fig'), copy = s.querySelector('.stage-copy');
    if(i>0){ gsap.set(fig,{xPercent:60,rotate:12,scale:.7,opacity:0}); gsap.set(copy.children,{y:40,opacity:0}); }
  });

  var tl = gsap.timeline({scrollTrigger:{
    trigger:pin, pin:true, start:'top top', end:'+=' + (n*90) + '%', scrub:.3, anticipatePin:1,
    onUpdate:function(self){
      var seg = 1/n, i = Math.min(n-1, Math.floor(self.progress/seg));
      setDial(i, (self.progress - i*seg)/seg);
    }
  }});
  /* Each segment: hold, then the swap. The hold is what makes the pin feel
     like a stage rather than a slideshow: the piece is really there. */
  for(var k=0;k<n-1;k++){
    var a = slides[k], b = slides[k+1];
    var aFig = a.querySelector('.stage-fig'), aCopy = a.querySelector('.stage-copy'),
        bFig = b.querySelector('.stage-fig'), bCopy = b.querySelector('.stage-copy');
    var t = k + .55;
    tl.to(aFig,{xPercent:-60,rotate:-12,scale:.7,opacity:0,duration:.45,ease:'power2.in'},t)
      .to(aCopy.children,{y:-30,opacity:0,duration:.3,stagger:.03,ease:'power2.in'},t)
      .to(spot,{scale:.6,opacity:.4,duration:.25,ease:'power2.inOut'},t+.1)
      .to(bFig,{xPercent:0,rotate:0,scale:1,opacity:1,duration:.5,ease:'power3.out'},t+.35)
      .to(bCopy.children,{y:0,opacity:1,duration:.35,stagger:.05,ease:'power3.out'},t+.45)
      .to(spot,{scale:1,opacity:1,duration:.3,ease:'power2.out'},t+.4)
      .to({},{duration:.1},t+.9);
  }
  tl.to({},{duration:.5});

  /* The piece on stage breathes and follows the cursor a little. */
  if(W.fine){
    var figs = root.querySelectorAll('.stage-fig img, .stage-fig .stage-glyph');
    var qx = gsap.quickTo(figs,'x',{duration:1,ease:'power3'}), qy = gsap.quickTo(figs,'y',{duration:1,ease:'power3'});
    pin.addEventListener('pointermove',function(e){
      var r = pin.getBoundingClientRect();
      qx(((e.clientX-r.left)/r.width-.5)*30); qy(((e.clientY-r.top)/r.height-.5)*20);
    });
  }
  gsap.to(root.querySelectorAll('.stage-fig img'),{y:'-=12',duration:3,repeat:-1,yoyo:true,ease:'sine.inOut',stagger:.4});
  gsap.to(spot,{x:'+=24',duration:5,repeat:-1,yoyo:true,ease:'sine.inOut'});
});
