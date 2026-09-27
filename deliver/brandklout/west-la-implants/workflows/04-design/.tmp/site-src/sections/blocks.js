/* ==========================================================================
   THE BLOCKS — motion for every interior chapter type (lib/blocks.mjs). One
   WZ.section() per block type; each runs once per page and wires every
   instance it finds. Scroll DRIVES statement, steps, compare, ledger, proof
   and rail (pinned + scrubbed); cover, strip and the rest arrive and depart.
   Shared helpers (wzLinesIn, wzWipes, wzTagIn, wzDepart) live in chapters.js;
   the bundle is one script, so they are in scope here.
   ========================================================================== */
var WZ_TOUCH = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

/* ---------- cover ---------- */
WZ.section('b-cover', function (W) {
  document.querySelectorAll('.b-cover').forEach(function (sec) {
    var film = sec.querySelector('.cv-film');
    var video = sec.querySelector('video.cv-film');
    if (video) { video.load && video.load(); video.play && video.play().catch(function () {}); }
    var hides = sec.querySelectorAll('[data-anim="hide"]');
    var title = sec.querySelector('.cv-title');
    if (W.reduced) { hides.forEach(function (el) { el.style.visibility = 'visible'; }); return; }

    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (film) tl.fromTo(film, { scale: 1.22 }, { scale: 1.06, duration: 2.6, ease: 'power2.out' }, 0);
    var tag = sec.querySelector('.chapter-tag');
    if (tag) {
      tl.add(function () { tag.style.visibility = 'visible'; }, .3)
        .from(tag, { x: -24, opacity: 0, duration: .9 }, .3)
        .from(tag.querySelector('i'), { scaleX: 0, duration: 1 }, .4);
    }
    var split = W.splitLines(title, function (self) {
      title.style.visibility = 'visible';
      return gsap.from(self.lines, { yPercent: 115, duration: 1.3, ease: 'power4.out', stagger: .11, delay: .5 });
    });
    if (!split) title.style.visibility = 'visible';
    var lead = sec.querySelector('.cv-lead');
    if (lead) tl.add(function () { lead.style.visibility = 'visible'; }, .95).from(lead, { y: 24, opacity: 0, duration: 1 }, .95);
    var actions = sec.querySelector('.cv-actions');
    if (actions) tl.add(function () { actions.style.visibility = 'visible'; }, 1.15).from(actions.children, { y: 18, opacity: 0, duration: .9, stagger: .1 }, 1.15);
    var meta = sec.querySelectorAll('.cv-meta li');
    if (meta.length) tl.add(function () { meta.forEach(function (el) { el.style.visibility = 'visible'; }); }, 1.3).from(meta, { y: 26, opacity: 0, duration: 1, stagger: .09 }, 1.3);
    var cue = sec.querySelector('.cv-cue');
    if (cue) tl.add(function () { cue.style.visibility = 'visible'; }, 2).from(cue, { opacity: 0, duration: 1 }, 2);

    /* the split cover's photograph wipes open on load, then drifts */
    var media = sec.querySelector('.cv-media');
    if (media) {
      gsap.to(media, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'power4.inOut', delay: .35 });
      var im = media.querySelector('.par');
      if (im) gsap.fromTo(im, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
    }
    /* departure */
    if (film) gsap.to(film, { scale: 1.18, yPercent: 10, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(sec.querySelector('.cv-copy'), { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: sec, start: '35% top', end: 'bottom top', scrub: .3 } });
    if (cue) gsap.to(cue, { opacity: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: '20% top', scrub: true } });
  });
});

/* ---------- statement: pinned, written by scroll ---------- */
WZ.section('b-statement', function (W) {
  document.querySelectorAll('.b-statement').forEach(function (sec) {
    var big = sec.querySelector('.st-big'), after = sec.querySelector('.st-after'), img = sec.querySelector('.st-img'), bg = sec.querySelector('.st-bg');
    wzTagIn(sec);
    if (W.reduced) { wzCount(sec, 1); return; }
    var split = W.splitWords(big);
    var words = split ? split.words : [big];
    var tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: '+=160%', pin: true, scrub: .3, anticipatePin: 1,
      onUpdate: function (self) { wzCount(sec, self.progress); } } });
    tl.to(words, { opacity: 1, ease: 'none', stagger: { each: .06 }, duration: words.length * .06 }, 0)
      .to(after, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, '>-.1')
      .to({}, { duration: .5 });
    if (img) gsap.fromTo(img, { scale: 1.04, filter: 'grayscale(1) contrast(1.1)' }, { scale: 1.18, filter: 'grayscale(0) contrast(1)', ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: '+=160%', scrub: true } });
    if (bg) gsap.to(bg, { opacity: .1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: '+=160%', scrub: true } });
  });
});

