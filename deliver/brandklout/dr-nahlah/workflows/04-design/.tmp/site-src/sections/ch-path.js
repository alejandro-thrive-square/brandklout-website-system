/* =============================================================================
   SECTION: ch-path
   Registered against .ch-path; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("section_path", function (W) {
  var pin   = document.getElementById('pathPin'),
      track = document.getElementById('pathTrack'),
      bar   = document.getElementById('pathBar'),
      sec   = document.querySelector('.section_path');

  if(W.reduced){
    /* Fall back to a normal horizontal scroll region. */
    pin.style.height = 'auto';
    track.style.overflowX = 'auto';
    track.style.width = '100%';
    return;
  }

  /* Horizontal travel = track width beyond the viewport. Recomputed on
     refresh so it stays correct across resize and font loading. */
  function distance(){ return Math.max(0, track.scrollWidth - window.innerWidth + 40); }

  /* On a wide enough monitor all four cards are on screen at once and there is
     nothing to travel. Pinning anyway held the section still for 0.6 of a
     viewport height -- about 1300px of dead scroll on a 4K display -- while the
     reader stared at a row that never moved. So above that width the chapter is
     an ordinary static row, and the cards reveal instead of scrubbing.
     The threshold is measured, not a breakpoint: it is simply whether the track
     overflows, which depends on the card clamp and the gutter as much as on the
     viewport. Rebuilt on resize because a window can cross it either way. */
  var built = null;

  function buildStatic(){
    sec.classList.add('is-static');
    gsap.set(track,{x:0});
    gsap.set(bar,{scaleX:0});
    gsap.utils.toArray('#pathTrack .path_card').forEach(function(card,i){
      gsap.from(card,{opacity:0,y:30,duration:.9,ease:'power3.out',delay:i*.07,
        scrollTrigger:{trigger:pin,start:'top 72%'}});
    });
  }

  function buildPinned(){
    sec.classList.remove('is-static');
    var tween = gsap.to(track,{
      x: function(){ return -distance(); },
      ease:'none',
      scrollTrigger:{
        trigger: pin,
        start:'top top',
        end: function(){ return '+=' + (distance() + window.innerHeight*0.6); },
        pin: true,
        scrub: .3,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        /* Refreshes AFTER Chapter 04 (refreshPriority 1), so this measures
           against a document that already includes that pin's spacer. */
        refreshPriority: 0,
        onUpdate: function(self){ gsap.set(bar,{scaleX:self.progress}); }
      }
    });

  /* Each card brightens its border as it reaches centre stage.

     The grayscale half of this only runs where the CSS applies grayscale in
     the first place, i.e. a fine pointer -- see 35-ch-path.css. Tweening
     `filter` is a main-thread PAINT animation, and on a phone it was repainting
     four images on every frame of the scrub. Nothing to un-grey on touch, so
     there is nothing to tween. */
  /* Runs on touch too now — see the note in css/35-ch-path.css. */
  var grey = function(card, on){
    gsap.to(card.querySelector('.path_image-wrapper img'),{filter:'grayscale('+(on?1:0)+')',duration:.6});
  };
  gsap.utils.toArray('#pathTrack .path_card').forEach(function(card){
    ScrollTrigger.create({
      trigger: card,
      containerAnimation: tween,
      start: 'left 72%',
      end: 'right 28%',
      onEnter:      function(){ gsap.to(card,{borderColor:'rgba(138,126,78,.55)',duration:.5}); grey(card,false); },
      onLeave:      function(){ gsap.to(card,{borderColor:'rgba(20,20,22,.13)',duration:.5}); },
      onEnterBack:  function(){ gsap.to(card,{borderColor:'rgba(138,126,78,.55)',duration:.5}); },
      onLeaveBack:  function(){ gsap.to(card,{borderColor:'rgba(20,20,22,.13)',duration:.5}); grey(card,true); }
    });
    gsap.fromTo(card.querySelector('.path_number'),{opacity:.35},{opacity:1,duration:.4,
      scrollTrigger:{trigger:card,containerAnimation:tween,start:'left 78%',toggleActions:'play none none reverse'}});
    });
  }

  /* THE MOBILE PATH — a native swipe, not a scrubbed pin.

     Pinning this chapter and driving the track's `x` from scroll costs a phone
     the entire section: measured at p50 33.3ms with 67% of frames over 32ms on
     a 6x-throttled CPU, i.e. a sustained 30fps, while the unpinned chapters on
     the same page sat at 16.7ms. The work is compositor-side and inherent to
     the effect -- 1.3s of Layerize and 1367 raster tasks in an 11s trace --
     so it does not optimise away: gating the grayscale filter, the one clearly
     wasteful paint in here, moved it 67.3% -> 61.5% and left p50 untouched.

     Scroll-snap hands the same left-to-right reading to the compositor. No pin,
     no scrub, no per-frame JS at all, and the momentum is the platform's own,
     which is why it feels better than anything this file could animate.

     Touch is the condition, not width: a narrow desktop window has the CPU and
     the mouse wheel for the pinned version, and a large tablet has neither. */
  var TOUCH = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

  function buildSwipe(){
    sec.classList.add('is-swipe');
    gsap.set(track,{x:0});
    gsap.set(bar,{scaleX:0});
    /* The bar still reports position, driven by the scroller rather than by a
       tween -- a passive scroll listener, not a rAF loop. */
    var onScroll = function(){
      var max = track.scrollWidth - track.clientWidth;
      gsap.set(bar,{scaleX: max > 0 ? track.scrollLeft / max : 0});
    };
    track.addEventListener('scroll', onScroll, {passive:true});
    onScroll();

    /* THE CARD REVEAL, restored for touch.

       The pinned build lights each card as it reaches centre stage -- gold
       border, the number up from 35%, the photo out of grayscale -- and all of
       it hangs off `containerAnimation`, which only exists when there IS a
       scrubbed tween. Dropping the pin dropped the animation with it, and the
       chapter went flat on phones while Webflow (still pinned there) kept it.

       An IntersectionObserver gives the same cue without the scrub. The root is
       the TRACK, the horizontal rootMargin narrows the trigger zone to the
       middle ~30% of it, and the class it toggles is animated by CSS
       transitions -- so this costs one callback per card per crossing instead
       of JS on every frame. That is the whole point: the swipe path exists
       because per-frame work on a phone is what caused the flicker, so the
       reveal must not reintroduce any.

       No fallback needed: IntersectionObserver predates every browser that can
       run ScrollSmoother, but guard anyway so an exotic engine degrades to
       "all cards lit" rather than none. */
    var cards = track.querySelectorAll('.path_card');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < cards.length; i++) cards[i].classList.add('is-live');
      return;
    }
    var io = new IntersectionObserver(function(entries){
      for (var i = 0; i < entries.length; i++) {
        entries[i].target.classList.toggle('is-live', entries[i].isIntersecting);
      }
    }, { root: track, rootMargin: '0px -35% 0px -35%', threshold: 0 });
    for (var c = 0; c < cards.length; c++) io.observe(cards[c]);
    /* gsap.context() reverts this build on resize; disconnect with it. */
    return function(){ io.disconnect(); };
  }

  function build(){
    if (built) built.revert();
    sec.classList.remove('is-swipe');
    /* Pinned on touch as well — the client's ask, and what Webflow does. The
       flicker that sent phones to `buildSwipe` came from ScrollSmoother forcing
       `pinType:'transform'`; the smoother is desktop-only now and the pin is
       native `position:fixed`. */
    built = gsap.context(distance() > 0 ? buildPinned : buildStatic);
  }
  build();

  /* A touch device never crosses back into the pinned build, and rebuilding on
     every address-bar show/hide is exactly the churn the swipe path exists to
     avoid -- so the resize watcher is desktop-only. */
  if (!TOUCH) {
    var t;
    window.addEventListener('resize', function(){
      clearTimeout(t);
      t = setTimeout(function(){
        var wants = distance() > 0;
        if (wants !== !sec.classList.contains('is-static')) build();
      }, 250);
    });
  }
});
