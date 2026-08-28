// Mason Park Dental - static rebuild. Everything here is progressive
// enhancement: the site is fully readable and navigable with JS off.
(function () {
  "use strict";

  var body = document.body;

  // ------------------------------------------------------------ mobile nav
  var toggle = document.querySelector(".navtoggle");
  var scrim = document.querySelector(".navscrim");
  var nav = document.querySelector(".mainnav");

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
    nav.querySelectorAll(".has-sub > a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (!narrow.matches) return;
        var li = a.parentElement;
        if (!li.classList.contains("open")) {
          e.preventDefault();
          li.classList.add("open");
        }
      });
    });
  }

  // -------------------------------------------------- current-page marking
  var here = location.pathname.replace(/index\.html$/, "");
  if (!here.endsWith("/")) here += "/";
  document.querySelectorAll(".mainnav a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) !== "/") return;
    if (href === here) {
      a.setAttribute("aria-current", "page");
      var p = a.closest("ul");
      while (p && p !== nav) {
        var owner = p.parentElement;
        if (owner && owner.tagName === "LI") owner.classList.add("open");
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
      lazyFrames.forEach(function (f) { io.observe(f); });
    } else {
      lazyFrames.forEach(load);
    }
  }
})();