/* a figure that counts with scroll progress: <b data-count="1000" data-suffix="+"> */
function wzCount(scope, p) {
  scope.querySelectorAll('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0, suffix = el.getAttribute('data-suffix') || '';
    var v = Math.round(target * Math.min(1, Math.max(0, p)));
    el.textContent = v.toLocaleString('en-US') + suffix;
  });
}

/* ---------- steps: pinned vertical stepper ---------- */
WZ.section('b-steps', function (W) {
  document.querySelectorAll('.b-steps').forEach(function (sec) {
    var pin = sec.querySelector('.sp-pin'), stepsEl = sec.querySelectorAll('.sp-step'), dots = sec.querySelectorAll('.sp-dots i'),
        num = sec.querySelector('.sp-num'), line = sec.querySelector('.sp-line b');
    wzTagIn(sec);
    wzLinesIn(sec.querySelector('.h2'));
    wzWipes(sec);
    var MOBILE = WZ_TOUCH || window.innerWidth < 768;
    if (W.reduced || MOBILE) {
      if (!W.reduced) gsap.from(stepsEl, { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: sec.querySelector('.sp-list'), start: 'top 85%', once: true } });
      return;
    }
    var n = stepsEl.length;
    /* the stage takes the tallest step's height so nothing jumps between them */
    var list = sec.querySelector('.sp-list');
    function size() {
      var max = 0;
      stepsEl.forEach(function (s) {
        var d = s.style.display, o = s.style.opacity, ps = s.style.position;
        s.style.display = 'block'; s.style.opacity = '0'; s.style.position = 'static';
        max = Math.max(max, s.offsetHeight);
        s.style.display = d; s.style.opacity = o; s.style.position = ps;
      });
      list.style.minHeight = (max + 8) + 'px';
    }
    size();
    window.addEventListener('resize', size);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);

    var tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top top', end: '+=' + (n * 80) + '%', pin: true, scrub: .3, anticipatePin: 1,
      onUpdate: function (self) {
        var idx = Math.min(n - 1, Math.floor(self.progress * n));
        dots.forEach(function (d, i) { d.classList.toggle('is-on', i === idx); });
        if (num) num.textContent = String(idx + 1).padStart(2, '0');
        if (line) line.style.transform = 'scaleX(' + self.progress + ')';
      } } });
    for (var i = 1; i < n; i++) {
      tl.to({}, { duration: .6 })
        .to(stepsEl[i - 1], { opacity: 0, y: -14, duration: .15, ease: 'power2.in' })
        .set(stepsEl[i - 1], { display: 'none' })
        .set(stepsEl[i], { display: 'block' })
        .to(stepsEl[i], { opacity: 1, y: 0, duration: .3, ease: 'power2.out' });
    }
    tl.to({}, { duration: .6 });
  });
});

/* ---------- compare: pinned, the columns light one at a time ---------- */
WZ.section('b-compare', function (W) {
  document.querySelectorAll('.b-compare').forEach(function (sec) {
    var pin = sec.querySelector('.cp-pin'), cols = sec.querySelectorAll('.cp-col'), track = sec.querySelector('.cp-track i');
    wzTagIn(sec);
    wzLinesIn(sec.querySelector('.h2'));
    if (W.reduced) { cols.forEach(function (c) { c.classList.add('is-lit'); }); return; }
    var NARROW = window.innerWidth < 1024;
    if (NARROW) {
      cols.forEach(function (c, i) {
        gsap.from(c, { y: 30, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 85%', once: true, onEnter: function () { c.classList.add('is-lit'); } } });
      });
      return;
    }
    var n = cols.length;
    gsap.set(cols, { opacity: .35, y: 24 });
    var tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top top', end: '+=' + (n * 55 + 40) + '%', pin: true, scrub: .3, anticipatePin: 1,
      onUpdate: function (self) {
        if (track) track.style.transform = 'scaleX(' + self.progress + ')';
        cols.forEach(function (c, i) { c.classList.toggle('is-lit', self.progress > (i + .5) / (n + .5)); });
      } } });
    cols.forEach(function (c, i) {
      tl.to(c, { opacity: 1, y: 0, duration: .5, ease: 'power2.out' }, i * .7 + .2)
        .from(c.querySelectorAll('li'), { opacity: 0, x: -10, duration: .3, stagger: .06, ease: 'power2.out' }, i * .7 + .3);
    });
    var hot = sec.querySelector('.cp-col.is-hot');
    if (hot) tl.to(hot, { scale: 1.03, duration: .5, ease: 'power2.out' }, '>+.2');
    tl.to({}, { duration: .5 });
  });
});

