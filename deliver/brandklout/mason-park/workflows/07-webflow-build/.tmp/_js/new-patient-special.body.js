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

    tl.to(body, { color: '#1b2224', stagger: 0.5, ease: 'none' }, 0)
      .to(tail, { color: '#a8875f', stagger: 0.5, ease: 'none' }, '>-0.2')
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
        m.style.background = '#7f9a8b';
        m.style.borderColor = '#7f9a8b';
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
        backgroundColor: '#7f9a8b', borderColor: '#7f9a8b', ease: 'none', duration: 0.32
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
        borderColor: on ? '#c3a98e' : 'rgba(255,255,255,.14)',
        backgroundColor: on ? '#c3a98e' : 'rgba(0,0,0,0)',
        color: on ? '#1b2224' : 'rgba(255,255,255,.6)',
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
/* ==========================================================================
   Mason Park Dental — journey runtime, part 2 of 2 (FLUSH)
   Source Asana task GID: 1217040406855582

   Loaded at the END of <body>. Order matters and is the whole point of this
   file existing separately:

     1. register plugins  (body exists now — see the note in mpd.js)
     2. WAIT for webfonts
     3. flush every chapter's queued setup

   Step 2 is not politeness, it is the fix for a bug that silently deleted
   every pin on the page. Splitting a headline before its webfont arrives
   makes SplitText re-split later, and any ScrollTrigger.refresh() racing that
   re-split throws inside _swapPinOut ("node to be removed is no longer a
   child of this node"). ScrollTrigger catches nothing: the refresh aborts
   half-done with the pins already reverted, so pin spacing never returns.
   Measured on the thank-you page, that turned a 5929px document into a
   3436px one and made the last two chapters physically unreachable — with no
   console error once the throw was caught. Setting up once, after the fonts
   are in, means there is nothing to re-split and no refresh to race.

   The wait is raced against a timeout so a slow font never holds the page.

   There is deliberately NO ScrollSmoother. It is a technique in the reference,
   not a requirement of the standard, and it cost more than it paid here: it
   stopped driving the page a couple of seconds after load (gsap.ticker frozen
   while rAF ran on), and the standard itself warns that it breaks the
   full-page captures the responsive QA pass depends on. Native scrolling with
   ScrollTrigger gives the same pinned, scrubbed chapters with none of that.

   There is no IntersectionObserver anywhere in this runtime, deliberately. An
   observer can only say "this is visible now"; it cannot express how far
   through a chapter you are, which is what every scrubbed moment depends on.
   ========================================================================== */
