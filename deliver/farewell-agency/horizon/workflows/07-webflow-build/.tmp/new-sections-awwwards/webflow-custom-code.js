(() => {
// External script from source design: https://cdn.prod.website-files.com/gsap/3.15.0/gsap.min.js

// External script from source design: https://cdn.prod.website-files.com/gsap/3.15.0/ScrollTrigger.min.js

// External script from source design: https://cdn.prod.website-files.com/gsap/3.15.0/SplitText.min.js

(function () {
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  var hasSplit = hasGsap && typeof window.SplitText !== 'undefined';
  var desktopHover = window.matchMedia('(hover: hover) and (min-width: 992px)');

  if (hasST) { gsap.registerPlugin(ScrollTrigger); }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function markOnce(el, key) {
    if (!el || el.getAttribute(key) === 'true') { return false; }
    el.setAttribute(key, 'true');
    return true;
  }

  function initReveal(scope) {
    if (!hasST) { return; }
    scope.querySelectorAll('[data-hz-reveal]').forEach(function (el) {
      if (!markOnce(el, 'data-hz-reveal-ready')) { return; }
      gsap.from(el, {
        y: 48, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  }

  function initSplit(scope) {
    if (!hasST || !hasSplit) { return; }
    scope.querySelectorAll('[data-hz-split]').forEach(function (el) {
      if (!markOnce(el, 'data-hz-split-ready')) { return; }
      var split = new SplitText(el, { type: 'lines', linesClass: 'hz-line' });
      gsap.from(split.lines, {
        yPercent: 110, opacity: 0, stagger: 0.09, duration: 1.1, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  }

  function initProjects(section) {
    if (!markOnce(section, 'data-hz-projects-section-ready')) { return; }
    initReveal(section);
    initSplit(section);

    var list = section.querySelector('[data-hz-projects]');
    var box = section.querySelector('[data-hz-preview-box]');
    if (!list || !box || !hasGsap || !desktopHover.matches) { return; }

    var xTo = gsap.quickTo(box, 'x', { duration: 0.45, ease: 'power3.out' });
    var yTo = gsap.quickTo(box, 'y', { duration: 0.45, ease: 'power3.out' });
    list.addEventListener('mousemove', function (e) {
      var r = list.getBoundingClientRect();
      xTo(e.clientX - r.left - 160);
      yTo(e.clientY - r.top - 110);
    });

    list.querySelectorAll('[data-hz-preview]').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var n = row.getAttribute('data-hz-preview');
        box.style.opacity = '1';
        box.querySelectorAll('[data-hz-preview-img]').forEach(function (img) {
          var on = img.getAttribute('data-hz-preview-img') === n;
          img.style.opacity = on ? '1' : '0';
          img.style.transform = on ? 'scale(1)' : 'scale(1.08)';
        });
      });
    });
    list.addEventListener('mouseleave', function () { box.style.opacity = '0'; });
  }

  function initWhy(section) {
    if (!markOnce(section, 'data-hz-why-section-ready')) { return; }
    initReveal(section);
    initSplit(section);
    if (!hasST) { return; }

    var cards = section.querySelectorAll('[data-hz-stack] .why_card');
    cards.forEach(function (card, i) {
      if (i === cards.length - 1) { return; }
      var next = cards[i + 1];
      gsap.to(card, {
        scale: 0.95, opacity: 0.85, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top+=120', scrub: true }
      });
    });
  }

  function initTestimonials(section) {
    if (!markOnce(section, 'data-hz-testimonials-section-ready')) { return; }
    initReveal(section);
    initSplit(section);
    if (!hasGsap) { return; }

    section.querySelectorAll('[data-hz-marquee]').forEach(function (wrap) {
      if (!markOnce(wrap, 'data-hz-marquee-ready')) { return; }
      var track = wrap.querySelector('.testi_track');
      if (!track || !track.children.length) { return; }

      var dir = parseInt(wrap.getAttribute('data-hz-marquee'), 10) || 1;
      var set = Array.prototype.slice.call(track.children);
      var addSet = function () {
        set.forEach(function (card) { track.appendChild(card.cloneNode(true)); });
      };
      var oneSet = track.scrollWidth;
      addSet();
      var period = track.scrollWidth - oneSet;
      var guard = 0;
      while (period > 0 && guard++ < 12 &&
             track.scrollWidth < wrap.offsetWidth * 2 + period) { addSet(); }

      var x = 0, speed = 0.6, target = 0.6;
      wrap.addEventListener('mouseenter', function () { target = 0.12; });
      wrap.addEventListener('mouseleave', function () { target = 0.6; });
      gsap.ticker.add(function () {
        if (!period || !document.documentElement.contains(wrap)) { return; }
        speed += (target - speed) * 0.08;
        x -= dir * speed;
        if (x <= -period) { x += period; }
        if (x > 0) { x -= period; }
        gsap.set(track, { x: x });
      });
    });
  }

  function initFaq(section) {
    if (!markOnce(section, 'data-hz-faq-section-ready')) { return; }
    initReveal(section);
    initSplit(section);

    section.querySelectorAll('[data-hz-faq]').forEach(function (q) {
      if (!markOnce(q, 'data-hz-faq-ready')) { return; }
      q.addEventListener('click', function () {
        var item = q.closest('.faq_item');
        if (!item) { return; }
        var answer = item.querySelector('.faq_answer');
        var icon = item.querySelector('.faq_icon');
        var title = item.querySelector('.faq_q');
        var isOpen = item.classList.contains('is--open');
        if (!answer) { return; }

        if (isOpen) {
          item.classList.remove('is--open');
          if (icon) {
            icon.style.transform = '';
            icon.style.backgroundColor = '';
            icon.style.borderColor = '';
            icon.style.color = '';
          }
          if (title) { title.style.color = ''; }
          if (hasGsap) { gsap.to(answer, { maxHeight: 0, duration: 0.5, ease: 'power3.inOut' }); }
          else { answer.style.maxHeight = '0px'; }
        } else {
          item.classList.add('is--open');
          if (icon) {
            icon.style.transform = 'rotate(45deg)';
            icon.style.backgroundColor = '#a13512';
            icon.style.borderColor = '#a13512';
            icon.style.color = '#f1ece3';
          }
          if (title) { title.style.color = '#a13512'; }
          if (hasGsap) { gsap.to(answer, { maxHeight: answer.scrollHeight, duration: 0.6, ease: 'power3.out' }); }
          else { answer.style.maxHeight = answer.scrollHeight + 'px'; }
        }
      });
    });
  }

  function initCta(section) {
    if (!markOnce(section, 'data-hz-cta-section-ready')) { return; }
    initReveal(section);
    initSplit(section);
    if (!hasST) { return; }

    section.querySelectorAll('[data-hz-parallax]').forEach(function (img) {
      if (!markOnce(img, 'data-hz-parallax-ready')) { return; }
      gsap.fromTo(img, { yPercent: -8, scale: 1.12 }, {
        yPercent: 8, scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  function initFooter(component) {
    if (!markOnce(component, 'data-hz-footer-section-ready')) { return; }
    initReveal(component);
    initSplit(component);
    if (!hasST || !hasSplit) { return; }

    component.querySelectorAll('[data-hz-wordmark]').forEach(function (wm) {
      if (!markOnce(wm, 'data-hz-wordmark-ready')) { return; }
      var chars = new SplitText(wm, { type: 'chars' }).chars;
      gsap.from(chars, {
        yPercent: 60, opacity: 0, stagger: 0.05, duration: 0.9, ease: 'power4.out',
        scrollTrigger: { trigger: wm, start: 'top 92%', once: true }
      });
    });
  }

  function initHorizonSections(root) {
    root = root || document;
    root.querySelectorAll('.section_projects').forEach(initProjects);
    root.querySelectorAll('.section_why').forEach(initWhy);
    root.querySelectorAll('.section_testimonials').forEach(initTestimonials);
    root.querySelectorAll('.section_faq').forEach(initFaq);
    root.querySelectorAll('.section_cta').forEach(initCta);
    root.querySelectorAll('.footer-main_component').forEach(initFooter);

    if (hasST) {
      ScrollTrigger.refresh();
    }
  }

  window.HorizonSections = window.HorizonSections || {};
  window.HorizonSections.init = initHorizonSections;

  ready(function () {
    initHorizonSections(document);
  });
})();
})();