/* ---------- strip: copy + photographs ---------- */
WZ.section('b-strip', function (W) {
  document.querySelectorAll('.b-strip').forEach(function (sec) {
    wzTagIn(sec);
    wzLinesIn(sec.querySelector('.h2'));
    wzWipes(sec);
    if (W.reduced) return;
    gsap.from(sec.querySelector('.ph-copy .lead') || sec.querySelector('.ph-body'), { y: 20, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
    var li = sec.querySelectorAll('.ph-list li');
    if (li.length) gsap.from(li, { y: 24, opacity: 0, duration: .9, ease: 'power3.out', stagger: .09, scrollTrigger: { trigger: sec.querySelector('.ph-list'), start: 'top 85%', once: true } });
    wzDepart(sec, sec.querySelector('.ph-grid'));
  });
});

/* ---------- ledger: pinned, the figure counts and the list draws ---------- */
WZ.section('b-ledger', function (W) {
  document.querySelectorAll('.b-ledger').forEach(function (sec) {
    var pin = sec.querySelector('.lg-pin'), items = sec.querySelectorAll('.lg-list li'), list = sec.querySelector('.lg-list');
    wzTagIn(sec);
    wzLinesIn(sec.querySelector('.h2'));
    if (W.reduced) { items.forEach(function (i) { i.classList.add('is-on'); }); list.classList.add('is-drawn'); wzCount(sec, 1); return; }
    var NARROW = window.innerWidth < 1024;
    if (NARROW) {
      list.classList.add('is-drawn');
      items.forEach(function (it) { ScrollTrigger.create({ trigger: it, start: 'top 88%', once: true, onEnter: function () { it.classList.add('is-on'); } }); });
      ScrollTrigger.create({ trigger: sec, start: 'top 60%', end: 'bottom 60%', scrub: true, onUpdate: function (self) { wzCount(sec, self.progress * 1.6); } });
      return;
    }
    var n = items.length;
    ScrollTrigger.create({ trigger: pin, start: 'top top', end: '+=' + (n * 28 + 40) + '%', pin: true, scrub: .3, anticipatePin: 1,
      onEnter: function () { list.classList.add('is-drawn'); },
      onUpdate: function (self) {
        wzCount(sec, self.progress * 1.25);
        items.forEach(function (it, i) { it.classList.toggle('is-on', self.progress > (i + .6) / (n + 1)); });
      } });
  });
});

/* ---------- proof: the before/after slider IS the scroll ---------- */
WZ.section('b-proof', function (W) {
  document.querySelectorAll('.b-proof').forEach(function (sec) {
    var pin = sec.querySelector('.ba-pin'), after = sec.querySelector('.ba-after'), handle = sec.querySelector('.ba-handle');
    wzTagIn(sec);
    wzLinesIn(sec.querySelector('.h2'));
    if (W.reduced) return;
    gsap.from(sec.querySelectorAll('.ba-quote, .ba-who, .ba-copy .lead, .ba-actions'), { y: 20, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
    var tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top top', end: '+=140%', pin: true, scrub: .35, anticipatePin: 1 } });
    tl.to({}, { duration: .2 })
      .fromTo(after, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 1, ease: 'none' })
      .fromTo(handle, { left: '100%' }, { left: '0%', duration: 1, ease: 'none' }, '<')
      .to({}, { duration: .35 });
  });
});

/* ---------- rail: pinned horizontal journey ---------- */
WZ.section('b-rail', function (W) {
  document.querySelectorAll('.b-rail').forEach(function (sec) {
    var pin = sec.querySelector('.rl-pin'), track = sec.querySelector('.rl-track'), bar = sec.querySelector('.rl-progress b'),
        count = sec.querySelector('.rl-count'), cards = track.querySelectorAll('.rl-card');
    wzTagIn(sec);
    wzLinesIn(sec.querySelector('.h2'));
    var TOUCH = WZ_TOUCH || window.innerWidth < 768;
    if (W.reduced) return;
    var label = function (idx) { count.textContent = String(idx).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0'); };
    if (TOUCH) {
      track.addEventListener('scroll', function () {
        var p = track.scrollLeft / (track.scrollWidth - track.clientWidth || 1);
        bar.style.transform = 'scaleX(' + p + ')';
        label(Math.min(cards.length, Math.round(p * (cards.length - 1)) + 1));
      }, { passive: true });
      gsap.from(cards, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: track, start: 'top 85%', once: true } });
      return;
    }
    function distance() { return track.scrollWidth - window.innerWidth + 8; }
    var tween = gsap.to(track, { x: function () { return -distance(); }, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + distance(); }, pin: pin, scrub: .3, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) { bar.style.transform = 'scaleX(' + self.progress + ')'; label(Math.min(cards.length, Math.floor(self.progress * cards.length) + 1)); } } });
    cards.forEach(function (c) {
      var im = c.querySelector('img');
      if (im) gsap.fromTo(im, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    gsap.from(cards, { y: 60, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: sec, start: 'top 60%', once: true } });
  });
});

/* ---------- gallery: pointer compares, scroll sweeps ---------- */
WZ.section('b-gallery', function (W) {
  document.querySelectorAll('.b-gallery').forEach(function (sec) {
    wzTagIn(sec);
    wzLinesIn(sec.querySelector('.h2'));
    var cards = sec.querySelectorAll('.ga-card');
    cards.forEach(function (card) {
      var stage = card.querySelector('.ga-stage'), after = card.querySelector('.ga-after'), handle = card.querySelector('.ga-handle');
      var set = function (pct) {
        pct = Math.max(2, Math.min(98, pct));
        after.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
        handle.style.left = pct + '%';
      };
      var active = false;
      var move = function (e) {
        var r = stage.getBoundingClientRect();
        set(((e.clientX - r.left) / r.width) * 100);
      };
      stage.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || active) move(e); });
      stage.addEventListener('pointerdown', function (e) { active = true; stage.setPointerCapture && stage.setPointerCapture(e.pointerId); move(e); });
      stage.addEventListener('pointerup', function () { active = false; });
      stage.addEventListener('pointercancel', function () { active = false; });
      /* alive without a hand on it: the reveal sweeps in once as the card enters */
      if (!W.reduced) {
        var o = { p: 100 };
        gsap.to(o, { p: 50, duration: 1.6, ease: 'power3.inOut', onUpdate: function () { if (!active) set(o.p); },
          scrollTrigger: { trigger: card, start: 'top 85%', once: true } });
        gsap.from(card, { y: 30, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 90%', once: true } });
      }
    });
  });
});

