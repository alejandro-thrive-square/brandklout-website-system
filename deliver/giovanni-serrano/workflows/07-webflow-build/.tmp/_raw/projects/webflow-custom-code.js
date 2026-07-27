(() => {
// ───── Reveal observer
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

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
})();
