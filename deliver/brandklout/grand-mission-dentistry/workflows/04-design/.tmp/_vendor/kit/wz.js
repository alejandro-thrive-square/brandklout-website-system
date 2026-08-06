/* ==========================================================================
   WZ — motion runtime for the Grand Mission landing pages.

   Shape borrowed from the Dr. Nahlah reference build
   (deliver/brandklout/dr-nahlah/.../site-src/partials/), which is the standard
   set in deliver/brandklout/docs/DESIGN-STANDARD.md.

   Two rules that are not negotiable and cost real time to rediscover:

   1. Plugins are registered HERE, at the end of <body> — never in <head>.
      Registering ScrollTrigger before document.body exists leaves it
      half-initialised and ScrollSmoother then dies silently on getScrollFunc.
      The page does not error; it just feels flat.
   2. Everything degrades. If GSAP fails to load, or the visitor asks for
      reduced motion, every hidden element is painted immediately. A motion
      failure must never cost someone the phone number.
   ========================================================================== */
window.WZ = (function () {
  var q = [],
    flushed = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ok = !!(window.gsap && window.ScrollTrigger);
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* Masked per-line split, degrading to nothing if SplitText is absent.
     Pass `build` when the lines carry a tween — it re-runs on every re-split
     (resize, font swap) and the previous tween is killed for you. */
  function splitLines(el, build) {
    if (!window.SplitText) return null;
    try {
      var opts = { type: 'lines', mask: 'lines', linesClass: 'wz-line', autoSplit: true };
      if (build) opts.onSplit = function (self) { return build(self); };
      return SplitText.create ? SplitText.create(el, opts) : new SplitText(el, opts);
    } catch (e) {
      return null;
    }
  }

  /* Per-word split, for statements that are written out as you scroll rather
     than revealed all at once. Returns null if SplitText is missing, and every
     caller must cope with that — the words are already in the markup. */
  function splitWords(el) {
    if (!window.SplitText) return null;
    try {
      var opts = { type: 'words', wordsClass: 'wz-word' };
      return SplitText.create ? SplitText.create(el, opts) : new SplitText(el, opts);
    } catch (e) {
      return null;
    }
  }

  return {
    reduced: reduced,
    fine: fine,
    ok: ok,
    smoother: null,
    splitLines: splitLines,
    splitWords: splitWords,
    add: function (fn) { flushed ? this.run(fn) : q.push(fn); },
    run: function (fn) { try { fn(this); } catch (e) { console.error('[WZ]', e); } },
    flush: function () {
      flushed = true;
      var self = this;
      q.forEach(function (fn) { self.run(fn); });
      q.length = 0;
    },
  };
})();

/* ==========================================================================
   KIT — the shared choreography every page gets.
   ========================================================================== */
