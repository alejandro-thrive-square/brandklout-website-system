(() => {
// External script from source design: ../_vendor/gsap/gsap.min.js

// External script from source design: ../_vendor/gsap/ScrollTrigger.min.js

// External script from source design: ../_vendor/gsap/ScrollToPlugin.min.js

// External script from source design: ../_vendor/gsap/SplitText.min.js

// External script from source design: ../shared/mpd.js

MPD.add(function (M) {
    var root = document.getElementById('arrival');
    var reveal = root.querySelectorAll('[data-anim="hide"]');
    gsap.set(reveal, { visibility: 'visible' });

    if (M.reduced) { gsap.set(reveal, { opacity: 1, y: 0 }); return; }

    var tl = gsap.timeline({ delay: 0.12 });
    var split = M.splitOnce(document.getElementById('arrTitle'));
    if (split && split.lines && split.lines.length) {
      gsap.set(split.lines, { yPercent: 110 });
      tl.to(split.lines, { yPercent: 0, duration: 1.05, stagger: 0.09, ease: 'power4.out' }, 0);
    } else {
      tl.from('#arrTitle', { opacity: 0, y: 40, duration: 1, ease: 'power3.out' }, 0);
    }
    tl.from(root.querySelector('.chapter-tag'), { opacity: 0, x: -22, duration: 0.85, ease: 'power3.out' }, 0.04)
      .from('#arrLead',  { opacity: 0, y: 24, duration: 0.85, ease: 'power3.out' }, 0.5)
      .from('#arrPrice', { opacity: 0, y: 24, duration: 0.85, ease: 'power3.out' }, 0.62)
      .from('#arrChips .chip', { opacity: 0, y: 18, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, 0.74)
      .from(root.querySelector('.rating'), { opacity: 0, y: 18, duration: 0.7, ease: 'power3.out' }, 0.86)
      .from('#book', { opacity: 0, y: 40, duration: 1.1, ease: 'power3.out' }, 0.3)
      .from('#arrBg', { opacity: 0, scale: 1.12, duration: 1.7, ease: 'power3.out' }, 0)
      .from(root.querySelector('.arr-cue'), { opacity: 0, duration: 0.7 }, 1);

    var priceEl = root.querySelector('[data-count-to]');
    if (priceEl) {
      var target = parseInt(priceEl.getAttribute('data-count-to'), 10);
      var o = { v: 0 };
      tl.to(o, {
        v: target, duration: 1.3, ease: 'power2.out',
        onUpdate: function () { priceEl.textContent = '$' + Math.round(o.v).toLocaleString('en-US'); },
        onComplete: function () { priceEl.textContent = '$' + target.toLocaleString('en-US'); }
      }, 0.62);
    }

    gsap.fromTo(root.querySelector('.price-was'), { '--strike': 0 }, {
      '--strike': 1, duration: 0.7, ease: 'power2.inOut', delay: 1.5
    });

    /* Departure — the chapter recedes as you leave it. */
    gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 } })
      .to(root.querySelector('.arr-in'), { yPercent: -12, opacity: 0.2, ease: 'none' }, 0)
      .to('#arrBg', { yPercent: 8, scale: 1.08, ease: 'none' }, 0);

    gsap.to(root.querySelector('.arr-cue i'), {
      scaleY: 0.3, transformOrigin: 'top', duration: 1.1, repeat: -1, yoyo: true, ease: 'power1.inOut'
    });
  });

MPD.add(function (M) {
    var pin = document.getElementById('catchPin');
    var statement = document.getElementById('catchStatement');
    var meter = document.getElementById('catchMeter');

    if (M.reduced) return;   // the copy is already fully legible in the markup

    var sp = M.splitWords(statement);
    if (!sp || !sp.words || !sp.words.length) return;

    /* One word, one owner: the closing clause is tinted by its own tween, so
       no word is written by two scrubbed tweens over overlapping ranges. */
    var tail = sp.words.slice(-5);
    var body = sp.words.slice(0, -5);

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=' + Math.round(window.innerHeight * 1.9),
        pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) { gsap.set(meter, { scaleX: self.progress }); }
      }
    });

    tl.to(body, { color: '#26292F', stagger: 0.5, ease: 'none' }, 0)
      .to(tail, { color: '#00B4D8', stagger: 0.5, ease: 'none' }, '>-0.2')
      .from('#catchAfter p', { opacity: 0, y: 22, stagger: 0.4, ease: 'none' }, '>-0.4');
  });