/* ---------- stories: the film cards play on hover ---------- */
WZ.section('b-stories', function (W) {
  document.querySelectorAll('.b-stories').forEach(function (sec) {
    wzTagIn(sec);
    wzLinesIn(sec.querySelector('.h2'));
    sec.querySelectorAll('.sy-card').forEach(function (card) {
      var v = card.querySelector('video[data-src-hover]');
      if (!v) return;
      card.addEventListener('pointerenter', function () {
        if (!v.getAttribute('src')) v.src = v.getAttribute('data-src-hover');
        v.play && v.play().catch(function () {});
      });
      card.addEventListener('pointerleave', function () { v.pause && v.pause(); });
    });
    if (W.reduced) return;
    gsap.from(sec.querySelectorAll('.sy-card'), { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: sec.querySelector('.sy-grid'), start: 'top 85%', once: true } });
  });
});

/* ---------- videos, team, detail, post index, place: arrive and depart ---------- */
WZ.section('b-videos', function (W) {
  document.querySelectorAll('.b-videos').forEach(function (sec) {
    wzTagIn(sec); wzLinesIn(sec.querySelector('.h2'));
    if (W.reduced) return;
    gsap.from(sec.querySelectorAll('.vd-card'), { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: sec.querySelector('.vd-grid'), start: 'top 85%', once: true } });
  });
});
WZ.section('b-team', function (W) {
  document.querySelectorAll('.b-team').forEach(function (sec) {
    wzTagIn(sec); wzLinesIn(sec.querySelector('.h2'));
    if (W.reduced) return;
    gsap.from(sec.querySelectorAll('.tm-card'), { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: sec.querySelector('.tm-grid'), start: 'top 85%', once: true } });
    gsap.from(sec.querySelectorAll('.tm-photo'), { clipPath: 'circle(0% at 50% 50%)', duration: 1.2, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: sec.querySelector('.tm-grid'), start: 'top 85%', once: true } });
  });
});
WZ.section('b-detail', function (W) {
  document.querySelectorAll('.b-detail').forEach(function (sec) {
    wzTagIn(sec); wzLinesIn(sec.querySelector('.h2'));
    if (W.reduced) return;
    var t = sec.querySelectorAll('.dt-body p, .dt-col, .dt-list li, .dt-actions');
    if (t.length) gsap.from(t, { y: 22, opacity: 0, duration: .9, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: sec, start: 'top 72%', once: true } });
    wzDepart(sec, sec.querySelector('.dt-in'));
  });
});
WZ.section('b-postindex', function (W) {
  document.querySelectorAll('.b-postindex').forEach(function (sec) {
    wzTagIn(sec); wzLinesIn(sec.querySelector('.h2'));
    if (W.reduced) return;
    sec.querySelectorAll('.px-card').forEach(function (c) {
      gsap.from(c, { y: 30, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 92%', once: true } });
    });
  });
});
WZ.section('b-place', function (W) {
  document.querySelectorAll('.b-place').forEach(function (sec) {
    wzTagIn(sec); wzLinesIn(sec.querySelector('.h2')); wzWipes(sec);
    if (W.reduced) return;
    gsap.from(sec.querySelectorAll('.pl-list li'), { y: 20, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: sec.querySelector('.pl-list'), start: 'top 85%', once: true } });
  });
});
WZ.section('b-prose', function (W) {
  document.querySelectorAll('.b-prose').forEach(function (sec) {
    if (W.reduced) return;
    sec.querySelectorAll('.pr2-body > *').forEach(function (el) {
      gsap.from(el, { y: 16, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true } });
    });
  });
});

