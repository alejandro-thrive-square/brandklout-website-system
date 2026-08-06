/* ==========================================================================
   Grand Mission Dentistry — Implant Landing Page
   Asana task 1217133289235653 (parent 1217040406855578)

   SINGLE SOURCE OF TRUTH for every price and phone number on the page.
   Change a value here and it updates everywhere it appears — hero, financing
   section, FAQ, final CTA, header, footer, sticky mobile bar.
   ========================================================================== */

const OFFER = {
  /* Single-tooth implant starting price. Currently the figure published on
     grandmissiondentistry.com ("starts at $2,999"). The previous ad company's
     landing page ran "$3,499 with an extra $500 off when paid in full" — if
     Brandklout confirms that offer is still live, change this one value. */
  implantPrice: "2,999",

  /* The practice's main line. The previous implant campaign used the tracking
     number (281) 747-5929; swap it in here once Brandklout confirms who owns
     that number and that it will stay connected after the agency handover. */
  phoneDisplay: "(281) 789-8836",
  phoneDial: "+12817898836",
};

/* GHL lead destination. Asana tasks 1217133289235653 and 1217072657902270 both
   require the lead form to live in GoHighLevel. Until we have the endpoint (or
   an embed snippet) this posts nowhere and just shows the success state, which
   is what lets the page be reviewed end-to-end before GHL exists. */
const LEAD_ENDPOINT = null; // e.g. "https://services.leadconnectorhq.com/hooks/..."
const THANK_YOU_URL = null; // e.g. "/thank-you" — the thank-you page in this build

document.addEventListener("DOMContentLoaded", () => {
  applyTokens();
  initHeader();
  initReveal();
  initCounters();
  initQuiz();
  initFaq();
  initLightbox();
  initMobileBar();
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

/* ---------- tokens ------------------------------------------------------ */
function applyTokens() {
  document.querySelectorAll('[data-offer="implant-price-value"]').forEach((el) => {
    el.textContent = OFFER.implantPrice;
  });
  document.querySelectorAll("[data-tel]").forEach((el) => {
    el.textContent = OFFER.phoneDisplay;
  });
  document.querySelectorAll("[data-tel-link]").forEach((el) => {
    el.setAttribute("href", `tel:${OFFER.phoneDial}`);
  });
}

/* ---------- sticky header ---------------------------------------------- */
function initHeader() {
  const header = document.getElementById("header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- scroll reveal ----------------------------------------------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  // No IntersectionObserver, or reduced motion: show everything immediately.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );
  items.forEach((el) => io.observe(el));
}

/* ---------- animated stat counters -------------------------------------- */
function initCounters() {
  const nums = document.querySelectorAll("[data-count]");
  if (!nums.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = (el, value) => {
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    const shown = decimals
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString("en-US");
    el.textContent = `${el.dataset.prefix || ""}${shown}${el.dataset.suffix || ""}`;
  };

  if (reduced || !("IntersectionObserver" in window)) {
    nums.forEach((el) => render(el, parseFloat(el.dataset.count)));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        const target = parseFloat(el.dataset.count);
        const duration = 1400;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          render(el, target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.4 }
  );
  nums.forEach((el) => io.observe(el));
}

/* ---------- multi-step qualification quiz -------------------------------- */
function initQuiz() {
  const quiz = document.getElementById("quiz");
  const form = document.getElementById("leadForm");
  if (!quiz || !form) return;

  const steps = Array.from(form.querySelectorAll(".quiz__step"));
  const bar = document.getElementById("quizBar");
  const back = document.getElementById("quizBack");
  const next = document.getElementById("quizNext");
  const progress = quiz.querySelector(".quiz__progress");
  let current = 0;

  const show = (index) => {
    current = index;
    steps.forEach((s, i) => s.classList.toggle("is-active", i === index));
    const pct = ((index + 1) / steps.length) * 100;
    bar.style.width = `${pct}%`;
    progress.setAttribute("aria-valuenow", String(Math.round(pct)));
    back.hidden = index === 0;
    next.textContent = index === steps.length - 1 ? "Request my free consultation" : "Continue";
    const focusable = steps[index].querySelector("input:not([type=hidden])");
    if (focusable && index > 0) focusable.focus({ preventScroll: true });
  };

  // Choosing an option advances automatically — the reason a quiz outperforms
  // a block of fields is that each step costs one tap, not two.
  steps.forEach((step, index) => {
    step.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (index < steps.length - 1) setTimeout(() => show(index + 1), 220);
      });
    });
  });

  back.addEventListener("click", () => show(Math.max(0, current - 1)));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateStep(current, steps[current])) return;
    if (current < steps.length - 1) {
      show(current + 1);
      return;
    }
    submitLead(form, quiz);
  });
}

