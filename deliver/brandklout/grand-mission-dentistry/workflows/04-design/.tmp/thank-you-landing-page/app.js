/* ==========================================================================
   Grand Mission Dentistry — Thank You Landing Page
   Asana task 1217162605683014 (parent 1217040406855578)

   SHARED ARCHETYPE — Mason Park Dental has the identical 4-section spec.
   To reuse: change PRACTICE below and the copy in index.html. Nothing else
   is client-specific.
   ========================================================================== */

const PRACTICE = {
  phoneDisplay: "(281) 789-8836",
  phoneDial: "+12817898836",

  /* Opening hours as published on grandmissiondentistry.com (2026-08-05).
     [openMinutes, closeMinutes] from midnight, or null when closed.
     NOTE: the two original landing pages publish two *different* hour sets.
     This is the client's own current site, and it is the one to trust until
     Brandklout confirms otherwise. Keep this table and the <dl> in index.html
     in step — the open/closed banner reads this, the visible list is markup. */
  hours: {
    0: null, // Sunday
    1: [9 * 60, 19 * 60], // Monday    9:00 am – 7:00 pm
    2: [10 * 60, 20 * 60], // Tuesday  10:00 am – 8:00 pm
    3: [10 * 60, 20 * 60], // Wednesday
    4: [8 * 60, 18 * 60], // Thursday  8:00 am – 6:00 pm
    5: [8 * 60, 18 * 60], // Friday
    6: [8 * 60, 15 * 60], // Saturday  8:00 am – 3:00 pm
  },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

document.addEventListener("DOMContentLoaded", () => {
  applyTokens();
  initHeader();
  initReveal();
  initOpenStatus();
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

/* ---------- tokens ------------------------------------------------------ */
function applyTokens() {
  document.querySelectorAll("[data-tel]").forEach((el) => {
    el.textContent = PRACTICE.phoneDisplay;
  });
  document.querySelectorAll("[data-tel-link]").forEach((el) => {
    el.setAttribute("href", `tel:${PRACTICE.phoneDial}`);
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

/* ---------- open / closed right now --------------------------------------
   A thank-you page is read minutes after the form is submitted, so "call us"
   is only useful if the visitor knows whether anyone is there to answer.
   Runs on the visitor's clock; the practice is in US Central time, so this is
   accurate for local traffic, which is all a Richmond, TX campaign gets.
   -------------------------------------------------------------------------- */
function initOpenStatus() {
  const statusEl = document.getElementById("openStatus");
  const nextEl = document.getElementById("openNext");
  if (!statusEl) return;

  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = PRACTICE.hours[day];

  const fmt = (mins) => {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const suffix = h24 >= 12 ? "pm" : "am";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  if (today && minutes >= today[0] && minutes < today[1]) {
    statusEl.textContent = "Open now";
    statusEl.classList.add("is-open");
    nextEl.textContent = `Closing at ${fmt(today[1])} today.`;
  } else {
    statusEl.textContent = "Closed right now";
    statusEl.classList.add("is-closed");

    // Find the next opening, looking forward up to a week.
    for (let step = 0; step < 8; step++) {
      const d = (day + step) % 7;
      const slot = PRACTICE.hours[d];
      if (!slot) continue;
      if (step === 0 && minutes >= slot[0]) continue; // already past today's open
      const label = step === 0 ? "today" : step === 1 ? "tomorrow" : DAY_NAMES[d];
      nextEl.textContent = `Opens ${label} at ${fmt(slot[0])}. Leave a message and the team will call you back.`;
      break;
    }
  }

  // Highlight today's row in the hours list.
  const row = document.querySelector(`#hoursList [data-day="${day}"]`);
  if (row) row.classList.add("is-today");
}
