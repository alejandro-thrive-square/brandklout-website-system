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
  //
  // IT MAY NOT BE AN IFRAME BY THE TIME THIS RUNS. Instatic stores a page as a
  // node graph, and an <iframe> becomes a `base.container` with
  // `tag: "custom", customTag: "iframe"` -- which the PUBLISHER does not
  // honour: it emits a plain <div> carrying the attributes. So the map arrived
  // live as `<div data-src="https://www.google.com/maps/embed?...">`, this
  // selector matched nothing, and the invitation chapter had a 579x0 hole where
  // the map should be. (Same on production, so the map has never worked there
  // either.) Rather than fight the publisher, build the real element here: the
  // local page hands us an <iframe> and we set its src, the live page hands us
  // a <div> and we replace it.
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

  // --------------------------------------------------- the phone number
  // BugHerd #79-#84, #97 and #100, 2026-09-18: "the button is enabled, but it
  // doesn't redirect to any page", filed seven times against seven different
  // phone links. They are all `<a href="tel:+12817698878">`, and .tmp/probe-tel.mjs
  // shows nothing on the page cancels the click. On a phone that link opens
  // the dialler. On a desktop it hands the tel: scheme to the operating
  // system, and a Windows machine with nothing registered for it does
  // nothing at all -- which from the reviewer's chair is a dead button.
  //
  // The link is NOT changed and the default is NOT prevented: a handler, if
  // there is one, still gets its chance. What is added is feedback. On a
  // device with a fine pointer the number is copied to the clipboard and a
  // short line says so, so the click always does something a reader can see.
  // On a touch device this is skipped: the dialler is the feedback.
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)");
  if (finePointer && finePointer.matches) {
    var note, noteTimer;
    var say = function (text, x, y) {
      if (!note) {
        note = document.createElement("div");
        note.className = "phone-copied";
        note.setAttribute("role", "status");
        note.setAttribute("aria-live", "polite");
        document.body.appendChild(note);
      }
      note.textContent = text;
      note.style.left = Math.round(x) + "px";
      note.style.top = Math.round(y) + "px";
      // Two frames, so the element is laid out before the class that fades it in.
      requestAnimationFrame(function () { requestAnimationFrame(function () { note.classList.add("is-on"); }); });
      clearTimeout(noteTimer);
      noteTimer = setTimeout(function () { note.classList.remove("is-on"); }, 2400);
    };
    var copy = function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
      }
      return Promise.resolve(legacyCopy(text));
    };
    var legacyCopy = function (text) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;top:-100px;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch (e) { return false; }
    };
    document.addEventListener("click", function (e) {
      var el = e.target;
      if (!el || !el.closest) return;
      var a = el.closest('a[href^="tel:"]');
      if (!a) return;
      var shown = (a.textContent || "").replace(/^Call\s+/i, "").replace(/\s+now$/i, "").trim();
      var raw = a.getAttribute("href").slice(4);
      var box = a.getBoundingClientRect();
      copy(shown || raw).then(function (ok) {
        say(ok ? "Copied " + (shown || raw) : (shown || raw), box.left + box.width / 2, box.bottom);
      });
    }, false);
  }
})();
