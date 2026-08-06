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

  /* =======================================================================
     MOTION ENGINE
     -----------------------------------------------------------------------
     Progressive enhancement only: it reads the DOM that is already there and
     choreographs it. No page's content or section order is touched by any of
     this, and if it throws, the CSS guard (html[data-motion="on"]) means the
     page stays fully visible rather than stuck at opacity 0.
     ======================================================================= */

  /* Split a heading into line groups so it can resolve line by line behind a
     mask. Only safe when the heading is text and <br> — anything with inline
     elements (a link, a coloured span) falls back to a word stagger, because
     regrouping across element boundaries would break the markup. */
  function splitLines(el) {
    var simple = Array.prototype.every.call(el.childNodes, function (n) {
      return n.nodeType === 3 || (n.nodeType === 1 && n.tagName === "BR");
    });

    // Wrap every word, preserving element structure.
    var words = [];
    function wrapText(node) {
      var parts = node.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        var s = document.createElement("span");
        s.className = "wd";
        s.textContent = p;
        frag.appendChild(s);
        words.push(s);
      });
      node.parentNode.replaceChild(frag, node);
    }
    (function walk(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.textContent.trim()) wrapText(n);
        else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    })(el);
    if (!words.length) return;

    // Group by vertical position — that is what a "line" actually is.
    var lines = [];
    var lastTop = null;
    words.forEach(function (w) {
      var top = Math.round(w.offsetTop);
      if (lastTop === null || Math.abs(top - lastTop) > 4) { lines.push([]); lastTop = top; }
      lines[lines.length - 1].push(w);
    });

    if (!simple) {
      // Word stagger, indexed by line so a line still moves together.
      lines.forEach(function (line, li) {
        line.forEach(function (w) { w.style.setProperty("--i", li); });
      });
      return;
    }

    // True line masks: rebuild the heading as .ln > .ln__i per line.
    var frag = document.createDocumentFragment();
    lines.forEach(function (line, li) {
      var outer = document.createElement("span");
      outer.className = "ln";
      var inner = document.createElement("span");
      inner.className = "ln__i";
      inner.style.setProperty("--i", li);
      line.forEach(function (w, wi) {
        if (wi) inner.appendChild(document.createTextNode(" "));
        inner.appendChild(document.createTextNode(w.textContent));
      });
      outer.appendChild(inner);
      frag.appendChild(outer);
    });
    el.textContent = "";
    el.appendChild(frag);
  }

  function initHeadings() {
    // Only display headings — body copy splitting reads as gimmick, and it
    // would also break text selection for no benefit.
    document.querySelectorAll("h1.display, h2.display").forEach(function (h) {
      try { splitLines(h); } catch (e) { /* leave the heading exactly as authored */ }
    });
  }

  /* Assign a stagger index to the children of any group, so cards, symptoms,
     checklist items and table rows cascade instead of arriving as a slab. */
  function initStagger() {
    var GROUPS = ".grid, .symptoms, .checks, .steps, .offer__includes, .stat-row, .trust";
    document.querySelectorAll(GROUPS).forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty("--i", i);
        // Authored data-delay would fight the computed cascade.
        child.removeAttribute("data-delay");
      });
    });
    document.querySelectorAll(".compare tbody tr").forEach(function (row, i) {
      row.style.setProperty("--i", i);
    });
  }

  /* ---------- scroll reveals ---------- */
  function initReveals() {
    var els = document.querySelectorAll("[data-reveal], .media-frame, .doctor__photo");
    if (!els.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      },
      // Generous margin: content resolves as it enters, never after the reader
      // has already arrived and is looking at nothing.
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero: light it as soon as it is on screen ---------- */
  function initHero() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add("is-lit"); });
    });
  }

  /* ---------- scroll-linked layer: parallax, progress ----------
     One rAF loop, one read, batched writes. Parked whenever the tab is hidden,
     because a background tab throttles rAF to a crawl and the transforms would
     land in visible jumps when the reader comes back. */
  function initScrollLayer() {
    if (reduced) return;
    var progress = document.createElement("div");
    progress.className = "progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);

    var heroMedia = document.querySelector(".hero__media img");
    var hero = document.querySelector(".hero");
    var ridges = [].slice.call(document.querySelectorAll(".ridge-mark, .hero__ridge svg"));
    var ticking = false;

    function frame() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--p", max > 0 ? Math.min(1, y / max) : 0);

      if (heroMedia && hero) {
        var h = hero.offsetHeight || 1;
        var t = Math.max(0, Math.min(1, y / h));
        // Media drifts slower than the page and eases its zoom out; the copy
        // above it stays put, so the promise never moves away from the reader.
        heroMedia.style.setProperty("--hero-shift", (t * 72).toFixed(1) + "px");
        heroMedia.style.setProperty("--hero-zoom", (1.12 - t * 0.07).toFixed(4));
      }

      ridges.forEach(function (r) {
        var rect = r.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        var p = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        r.style.setProperty("--ridge-shift", ((p - 0.5) * -46).toFixed(1) + "px");
      });
    }

    function onScroll() {
      if (ticking || document.hidden) return;
      ticking = true;
      requestAnimationFrame(frame);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) onScroll();
    });
    frame();
  }

  /* ---------- the offer's number counts when it lands ---------- */
  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    els.forEach(function (el) {
      var target = el.textContent.trim();
      var digits = target.replace(/[^\d]/g, "");
      if (!digits) return;
      var end = parseInt(digits, 10);
      var prefix = target.slice(0, target.indexOf(digits[0]));
      var suffix = target.slice(target.lastIndexOf(digits[digits.length - 1]) + 1);
      var grouped = /,/.test(target);
      el.classList.add("count");

      if (reduced || !("IntersectionObserver" in window)) return; // leave the real number

      var run = function () {
        var dur = 1100;
        var t0 = null;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          // ease-out-expo: fast to near-final, then settles — reads as precise
          var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          var v = Math.round(end * e);
          el.textContent = prefix + (grouped ? v.toLocaleString("en-US") : String(v)) + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target; // always lands on the real figure, exactly
        }
        requestAnimationFrame(step);
      };

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          el.textContent = prefix + "0" + suffix;
          run();
        });
      }, { threshold: 0.6 });
      io.observe(el);
    });
  }

  /* ---------- offer chip: docks into the header once the offer scrolls past ----
     This is the "motion serves the offer" rule made literal. Below the offer
     section the number would otherwise be gone from the screen entirely; the
     chip keeps it, and a route back to the form, one glance away at any depth. */
  function initOfferChip() {
    var hdr = document.querySelector(".hdr__bar");
    if (!hdr) return;
    var source = document.querySelector("[data-offer], [data-price]");
    var cta = document.querySelector(".hdr__cta-sm");
    if (!source || !cta) return;

    var label = "";
    var priceEl = source.querySelector(".offer__price") || source.querySelector("span");
    if (priceEl) label = priceEl.textContent.replace(/\s+/g, " ").trim();
    if (!label) return;
    var isFree = /free/i.test(label);
    var text = isFree ? "Free consultation" : label + " offer";

    var chip = document.createElement("a");
    chip.className = "offer-chip";
    chip.href = cta.getAttribute("href") || "#";
    chip.innerHTML =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span></span>';
    chip.querySelector("span").textContent = text;
    chip.setAttribute("aria-label", text + " — jump to the form");
    hdr.insertBefore(chip, cta);

    if (!("IntersectionObserver" in window)) { chip.classList.add("is-on"); return; }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          // Show it once the offer has left upward, hide it while the offer is
          // on screen — two copies of the same number is noise, not emphasis.
          var gone = !e.isIntersecting && e.boundingClientRect.top < 0;
          chip.classList.toggle("is-on", gone);
        });
      },
      { threshold: 0 }
    );
    io.observe(source);
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

  /* ---------- sticky mobile action bar ----------
     Threshold on scroll depth, not on the hero leaving the viewport. Tying it to
     the hero left a dead zone on pages with a tall mobile hero: the hero's own
     phone link had scrolled away while the hero was still technically on screen,
     so for several hundred pixels there was no way to call or reach the form.
     Two thirds of a viewport is past the fold on every page in the set. */
  function initActionBar() {
    var bar = document.querySelector(".actionbar");
    if (!bar) return;
    var onScroll = function () {
      bar.classList.toggle("is-on", (window.scrollY || window.pageYOffset) > window.innerHeight * 0.66);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
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
    // Arm the reveal styles only now, when we know we are here to disarm them.
    // Setting this before the DOM prep below would flash the page empty.
    document.documentElement.setAttribute("data-motion", reduced ? "reduced" : "on");

    // Order matters: split and index the DOM before anything observes it,
    // otherwise the first elements resolve without their choreography.
    initHeadings();
    initStagger();

    initStatus();
    initHeader();
    initHero();
    initReveals();
    initScrollLayer();
    initCounters();
    initOfferChip();
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
