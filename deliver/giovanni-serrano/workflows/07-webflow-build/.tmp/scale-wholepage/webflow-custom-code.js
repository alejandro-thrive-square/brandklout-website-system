(() => {
const io = new IntersectionObserver((e) => { e.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .reveal-stagger, .six-grid').forEach(el => io.observe(el));

    const heroObs = new IntersectionObserver((e) => { e.forEach(x => { if (x.isIntersecting) x.target.classList.add('in'); }); }, { threshold: 0.25 });
    const dp = document.getElementById('dcfPane');
    if (dp) heroObs.observe(dp);

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => { const t = document.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); } });
    });

    const progressBar = document.getElementById('progressBar');
    window.addEventListener('scroll', () => { const h = document.documentElement; progressBar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%'; }, { passive: true });

    // pinned stage reveal
    const steps = document.querySelectorAll('.pin-step');
    const stageRows = document.querySelectorAll('.stage-row');
    const pinObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          steps.forEach(s => s.classList.remove('active'));
          e.target.classList.add('active');
          const n = parseInt(e.target.getAttribute('data-step'), 10);
          stageRows.forEach(r => { const rn = parseInt(r.getAttribute('data-row'), 10); if (rn <= n) r.classList.add('shown'); else r.classList.remove('shown'); });
        }
      });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    steps.forEach(s => pinObs.observe(s));

    // hamburger nav
    const navBtn = document.querySelector('button.nav-toggle') || document.querySelector('.nav-toggle');
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

    // parallax dcf pane
    const dcfSvg = document.querySelector('.dcf-pane svg');
    if (dcfSvg) window.addEventListener('scroll', () => { const y = window.scrollY; if (y < 800) dcfSvg.style.transform = 'translateY(' + (y * 0.05) + 'px)'; }, { passive: true });

    // proportional scale-up above 1920
    function applyDesktopZoom() {
      const w = window.innerWidth;
      document.documentElement.style.zoom = w > 1920 ? (w / 1920) : '';
    }
    applyDesktopZoom();
    window.addEventListener('resize', applyDesktopZoom);

    const stickyCta = document.getElementById('stickyCta'); window.addEventListener('scroll', () => { stickyCta.style.display = window.scrollY > 600 ? 'inline-flex' : 'none'; });
})();