/* ---------- faq: one accordion for every .faq on the site ---------- */
WZ.dom('faq', '.faq', function (W) {
  document.querySelectorAll('.faq').forEach(function (faq) {
    var items = faq.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var q = item.querySelector('.faq-q'), a = item.querySelector('.faq-a');
      if (!q || !a || q.getAttribute('data-bound')) return;
      q.setAttribute('data-bound', '1');
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') === 'true';
        items.forEach(function (o) {
          var oq = o.querySelector('.faq-q'), oa = o.querySelector('.faq-a');
          if (oq.getAttribute('aria-expanded') === 'true' && o !== item) {
            oq.setAttribute('aria-expanded', 'false');
            if (window.gsap) gsap.to(oa, { height: 0, duration: W.reduced ? 0 : .5, ease: 'power3.inOut' }); else oa.style.height = '0px';
          }
        });
        q.setAttribute('aria-expanded', String(!open));
        if (window.gsap) gsap.to(a, { height: open ? 0 : 'auto', duration: W.reduced ? 0 : .6, ease: 'power3.inOut', onComplete: function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); } });
        else a.style.height = open ? '0px' : 'auto';
      });
    });
  });
});
WZ.section('b-faq', function (W) {
  document.querySelectorAll('.b-faq').forEach(function (sec) {
    wzTagIn(sec); wzLinesIn(sec.querySelector('.h2'));
    if (W.reduced) return;
    gsap.from(sec.querySelectorAll('.faq-item'), { y: 16, opacity: 0, duration: .8, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: sec.querySelector('.faq'), start: 'top 88%', once: true } });
  });
});

/* ---------- tabs: text-only buttons switch panels ---------- */
WZ.dom('tabs', '.b-tabs', function () {
  document.querySelectorAll('.b-tabs').forEach(function (sec) {
    var btns = sec.querySelectorAll('.tb-btn'), panels = sec.querySelectorAll('.tb-panel');
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        btns.forEach(function (x, j) { x.classList.toggle('is-on', j === i); });
        panels.forEach(function (p, j) { p.classList.toggle('is-on', j === i); });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  });
});
