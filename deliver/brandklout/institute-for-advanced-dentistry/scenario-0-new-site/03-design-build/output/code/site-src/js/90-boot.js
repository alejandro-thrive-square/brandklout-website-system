/* Boot: init every module, then (motion allowed) the smoother, the faces, and the motion phases in file order:
   motion (sections, pins first, top to bottom), late (things that must be created after every pin). */
(function () {
  'use strict';
  var IFA = window.IFA, $ = IFA.$, $$ = IFA.$$;

  IFA.mods.forEach(function (m) { if (m.init) m.init(); });
  if (!IFA.motion) { IFA.unveil(); return; }

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
  gsap.defaults({ ease: 'expo.out', duration: 1.1 });

  if (IFA.fine && window.innerWidth > 991 && !/[?&]smooth=off/.test(location.search)) {
    IFA.smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, effects: false, normalizeScroll: false });
  }

  var rt = null;
  IFA.refreshSoon = function () { clearTimeout(rt); rt = setTimeout(function () { ScrollTrigger.refresh(); IFA.queueChrome(); }, 200); };

  /* document.fonts.ready resolves before the faces are parsed; ask for the faces by name. */
  var faces = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('300 1em Jost'), document.fonts.load('italic 400 1em "Instrument Serif"'), document.fonts.load('400 1em "IBM Plex Mono"')])
    : Promise.resolve();
  var started = false;
  function start() { if (started) return; started = true; build(); }
  faces.then(start, start);
  setTimeout(start, 2500);

  function build() {
    var ctx = { mm: gsap.matchMedia() };
    IFA.mods.forEach(function (m) { if (m.motion) m.motion(ctx); });
    IFA.mods.forEach(function (m) { if (m.late) m.late(ctx); });
    IFA.unveil();

    /* ---- pointer craft ---- */
    if (IFA.fine) {
      $$('[data-magnetic]').forEach(function (el) {
        var mx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          mx((e.clientX - r.left - r.width / 2) * .28); my((e.clientY - r.top - r.height / 2) * .38);
        });
        el.addEventListener('pointerleave', function () { mx(0); my(0); });
      });
      $$('.card__btn, [data-tilt]').forEach(function (el) {
        var rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3' });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - .5) * 12); rx(-((e.clientY - r.top) / r.height - .5) * 10);
        });
        el.addEventListener('pointerleave', function () { rx(0); ry(0); });
      });
    }

    /* A change in page height moves every trigger after it; re-measure when it happens. */
    var lastH = 0;
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        var h = $('#smooth-content').offsetHeight;
        if (Math.abs(h - lastH) < 4) return;
        lastH = h;
        IFA.refreshSoon();
      }).observe($('#smooth-content'));
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    ScrollTrigger.addEventListener('refresh', IFA.queueChrome);
    if (IFA.smoother) gsap.ticker.add(IFA.queueChrome);
  }
})();
