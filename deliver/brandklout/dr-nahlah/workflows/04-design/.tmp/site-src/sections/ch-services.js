/* =============================================================================
   SECTION: ch-services                                          BugHerd pin #8
   -----------------------------------------------------------------------------
   "On desktop I want to have a hover effect with an image showing following the
   cursor and on mobile and tablet the image should be present on the card with
   no hover effect."

   ONE shared floating element that swaps what it shows per hovered card — not
   eleven absolutely-positioned images. Eleven would mean eleven layers, eleven
   more nodes in a section that is deliberately a typographic index, and eleven
   images fetched by a visitor who may never reach the chapter.

   Guarded on `#svcGrid` rather than `.ch-services` so the module travels with
   the grid and costs nothing on the 25 pages that do not carry it.
   ============================================================================= */
WZ.section('section_services', '#svcGrid', function (W) {
  /* Reduced motion keeps the image, and drops the chase. Returning here means
     `.wz-svfollow` is never set, so the card's own image stays laid out — the
     same fallback a coarse pointer gets. That is deliberately NOT the magnetic
     buttons' behaviour (js/90-boot.js), which simply returns and loses nothing;
     here returning without the class would leave a desktop with no image at
     all. */
  if (W.reduced) return;

  /* POINTER CAPABILITY, NOT WIDTH. `.wz-fine` is set from
     `(hover:hover) and (pointer:fine)` in js/90-boot.js and is how every other
     hover on this site is gated. A narrow desktop window keeps the follower; a
     1024px tablet does not. Width would have got both of those wrong. */
  if (!document.documentElement.classList.contains('wz-fine')) return;

  var grid  = document.getElementById('svcGrid');
  var cards = [].slice.call(grid.querySelectorAll('.services_card'));
  var shots = cards.map(function (c) { return c.querySelector('.services_image-wrapper img'); });
  if (!shots.some(Boolean)) return;   /* markup without images: leave the cards alone */

  /* --- the element ------------------------------------------------------- */
  var el = document.createElement('div');
  el.className = 'services_cursor-image';
  el.setAttribute('aria-hidden', 'true');
  var img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  el.appendChild(img);

  /* APPENDED TO <body>, OUTSIDE #smooth-wrapper.
     ScrollSmoother translates #smooth-content, and a transformed ancestor makes
     `position:fixed` resolve against THAT element instead of the viewport — the
     plate would scroll away with the page and drift further from the cursor the
     further down you were. Same reason the nav and the drawer live out here
     (css/02-base.css, "fixed UI lives OUTSIDE the wrapper"). */
  document.body.appendChild(el);

  /* Only now: the class that takes the in-card copies out of the flow. If
     anything above returned, or GSAP never loaded and the queue was never
     flushed, this never runs and the cards keep their images. */
  document.documentElement.classList.add('wz-svfollow');

  /* --- which variant to ask for ------------------------------------------
     `base.image` publishes a `srcset` of `-w<N>.webp` variants beside the
     original. The follower is at most 320 CSS px, so the original (up to
     3000px on the smile-makeover card) is 10x more image than it can show.
     Pick the smallest variant that still covers the plate at this DPR, and
     fall back to `src` when there is no srcset — the local build has none. */
  var want = Math.round(el.getBoundingClientRect().width * (window.devicePixelRatio || 1));
  function source (im) {
    var set = im.getAttribute('srcset');
    if (!set) return im.src;
    var best = null;
    set.split(',').forEach(function (part) {
      var m = /^\s*(\S+)\s+(\d+)w\s*$/.exec(part);
      if (!m) return;
      var w = +m[2];
      if (w >= want && (!best || w < best.w)) best = { url: m[1], w: w };
    });
    return best ? best.url : im.src;
  }
  var urls = shots.map(function (im) { return im ? source(im) : null; });

  /* --- motion -------------------------------------------------------------
     quickTo, the same primitive the magnetic buttons use: one pre-built tween
     per property, re-targeted on each move. The .55s power3 is the lag — the
     plate trails the cursor rather than being pinned to it, which is the whole
     effect. A pointermove handler that called gsap.to() would build a tween per
     event instead. */
  var xTo = gsap.quickTo(el, 'x', { duration: .55, ease: 'power3' });
  var yTo = gsap.quickTo(el, 'y', { duration: .55, ease: 'power3' });
  gsap.set(el, { xPercent: -50, yPercent: -50, scale: .94 });

  var open = false;
  var token = 0;          /* invalidates a decode that finished too late */
  var warmed = false;

  /* Preload once, and only for a visitor who actually reaches Chapter 07 — the
     ScrollTrigger below fires this the moment the section enters the viewport,
     which is the earliest honest signal and is well before a cursor can travel
     to a card. `pointerenter` on the grid is the backstop for a pointer that
     arrives without a scroll (an anchor jump, a restored scroll position).

     LOW priority, because these eleven are speculative and must not compete
     with the page's real work — or with the one image `show()` is waiting on.
     That race is not theoretical: warming on grid-enter alone put all eleven in
     flight in the same event burst as the first hover, and the wanted one came
     back after the plate had given up waiting. */
  function warm () {
    if (warmed) return;
    warmed = true;
    urls.forEach(function (u) {
      if (!u) return;
      var p = new Image();
      p.fetchPriority = 'low';
      p.decoding = 'async';
      p.src = u;
    });
  }

  function place (e, jump) {
    if (jump) { xTo(e.clientX, e.clientX); yTo(e.clientY, e.clientY); }
    else { xTo(e.clientX); yTo(e.clientY); }
  }

  function show (url, e) {
    var mine = ++token;
    place(e, !open);
    /* Decode BEFORE swapping. Assigning a cold src straight onto the visible
       element blanks the plate for a frame or two on the first hover of each
       card; loading into a detached Image first means the swap is a cache hit
       and the previous picture holds until the new one is ready. */
    var pre = new Image();
    pre.fetchPriority = 'high';   /* jump the queue ahead of warm()'s eleven */
    var swap = function () {
      if (mine !== token) return;
      img.src = url;
      open = true;
      gsap.to(el, { autoAlpha: 1, scale: 1, duration: .4, ease: 'power2.out', overwrite: 'auto' });
    };
    pre.onload = swap;
    pre.src = url;
    if (pre.complete) swap();
  }

  function hide () {
    token++;
    if (!open) return;
    open = false;
    gsap.to(el, { autoAlpha: 0, scale: .94, duration: .3, ease: 'power2.in', overwrite: 'auto' });
  }

  grid.addEventListener('pointerenter', warm);
  grid.addEventListener('pointermove', function (e) { if (open) place(e); });
  grid.addEventListener('pointerleave', hide);

  cards.forEach(function (card, i) {
    if (!urls[i]) return;
    card.addEventListener('pointerenter', function (e) { show(urls[i], e); });
  });

  /* Two jobs, no scrub and no per-frame work — four callbacks at the edges.
     Entering starts the preload. Leaving closes the plate: `pointerleave` does
     fire when the smoother slides the grid out from under a stationary cursor,
     because the browser re-runs hit-testing on the transform, but the plate is
     fixed to the VIEWPORT and would be left hanging over the next chapter if it
     ever did not. */
  ScrollTrigger.create({
    trigger: '#services', start: 'top bottom', end: 'bottom top',
    onEnter: warm, onEnterBack: warm, onLeave: hide, onLeaveBack: hide
  });
});
