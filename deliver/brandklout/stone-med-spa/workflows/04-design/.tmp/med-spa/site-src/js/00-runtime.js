// The shared runtime — navbar, drawer, reveal. Each behaviour guards on its own
// selector, so a page that does not carry the markup pays nothing for the module.
//
//   navbar   solid-on-scroll
//   drawer   the mobile panel, which at 991px and below is the mobile contact card
//   reveal   the opt-in scroll reveal
//
// Carried over from the Stone Surgical Arts build with one change: the boot flag
// is __smsBooted, so the head safety timer of one site cannot be satisfied by the
// other bundle if both ever end up on one page (they will not, but the flag costs
// nothing to namespace). Everything this site does beyond the shell lives in
// js/10-*.js onward and is written for this site.
//
// No dependencies, no build step. Instatic serves this as one asset.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- navbar ------------------------------------------------------------ */
  function initNavbar() {
    var nav = document.querySelector(".navbar_component");
    if (!nav) return;

    if (!nav.classList.contains("is-static")) {
      var onScroll = function () {
        nav.classList.toggle("is-solid", window.scrollY > 24);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

  }

  /* --- drawer ------------------------------------------------------------ */
  function initDrawer() {
    var drawer = document.querySelector(".drawer_component");
    var burger = document.querySelector(".navbar_burger");
    if (!drawer || !burger) return;

    var panel = drawer.querySelector(".drawer_panel");
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      drawer.classList.add("is-open");
      burger.setAttribute("aria-expanded", "true");
      document.documentElement.style.overflow = "hidden";
      var first = panel.querySelector("a, button");
      if (first) first.focus();
    }
    function close() {
      drawer.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      document.documentElement.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    burger.addEventListener("click", function () {
      if (drawer.classList.contains("is-open")) close();
      else open();
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest(".drawer_scrim, .drawer_close, .drawer_link")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) close();
    });

    // Trap focus inside the panel while it is open — without this, tabbing
    // walks out into the page behind the scrim.
    drawer.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !drawer.classList.contains("is-open")) return;
      var items = panel.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* --- reveal on scroll ---------------------------------------------------
     Opt-in with data-reveal. Anything without it is untouched, and the whole
     thing is skipped when the visitor asks for reduced motion. ------------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-revealed");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  }

  function boot() {
    // Tells the head's safety timer that the bundle arrived, so it leaves the
    // .js class — and therefore the scroll reveals — alone.
    window.__smsBooted = true;
    initNavbar();
    initDrawer();
    initReveal();
    // The current year in the footer, so nobody has to remember to change it.
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
