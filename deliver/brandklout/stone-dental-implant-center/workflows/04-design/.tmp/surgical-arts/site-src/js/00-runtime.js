// The whole runtime. Four behaviours, each guarding on its own selector so the
// one bundle can ship to every page and only the modules whose markup is
// present do anything.
//
//   navbar   solid-on-scroll, the Treatments dropdown, the mobile drawer
//   tabs     the price categories on the treatments hub
//   filter   the Results gallery
//   compare  the before/after wipe
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

    // The dropdown opens on hover via CSS. This adds the keyboard and touch
    // path.
    //
    // CHANGED 2026-08-31. The trigger used to be one <button> carrying both
    // jobs, and its handler called preventDefault() on every click, so the
    // Treatments overview page was unreachable from the nav. It is now a real
    // <a href="treatments.html"> for the label plus a separate caret <button>
    // for the menu. Only the caret is wired here; the link is left alone so it
    // navigates. Binding the old selector would silently kill the link again.
    var dd = nav.querySelector(".navbar_dropdown");
    if (dd) {
      var caret = dd.querySelector(".navbar_dropdown-caret-btn");
      var close = function () {
        dd.classList.remove("is-open");
        if (caret) caret.setAttribute("aria-expanded", "false");
      };
      if (caret) {
        caret.addEventListener("click", function (e) {
          e.preventDefault();
          var open = dd.classList.toggle("is-open");
          caret.setAttribute("aria-expanded", open ? "true" : "false");
        });
      }
      document.addEventListener("click", function (e) {
        if (!dd.contains(e.target)) close();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") close();
      });
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
      if (e.target.closest(".drawer_scrim, .drawer_close, .drawer_link, .drawer_sublink")) close();
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

  /* --- tabs --------------------------------------------------------------
     One group per [data-tabs]. Buttons carry aria-controls; panes are hidden
     with the `hidden` attribute rather than a class, so a pane is genuinely
     removed from the accessibility tree and from in-page search. ---------- */
  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (group) {
      var links = Array.prototype.slice.call(group.querySelectorAll(".tabs_link"));
      var panes = Array.prototype.slice.call(group.querySelectorAll(".tabs_pane"));
      if (!links.length || !panes.length) return;

      function select(id) {
        links.forEach(function (l) {
          var on = l.getAttribute("aria-controls") === id;
          l.classList.toggle("is-active", on);
          l.setAttribute("aria-selected", on ? "true" : "false");
          l.tabIndex = on ? 0 : -1;
        });
        panes.forEach(function (p) {
          p.hidden = p.id !== id;
        });
      }

      links.forEach(function (l, i) {
        l.addEventListener("click", function () {
          select(l.getAttribute("aria-controls"));
        });
        // Left/right arrows move between tabs, as the tablist pattern expects.
        l.addEventListener("keydown", function (e) {
          var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          var next = links[(i + d + links.length) % links.length];
          next.focus();
          select(next.getAttribute("aria-controls"));
        });
      });

      // Deep link: /treatments#skin opens the Skin tab.
      var hash = window.location.hash.replace("#", "");
      var target = hash && group.querySelector('[aria-controls="' + hash + '"]');
      select(target ? hash : links[0].getAttribute("aria-controls"));
    });
  }

  /* --- gallery filter ----------------------------------------------------- */
  function initFilter() {
    document.querySelectorAll("[data-filter]").forEach(function (group) {
      var buttons = Array.prototype.slice.call(group.querySelectorAll(".tabs_link"));
      var items = Array.prototype.slice.call(group.querySelectorAll("[data-filter-tags]"));
      var empty = group.querySelector("[data-filter-empty]");
      if (!buttons.length) return;

      function apply(value) {
        var shown = 0;
        items.forEach(function (item) {
          var tags = (item.getAttribute("data-filter-tags") || "").split(/\s+/);
          var on = value === "all" || tags.indexOf(value) !== -1;
          item.hidden = !on;
          if (on) shown++;
        });
        buttons.forEach(function (b) {
          var on = b.getAttribute("data-filter-value") === value;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        // The empty state is the page's normal condition until the practice
        // supplies consented cases, so it shows whenever nothing matched.
        if (empty) empty.hidden = shown !== 0;
      }

      buttons.forEach(function (b) {
        b.addEventListener("click", function () {
          apply(b.getAttribute("data-filter-value"));
        });
      });
      apply("all");
    });
  }

  /* --- before/after wipe -------------------------------------------------- */
  function initCompare() {
    document.querySelectorAll(".compare_component").forEach(function (box) {
      var input = box.querySelector(".compare_handle");
      if (!input) return;
      var paint = function () {
        box.style.setProperty("--pos", input.value + "%");
      };
      input.addEventListener("input", paint);
      paint();
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

  /* --- deferred map ------------------------------------------------------- */
  function initMap() {
    var btn = document.querySelector("[data-map-load]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var box = btn.closest(".map_component");
      var src = btn.getAttribute("data-map-load");
      var frame = document.createElement("iframe");
      frame.src = src;
      frame.loading = "lazy";
      frame.title = "Map to Stone Surgical Arts, 72 Andorra Dr #110A, Westlake, Texas";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      frame.allowFullscreen = true;
      box.innerHTML = "";
      box.appendChild(frame);
    });
  }

  function boot() {
    // Tells the head's safety timer that the bundle arrived, so it leaves the
    // .js class — and therefore the scroll reveals — alone.
    window.__ssaBooted = true;
    initNavbar();
    initDrawer();
    initTabs();
    initFilter();
    initCompare();
    initReveal();
    initMap();
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
