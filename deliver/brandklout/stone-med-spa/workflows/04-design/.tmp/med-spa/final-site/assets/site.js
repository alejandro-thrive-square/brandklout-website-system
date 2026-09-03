/* ===== js/00-runtime.js ===== */
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


/* ===== js/10-ledger.js ===== */
// THE CONCERN FILTER over the treatment ledger.
//
// The ledger renders every treatment, grouped by category, as <details> rows.
// This module adds the second axis: pick a concern and the table narrows to the
// treatments that address it.
//
// WHY IT FILTERS RATHER THAN NAVIGATES. The competitive research found that
// every serious med spa site runs a concern axis alongside the treatment axis,
// and the big ones run it as real pages — Beverly Hills has twenty-four. Ours
// is a filter over one page because the eleven-page brief does not fund twenty-
// four pages, and because a filter can be promoted to real /concerns/* pages
// later without changing the URL of anything already published. The markup is
// already shaped for that: each row carries its concerns as a data attribute,
// which is exactly what a page generator would read.
//
// It is a progressive enhancement in the strict sense. With no JavaScript the
// buttons are still rendered but every row is visible, which is the whole menu
// and therefore a correct page. Nothing is hidden in CSS by default.
//
// The filter is single-select. Multi-select was tried and discarded: with seven
// treatments and seven concerns, two concerns almost always select the entire
// menu, so the control did nothing while looking like it should.
(function () {
  "use strict";

  function initLedger() {
    var root = document.querySelector("[data-ledger]");
    if (!root) return;

    var buttons = Array.prototype.slice.call(
      document.querySelectorAll("[data-concern]")
    );
    var rows = Array.prototype.slice.call(root.querySelectorAll("[data-treatment]"));
    var groups = Array.prototype.slice.call(root.querySelectorAll("[data-group]"));
    var empty = root.querySelector("[data-ledger-empty]");
    var count = document.querySelector("[data-ledger-count]");
    if (!buttons.length || !rows.length) return;

    var active = null;

    function apply() {
      var shown = 0;

      rows.forEach(function (row) {
        var list = (row.getAttribute("data-concerns") || "").split(" ");
        var match = !active || list.indexOf(active) !== -1;
        row.hidden = !match;
        // A row left open from a previous filter would otherwise reappear
        // expanded when the filter is cleared, which reads as a glitch.
        if (!match) row.open = false;
        if (match) shown++;
      });

      // A category heading with no visible rows under it is noise, so the whole
      // shelf goes rather than leaving a heading over a gap.
      groups.forEach(function (group) {
        var visible = group.querySelectorAll("[data-treatment]:not([hidden])");
        group.hidden = visible.length === 0;
      });

      if (empty) empty.hidden = shown !== 0;

      if (count) {
        if (!active) {
          count.textContent = "";
        } else {
          var label = "";
          for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].getAttribute("data-concern") === active) {
              label = buttons[i].textContent.trim();
              break;
            }
          }
          count.textContent =
            shown === 0
              ? "No treatment on the menu addresses " + label.toLowerCase() + "."
              : shown +
                (shown === 1 ? " treatment addresses " : " treatments address ") +
                label.toLowerCase() +
                ".";
        }
      }

      buttons.forEach(function (b) {
        b.setAttribute(
          "aria-pressed",
          b.getAttribute("data-concern") === active ? "true" : "false"
        );
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-concern");
        // Clicking the active concern clears it. Without this the only way back
        // to the full menu is a page reload, because there is no "all" button —
        // and there is no "all" button because an eighth pill that means "no
        // filter" reads as an eighth concern.
        active = active === id ? null : id;
        apply();
      });
    });

    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLedger);
  } else {
    initLedger();
  }
})();


/* ===== js/11-form.js ===== */
// THE BOOKING FORM, WHICH IS INERT, AND THE PATH CHOOSER ABOVE IT.
//
// READ THIS BEFORE WIRING IT UP. The form does not post anywhere and that is
// deliberate, not unfinished. This practice has:
//
//   - no scheduling endpoint chosen for the med spa brand,
//   - no decision on who takes a virtual consultation or on what platform,
//   - and therefore no answer to whether that platform is HIPAA-compliant.
//
// A medical intake form that collects a name, a phone number and a description
// of what someone dislikes about their face, and then drops it, is worse than
// no form: the patient believes they have booked. So submit is prevented, the
// status line says plainly that the form is not live yet, and it gives the
// phone number, which is a channel that actually works today.
//
// WHEN AN ENDPOINT EXISTS: delete the preventDefault branch, put the action on
// the <form>, and delete this comment. Do not "just turn it on" without also
// confirming the destination is HIPAA-appropriate — the fields below are PHI
// the moment a patient types into them.
//
// The path chooser is the small piece that does work: choosing virtual or
// in-office scrolls to the form and preselects the matching option, so the two
// halves of the page are one flow rather than two.
(function () {
  "use strict";

  function initPaths() {
    var links = document.querySelectorAll("[data-path]");
    if (!links.length) return;
    var select = document.querySelector("[data-visit-type]");

    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener("click", function () {
        if (!select) return;
        var want = link.getAttribute("data-path");
        for (var i = 0; i < select.options.length; i++) {
          if (select.options[i].value === want) {
            select.selectedIndex = i;
            break;
          }
        }
      });
    });
  }

  function initForm() {
    var form = document.querySelector("[data-inert-form]");
    if (!form) return;
    var status = form.querySelector("[data-form-status]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!status) return;
      status.textContent =
        "This form is not connected yet. Please call (817) 383-8361 and we will book you in — " +
        "your details have not been sent.";
      // Focus is NOT moved to the status line. It is aria-live="polite", so a
      // screen reader announces it without yanking the caret out of the field
      // the visitor was in, and a sighted user is already looking at the button
      // the message appears beside.
    });
  }

  function boot() {
    initPaths();
    initForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
