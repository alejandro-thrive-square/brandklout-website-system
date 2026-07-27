const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');
const form = document.querySelector('[data-lead-form]');
const progress = document.querySelector('[data-scroll-progress]');
const stickyCta = document.querySelector('.sticky-cta');
const heroVisual = document.querySelector('[data-parallax]');
const tiltCards = document.querySelectorAll('[data-tilt-card]');
const areaParallaxTags = document.querySelectorAll('[data-area-depth]');
const areasSection = document.querySelector('.areas-section');
const pathTabs = document.querySelectorAll('[data-path-tab]');
const pathItems = document.querySelectorAll('.path-item');
const testimonialSlides = document.querySelectorAll('[data-testimonial-slide]');
const testimonialPrev = document.querySelector('[data-testimonial-prev]');
const testimonialNext = document.querySelector('[data-testimonial-next]');
const testimonialDots = document.querySelector('[data-testimonial-dots]');
let activeTestimonial = 0;

function updateChrome() {
  const scrollTop = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progressValue = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;

  if (header) header.classList.toggle('is-scrolled', scrollTop > 10);
  if (progress) progress.style.width = `${progressValue}%`;
  if (stickyCta) stickyCta.classList.toggle('is-visible', scrollTop > 520);

  if (heroVisual && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const offset = Math.min(scrollTop * 0.08, 34);
    heroVisual.style.transform = `translateY(${offset}px)`;
  }

  if (areaParallaxTags.length && areasSection && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const rect = areasSection.getBoundingClientRect();
    const viewportH = window.innerHeight;
    // One continuous progress value for the whole section: 0 as it enters from
    // the bottom, 0.5 when centered, 1 as it leaves the top. Driving every tag
    // from the same value makes them drift together at depth-based speeds —
    // a continuous parallax field rather than each tag cresting like a wave.
    const raw = (viewportH - rect.top) / (viewportH + rect.height);
    const centered = Math.max(0, Math.min(1, raw)) - 0.5;
    areaParallaxTags.forEach((tag) => {
      const depth = Number(tag.dataset.areaDepth || 0.16);
      const offset = centered * 380 * depth;
      tag.style.setProperty('--area-parallax-y', `${offset.toFixed(2)}px`);
    });
  }
}

let chromeTicking = false;
window.addEventListener('scroll', () => {
  if (chromeTicking) return;
  chromeTicking = true;
  requestAnimationFrame(() => {
    updateChrome();
    chromeTicking = false;
  });
}, { passive: true });
updateChrome();

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    document.body.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.addEventListener('click', (event) => {
    if (event.target.matches('a')) {
      nav.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

function setPathTab(targetId) {
  pathTabs.forEach((tab) => {
    const isActive = tab.dataset.pathTab === targetId;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  pathItems.forEach((item) => {
    const isActive = item.id === targetId;
    item.classList.toggle('is-active', isActive);
    item.hidden = !isActive;
  });
}

pathTabs.forEach((tab) => {
  tab.addEventListener('click', () => setPathTab(tab.dataset.pathTab));
});

function setTestimonial(index) {
  if (!testimonialSlides.length) return;
  activeTestimonial = (index + testimonialSlides.length) % testimonialSlides.length;

  testimonialSlides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeTestimonial;
    slide.classList.toggle('is-active', isActive);
    slide.hidden = !isActive;
  });

  if (testimonialDots) {
    testimonialDots.querySelectorAll('button').forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === activeTestimonial);
      dot.setAttribute('aria-selected', String(dotIndex === activeTestimonial));
    });
  }
}

if (testimonialSlides.length && testimonialDots) {
  testimonialSlides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'testimonial-dot';
    dot.setAttribute('aria-label', `Show testimonial ${index + 1}`);
    dot.setAttribute('aria-selected', String(index === 0));
    dot.addEventListener('click', () => setTestimonial(index));
    testimonialDots.appendChild(dot);
  });
  setTestimonial(0);
}

if (testimonialPrev) testimonialPrev.addEventListener('click', () => setTestimonial(activeTestimonial - 1));
if (testimonialNext) testimonialNext.addEventListener('click', () => setTestimonial(activeTestimonial + 1));

function applyTilt(event, element) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
  element.style.setProperty('--tilt-x', `${x}deg`);
  element.style.setProperty('--tilt-y', `${y}deg`);
}

if (heroVisual) {
  const board = heroVisual.querySelector('.blueprint-board');
  if (board) {
    heroVisual.addEventListener('pointermove', (event) => applyTilt(event, board));
    heroVisual.addEventListener('pointerleave', () => {
      board.style.setProperty('--tilt-x', '0deg');
      board.style.setProperty('--tilt-y', '0deg');
    });
  }
}

tiltCards.forEach((card) => {
  card.addEventListener('pointermove', (event) => applyTilt(event, card));
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
});

// --- Conversion tracking -------------------------------------------------
// Pushes events to the dataLayer so Google Tag Manager / GA4 can pick them up.
// Works as a no-op until a real container is connected (see index.html head).
window.dataLayer = window.dataLayer || [];
function track(event, detail) {
  window.dataLayer.push(Object.assign({ event }, detail || {}));
}

// CTA + click-to-call tracking via [data-cta] attributes.
document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-cta]');
  if (!el) return;
  const location = el.dataset.cta;
  const href = el.getAttribute('href') || '';
  if (href.startsWith('tel:')) {
    track('click_to_call', { cta_location: location, phone: href.replace('tel:', '') });
  } else {
    track('cta_click', { cta_location: location, cta_text: el.textContent.trim() });
  }
}, { passive: true });

if (form) {
  form.addEventListener('submit', (event) => {
    // Inline validation (form uses novalidate so we control the messaging).
    if (!form.checkValidity()) {
      event.preventDefault();
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus();
      form.reportValidity();
      track('lead_form_invalid');
      return;
    }

    track('generate_lead', {
      project_type: (form.querySelector('#project-type') || {}).value || '',
      budget: (form.querySelector('#budget') || {}).value || ''
    });

    const action = form.getAttribute('action') || '';
    const isPlaceholderAction = action.includes('{{FORM_ENDPOINT}}') || action === '#';

    if (isPlaceholderAction) {
      // TODO[launch]: remove this branch once the real form endpoint is connected.
      event.preventDefault();
      let success = form.querySelector('.form-success');
      if (!success) {
        success = document.createElement('p');
        success.className = 'form-success';
        success.setAttribute('role', 'status');
        form.appendChild(success);
      }
      success.textContent = 'Thank you — your request has been received. We usually respond within one business day.';
      success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}
