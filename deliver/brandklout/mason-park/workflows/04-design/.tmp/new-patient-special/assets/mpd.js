/* ==========================================================================
   Mason Park Dental — shared landing page behaviour
   Source Asana task GID: 1217040406855582
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * CLIENT CONSTANTS — the only block that changes per deployment.
   * Everything client-specific lives here so a swap is a one-line edit.
   * ------------------------------------------------------------------ */
  var MPD = (window.MPD = {
    // The practice's real public number (bestdentistinkatytx.com, every page).
    PUBLIC_PHONE: "(281) 769-8878",
    PUBLIC_PHONE_E164: "+12817698878",

    // ---- Call tracking is PER PAGE, not per client -------------------------
    // The outgoing vendor ran a different tracking number on each landing page
    // — (281) 767-8698 on Invisalign, (281) 688-1610 on the New Patient
    // Special — sharing one GTM container. Grand Mission's equivalent pages do
    // the same. Unifying these would destroy per-campaign call attribution, so
    // each page declares its own.
    //
    // Keyed by the page's data-page-key. `null` means "no tracking number
    // known for this page" and falls back to the public number.
    //
    // WARNING: the two numbers below were provisioned by the previous vendor
    // and their ownership is unconfirmed. Dial both before any spend starts.
    // See 01-content-intake/.tmp/vendor-originals.md
    TRACKING: {
      invisalign: { display: "(281) 767-8698", e164: "+12817678698" },
      "new-patient-special": { display: "(281) 688-1610", e164: "+12816881610" },
      // No vendor original exists for the thank-you page and Asana says
      // "Check GHL for proper tracking number" for it specifically.
      "thank-you": null,
    },

    // GHL inbound webhook that receives the lead. Not yet provisioned.
    WEBHOOK_URL: "{{GHL_INBOUND_WEBHOOK_URL}}",

    // Where a successful submit lands.
    THANK_YOU_URL: "../thank-you/index.html",

    BOOKING_URL: "https://www.flexbook.me/masonpark/1",
    MAP_URL:
      "https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450/@29.775949,-95.7512199,17z",
  });

  // Which page is this? Set by <body data-page-key="...">.
  MPD.pageKey = function () {
    return (document.body && document.body.getAttribute("data-page-key")) || "";
  };

  // The thank-you page is shared by both landing pages, so it cannot have a
  // tracking number of its own baked in. The redirecting form appends ?src=,
  // letting it carry the originating page's number through and keep the call
  // attributed to the campaign that produced the lead.
  MPD.sourceKey = function () {
    var src = new URLSearchParams(window.location.search).get("src");
    return src && Object.prototype.hasOwnProperty.call(MPD.TRACKING, src) ? src : "";
  };

  MPD.tracking = function () {
    var own = MPD.TRACKING[MPD.pageKey()];
    if (own) return own;
    var inherited = MPD.TRACKING[MPD.sourceKey()];
    return inherited || null;
  };

  MPD.phone = function () {
    var t = MPD.tracking();
    return t ? t.display : MPD.PUBLIC_PHONE;
  };
  MPD.phoneE164 = function () {
    var t = MPD.tracking();
    return t ? t.e164 : MPD.PUBLIC_PHONE_E164;
  };

  /* ------------------------------------------------------------------ *
   * Paint the active phone number into every [data-phone] slot.
   * ------------------------------------------------------------------ */
  // Dial targets and visible text are painted independently. An earlier version
  // treated data-phone="href" as "href only" and skipped the text, which meant
  // the visible number silently kept whatever was hard-coded in the HTML — it
  // only looked correct while that literal happened to match the constant.
  function paintPhones() {
    var display = MPD.phone();
    var href = "tel:" + MPD.phoneE164();

    document.querySelectorAll("a[data-phone]").forEach(function (el) {
      el.setAttribute("href", href);
    });
    document.querySelectorAll("[data-phone-text]").forEach(function (el) {
      el.textContent = display;
    });
  }

  /* ================================================================== *
   * MOTION
   *
   * Content is visible unless this code is alive to animate it — the
   * hidden states in the stylesheet are all gated behind `html.js`, so a
   * thrown exception here leaves a plain readable page, not a blank one.
   *
   * Nothing pins, nothing hijacks the scroll, and nothing that carries the
   * offer, the phone number or the form is gated behind an animation.
   * ================================================================== */
  var reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setAnim(el, kind, delay) {
    if (!el || el.hasAttribute("data-anim")) return;
    el.setAttribute("data-anim", kind);
    if (delay) el.style.setProperty("--d", delay + "ms");
  }

  // Text that rises from behind a hard edge needs an inner element to move.
  function wrapInner(el) {
    if (!el || el.querySelector(":scope > .anim-inner")) return;
    var inner = document.createElement("span");
    inner.className = "anim-inner";
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
  }

  function stagger(list, kind, step, base) {
    Array.prototype.forEach.call(list, function (el, i) {
      setAnim(el, kind, (base || 0) + Math.min(i, 6) * (step || 70));
    });
  }

  /* ---- Decide what animates, without touching the page's markup ---- */
  function planAnimations() {
    // Headline lines and section headings rise out of a mask.
    document.querySelectorAll("h1 .line").forEach(function (el, i) {
      setAnim(el, "mask", i * 90);
      wrapInner(el);
    });
    // An h1 authored without .line spans (the thank-you banner) would otherwise
    // get no mask at all. Mask it whole rather than splitting it into measured
    // line boxes — splitting before webfonts settle can lock in line breaks
    // that are wrong once the real face loads.
    document.querySelectorAll("h1").forEach(function (h1) {
      if (h1.querySelector(".line")) return;
      setAnim(h1, "mask", 90);
      wrapInner(h1);
    });
    document.querySelectorAll("main h2").forEach(function (el) {
      setAnim(el, "mask", 0);
      wrapInner(el);
    });

    // Eyebrow rules draw themselves in.
    document.querySelectorAll(".eyebrow").forEach(function (el) {
      el.classList.add("anim-eyebrow");
    });

    // Offer chips arrive in sequence rather than all at once.
    document.querySelectorAll(".chips").forEach(function (row) {
      stagger(row.querySelectorAll(".chip"), "rise", 55);
    });

    // Eyebrows and leads follow their heading.
    stagger(document.querySelectorAll(".head-block .eyebrow"), "rise", 0, 0);
    stagger(document.querySelectorAll(".head-block .lead, .split-body .lead"), "rise", 0, 140);

    // Media uncovers itself.
    document.querySelectorAll(".split-media, .doc-photo, .map-frame").forEach(function (el) {
      setAnim(el, "wipe", 0);
    });

    // Card grids settle in sequence.
    stagger(document.querySelectorAll(".grid .tile"), "scale", 80);
    stagger(document.querySelectorAll(".grid .review"), "scale", 90);
    stagger(document.querySelectorAll(".team figure"), "scale", 100);
    stagger(document.querySelectorAll(".trust-row img"), "rise", 60);
    stagger(document.querySelectorAll(".checks li"), "rise", 60);
    stagger(document.querySelectorAll(".steps .step"), "rise", 110);

    // The struck-through price draws its own line.
    document.querySelectorAll(".price-was").forEach(function (el) {
      el.classList.add("anim-price-was");
    });
  }

  /* ---- One observer drives everything ---- */
  function initObserver() {
    var targets = document.querySelectorAll(
      "[data-anim], .reveal, .price-was, .step"
    );
    if (!targets.length) return;

    function showAll() {
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add("is-in", "in");
      });
    }

    if (reduced || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    var pending = new Set();

    function show(el) {
      el.classList.add("is-in", "in");
      pending.delete(el);
      if (io) io.unobserve(el);
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) show(entry.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.04 }
    );

    Array.prototype.forEach.call(targets, function (el) {
      // Anything already on screen at load must never wait for a scroll.
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add("is-in", "in");
        return;
      }
      pending.add(el);
      io.observe(el);
    });

    // IntersectionObserver samples frames, so a fast flick-scroll can carry an
    // element past the viewport between samples and it is never reported —
    // leaving that section permanently invisible. This sweep is authoritative:
    // anything that has reached or passed the viewport is shown, whether or not
    // the observer ever saw it.
    function sweep() {
      if (!pending.size) return;
      var vh = window.innerHeight;
      Array.prototype.forEach.call(Array.from(pending), function (el) {
        if (el.getBoundingClientRect().top < vh * 0.94) show(el);
      });
      if (!pending.size) window.removeEventListener("scroll", onScroll);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        sweep();
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", sweep, { passive: true });
    window.setTimeout(sweep, 2500);
  }

  /* ---- Hero plays on load, on its own clock ---- */
  function initHero() {
    var hero = document.querySelector(".hero, .status-banner");
    if (!hero) return;
    var seq = hero.querySelectorAll(
      ".eyebrow, h1 .line, h1, .lead, .price-block, .chips .chip, .rating, .form-card, .ref-line, .status-mark"
    );
    Array.prototype.forEach.call(seq, function (el, i) {
      if (!el.hasAttribute("data-anim") && !el.classList.contains("chip")) {
        setAnim(el, "rise", 60 + i * 70);
      } else {
        el.style.setProperty("--d", 60 + i * 70 + "ms");
      }
    });
    // Kick them in on the next frame so the delays actually stage.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(seq, function (el) {
          el.classList.add("is-in", "in");
        });
      });
    });
  }

  /* ---- The headline price counts up to its real value ---- */
  function initCount() {
    document.querySelectorAll(".price-now").forEach(function (el) {
      var raw = (el.textContent || "").trim();
      var m = raw.match(/^\$([\d,]+)$/);
      if (!m) return;
      var target = parseInt(m[1].replace(/,/g, ""), 10);
      if (!isFinite(target) || target <= 0) return;

      var fmt = function (n) {
        return "$" + n.toLocaleString("en-US");
      };
      if (reduced) {
        el.textContent = fmt(target);
        return;
      }

      var started = false;
      var run = function () {
        if (started) return;
        started = true;
        var t0 = null;
        var dur = 1100;
        var tick = function (ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
          // Always lands on the exact figure, never a rounded approximation.
          else el.textContent = fmt(target);
        };
        requestAnimationFrame(tick);
      };

      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) {
                run();
                io.disconnect();
              }
            });
          },
          { threshold: 0.3 }
        );
        io.observe(el);
        // The hero price is above the fold; do not make it wait.
        window.setTimeout(run, 900);
      } else {
        run();
      }
    });
  }

  /* ---- Scroll progress hairline ---- */
  function initProgress() {
    if (reduced) return;
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      bar.style.transform = "scaleX(" + p + ")";
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  /* ---- Offer rail: offer + phone + form, one tap away at any depth ---- */
  function initRail() {
    var strip = document.querySelector(".offer-strip .wrap span");
    var book = document.querySelector('a[href="#book"]');
    if (!strip || !book) return; // post-conversion pages have neither

    var rail = document.createElement("div");
    rail.className = "offer-rail";
    rail.innerHTML =
      '<span class="rail-offer"></span>' +
      '<span class="rail-sep" aria-hidden="true"></span>' +
      '<a class="rail-call" data-phone="href" href="tel:' +
      MPD.phoneE164() +
      '"><span data-phone-text></span></a>' +
      '<a class="btn btn--sand" href="#book">Book now</a>';
    rail.querySelector(".rail-offer").textContent = (strip.textContent || "").trim();
    document.body.appendChild(rail);

    // Repaint so the rail carries this page's tracking number too.
    paintPhones();

    var anchor = document.querySelector(".hero");
    if (!anchor) return;

    if (!("IntersectionObserver" in window)) {
      rail.classList.add("is-up");
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          rail.classList.toggle("is-up", !e.isIntersecting);
        });
      },
      { threshold: 0, rootMargin: "-120px 0px 0px 0px" }
    );
    io.observe(anchor);
  }

  /* ---- Gentle parallax on photography ---- */
  function initParallax() {
    if (reduced) return;
    var items = document.querySelectorAll(".split-media img, .doc-photo img");
    if (!items.length) return;

    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      Array.prototype.forEach.call(items, function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var mid = r.top + r.height / 2;
        var off = ((mid - vh / 2) / vh) * -18; // max ~18px, stays subtle
        img.style.transform = "translate3d(0," + off.toFixed(2) + "px,0) scale(1.06)";
      });
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  /* ---- FAQ opens with height, not a snap ---- */
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
      if (reduced) return;

      summary.addEventListener("click", function (e) {
        e.preventDefault();
        if (d.open) {
          d.classList.remove("is-open");
          window.setTimeout(function () {
            d.open = false;
          }, 420);
        } else {
          d.open = true;
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              d.classList.add("is-open");
            });
          });
        }
      });
    });
  }

  /* ---- Header condenses once the page starts moving ---- */
  function initHeader() {
    var head = document.querySelector(".site-head");
    if (!head || reduced) return;
    var ticking = false;
    function update() {
      head.classList.toggle("is-condensed", window.scrollY > 90);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  /* ---- Pointer-following sheen on buttons ---- */
  function initButtons() {
    if (reduced) return;
    document.addEventListener(
      "pointermove",
      function (e) {
        var btn = e.target.closest && e.target.closest(".btn");
        if (!btn) return;
        var r = btn.getBoundingClientRect();
        btn.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        btn.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      },
      { passive: true }
    );
  }

  function initMotion() {
    document.documentElement.classList.add("js");
    planAnimations();
    initHero();
    initObserver();
    initCount();
    initProgress();
    initRail();
    initParallax();
    initFaq();
    initHeader();
    initButtons();
  }

  /* ------------------------------------------------------------------ *
   * Lead form: staged (intent -> details), validated, webhook POST.
   * ------------------------------------------------------------------ */
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
      panels.forEach(function (p, n) {
        p.classList.toggle("active", n === i);
      });
      bars.forEach(function (b, n) {
        b.classList.toggle("on", n <= i);
      });
      var focusable = panels[i] && panels[i].querySelector("input, button, textarea");
      if (focusable && i > 0) focusable.focus({ preventScroll: true });
    }

    // Step 1 — low-commitment intent question, then advance.
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
      btn.addEventListener("click", function () {
        show(Math.max(0, at - 1));
      });
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
        required.forEach(function (el) {
          touched[el.name] = true;
          paint(el);
        });
        return;
      }

      var original = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }
      if (statusEl) {
        statusEl.className = "form-msg";
        statusEl.textContent = "";
      }

      var payload = Object.assign(
        {
          full_name: (form.elements.full_name || {}).value || "",
          email: (form.elements.email || {}).value || "",
          phone: "+1" + digits((form.elements.phone || {}).value),
          intent: intent,
          consent: true,
          lp_offer: form.getAttribute("data-offer") || "",
          lp_asana_gid: form.getAttribute("data-asana-gid") || "",
          lp_page: MPD.pageKey(),
          lp_tracking_phone: MPD.phone(),
          lp_url: window.location.href,
          lp_submitted_at: new Date().toISOString(),
        },
        utmParams()
      );

      var unconfigured = /^\{\{.*\}\}$/.test(MPD.WEBHOOK_URL);
      if (unconfigured) {
        // No endpoint provisioned yet. Never fail silently and never pretend
        // the lead was sent — say so, and keep the phone route open.
        if (statusEl) {
          statusEl.className = "form-msg bad";
          statusEl.textContent =
            "Form endpoint not yet connected. Please call " + MPD.phone() + " to book.";
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = original;
        }
        form.dispatchEvent(new CustomEvent("mpd:lead", { detail: payload }));
        return;
      }

      fetch(MPD.WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          if (!r.ok) throw new Error("bad status " + r.status);
          // Carry the page key so the shared thank-you page shows this
          // campaign's tracking number rather than a generic one.
          var key = MPD.pageKey();
          window.location.href =
            MPD.THANK_YOU_URL + (key ? "?src=" + encodeURIComponent(key) : "");
        })
        .catch(function () {
          if (statusEl) {
            statusEl.className = "form-msg bad";
            statusEl.textContent =
              "Something went wrong. Please call us at " + MPD.phone() + ".";
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = original;
          }
        });
    });

    show(0);
    refresh();
  }

  /* ------------------------------------------------------------------ *
   * Today's hours, so the utility bar is never stale.
   * ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------ *
   * Smooth in-page jumps that respect reduced motion.
   * ------------------------------------------------------------------ */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var reduced =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        var input = target.querySelector("input, button.choice");
        if (input) window.setTimeout(function () { input.focus({ preventScroll: true }); }, reduced ? 0 : 600);
      });
    });
  }

  function init() {
    paintPhones();
    paintToday();
    initAnchors();
    document.querySelectorAll("form[data-lead-form]").forEach(initForm);

    // Motion last, and isolated: if anything in here throws, the page is still
    // a complete, readable, fully functional landing page.
    try {
      initMotion();
    } catch (err) {
      document.documentElement.classList.remove("js");
      if (window.console && console.warn) console.warn("motion disabled:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
