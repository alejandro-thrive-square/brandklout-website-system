/* ==========================================================================
   BOOT — runs at the end of <body>.

   Order matters and is the whole reason this file is separate:
     1. register plugins (body exists now)
     2. create ScrollSmoother
     3. flush every chapter's queued setup
     4. wire the global UI and refresh once fonts/images have landed
   ========================================================================== */
(function () {
  var W = window.WZ;
  var doc = document.documentElement;

  /* ---------- things that must work with or without GSAP ---------- */
  officeStatus();
  faq();
  quiz();
  forms();
  year();

  if (!W || !W.ok) {
    /* GSAP missing: nothing may stay hidden. */
    doc.classList.remove('js-motion');
    document.querySelectorAll('[data-rv],[data-anim="hide"]').forEach(function (el) {
      el.style.opacity = '1'; el.style.visibility = 'visible';
    });
    actionBar();
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  if (window.ScrollSmoother) gsap.registerPlugin(ScrollSmoother);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  if (!W.reduced) doc.classList.add('js-motion');

  /* ScrollSmoother breaks full-page captures — it transforms the content
     rather than scrolling it, so captureBeyondViewport photographs one
     viewport and a lot of empty page. ?nosmooth=1 disables it for the capture
     pass only. It is opt-in via the URL and never shipped in the markup. */
  var noSmooth = /(\?|&)nosmooth=1/.test(location.search);

  if (!W.reduced && !noSmooth && window.ScrollSmoother) {
    try {
      W.smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper', content: '#smooth-content',
        /* Every scrubbed trigger adds a SECOND lag on top of this one, and it
           is that one that reads as broken. The pinned chapters run at
           scrub:.3 so the glide can be generous without the animation
           appearing to trail the wheel. */
        smooth: 1.05, effects: false, smoothTouch: false,
        normalizeScroll: false, ignoreMobileResize: true
      });
    } catch (e) { console.warn('ScrollSmoother unavailable', e); }
  }

  W.flush();

  /* ---------- generic chapter entrance ----------
     Bespoke, scrubbed choreography is authored per chapter in the page. This
     covers the ordinary arrivals so every chapter does not have to restate
     them. [data-rv="stagger"] walks its own children. */
  gsap.utils.toArray('[data-rv]').forEach(function (el) {
    /* A nested [data-rv] would be animated twice — once as its parent's
       stagger child and once in its own right — and the two `from` tweens
       fight over opacity, which can strand it invisible. */
    if (el.parentElement && el.parentElement.closest('[data-rv]')) return;
    var mode = el.getAttribute('data-rv');
    var targets = mode === 'stagger' ? el.children : el;
    gsap.set(el, { opacity: 1 });
    if (W.reduced) { gsap.set(targets, { opacity: 1, y: 0 }); return; }
    gsap.from(targets, {
      opacity: 0, y: 32, duration: .95, ease: 'power3.out',
      stagger: mode === 'stagger' ? parseFloat(el.getAttribute('data-stagger') || .09) : 0,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* ---------- counters ---------- */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var target = parseFloat(String(el.getAttribute('data-count')).replace(/[^0-9.]/g, ''));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    function paint(v) {
      el.textContent = prefix + v.toLocaleString('en-US',
        { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
    }
    if (W.reduced) { paint(target); return; }
    var o = { v: 0 };
    gsap.to(o, {
      v: target, duration: 1.8, ease: 'power2.out',
      onUpdate: function () { paint(o.v); },
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  /* ---------- reading progress ---------- */
  var bar = document.getElementById('navProgress');
  if (bar) {
    if (W.reduced) gsap.set(bar, { scaleX: 0 });
    else gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .25 } });
  }

  /* ---------- chapter readout ---------- */
  var chNum = document.getElementById('navChNum'),
      chName = document.getElementById('navChName'),
      chBar = document.getElementById('navChBar');
  var chapters = gsap.utils.toArray('section[data-chapter]');
  var last = chapters.length ? parseInt(chapters[chapters.length - 1].getAttribute('data-chapter'), 10) : 1;
  chapters.forEach(function (sec) {
    var i = parseInt(sec.getAttribute('data-chapter'), 10);
    var name = sec.getAttribute('data-chapter-name') || '';
    function activate() {
      if (chNum) chNum.textContent = String(i).padStart(2, '0');
      if (chName) chName.textContent = name;
      if (chBar) chBar.style.setProperty('--p', (last ? i / last : 0).toFixed(3));
    }
    ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 45%',
      onEnter: activate, onEnterBack: activate });
  });

  var nav = document.getElementById('nav');
  if (nav) ScrollTrigger.create({ start: 40, end: 99999,
    onToggle: function (self) { nav.classList.toggle('solid', self.isActive); } });

  actionBar();

  /* ---------- anchors routed through the smoother ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (W.smoother) W.smoother.scrollTo(t, !W.reduced, 'top 90px');
      else gsap.to(window, { duration: W.reduced ? 0 : .9, scrollTo: { y: t, offsetY: 80, autoKill: true }, ease: 'power2.inOut' });
    });
  });

  /* ---------- magnetic CTAs, pointer-fine only ---------- */
  if (!W.reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }),
          yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .2);
        yTo((e.clientY - r.top - r.height / 2) * .34);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* Pinned chapters measure wrong if fonts or images land late. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  doc.setAttribute('data-js', 'on');

  /* ======================================================================
     BEHAVIOUR — independent of the motion layer
     ====================================================================== */

  /* Sticky call bar appears on scroll DEPTH rather than when the hero leaves
     the viewport: on a tall mobile hero the hero exit fires late and leaves a
     stretch of page with no reachable offer. */
  function actionBar() {
    var el = document.querySelector('.actionbar');
    if (!el) return;
    function tick() {
      var y = window.scrollY || window.pageYOffset || 0;
      el.classList.toggle('is-on', y > window.innerHeight * 0.6);
    }
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* Real Mon–Fri 08:00–17:00 America/Denver. The practice is not a 24-hour
     service and no page here implies it is. */
  function officeStatus() {
    var nodes = document.querySelectorAll('[data-status]');
    if (!nodes.length) return;
    var open = false;
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Denver', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());
      var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
      var day = get('weekday');
      var mins = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
      open = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(day) > -1 && mins >= 480 && mins < 1020;
    } catch (e) { open = false; }

    nodes.forEach(function (n) {
      n.setAttribute('data-open', String(open));
      var t = n.querySelector('[data-status-text]');
      if (t) t.textContent = open ? 'Open now' : 'Closed · Mon–Fri 8–5';
    });
    document.querySelectorAll('[data-status-swap]').forEach(function (n) {
      var msg = n.getAttribute(open ? 'data-open-text' : 'data-closed-text');
      if (msg) n.textContent = msg;
    });
  }

  function faq() {
    document.querySelectorAll('.faq__q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq__item');
        var open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function quiz() {
    document.querySelectorAll('[data-quiz]').forEach(function (root) {
      var box = root.querySelector('.quiz');
      if (!box) return;
      var steps = Array.prototype.slice.call(box.querySelectorAll('.quiz__step'));
      var live = box.querySelector('[data-quiz-live]');
      var fill = box.querySelector('.quiz__progress i');
      var out = box.querySelector('[data-quiz-answers]');
      var answers = {}, idx = 0;

      function show(n) {
        idx = Math.max(0, Math.min(steps.length, n));
        steps.forEach(function (s, i) { s.setAttribute('data-active', String(i === idx)); });
        box.classList.toggle('is-done', idx >= steps.length);
        if (fill) fill.style.width = Math.round((idx / steps.length) * 100) + '%';
        if (live) live.textContent = idx >= steps.length
          ? 'All questions answered. Please leave your details.'
          : 'Question ' + (idx + 1) + ' of ' + steps.length;
      }

      steps.forEach(function (step) {
        var name = step.getAttribute('data-name');
        step.querySelectorAll('.quiz__opt').forEach(function (opt) {
          opt.addEventListener('click', function () {
            step.querySelectorAll('.quiz__opt').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
            opt.setAttribute('aria-pressed', 'true');
            answers[name] = opt.getAttribute('data-value');
            if (out) out.value = JSON.stringify(answers);
            setTimeout(function () { show(idx + 1); }, 190);
          });
        });
        var back = step.querySelector('.quiz__back');
        if (back) back.addEventListener('click', function () { show(idx - 1); });
      });
      show(0);
    });
  }

  /* Single choke-point for every lead on every page. There is no endpoint
     yet (Open Question 3 — the GHL/CRM destination has not been supplied),
     so the payload is validated, surfaced to the visitor and logged for
     inspection rather than posted somewhere invented. */
  function forms() {
    document.querySelectorAll('form[data-lead]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        form.querySelectorAll('[required]').forEach(function (input) {
          var field = input.closest('.field');
          var err = field ? field.querySelector('.field__err') : null;
          var bad = !input.value.trim() ||
            (input.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value)) ||
            (input.type === 'tel' && input.value.replace(/\D/g, '').length < 10);
          if (field) field.classList.toggle('is-bad', bad);
          if (err) err.textContent = bad
            ? (input.type === 'tel' ? 'Please enter a phone number we can reach you on.' : 'This field is required.')
            : '';
          if (bad) ok = false;
        });
        if (!ok) { var f = form.querySelector('.is-bad input'); if (f) f.focus(); return; }

        var payload = { form: form.getAttribute('data-lead'), page: location.pathname, at: new Date().toISOString() };
        new FormData(form).forEach(function (v, k) { payload[k] = v; });
        (window.__arvadaLeads = window.__arvadaLeads || []).push(payload);

        var done = document.createElement('div');
        done.className = 'form-ok';
        done.setAttribute('role', 'status');
        done.textContent = form.getAttribute('data-thanks') || 'Thank you — we will be in touch.';
        form.replaceWith(done);
      });
    });
  }

  function year() {
    var y = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (n) { n.textContent = y; });
  }
})();
