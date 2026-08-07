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

    /* ---- Entrance: the headline splits into masked lines and rises ---- */
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

    /* The headline price counts to its real figure, then never moves again. */
    var priceEl = root.querySelector('[data-count-to]');
    if (priceEl) {
      var target = parseInt(priceEl.getAttribute('data-count-to'), 10);
      var o = { v: 0 };
      tl.to(o, {
        v: target, duration: 1.3, ease: 'power2.out',
        onUpdate: function () { priceEl.textContent = '$' + Math.round(o.v).toLocaleString('en-US'); },
        // Always land on the exact figure rather than a rounded approximation.
        onComplete: function () { priceEl.textContent = '$' + target.toLocaleString('en-US'); }
      }, 0.62);
    }

    /* The struck-through regular fee draws its own line. */
    gsap.fromTo(root.querySelector('.price-was'), { '--strike': 0 }, {
      '--strike': 1, duration: 0.7, ease: 'power2.inOut', delay: 1.5
    });

    /* ---- Departure: the chapter recedes as you leave it ---- */
    gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 } })
      .to(root.querySelector('.arr-in'), { yPercent: -12, opacity: 0.2, ease: 'none' }, 0)
      .to('#arrBg', { yPercent: 8, scale: 1.08, ease: 'none' }, 0);

    gsap.to(root.querySelector('.arr-cue i'), {
      scaleY: 0.3, transformOrigin: 'top', duration: 1.1, repeat: -1, yoyo: true, ease: 'power1.inOut'
    });
  });

MPD.add(function (M) {
    var root = document.getElementById('hesitation');
    var pin = document.getElementById('hesPin');
    var statement = document.getElementById('hesStatement');
    var meter = document.getElementById('hesMeter');

    if (M.reduced) return;   // the copy is already fully legible in the markup

    var sp = M.splitWords(statement);
    if (!sp || !sp.words || !sp.words.length) return;

    /* The chapter pins, and the words brighten one at a time across the pinned
       distance. Because the tween is scrubbed, the number of words read is a
       continuous function of scroll position — at 25%, 50% and 75% of the pin
       the statement is in three genuinely different states.

       The closing clause is excluded here and owned by the accent tween below.
       Two scrubbed tweens writing `color` on the same word over overlapping
       ranges overwrite each other every frame and flicker. One word, one owner. */
    var tail = sp.words.slice(-6);
    var body = sp.words.slice(0, -6);

    var st = {
      trigger: pin,
      start: 'top top',
      end: '+=' + Math.round(window.innerHeight * 1.9),
      pin: true,
      scrub: 0.3,
      anticipatePin: 1,
      invalidateOnRefresh: true
    };

    var tl = gsap.timeline({ scrollTrigger: Object.assign({}, st, {
      onUpdate: function (self) { gsap.set(meter, { scaleX: self.progress }); }
    }) });

    tl.to(body, { color: '#26292F', stagger: 0.5, ease: 'none' }, 0)
      .to(tail, { color: '#00B4D8', stagger: 0.5, ease: 'none' }, '>-0.2')
      .from('#hesAfter p', { opacity: 0, y: 22, stagger: 0.4, ease: 'none' }, '>-0.4');
  });

