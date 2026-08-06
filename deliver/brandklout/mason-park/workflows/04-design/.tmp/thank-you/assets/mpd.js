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

  /* ------------------------------------------------------------------ *
   * Scroll reveals. Staggered per section, disabled under reduced motion.
   * ------------------------------------------------------------------ */
  function initReveals() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    var reduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    // Stagger siblings within a shared parent for a settled, unhurried feel.
    var groups = new Map();
    items.forEach(function (el) {
      var parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, 0);
      var i = groups.get(parent);
      el.style.setProperty("--d", Math.min(i, 5) * 70 + "ms");
      groups.set(parent, i + 1);
      io.observe(el);
    });
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
    initReveals();
    initAnchors();
    document.querySelectorAll("form[data-lead-form]").forEach(initForm);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