(function () {
  "use strict";

  var M = window.MPD;
  if (!M) return;

  /* ================================================================== *
   * CONVERSION LAYER — runs first and never depends on GSAP.
   * The phone number, the offer and the form must work on a page where
   * the motion layer failed to load entirely.
   * ================================================================== */

  /* ---- Paint the active phone number into every slot ----
     Dial targets and visible text are painted independently. An earlier
     version treated data-phone="href" as "href only" and skipped the text,
     so the visible number silently kept whatever was hard-coded in the HTML
     — which only looked correct while that literal happened to match. */
  function paintPhones() {
    var display = M.phone();
    var href = "tel:" + M.phoneE164();
    document.querySelectorAll("a[data-phone]").forEach(function (el) {
      el.setAttribute("href", href);
    });
    document.querySelectorAll("[data-phone-text]").forEach(function (el) {
      el.textContent = display;
    });
  }

  /* ---- Today's hours, so the header is never stale ---- */
  var HOURS = [
    { day: "Sunday", open: null },
    { day: "Monday", open: "9:00 am", close: "6:00 pm" },
    { day: "Tuesday", open: "8:00 am", close: "5:00 pm" },
    { day: "Wednesday", open: "9:00 am", close: "6:00 pm" },
    { day: "Thursday", open: "8:00 am", close: "5:00 pm" },
    { day: "Friday", open: null },
    { day: "Saturday", open: null },
  ];

  function paintToday() {
    var slot = document.querySelector("[data-today-hours]");
    if (!slot) return;
    var t = HOURS[new Date().getDay()];
    slot.textContent = t.open ? "Open today " + t.open + " – " + t.close : "Closed today";
  }

  /* ---- Lead form: staged (intent -> details), validated, webhook POST ---- */
  function digits(v) {
    return (v || "").replace(/\D/g, "").slice(0, 10);
  }

  function formatPhone(v) {
    var d = digits(v);
    if (d.length > 6) return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
    if (d.length > 3) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    if (d.length > 0) return "(" + d;
    return "";
  }

  function utmParams() {
    var p = new URLSearchParams(window.location.search);
    var out = {};
    [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "gclid", "fbclid", "campaign_id", "adgroup_name", "keyword",
    ].forEach(function (k) {
      if (p.get(k)) out[k] = p.get(k);
    });
    return out;
  }

  function initForm(form) {
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var panels = Array.prototype.slice.call(form.querySelectorAll(".step-panel"));
    var bars = Array.prototype.slice.call(form.querySelectorAll(".progress span"));
    var submitBtn = form.querySelector('[type="submit"]');
    var statusEl = form.querySelector(".form-msg");
    var consent = form.querySelector('[name="consent"]');
    var honeypot = form.querySelector(".hp-field");
    var required = Array.prototype.slice.call(form.querySelectorAll("[data-required]"));
    var touched = {};
    var intent = "";
    var at = 0;

    function show(i) {
      at = i;
      panels.forEach(function (p, n) { p.classList.toggle("active", n === i); });
      bars.forEach(function (b, n) { b.classList.toggle("on", n <= i); });
      var focusable = panels[i] && panels[i].querySelector("input, button, textarea");
      if (focusable && i > 0) focusable.focus({ preventScroll: true });
      if (M.refreshSoon) M.refreshSoon();
    }

    form.querySelectorAll(".choice").forEach(function (btn) {
      btn.addEventListener("click", function () {
        form.querySelectorAll(".choice").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        intent = btn.getAttribute("data-value") || btn.textContent.trim();
        if (panels.length > 1) window.setTimeout(function () { show(1); }, 180);
        refresh();
      });
    });

    form.querySelectorAll("[data-back]").forEach(function (btn) {
      btn.addEventListener("click", function () { show(Math.max(0, at - 1)); });
    });

    function valid(el) {
      var v = (el.value || "").trim();
      if (el.type === "email") return EMAIL.test(v);
      if (el.type === "tel") return digits(v).length === 10;
      return v.length >= 2;
    }

    function message(el) {
      if (el.type === "email") return "Please enter a valid email address";
      if (el.type === "tel") return "Please enter a 10-digit phone number";
      return "Please enter your full name";
    }

    function paint(el) {
      var err = el.parentElement.querySelector(".err");
      var ok = valid(el);
      if (touched[el.name] && !ok) {
        el.classList.add("invalid");
        el.setAttribute("aria-invalid", "true");
        if (err) err.textContent = message(el);
      } else {
        el.classList.remove("invalid");
        el.removeAttribute("aria-invalid");
        if (err) err.textContent = "";
      }
    }

    function allValid() {
      return required.every(valid) && (!consent || consent.checked);
    }
    function refresh() {
      if (submitBtn) submitBtn.disabled = !allValid();
    }

    required.forEach(function (el) {
      el.addEventListener("input", function () {
        if (el.type === "tel") el.value = formatPhone(el.value);
        touched[el.name] = true;
        paint(el);
        refresh();
      });
      el.addEventListener("blur", function () {
        touched[el.name] = true;
        paint(el);
      });
    });
    if (consent) consent.addEventListener("change", refresh);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (honeypot && honeypot.value) return; // bot
      if (!allValid()) {
        required.forEach(function (el) { touched[el.name] = true; paint(el); });
        return;
      }

      var original = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }
      if (statusEl) { statusEl.className = "form-msg"; statusEl.textContent = ""; }

      var payload = Object.assign(
        {
          full_name: (form.elements.full_name || {}).value || "",
          email: (form.elements.email || {}).value || "",
          phone: "+1" + digits((form.elements.phone || {}).value),
          intent: intent,
          consent: true,
          lp_offer: form.getAttribute("data-offer") || "",
          lp_asana_gid: form.getAttribute("data-asana-gid") || "",
          lp_page: M.pageKey(),
          lp_tracking_phone: M.phone(),
          lp_url: window.location.href,
          lp_submitted_at: new Date().toISOString(),
        },
        utmParams()
      );

      var unconfigured = /^\{\{.*\}\}$/.test(M.WEBHOOK_URL);
      if (unconfigured) {
        // No endpoint provisioned yet. Never fail silently and never pretend
        // the lead was sent — say so, and keep the phone route open.
        if (statusEl) {
          statusEl.className = "form-msg bad";
          statusEl.textContent =
            "Form endpoint not yet connected. Please call " + M.phone() + " to book.";
        }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = original; }
        form.dispatchEvent(new CustomEvent("mpd:lead", { detail: payload }));
        return;
      }

      fetch(M.WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          if (!r.ok) throw new Error("bad status " + r.status);
          // Carry the page key so the shared thank-you page shows this
          // campaign's tracking number rather than a generic one.
          var key = M.pageKey();
          window.location.href =
            M.THANK_YOU_URL + (key ? "?src=" + encodeURIComponent(key) : "");
        })
        .catch(function () {
          if (statusEl) {
            statusEl.className = "form-msg bad";
            statusEl.textContent = "Something went wrong. Please call us at " + M.phone() + ".";
          }
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = original; }
        });
    });

    show(0);
    refresh();
  }

  /* ---- FAQ: opens with height rather than a snap. Content, not decoration,
         so it works with reduced motion too — the CSS collapses the duration. */
  function initFaq() {
    document.querySelectorAll(".faq details").forEach(function (d) {
      var answer = d.querySelector(".answer");
      var summary = d.querySelector("summary");
      if (!answer || !summary) return;

      if (!answer.parentElement.classList.contains("answer-wrap")) {
        var wrap = document.createElement("div");
        wrap.className = "answer-wrap";
        answer.parentNode.insertBefore(wrap, answer);
        wrap.appendChild(answer);
      }

      summary.addEventListener("click", function (e) {
        e.preventDefault();
        if (d.open) {
          d.classList.remove("is-open");
          window.setTimeout(function () {
            d.open = false;
            if (M.refreshSoon) M.refreshSoon();
          }, M.reduced ? 0 : 420);
        } else {
          d.open = true;
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              d.classList.add("is-open");
              if (M.refreshSoon) M.refreshSoon();
            });
          });
        }
      });
    });
  }

  /* ---- The sticky call bar must reserve its own height, or it covers the
         last chapter and — worse — the form's submit button. ---- */
  function measureBar() {
    var bar = document.querySelector(".sticky-bar");
    if (!bar) return;
    var h = window.getComputedStyle(bar).display === "none" ? 0 : bar.offsetHeight;
    document.documentElement.style.setProperty("--bar-h", h + "px");
  }

  paintPhones();
  paintToday();
  initFaq();
  document.querySelectorAll("form[data-lead-form]").forEach(initForm);
  measureBar();
  window.addEventListener("resize", measureBar, { passive: true });

  /* ================================================================== *
   * MOTION LAYER
   * ================================================================== */

  if (!M.ok) {
    // GSAP missing: reveal everything so the page is still readable.
    document.documentElement.classList.remove("mpd-armed");
    M.flushQueue();
    return;
  }

  // Register HERE, not in <head> — body must exist before ScrollTrigger inits.
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  document.documentElement.classList.add("mpd-ready");

  /* Wait for the webfonts, then build the journey exactly once. See the header
     comment: splitting before the fonts land is what made every pin collapse.
     Raced against a timeout so a font CDN outage delays the motion rather than
     withholding it. */
  var fontsReady = document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();
  Promise.race([
    fontsReady,
    new Promise(function (r) { window.setTimeout(r, 1800); }),
  ]).then(buildJourney);

