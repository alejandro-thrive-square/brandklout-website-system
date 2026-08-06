/* ==========================================================================
   Grand Mission Dentistry — Cosmetic Landing Page
   Asana task 1217072657902270 (parent 1217040406855578)

   SINGLE SOURCE OF TRUTH for every price and phone number on the page.
   ========================================================================== */

const OFFER = {
  /* Live offers published on grandmissiondentistry.com (2026-08-05). */
  newPatient: "189", // exam, X-rays, cleaning, treatment plan
  invisalign: "3,799", // aligners, refinements, retainer, whitening

  /* The practice's main line. The previous cosmetic campaign used the tracking
     number (281) 729-4615; swap it in here once Brandklout confirms ownership. */
  phoneDisplay: "(281) 789-8836",
  phoneDial: "+12817898836",
};

/* GHL lead destination — Asana task 1217072657902270 requires the form to live
   in GoHighLevel. Null until we have the endpoint or embed snippet. */
const LEAD_ENDPOINT = null;
const THANK_YOU_URL = null; // the thank-you page in this build

document.addEventListener("DOMContentLoaded", () => {
  applyTokens();
  initHeader();
  initReveal();
  initForm();
  initLightbox();
  initMobileBar();
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

/* ---------- tokens ------------------------------------------------------ */
function applyTokens() {
  const map = {
    "new-patient-value": OFFER.newPatient,
    "invisalign-value": OFFER.invisalign,
  };
  Object.entries(map).forEach(([key, value]) => {
    document.querySelectorAll(`[data-offer="${key}"]`).forEach((el) => {
      el.textContent = value;
    });
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

/* ---------- lead form ---------------------------------------------------- */
function initForm() {
  const form = document.getElementById("leadForm");
  const card = document.getElementById("book");
  if (!form || !card) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validate(form)) return;

    // Honeypot: a bot fills every field it finds, a patient never sees this one.
    if (form.company_website && form.company_website.value) return;

    const data = Object.fromEntries(new FormData(form).entries());
    data.page = "cosmetic-landing-page";
    data.asana_task_gid = "1217072657902270";

    if (LEAD_ENDPOINT) {
      const button = document.getElementById("formSubmit");
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
        button.textContent = "Request my consultation";
        const slot = form.querySelector('[data-error-for="f-consent"]');
        if (slot) slot.textContent = "Something went wrong. Please call the practice instead.";
        return;
      }
      if (THANK_YOU_URL) {
        window.location.href = THANK_YOU_URL;
        return;
      }
    } else {
      console.info("[lead] would POST to GHL:", data);
    }

    card.classList.add("is-done");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function validate(form) {
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  form.querySelectorAll(".field__error").forEach((el) => (el.textContent = ""));

  let ok = true;
  form.querySelectorAll("input[required]").forEach((input) => {
    const valid =
      input.type === "checkbox" ? input.checked : input.value.trim() !== "" && input.checkValidity();
    if (!valid) {
      ok = false;
      input.setAttribute("aria-invalid", "true");
      const slot = form.querySelector(`[data-error-for="${input.id}"]`);
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
