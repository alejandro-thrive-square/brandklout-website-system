// Mason Park Dental - static rebuild. Everything here is progressive
// enhancement: the site is fully readable and navigable with JS off.
//
// The selectors below MUST match site/presentation.mjs. They drifted once
// already: this file still looked for `.mainnav` / `.navtoggle` after the markup
// moved to Client-First names, so the mobile menu button did nothing on every
// page and nothing reported it. If you rename a chrome class, change it here.
(function () {
  "use strict";

  var body = document.body;

  // ------------------------------------------------------------ mobile nav
  var toggle = document.querySelector(".navbar_toggle");
  var scrim = document.querySelector(".navbar_scrim");
  var nav = document.querySelector(".navbar_menu");

  function closeNav() {
    body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  if (scrim) scrim.addEventListener("click", closeNav);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  // On narrow screens the submenus are collapsed and opened by tapping the
  // parent. On wide screens they are hover menus and the parent link works
  // normally, so only intercept below the breakpoint.
  var narrow = window.matchMedia("(max-width: 1150px)");
  if (nav) {
    Array.prototype.forEach.call(nav.querySelectorAll(".has-dropdown > .navbar_link"), function (a) {
      a.addEventListener("click", function (e) {
        if (!narrow.matches) return;
        var li = a.parentElement;
        if (!li.classList.contains("is-open")) {
          e.preventDefault();
          li.classList.add("is-open");
        }
      });
    });
  }

  // -------------------------------------------------- current-page marking
  var here = location.pathname.replace(/index\.html$/, "");
  if (!here.endsWith("/")) here += "/";
  Array.prototype.forEach.call(document.querySelectorAll(".navbar_menu a[href]"), function (a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) !== "/") return;
    if (href === here) {
      a.setAttribute("aria-current", "page");
      var p = a.closest("ul");
      while (p && p !== nav) {
        var owner = p.parentElement;
        if (owner && owner.tagName === "LI") owner.classList.add("is-open");
        p = owner ? owner.closest("ul") : null;
      }
    }
  });

  // -------------------------------------------------- deferred map embeds
  // The Google Maps iframe is the heaviest thing on the contact pages and
  // nothing above the fold needs it, so it only loads once it is close.
  var lazyFrames = document.querySelectorAll("iframe[data-src]");
  if (lazyFrames.length) {
    var load = function (f) {
      f.src = f.getAttribute("data-src");
      f.removeAttribute("data-src");
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { load(en.target); io.unobserve(en.target); }
        });
      }, { rootMargin: "300px" });
      Array.prototype.forEach.call(lazyFrames, function (f) { io.observe(f); });
    } else {
      Array.prototype.forEach.call(lazyFrames, load);
    }
  }
})();