function buildJourney() {
  // Every chapter's setup runs now, against a settled layout.
  M.flushQueue();

  /* ---- Reading progress: real document progress, along the header edge ---- */
  var progressEl = document.getElementById("headProgress");
  if (progressEl && !M.reduced) {
    gsap.to(progressEl, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.25 },
    });
  }

  /* ---- Chapter readout: which beat of the journey you are in ---- */
  var readoutNo = document.getElementById("chapterNo");
  var readoutName = document.getElementById("chapterName");
  var chapters = gsap.utils.toArray("section[data-chapter]");
  chapters.forEach(function (sec) {
    var i = parseInt(sec.getAttribute("data-chapter"), 10);
    var name = sec.getAttribute("data-chapter-name") || "";
    function activate() {
      if (readoutNo) readoutNo.textContent = String(i).padStart(2, "0");
      if (readoutName) readoutName.textContent = name;
    }
    ScrollTrigger.create({
      trigger: sec,
      start: "top 60%",
      end: "bottom 40%",
      onEnter: activate,
      onEnterBack: activate,
    });
  });

  /* ---- Header condenses once the journey starts moving ---- */
  var head = document.querySelector(".site-head");
  if (head) {
    ScrollTrigger.create({
      start: 40,
      end: "max",
      onToggle: function (self) { head.classList.toggle("is-solid", self.isActive); },
    });
  }

  /* ---- Offer rail: raised once the hero's own offer has left the screen.
         Reduced motion shows it immediately rather than never. ---- */
  (function initRail() {
    var rail = document.querySelector(".offer-rail");
    if (!rail) return;
    var arrival = document.querySelector("[data-chapter='0']");
    if (!arrival) { rail.classList.add("is-up"); return; }
    if (M.reduced) { rail.classList.add("is-up"); return; }
    ScrollTrigger.create({
      trigger: arrival,
      start: "bottom 85%",
      end: "max",
      onToggle: function (self) { rail.classList.toggle("is-up", self.isActive); },
    });
  })();

  /* ---- Anchors offset past the fixed header, so a jump into a pinned
         chapter lands on the pin rather than under the header ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (window.ScrollToPlugin) {
        gsap.to(window, {
          duration: M.reduced ? 0 : 0.9,
          scrollTo: { y: t, offsetY: 90, autoKill: true },
          ease: "power2.inOut",
        });
      } else {
        t.scrollIntoView({ behavior: M.reduced ? "auto" : "smooth", block: "start" });
      }
      var input = t.querySelector("input, button.choice");
      if (input) window.setTimeout(function () { input.focus({ preventScroll: true }); }, M.reduced ? 0 : 700);
    });
  });

  /* ---- Magnetic CTAs, pointer-fine only ---- */
  if (!M.reduced && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
      var yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.2);
        yTo((e.clientY - r.top - r.height / 2) * 0.34);
      });
      el.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ---- Pointer-following sheen on every button ---- */
  if (!M.reduced) {
    document.addEventListener("pointermove", function (e) {
      var btn = e.target.closest && e.target.closest(".btn");
      if (!btn) return;
      var r = btn.getBoundingClientRect();
      btn.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      btn.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    }, { passive: true });
  }

  /* ---- Re-measure after a user interaction genuinely changes layout ----
     Opening an FAQ answer or stepping the form changes the height of content
     that sits ABOVE a pinned chapter, so every pin below it is now measured
     against the wrong page and the scrub drifts.

     Debounced, and never called during startup. ScrollTrigger already
     refreshes itself on load and resize; the only manual refresh this page
     makes is in response to a click, long after the fonts and the splits have
     settled. That matters: a refresh landing while SplitText re-splits throws
     inside _swapPinOut, and ScrollTrigger cannot recover — it aborts with the
     pins already reverted and the pin spacing never comes back. */
  var refreshQueued = false;
  function refreshSoon() {
    if (refreshQueued) return;
    refreshQueued = true;
    window.setTimeout(function () {
      refreshQueued = false;
      try {
        ScrollTrigger.refresh();
      } catch (e) {
        if (window.console && console.warn) console.warn("ScrollTrigger.refresh", e);
      }
    }, 220);
  }
  M.refreshSoon = refreshSoon;

  // Late images (the map iframe, lazy photography) can change height too, but
  // ScrollTrigger's own load handler already covers that — deliberately not
  // duplicated here.
  window.addEventListener("load", measureBar);
}
})();
