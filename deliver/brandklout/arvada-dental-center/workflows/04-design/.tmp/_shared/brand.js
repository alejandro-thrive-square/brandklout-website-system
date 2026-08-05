/* ===========================================================================
   Arvada Dental Center & Implants — shared landing page behaviour
   Asana parent task: 1217040406855586

   Everything here degrades safely: with JS off the FAQ answers are visible,
   the qualifier falls back to a plain form, and every CTA is still a real
   link or a real tel: href.
   =========================================================================== */
(function () {
  "use strict";

  var reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- practice hours: real, from the client's JSON-LD ----------
     Mon–Fri 08:00–17:00 America/Denver, closed weekends. Used for the live
     open/closed pill. We deliberately do NOT claim "open now" 24/7 the way
     the emergency reference does — this practice is closed evenings and
     weekends, and saying otherwise on a paid-traffic page would be a lie the
     visitor discovers by phoning.                                            */
  var HOURS = { open: 8, close: 17, days: [1, 2, 3, 4, 5] };

  function denverNow() {
    // Convert to America/Denver without pulling in a date library.
    var s = new Date().toLocaleString("en-US", { timeZone: "America/Denver" });
    return new Date(s);
  }

  function officeStatus() {
    var now = denverNow();
    var day = now.getDay();
    var hour = now.getHours() + now.getMinutes() / 60;
    var isOpenDay = HOURS.days.indexOf(day) !== -1;
    var open = isOpenDay && hour >= HOURS.open && hour < HOURS.close;
    var label;
    if (open) {
      label = "Open now · until 5:00pm";
    } else if (isOpenDay && hour < HOURS.open) {
      label = "Opens at 8:00am today";
    } else {
      var names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      var next = day;
      for (var i = 1; i <= 7; i++) {
        var cand = (day + i) % 7;
        if (HOURS.days.indexOf(cand) !== -1) { next = cand; break; }
      }
      var nextName = next === (day + 1) % 7 ? "tomorrow" : names[(next + 6) % 7];
      label = "Closed · opens " + nextName + " at 8:00am";
    }
    return { open: open, label: label };
  }

  function initStatus() {
    var st = officeStatus();
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.setAttribute("data-open", String(st.open));
      var txt = el.querySelector("[data-status-text]");
      if (txt) txt.textContent = st.label;
    });
    // Emergency page: swap the lead line depending on whether they can walk in now.
    document.querySelectorAll("[data-status-swap]").forEach(function (el) {
      el.textContent = st.open
        ? el.getAttribute("data-open-text") || el.textContent
        : el.getAttribute("data-closed-text") || el.textContent;
    });
  }

  /* ---------- sticky header shadow ---------- */
  function initHeader() {
    var hdr = document.querySelector(".hdr");
    if (!hdr) return;
    var onScroll = function () {
      hdr.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- scroll reveals ---------- */
  function initReveals() {
    var els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    document.querySelectorAll(".faq__q").forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      btn.setAttribute("aria-expanded", "false");
      panel.setAttribute("data-open", "false");
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        panel.setAttribute("data-open", String(!open));
      });
    });
  }

  /* ---------- sticky mobile action bar ---------- */
  function initActionBar() {
    var bar = document.querySelector(".actionbar");
    if (!bar) return;
    var trigger = document.querySelector(".hero");
    if (!trigger || !("IntersectionObserver" in window)) {
      bar.classList.add("is-on");
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        bar.classList.toggle("is-on", !entries[0].isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(trigger);
  }

  /* ---------- lead handling ----------
     OPEN QUESTION 3 in docs/project-overview.md: no GoHighLevel endpoint, form
     ID or location ID was supplied for this client, so there is nowhere real to
     post. Rather than silently dropping leads or inventing an endpoint, every
     form resolves through this one function. It logs the exact payload shape and
     shows the visitor a real confirmation with the phone number. Wiring GHL up
     is a one-function change: replace the body of submitLead().                 */
  function submitLead(payload) {
    // eslint-disable-next-line no-console
    console.info("[arvada] lead captured (no endpoint configured yet):", payload);
    window.__arvadaLeads = window.__arvadaLeads || [];
    window.__arvadaLeads.push(payload);
    return Promise.resolve({ ok: true, delivered: false });
  }
  window.submitLead = submitLead;

  function showThanks(form, msg) {
    var card = form.closest(".form-card") || form.parentElement;
    var done = document.createElement("div");
    done.className = "form-done";
    done.setAttribute("role", "status");
    done.innerHTML =
      '<div class="card__icon" style="margin-inline:auto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>' +
      '<h3 class="h3" style="text-align:center">' +
      (msg || "Thank you — we’ve got your request.") +
      "</h3>" +
      '<p style="text-align:center;color:var(--muted)">A member of the Arvada Dental Center team will call you back. Need us sooner? Call <a class="tel" href="tel:+13034217611">(303) 421-7611</a>, Monday to Friday, 8am to 5pm.</p>';
    form.replaceWith(done);
    if (card && card.scrollIntoView) card.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }

  function validate(form) {
    var ok = true;
    form.querySelectorAll("[required]").forEach(function (input) {
      var field = input.closest(".field");
      var err = field && field.querySelector(".field__err");
      var bad = !input.value.trim() || (input.type === "tel" && input.value.replace(/\D/g, "").length < 10);
      if (field) field.setAttribute("data-invalid", String(bad));
      if (err) {
        err.textContent = bad
          ? input.type === "tel"
            ? "Please enter a 10-digit phone number."
            : "This field is required."
          : "";
      }
      if (bad && ok) { input.focus(); ok = false; }
    });
    return ok;
  }

  function initForms() {
    document.querySelectorAll("form[data-lead]").forEach(function (form) {
      form.setAttribute("novalidate", "");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validate(form)) return;
        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });
        var btn = form.querySelector('[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
        submitLead({
          source: form.getAttribute("data-lead"),
          page: document.title,
          asanaTaskGid: document.documentElement.getAttribute("data-asana-gid") || null,
          submittedAt: new Date().toISOString(),
          fields: data
        }).then(function () {
          showThanks(form, form.getAttribute("data-thanks"));
        });
      });
    });
  }

  /* ---------- stepped qualifier ----------
     Matches the house reference (start.smartarchesdental.com) and the widget
     the client already runs on their own site: one question per screen. */
  function initQuiz() {
    document.querySelectorAll("[data-quiz]").forEach(function (quiz) {
      var steps = Array.prototype.slice.call(quiz.querySelectorAll(".quiz__step"));
      var done = quiz.querySelector(".quiz__done");
      var ticks = quiz.querySelector(".quiz__progress");
      var answers = {};
      var idx = 0;

      if (ticks) {
        ticks.innerHTML = "";
        steps.concat(done ? [done] : []).forEach(function () {
          var t = document.createElement("span");
          t.className = "quiz__tick";
          ticks.appendChild(t);
        });
      }

      function paint() {
        steps.forEach(function (s, i) { s.setAttribute("data-active", String(i === idx)); });
        if (done) done.setAttribute("data-active", String(idx >= steps.length));
        if (ticks) {
          Array.prototype.forEach.call(ticks.children, function (t, i) {
            t.setAttribute("data-done", String(i <= idx));
          });
        }
        var live = quiz.querySelector("[data-quiz-live]");
        if (live) {
          live.textContent =
            idx >= steps.length
              ? "All questions answered."
              : "Question " + (idx + 1) + " of " + steps.length;
        }
      }

      function advance() {
        idx++;
        paint();
        if (idx >= steps.length) {
          var hidden = quiz.querySelector("[data-quiz-answers]");
          if (hidden) hidden.value = JSON.stringify(answers);
          var focusTarget = done && done.querySelector("input, button, a");
          if (focusTarget) focusTarget.focus({ preventScroll: true });
        } else {
          var opt = steps[idx].querySelector(".quiz__opt");
          if (opt) opt.focus({ preventScroll: true });
        }
      }

      quiz.querySelectorAll(".quiz__opt").forEach(function (opt) {
        opt.addEventListener("click", function () {
          var step = opt.closest(".quiz__step");
          var name = step.getAttribute("data-name") || "q" + steps.indexOf(step);
          step.querySelectorAll(".quiz__opt").forEach(function (o) {
            o.setAttribute("aria-pressed", String(o === opt));
          });
          answers[name] = opt.getAttribute("data-value") || opt.textContent.trim();
          window.setTimeout(advance, reduced ? 0 : 220);
        });
      });

      quiz.querySelectorAll(".quiz__back").forEach(function (b) {
        b.addEventListener("click", function () {
          if (idx > 0) { idx--; paint(); }
        });
      });

      paint();
    });
  }

  /* ---------- year stamp ---------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function boot() {
    initStatus();
    initHeader();
    initReveals();
    initFaq();
    initActionBar();
    initForms();
    initQuiz();
    initYear();
    document.documentElement.setAttribute("data-js", "on");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