MPD.add(function (M) {
    var pin = document.getElementById('corPin');
    var track = document.getElementById('corTrack');
    var bar = document.getElementById('corBar');

    if (M.reduced) {
      /* Fall back to an ordinary horizontal scroll region — the content is
         still all reachable, it simply is not driven by the page scroll. */
      pin.style.height = 'auto';
      pin.style.paddingBlock = 'var(--chapter-y)';
      track.style.width = '100%';
      track.style.overflowX = 'auto';
      track.parentElement.querySelector('.cor-bar').style.display = 'none';
      return;
    }

    /* Travel distance is recomputed on every refresh, so it stays correct
       across resize, font loading and orientation change. */
    function distance() { return Math.max(0, track.scrollWidth - window.innerWidth + 32); }

    var tween = gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: function () { return '+=' + (distance() + window.innerHeight * 0.5); },
        pin: true,
        scrub: 0.3,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) { gsap.set(bar, { scaleX: self.progress }); }
      }
    });

    /* Each card lights as it reaches centre stage. containerAnimation lets a
       ScrollTrigger fire on horizontal position inside the pinned track. */
    gsap.utils.toArray('#corTrack .cor-card').forEach(function (card) {
      ScrollTrigger.create({
        trigger: card,
        containerAnimation: tween,
        start: 'left 74%',
        end: 'right 26%',
        onEnter: function () { light(card, true); },
        onEnterBack: function () { light(card, true); },
        onLeave: function () { light(card, false); },
        onLeaveBack: function () { light(card, false); }
      });
    });
    function light(card, on) {
      gsap.to(card, { borderColor: on ? 'rgba(0,180,216,.55)' : 'rgba(255,255,255,.14)', duration: 0.45 });
      gsap.to(card.querySelector('.no'), { opacity: on ? 1 : 0.4, duration: 0.45 });
    }

    gsap.from('#correction .cor-head > *', {
      opacity: 0, y: 22, duration: 0.85, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#correction', start: 'top 65%' }
    });
  });

MPD.add(function (M) {
    var pin = document.getElementById('incPin');
    var figure = document.getElementById('incFigure');
    var state = document.getElementById('incState');
    var rail = document.getElementById('incRail');
    var steps = document.getElementById('incSteps').children;
    var marks = document.querySelectorAll('#incList .inc-mark');

    var STAGES = [
      { at: 0.00, value: 4800, label: 'Regular fee' },
      { at: 0.50, value: 3800, label: 'Invisalign® special — $1,000 off' },
      { at: 1.00, value: 3300, label: 'Prepaid in full, out of pocket' }
    ];

    function paint(v) { figure.textContent = '$' + Math.round(v).toLocaleString('en-US'); }

    if (M.reduced) {
      /* Reduced motion shows the offer that matters — the current special —
         and the full ladder is still spelled out in the footer's offer terms. */
      paint(3800);
      state.textContent = 'Invisalign® special — $1,000 off';
      gsap.set(rail, { scaleX: 0.5 });
      marks.forEach(function (m) {
        m.style.background = '#00B4D8';
        m.style.borderColor = '#00B4D8';
        m.querySelector('path').style.strokeDashoffset = '0';
      });
      return;
    }

    /* One pin, one scrubbed timeline. The fee is interpolated continuously
       between the three published figures, so at 25% of the pin it reads
       roughly $4,300, at 50% exactly $3,800 and at 75% roughly $3,550 —
       three genuinely different states, which is what separates a scrubbed
       scene from a triggered one. */
    var o = { v: 4800 };
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=' + Math.round(window.innerHeight * 2.2),
        pin: true,
        scrub: 0.3,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var p = self.progress;
          gsap.set(rail, { scaleX: p });
          /* Label and step markers follow the same progress, so the readout
             can never disagree with the number above it. */
          var i = p >= 0.995 ? 2 : (p >= 0.5 ? 1 : 0);
          if (state.textContent !== STAGES[i].label) state.textContent = STAGES[i].label;
          for (var s = 0; s < steps.length; s++) steps[s].classList.toggle('on', s <= i);
        }
      }
    });

    tl.to(o, {
      v: 3800, ease: 'none', duration: 1,
      onUpdate: function () { paint(o.v); }
    }, 0)
      .to(o, {
        v: 3300, ease: 'none', duration: 1,
        onUpdate: function () { paint(o.v); }
      }, 1);

    /* Each inclusion checks itself off across the same pinned distance. */
    marks.forEach(function (mark, i) {
      tl.to(mark, {
        backgroundColor: '#00B4D8', borderColor: '#00B4D8', ease: 'none', duration: 0.35
      }, i * 0.45)
        .to(mark.querySelector('path'), { strokeDashoffset: 0, ease: 'none', duration: 0.3 }, i * 0.45 + 0.1);
    });

    gsap.from('#inclusion .chapter-tag, #inclusion h2, #inclusion .lead', {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#inclusion', start: 'top 70%' }
    });
  });

