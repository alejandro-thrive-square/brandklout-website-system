/* =============================================================================
   SECTION: video-library
   Registered against .vl-grid, so it only runs on the page that has one, and
   registered with WZ.dom rather than WZ.section: the queue is only flushed once
   ScrollSmoother exists, so if GSAP ever fails to load a QUEUED click handler
   would never attach and every film on the page would be dead. Playing a video
   is not decoration.

   Click-to-play: the card is a facade (YouTube thumbnail + play button) until
   someone asks for the film, then it is replaced in place by a real iframe with
   autoplay=1. Fourteen eager embeds would cost about a megabyte and fourteen
   third-party connections before anyone watches anything.

   The swap is one-way and the node is replaced, so a second click cannot stack
   two players, and there is nothing to tear down on the way out.
   ============================================================================= */
WZ.dom("vl-grid", function () {
  var grid = document.querySelector('.vl-grid');
  if (!grid) return;

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.vl-card');
    if (!card || !grid.contains(card)) return;
    var id = card.getAttribute('data-yt');
    if (!id) return;

    var shot = card.querySelector('.vl-shot');
    var frame = document.createElement('div');
    frame.className = 'vl-frame';
    var f = document.createElement('iframe');
    /* autoplay only because this IS the click that asked for it. */
    f.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
    f.title = card.querySelector('.vl-title').textContent.trim();
    f.setAttribute('allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    f.setAttribute('allowfullscreen', '');
    frame.appendChild(f);

    /* The <button> becomes a plain container: a button that now holds a video
       player is no longer a button, and leaving it as one strands a screen
       reader on a control that does nothing. */
    var open = document.createElement('div');
    open.className = 'vl-card';
    open.appendChild(frame);
    open.appendChild(card.querySelector('.vl-title'));
    card.replaceWith(open);
    if (shot) shot.remove();
  });
});
