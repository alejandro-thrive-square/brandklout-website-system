/* ==========================================================================
   REVIEW ROUND 3 — Brandklout BugHerd, 2026-10-07/08. Shipped as its own module,
   src/scripts/wla-review-3.js; in the local build it is bundled after the boot.

   "This section doesn't need to be scrolled; just display the information"
   (#39 #41 #42 #55), "highlighted whenever the mouse hovers" (#45), "switch
   between before and after when the mouse hovers" (#49). site.js builds every
   pin first; this releases the pins of the statement, the home page's reality
   line, compare, ledger and before/after. ScrollTrigger.kill(true) reverts the
   pin spacer AND the scrubbed animation, so what the visitor sees is the CSS in
   06-review-3.css: every word, box and row shown. The once-only reveals stay.
   Then the steps that still pin get a "Scroll" cue (#43 #46).

   Main site only: the ad pages (body.is-landing-page) keep their own motion.
   ========================================================================== */
(function () {
  var S = {
    lp: '.is-landing-page', statement: '.section_statement', reality: '.section_reality', compare: '.section_compare',
    column: '.compare_column', ledger: '.section_ledger', list: '.ledger_list', proof: '.section_before-after',
    stage: '.before-after_stage', after: '.before-after_after', handle: '.before-after_handle',
    steps: '.section_steps', stepsHead: '.steps_head'
  };
  if (!document.body || document.body.matches(S.lp)) return;
  var tries = 0;

  function ready() { return window.gsap && window.ScrollTrigger && ScrollTrigger.getAll().length > 0; }
  function within(st, sec) { var t = st.trigger; return !!t && (t === sec || sec.contains(t)); }
  /* pinned or scrubbed triggers inside the section go; once-only reveals stay */
  function release(sec) {
    ScrollTrigger.getAll().forEach(function (st) {
      if (!within(st, sec) || (!st.pin && !st.vars.scrub)) return;
      st.kill(true);
    });
  }
  function counts(sec) {
    sec.querySelectorAll('[data-count]').forEach(function (el) {
      var v = parseFloat(el.getAttribute('data-count')) || 0;
      el.textContent = v.toLocaleString('en-US') + (el.getAttribute('data-suffix') || '');
    });
  }

  function run() {
    document.querySelectorAll(S.statement + ',' + S.reality).forEach(function (sec) { release(sec); counts(sec); });

    document.querySelectorAll(S.compare).forEach(function (sec) {
      release(sec);
      var cols = sec.querySelectorAll(S.column);
      if (cols.length) gsap.set(cols, { clearProps: 'opacity,transform,scale' });
      cols.forEach(function (c) { c.classList.add('is-lit'); });
    });

    document.querySelectorAll(S.ledger).forEach(function (sec) {
      release(sec); counts(sec);
      var list = sec.querySelector(S.list);
      if (list) list.classList.add('is-drawn');
    });

    var HOVER = window.matchMedia('(hover:hover)').matches;
    document.querySelectorAll(S.proof).forEach(function (sec) {
      release(sec);
      var stage = sec.querySelector(S.stage);
      if (!stage || stage.getAttribute('data-wz-swap')) return;
      var moving = [sec.querySelector(S.after), sec.querySelector(S.handle)].filter(Boolean);
      if (moving.length) gsap.set(moving, { clearProps: 'clipPath,left' });
      stage.setAttribute('data-wz-swap', '1');
      stage.setAttribute('tabindex', '0');
      stage.setAttribute('role', 'button');
      stage.setAttribute('aria-pressed', 'false');
      stage.setAttribute('aria-label', 'Before and after: press to switch the photos');
      function flip() {
        var on = !stage.classList.contains('is-swapped');
        stage.classList.toggle('is-swapped', on);
        stage.setAttribute('aria-pressed', String(on));
      }
      /* a mouse already swaps on hover; touch has no hover, so a tap does it */
      if (!HOVER) stage.addEventListener('click', flip);
      stage.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
      });
    });

    document.querySelectorAll(S.steps).forEach(function (sec) {
      var head = sec.querySelector(S.stepsHead);
      var pin = ScrollTrigger.getAll().filter(function (st) { return st.pin && within(st, sec); })[0];
      if (!head || !pin || head.querySelector('.steps_scroll-cue')) return; /* phones: a plain list, no cue */
      var cue = document.createElement('div');
      cue.className = 'steps_scroll-cue';
      cue.setAttribute('aria-hidden', 'true');
      cue.innerHTML = '<span>Scroll</span><i></i>';
      head.appendChild(cue);
      sec.classList.add('has-scroll-cue');
      ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top',
        onUpdate: function () { sec.classList.toggle('is-steps-done', pin.progress > .96); } });
    });

    ScrollTrigger.refresh();
  }

  function start() {
    if (!ready()) { if (++tries < 100) setTimeout(start, 100); return; }
    run();
  }
  start();
})();