MPD.add(function (M) {
    var pin = document.getElementById('covPin');
    var figure = document.getElementById('covFigure');
    var state = document.getElementById('covState');
    var saving = document.getElementById('covSaving');
    var rail = document.getElementById('covRail');
    var marks = document.querySelectorAll('#covList .cov-mark');

    function money(v) { return '$' + Math.round(v).toLocaleString('en-US'); }

    if (M.reduced) {
      figure.textContent = '$189';
      state.textContent = 'New patient special';
      saving.textContent = '$328';
      gsap.set(rail, { scaleX: 1 });
      marks.forEach(function (m) {
        m.style.background = '#00B4D8';
        m.style.borderColor = '#00B4D8';
        m.querySelector('path').style.strokeDashoffset = '0';
      });
      return;
    }

    /* The fee is interpolated continuously between the two published figures,
       so 25%, 50% and 75% of the pin are three genuinely different states —
       roughly $435, $353 and $271 — rather than a snap between $517 and $189. */
    var o = { v: 517 };
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=' + Math.round(window.innerHeight * 2.1),
        pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) {
          gsap.set(rail, { scaleX: self.progress });
          var label = self.progress >= 0.98 ? 'New patient special' : 'Regular value';
          if (state.textContent !== label) state.textContent = label;
        }
      }
    });

    tl.to(o, {
      v: 189, ease: 'none', duration: 1,
      onUpdate: function () {
        figure.textContent = money(o.v);
        saving.textContent = money(517 - o.v);
      },
      onComplete: function () { figure.textContent = '$189'; saving.textContent = '$328'; }
    }, 0);

    /* Each inclusion checks itself off across the same pinned distance. */
    marks.forEach(function (mark, i) {
      tl.to(mark, {
        backgroundColor: '#00B4D8', borderColor: '#00B4D8', ease: 'none', duration: 0.32
      }, i * 0.24)
        .to(mark.querySelector('path'), { strokeDashoffset: 0, ease: 'none', duration: 0.28 }, i * 0.24 + 0.08);
    });

    gsap.from('#covers .chapter-tag, #covers h2, #covers .lead', {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#covers', start: 'top 70%' }
    });
  });

MPD.add(function (M) {
    var pin = document.getElementById('visPin');
    var spine = document.getElementById('visSpine');
    var steps = gsap.utils.toArray('#visSteps .vis-step');
    var horizontal = window.matchMedia('(min-width: 760px)').matches;

    function litDot(dot, on) {
      gsap.to(dot, {
        borderColor: on ? '#8FDCEC' : 'rgba(255,255,255,.14)',
        backgroundColor: on ? '#8FDCEC' : 'rgba(0,0,0,0)',
        color: on ? '#26292F' : 'rgba(255,255,255,.6)',
        duration: 0.35, ease: 'none'
      });
    }

    if (M.reduced) {
      gsap.set(spine, horizontal ? { scaleX: 1 } : { scaleY: 1 });
      steps.forEach(function (s) { litDot(s.querySelector('.vis-dot'), true); });
      return;
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=' + Math.round(window.innerHeight * 1.7),
        pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true
      }
    });

    /* The spine draws across the whole pinned distance; each step arrives and
       lights its dot at its own point along that draw. Because everything
       hangs off one scrubbed timeline, halfway through the pin is genuinely
       halfway through the story. */
    tl.fromTo(spine,
      horizontal ? { scaleX: 0 } : { scaleY: 0 },
      horizontal ? { scaleX: 1, ease: 'none', duration: 3 } : { scaleY: 1, ease: 'none', duration: 3 }, 0);

    steps.forEach(function (step, i) {
      tl.fromTo(step.querySelector('div'), { opacity: 0.15, y: 18 },
        { opacity: 1, y: 0, ease: 'none', duration: 0.7 }, i * 0.95)
        .add(function () { litDot(step.querySelector('.vis-dot'), true); }, i * 0.95 + 0.2)
        .add(function () { litDot(step.querySelector('.vis-dot'), false); }, i * 0.95 + 0.19);
    });

    /* Reverse scrolling must un-light the dots it passes back over, or the
       chapter cannot be re-read on the way up. */
    tl.eventCallback('onUpdate', function () {
      var p = tl.progress() * 3;
      steps.forEach(function (step, i) {
        litDot(step.querySelector('.vis-dot'), p >= i * 0.95 + 0.2);
      });
    });

    gsap.from('#visit .chapter-tag, #visit h2', {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#visit', start: 'top 70%' }
    });
  });

