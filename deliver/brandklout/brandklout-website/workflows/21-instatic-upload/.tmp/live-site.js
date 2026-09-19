// src/scripts/site.js
document.documentElement.classList.add("js");
{
  const lost = { "/authority-score": [["#q1-yes", 0, { "form": "assessment-lead-form" }], ["#q1-no", 0, { "form": "assessment-lead-form" }], ["#q2-yes", 0, { "form": "assessment-lead-form" }], ["#q2-no", 0, { "form": "assessment-lead-form" }], ["#q3-yes", 0, { "form": "assessment-lead-form" }], ["#q3-no", 0, { "form": "assessment-lead-form" }], ["#q4-yes", 0, { "form": "assessment-lead-form" }], ["#q4-no", 0, { "form": "assessment-lead-form" }], ["#q5-yes", 0, { "form": "assessment-lead-form" }], ["#q5-no", 0, { "form": "assessment-lead-form" }], ["#q6-yes", 0, { "form": "assessment-lead-form" }], ["#q6-no", 0, { "form": "assessment-lead-form" }], ["#q7-yes", 0, { "form": "assessment-lead-form" }], ["#q7-no", 0, { "form": "assessment-lead-form" }], ["#q8-yes", 0, { "form": "assessment-lead-form" }], ["#q8-no", 0, { "form": "assessment-lead-form" }], ["#q9-yes", 0, { "form": "assessment-lead-form" }], ["#q9-no", 0, { "form": "assessment-lead-form" }], ["#q10-yes", 0, { "form": "assessment-lead-form" }], ["#q10-no", 0, { "form": "assessment-lead-form" }], ["#q11-yes", 0, { "form": "assessment-lead-form" }], ["#q11-no", 0, { "form": "assessment-lead-form" }], ["#q12-yes", 0, { "form": "assessment-lead-form" }], ["#q12-no", 0, { "form": "assessment-lead-form" }], ["#q13-yes", 0, { "form": "assessment-lead-form" }], ["#q13-no", 0, { "form": "assessment-lead-form" }], ["#q14-yes", 0, { "form": "assessment-lead-form" }], ["#q14-no", 0, { "form": "assessment-lead-form" }], ["#q15-yes", 0, { "form": "assessment-lead-form" }], ["#q15-no", 0, { "form": "assessment-lead-form" }], ["#q16-yes", 0, { "form": "assessment-lead-form" }], ["#q16-no", 0, { "form": "assessment-lead-form" }], ["#q17-yes", 0, { "form": "assessment-lead-form" }], ["#q17-no", 0, { "form": "assessment-lead-form" }], ["#q18-yes", 0, { "form": "assessment-lead-form" }], ["#q18-no", 0, { "form": "assessment-lead-form" }], ["#q19-yes", 0, { "form": "assessment-lead-form" }], ["#q19-no", 0, { "form": "assessment-lead-form" }], ["#q20-yes", 0, { "form": "assessment-lead-form" }], ["#q20-no", 0, { "form": "assessment-lead-form" }], ["#q21-yes", 0, { "form": "assessment-lead-form" }], ["#q21-no", 0, { "form": "assessment-lead-form" }]] };
  const here = location.pathname.replace(/\.html$/, "").replace(/\/index$/, "/") || "/";
  for (const [sel, nth, attrs] of lost[here] ?? []) {
    const el = document.querySelectorAll(sel)[nth];
    if (!el) {
      console.warn("import repair: nothing matches", sel, nth);
      continue;
    }
    for (const [k, v] of Object.entries(attrs)) if (el.getAttribute(k) !== v) el.setAttribute(k, v);
  }
}
window.BK_CONFIG = Object.assign({
  formEndpoint: "https://formsubmit.co/ajax/sales@brandklout.com",
  calendly: "https://calendly.com/mrhuynher/30min"
}, window.BK_CONFIG || {});
(function() {
  "use strict";
  const reduceMotion = () => document.documentElement.classList.contains("reduce-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function init() {
    document.querySelectorAll("[data-menu]:not([data-bk-bound])").forEach((button) => {
      button.dataset.bkBound = "true";
      button.addEventListener("click", () => {
        const links = document.getElementById(button.getAttribute("aria-controls"));
        if (!links) return;
        const open = links.classList.toggle("open");
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
    });
    document.querySelectorAll(".nav-links a:not([data-bk-bound])").forEach((link) => {
      link.dataset.bkBound = "true";
      link.addEventListener("click", () => {
        document.querySelector(".nav-links")?.classList.remove("open");
        document.querySelector("[data-menu]")?.setAttribute("aria-expanded", "false");
      });
    });
    document.querySelectorAll(".faq-btn:not([data-bk-bound])").forEach((button) => {
      button.dataset.bkBound = "true";
      button.addEventListener("click", () => {
        const item = button.closest(".faq-item");
        const open = item.classList.toggle("open");
        button.setAttribute("aria-expanded", String(open));
        const answer = item.querySelector(".faq-answer");
        if (answer) answer.style.maxHeight = open ? answer.scrollHeight + "px" : "0px";
      });
    });
    document.querySelectorAll("form[data-lead-form]:not([data-bk-bound])").forEach((form) => {
      form.dataset.bkBound = "true";
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.reportValidity() || form.dataset.submitting === "true") return;
        const status = form.querySelector("[data-form-status]");
        const submit = form.querySelector('button[type="submit"]');
        const success = form.querySelector(".success");
        const endpoint = window.BK_CONFIG.formEndpoint;
        if (!endpoint) {
          if (status) {
            status.classList.remove("error");
            status.replaceChildren(document.createTextNode("Preview mode: your information has not been sent. The CRM connection is not configured yet. "));
            const link = document.createElement("a");
            link.href = window.BK_CONFIG.calendly;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = "Book directly using the calendar.";
            status.append(link);
          }
          return;
        }
        form.dataset.submitting = "true";
        const originalText = submit?.textContent;
        if (submit) {
          submit.disabled = true;
          submit.textContent = "Sending your request...";
        }
        if (status) {
          status.textContent = "";
          status.classList.remove("error");
        }
        try {
          const data = Object.fromEntries(new FormData(form).entries());
          data.page = location.pathname + location.hash;
          data.submitted_at = (/* @__PURE__ */ new Date()).toISOString();
          data._subject = "New website lead: " + document.title;
          data._template = "table";
          try {
            JSON.parse(data.assessment_answers || "[]").forEach((a, i) => {
              data["Q" + String(i + 1).padStart(2, "0")] = a.question + " \u2014 " + (a.answer ? a.answer.toUpperCase() : "not answered");
            });
            if (data.assessment_answers) delete data.assessment_answers;
          } catch (_) {
          }
          try {
            if (data.category_scores) data.category_scores = Object.values(JSON.parse(data.category_scores)).map((c) => c.name + ": " + c.yes + "/" + c.total + " Yes").join("; ");
          } catch (_) {
          }
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15e3);
          let response;
          try {
            response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify(data),
              mode: "cors",
              signal: controller.signal
            });
          } finally {
            clearTimeout(timeout);
          }
          if (!response.ok) throw new Error("Request not accepted (" + response.status + ").");
          const reply = await response.json().catch(() => ({}));
          if (String(reply.success) !== "true") throw new Error(reply.message || "Request not accepted.");
          if (success) {
            success.classList.add("show");
            success.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "nearest" });
          }
          if (submit) submit.textContent = "Request sent";
          form.dataset.submitted = "true";
          document.dispatchEvent(new CustomEvent("bk:lead-sent", { detail: { page: location.pathname } }));
        } catch (error) {
          if (status) {
            status.classList.add("error");
            status.textContent = "Your request could not be confirmed. Please try again or use the booking link. Your entries have been kept.";
          }
          if (submit) {
            submit.disabled = false;
            submit.textContent = originalText;
          }
        } finally {
          form.dataset.submitting = "false";
        }
      });
    });
    const quiz = document.querySelector("[data-authority-quiz]");
    if (quiz && !quiz.dataset.bkBound) {
      let setHidden = function(name, value) {
        const field = form?.querySelector('[name="' + name + '"]');
        if (field) field.value = String(value);
      }, clearSubmissionState = function() {
        if (!form || form.dataset.submitting === "true") return;
        form.querySelector(".success")?.classList.remove("show");
        const status = form.querySelector("[data-form-status]");
        if (status) status.textContent = "";
        if (form.dataset.submitted === "true") {
          const button = form.querySelector('button[type="submit"]');
          if (button) {
            button.disabled = false;
            button.textContent = "Send My Assessment + Check My Market \u2197";
          }
          delete form.dataset.submitted;
        }
      };
      quiz.dataset.bkBound = "true";
      const questions = [...quiz.querySelectorAll(".question[data-category]")];
      const groups = [...quiz.querySelectorAll("[data-assessment-category]")];
      const form = quiz.querySelector("form[data-lead-form]");
      let frame;
      let previous = 0;
      const calculate = () => {
        const categories = {};
        groups.forEach((group) => {
          categories[group.dataset.assessmentCategory] = {
            name: group.dataset.categoryName,
            total: 0,
            answered: 0,
            yes: 0,
            no: 0,
            percentage: 0
          };
        });
        let answered = 0, yes = 0, no = 0;
        const answers = questions.map((question) => {
          const checked = question.querySelector('input[type="radio"]:checked');
          const category = categories[question.dataset.category];
          category.total++;
          if (checked) {
            answered++;
            category.answered++;
            if (checked.value === "1") {
              yes++;
              category.yes++;
            } else {
              no++;
              category.no++;
            }
          }
          return {
            id: question.dataset.questionId,
            category: question.dataset.category,
            question: question.querySelector("h3").textContent.trim(),
            answer: checked ? checked.value === "1" ? "yes" : "no" : null
          };
        });
        const count = questions.length;
        const total = Math.round(yes / count * 100);
        const complete = answered === count;
        quiz.querySelector("[data-score]").textContent = total;
        quiz.querySelector("[data-yes-count]").textContent = yes;
        quiz.querySelector("[data-no-count]").textContent = no;
        quiz.querySelector("[data-score-state]").textContent = complete ? "Assessment complete" : answered ? "In progress" : "Not started";
        cancelAnimationFrame(frame);
        if (reduceMotion()) document.documentElement.style.setProperty("--score", total + "%");
        else {
          const start = performance.now(), from = previous;
          const update = (now) => {
            const progress = Math.min((now - start) / 450, 1);
            document.documentElement.style.setProperty("--score", from + (total - from) * (1 - Math.pow(1 - progress, 3)) + "%");
            if (progress < 1 && quiz.isConnected) frame = requestAnimationFrame(update);
          };
          frame = requestAnimationFrame(update);
        }
        previous = total;
        Object.entries(categories).forEach(([key, category]) => {
          category.percentage = Math.round(category.yes / category.total * 100);
          const label = quiz.querySelector('[data-cat-score="' + key + '"]');
          const bar = quiz.querySelector('[data-category-bar="' + key + '"]');
          const progress = quiz.querySelector('[data-category-progress="' + key + '"]');
          if (label) label.textContent = category.yes + "/" + category.total + " Yes";
          if (bar) bar.style.width = category.percentage + "%";
          if (progress) progress.textContent = category.answered + "/" + category.total;
        });
        quiz.querySelector("[data-quiz-progress]").textContent = answered + " of " + count;
        quiz.querySelector("[data-quiz-progress-bar]").style.width = answered / count * 100 + "%";
        quiz.querySelector("[data-progress-track]").setAttribute("aria-valuenow", answered);
        const minimum = Math.min(...Object.values(categories).map((category) => category.yes));
        const weakestNames = Object.values(categories).filter((category) => category.yes === minimum).map((category) => category.name);
        let gap = "Complete all " + count + " questions";
        if (complete) gap = yes === count ? "No gaps self-reported" : weakestNames.join(" / ");
        quiz.querySelector("[data-weakest]").textContent = gap;
        const resultNote = quiz.querySelector("[data-result-note]");
        resultNote.classList.toggle("is-complete", complete);
        if (complete) {
          resultNote.textContent = "Assessment complete. You answered Yes to " + yes + " of " + count + " questions. Your self-reported score is " + total + "/100. " + (yes === count ? "Use your market conversation to validate your answers against actual performance." : "Area" + (weakestNames.length > 1 ? "s" : "") + " with the most No answers: " + weakestNames.join(", ") + ".");
        } else {
          resultNote.textContent = answered ? count - answered + " questions remaining. Your score is provisional until all questions are answered." : "Answer all " + count + " questions to complete your assessment. Your score updates as you go.";
        }
        const result = {
          assessment_version: quiz.dataset.assessmentVersion,
          assessment_completed: complete,
          assessment_answered: answered,
          assessment_total: count,
          yes_answers: yes,
          no_answers: no,
          authority_score: total,
          biggest_gap: complete ? gap : "Assessment incomplete",
          category_scores: categories,
          assessment_answers: answers
        };
        Object.entries(result).forEach(([key, value]) => setHidden(key, typeof value === "object" ? JSON.stringify(value) : value));
        window.BKAssessment = { getResult: () => JSON.parse(JSON.stringify(result)) };
      };
      quiz.addEventListener("change", () => {
        clearSubmissionState();
        calculate();
      });
      quiz.querySelector("[data-reset-assessment]")?.addEventListener("click", () => {
        if (form?.dataset.submitting === "true") return;
        clearSubmissionState();
        questions.forEach((question) => question.querySelectorAll('input[type="radio"]').forEach((input) => {
          input.checked = false;
        }));
        calculate();
      });
      calculate();
    }
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelector(".nav-links")?.classList.remove("open");
      document.querySelector("[data-menu]")?.setAttribute("aria-expanded", "false");
    }
  });
  window.BKSite = { init };
  init();
})();
(function() {
  "use strict";
  let observer;
  let modal;
  let lastFocus;
  const frames = /* @__PURE__ */ new Map();
  const root = document.documentElement;
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let preference = false;
  try {
    preference = localStorage.getItem("bk-reduce-motion") === "true";
  } catch (_) {
  }
  const reduced = () => preference || mediaQuery.matches;
  function setMotion() {
    root.classList.toggle("reduce-motion", reduced());
    root.classList.toggle("motion-ready", !reduced());
    document.querySelectorAll("[data-motion-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(reduced()));
      button.textContent = reduced() ? "Reduced motion on" : "Reduce motion";
    });
    if (reduced()) {
      frames.forEach((id) => cancelAnimationFrame(id));
      frames.clear();
      document.querySelectorAll("[data-reveal],[data-animate]").forEach((el) => el.classList.add("is-visible"));
      document.querySelectorAll("[data-count]").forEach((el) => {
        finishCount(el);
      });
    }
  }
  function countText(el, n) {
    return (el.dataset.prefix || "") + Math.round(n).toLocaleString("en-US") + (el.dataset.suffix || "");
  }
  function finishCount(el) {
    el.textContent = countText(el, Number(el.dataset.count));
    el.dataset.counted = "true";
  }
  function animateCount(el, force = false) {
    if (el.dataset.counted && !force) return;
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (frames.has(el)) cancelAnimationFrame(frames.get(el));
    if (reduced()) {
      finishCount(el);
      return;
    }
    el.dataset.counted = "true";
    const start = performance.now();
    const update = (now) => {
      if (!el.isConnected) {
        frames.delete(el);
        return;
      }
      const p = Math.min((now - start) / 1050, 1);
      el.textContent = countText(el, target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frames.set(el, requestAnimationFrame(update));
      else frames.delete(el);
    };
    frames.set(el, requestAnimationFrame(update));
  }
  function observe(scope = document) {
    const nodes = scope.querySelectorAll("[data-reveal],[data-animate],[data-count]");
    nodes.forEach((el) => {
      if (reduced() || !observer) {
        el.classList.add("is-visible");
        if (el.hasAttribute("data-count")) finishCount(el);
      } else observer.observe(el);
    });
  }
  function replay(el) {
    if (!el) return;
    if (reduced()) {
      el.classList.add("is-visible");
      el.querySelectorAll("[data-count]").forEach(finishCount);
      return;
    }
    el.classList.remove("is-visible");
    void el.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.add("is-visible");
      el.querySelectorAll("[data-count]").forEach((counter) => animateCount(counter, true));
    }));
  }
  function closeVideo() {
    if (!modal) return;
    modal.querySelector("iframe")?.setAttribute("src", "about:blank");
    modal.remove();
    modal = null;
    document.body.style.overflow = "";
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }
  function openVideo(link) {
    closeVideo();
    lastFocus = link;
    const id = link.dataset.video;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
      window.open(link.href, "_blank", "noopener");
      return;
    }
    modal = document.createElement("div");
    modal.className = "bk-video-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "bk-video-heading");
    modal.innerHTML = '<div class="bk-modal-dialog"><h2 class="bk-modal-title" id="bk-video-heading"></h2><button type="button" class="bk-modal-close" aria-label="Close video">&times;</button><iframe class="bk-modal-video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="bk-modal-footer"><span>YouTube loads only after you choose to play.</span><a target="_blank" rel="noopener">Watch on YouTube</a></div></div>';
    modal.querySelector("h2").textContent = link.dataset.videoTitle || "BrandKlout customer story";
    const iframe = modal.querySelector("iframe");
    iframe.title = link.dataset.videoTitle || "BrandKlout video";
    iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    modal.querySelector("a").href = "https://www.youtube.com/watch?v=" + id;
    modal.querySelector("button").addEventListener("click", closeVideo);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeVideo();
    });
    document.body.append(modal);
    document.body.style.overflow = "hidden";
    modal.querySelector("button").focus();
  }
  document.addEventListener("keydown", (event) => {
    if (!modal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeVideo();
    }
    if (event.key === "Tab") {
      const elements = [...modal.querySelectorAll("button,iframe,a[href]")];
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  function init() {
    if (observer) observer.disconnect();
    frames.forEach((id) => cancelAnimationFrame(id));
    frames.clear();
    setMotion();
    document.querySelectorAll("img[data-online-src]:not([data-online-attempted])").forEach((img) => {
      img.dataset.onlineAttempted = "true";
      if (navigator.onLine === false) return;
      const fullPhoto = new Image();
      fullPhoto.onload = () => {
        img.src = fullPhoto.src;
        img.alt = img.dataset.onlineAlt || "";
      };
      fullPhoto.onerror = () => {
      };
      fullPhoto.src = img.dataset.onlineSrc;
    });
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add("is-visible");
          if (el.hasAttribute("data-count")) animateCount(el);
          observer.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -20px 0px" });
    }
    observe();
    document.querySelectorAll("[data-motion-toggle]:not([data-visual-bound])").forEach((button) => {
      button.dataset.visualBound = "true";
      button.addEventListener("click", () => {
        preference = !preference;
        try {
          localStorage.setItem("bk-reduce-motion", String(preference));
        } catch (_) {
        }
        setMotion();
      });
    });
    document.querySelectorAll("img:not([data-visual-bound])").forEach((img) => {
      img.dataset.visualBound = "true";
      const error = () => {
        const frame = img.closest(".photo-frame");
        if (frame) {
          frame.classList.add("media-unavailable");
          frame.setAttribute("aria-label", img.alt + " (online image unavailable)");
        } else {
          img.style.visibility = "hidden";
        }
      };
      img.addEventListener("error", error);
      img.addEventListener("load", () => {
        img.closest(".photo-frame")?.classList.remove("media-unavailable");
        img.style.visibility = "";
      });
      if (img.complete && !img.naturalWidth) error();
    });
    document.querySelectorAll("[data-video]:not([data-visual-bound])").forEach((link) => {
      link.dataset.visualBound = "true";
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        openVideo(link);
      });
    });
    const metrics = {
      collections: { label: "Collections", value: 160 },
      patients: { label: "New patients", value: 300 },
      traffic: { label: "Yelp organic traffic", value: 350 }
    };
    document.querySelectorAll("[data-compare]:not([data-visual-bound])").forEach((button) => {
      button.dataset.visualBound = "true";
      button.addEventListener("click", () => {
        const lab = button.closest(".result-lab");
        const chart = lab?.querySelector(".paired-chart");
        const item = metrics[button.dataset.compare];
        if (!chart || !item) return;
        lab.querySelectorAll("[data-compare]").forEach((b) => {
          const active = b === button;
          b.classList.toggle("active", active);
          b.setAttribute("aria-pressed", String(active));
        });
        chart.querySelector(".small-label").textContent = item.label;
        const gain = chart.querySelector("[data-count]");
        gain.dataset.count = item.value - 100;
        const bar = chart.querySelector(".grow-bar.result");
        bar.style.setProperty("--bar-width", item.value / 4 + "%");
        bar.querySelector("b").textContent = item.value;
        chart.querySelector(".sr-only").textContent = item.label + ": baseline index 100, reported-period index " + item.value + ". Source: supplied Legacy Dental customer story.";
        replay(chart);
      });
    });
    document.querySelectorAll("[data-report-tab]:not([data-visual-bound])").forEach((button) => {
      button.dataset.visualBound = "true";
      button.addEventListener("click", () => {
        const app = button.closest(".report-app");
        app.querySelectorAll("[data-report-tab]").forEach((b) => {
          b.classList.toggle("active", b === button);
          b.setAttribute("aria-pressed", String(b === button));
        });
        app.querySelectorAll("[data-report-panel]").forEach((panel) => {
          panel.hidden = panel.dataset.reportPanel !== button.dataset.reportTab;
          if (!panel.hidden) {
            panel.querySelectorAll("[data-animate]").forEach(replay);
            observe(panel);
          }
        });
      });
    });
    const months = ["January", "February", "March", "April", "May", "June"];
    const values = [18, 23, 27, 25, 34, 42];
    function selectPoint(chart, index) {
      const tooltip = chart.querySelector(".trend-tooltip");
      tooltip.replaceChildren(document.createTextNode(months[index] + " "));
      const b = document.createElement("strong");
      b.textContent = values[index] + " qualified consults";
      tooltip.append(b);
      chart.querySelectorAll(".point-control").forEach((button, i) => button.classList.toggle("active", index === i));
      chart.querySelectorAll(".chart-points circle").forEach((point, i) => point.classList.toggle("highlight", index === i));
    }
    document.querySelectorAll(".point-control:not([data-visual-bound])").forEach((button) => {
      button.dataset.visualBound = "true";
      const update = () => selectPoint(button.closest(".demo-line-chart"), Number(button.dataset.month));
      button.addEventListener("click", update);
      button.addEventListener("focus", update);
      button.addEventListener("pointerenter", update);
    });
    document.querySelectorAll(".trend-svg:not([data-visual-bound])").forEach((svg) => {
      svg.dataset.visualBound = "true";
      svg.addEventListener("pointermove", (event) => {
        const rect = svg.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 660;
        const index = Math.max(0, Math.min(5, Math.round((x - 45) / 115)));
        selectPoint(svg.closest(".demo-line-chart"), index);
      });
    });
    document.querySelectorAll(".chart-tabs,.point-buttons,.report-side").forEach((group) => {
      if (group.dataset.keyBound) return;
      group.dataset.keyBound = "true";
      group.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        const buttons = [...group.querySelectorAll("button")];
        const index = buttons.indexOf(document.activeElement);
        if (index < 0) return;
        event.preventDefault();
        const next = buttons[(index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length];
        next.focus();
        next.click();
      });
    });
  }
  mediaQuery.addEventListener?.("change", setMotion);
  window.BKVisual = { init, closeVideo, reduced, observe };
  init();
})();
(function() {
  "use strict";
  if (window.BKStories) return;
  function stop(player) {
    player.querySelector("iframe")?.remove();
    player.querySelector("[data-story-stop]")?.remove();
    const play = player.querySelector("[data-story-play]");
    if (play) play.hidden = false;
    delete player.dataset.playing;
  }
  function playVideo(player) {
    const id = player.dataset.storyPlayer;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    const notice = player.querySelector(".cs-player-notice");
    if (navigator.onLine === false) {
      notice.textContent = "Connect to the internet to watch, or use the YouTube link below.";
      notice.hidden = false;
      return;
    }
    document.querySelectorAll("[data-story-player][data-playing]").forEach(stop);
    if (notice) notice.hidden = true;
    const iframe = document.createElement("iframe");
    const src = new URL("https://www.youtube-nocookie.com/embed/" + id);
    src.searchParams.set("autoplay", "1");
    src.searchParams.set("rel", "0");
    src.searchParams.set("playsinline", "1");
    if (/^https?:$/.test(location.protocol)) src.searchParams.set("origin", location.origin);
    iframe.src = src.toString();
    iframe.title = player.dataset.storyVideoTitle || "BrandKlout customer story";
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    iframe.setAttribute("allowfullscreen", "");
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    const stopButton = document.createElement("button");
    stopButton.type = "button";
    stopButton.className = "cs-stop-video";
    stopButton.dataset.storyStop = "";
    stopButton.textContent = "Close video";
    stopButton.setAttribute("aria-label", "Close " + iframe.title);
    player.querySelector("[data-story-play]").hidden = true;
    player.dataset.playing = "true";
    player.append(iframe, stopButton);
    iframe.focus({ preventScroll: true });
  }
  document.addEventListener("click", function(e) {
    const play = e.target.closest("[data-story-play]");
    if (play) {
      e.preventDefault();
      playVideo(play.closest("[data-story-player]"));
      return;
    }
    const close = e.target.closest("[data-story-stop]");
    if (close) {
      const player = close.closest("[data-story-player]");
      stop(player);
      player.querySelector("[data-story-play]")?.focus({ preventScroll: true });
    }
  });
  document.addEventListener("keydown", function(e) {
    if (e.key !== "Escape") return;
    const playing = document.querySelector("[data-story-player][data-playing]");
    if (playing) {
      stop(playing);
      playing.querySelector("[data-story-play]")?.focus({ preventScroll: true });
    }
  });
  window.BKStories = { stopAll: function() {
    document.querySelectorAll("[data-story-player][data-playing]").forEach(stop);
  } };
})();
(function() {
  "use strict";
  const DELAY = 6500;
  const reduced = () => document.documentElement.classList.contains("reduce-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-slider]").forEach((slider) => {
    if (slider.dataset.sliderBound) return;
    slider.dataset.sliderBound = "true";
    const track = slider.querySelector("[data-slider-track]");
    if (!track) return;
    const slides = [...track.children];
    const controls = slider.querySelector("[data-slider-controls]");
    if (slides.length < 2) {
      if (controls) controls.hidden = true;
      return;
    }
    const dotsBox = slider.querySelector("[data-slider-dots]");
    let index = 0;
    let timer = 0;
    let settle = 0;
    let manual = false;
    let paused = false;
    let onScreen = true;
    let programmatic = false;
    const mark = (i) => {
      index = i;
      slides.forEach((slide, n) => {
        slide.inert = n !== i;
        slide.classList.toggle("is-active", n === i);
      });
      dots.forEach((dot, n) => {
        dot.classList.toggle("is-active", n === i);
        dot.setAttribute("aria-current", n === i ? "true" : "false");
      });
    };
    const schedule = () => {
      clearTimeout(timer);
      if (manual || paused || !onScreen || document.hidden || reduced()) return;
      timer = setTimeout(() => go(index + 1), DELAY);
    };
    const go = (i) => {
      const n = (i + slides.length) % slides.length;
      programmatic = true;
      track.scrollTo({ left: slides[n].offsetLeft - slides[0].offsetLeft, behavior: reduced() ? "auto" : "smooth" });
      mark(n);
      schedule();
    };
    const move = (i) => {
      manual = true;
      go(i);
    };
    const dots = slides.map((slide, i) => {
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "bk-slider-dot";
      dot.setAttribute("aria-label", `Show result ${i + 1} of ${slides.length}`);
      dot.addEventListener("click", () => move(i));
      dotsBox?.append(dot);
      return dot;
    });
    slider.querySelector("[data-slider-prev]")?.addEventListener("click", () => move(index - 1));
    slider.querySelector("[data-slider-next]")?.addEventListener("click", () => move(index + 1));
    track.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      move(index + (event.key === "ArrowRight" ? 1 : -1));
    });
    track.addEventListener(
      "scroll",
      () => {
        clearTimeout(settle);
        settle = setTimeout(() => {
          if (programmatic) {
            programmatic = false;
            return;
          }
          const n = Math.min(Math.max(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)), 0), slides.length - 1);
          if (n !== index) {
            manual = true;
            mark(n);
            schedule();
          }
        }, 120);
      },
      { passive: true }
    );
    slider.addEventListener("pointerenter", () => {
      paused = true;
      schedule();
    });
    slider.addEventListener("pointerleave", () => {
      paused = false;
      schedule();
    });
    slider.addEventListener("focusin", () => {
      paused = true;
      schedule();
    });
    slider.addEventListener("focusout", () => {
      paused = false;
      schedule();
    });
    document.addEventListener("visibilitychange", schedule);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        schedule();
      }).observe(slider);
    }
    mark(0);
    schedule();
  });
})();
(() => {
  const KEY = "asw-user-settings";
  const scale = () => {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
    }
    if (raw == null) raw = decodeURIComponent((document.cookie.match(new RegExp("(?:^|; )" + KEY + "=([^;]*)")) || [])[1] || "");
    try {
      return Number(JSON.parse(raw || "{}")?.states?.fontSize) || 1;
    } catch {
      return 1;
    }
  };
  const fix = (els) => {
    const list = [...els];
    const s = scale();
    for (const el of list) el.style.removeProperty("font-size");
    if (s === 1) {
      for (const el of list) delete el.dataset.aswOrgFontSize;
      return;
    }
    const sizes = list.map((el) => parseFloat(getComputedStyle(el).fontSize));
    list.forEach((el, i) => {
      el.dataset.aswOrgFontSize = String(sizes[i]);
      el.style.fontSize = `${sizes[i] * s}px`;
    });
  };
  const observer = new MutationObserver((records) => {
    const els = /* @__PURE__ */ new Set();
    for (const r of records) if (r.target.dataset && r.target.dataset.aswOrgFontSize !== void 0 && r.target.style.fontSize) els.add(r.target);
    if (!els.size) return;
    fix(els);
    observer.takeRecords();
  });
  observer.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["style"] });
  let timer;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fix(document.querySelectorAll("[data-asw-org-font-size]"));
      observer.takeRecords();
    }, 150);
  });
})();
