const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');
const form = document.querySelector('[data-lead-form]');
const progress = document.querySelector('[data-scroll-progress]');
const stickyCta = document.querySelector('.sticky-cta');
const heroVisual = document.querySelector('[data-parallax]');
const tiltCards = document.querySelectorAll('[data-tilt-card]');
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
}

window.addEventListener('scroll', updateChrome, { passive: true });
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

if (form) {
  form.addEventListener('submit', (event) => {
    const action = form.getAttribute('action') || '';
    const isPlaceholderAction = action.includes('{{FORM_ENDPOINT}}') || action === '#';

    if (isPlaceholderAction) {
      event.preventDefault();
      let success = form.querySelector('.form-success');
      if (!success) {
        success = document.createElement('p');
        success.className = 'form-success';
        success.setAttribute('role', 'status');
        form.appendChild(success);
      }
      success.textContent = 'Draft form submitted locally. Connect the final form endpoint before launch.';
    }
  });
}
