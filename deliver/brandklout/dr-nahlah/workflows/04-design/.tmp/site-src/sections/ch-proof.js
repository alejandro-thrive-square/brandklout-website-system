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
  /* The review wall is generated markup as of 2026-08-19, so it gets the kit's
     own stagger back. [data-rv="stagger"] on .rv-wall drives it; nothing needed
     here beyond letting that rule find it. */

  /* --- upgrade the cards to the LIVE feed, where the host permits it ---
     The client wants reviews that update the moment a patient leaves one, and
     the vendor's iframe does exactly that. It cannot run everywhere: Instatic
     publishes behind `frame-src 'none'` unless an operator widens it (see
     workflows/16-instatic-plugins). Rather than pick one platform and lose on
     the other, the generated cards ship as the content and this quietly swaps
     in the live widget wherever it actually loads.

     Success is judged on the vendor's own postMessage, not on the iframe's
     load event: a blocked frame still fires load (about:blank), so trusting
     that would leave an empty well exactly where the reviews should be. If no
     height arrives, everything added here is removed and the cards stay.

     THE VENDOR'S PARENT SCRIPT IS DELIBERATELY NOT LOADED. Its only job is to
     size the iframe from `lc.setHeight`, and we already receive that message
     ourselves — probe-widget-postmessage.mjs confirms the frame reports
     `{height: 1968}` with no parent script present at all. Loading it would
     mean granting `script-src https://reputationhub.site`, which lets that
     origin run arbitrary JavaScript against this document and its storage; a
     cross-origin iframe can do neither. So the widget is live on `frame-src`
     alone, and the script origin is never granted. Do not "fix" this by
     re-adding the script tag. */
  (function () {
    var slot = document.querySelector('.rv-live');
    var wall = document.querySelector('.rv-wall');
    if (!slot || !slot.dataset.widget) return;

    var widgetId = (slot.dataset.widget.match(/[?&]widgetId=([^&]+)/) || [])[1];
    var settled = false;

    var f = document.createElement('iframe');
    f.className = 'lc_reviews_widget';
    f.title = 'Patient reviews';
    f.src = slot.dataset.widget;
    f.setAttribute('frameborder', '0');
    f.setAttribute('scrolling', 'no');
    f.style.cssText = 'min-width:100%;width:100%';
    slot.appendChild(f);

    function accept() {
      if (settled) return;
      settled = true;
      slot.removeAttribute('data-probing');
      if (wall) wall.hidden = true;      /* keep it in the DOM: it is the copy
                                            a crawler without JS will read. */
    }
    function reject() {
      if (settled) return;
      settled = true;
      slot.remove();
    }

    window.addEventListener('message', function (e) {
      /* Parse first: a malformed origin on some unrelated message must not throw
         out of the listener and take the later, real one with it. */
      var host;
      try { host = new URL(e.origin).hostname } catch (_) { return }
      if (!/reputationhub\.site$/.test(host)) return;
      var name = e.data && e.data[0], data = e.data && e.data[1];
      if (name !== 'lc.setHeight') return;
      if (widgetId && data && data.widgetId && data.widgetId !== widgetId) return;
      /* The frame keeps reporting as its content reflows, so height is applied on
         every message, not only the one that settles the swap. */
      var h = data && parseInt(data.height, 10);
      if (h > 0) f.style.height = h + 'px';
      accept();
    });

    /* The widget renders server-side and reports within a second or two on a
       normal connection. Eight is generous, and the cost of being wrong is
       only that the visitor keeps the static cards. */
    setTimeout(reject, 8000);
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
