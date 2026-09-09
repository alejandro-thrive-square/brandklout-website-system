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

  /* Portrait rises slightly out of its plate as the chapter passes.

     x:0 is load-bearing, not decoration. The CSS centres this image with
     `left:50%; transform:translateX(-50%)` (css/33-ch-specialist.css), and that
     has to stay -- the `W.reduced` return above means this tween never runs
     under prefers-reduced-motion, so CSS is the only thing centring it there.
     But GSAP reads the element's starting transform through getComputedStyle,
     which hands back a resolved MATRIX: the -50% arrives as a plain pixel
     number and is recorded as the baseline `x`. xPercent:-50 is then layered on
     top of it as a second translate, and the portrait is shifted left by half
     its width twice --

       transform: translate(-50%, 2.4%) translate3d(-237.401px, 0px, 0px)

     Whether it visibly breaks depends on whether the image has a laid-out width
     at the moment GSAP takes that snapshot, which is why it hid locally and
     showed up on the host: the local <img> carries no width/height attributes,
     so before the file decodes the box is 0px wide, -50% of 0 is 0, and the
     snapshot is harmless. Instatic's uploader rewrites the tag with
     width/height (plus srcset/sizes), the browser knows the aspect ratio at
     parse time, and the real half-width gets baked in permanently.

     Pinning x:0 tells GSAP what the baseline is instead of letting it infer one
     from the matrix, so the CSS -50% and the tween stop stacking. */
  gsap.fromTo('#specPortrait',{xPercent:-50,x:0,yPercent:6},{xPercent:-50,x:0,yPercent:-4,ease:'none',
    scrollTrigger:{trigger:'#specialist',start:'top bottom',end:'bottom top',scrub:.8}});
});