MPD.add(function (M) {
    if (M.reduced) { gsap.set('#teamGrid .doc-photo', { clipPath: 'inset(0 0 0% 0)' }); return; }

    /* Each portrait plate wipes open in turn, and the photo inside drifts
       against the scroll. Scale never lands on exactly 1 — that is where the
       edges hit sub-pixel boundaries and flicker. */
    gsap.utils.toArray('#teamGrid figure').forEach(function (fig, i) {
      gsap.to(fig.querySelector('.doc-photo'), {
        clipPath: 'inset(0 0 0% 0)', duration: 1.1, delay: i * 0.11, ease: 'power4.inOut',
        scrollTrigger: { trigger: '#teamGrid', start: 'top 82%' }
      });
      gsap.from(fig.querySelector('figcaption'), {
        opacity: 0, y: 18, duration: 0.8, delay: 0.35 + i * 0.11, ease: 'power3.out',
        scrollTrigger: { trigger: '#teamGrid', start: 'top 82%' }
      });
      gsap.fromTo(fig.querySelector('img'), { yPercent: -4, scale: 1.12 }, {
        yPercent: 4, scale: 1.06, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
      });
    });

    gsap.from('#team .head-block > *', {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#team', start: 'top 72%' }
    });
    gsap.from('#offerGrid .tile', {
      opacity: 0, y: 30, duration: 0.8, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '#offerGrid', start: 'top 86%' }
    });

    /* Departure. */
    gsap.to('#team .chapter-body', {
      yPercent: -4, opacity: 0.6, ease: 'none',
      scrollTrigger: { trigger: '#team', start: 'bottom 80%', end: 'bottom top', scrub: 0.6 }
    });
  });

MPD.add(function (M) {
    var score = document.getElementById('proofScore');
    if (M.reduced) { score.textContent = '5.0'; return; }

    gsap.from('#proof .proof-head > *', {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#proof', start: 'top 74%' }
    });
    gsap.from('#proofGrid .review', {
      opacity: 0, y: 34, duration: 0.8, stagger: 0.09, ease: 'power3.out',
      scrollTrigger: { trigger: '#proofGrid', start: 'top 85%' }
    });
    gsap.from('#accredRow img', {
      opacity: 0, y: 20, duration: 0.7, stagger: 0.07, ease: 'power3.out',
      scrollTrigger: { trigger: '#accredRow', start: 'top 90%' }
    });

    var o = { v: 0 };
    gsap.to(o, {
      v: 5, duration: 1.5, ease: 'power2.out',
      onUpdate: function () { score.textContent = o.v.toFixed(1); },
      scrollTrigger: { trigger: '#proof', start: 'top 70%' }
    });
  });

MPD.add(function (M) {
    if (M.reduced) { gsap.set('#invFig', { clipPath: 'inset(0 0 0% 0)' }); return; }

    gsap.to('#invFig', {
      clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power4.inOut',
      scrollTrigger: { trigger: '#invFig', start: 'top 84%' }
    });
    gsap.fromTo('#invFigImg', { yPercent: -5, scale: 1.14 }, {
      yPercent: 5, scale: 1.08, ease: 'none',
      scrollTrigger: { trigger: '#invFig', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
    });

    M.splitLines(document.getElementById('invPayTitle'), function (self) {
      return gsap.from(self.lines, {
        yPercent: 110, duration: 1, stagger: 0.09, ease: 'power4.out',
        scrollTrigger: { trigger: '#invPayTitle', start: 'top 86%' }
      });
    });

    gsap.from('#invChips .chip', {
      opacity: 0, y: 16, duration: 0.55, stagger: 0.035, ease: 'power2.out',
      scrollTrigger: { trigger: '#invChips', start: 'top 88%' }
    });

    M.splitLines(document.getElementById('invCloseTitle'), function (self) {
      return gsap.from(self.lines, {
        yPercent: 110, duration: 1, stagger: 0.09, ease: 'power4.out',
        scrollTrigger: { trigger: '#invClose', start: 'top 82%' }
      });
    });
    gsap.from('#invClose .btn-row', {
      opacity: 0, y: 24, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '#invClose', start: 'top 78%' }
    });
  });

// External script from source design: ../shared/mpd-flush.js
})();
