/* Inner-page scenes. Each entry is a function the runtime (10-runtime.js) calls once the motion layer
   is armed, with { gsap, ScrollTrigger, SplitText, mm, $, $$, el, EASE, INK, DIM, scene, mark,
   refreshSoon, drawIn }. Loaded first, so the list exists before the runtime reads it. Every scene
   finds its parts by data- attributes (lib/ui.mjs writes them). Text never fades below 4.5:1 while
   it moves: unlit words start at the readable grey. */
window.WZScenes = window.WZScenes || [];

/* ---- arrival of an inner page: the photograph rises into its frame, then drifts as the page leaves ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap, $ = k.$, $$ = k.$$;
  var hero = $('[data-page-hero]');
  if (!hero) return;
  var media = $('[data-hero-media]', hero);
  var frame = media ? media.firstElementChild : null;
  var photo = frame ? $('img', frame) : null;
  var holds = $$('[data-hero-hold]', hero);
  gsap.from(holds, { y: 34, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: k.EASE, delay: 0.45 });
  if (frame) gsap.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', delay: 0.15, clearProps: 'clipPath' });
  if (photo) {
    gsap.fromTo(photo, { scale: 1.22 }, { scale: 1.06, duration: 2.2, ease: k.EASE, delay: 0.15 });
    gsap.to(photo, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }
  k.mm.add('(min-width: 992px)', function () {
    var content = hero.querySelector('h1');
    if (content) gsap.to(content, { y: -50, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
  });
  k.mark('page-hero');
});

/* ---- the answer: its first sentence is written by the scroll while the chapter holds ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap;
  k.$$('[data-scene="statement"]').forEach(function (body, n) {
    var lead = k.$('[data-words]', body);
    if (!lead) return;
    var ws = k.SplitText.create(lead, { type: 'words', wordsClass: 'split_word' }).words;
    gsap.set(ws, { color: k.DIM });
    var grid = body.parentNode;
    var write = function (tl) { return tl.fromTo(ws, { y: 6 }, { y: 0, color: k.INK, duration: 0.2, stagger: 0.2, ease: 'none' }).to({}, { duration: 0.6 }); };
    k.mm.add('(min-width: 992px)', function () { write(gsap.timeline({ scrollTrigger: k.scene(grid, '60%', 0.3, 'statement-' + n) })); });
    k.mm.add('(max-width: 991px)', function () { write(gsap.timeline({ scrollTrigger: { trigger: lead, start: 'top 82%', end: 'bottom 40%', scrub: 0.4 } })); });
  });
  /* any other line set large is written the same way, unpinned */
  k.$$('[data-words]').forEach(function (q) {
    if (q.closest('[data-scene]')) return;
    var ws = k.SplitText.create(q, { type: 'words', wordsClass: 'split_word' }).words;
    gsap.set(ws, { color: k.DIM });
    gsap.to(ws, { color: k.INK, stagger: 0.2, ease: 'none', scrollTrigger: { trigger: q, start: 'top 80%', end: 'bottom 45%', scrub: 0.4 } });
  });
  /* a patient's quote: the chapter holds while it is written */
  k.$$('[data-scene="quote"]').forEach(function (fig, n) {
    var q = k.$('[data-words]', fig);
    if (!q) return;
    var ws = k.SplitText.create(q, { type: 'words', wordsClass: 'split_word' }).words;
    gsap.set(ws, { color: k.DIM });
    var write = function (tl) { return tl.fromTo(ws, { y: 6 }, { y: 0, color: k.INK, duration: 0.2, stagger: 0.2, ease: 'none' }).to({}, { duration: 0.6 }); };
    k.mm.add('(min-width: 992px)', function () { write(gsap.timeline({ scrollTrigger: k.scene(fig, '60%', 0.3, 'quote-' + n) })); });
    k.mm.add('(max-width: 991px)', function () { write(gsap.timeline({ scrollTrigger: { trigger: q, start: 'top 82%', end: 'bottom 40%', scrub: 0.4 } })); });
  });
  k.mark('statement');
});

