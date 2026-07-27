(() => {
// ───── Reveal observer
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .reveal-stagger, .compare').forEach(el => io.observe(el));

    // hero blueprint draws on its own observer for reliability
    const heroObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.25 });
    const csec = document.getElementById('csec');
    if (csec) heroObs.observe(csec);

    // smooth scroll for in-page links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); }
      });
    });

    // ───── Scroll progress bar
    const progressBar = document.getElementById('progressBar');
    function tickProgress() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      progressBar.style.width = pct + '%';
    }
    window.addEventListener('scroll', tickProgress, { passive: true });
    tickProgress();

    // ───── Three-col underline trigger
    const tcol = document.getElementById('threecol');
    if (tcol) io.observe(tcol);

    // ───── Pinned proforma — drive ledger reveal by step in viewport
    const steps = document.querySelectorAll('.pin-step');
    const rows = document.querySelectorAll('.pin-pane .ledger-row, .pin-pane .pm');
    function reveal(stepN) {
      rows.forEach(r => {
        const n = parseInt(r.getAttribute('data-row'), 10);
        if (n <= stepN) r.classList.add('shown'); else r.classList.remove('shown');
      });
    }
    const pinObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          steps.forEach(s => s.classList.remove('active'));
          e.target.classList.add('active');
          const n = parseInt(e.target.getAttribute('data-step'), 10);
          reveal(n);
        }
      });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    steps.forEach(s => pinObs.observe(s));

    // ───── Animate metric numbers in Sample block when visible
    function animateNumber(el) {
      const target = parseFloat(el.getAttribute('data-target'));
      const suffix = el.getAttribute('data-suffix') || '';
      const isNeg = target < 0;
      const abs = Math.abs(target);
      const dur = 1200;
      const start = performance.now();
      function frame(t) {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const cur = (abs * eased).toFixed(target % 1 === 0 ? 0 : (abs < 1 ? 2 : 1));
        el.innerHTML = (isNeg ? '<em>−</em>' : '') + cur + '<em>' + suffix + '</em>';
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    const numObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !e.target.dataset.animated) {
          e.target.dataset.animated = '1';
          animateNumber(e.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.sample-metrics .v[data-target]').forEach(el => numObs.observe(el));

    // ───── Active link in nav based on section in view
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav.top .links a');
    // (kept simple — current page is "Invest", so we leave it active)

    // hamburger nav
    const navBtn = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('nav.top .links');
    if (navBtn && navMenu) {
      navBtn.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        navBtn.textContent = navMenu.classList.contains('open') ? '✕' : '☰';
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('nav.top')) {
          navMenu.classList.remove('open');
          navBtn.textContent = '☰';
        }
      });
    }

    // ───── Subtle parallax on hero blueprint
    const cs = document.querySelector('.cross-section svg');
    if (cs) {
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y < 800) cs.style.transform = 'translateY(' + (y * 0.06) + 'px)';
      }, { passive: true });
    }

    // ───── Sticky CTA show/hide
    const stickyCta = document.getElementById('stickyCta');
    if (stickyCta) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 600) stickyCta.classList.add('visible');
        else stickyCta.classList.remove('visible');
      }, { passive: true });
    }

    // proportional scale-up above 1920
    function applyDesktopZoom() {
      const w = window.innerWidth;
      document.documentElement.style.zoom = w > 1920 ? (w / 1920) : '';
    }
    applyDesktopZoom();
    window.addEventListener('resize', applyDesktopZoom);

    // ───── Smooth FAQ accordion
    document.querySelectorAll('.faq details').forEach(det => {
      const summary = det.querySelector('summary');
      const wrap = det.querySelector('.a-wrap');
      if (!summary || !wrap) return;
      summary.addEventListener('click', e => {
        e.preventDefault();
        if (det.open) {
          det.classList.add('closing');
          wrap.style.gridTemplateRows = '0fr';
          wrap.addEventListener('transitionend', function handler() {
            det.open = false;
            det.classList.remove('closing');
            wrap.removeEventListener('transitionend', handler);
          }, { once: true });
        } else {
          det.open = true;
          wrap.style.gridTemplateRows = '';
        }
      });
    });

// Restore inline CSS custom properties dropped by the Webflow paste
// (e.g. the compare bars' per-row --w widths).
[["#compare .row", 0, "--w", "100%"], ["#compare .row", 1, "--w", "95%"], ["#compare .row", 2, "--w", "30%"], ["#compare .row", 3, "--w", "10%"], ["#compare .row", 4, "--w", "16%"], ["#compare .row", 5, "--w", "24%"], ["#compare .row", 6, "--w", "90%"], ["#compare .row", 7, "--w", "80%"]].forEach(([q, i, p, v]) => {
  const el = document.querySelectorAll(q)[i];
  if (el) el.style.setProperty(p, v);
});
})();
