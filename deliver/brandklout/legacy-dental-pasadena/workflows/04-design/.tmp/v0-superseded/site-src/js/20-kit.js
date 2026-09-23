/* ==========================================================================
   THE KIT — behaviour shared by all three pages. Anything used on more than
   one page lives here; anything used once lives in sections/.

   Everything registers through WZ, so a module runs only when its markup is
   present. Modules that are plain DOM work register with WZ.dom so they still
   attach if GSAP fails to load, because the queue is only flushed once
   ScrollSmoother exists.
   ========================================================================== */

/* --- headline reveals -----------------------------------------------------
   Every [data-split] element is split into masked lines and revealed on
   arrival. Masked, not faded: the line rises out of its own clipping box,
   which is what makes it read as typeset rather than as a fade-in. ------- */
WZ.section('split', '[data-split]', function (W) {
  gsap.utils.toArray('[data-split]').forEach(function (el) {
    if (W.reduced) { el.style.visibility = 'visible'; return; }
    var tween;
    W.splitLines(el, function (self) {
      if (tween) tween.kill();
      el.style.visibility = 'visible';
      tween = gsap.from(self.lines, {
        yPercent: 118, duration: 1.05, ease: 'power4.out', stagger: 0.075,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true }
      });
      return tween;
    });
    /* SplitText absent, or it threw: the copy still has to be readable. */
    if (!window.SplitText) el.style.visibility = 'visible';
  });
});

/* --- generic arrival for anything marked hidden but not split ------------- */
WZ.section('anim-hide', '[data-anim="hide"]', function (W) {
  gsap.utils.toArray('[data-anim="hide"]:not([data-split])').forEach(function (el) {
    el.style.visibility = 'visible';
    if (W.reduced) return;
    gsap.from(el, {
      opacity: 0, y: 28, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
});

/* --- the marquee ----------------------------------------------------------
   Velocity-reactive rather than a fixed loop: the strip's speed and direction
   answer the scroll, so it reads as a surface that responds to you. The base
   drift keeps it alive when the page is still. ---------------------------- */
WZ.section('marquee', '#marqueeRow', function (W) {
  var row = document.getElementById('marqueeRow');
  if (W.reduced) return;

  var half = row.scrollWidth / 2, x = 0, base = 0.35, boost = 0;
  var setX = gsap.quickSetter(row, 'x', 'px');

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      /* getVelocity is px/sec and signed, so the strip also reverses when the
         reader scrolls back up. Clamped so a flick does not fling it. */
      boost = gsap.utils.clamp(-38, 38, self.getVelocity() / 90);
    }
  });

  gsap.ticker.add(function () {
    x -= base + boost * 0.35;
    boost *= 0.92;
    /* Wrap on the half-width: the row holds the same run of words twice, so
       resetting at half is seamless. */
    if (x <= -half) x += half;
    if (x > 0) x -= half;
    setX(x);
  });
});

/* --- video tiles ----------------------------------------------------------
   Each tile is a facade. The Vimeo iframe is created on click, so six
   third-party players never touch the critical path, and a page with a form
   on it does not spend its first second booting other people's script. ---- */
WZ.dom('vtile', '.vtile', function () {
  document.querySelectorAll('.vtile').forEach(function (tile) {
    tile.addEventListener('click', function () {
      if (tile.classList.contains('is-live')) return;
      var id = tile.getAttribute('data-vimeo');
      if (!id) return;
      var f = document.createElement('iframe');
      f.src = 'https://player.vimeo.com/video/' + id + '?autoplay=1&title=0&byline=0&portrait=0';
      f.title = tile.getAttribute('aria-label') || 'Patient video';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.setAttribute('allowfullscreen', '');
      tile.appendChild(f);
      tile.classList.add('is-live');
    });
  });
});

/* --- accordion ------------------------------------------------------------
   Height is animated rather than toggled, and only one panel is open at a
   time, so the FAQ never jumps the page under the reader's cursor. -------- */
WZ.dom('acc', '.acc', function (W) {
  document.querySelectorAll('.acc').forEach(function (acc) {
    var items = acc.querySelectorAll('.acc__item');
    items.forEach(function (item) {
      var btn = item.querySelector('.acc__btn'),
          panel = item.querySelector('.acc__panel'),
          inner = panel.firstElementChild;

      btn.addEventListener('click', function () {
        var open = item.classList.contains('is-open');

        items.forEach(function (other) {
          if (other === item || !other.classList.contains('is-open')) return;
          other.classList.remove('is-open');
          other.querySelector('.acc__btn').setAttribute('aria-expanded', 'false');
          var op = other.querySelector('.acc__panel');
          if (window.gsap && !W.reduced) gsap.to(op, { height: 0, duration: .45, ease: 'power2.inOut' });
          else op.style.height = '0px';
        });

        item.classList.toggle('is-open', !open);
        btn.setAttribute('aria-expanded', String(!open));

        var to = open ? 0 : inner.offsetHeight;
        if (window.gsap && !W.reduced) {
          gsap.to(panel, {
            height: to, duration: .5, ease: 'power2.inOut',
            /* auto after opening, so a panel reflows if the window resizes
               while it is open rather than clipping its own last line. */
            onComplete: function () { if (!open) panel.style.height = 'auto'; }
          });
        } else {
          panel.style.height = open ? '0px' : 'auto';
        }
      });
    });
  });
});

/* --- the sticky mobile call bar -------------------------------------------
   Held back until the hero has left, so it never sits on top of the hero's
   own call to action, and hidden again over the form card so it cannot cover
   the submit button. ------------------------------------------------------ */
WZ.section('callbar', '#callbar', function () {
  var bar = document.getElementById('callbar');
  ScrollTrigger.create({
    start: 'top -60%', end: 'max',
    onToggle: function (self) { bar.classList.toggle('is-on', self.isActive); }
  });
  var form = document.getElementById('consultForm');
  if (form) {
    ScrollTrigger.create({
      trigger: form, start: 'top bottom', end: 'bottom top',
      onToggle: function (self) { if (self.isActive) bar.classList.remove('is-on'); }
    });
  }
});

/* --- the reviews seam -----------------------------------------------------
   The practice's Elfsight widget replaces the placeholder div with its own
   content once it boots. Watch for that and drop the fallback; locally the
   widget never loads and the fallback is what shows, which is the point of
   having one. ------------------------------------------------------------ */
WZ.dom('reviews-slot', '.reviews-slot', function () {
  document.querySelectorAll('.reviews-slot').forEach(function (slot) {
    var app = slot.querySelector('[class^="elfsight-app-"]');
    if (!app) return;
    var seen = new MutationObserver(function () {
      if (app.children.length) { slot.classList.add('is-live'); seen.disconnect(); }
    });
    seen.observe(app, { childList: true });
  });
});

/* --- the year in the footer ---------------------------------------------- */
WZ.dom('year', '[data-year]', function () {
  var y = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = y; });
});
