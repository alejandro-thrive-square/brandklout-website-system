/* ==========================================================================
   THE CHAPTERS — one WZ.section() per beat. Scroll drives 01, 02, 03 and 05
   (pinned + scrubbed); every chapter arrives and departs.
   ========================================================================== */

/* shared helpers */
function wzLinesIn(el, opts){
  opts = opts || {};
  var W = window.WZ;
  if (W.reduced) { el.style.visibility = 'visible'; return; }
  var split = W.splitLines(el, function(self){
    el.style.visibility = 'visible';
    return gsap.from(self.lines, {
      yPercent: 110, opacity: 0, duration: 1.1, ease: 'power4.out', stagger: .09,
      delay: opts.delay || 0,
      scrollTrigger: opts.trigger === false ? null : { trigger: opts.trigger || el, start: opts.start || 'top 82%', once: true }
    });
  });
  if (!split) { el.style.visibility = 'visible'; }
}
function wzDepart(sec, targets){
  /* leaving a chapter: content recedes as the next one arrives */
  if (window.WZ.reduced) return;
  gsap.to(targets, { yPercent: -12, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'bottom 55%', end: 'bottom 5%', scrub: .3 } });
}
function wzTagIn(sec){
  var tag = sec.querySelector('.chapter-tag');
  if (!tag || window.WZ.reduced) return;
  var bar = tag.querySelector('i');
  gsap.from(tag, { x: -24, opacity: 0, duration: .9, ease: 'power3.out',
    scrollTrigger: { trigger: sec, start: 'top 80%', once: true } });
  if (bar) gsap.from(bar, { scaleX: 0, duration: 1.1, ease: 'power3.out', delay: .15,
    scrollTrigger: { trigger: sec, start: 'top 80%', once: true } });
}
function wzWipes(scope){
  if (window.WZ.reduced) return;
  scope.querySelectorAll('[data-wipe]').forEach(function(f, i){
    gsap.to(f, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power4.inOut', delay: i * .12,
      scrollTrigger: { trigger: f, start: 'top 85%', once: true } });
    var img = f.querySelector('.par');
    if (img) gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ---------- 00 ARRIVAL ---------- */
WZ.section('ch-arrival', function(W){
  var sec = document.querySelector('.ch-arrival'),
      film = document.getElementById('heroFilm'),
      veil = document.getElementById('heroVeil'),
      title = document.getElementById('heroTitle'),
      lead = document.getElementById('heroLead');
  var hides = sec.querySelectorAll('[data-anim="hide"]');

  if (film) { film.load && film.load(); film.play && film.play().catch(function(){}); }

  if (W.reduced) { hides.forEach(function(el){ el.style.visibility = 'visible'; }); return; }

  var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.fromTo(film, { scale: 1.22 }, { scale: 1.06, duration: 2.6, ease: 'power2.out' }, 0)
    .fromTo(veil, { opacity: 1 }, { opacity: .96, duration: 1.4 }, 0);

  var tag = sec.querySelector('.chapter-tag');
  tl.add(function(){ tag.style.visibility = 'visible'; }, .35)
    .from(tag, { x: -24, opacity: 0, duration: .9 }, .35)
    .from(tag.querySelector('i'), { scaleX: 0, duration: 1 }, .45);

  var split = W.splitLines(title, function(self){
    title.style.visibility = 'visible';
    return gsap.from(self.lines, { yPercent: 115, duration: 1.3, ease: 'power4.out', stagger: .11, delay: .55 });
  });
  if (!split) title.style.visibility = 'visible';

  tl.add(function(){ lead.style.visibility = 'visible'; }, 1)
    .from(lead, { y: 24, opacity: 0, duration: 1 }, 1);
  var actions = sec.querySelector('.ar-actions');
  tl.add(function(){ actions.style.visibility = 'visible'; }, 1.2)
    .from(actions.children, { y: 18, opacity: 0, duration: .9, stagger: .1 }, 1.2);
  var meta = sec.querySelectorAll('.ar-meta li');
  tl.add(function(){ meta.forEach(function(el){ el.style.visibility = 'visible'; }); }, 1.35)
    .from(meta, { y: 26, opacity: 0, duration: 1, stagger: .09 }, 1.35);
  var cue = sec.querySelector('.ar-cue');
  tl.add(function(){ cue.style.visibility = 'visible'; }, 2)
    .from(cue, { opacity: 0, duration: 1 }, 2);

  /* departure — the film drifts and scales up, the copy lifts away */
  gsap.to(film, { scale: 1.18, yPercent: 10, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to(sec.querySelector('.ar-in'), { yPercent: -18, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: sec, start: '35% top', end: 'bottom top', scrub: .3 } });
  gsap.to(cue, { opacity: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: '20% top', scrub: true } });
});

/* ---------- 01 THE REALITY: pinned, written by scroll ---------- */
WZ.section('ch-reality', function(W){
  var sec = document.querySelector('.ch-reality'),
      big = document.getElementById('realityBig'),
      after = document.getElementById('realityAfter'),
      img = document.getElementById('realityImg');
  wzTagIn(sec);
  if (W.reduced) return;

  var split = W.splitWords(big);
  var words = split ? split.words : [big];

  var tl = gsap.timeline({
    scrollTrigger: { trigger: sec, start: 'top top', end: '+=170%', pin: true, scrub: .3, anticipatePin: 1 }
  });
  tl.to(words, { opacity: 1, ease: 'none', stagger: { each: .06 }, duration: words.length * .06 }, 0)
    .to(after, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, '>-.1')
    .to({}, { duration: .5 });
  gsap.fromTo(img, { scale: 1.04 }, { scale: 1.19, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top top', end: '+=170%', scrub: true } });
  gsap.to(sec.querySelector('.re-bg'), { opacity: .08, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top top', end: '+=170%', scrub: true } });
});

/* ---------- 02 THE ANSWER: pinned horizontal journey ---------- */
WZ.section('ch-answer', function(W){
  var sec = document.querySelector('.ch-answer'),
      pin = document.getElementById('answerPin'),
      track = document.getElementById('answerTrack'),
      bar = document.getElementById('answerBar'),
      count = document.getElementById('answerCount'),
      cards = track.querySelectorAll('.an-card');
  wzTagIn(sec);
  wzLinesIn(document.getElementById('answerTitle'));
  var TOUCH = window.matchMedia('(hover:none) and (pointer:coarse)').matches || window.innerWidth < 768;

  if (W.reduced) return;

  if (TOUCH) {
    /* native swipe rail; progress bar follows the rail's own scroll */
    track.addEventListener('scroll', function(){
      var p = track.scrollLeft / (track.scrollWidth - track.clientWidth || 1);
      bar.style.transform = 'scaleX(' + p + ')';
      var idx = Math.min(cards.length, Math.round(p * (cards.length - 1)) + 1);
      count.textContent = String(idx).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
    }, { passive: true });
    gsap.from(cards, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08,
      scrollTrigger: { trigger: track, start: 'top 85%', once: true } });
    return;
  }

  function distance(){ return track.scrollWidth - window.innerWidth + 8; }
  var tween = gsap.to(track, { x: function(){ return -distance(); }, ease: 'none',
    scrollTrigger: {
      trigger: sec, start: 'top top', end: function(){ return '+=' + distance(); },
      pin: pin, scrub: .3, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: function(self){
        bar.style.transform = 'scaleX(' + self.progress + ')';
        var idx = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1);
        count.textContent = String(idx).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
      }
    } });
  /* each card's image drifts against the travel — depth */
  cards.forEach(function(c){
    var im = c.querySelector('img');
    gsap.fromTo(im, { xPercent: -6 }, { xPercent: 6, ease: 'none',
      scrollTrigger: { trigger: c, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
  });
  gsap.from(cards, { y: 60, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .08,
    scrollTrigger: { trigger: sec, start: 'top 60%', once: true } });
});

/* ---------- 03 PRECISION: the iris opens on the robot (signature) ---------- */
WZ.section('ch-precision', function(W){
  var sec = document.querySelector('.ch-precision'),
      pin = document.getElementById('precisionPin'),
      film = document.getElementById('precisionFilm'),
      video = document.getElementById('precisionVideo'),
      ring = pin.querySelector('.pr-ring'),
      words = pin.querySelectorAll('.pr-word');
  wzWipes(sec);
  wzLinesIn(document.getElementById('precisionTitle'));
  gsap.from(sec.querySelectorAll('.pr-list li'), { y: 24, opacity: 0, duration: .9, ease: 'power3.out', stagger: .07,
    scrollTrigger: { trigger: sec.querySelector('.pr-list'), start: 'top 85%', once: true } });

  ScrollTrigger.create({ trigger: pin, start: 'top 80%', end: 'bottom top',
    onEnter: function(){ video.play && video.play().catch(function(){}); },
    onEnterBack: function(){ video.play && video.play().catch(function(){}); },
    onLeave: function(){ video.pause && video.pause(); },
    onLeaveBack: function(){ video.pause && video.pause(); } });

  if (W.reduced) return;

  var tl = gsap.timeline({
    scrollTrigger: { trigger: pin, start: 'top top', end: '+=220%', pin: true, scrub: .3, anticipatePin: 1 }
  });
  tl.fromTo(film, { clipPath: 'circle(6% at 50% 50%)' }, { clipPath: 'circle(78% at 50% 50%)', duration: 1.6, ease: 'power2.inOut' }, 0)
    .fromTo(ring, { scale: 1, opacity: .9 }, { scale: 9, opacity: 0, duration: 1.4, ease: 'power2.in' }, 0)
    .fromTo(video, { scale: 1.16 }, { scale: 1.03, duration: 2.2, ease: 'none' }, 0)
    .to(words[0], { opacity: 1, y: 0, duration: .35, ease: 'power2.out' }, .35)
    .to(words[1], { opacity: 1, y: 0, duration: .35, ease: 'power2.out' }, .85)
    .to(words[2], { opacity: 1, y: 0, duration: .35, ease: 'power2.out' }, 1.35)
    .to({}, { duration: .5 })
    .to(words, { opacity: 0, y: -18, duration: .3, stagger: .05, ease: 'power2.in' }, 2.1)
    .to(film, { clipPath: 'circle(78% at 50% 50%)' }, 2.4);
});

/* ---------- 04 THE SURGEON ---------- */
WZ.section('ch-surgeon', function(W){
  var sec = document.querySelector('.ch-surgeon'),
      portrait = document.getElementById('surgeonPortrait');
  wzTagIn(sec);
  wzLinesIn(document.getElementById('surgeonTitle'));
  wzWipes(sec);
  if (W.reduced) return;
  gsap.fromTo(portrait, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'power4.inOut',
    scrollTrigger: { trigger: portrait, start: 'top 80%', once: true } });
  /* a gentle settle only — the head stays in frame (BugHerd #3) */
  var pimg = portrait.querySelector('img');
  gsap.fromTo(pimg, { scale: 1.06 }, { scale: 1.01, ease: 'none',
    scrollTrigger: { trigger: portrait, start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from(sec.querySelectorAll('.su-creds li'), { y: 24, opacity: 0, duration: .9, ease: 'power3.out', stagger: .09,
    scrollTrigger: { trigger: sec.querySelector('.su-creds'), start: 'top 85%', once: true } });
  gsap.from(sec.querySelector('.su-copy .lead'), { y: 20, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
  wzDepart(sec, sec.querySelector('.su-grid'));
});

/* ---------- 05 THE TRANSFORMATION: pinned, scroll turns the page ---------- */
WZ.section('ch-transformation', function(W){
  var sec = document.querySelector('.ch-transformation'),
      pin = document.getElementById('transPin'),
      shots = sec.querySelectorAll('.tr-shot'),
      stories = sec.querySelectorAll('.tr-story'),
      dots = sec.querySelectorAll('.tr-dots i');
  wzTagIn(sec);
  wzLinesIn(sec.querySelector('.tr-copy .h2'));
  if (W.reduced) return;

  /* The stories are stacked absolutely, so the container has no height of its
     own; when a story outgrew the CSS min-height the progress dots below it
     landed across the "Watch … story" link and read as a strike-through
     (BugHerd #8, #9). Size the container from the tallest story instead. */
  var stage = document.getElementById('transStories');
  function sizeStage(){
    var max = 0;
    stories.forEach(function(s){
      /* inset:0 stretches an absolute story to the container, so measure it
         in flow, not in place */
      var prev = s.style.display, prevOp = s.style.opacity, prevPos = s.style.position;
      s.style.display = 'block'; s.style.opacity = '0'; s.style.position = 'static';
      max = Math.max(max, s.offsetHeight);
      s.style.display = prev; s.style.opacity = prevOp; s.style.position = prevPos;
    });
    stage.style.minHeight = (max + 8) + 'px';
  }
  sizeStage();
  window.addEventListener('resize', function(){ sizeStage(); ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeStage);

  var n = stories.length;
  var tl = gsap.timeline({
    scrollTrigger: { trigger: pin, start: 'top top', end: '+=' + (n * 100) + '%', pin: true, scrub: .3, anticipatePin: 1,
      onUpdate: function(self){
        var idx = Math.min(n - 1, Math.floor(self.progress * n));
        dots.forEach(function(d, i){ d.classList.toggle('is-on', i === idx); });
      } }
  });
  /* slot 0 shows story 0; each subsequent slot wipes the next image over
     and crossfades the copy. A rest beat sits between each turn. */
  for (var i = 1; i < n; i++) {
    tl.to({}, { duration: .55 })
      .fromTo(shots[i], { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .45, ease: 'power3.inOut' })
      .fromTo(shots[i].querySelector('img'), { scale: 1.12 }, { scale: 1.04, duration: .6, ease: 'none' }, '<')
      .to(stories[i - 1], { opacity: 0, y: -14, duration: .14, ease: 'power2.in' }, '<')
      .set(stories[i - 1], { display: 'none' })
      .set(stories[i], { display: 'block' })
      .to(stories[i], { opacity: 1, y: 0, duration: .26, ease: 'power2.out' }, '<');
  }
  tl.to({}, { duration: .55 });
  wzDepart(sec, sec.querySelector('.tr-grid'));
});

/* ---------- 06 THE EXPERIENCE ---------- */
WZ.section('ch-experience', function(W){
  var sec = document.querySelector('.ch-experience'),
      img = document.getElementById('experienceImg');
  wzTagIn(sec);
  wzLinesIn(document.getElementById('experienceTitle'));
  if (W.reduced) return;
  gsap.fromTo(img, { yPercent: -10 }, { yPercent: 10, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from(sec.querySelectorAll('.ex-list li'), { y: 26, opacity: 0, duration: .9, ease: 'power3.out', stagger: .07,
    scrollTrigger: { trigger: sec.querySelector('.ex-list'), start: 'top 85%', once: true } });
  gsap.from(sec.querySelector('.ex-copy .lead'), { y: 20, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
  wzDepart(sec.querySelector('.ex-scene'), sec.querySelector('.ex-in'));
});

/* ---------- 06b THE PROOF: velocity-reactive marquee ---------- */
WZ.section('ch-proof', function(W){
  var sec = document.querySelector('.ch-proof'),
      row = sec.querySelector('.pf-row');
  wzLinesIn(document.getElementById('proofTitle'));
  /* the three static cards became the live Elfsight widget on 2026-09-30; an empty target list
     makes GSAP warn "target not found", which the console gate counts as a failure */
  var quotes = sec.querySelectorAll('.pf-quote');
  if (quotes.length) gsap.from(quotes, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1,
    scrollTrigger: { trigger: sec.querySelector('.pf-grid'), start: 'top 85%', once: true } });
  if (W.reduced) return;

  var set = row.querySelector('.pf-set');
  var loop = gsap.to(row, { xPercent: -50, ease: 'none', duration: 42, repeat: -1 });
  /* hover holds the strip still so a quote can be read (BugHerd #12) */
  var marquee = sec.querySelector('.pf-marquee'), held = false;
  marquee.addEventListener('pointerenter', function(){ held = true; gsap.to(loop, { timeScale: 0, duration: .5, ease: 'power2.out', overwrite: true }); });
  marquee.addEventListener('pointerleave', function(){ held = false; gsap.to(loop, { timeScale: 1, duration: .8, ease: 'power2.out', overwrite: true }); });
  /* scroll velocity bends the marquee: faster scroll = faster (and reversing) drift */
  var speed = { v: 1 };
  ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top',
    onUpdate: function(self){
      if (held) return;
      var v = gsap.utils.clamp(-6, 6, self.getVelocity() / 200);
      gsap.to(speed, { v: 1 + v, duration: .6, ease: 'power2.out', overwrite: true,
        onUpdate: function(){ if (!held) loop.timeScale(speed.v); } });
    } });
  /* the row lifts in */
  gsap.from(sec.querySelector('.pf-marquee'), { opacity: 0, y: 20, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
});

/* ---------- 08 THE INVITATION ---------- */
WZ.section('ch-invitation', function(W){
  var sec = document.querySelector('.ch-invitation'),
      form = document.getElementById('consultForm');
  wzTagIn(sec);
  wzLinesIn(document.getElementById('inviteTitle'));
  /* the form is a visual prototype for client review; submission is wired
     at build time (Instatic form module) — keep the demo from navigating */
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var btn = form.querySelector('.btn span');
    btn.textContent = 'Thank you — we will be in touch';
  });
  /* the accordion is bound once for every .faq on the site, in sections/blocks.js */
  if (W.reduced) return;
  if (sec.querySelector('.faq')) gsap.from(sec.querySelectorAll('.faq-item'), { y: 16, opacity: 0, duration: .8, ease: 'power3.out', stagger: .07,
    scrollTrigger: { trigger: sec.querySelector('.faq'), start: 'top 88%', once: true } });
  if (sec.querySelector('.in-next')) gsap.from(sec.querySelectorAll('.in-next-card'), { y: 24, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08,
    scrollTrigger: { trigger: sec.querySelector('.in-next'), start: 'top 88%', once: true } });
  gsap.from(form, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: form, start: 'top 85%', once: true } });
  gsap.from(sec.querySelectorAll('.in-contact div'), { y: 20, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08,
    scrollTrigger: { trigger: sec.querySelector('.in-contact'), start: 'top 88%', once: true } });
  var bg = sec.querySelector('.in-bg img');
  gsap.fromTo(bg, { yPercent: -8 }, { yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
});
