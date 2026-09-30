/* ==========================================================================
   THE PAID-TRAFFIC SET — motion for the shapes in lib/lp.mjs (css/60-lp.css).
   The options, the method and the rooms pin and scrub through the site's own
   blocks; these arrive, and the journey's line is drawn by the scroll.

   One rule the form imposes: NOTHING here pins, moves or re-parents .lp-card
   or anything above it. The Go High Level form is an iframe, and every DOM
   move reloads it. The card is only ever faded.
   ========================================================================== */

/* an opening: tag, split headline, then the rest in order (hero, consultation, thank you) */
function lpOpen(sec, W) {
  var hides = sec.querySelectorAll('[data-anim="hide"]');
  var show = function (el) { el.style.visibility = 'visible'; };
  if (W.reduced) { hides.forEach(show); return; }
  var title = sec.querySelector('.lp-title'), tag = sec.querySelector('.chapter-tag');
  var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  if (tag) {
    tl.add(function () { show(tag); }, .2).from(tag, { x: -24, opacity: 0, duration: .9 }, .2);
    var bar = tag.querySelector('i');
    if (bar) tl.from(bar, { scaleX: 0, duration: 1 }, .3);
  }
  var split = W.splitLines(title, function (self) {
    show(title);
    return gsap.from(self.lines, { yPercent: 115, duration: 1.2, ease: 'power4.out', stagger: .1, delay: .35 });
  });
  if (!split) show(title);
  var at = .8;
  hides.forEach(function (el) {
    if (el === tag || el === title) return;
    var card = el.classList.contains('lp-hero-form');
    tl.add(function () { show(el); }, at).from(el, card ? { opacity: 0, duration: 1.1 } : { y: 22, opacity: 0, duration: .9 }, at);
    at += .12;
  });
}

WZ.section('lp-hero', function (W) {
  var sec = document.querySelector('.lp-hero'), film = sec.querySelector('.lp-film');
  if (film) { film.load && film.load(); film.play && film.play().catch(function () {}); }
  lpOpen(sec, W);
  if (W.reduced) return;
  if (film) {
    gsap.fromTo(film, { scale: 1.16 }, { scale: 1.04, duration: 2.6, ease: 'power2.out' });
    gsap.to(film, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
  }
  gsap.from(sec.querySelectorAll('.lp-creds li'), { y: 24, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, delay: 1.4 });
});
WZ.section('lp-cz', function (W) { lpOpen(document.querySelector('.lp-cz'), W); });
WZ.section('lp-ty', function (W) {
  var sec = document.querySelector('.lp-ty');
  lpOpen(sec, W);
  if (W.reduced) return;
  var shot = sec.querySelector('.lp-ty-shot');
  if (shot) {
    gsap.to(shot, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'power4.inOut', delay: .35 });
    var im = shot.querySelector('.par');
    if (im) gsap.fromTo(im, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
  }
});

/* the prototype form: until the campaign's Go High Level form is embedded, a submit shows the
   reviewer the next page of the flow. The Embed block has no <form>, so this is a no-op then. */
WZ.dom('lp-proto', '.lp-proto', function () {
  document.querySelectorAll('.lp-slot').forEach(function (slot) {
    var form = slot.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var next = slot.getAttribute('data-lp-next');
      if (!next) return;
      window.location.href = next + (/\.html$/.test(window.location.pathname) ? '.html' : '');
    });
  });
});

/* before / after: drag or hover to compare; it sweeps once on its own as it arrives */
WZ.dom('lp-ba', '.lp-ba', function (W) {
  document.querySelectorAll('.lp-ba').forEach(function (fig) {
    var stage = fig.querySelector('.lp-ba-stage'), after = fig.querySelector('.lp-ba-after'), handle = fig.querySelector('.lp-ba-handle');
    var held = false, touched = false;
    var set = function (pct) {
      pct = Math.max(2, Math.min(98, pct));
      after.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      handle.style.left = pct + '%';
    };
    var move = function (e) { var r = stage.getBoundingClientRect(); touched = true; set(((e.clientX - r.left) / r.width) * 100); };
    stage.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || held) move(e); });
    stage.addEventListener('pointerdown', function (e) { held = true; stage.setPointerCapture && stage.setPointerCapture(e.pointerId); move(e); });
    stage.addEventListener('pointerup', function () { held = false; });
    stage.addEventListener('pointercancel', function () { held = false; });
    /* the sweep is started by the journey chapter, once the smoother exists */
    fig.lpSweep = function () {
      var o = { p: 96 };
      gsap.to(o, { p: 50, duration: 1.8, ease: 'power3.inOut', onUpdate: function () { if (!touched) set(o.p); },
        scrollTrigger: { trigger: fig, start: 'top 75%', once: true } });
    };
  });
});