function validateStep(index, step) {
  clearErrors(step);

  const radios = step.querySelectorAll('input[type="radio"]');
  if (radios.length) {
    const chosen = Array.from(radios).some((r) => r.checked);
    if (!chosen) {
      const legend = step.querySelector(".quiz__question");
      legend.style.color = "#c0392b";
      setTimeout(() => (legend.style.color = ""), 1800);
      return false;
    }
    return true;
  }

  let ok = true;
  step.querySelectorAll("input[required]").forEach((input) => {
    const valid =
      input.type === "checkbox" ? input.checked : input.value.trim() !== "" && input.checkValidity();
    if (!valid) {
      ok = false;
      input.setAttribute("aria-invalid", "true");
      const slot = step.querySelector(`[data-error-for="${input.id}"]`);
      if (slot) {
        slot.textContent =
          input.type === "checkbox"
            ? "Please agree to the terms so we can contact you."
            : input.value.trim() === ""
            ? "This one is required."
            : "Please check this is correct.";
      }
    }
  });
  return ok;
}

function clearErrors(step) {
  step.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  step.querySelectorAll(".field__error").forEach((el) => (el.textContent = ""));
}

async function submitLead(form, quiz) {
  // Honeypot: a bot fills every field it finds, a patient never sees this one.
  if (form.company_website && form.company_website.value) return;

  const data = Object.fromEntries(new FormData(form).entries());
  data.page = "implant-landing-page";
  data.asana_task_gid = "1217133289235653";

  if (LEAD_ENDPOINT) {
    const button = document.getElementById("quizNext");
    button.disabled = true;
    button.textContent = "Sending…";
    try {
      await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (err) {
      button.disabled = false;
      button.textContent = "Request my free consultation";
      const slot = form.querySelector('[data-error-for="f-consent"]');
      if (slot) slot.textContent = "Something went wrong. Please call the practice instead.";
      return;
    }
    if (THANK_YOU_URL) {
      window.location.href = THANK_YOU_URL;
      return;
    }
  } else {
    // No GHL endpoint wired yet — log the payload so the shape can be reviewed.
    console.info("[lead] would POST to GHL:", data);
  }

  quiz.classList.add("is-done");
  quiz.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- FAQ accordion ------------------------------------------------ */
function initFaq() {
  document.querySelectorAll(".faq__item").forEach((item) => {
    const button = item.querySelector(".faq__q");
    button.addEventListener("click", () => {
      const open = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
    });
  });
}

/* ---------- before/after lightbox ---------------------------------------- */
function initLightbox() {
  const box = document.getElementById("lightbox");
  if (!box) return;
  const img = document.getElementById("lightboxImg");
  const close = document.getElementById("lightboxClose");
  let lastTrigger = null;

  document.querySelectorAll("[data-lightbox]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      lastTrigger = trigger;
      img.src = trigger.dataset.lightbox;
      img.alt = trigger.querySelector("img")?.alt || "Patient result";
      box.classList.add("is-open");
      close.focus();
    });
  });

  const hide = () => {
    box.classList.remove("is-open");
    img.src = "";
    if (lastTrigger) lastTrigger.focus();
  };
  close.addEventListener("click", hide);
  box.addEventListener("click", (event) => {
    if (event.target === box) hide();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && box.classList.contains("is-open")) hide();
  });
}

/* ---------- sticky mobile bar -------------------------------------------- */
function initMobileBar() {
  const bar = document.getElementById("mobileBar");
  if (!bar) return;
  const onScroll = () => bar.classList.toggle("is-visible", window.scrollY > 400);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}
