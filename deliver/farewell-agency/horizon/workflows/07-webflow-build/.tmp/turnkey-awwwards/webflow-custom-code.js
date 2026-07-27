(() => {
// External script from source design: https://cdn.prod.website-files.com/gsap/3.15.0/gsap.min.js

// External script from source design: https://cdn.prod.website-files.com/gsap/3.15.0/ScrollTrigger.min.js

// External script from source design: https://cdn.prod.website-files.com/gsap/3.15.0/SplitText.min.js

(function () {
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  var hasSplit = hasGsap && typeof window.SplitText !== 'undefined';
  if (hasST) { gsap.registerPlugin(ScrollTrigger); }

  /* ---------- scroll reveals ---------- */
  if (hasST) {
    document.querySelectorAll('[data-hz-reveal]').forEach(function (el) {
      gsap.from(el, {
        y: 48, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  }

  /* ---------- split-text heading reveals ---------- */
  if (hasST && hasSplit) {
    document.querySelectorAll('[data-hz-split]').forEach(function (el) {
      var split = new SplitText(el, { type: 'lines', linesClass: 'hz-line' });
      gsap.from(split.lines, {
        yPercent: 110, opacity: 0, stagger: 0.09, duration: 1.1, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  }

  /* ---------- kinetic type marquee ---------- */
  /* One set of items in the markup; cloned until the track covers the
     viewport plus one full period (same approach as the testimonial rows). */
  if (hasGsap) {
    document.querySelectorAll('[data-hz-tk-marquee]').forEach(function (wrap) {
      var track = wrap.querySelector('.turnkey_marquee-track');
      if (!track || !track.children.length) { return; }
      var set = Array.prototype.slice.call(track.children);
      var addSet = function () {
        set.forEach(function (item) { track.appendChild(item.cloneNode(true)); });
      };
      var oneSet = track.scrollWidth;
      addSet();
      var period = track.scrollWidth - oneSet;
      var guard = 0;
      while (period > 0 && guard++ < 12 &&
             track.scrollWidth < wrap.offsetWidth * 2 + period) { addSet(); }
      var x = 0, speed = 0.5, target = 0.5;
      wrap.addEventListener('mouseenter', function () { target = 0.12; });
      wrap.addEventListener('mouseleave', function () { target = 0.5; });
      gsap.ticker.add(function () {
        if (!period) { return; }
        speed += (target - speed) * 0.08;
        x -= speed;
        if (x <= -period) { x += period; }
        gsap.set(track, { x: x });
      });
    });
  }

  /* ---------- collage: curtain mask reveal ---------- */
  if (hasST) {
    document.querySelectorAll('[data-hz-tk-mask]').forEach(function (frame) {
      gsap.fromTo(frame,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.out',
          scrollTrigger: { trigger: frame, start: 'top 85%', once: true } });
    });
  }

  /* ---------- collage: scroll parallax inside each frame ---------- */
  if (hasST) {
    document.querySelectorAll('[data-hz-tk-parallax]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -7, scale: 1.12 }, {
        yPercent: 7, scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- spec count-ups ---------- */
  if (hasST) {
    document.querySelectorAll('[data-hz-tk-count]').forEach(function (el) {
      var end = parseFloat(el.getAttribute('data-hz-tk-count'));
      var dec = parseInt(el.getAttribute('data-hz-tk-dec') || '0', 10);
      if (isNaN(end)) { return; }
      var proxy = { v: 0 };
      var render = function () {
        el.textContent = proxy.v.toLocaleString('en-US', {
          minimumFractionDigits: dec, maximumFractionDigits: dec
        });
      };
      gsap.to(proxy, {
        v: end, duration: 1.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onStart: render, onUpdate: render
      });
    });
  }
})();
})();
