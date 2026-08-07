(() => {
// External script from source design: ../_vendor/gsap/gsap.min.js

// External script from source design: ../_vendor/gsap/ScrollTrigger.min.js

// External script from source design: ../_vendor/gsap/ScrollToPlugin.min.js

// External script from source design: ../_vendor/gsap/SplitText.min.js

// External script from source design: ../shared/mpd.js

MPD.add(function (M) {
    var root = document.getElementById('received');
    var reveal = root.querySelectorAll('[data-anim="hide"]');
    gsap.set(reveal, { visibility: 'visible' });

    if (M.reduced) {
      gsap.set(reveal, { opacity: 1, y: 0 });
      gsap.set('#tickPath', { strokeDashoffset: 0 });
      return;
    }

    var tl = gsap.timeline({ delay: 0.1 });

    /* The mark lands first and the tick draws inside it — the page's single
       job is to say "this worked", so that is the first thing that happens. */
    tl.from(root.querySelector('.status-mark'), {
      scale: 0.6, opacity: 0, duration: 0.75, ease: 'back.out(2)'
    }, 0)
      .fromTo('#tickPath', { strokeDashoffset: 30 },
        { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out' }, 0.35);

    var split = M.splitOnce(document.getElementById('recTitle'));
    if (split && split.lines && split.lines.length) {
      gsap.set(split.lines, { yPercent: 110 });
      tl.to(split.lines, { yPercent: 0, duration: 1, stagger: 0.09, ease: 'power4.out' }, 0.5);
    } else {
      tl.from('#recTitle', { opacity: 0, y: 32, duration: 0.9, ease: 'power3.out' }, 0.5);
    }

    tl.from(root.querySelector('.chapter-tag'), { opacity: 0, y: 14, duration: 0.7, ease: 'power3.out' }, 0.42)
      .from('#recLead', { opacity: 0, y: 22, duration: 0.85, ease: 'power3.out' }, 0.85)
      .from(root.querySelector('.ref-line'), { opacity: 0, y: 18, duration: 0.8, ease: 'power3.out' }, 1);

    /* Departure — the arrival recedes rather than simply scrolling away. */
    gsap.to(root.querySelector('.wrap'), {
      yPercent: -14, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
  });

MPD.add(function (M) {
    if (M.reduced) return;
    gsap.from('#callBox', {
      opacity: 0, y: 40, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '#callBox', start: 'top 88%' }
    });
    gsap.from('#callBox > div > *', {
      opacity: 0, y: 20, duration: 0.75, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '#callBox', start: 'top 82%' }
    });
  });

MPD.add(function (M) {
    var pin = document.getElementById('nextPin');
    var spine = document.getElementById('nextSpine');
    var steps = gsap.utils.toArray('#nextSteps .next-step');
    var horizontal = window.matchMedia('(min-width: 760px)').matches;

    function litDot(dot, on) {
      gsap.to(dot, {
        borderColor: on ? '#a8875f' : '#dfe4e6',
        backgroundColor: on ? '#a8875f' : '#fbf9f7',
        color: on ? '#ffffff' : '#778386',
        duration: 0.35, ease: 'none'
      });
    }

    if (M.reduced) {
      gsap.set(spine, horizontal ? { scaleX: 1 } : { scaleY: 1 });
      steps.forEach(function (s) { litDot(s.querySelector('.next-dot'), true); });
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

    tl.fromTo(spine,
      horizontal ? { scaleX: 0 } : { scaleY: 0 },
      horizontal ? { scaleX: 1, ease: 'none', duration: 3 } : { scaleY: 1, ease: 'none', duration: 3 }, 0);

    steps.forEach(function (step, i) {
      tl.fromTo(step.querySelector('div'), { opacity: 0.15, y: 18 },
        { opacity: 1, y: 0, ease: 'none', duration: 0.7 }, i * 0.95);
    });

    /* Dots are painted from progress rather than tweened in place, so
       scrolling back up un-lights them and the chapter can be re-read. */
    tl.eventCallback('onUpdate', function () {
      var p = tl.progress() * 3;
      steps.forEach(function (step, i) {
        litDot(step.querySelector('.next-dot'), p >= i * 0.95 + 0.2);
      });
    });

    gsap.from('#next .chapter-tag, #next h2', {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#next', start: 'top 70%' }
    });
  });

MPD.add(function (M) {
    var pin = document.getElementById('prepPin');
    var cards = gsap.utils.toArray('#prepList .prep-card');
    var ticks = gsap.utils.toArray('#prepList .prep-tick');
    var paths = gsap.utils.toArray('#prepList .prep-tick path');
    var close = document.getElementById('prepClose');

    if (M.reduced) {
      gsap.set(paths, { strokeDashoffset: 0 });
      gsap.set(ticks, { borderColor: '#a8875f', backgroundColor: '#f4ece2' });
      return;
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=' + Math.round(window.innerHeight * 1.6),
        pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true
      }
    });

    /* Offsets are chosen so that at 25%, 50% and 75% of the pin exactly one
       tick is mid-draw and the two either side are full or empty — the three
       readings the scrub proof samples are then genuinely different values,
       not three snapshots of the same finished state. */
    cards.forEach(function (card, i) {
      tl.fromTo(card,
        { opacity: 0.14, y: 56, rotate: -1.2 },
        { opacity: 1, y: 0, rotate: 0, ease: 'none', duration: 0.7 }, i * 1.0);
    });

    paths.forEach(function (path, i) {
      tl.fromTo(path, { strokeDashoffset: 34 },
        { strokeDashoffset: 0, ease: 'none', duration: 0.8 }, 0.4 + i * 0.9);
      /* The ring warms as its own tick lands. On the same timeline as the
         draw, so it reverses with the scroll instead of latching. */
      tl.fromTo(ticks[i],
        { borderColor: '#e6dccf', backgroundColor: '#f4ece2' },
        { borderColor: '#a8875f', backgroundColor: '#ffffff', ease: 'none', duration: 0.8 },
        0.4 + i * 0.9);
    });

    tl.fromTo(close, { opacity: 0.15, y: 16 },
      { opacity: 1, y: 0, ease: 'none', duration: 0.5 }, 2.5);

    gsap.from('#prepare .chapter-tag, #prepare h2, #prepare .lead', {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#prepare', start: 'top 70%' }
    });
  });

MPD.add(function (M) {
    if (M.reduced) { gsap.set('#teamGrid .doc-photo', { clipPath: 'inset(0 0 0% 0)' }); return; }

    /* Each portrait plate wipes open in turn and the photo drifts against the
       scroll. Scale never lands on exactly 1 — that is where the edges hit
       sub-pixel boundaries and flicker. */
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
    gsap.from('#accredRow img', {
      opacity: 0, y: 16, duration: 0.7, stagger: 0.07, ease: 'power3.out',
      scrollTrigger: { trigger: '#accredRow', start: 'top 90%' }
    });
  });

MPD.add(function (M) {
    var pin = document.getElementById('findPin');
    var rows = gsap.utils.toArray('#findHours li');

    /* Today's row is highlighted regardless of motion — it is information,
       not decoration. */
    var today = new Date().getDay();
    rows.forEach(function (li) {
      li.classList.toggle('is-today', parseInt(li.getAttribute('data-day'), 10) === today);
    });

    if (M.reduced) { gsap.set('#mapFrame', { clipPath: 'inset(0 0 0% 0)' }); return; }

    /* The chapter holds while the map un-crops and the week deals in. Both
       run off one scrubbed timeline, so the halfway point of the pin is the
       halfway point of the reveal. */
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=' + Math.round(window.innerHeight * 1.4),
        pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true
      }
    });

    tl.fromTo('#mapFrame', { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', ease: 'none', duration: 1.4 }, 0)
      .fromTo(rows, { opacity: 0.25, x: -14 },
        { opacity: 1, x: 0, ease: 'none', stagger: 0.18, duration: 0.4 }, 0.2);

    gsap.from('#find .chapter-tag, #find h2', {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#find', start: 'top 70%' }
    });
  });

// External script from source design: ../shared/mpd-flush.js

/* ==========================================================================
   Page-local: the open/closed indicator and the received timestamp.
   CLIENT-SPECIFIC BLOCK — the HOURS table below is the practice's own.
   Kept out of the shared runtime because only this page has a live
   open/closed readout, and Grand Mission's hours differ.
   ========================================================================== */
(function () {
  "use strict";
  var HOURS = [
    null,                                  // Sunday
    { open: [9, 0], close: [18, 0] },      // Monday
    { open: [8, 0], close: [17, 0] },      // Tuesday
    { open: [9, 0], close: [18, 0] },      // Wednesday
    { open: [8, 0], close: [17, 0] },      // Thursday
    null,                                  // Friday
    null,                                  // Saturday
  ];
  var NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function fmt(hm) {
    var h = hm[0], m = hm[1];
    var ap = h >= 12 ? "pm" : "am";
    var hh = h % 12 || 12;
    return hh + (m ? ":" + String(m).padStart(2, "0") : ":00") + " " + ap;
  }

  var now = new Date();
  var today = HOURS[now.getDay()];
  var mins = now.getHours() * 60 + now.getMinutes();
  var isOpen =
    !!today &&
    mins >= today.open[0] * 60 + today.open[1] &&
    mins < today.close[0] * 60 + today.close[1];

  var stateEl = document.querySelector("[data-open-state]");
  var dotEl = document.querySelector("[data-open-dot]");

  if (stateEl) {
    if (isOpen) {
      stateEl.textContent = "Open now until " + fmt(today.close);
    } else if (today) {
      stateEl.textContent =
        mins < today.open[0] * 60
          ? "Opens today at " + fmt(today.open)
          : "Closed for today — opens tomorrow";
    } else {
      // Find the next open day so the message is useful, not just "closed".
      for (var i = 1; i <= 7; i++) {
        var d = (now.getDay() + i) % 7;
        if (HOURS[d]) {
          stateEl.textContent =
            "Closed today — opens " + (i === 1 ? "tomorrow" : NAMES[d]) + " at " + fmt(HOURS[d].open);
          break;
        }
      }
    }
  }
  if (dotEl && isOpen) dotEl.classList.add("is-open");

  var ref = document.querySelector("[data-received-line]");
  if (ref) {
    ref.textContent =
      "Received " +
      now.toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit" });
  }
})();
})();
