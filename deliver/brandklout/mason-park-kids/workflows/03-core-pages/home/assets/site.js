// Mason Park Dental for Kids - the core pages. Everything here is progressive
// enhancement: the site is fully readable and navigable with JS off.
//
// THE SELECTORS BELOW MUST MATCH THE CHROME IN home/*/index.html. The parent
// practice's site drifted once (a script still looking for `.mainnav` after
// the markup moved to Client-First names) and the mobile menu button silently
// did nothing on every page. If you rename a chrome class, change it here.
//
// This file also ships to an Instatic instance that still holds the 43
// migrated pages, whose chrome uses the OLD names (`navbar_toggle`,
// `navbar_menu`, `navbar_scrim`, `.has-dropdown`). Both vocabularies are
// handled, so the one site-wide script serves both generations of page.
(function () {
  "use strict";

  var body = document.body;

  // ------------------------------------------------------- file:// review
  // Every internal link is root-relative (`/about-us/`), which is what
  // Instatic serves. Opened from disk for a review, the browser resolves
  // `/about-us/` against the drive root and every link is dead. On file://
  // only, rewrite each one to a path relative to THIS page and point it at
  // the folder's index.html, since a directory does not serve one from disk.
  // The stylesheet's own href already says how far up the site root is
  // (`assets/`, `../assets/`, `../../assets/`), so nothing is guessed.
  // Inert on http(s): the branch never runs there. Added 2026-09-09 (evening).
  if (location.protocol === "file:") {
    var css = document.querySelector('link[rel="stylesheet"][href$="site.css"]');
    var up = css ? css.getAttribute("href").replace(/assets\/site\.css$/, "") : "";
    var links = document.querySelectorAll('a[href^="/"]');
    for (var k = 0; k < links.length; k++) {
      var href = links[k].getAttribute("href");
      if (href.indexOf("//") === 0) continue;
      var hash = "", q = href.indexOf("#");
      if (q >= 0) { hash = href.slice(q); href = href.slice(0, q); }
      if (href.charAt(href.length - 1) !== "/") href += "/";
      links[k].setAttribute("href", up + href.slice(1) + "index.html" + hash);
    }
  }

  function first(sels) {
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el) return el;
    }
    return null;
  }

  // ------------------------------------------------------------ mobile nav
  var toggle = first([".masthead_toggle", ".navbar_toggle"]);
  var scrim = first([".masthead_scrim", ".navbar_scrim"]);
  var nav = first([".masthead_menu", ".navbar_menu"]);

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
    var parents = nav.querySelectorAll(".is-dropdown > .masthead_link, .has-dropdown > .navbar_link");
    Array.prototype.forEach.call(parents, function (a) {
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
  if (here.slice(-1) !== "/") here += "/";
  if (nav) {
    Array.prototype.forEach.call(nav.querySelectorAll("a[href]"), function (a) {
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) !== "/") return;
      var h = href.slice(-1) === "/" ? href : href + "/";
      if (h === here) {
        a.setAttribute("aria-current", "page");
        var p = a.closest("ul");
        while (p && p !== nav) {
          var owner = p.parentElement;
          if (owner && owner.tagName === "LI") owner.classList.add("is-open");
          p = owner ? owner.closest("ul") : null;
        }
      }
    });
  }

  // -------------------------------------------------- deferred map embeds
  // The Google Maps iframe is the heaviest thing on the page and nothing
  // above the fold needs it, so it only loads once it is close.
  //
  // IT MAY NOT BE AN IFRAME BY THE TIME THIS RUNS. Instatic stores a page as a
  // node graph and its publisher emits an <iframe> as a plain <div> carrying
  // the attributes. So the local page hands us an <iframe> and we set its
  // src; the live page hands us a <div> and we replace it.
  var lazyFrames = document.querySelectorAll("iframe[data-src], .embed_component > [data-src]");
  if (lazyFrames.length) {
    var load = function (f) {
      var src = f.getAttribute("data-src");
      if (f.tagName === "IFRAME") {
        f.src = src;
        f.removeAttribute("data-src");
        return;
      }
      var frame = document.createElement("iframe");
      frame.src = src;
      frame.title = f.getAttribute("title") || "Map";
      frame.loading = "lazy";
      frame.setAttribute("referrerpolicy", f.getAttribute("referrerpolicy") || "no-referrer-when-downgrade");
      if (f.className) frame.className = f.className;
      f.parentNode.replaceChild(frame, f);
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

  // ------------------------------------------------------- story carousel
  // /patient-reviews "The Stories" (2026-10-01). The track is a native
  // scroll-snap row, so touch, trackpad and keyboard work with JS off; this
  // adds the previous/next buttons (they wrap at the ends), the "01 / 05"
  // counter, the progress bar and `is-on` on the card in front. Everything is
  // found by class: Instatic drops data-* and aria-* from <button>.
  Array.prototype.forEach.call(document.querySelectorAll(".stories_carousel"), function (box) {
    var track = box.querySelector(".stories_track");
    if (!track) return;
    var cards = Array.prototype.slice.call(track.children);
    if (cards.length < 2) return;
    var count = box.querySelector(".stories_count b");
    var bar = box.querySelector(".stories_bar i");
    var current = -1;
    var pos = function (i) { return cards[i].offsetLeft - cards[0].offsetLeft; };
    var nearest = function () {
      var best = 0, gap = Infinity;
      for (var i = 0; i < cards.length; i++) {
        var d = Math.abs(pos(i) - track.scrollLeft);
        if (d < gap) { gap = d; best = i; }
      }
      // At the far end the last cards cannot reach the snap point.
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) best = cards.length - 1;
      return best;
    };
    var mark = function () {
      var i = nearest();
      if (i === current) return;
      current = i;
      cards.forEach(function (c, k) { c.classList.toggle("is-on", k === i); });
      if (count) count.textContent = (i < 9 ? "0" : "") + (i + 1);
      if (bar) bar.style.transform = "scaleX(" + (i + 1) / cards.length + ")";
    };
    var go = function (i) {
      i = (i + cards.length) % cards.length;
      var smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({ left: pos(i), behavior: smooth ? "smooth" : "auto" });
    };
    var prev = box.querySelector(".stories_previous");
    var next = box.querySelector(".stories_next");
    if (prev) prev.addEventListener("click", function () { go(current - 1); });
    if (next) next.addEventListener("click", function () { go(current + 1); });
    var queued = false;
    track.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; mark(); });
    }, { passive: true });
    window.addEventListener("resize", function () { current = -1; mark(); });
    box.classList.add("is-ready");
    mark();
  });
})();
