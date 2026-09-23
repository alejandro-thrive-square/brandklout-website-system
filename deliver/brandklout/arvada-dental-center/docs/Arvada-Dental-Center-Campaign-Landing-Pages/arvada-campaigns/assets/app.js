document.documentElement.classList.add('js');

(() => {
  'use strict';

  const cfg = window.ADC_CONFIG || {};
  const attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];

  function track(event, details = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...details });
  }

  function getAttribution() {
    const incoming = new URLSearchParams(window.location.search);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('adc_attribution') || '{}'); } catch (_) { saved = {}; }
    for (const key of attributionKeys) {
      if (incoming.get(key)) saved[key] = incoming.get(key).slice(0, 250);
    }
    try { localStorage.setItem('adc_attribution', JSON.stringify(saved)); } catch (_) {}
    return saved;
  }

  function preserveAttribution(attribution) {
    document.querySelectorAll('a[data-preserve-query]').forEach(link => {
      try {
        const url = new URL(link.getAttribute('href'), window.location.href);
        for (const [key, value] of Object.entries(attribution)) {
          if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
        }
        if (url.origin === window.location.origin || window.location.protocol === 'file:') {
          link.href = url.href;
        }
      } catch (_) {}
    });
  }

  function formatTime(totalMinutes) {
    const hour24 = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    const hour = hour24 % 12 || 12;
    return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`;
  }

  function clinicStatus() {
    // Arvada Dental Center & Implants: Monday to Friday, 8:00 AM to 5:00 PM (Mountain Time).
    const schedule = {
      Mon: [8 * 60, 17 * 60],
      Tue: [8 * 60, 17 * 60],
      Wed: [8 * 60, 17 * 60],
      Thu: [8 * 60, 17 * 60],
      Fri: [8 * 60, 17 * 60],
      Sat: null,
      Sun: null,
    };
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const now = Number(values.hour) * 60 + Number(values.minute);
    const today = schedule[values.weekday];
    let text = 'Closed now · Request a call back';
    let open = false;
    if (today) {
      if (now >= today[0] && now < today[1]) {
        open = true;
        text = `Open now · Until ${formatTime(today[1])}`;
      } else if (now < today[0]) {
        text = `Opens today at ${formatTime(today[0])}`;
      }
    }
    document.querySelectorAll('[data-clinic-status]').forEach(node => {
      const target = node.querySelector('span') || node;
      target.textContent = text;
      node.classList.toggle('is-open', open);
    });
  }

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(item => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -35px' });
    items.forEach(item => observer.observe(item));
  }

  function initAccordions() {
    document.querySelectorAll('.accordion__item button').forEach(button => {
      button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        const panel = document.getElementById(button.getAttribute('aria-controls'));
        button.setAttribute('aria-expanded', String(!expanded));
        panel.hidden = expanded;
      });
    });
  }

  function initBeforeAfter() {
    document.querySelectorAll('[data-before-after]').forEach(slider => {
      const input = slider.querySelector('input[type="range"]');
      const update = () => slider.style.setProperty('--split', `${input.value}%`);
      input.addEventListener('input', update);
      update();
    });
  }

  function initVideos() {
    document.querySelectorAll('[data-video-id]').forEach(card => {
      const button = card.querySelector('button');
      button.addEventListener('click', () => {
        const id = card.dataset.videoId;
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
        iframe.title = 'Arvada Dental Center & Implants patient story';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        card.replaceChildren(iframe);
        track('video_play', { video_id: id, campaign: document.body.dataset.campaign });
      }, { once: true });
    });
  }

  function fillHiddenAttribution(form, attribution) {
    for (const [key, value] of Object.entries(attribution)) {
      const input = form.elements.namedItem(key);
      if (input) input.value = value;
    }
  }

  function thankYouUrl(form, firstName, attribution) {
    const url = new URL(form.dataset.thankYou, window.location.href);
    if (firstName) url.searchParams.set('first_name', firstName);
    for (const [key, value] of Object.entries(attribution)) {
      if (value) url.searchParams.set(key, value);
    }
    return url.href;
  }

  function initForms(attribution) {
    document.querySelectorAll('[data-consult-form]').forEach(form => {
      fillHiddenAttribution(form, attribution);
      const first = form.querySelector('[data-form-step="1"]');
      const second = form.querySelector('[data-form-step="2"]');
      const label = form.querySelector('[data-progress-label]');
      const bar = form.querySelector('[data-progress-bar]');
      const next = form.querySelector('[data-step-next]');
      const back = form.querySelector('[data-step-back]');
      const notice = form.querySelector('[data-integration-notice]');
      const error = form.querySelector('[data-form-error]');

      if (!cfg.formEndpoint && notice) notice.hidden = false;

      next?.addEventListener('click', () => {
        const selected = form.querySelector('input[name="concern"]:checked');
        if (!selected) {
          const firstChoice = form.querySelector('input[name="concern"]');
          firstChoice?.focus();
          firstChoice?.reportValidity();
          return;
        }
        first.hidden = true;
        second.hidden = false;
        label.textContent = 'Step 2 of 2';
        bar.style.width = '100%';
        second.querySelector('input')?.focus();
        track('consult_form_step', { step: 2, campaign: form.dataset.campaign, concern: selected.value });
      });

      back?.addEventListener('click', () => {
        second.hidden = true;
        first.hidden = false;
        label.textContent = 'Step 1 of 2';
        bar.style.width = '50%';
        next?.focus();
      });

      form.addEventListener('submit', async event => {
        event.preventDefault();
        error.hidden = true;
        if (!form.reportValidity()) return;
        const submit = form.querySelector('[type="submit"]');
        const original = submit.innerHTML;
        submit.disabled = true;
        submit.textContent = 'Sending…';
        const data = new FormData(form);
        const firstName = String(data.get('first_name') || '').trim().slice(0, 60);
        try { sessionStorage.setItem('adc_first_name', firstName); } catch (_) {}

        try {
          if (cfg.formEndpoint) {
            const response = await fetch(cfg.formEndpoint, {
              method: cfg.formMethod || 'POST',
              body: data,
              headers: cfg.formHeaders || {},
              credentials: cfg.includeCredentials ? 'include' : 'omit',
            });
            if (!response.ok) throw new Error(`Form endpoint returned ${response.status}`);
          }
          track('generate_lead', { campaign: form.dataset.campaign, concern: data.get('concern'), preview_mode: !cfg.formEndpoint });
          window.location.assign(thankYouUrl(form, firstName, attribution));
        } catch (err) {
          console.error(err);
          error.hidden = false;
          submit.disabled = false;
          submit.innerHTML = original;
          track('lead_error', { campaign: form.dataset.campaign });
        }
      });
    });
  }

  function personalizeThankYou() {
    const params = new URLSearchParams(window.location.search);
    let firstName = params.get('first_name') || '';
    if (!firstName) {
      try { firstName = sessionStorage.getItem('adc_first_name') || ''; } catch (_) {}
    }
    firstName = firstName.trim().split(/\s+/)[0].slice(0, 40);
    document.querySelectorAll('[data-first-name]').forEach(node => { node.textContent = firstName; });
  }

  function initEventTracking() {
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
      link.addEventListener('click', () => track('phone_click', { campaign: document.body.dataset.campaign, placement: link.dataset.event || 'phone' }));
    });
    document.querySelectorAll('[data-event]:not([href^="tel:"])').forEach(link => {
      link.addEventListener('click', () => track(link.dataset.event, { campaign: document.body.dataset.campaign }));
    });
  }

  const attribution = getAttribution();
  preserveAttribution(attribution);
  clinicStatus();
  initReveal();
  initAccordions();
  initBeforeAfter();
  initVideos();
  initForms(attribution);
  personalizeThankYou();
  initEventTracking();
})();