WZ.add(function (W) {
  /* ---------- reveals: [data-rv] and [data-rv="stagger"] ---------------- */
  gsap.utils.toArray('[data-rv]').forEach(function (el) {
    // A nested [data-rv] gets animated twice — once as its parent's stagger
    // child, once in its own right — and the two `from` tweens fight over
    // opacity, which can strand it invisible. The outer reveal covers it.
    if (el.parentElement && el.parentElement.closest('[data-rv]')) return;
    var mode = el.getAttribute('data-rv');
    var targets = mode === 'stagger' ? el.children : el;
    gsap.set(el, { opacity: 1 });
    gsap.from(targets, {
      opacity: 0,
      y: 34,
      duration: 0.95,
      ease: 'power3.out',
      stagger: mode === 'stagger' ? 0.09 : 0,
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });

  /* ---------- masked line reveals: [data-split] ------------------------- */
  gsap.utils.toArray('[data-split]').forEach(function (el) {
    gsap.set(el, { opacity: 1 });
    W.splitLines(el, function (self) {
      return gsap.from(self.lines, {
        yPercent: 112,
        duration: 1.05,
        stagger: 0.08,
        ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });
  });

  /* ---------- clip-path wipes: [data-wipe] ------------------------------ */
  /* The image is already at full opacity — what animates is the mask, so the
     photo feels uncovered rather than faded in. */
  gsap.utils.toArray('[data-wipe]').forEach(function (el) {
    var dir = el.getAttribute('data-wipe') || 'up';
    var from =
      dir === 'left' ? 'inset(0% 100% 0% 0%)'
      : dir === 'right' ? 'inset(0% 0% 0% 100%)'
      : 'inset(100% 0% 0% 0%)';
    gsap.fromTo(
      el,
      { clipPath: from },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.25,
        ease: 'power4.inOut',
        scrollTrigger: { trigger: el, start: 'top 84%' },
      }
    );
  });

  /* ---------- parallax drift: [data-drift] ------------------------------ */
  /* Scale stays above 1 at both ends. A scrubbed scale that lands exactly on
     1 flickers at the edges as the browser snaps the rasterisation. */
  gsap.utils.toArray('[data-drift]').forEach(function (img) {
    var amount = parseFloat(img.getAttribute('data-drift')) || 7;
    gsap.fromTo(
      img,
      { yPercent: -amount, scale: 1.14 },
      {
        yPercent: amount,
        scale: 1.14,
        ease: 'none',
        scrollTrigger: {
          trigger: img.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      }
    );
  });

  /* ---------- counters: [data-count] ------------------------------------ */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count')),
      dec = parseInt(el.getAttribute('data-decimals') || '0', 10),
      prefix = el.getAttribute('data-prefix') || '',
      suffix = el.getAttribute('data-suffix') || '',
      obj = { v: 0 };
    var paint = function () {
      el.textContent =
        prefix +
        obj.v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) +
        suffix;
    };
    gsap.to(obj, {
      v: target,
      duration: 1.9,
      ease: 'power2.out',
      scrollTrigger: { trigger: el.closest('[data-count-scope]') || el, start: 'top 88%' },
      onUpdate: paint,
    });
  });

  /* ---------- magnetic CTAs --------------------------------------------- */
  /* Pointer-fine only: on a touch screen this would fight the tap. */
  if (W.fine) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }),
        yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });

    /* Cursor-aware sheen: cards read the pointer position as CSS custom
       properties, so the highlight follows the cursor without a JS repaint. */
    document.querySelectorAll('[data-cursor-card]').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }

  /* ---------- marquee: [data-marquee] ----------------------------------- */
  /* The track is duplicated in markup, so a -50% loop is seamless. */
  gsap.utils.toArray('[data-marquee]').forEach(function (track) {
    var speed = parseFloat(track.getAttribute('data-marquee')) || 34;
    var tween = gsap.to(track, {
      xPercent: -50,
      duration: speed,
      ease: 'none',
      repeat: -1,
    });
    track.addEventListener('pointerenter', function () { tween.timeScale(0.25); });
    track.addEventListener('pointerleave', function () { tween.timeScale(1); });
  });

  /* ---------- reading progress on the header ---------------------------- */
  var bar = document.getElementById('readProgress');
  if (bar) {
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.25 } });
  }

  /* ---------- chapter tags arrive ---------------------------------------- */
  /* The rule draws itself out from the number. Small, but it is what makes a
     tag read as a chapter heading rather than a caption. */
  gsap.utils.toArray('.chapter-tag').forEach(function (tag) {
    gsap.fromTo(
      tag.querySelector('i'),
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: tag, start: 'top 92%' },
      }
    );
  });

  /* ---------- chapter readout: where am I in the journey ----------------- */
  /* Continuity device. Without it, eight scenes still read as eight sections;
     with it the page keeps telling you which beat you are in and how far
     through the arc that is. */
  var chapters = gsap.utils.toArray('section[data-chapter]');
  var num = document.getElementById('chNum'),
    name = document.getElementById('chName'),
    chBar = document.getElementById('chBar'),
    readout = document.getElementById('chapterReadout');

  if (chapters.length && readout) {
    var last = chapters.length - 1;
    chapters.forEach(function (sec) {
      var i = parseInt(sec.getAttribute('data-chapter'), 10);
      var label = sec.getAttribute('data-chapter-name');
      var activate = function () {
        if (num) num.textContent = String(i).padStart(2, '0');
        if (name) name.textContent = label;
        if (chBar) chBar.style.setProperty('--p', last ? (i / last).toFixed(3) : '1');
      };
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: activate,
        onEnterBack: activate,
      });
    });
    /* Hidden until the visitor has actually entered the journey — on the hero
       it would be noise. */
    ScrollTrigger.create({
      start: 220,
      end: 'max',
      onToggle: function (self) { readout.classList.toggle('is-on', self.isActive); },
    });
  }
});

