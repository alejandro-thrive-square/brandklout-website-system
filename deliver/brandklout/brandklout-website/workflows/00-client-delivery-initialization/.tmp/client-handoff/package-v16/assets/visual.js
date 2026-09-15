/* Lightweight progressive animation and interactions. No animation framework or chart library. */
(function () {
  'use strict';
  let observer;
  let modal;
  let lastFocus;
  const frames = new Map();
  const root = document.documentElement;
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let preference = false;
  try { preference = localStorage.getItem('bk-reduce-motion') === 'true'; } catch (_) {}
  const reduced = () => preference || mediaQuery.matches;

  function setMotion() {
    root.classList.toggle('reduce-motion', reduced());
    root.classList.toggle('motion-ready', !reduced());
    document.querySelectorAll('[data-motion-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(reduced()));
      button.textContent = reduced() ? 'Reduced motion on' : 'Reduce motion';
    });
    if (reduced()) {
      frames.forEach(id => cancelAnimationFrame(id)); frames.clear();
      document.querySelectorAll('[data-reveal],[data-animate]').forEach(el => el.classList.add('is-visible'));
      document.querySelectorAll('[data-count]').forEach(el => { finishCount(el); });
    }
  }
  function countText(el, n) {
    return (el.dataset.prefix || '') + Math.round(n).toLocaleString('en-US') + (el.dataset.suffix || '');
  }
  function finishCount(el) {
    el.textContent = countText(el, Number(el.dataset.count));
    el.dataset.counted = 'true';
  }
  function animateCount(el, force = false) {
    if (el.dataset.counted && !force) return;
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (frames.has(el)) cancelAnimationFrame(frames.get(el));
    if (reduced()) { finishCount(el); return; }
    el.dataset.counted = 'true';
    const start = performance.now();
    const update = now => {
      if (!el.isConnected) { frames.delete(el); return; }
      const p = Math.min((now - start) / 1050, 1);
      el.textContent = countText(el, target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frames.set(el, requestAnimationFrame(update));
      else frames.delete(el);
    };
    frames.set(el, requestAnimationFrame(update));
  }
  function observe(scope = document) {
    const nodes = scope.querySelectorAll('[data-reveal],[data-animate],[data-count]');
    nodes.forEach(el => {
      if (reduced() || !observer) {
        el.classList.add('is-visible');
        if (el.hasAttribute('data-count')) finishCount(el);
      } else observer.observe(el);
    });
  }
  function replay(el) {
    if (!el) return;
    if (reduced()) {
      el.classList.add('is-visible');
      el.querySelectorAll('[data-count]').forEach(finishCount);
      return;
    }
    el.classList.remove('is-visible');
    void el.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.add('is-visible');
      el.querySelectorAll('[data-count]').forEach(counter => animateCount(counter, true));
    }));
  }
  function closeVideo() {
    if (!modal) return;
    modal.querySelector('iframe')?.setAttribute('src', 'about:blank');
    modal.remove(); modal = null;
    document.body.style.overflow = '';
    if (lastFocus?.isConnected) lastFocus.focus({preventScroll: true});
  }
  function openVideo(link) {
    closeVideo();
    lastFocus = link;
    const id = link.dataset.video;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) { window.open(link.href, '_blank', 'noopener'); return; }
    modal = document.createElement('div');
    modal.className = 'bk-video-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'bk-video-heading');
    modal.innerHTML = '<div class="bk-modal-dialog"><h2 class="bk-modal-title" id="bk-video-heading"></h2><button type="button" class="bk-modal-close" aria-label="Close video">&times;</button><iframe class="bk-modal-video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="bk-modal-footer"><span>YouTube loads only after you choose to play.</span><a target="_blank" rel="noopener">Watch on YouTube</a></div></div>';
    modal.querySelector('h2').textContent = link.dataset.videoTitle || 'BrandKlout customer story';
    const iframe = modal.querySelector('iframe');
    iframe.title = link.dataset.videoTitle || 'BrandKlout video';
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    modal.querySelector('a').href = 'https://www.youtube.com/watch?v=' + id;
    modal.querySelector('button').addEventListener('click', closeVideo);
    modal.addEventListener('click', event => { if (event.target === modal) closeVideo(); });
    document.body.append(modal);
    document.body.style.overflow = 'hidden';
    modal.querySelector('button').focus();
  }
  document.addEventListener('keydown', event => {
    if (!modal) return;
    if (event.key === 'Escape') { event.preventDefault(); closeVideo(); }
    if (event.key === 'Tab') {
      const elements = [...modal.querySelectorAll('button,iframe,a[href]')];
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  function init() {
    if (observer) observer.disconnect();
    frames.forEach(id => cancelAnimationFrame(id)); frames.clear();
    setMotion();
    document.querySelectorAll('img[data-online-src]:not([data-online-attempted])').forEach(img => {
      img.dataset.onlineAttempted = 'true';
      if (navigator.onLine === false) return;
      const fullPhoto = new Image();
      fullPhoto.onload = () => { img.src = fullPhoto.src; img.alt = img.dataset.onlineAlt || ''; };
      fullPhoto.onerror = () => {};
      fullPhoto.src = img.dataset.onlineSrc;
    });
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add('is-visible');
          if (el.hasAttribute('data-count')) animateCount(el);
          observer.unobserve(el);
        });
      }, {threshold: .12, rootMargin: '0px 0px -20px 0px'});
    }
    observe();
    document.querySelectorAll('[data-motion-toggle]:not([data-visual-bound])').forEach(button => {
      button.dataset.visualBound = 'true';
      button.addEventListener('click', () => {
        preference = !preference;
        try { localStorage.setItem('bk-reduce-motion', String(preference)); } catch (_) {}
        setMotion();
      });
    });
    document.querySelectorAll('img:not([data-visual-bound])').forEach(img => {
      img.dataset.visualBound = 'true';
      const error = () => {
        const frame = img.closest('.photo-frame');
        if (frame) { frame.classList.add('media-unavailable'); frame.setAttribute('aria-label', img.alt + ' (online image unavailable)'); }
        else { img.style.visibility = 'hidden'; }
      };
      img.addEventListener('error', error);
      img.addEventListener('load', () => { img.closest('.photo-frame')?.classList.remove('media-unavailable'); img.style.visibility = ''; });
      if (img.complete && !img.naturalWidth) error();
    });
    document.querySelectorAll('[data-video]:not([data-visual-bound])').forEach(link => {
      link.dataset.visualBound = 'true';
      link.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey) return; event.preventDefault(); openVideo(link); });
    });
    const metrics = {
      collections: {label: 'Collections', value: 160},
      patients: {label: 'New patients', value: 300},
      traffic: {label: 'Yelp organic traffic', value: 350}
    };
    document.querySelectorAll('[data-compare]:not([data-visual-bound])').forEach(button => {
      button.dataset.visualBound = 'true';
      button.addEventListener('click', () => {
        const lab = button.closest('.result-lab');
        const chart = lab?.querySelector('.paired-chart');
        const item = metrics[button.dataset.compare];
        if (!chart || !item) return;
        lab.querySelectorAll('[data-compare]').forEach(b => {
          const active = b === button;
          b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active));
        });
        chart.querySelector('.small-label').textContent = item.label;
        const gain = chart.querySelector('[data-count]');
        gain.dataset.count = item.value - 100;
        const bar = chart.querySelector('.grow-bar.result');
        bar.style.setProperty('--bar-width', item.value / 4 + '%');
        bar.querySelector('b').textContent = item.value;
        chart.querySelector('.sr-only').textContent = item.label + ': baseline index 100, reported-period index ' + item.value + '. Source: supplied Legacy Dental customer story.';
        replay(chart);
      });
    });
    document.querySelectorAll('[data-report-tab]:not([data-visual-bound])').forEach(button => {
      button.dataset.visualBound = 'true';
      button.addEventListener('click', () => {
        const app = button.closest('.report-app');
        app.querySelectorAll('[data-report-tab]').forEach(b => {
          b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button));
        });
        app.querySelectorAll('[data-report-panel]').forEach(panel => {
          panel.hidden = panel.dataset.reportPanel !== button.dataset.reportTab;
          if (!panel.hidden) {
            panel.querySelectorAll('[data-animate]').forEach(replay);
            observe(panel);
          }
        });
      });
    });
    const months = ['January','February','March','April','May','June'];
    const values = [18,23,27,25,34,42];
    function selectPoint(chart, index) {
      const tooltip = chart.querySelector('.trend-tooltip');
      tooltip.replaceChildren(document.createTextNode(months[index] + ' '));
      const b = document.createElement('strong'); b.textContent = values[index] + ' qualified consults'; tooltip.append(b);
      chart.querySelectorAll('.point-control').forEach((button, i) => button.classList.toggle('active', index === i));
      chart.querySelectorAll('.chart-points circle').forEach((point, i) => point.classList.toggle('highlight', index === i));
    }
    document.querySelectorAll('.point-control:not([data-visual-bound])').forEach(button => {
      button.dataset.visualBound = 'true';
      const update = () => selectPoint(button.closest('.demo-line-chart'), Number(button.dataset.month));
      button.addEventListener('click', update);
      button.addEventListener('focus', update);
      button.addEventListener('pointerenter', update);
    });
    document.querySelectorAll('.trend-svg:not([data-visual-bound])').forEach(svg => {
      svg.dataset.visualBound = 'true';
      svg.addEventListener('pointermove', event => {
        const rect = svg.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 660;
        const index = Math.max(0, Math.min(5, Math.round((x - 45) / 115)));
        selectPoint(svg.closest('.demo-line-chart'), index);
      });
    });
    document.querySelectorAll('.chart-tabs,.point-buttons,.report-side').forEach(group => {
      if (group.dataset.keyBound) return;
      group.dataset.keyBound = 'true';
      group.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
        const buttons = [...group.querySelectorAll('button')];
        const index = buttons.indexOf(document.activeElement);
        if (index < 0) return;
        event.preventDefault();
        const next = buttons[(index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
        next.focus(); next.click();
      });
    });
  }
  mediaQuery.addEventListener?.('change', setMotion);
  window.BKVisual = {init, closeVideo, reduced, observe};
  init();
})();