MPD.add(function (M) {
    if (M.reduced) { gsap.set('#provPlate', { clipPath: 'inset(0 0 0% 0)' }); return; }

    /* The portrait plate wipes open from the bottom, and the photo drifts
       against the scroll inside it. Scale never lands on 1 — at exactly 1 the
       edges land on sub-pixel boundaries and flicker while scrolling. */
    gsap.to('#provPlate', {
      clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power4.inOut',
      scrollTrigger: { trigger: '#provPlate', start: 'top 82%' }
    });
    gsap.fromTo('#provImg', { yPercent: -5, scale: 1.14 }, {
      yPercent: 5, scale: 1.08, ease: 'none',
      scrollTrigger: { trigger: '#provider', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
    });

    M.splitLines(document.getElementById('provTitle'), function (self) {
      return gsap.from(self.lines, {
        yPercent: 110, duration: 1, stagger: 0.09, ease: 'power4.out',
        scrollTrigger: { trigger: '#provTitle', start: 'top 84%' }
      });
    });
    gsap.from('#provLead, #provBio', {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '#provLead', start: 'top 84%' }
    });
    /* Credentials deal in one line at a time — the length of the list is the point. */
    gsap.from('#provCreds li', {
      opacity: 0, x: -20, duration: 0.55, stagger: 0.07, ease: 'power2.out',
      scrollTrigger: { trigger: '#provCreds', start: 'top 86%' }
    });
    gsap.from('#provWhy li', {
      opacity: 0, x: -20, duration: 0.55, stagger: 0.08, ease: 'power2.out',
      scrollTrigger: { trigger: '#provWhy', start: 'top 86%' }
    });
    gsap.from('#provider .prov-sig', {
      opacity: 0, x: -24, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '#provPlate', start: 'top 70%' }
    });

    /* Departure — the chapter recedes rather than simply ending. */
    gsap.to('#provider .prov-grid', {
      yPercent: -5, opacity: 0.55, ease: 'none',
      scrollTrigger: { trigger: '#provider', start: 'bottom 80%', end: 'bottom top', scrub: 0.6 }
    });
  });

MPD.add(function (M) {
    var score = document.getElementById('proofScore');

    if (M.reduced) { score.textContent = '5.0'; return; }

    gsap.from('#proof .proof-head > *', {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#proof', start: 'top 74%' }
    });
    /* Reviews deal in on a slight diagonal. */
    gsap.from('#proofGrid .review', {
      opacity: 0, y: 34, duration: 0.8, stagger: 0.09, ease: 'power3.out',
      scrollTrigger: { trigger: '#proofGrid', start: 'top 85%' }
    });
    gsap.from('#accredRow img', {
      opacity: 0, y: 20, duration: 0.7, stagger: 0.07, ease: 'power3.out',
      scrollTrigger: { trigger: '#accredRow', start: 'top 90%' }
    });

    /* The aggregate figure counts, matching the ledger's behaviour. */
    var o = { v: 0 };
    gsap.to(o, {
      v: 5, duration: 1.5, ease: 'power2.out',
      onUpdate: function () { score.textContent = o.v.toFixed(1); },
      scrollTrigger: { trigger: '#proof', start: 'top 70%' }
    });
  });

MPD.add(function (M) {
    if (M.reduced) { gsap.set('#invSteps .step', { '--fill': 1 }); return; }

    /* Each step's rule draws itself as the step arrives. */
    gsap.utils.toArray('#invSteps .step').forEach(function (step, i) {
      gsap.fromTo(step, { opacity: 0, y: 26 }, {
        opacity: 1, y: 0, duration: 0.85, delay: i * 0.09, ease: 'power3.out',
        scrollTrigger: { trigger: '#invSteps', start: 'top 84%' }
      });
      gsap.fromTo(step, { '--fill': 0 }, {
        '--fill': 1, duration: 0.9, delay: i * 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: '#invSteps', start: 'top 84%' }
      });
    });

    gsap.from('#invFaq details', {
      opacity: 0, y: 20, duration: 0.6, stagger: 0.05, ease: 'power2.out',
      scrollTrigger: { trigger: '#invFaq', start: 'top 84%' }
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