/* ==========================================================================
   Behaviour that must work with or without GSAP — accordion, lightbox,
   header state, sticky bar. These are content, not motion.
   ========================================================================== */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    /* ---------- animated accordion, one open at a time ------------------ */
    var items = Array.prototype.slice.call(document.querySelectorAll('.faq__item'));
    items.forEach(function (item) {
      var btn = item.querySelector('.faq__q');
      var panel = item.querySelector('.faq__a');
      if (!btn || !panel) return;

      var open = function (state) {
        item.classList.toggle('is-open', state);
        btn.setAttribute('aria-expanded', String(state));
        if (window.gsap && !reduced) {
          gsap.to(panel, {
            height: state ? 'auto' : 0,
            duration: 0.5,
            ease: 'power3.inOut',
            onComplete: function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); },
          });
        } else {
          panel.style.height = state ? 'auto' : '0px';
        }
      };

      panel.style.height = '0px';
      panel.style.overflow = 'hidden';

      btn.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) {
          if (other !== item && other.classList.contains('is-open')) {
            var otherPanel = other.querySelector('.faq__a');
            other.classList.remove('is-open');
            other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
            if (window.gsap && !reduced) gsap.to(otherPanel, { height: 0, duration: 0.4, ease: 'power3.inOut' });
            else otherPanel.style.height = '0px';
          }
        });
        open(willOpen);
      });
    });

    /* ---------- lightbox ------------------------------------------------- */
    var box = document.getElementById('lightbox');
    if (box) {
      var img = document.getElementById('lightboxImg');
      var close = document.getElementById('lightboxClose');
      var last = null;

      document.querySelectorAll('[data-lightbox]').forEach(function (trigger) {
        trigger.addEventListener('click', function () {
          last = trigger;
          img.src = trigger.getAttribute('data-lightbox');
          img.alt = (trigger.querySelector('img') || {}).alt || 'Patient result';
          box.classList.add('is-open');
          if (window.gsap && !reduced) {
            gsap.fromTo(img, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' });
          }
          close.focus();
        });
      });

      var hide = function () {
        box.classList.remove('is-open');
        img.src = '';
        if (last) last.focus();
      };
      close.addEventListener('click', hide);
      box.addEventListener('click', function (e) { if (e.target === box) hide(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && box.classList.contains('is-open')) hide();
      });
    }

    /* ---------- header state + sticky mobile bar ------------------------- */
    var header = document.getElementById('header');
    var bar = document.getElementById('mobileBar');
    var onScroll = function () {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (header) header.classList.toggle('is-stuck', y > 10);
      if (bar) bar.classList.toggle('is-visible', y > 380);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ScrollSmoother moves the content in a transform, so window.scrollY is
       still authoritative but scroll events fire on the smoother. Listening to
       ScrollTrigger keeps the header honest in both modes. */
    if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', onScroll);

    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  });
})();

/* ==========================================================================
   FLUSH — smoother first, then every queued section, then refresh.
   Runs last in <body>.
   ========================================================================== */
