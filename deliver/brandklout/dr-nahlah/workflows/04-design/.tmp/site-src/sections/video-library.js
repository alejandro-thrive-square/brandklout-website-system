/* =============================================================================
   SECTION: video-library
   Registered against .vl-card, so it only runs on a page that has a film
   facade, and registered with WZ.dom rather than WZ.section: the queue is only
   flushed once ScrollSmoother exists, so if GSAP ever fails to load a QUEUED
   click handler would never attach and every film on the page would be dead.
   Playing a video is not decoration.

   Click-to-play: the card is a facade (YouTube thumbnail + play button) until
   someone asks for the film, then it is replaced in place by a real iframe with
   autoplay=1. Fourteen eager embeds would cost about a megabyte and fourteen
   third-party connections before anyone watches anything.

   BOUND ON THE DOCUMENT, NOT ON THE FIRST GRID (2026-09-18). The first version
   did `document.querySelector('.vl-grid')` and listened there, which worked on
   the video library, where there is one grid, and silently left every card
   outside that first grid dead: the ads landing pages carry a `.vl-grid` in
   the differentiators, a lone card in the closer and, on the consultation
   pages, a grid under a story row. One listener on the document covers a card
   wherever it is, with no per-grid registration to forget.

   The swap is one-way and the node is replaced, so a second click cannot stack
   two players, and there is nothing to tear down on the way out.
   ============================================================================= */
WZ.dom("vl-card", function () {
  if (!document.querySelector('.vl-card[data-yt]')) return;

  function cardOf(target) {
    var card = target && target.closest ? target.closest('.vl-card') : null;
    return card && card.getAttribute('data-yt') ? card : null;
  }

  /* role="button" is a promise to behave like one, so Enter and Space have to
     be wired by hand. A <button> would give this for free, but Instatic's
     importer flattens a button's children and the card would lose its
     thumbnail; see gen-videos.mjs. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var card = cardOf(e.target);
    if (!card) return;
    e.preventDefault();
    card.click();
  });

  document.addEventListener('click', function (e) {
    var card = cardOf(e.target);
    if (!card) return;
    var id = card.getAttribute('data-yt');

    var shot = card.querySelector('.vl-shot');
    var frame = document.createElement('div');
    frame.className = 'vl-frame';
    var f = document.createElement('iframe');
    /* autoplay only because this IS the click that asked for it. */
    f.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
    var title = card.querySelector('.vl-title');
    f.title = title ? title.textContent.trim() : 'Video';
    f.setAttribute('allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    f.setAttribute('allowfullscreen', '');
    frame.appendChild(f);

    /* Once it holds a player the card is no longer a control, so the button
       role, the tab stop and the label all come off. Leaving them strands a
       screen reader on something that announces as a button and does nothing. */
    var open = document.createElement('div');
    open.className = 'vl-card';
    open.appendChild(frame);
    if (title) open.appendChild(title);
    card.replaceWith(open);
    if (shot) shot.remove();
  });
});