/* ---- what it fixes: the chapter holds while each mark draws itself and its line slides in ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap;
  k.$$('[data-scene="checks"]').forEach(function (list, n) {
    var items = k.$$('[data-check]', list);
    var play = function (tl) {
      items.forEach(function (item, i) {
        tl.fromTo(k.$('[data-check-mark]', item), { scale: 0.2, rotate: -90, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.5, ease: 'none' }, i * 0.35)
          .fromTo(item.lastElementChild, { x: i % 2 ? 60 : 30, autoAlpha: 0.7 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: 'none' }, i * 0.35);
      });
      return tl.to({}, { duration: 0.4 });
    };
    k.mm.add('(min-width: 992px)', function () { play(gsap.timeline({ scrollTrigger: k.scene(list.parentNode, '70%', 0.4, 'checks-' + n) })); });
    k.mm.add('(max-width: 991px)', function () { play(gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 85%', end: 'bottom 55%', scrub: 0.5 } })); });
  });
});

/* ---- a numbered index: each row slides in from the right, its numeral from further out ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap;
  var arrive = function (tl, row, at) {
    return tl.fromTo(k.$$('[data-index-part]', row), { x: 80 }, { x: 0, ease: 'none', stagger: 0.08 }, at)
      .fromTo(k.$('[data-index-number]', row), { x: 160, autoAlpha: 0.7 }, { x: 0, autoAlpha: 1, ease: 'none' }, at);
  };
  var each = function (rows) { rows.forEach(function (row) { arrive(gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 95%', end: 'top 58%', scrub: 0.6 } }), row, 0); }); };
  k.$$('[data-scene="index"]').forEach(function (list, n) {
    var rows = k.$$('[data-index-row]', list);
    if (!rows.length) return;
    k.mm.add('(min-width: 992px)', function () {
      var room = window.innerHeight - 24;
      var box = list.parentNode.offsetHeight <= room ? list.parentNode : list.offsetHeight <= room ? list : null;
      if (!box) { each(rows); return; }
      var tl = gsap.timeline({ scrollTrigger: k.scene(box, '70%', 0.5, 'index-' + n) });
      rows.forEach(function (row, i) { arrive(tl, row, i * 0.35); });
      tl.to({}, { duration: 0.4 });
    });
    k.mm.add('(min-width: 768px) and (max-width: 991px)', function () { each(rows); });
    k.mm.add('(max-width: 767px)', function () {
      rows.forEach(function (row) { gsap.from(row, { y: 30, autoAlpha: 0, duration: 0.8, ease: k.EASE, scrollTrigger: { trigger: row, start: 'top 90%', once: true } }); });
    });
  });
  k.mark('index');
});

/* ---- the path: the heading and a counter hold beside the steps; the counter follows the step at the
   centre of the window and a gold rule fills with the reading ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap, ST = k.ScrollTrigger;
  k.$$('[data-scene="path"]').forEach(function (grid, n) {
    var aside = k.$('[data-path-aside]', grid);
    var steps = k.$$('[data-path-step]', grid);
    var current = k.$('[data-path-current]', grid);
    var fill = k.$('[data-path-fill]', grid);
    var list = steps.length ? steps[0].parentNode : null;
    steps.forEach(function (s) {
      gsap.from(s.children, { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: k.EASE, scrollTrigger: { trigger: s, start: 'top 86%', once: true } });
      ST.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: function (self) { if (self.isActive && current) current.textContent = String(steps.indexOf(s) + 1).padStart(2, '0'); } });
    });
    if (fill && list) gsap.fromTo(fill, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 55%', end: 'bottom 55%', scrub: 0.4 } });
    k.mm.add('(min-width: 992px)', function () {
      if (!aside || !list) return;
      if (aside.offsetHeight > window.innerHeight - 140 || list.offsetHeight < aside.offsetHeight + 200) return;
      ST.create({ id: 'path-' + n, trigger: grid, start: 'top 110px', end: function () { return '+=' + Math.max(0, list.offsetHeight - aside.offsetHeight); }, pin: aside, pinSpacing: false, invalidateOnRefresh: true });
    });
  });
  k.mark('path');
});

/* ---- the timeline: the chapter holds while the gold line is drawn and each stage lights as it is reached ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap;
  k.$$('[data-scene="timeline"]').forEach(function (list, n) {
    var fill = k.$('[data-timeline-fill]', list);
    var items = k.$$('[data-timeline-item]', list);
    var build = function (vertical, trigger) {
      var tl = gsap.timeline({ scrollTrigger: trigger });
      if (fill) tl.fromTo(fill, vertical ? { scaleY: 0, scaleX: 1 } : { scaleX: 0 }, vertical ? { scaleY: 1, ease: 'none', duration: items.length } : { scaleX: 1, ease: 'none', duration: items.length }, 0);
      items.forEach(function (it, i) {
        tl.fromTo(k.$('[data-timeline-dot]', it), { backgroundColor: 'rgba(178,149,104,0)', scale: 0.6 }, { backgroundColor: 'rgba(178,149,104,1)', scale: 1, duration: 0.3, ease: 'none' }, i + 0.1)
          .fromTo(k.$$('h4, p', it), { y: 20, autoAlpha: 0.7 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }, i);
      });
      return tl.to({}, { duration: 0.5 });
    };
    k.mm.add('(min-width: 992px)', function () { build(false, k.scene(list.parentNode, '90%', 0.5, 'timeline-' + n)); });
    k.mm.add('(min-width: 768px) and (max-width: 991px)', function () { build(false, { trigger: list, start: 'top 80%', end: 'bottom 50%', scrub: 0.5 }); });
    k.mm.add('(max-width: 767px)', function () { build(true, { trigger: list, start: 'top 75%', end: 'bottom 55%', scrub: 0.5 }); });
  });
  k.mark('timeline');
});

/* ---- options: the chapter holds while the cards rise from staggered heights into line ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap;
  k.$$('[data-scene="cards"]').forEach(function (list, n) {
    var cards = k.$$('[data-card]', list);
    k.mm.add('(min-width: 992px)', function () {
      var fits = list.parentNode.offsetHeight <= window.innerHeight - 24;
      var tl = gsap.timeline({ scrollTrigger: fits ? k.scene(list.parentNode, '60%', 0.6, 'cards-' + n) : { trigger: list, start: 'top 95%', end: 'top 35%', scrub: 0.6 } });
      cards.forEach(function (c, i) { tl.fromTo(c, { y: 70 + (i % 4) * 45, autoAlpha: 0.7 }, { y: 0, autoAlpha: 1, ease: 'none' }, 0); });
    });
    k.mm.add('(min-width: 768px) and (max-width: 991px)', function () {
      var tl = gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 95%', end: 'top 35%', scrub: 0.6 } });
      cards.forEach(function (c, i) { tl.fromTo(c, { y: 50 + (i % 2) * 40, autoAlpha: 0.7 }, { y: 0, autoAlpha: 1, ease: 'none' }, 0); });
    });
    k.mm.add('(max-width: 767px)', function () {
      cards.forEach(function (c) { gsap.from(c, { y: 30, autoAlpha: 0, duration: 0.8, ease: k.EASE, scrollTrigger: { trigger: c, start: 'top 90%', once: true } }); });
    });
  });
});

/* ---- a comparison: row by row, our side fills to white as the reader reaches it ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap;
  k.$$('[data-scene="compare"]').forEach(function (table) {
    k.$$('[data-compare-row]', table).forEach(function (row) {
      var cells = row.children;
      gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 92%', end: 'top 62%', scrub: 0.5 } })
        .fromTo(cells[0], { x: -30, autoAlpha: 0.7 }, { x: 0, autoAlpha: 1, ease: 'none' }, 0)
        .fromTo(cells[1], { backgroundColor: 'rgba(255,255,255,0)' }, { backgroundColor: 'rgba(255,255,255,1)', ease: 'none' }, 0)
        .fromTo([cells[1], cells[2]], { y: 16 }, { y: 0, ease: 'none', stagger: 0.1 }, 0);
    });
  });
});

/* ---- the films: held while the two posters move from apart into their stagger and the play marks grow ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap;
  k.$$('[data-scene="films"]').forEach(function (list, n) {
    var cards = k.$$('[data-film]', list);
    k.mm.add('(min-width: 992px)', function () {
      var box = list.parentNode.offsetHeight <= window.innerHeight - 24 ? list.parentNode : list;
      var tl = gsap.timeline({ scrollTrigger: k.scene(box, '60%', 0.5, 'films-' + n) });
      cards.forEach(function (c, i) {
        tl.fromTo(c, { x: i % 2 ? 90 : -90, y: i % 2 ? 80 : 0 }, { x: 0, y: 0, ease: 'none', duration: 1 }, 0)
          .fromTo(k.$('.films_play', c), { scale: 0.55 }, { scale: 1, ease: 'none', duration: 0.6 }, 0.3);
      });
      tl.to({}, { duration: 0.3 });
    });
  });
  k.mark('films');
});

/* ---- financing: held while the lenders rise from staggered heights into one line ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap;
  k.$$('[data-scene="financing"]').forEach(function (list, n) {
    var cards = Array.prototype.slice.call(list.children);
    k.mm.add('(min-width: 992px)', function () {
      var box = list.parentNode.offsetHeight <= window.innerHeight - 24 ? list.parentNode : list;
      var tl = gsap.timeline({ scrollTrigger: k.scene(box, '60%', 0.5, 'financing-' + n) });
      cards.forEach(function (c, i) { tl.fromTo(c, { y: 60 + (i % 4) * 40, autoAlpha: 0.7 }, { y: 0, autoAlpha: 1, ease: 'none', duration: 1 }, 0); });
      tl.to({}, { duration: 0.3 });
    });
    k.mm.add('(max-width: 991px)', function () {
      gsap.from(cards, { y: 24, autoAlpha: 0, duration: 0.75, stagger: 0.09, ease: k.EASE, scrollTrigger: { trigger: list, start: 'top 88%', once: true } });
    });
  });
  k.mark('financing');
});

/* ---- the doctors: held while the portraits open from the bottom and the cards rise into line ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap;
  k.$$('[data-scene="team"]').forEach(function (list, n) {
    var cards = Array.prototype.slice.call(list.children);
    k.mm.add('(min-width: 992px)', function () {
      var box = list.parentNode.offsetHeight <= window.innerHeight - 24 ? list.parentNode : list;
      var tl = gsap.timeline({ scrollTrigger: k.scene(box, '60%', 0.5, 'team-' + n) });
      cards.forEach(function (c, i) {
        tl.fromTo(c, { y: 40 + i * 35 }, { y: 0, ease: 'none', duration: 1 }, 0);
        var frame = k.$('.team_frame', c);
        if (frame) tl.fromTo(frame, { clipPath: 'inset(35% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 0.8 }, i * 0.1);
      });
      tl.to({}, { duration: 0.3 });
    });
    k.mm.add('(max-width: 991px)', function () {
      gsap.from(cards, { y: 24, autoAlpha: 0, duration: 0.75, stagger: 0.09, ease: k.EASE, scrollTrigger: { trigger: list, start: 'top 88%', once: true } });
    });
  });
  k.mark('team');
});

/* ---- the specialist: held while his credentials and recognitions set themselves line by line ---- */
window.WZScenes.push(function (k) {
  var gsap = k.gsap;
  k.$$('[data-scene="specialist"]').forEach(function (grid, n) {
    var lines = k.$$('.credentials_item, .specialist_note', grid);
    /* set in type (no credentials): his name, role and lead slide in sideways; they rise on their own already */
    var named = !lines.length;
    if (named) lines = k.$$('.specialist_name, .specialist_role, .specialist_lead', grid);
    if (!lines.length) return;
    k.mm.add('(min-width: 992px)', function () {
      var tl = gsap.timeline({ scrollTrigger: k.scene(grid, '60%', 0.5, 'specialist-' + n) });
      lines.forEach(function (l, i) { tl.fromTo(l, named ? { x: 60 } : { x: 60, autoAlpha: 0.7 }, named ? { x: 0, ease: 'none', duration: 0.5 } : { x: 0, autoAlpha: 1, ease: 'none', duration: 0.5 }, i * 0.18); });
      tl.to({}, { duration: 0.3 });
    });
    if (!named) k.mm.add('(max-width: 991px)', function () {
      gsap.from(lines, { y: 24, autoAlpha: 0, duration: 0.75, stagger: 0.09, ease: k.EASE, scrollTrigger: { trigger: lines[0], start: 'top 88%', once: true } });
    });
  });
  k.mark('specialist');
});
