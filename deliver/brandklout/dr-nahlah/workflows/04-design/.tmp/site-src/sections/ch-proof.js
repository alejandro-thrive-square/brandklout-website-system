/* =============================================================================
   SECTION: ch-proof
   Registered against .ch-proof; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-proof", function (W) {
  /* Resolved by CLASS with an id fallback, and every use guarded. Instatic's
     HTML importer maps <video> onto its own Video module, which has no
     htmlAttributes escape hatch, so the `id` is dropped on import: the film
     came through fine but `getElementById` returned null and the first
     onEnter threw, taking the rest of the chapter's ScrollTriggers with it.
     A class is data the importer keeps, so this survives the trip. */
  var film = document.querySelector('.pf-film video') || document.getElementById('film');

  /* Play only while on screen — saves battery and avoids background decode. */
  ScrollTrigger.create({
    trigger:'#proofFilm', start:'top 90%', end:'bottom 10%',
    onEnter:    function(){ if(!film) return; var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
    onEnterBack:function(){ if(!film) return; var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
    onLeave:    function(){ if(film) film.pause(); },
    onLeaveBack:function(){ if(film) film.pause(); }
  });

  if(W.reduced){ gsap.set('#storyShot',{clipPath:'inset(0 0 0% 0)'}); return; }

  if(film) gsap.fromTo(film,{scale:1.18},{scale:1.04,ease:'none',
    scrollTrigger:{trigger:'#proofFilm',start:'top bottom',end:'bottom top',scrub:.8}});

  W.splitLines(document.getElementById('filmTitle'), function(self){
    return gsap.from(self.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
      scrollTrigger:{trigger:'#proofFilm',start:'top 55%'}});
  });
  gsap.from('#filmSub',{opacity:0,y:20,duration:.9,ease:'power3.out',
    scrollTrigger:{trigger:'#proofFilm',start:'top 50%'}});

  /* Image wipes open from the bottom, photo counter-drifts inside it. */
  gsap.to('#storyShot',{clipPath:'inset(0 0 0% 0)',duration:1.3,ease:'power4.inOut',
    scrollTrigger:{trigger:'#storyShot',start:'top 82%'}});
  gsap.fromTo('#storyImg',{scale:1.24,yPercent:-6},{scale:1.06,yPercent:6,ease:'none',
    scrollTrigger:{trigger:'#storyShot',start:'top bottom',end:'bottom top',scrub:.8}});
  gsap.from('#storyCopy > *',{opacity:0,y:26,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#storyCopy',start:'top 80%'}});

  /* Reviews: header, then cards deal in on a slight diagonal. */
  gsap.from('#reviews .rv-head > *',{opacity:0,y:24,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#reviews',start:'top 80%'}});
  /* The six hand-built cards were replaced by the practice's review widget on
     2026-08-18, so the card stagger that used to live here has nothing to
     animate and is gone with them. The embed arrives in its own iframe and
     brings its own entrance. */

  /* --- rehydrate the review embed on hosts that strip iframes ---
     Instatic's HTML importer has an allowlist for <iframe>: the YouTube frame
     above comes through untouched, but the ReputationHub widget is rewritten
     into a <div> that keeps every attribute, `src` included, and renders
     nothing. Rather than hand-authoring the frame a second time in Instatic's
     idiom, the element is rebuilt from the attributes the importer preserved,
     and the vendor's resizer is re-added because the local <script> tag does
     not survive the same trip. A no-op wherever the iframe arrived intact. */
  (function(){
    var box = document.querySelector('.rv-embed');
    if(!box || box.querySelector('iframe')) return;
    var stub = box.querySelector('[src]');
    if(!stub) return;
    var f = document.createElement('iframe');
    f.className = stub.className || 'lc_reviews_widget';
    f.title = stub.getAttribute('title') || 'Patient reviews';
    f.src = stub.getAttribute('src');
    f.setAttribute('frameborder','0');
    f.setAttribute('scrolling','no');
    f.style.cssText = 'min-width:100%;width:100%';
    stub.replaceWith(f);
    var SRC = 'https://reputationhub.site/reputation/assets/review-widget.js';
    if(!document.querySelector('script[src="' + SRC + '"]')){
      var sc = document.createElement('script'); sc.src = SRC; sc.async = true;
      document.body.appendChild(sc);
    }
    /* Instatic's Content-Security-Policy does not list reputationhub.site in
       frame-src, so on that host the frame is blocked and would leave a 520px
       empty well where the reviews should be. If nothing has reported a height
       within 8s, take the frame back out: a collapsed box is honest, an empty
       one looks broken. Add the host to the CSP and this stops firing. */
    setTimeout(function(){
      if(!f.isConnected) return;
      if(f.getAttribute('height') || f.style.height) return;
      f.remove();
    }, 8000);
  })();

  /* Aggregate score counts up like the other stats. The target is READ FROM THE
     MARKUP rather than written here as well. It was hardcoded to 5.0, so when
     the client corrected the rating the counter silently animated the new number
     straight back to the old one and the page showed 5.0 whatever the HTML
     said. One number, one home. */
  var sc = document.getElementById('rvScore');
  if(sc){
    var target = parseFloat(sc.textContent);
    if(!isNaN(target)){
      var o = {v:0};
      gsap.to(o,{v:target,duration:1.6,ease:'power2.out',
        onUpdate:function(){ sc.textContent = o.v.toFixed(1); },
        scrollTrigger:{trigger:'#reviews',start:'top 78%'}});
    }
  }
});