WZ.section('lp-journey', function (W) {
  var sec = document.querySelector('.lp-journey');
  wzTagIn(sec);
  wzLinesIn(sec.querySelector('.h2'));
  if (W.reduced) { sec.querySelectorAll('.lp-beats-line i').forEach(function (i) { i.style.transform = 'none'; }); return; }
  var ba = sec.querySelector('.lp-ba');
  if (ba && ba.lpSweep) ba.lpSweep();
  gsap.from(ba, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
  gsap.from(sec.querySelectorAll('.lp-jr-head .lead, .lp-jr-who'), { y: 20, opacity: 0, duration: .9, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
  sec.querySelectorAll('.lp-jr-list').forEach(function (list, i) {
    gsap.from(list, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', delay: i * .12, scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
    gsap.from(list.querySelectorAll('li'), { x: -12, opacity: 0, duration: .6, ease: 'power2.out', stagger: .08, delay: .25 + i * .12, scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
  });
  /* the four beats: the rule is drawn by the scroll, each beat arrives as the rule reaches it */
  var beats = sec.querySelector('.lp-beats'), line = sec.querySelector('.lp-beats-line i'), items = sec.querySelectorAll('.lp-beat');
  if (beats && line) gsap.to(line, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: beats, start: 'top 80%', end: 'bottom 60%', scrub: .4 } });
  gsap.from(items, { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .14, scrollTrigger: { trigger: beats, start: 'top 80%', once: true } });
});

WZ.section('lp-why', function (W) {
  var sec = document.querySelector('.lp-why');
  wzTagIn(sec);
  wzLinesIn(sec.querySelector('.h2'));
  wzWipes(sec);
  if (W.reduced) return;
  gsap.from(sec.querySelector('.lp-why-head .lead'), { y: 20, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
  gsap.from(sec.querySelectorAll('.lp-reason'), { y: 36, opacity: 0, duration: .9, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: sec.querySelector('.lp-reasons'), start: 'top 82%', once: true } });
});

WZ.section('lp-proof', function (W) {
  var sec = document.querySelector('.lp-proof');
  wzTagIn(sec);
  wzLinesIn(sec.querySelector('.h2'));
  wzWipes(sec);
  if (W.reduced) return;
  gsap.from(sec.querySelectorAll('.lp-quote'), { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: sec.querySelector('.lp-quotes'), start: 'top 85%', once: true } });
  gsap.from(sec.querySelectorAll('.lp-creds li'), { y: 24, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: sec.querySelector('.lp-creds'), start: 'top 90%', once: true } });
});

WZ.section('lp-cards', function (W) {
  document.querySelectorAll('.lp-cards').forEach(function (sec) {
    wzTagIn(sec);
    wzLinesIn(sec.querySelector('.h2'));
    if (W.reduced) return;
    gsap.from(sec.querySelectorAll('.lp-cardx'), { y: 36, opacity: 0, duration: .9, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: sec.querySelector('.lp-cards-grid'), start: 'top 85%', once: true } });
  });
});

WZ.section('lp-final', function (W) {
  var sec = document.querySelector('.lp-final');
  wzTagIn(sec);
  wzLinesIn(sec.querySelector('.h2'));
  if (W.reduced) return;
  var bg = sec.querySelector('.lp-final-bg img');
  if (bg) gsap.fromTo(bg, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from(sec.querySelectorAll('.lp-final-in .lead, .lp-actions, .lp-final-facts li'), { y: 22, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
  gsap.from(sec.querySelectorAll('.lp-creds li'), { y: 24, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: sec.querySelector('.lp-creds'), start: 'top 92%', once: true } });
});