/* Entry point, called at the very end of <body>.

   Setup waits for the webfont, and that wait is not cosmetic. SplitText runs
   with autoSplit, so when Montserrat swaps in it re-splits every headline and
   replaces those nodes. If a pinned chapter has already been built, its
   heading is living inside a ScrollTrigger pin-spacer at that moment — and the
   next refresh throws `NotFoundError: insertBefore … node is no longer a child
   of this node` while unwrapping it. The throw lands between the revert and
   the re-apply, so the spacers are gone, the triggers keep their old start/end
   values, and the document is silently thousands of pixels shorter than
   ScrollTrigger believes. Every scrollTo then lands in the wrong chapter and
   the pins look like they never scrub. Splitting before anything is pinned
   removes the race entirely.

   The race is against a timeout, not just the promise: a font that never
   arrives must not cost the visitor the whole page. */
function wzFlush() {
  var ready =
    document.fonts && document.fonts.ready
      ? Promise.race([
          document.fonts.ready,
          new Promise(function (r) { setTimeout(r, 1800); }),
        ])
      : Promise.resolve();
  ready.then(wzBoot, wzBoot);
}

function wzBoot() {
  var W = window.WZ;
  document.documentElement.classList.add('wz-ready');

  if (!W || !W.ok) {
    /* GSAP missing: paint everything so the page is still readable and the
       offer is still reachable. */
    /* Chapter-tag rules and pinned scenes are pre-staged in CSS at their
       "not yet" value; without motion nothing would ever move them off it. */
    document.documentElement.classList.add('wz-static');
    document.querySelectorAll('[data-rv],[data-split],[data-wipe]').forEach(function (el) {
      el.style.opacity = '1';
      el.style.clipPath = 'none';
    });
    document.querySelectorAll('[data-count]').forEach(paintFinal);
    /* Scroll-scrubbed figures are driven by page.js, which never runs here.
       Without this the stat band reads "0.0%" to every visitor who asks for
       reduced motion — motion off must never mean content off. */
    document.querySelectorAll('[data-scrub-count]').forEach(paintFinal);
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  if (window.ScrollSmoother) gsap.registerPlugin(ScrollSmoother);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  if (W.reduced) {
    /* Chapter-tag rules and pinned scenes are pre-staged in CSS at their
       "not yet" value; without motion nothing would ever move them off it. */
    document.documentElement.classList.add('wz-static');
    document.querySelectorAll('[data-rv],[data-split],[data-wipe]').forEach(function (el) {
      el.style.opacity = '1';
      el.style.clipPath = 'none';
    });
    document.querySelectorAll('[data-count]').forEach(paintFinal);
    /* Scroll-scrubbed figures are driven by page.js, which never runs here.
       Without this the stat band reads "0.0%" to every visitor who asks for
       reduced motion — motion off must never mean content off. */
    document.querySelectorAll('[data-scrub-count]').forEach(paintFinal);
    return; // no smoother, no triggers, no pins
  }

  document.body.classList.add('wz-motion');

  if (window.ScrollSmoother) {
    try {
      W.smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1.05,
        effects: false,
        smoothTouch: false,
        normalizeScroll: false,
        ignoreMobileResize: true,
      });
    } catch (e) {
      console.warn('ScrollSmoother unavailable', e);
    }
  }

  W.flush();

  /* Anchors route through the smoother, or pinned sections land in the wrong
     place. */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (W.smoother) W.smoother.scrollTo(t, true, 'top 80px');
      else gsap.to(window, { duration: 1, scrollTo: { y: t, offsetY: 80 }, ease: 'power2.inOut' });
    });
  });

  /* Images can still land after this, and a late image changes the height of
     everything below it, so pinned scenes need one more measurement once the
     page has finished loading. Deferred a frame and guarded: a refresh that
     throws must not take the page's scroll geometry down with it. */
  window.addEventListener('load', function () {
    requestAnimationFrame(function () {
      try {
        ScrollTrigger.refresh();
      } catch (e) {
        console.warn('ScrollTrigger refresh skipped', e);
      }
    });
  });
}

function paintFinal(el) {
  var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
  var value = el.getAttribute('data-count') || el.getAttribute('data-scrub-count');
  el.textContent =
    (el.getAttribute('data-prefix') || '') +
    parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }) +
    (el.getAttribute('data-suffix') || '');
}
