/* ===========================================================================
   THE ELEVATION LAYER — Mason Park Dental, 2026-09-02, second cut.

   WHY. The client, reviewing staging: "There is too much text overall ...
   more images, less text and more animations." The first cut of this file
   ported the Stone Surgical Arts components one for one (catalogue accordion
   with a sticky photograph, cursor-following index, review carousel,
   filmstrip marquee, ghost words, town ticker, veil, hero inset), and the
   client's second note was the right one: "You practically cloned the stone
   site structure. None of our client sites should be the same." So these
   are DIFFERENT shapes that answer the same brief, and none of them exists
   on the Stone build:

     the stack      three hero frames that fan out as the page starts to scroll
     the columns    a photo wall in three columns moving at three speeds
     the tabs       service groups as a row of display-size tabs, one big frame
     the finder     rows that swap a photograph in a sticky side panel
     the deck       reviews as cards that stack on each other as you scroll
     the pair       two half-bleed photographs sliding in from either edge
     the pillars    three tall portraits revealed one after another by scroll
     the pane       a tall photograph in a narrow column beside a dark chapter
     the sheet      a contact sheet, grayscale at rest, colour under the pointer
     the seal       a slow-turning ring of type, the practice's own stamp

   Same three rules as journey.js, not negotiable:
     1. NOTHING IS HIDDEN BY THIS FILE. Every hidden state in site.css is
        scoped to `html.el-ready`, which this file sets first thing.
     2. GSAP IS OPTIONAL. The scrubbed effects (stack, columns, deck, pair,
        pillars, pane, parallax) use ScrollTrigger when it is there and leave
        the still state when it is not; the tabs, finder, masks and seal run
        on IntersectionObserver and CSS.
     3. REDUCED MOTION IS A BRANCH. No scrubs, no turning seal, no tilt.

   Every module guards on its own selector. Bundled after journey.js.
   =========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("el-ready");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var gsap = window.gsap;
  var ST = gsap && window.ScrollTrigger;
  var useGsap = !!(gsap && ST) && !reduce;
  if (useGsap) gsap.registerPlugin(ST);
  if (reduce) root.classList.add("el-reduce");

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* --- the mask reveals ----------------------------------------------------
     A frame opens as it enters. IntersectionObserver, so it works without
     GSAP. A frame that is also parallaxed gets its settle from GSAP, because
     the parallax writes an inline transform the stylesheet cannot beat. */
  function masks() {
    var items = $$('[data-el="mask"]');
    if (!items.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var settled = function (el) {
      if (!useGsap) return null;
      var imgs = $$("img", el).filter(function (im) { return im.closest("[data-parallax]"); });
      if (!imgs.length) return null;
      gsap.set(imgs, { scale: 1.16 });
      return imgs;
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        if (e.target.__settle) gsap.to(e.target.__settle, { scale: 1, duration: 1.5, ease: "power3.out" });
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    items.forEach(function (el) { el.__settle = settled(el); io.observe(el); });
  }

  /* --- parallax ------------------------------------------------------------
     data-parallax="12": the image travels 12% of its own height across the
     frame's time on screen. Set taller than the frame so no edge shows. */
  function parallax() {
    if (!useGsap) return;
    $$("[data-parallax]").forEach(function (frame) {
      var img = $("img", frame);
      if (!img) return;
      var amount = parseFloat(frame.getAttribute("data-parallax")) || 10;
      var top = frame.getAttribute("data-parallax-anchor") === "top";
      gsap.set(img, { height: 100 + amount * 2 + "%", top: top ? 0 : -amount + "%", position: "relative" });
      gsap.fromTo(img, { yPercent: top ? 0 : -amount * 0.5 }, {
        yPercent: top ? -amount : amount * 0.5, ease: "none",
        scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 0.6 }
      });
    });
  }

  /* --- the stack -----------------------------------------------------------
     Three frames sit on each other at the hero's edge. As the page starts to
     scroll they fan out, each one rotating and drifting its own way, so the
     hero is left rather than scrolled past. Without GSAP: three fanned
     frames, still. */
  function stack() {
    var el = $(".el-stack");
    if (!el || !useGsap) return;
    var frames = $$(".el-stack_frame", el);
    var sec = el.closest("section") || el.parentNode;
    frames.forEach(function (f, i) {
      var dir = i - (frames.length - 1) / 2;
      gsap.fromTo(f,
        { xPercent: 0, yPercent: 0, rotate: dir * 3 },
        { xPercent: dir * 34, yPercent: -18 - i * 12, rotate: dir * 12, ease: "none",
          scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: 0.5 } });
    });
  }

  /* --- the columns ---------------------------------------------------------
     A photo wall in three columns. Scroll moves the outer columns up and the
     middle one down, at three speeds, so the wall slides against itself.
     Without GSAP it is a grid. Below 900 the stylesheet lays the tiles as a
     snapping row and this does nothing. */
  function columns() {
    if (!useGsap) return;
    $$(".el-columns").forEach(function (wall) {
      if (window.innerWidth < 900) return;
      var cols = $$(".el-columns_col", wall);
      var speeds = [-14, 10, -22];
      cols.forEach(function (col, i) {
        gsap.fromTo(col, { yPercent: -speeds[i % 3] / 2 }, {
          yPercent: speeds[i % 3] / 2, ease: "none",
          scrollTrigger: { trigger: wall, start: "top bottom", end: "bottom top", scrub: 0.7 }
        });
      });
    });
  }

  /* --- the tabs ------------------------------------------------------------
     Service groups as a row of display-size names. The active one shows its
     frame and its chips; the frame crossfades. Click and keyboard; hover on
     a fine pointer. The tab is an <a> with an in-page href so it works
     without this and survives Instatic (a <button> keeps no children). */
  function tabs() {
    $$(".el-tabs").forEach(function (rootEl) {
      var links = $$(".el-tabs_tab", rootEl);
      var panels = $$(".el-tabs_panel", rootEl);
      var frames = $$(".el-tabs_frames img", rootEl);
      var count = $(".el-tabs_count", rootEl);
      var show = function (key) {
        links.forEach(function (a) {
          var on = a.getAttribute("data-tab") === key;
          a.classList.toggle("is-active", on);
          a.setAttribute("aria-selected", on ? "true" : "false");
        });
        panels.forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-tab") === key); });
        frames.forEach(function (f) { f.classList.toggle("is-active", f.getAttribute("data-tab") === key); });
        if (count) {
          var p = panels.filter(function (x) { return x.getAttribute("data-tab") === key; })[0];
          var n = p ? $$(".el-tabs_chip", p).length : 0;
          count.textContent = n + (n === 1 ? " treatment" : " treatments");
        }
      };
      links.forEach(function (a) {
        a.addEventListener("click", function (e) { e.preventDefault(); show(a.getAttribute("data-tab")); a.focus(); });
        if (finePointer) a.addEventListener("mouseenter", function () { show(a.getAttribute("data-tab")); });
        a.addEventListener("keydown", function (e) {
          var i = links.indexOf(a);
          if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); links[(i + 1) % links.length].click(); }
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); links[(i - 1 + links.length) % links.length].click(); }
        });
      });
      var first = $(".el-tabs_tab.is-active", rootEl) || links[0];
      if (first) show(first.getAttribute("data-tab"));
    });
  }

  /* --- the finder ----------------------------------------------------------
     A list of what is wrong; a sticky panel beside it shows the room where
     that gets answered. Hover or focus on a row swaps the panel's frame and
     its caption. On touch the panel sits above the list and the first row's
     frame stays. */
  function finder() {
    $$(".el-finder").forEach(function (rootEl) {
      var rows = $$(".el-finder_row", rootEl);
      var frames = $$(".el-finder_panel img", rootEl);
      var cap = $(".el-finder_caption", rootEl);
      if (!rows.length || !frames.length) return;
      var show = function (row) {
        var key = row.getAttribute("data-img");
        rows.forEach(function (r) { r.classList.toggle("is-current", r === row); });
        frames.forEach(function (f) { f.classList.toggle("is-active", f.getAttribute("data-img") === key); });
        if (cap) cap.textContent = row.getAttribute("data-caption") || "";
      };
      rows.forEach(function (row) {
        row.addEventListener("mouseenter", function () { show(row); });
        row.addEventListener("focus", function () { show(row); });
      });
      show(rows[0]);
    });
  }

  /* --- the deck ------------------------------------------------------------
     Reviews as cards. The stylesheet makes each one sticky, so as the page
     scrolls they pile on top of each other; this scales and dims the ones
     already covered, scrubbed to the card that covers them. CSS alone gives
     the pile; GSAP gives the depth. */
  function deck() {
    if (!useGsap) return;
    $$(".el-deck").forEach(function (rootEl) {
      var cards = $$(".el-deck_card", rootEl);
      cards.forEach(function (card, i) {
        var next = cards[i + 1];
        if (!next) return;
        gsap.to(card, {
          scale: 0.94, opacity: 0.55, ease: "none",
          scrollTrigger: { trigger: next, start: "top 75%", end: "top 20%", scrub: 0.4 }
        });
      });
    });
  }

  /* --- the pair ------------------------------------------------------------
     Two half-bleed photographs, one from each edge, meeting under a line of
     type as the section crosses the window. */
  function pair() {
    if (!useGsap) return;
    $$(".el-pair").forEach(function (rootEl) {
      var a = $(".el-pair_frame.is-left", rootEl), b = $(".el-pair_frame.is-right", rootEl), line = $(".el-pair_line", rootEl);
      var st = { trigger: rootEl, start: "top 90%", end: "center 45%", scrub: 0.6 };
      if (a) gsap.fromTo(a, { xPercent: -22 }, { xPercent: 0, ease: "none", scrollTrigger: st });
      if (b) gsap.fromTo(b, { xPercent: 22 }, { xPercent: 0, ease: "none", scrollTrigger: st });
      if (line) gsap.fromTo(line, { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: "none", scrollTrigger: st });
    });
  }

  /* --- the pillars ---------------------------------------------------------
     Three tall portraits, revealed from the bottom one after another as the
     row scrolls into view, their captions following. Scrubbed, so a reader
     can move through it at their own pace and back. */
  function pillars() {
    if (!useGsap) return;
    $$(".el-pillars").forEach(function (rootEl) {
      var items = $$(".el-pillar", rootEl);
      items.forEach(function (p, i) {
        var frame = $(".el-pillar_frame", p), copy = $(".el-pillar_copy", p);
        // each pillar's window starts a little later than the one before it,
        // so the three open left to right as the row rises through the screen
        if (frame) gsap.fromTo(frame, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", ease: "none",
          scrollTrigger: { trigger: rootEl, start: "top " + (88 - i * 12) + "%", end: "top " + (36 - i * 6) + "%", scrub: 0.5 } });
        if (copy) gsap.fromTo(copy, { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: "none",
          scrollTrigger: { trigger: rootEl, start: "top " + (66 - i * 12) + "%", end: "top " + (30 - i * 6) + "%", scrub: 0.5 } });
      });
    });
  }

  /* --- the sheet -----------------------------------------------------------
     A contact sheet. Grayscale at rest, colour under the pointer, and the
     caption of the tile under the pointer is written into the sheet's one
     caption line rather than onto every tile. */
  function sheet() {
    $$(".el-sheet").forEach(function (rootEl) {
      var tiles = $$(".el-sheet_tile", rootEl);
      var line = $(".el-sheet_line", rootEl);
      if (!line) return;
      var rest = line.textContent;
      tiles.forEach(function (t) {
        var say = function () { line.textContent = t.getAttribute("data-caption") || rest; };
        t.addEventListener("mouseenter", say);
        t.addEventListener("focus", say);
        t.addEventListener("mouseleave", function () { line.textContent = rest; });
        t.addEventListener("blur", function () { line.textContent = rest; });
      });
    });
  }

  /* --- the seal ------------------------------------------------------------
     A ring of type that turns slowly with the scroll. Built from the text in
     the element: each character is placed on the circle by rotation. Under
     reduced motion it is a still ring. */
  function seal() {
    $$(".el-seal").forEach(function (el) {
      var text = (el.getAttribute("data-text") || el.textContent || "").trim();
      if (!text) return;
      var chars = text.split("");
      el.textContent = "";
      var ring = document.createElement("span");
      ring.className = "el-seal_ring";
      ring.setAttribute("aria-hidden", "true");
      chars.forEach(function (c, i) {
        var s = document.createElement("i");
        s.textContent = c === " " ? " " : c;
        s.style.transform = "rotate(" + (i * 360 / chars.length) + "deg)";
        ring.appendChild(s);
      });
      el.appendChild(ring);
      var mark = document.createElement("span");
      mark.className = "el-seal_mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = el.getAttribute("data-mark") || "MP";
      el.appendChild(mark);
      if (!useGsap) return;
      gsap.to(ring, { rotate: 360, ease: "none", scrollTrigger: { trigger: el.parentNode, start: "top bottom", end: "bottom top", scrub: 1 } });
    });
  }

  /* --- the pane ------------------------------------------------------------
     The tall photograph beside a dark chapter drifts at its own rate. */
  function pane() {
    if (!useGsap) return;
    $$(".el-pane").forEach(function (p) {
      var img = $("img", p);
      if (!img) return;
      gsap.fromTo(img, { yPercent: -8, scale: 1.12 }, { yPercent: 8, scale: 1.04, ease: "none",
        scrollTrigger: { trigger: p.parentNode, start: "top bottom", end: "bottom top", scrub: 0.8 } });
    });
  }

  /* --- the tilt cards ------------------------------------------------------
     A photograph card that leans a few degrees toward the pointer. */
  function tilt() {
    if (!finePointer || reduce) return;
    $$("[data-el-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(60rem) rotateX(" + (-y * 6) + "deg) rotateY(" + (x * 8) + "deg) translateY(-.25rem)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* --- the blog ------------------------------------------------------------
     Three small things the article and the index need and the markup cannot
     carry on its own, because on Instatic the article body is a CMS outlet
     and the index is a loop:
       contents      the rail's list is built from the h2/h3 in the body,
                     each heading given an id, the one in view marked
       reading time  words / 220, written into [data-readtime]
       topic filter  the strip's tiles hide every card whose topic is not
                     theirs; cards the loop appends later are filtered by a
                     MutationObserver, so "Load more" stays honest.
     Nothing here is hidden without JS: the list is simply empty and every
     card shows. */
  function blog() {
    var body = $(".bl-art_body");
    if (body) {
      var toc = $("[data-toc]");
      var heads = $$("h2, h3", body);
      if (toc && heads.length > 1) {
        var used = {};
        var links = [];
        heads.forEach(function (h) {
          if (!h.id) {
            var base = (h.textContent || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
            var id = base, n = 2;
            while (used[id] || document.getElementById(id)) id = base + "-" + n++;
            h.id = id;
          }
          used[h.id] = true;
          var li = document.createElement("li");
          if (h.tagName === "H3") li.className = "is-sub";
          var a = document.createElement("a");
          a.href = "#" + h.id;
          /* "1. Dental Bonding" already carries its number; the list adds its own. */
          a.textContent = (h.textContent || "").replace(/^\s*\d+\s*[.):]\s*/, "").trim() || h.textContent;
          li.appendChild(a);
          toc.appendChild(li);
          links.push(a);
        });
        if ("IntersectionObserver" in window) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              if (!e.isIntersecting) return;
              links.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id); });
            });
          }, { rootMargin: "-18% 0px -72% 0px", threshold: 0 });
          heads.forEach(function (h) { io.observe(h); });
        }
      }
      var rt = $("[data-readtime]");
      if (rt) {
        var words = (body.textContent || "").trim().split(/\s+/).length;
        rt.textContent = Math.max(1, Math.round(words / 220)) + " min read";
      }
    }

    var topics = $$(".bl-topic");
    var grid = $(".bl-grid:not(.is-related)");
    if (topics.length && grid) {
      var key = function (s) { return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); };
      var current = "";
      var empty = $(".bl-empty");
      var apply = function () {
        var shown = 0;
        $$(".bl-card", grid).forEach(function (card) {
          var b = $(".bl-card_meta b", card);
          var off = !!current && key(b ? b.textContent : "") !== current;
          card.classList.toggle("is-filtered", off);
          if (!off) shown++;
        });
        topics.forEach(function (tp) { tp.classList.toggle("is-on", key(tp.getAttribute("data-topic")) === current); });
        if (empty) empty.hidden = shown > 0;
      };
      topics.forEach(function (tp) {
        tp.addEventListener("click", function () {
          var t = key(tp.getAttribute("data-topic"));
          current = t === current ? "" : t;
          apply();
        });
      });
      if ("MutationObserver" in window) {
        new MutationObserver(function () { if (current) apply(); }).observe(grid, { childList: true });
      }
    }
  }

  function boot() {
    masks();
    tabs();
    finder();
    sheet();
    seal();
    tilt();
    blog();
    if (useGsap) {
      parallax();
      stack();
      columns();
      deck();
      pair();
      pillars();
      pane();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
