WZ.add(function (W) {
  var kit = document.body;
  if (!W.reduced) kit.classList.add('wz-kit');

  /* Before/after sliders work with or without GSAP — they are content, not motion. */
  document.querySelectorAll('.before-after_component').forEach(function (ba) {
    var range = ba.querySelector('input[type=range]');
    /* Instatic maps every <input> onto its own form-control module, which only
       knows type="text": the three comparison sliders arrive as text boxes
       showing "50", with the aria-label dropped. Coerce the one input this
       component owns back to a range before wiring it, so the slider works on
       any host that rewrites input types. No-op where it arrived intact. */
    if (!range) {
      var alt = ba.querySelector('input');
      if (alt && alt.getAttribute('max') === '100') {
        alt.type = 'range';
        if (!alt.getAttribute('aria-label')) alt.setAttribute('aria-label', 'Reveal the after photograph');
        range = alt;
      }
    }
    if (!range) return;
    var paint = function () { ba.style.setProperty('--pos', range.value + '%'); };
    range.addEventListener('input', paint);
    paint();
  });

  if (W.reduced) return;

  /* One reveal rule for the whole kit: anything tagged data-rv rises into place
     when it crosses 86% of the viewport. data-rv="stagger" walks its children. */
  gsap.utils.toArray('[data-rv]').forEach(function (el) {
    // A nested data-rv is animated twice — once as its parent's stagger child
    // and once in its own right — and the two `from` tweens fight over opacity,
    // which can strand it invisible. The outer reveal already covers it.
    if (el.parentElement && el.parentElement.closest('[data-rv]')) return;
    var mode = el.getAttribute('data-rv');
    var targets = mode === 'stagger' ? el.children : el;
    gsap.set(el, { opacity: 1 });
    gsap.from(targets, {
      opacity: 0, y: 30, duration: .95, ease: 'power3.out',
      stagger: mode === 'stagger' ? .09 : 0,
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  /* Masked line reveal for anything asking for it. */
  gsap.utils.toArray('[data-split]').forEach(function (el) {
    W.splitLines(el, function (self) {
      return gsap.from(self.lines, {
        yPercent: 108, duration: 1.05, stagger: .08, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
  });

  /* Photos drift against the scroll so a static page still feels alive. */
  gsap.utils.toArray('[data-drift]').forEach(function (img) {
    gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, {
      yPercent: 6, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: .8 }
    });
  });

  /* Counters. Reduced motion prints the final value immediately (above). */
  gsap.utils.toArray('.stats_component [data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count')),
        dec = parseInt(el.getAttribute('data-decimals') || '0', 10),
        suffix = el.getAttribute('data-suffix') || '',
        obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.9, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: function () {
        el.textContent = obj.v.toLocaleString('en-US',
          { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
      }
    });
  });
});
/* Reduced motion never runs the counter tween, so paint the finals up front. */
(function () {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.stats_component [data-count]').forEach(function (el) {
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    el.textContent = parseFloat(el.getAttribute('data-count'))
      .toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      + (el.getAttribute('data-suffix') || '');
  });
})();
