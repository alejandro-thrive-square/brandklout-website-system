(() => {
const io = new IntersectionObserver((e) => { e.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));

    const spObs = new IntersectionObserver((e) => { e.forEach(x => { if (x.isIntersecting) x.target.classList.add('in'); }); }, { threshold: 0.25 });
    const sp = document.getElementById('sitepane');
    if (sp) spObs.observe(sp);

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => { const t = document.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); } });
    });

    const progressBar = document.getElementById('progressBar');
    window.addEventListener('scroll', () => { const h = document.documentElement; progressBar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%'; }, { passive: true });

    const spSvg = document.querySelector('.site-pane svg');
    if (spSvg) window.addEventListener('scroll', () => { const y = window.scrollY; if (y < 800) spSvg.style.transform = 'translateY(' + (y * 0.05) + 'px)'; }, { passive: true });

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

    function applyDesktopZoom() {
      const w = window.innerWidth;
      document.documentElement.style.zoom = w > 1920 ? (w / 1920) : '';
    }
    applyDesktopZoom();
    window.addEventListener('resize', applyDesktopZoom);

    // sticky CTA
    const stickyCta = document.getElementById('stickyCta'); window.addEventListener('scroll', () => { stickyCta.style.display = window.scrollY > 600 ? 'inline-flex' : 'none'; });
})();
