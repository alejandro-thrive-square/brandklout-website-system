/* ===== js/00-runtime.js ===== */
// The whole runtime. Each behaviour guards on its own selector, so a page that
// does not carry the markup pays nothing for the module.
//
//   navbar   solid-on-scroll
//   drawer   the mobile panel, which on this site is the mobile contact card
//   reveal   the opt-in scroll reveal
//
// TRIMMED 2026-09-01, when the site became the home page alone. Gone with the
// pages they served: the Treatments dropdown (navbar), `tabs` (the price
// categories on the treatments hub), `filter` (the Results gallery), `compare`
// (the before/after wipe) and `map` (the deferred map on the booking page).
// They were guarded and therefore harmless, but a guard that can never fire is
// just a thing the next reader has to rule out.
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
    window.__ssaBooted = true;
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


/* ===== js/10-journey.js ===== */
/* ===========================================================================
   THE JOURNEY RUNTIME — the home page's chapters, added 2026-08-31.

   Everything here is PROGRESSIVE ENHANCEMENT on top of a page that is already
   complete without it. Three rules, and they are the ones the Nahlah build
   learned the hard way:

     1. NOTHING IS HIDDEN BY THIS FILE. Every hidden state lives in
        50-journey.css scoped to `.js`, and the head partial strips `.js` after
        2.5s if the bundle never boots. A page with no motion is fine; a page
        with no content is not.
     2. GSAP IS OPTIONAL. If window.gsap is missing (blocked, cached badly,
        vendor.js not requested) every effect falls back to an
        IntersectionObserver reveal, which is what the rest of the site already
        uses. Guard on the positive, never on the absence: a
        `!smoother || smoother.paused()` style check reports PASS while the
        thing is silently broken.
     3. REDUCED MOTION IS A BRANCH, NOT A CSS AFTERTHOUGHT. No pinning at all,
        no scrub, no split. The path chapter stays an ordinary scrollable rail
        and the thesis is simply lit.

   Bundled into site.js after 00-runtime.js, and guarded on `.journey_page` so
   the other seventeen pages run none of it.
   =========================================================================== */
(function () {
  "use strict";

  var page = document.querySelector(".journey_page");
  if (!page) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gsap = window.gsap;
  var ST = gsap && window.ScrollTrigger;
  var SplitText = window.SplitText;
  var useGsap = !!(gsap && ST) && !reduce;

  if (useGsap) gsap.registerPlugin(ST);

  /* --- the baseline reveal --------------------------------------------------
     Used on its own when GSAP is absent, and alongside it when it is not:
     ScrollTrigger drives the expensive chapters, this drives the ordinary
     rise-and-fade, and there is no reason to pay for a ScrollTrigger instance
     per paragraph. */
  function reveals() {
    // Containers AND the children of a stagger group. The children are the
    // point: a stagger container can be 1.6 screens tall, and revealing on the
    // container meant every card in it animated the moment its top edge
    // appeared, with three of the four playing off-screen. Observing the
    // children means a card animates when the card is actually in view.
    var items = [];
    var all = page.querySelectorAll("[data-j]");
    for (var a = 0; a < all.length; a++) {
      items.push(all[a]);
      if (all[a].getAttribute("data-j") === "stagger") {
        var kids = all[a].children;
        for (var k = 0; k < kids.length; k++) items.push(kids[k]);
      }
    }

    if (!("IntersectionObserver" in window) || reduce) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-in");
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      },
      // threshold 0 with a bottom margin, NOT a fraction of the element. A
      // fractional threshold on an element taller than the viewport can never
      // be met, and several chapters here are taller than the viewport.
      { rootMargin: "0px 0px -10% 0px", threshold: 0 }
    );
    for (var n = 0; n < items.length; n++) io.observe(items[n]);
  }

  /* --- masked line reveal ---------------------------------------------------
     SplitText where it is available, because splitting lines correctly means
     re-splitting on resize and on webfont load, and hand-rolling that is how
     you end up with a headline broken mid-word on an iPad. Without it the
     heading is just a heading, which is a perfectly good still state. */
  function splitLines() {
    if (reduce || !SplitText || !gsap) return;
    var targets = page.querySelectorAll("[data-j-split]");
    for (var i = 0; i < targets.length; i++) {
      (function (el) {
        var split = new SplitText(el, { type: "lines", linesClass: "j-line" });
        // SplitText gives the lines; the mask is ours, one clipping wrapper
        // per line, because `mask:'lines'` is a newer-version option and this
        // build pins 3.15.
        split.lines.forEach(function (line) {
          var mask = document.createElement("span");
          mask.className = "j-line-mask";
          line.parentNode.insertBefore(mask, line);
          mask.appendChild(line);
        });
        ST.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: function () {
            gsap.to(el.querySelectorAll(".j-line"), {
              y: "0%",
              duration: 1,
              ease: "power3.out",
              stagger: 0.08,
            });
          },
        });
        gsap.set(el.querySelectorAll(".j-line"), { y: "105%" });
      })(targets[i]);
    }
  }

  /* --- the progress bar and the chapter readout -----------------------------
     Decoration: both are aria-hidden, and every chapter is reachable from the
     nav, the drawer and the footer without them. */
  function readout() {
    var bar = page.querySelector(".journey_progress-bar");
    var pad = page.querySelector(".journey_readout");
    var num = pad && pad.querySelector(".journey_readout-num");
    var name = pad && pad.querySelector(".journey_readout-name");
    var chapters = page.querySelectorAll("[data-chapter]");
    if (reduce) return;

    if (bar) {
      if (useGsap) {
        gsap.to(bar, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: page, start: "top top", end: "max", scrub: 0.3 },
        });
      } else {
        var onScroll = function () {
          var h = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.transform = "scaleX(" + (h > 0 ? window.scrollY / h : 0) + ")";
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
      }
    }

    if (!pad || !chapters.length) return;
    var set = function (el) {
      if (num) num.textContent = el.getAttribute("data-chapter");
      if (name) name.textContent = el.getAttribute("data-chapter-name") || "";
      pad.classList.add("is-on");
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) set(e.target);
          });
        },
        // A tall band across the middle of the viewport: whatever occupies the
        // reader's eyeline is the chapter the readout names.
        { rootMargin: "-45% 0px -45% 0px" }
      );
      for (var i = 0; i < chapters.length; i++) io.observe(chapters[i]);
    }
  }

  /* --- 00 arrival -----------------------------------------------------------
     The photograph settles from a slight over-scale on load, then drifts as
     the chapter leaves. Both are decoration on an image that is already in
     place and already the right size. */
  function arrival() {
    if (!useGsap) return;
    var photo = page.querySelector(".arrival_photo img");
    if (!photo) return;
    gsap.fromTo(photo, { scale: 1.09 }, { scale: 1, duration: 1.6, ease: "power2.out" });
    gsap.to(photo, {
      yPercent: 8,
      ease: "none",
      scrollTrigger: {
        trigger: ".arrival_component",
        start: "top top",
        end: "bottom top",
        scrub: 0.4,
      },
    });
  }

  /* --- the ledger counters --------------------------------------------------
     The four figures count up once. They are published numbers, so the tween
     has to land on the exact string the markup carries rather than on a
     rounded version of it: "4.8" counts in tenths, "20" in whole numbers, and
     the final frame is the literal text set back, not a formatted value. */
  function counters() {
    var values = page.querySelectorAll("[data-count]");
    if (!values.length) return;
    for (var i = 0; i < values.length; i++) {
      (function (el) {
        var target = parseFloat(el.getAttribute("data-count"));
        var final = el.textContent;
        var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
        if (reduce || !useGsap || isNaN(target)) {
          el.textContent = final;
          return;
        }
        var obj = { v: 0 };
        ST.create({
          trigger: el,
          start: "top 92%",
          once: true,
          onEnter: function () {
            gsap.to(obj, {
              v: target,
              duration: 1.4,
              ease: "power2.out",
              onUpdate: function () {
                el.textContent = obj.v.toFixed(decimals);
              },
              onComplete: function () {
                el.textContent = final;
              },
            });
          },
        });
        el.textContent = (0).toFixed(decimals);
      })(values[i]);
    }
  }

  /* --- 01 the thesis --------------------------------------------------------
     Dr. Stone's own sentence, brightening word by word as you arrive at it.
     The words are wrapped here rather than in the markup so the source stays
     one readable sentence and a copy change does not mean re-tagging spans. */
  function thesis() {
    var el = page.querySelector(".thesis_text");
    if (!el) return;
    if (reduce || !useGsap) return; // CSS leaves unwrapped text fully lit

    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) return;
        if (/^\s+$/.test(chunk)) {
          frag.appendChild(document.createTextNode(chunk));
          return;
        }
        var span = document.createElement("span");
        span.className = "w";
        span.textContent = chunk;
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });

    var words = el.querySelectorAll(".w");
    ST.create({
      trigger: el,
      start: "top 78%",
      end: "bottom 55%",
      scrub: true,
      onUpdate: function (self) {
        var lit = Math.round(self.progress * words.length);
        for (var i = 0; i < words.length; i++) {
          words[i].classList.toggle("is-lit", i < lit);
        }
      },
      // A scrub that is scrolled past quickly can be left mid-way. Snap to the
      // finished state on either side so the sentence is never half-grey when
      // it is sitting still on screen.
      onLeave: function () {
        for (var i = 0; i < words.length; i++) words[i].classList.add("is-lit");
      },
      onLeaveBack: function () {
        for (var j = 0; j < words.length; j++) words[j].classList.remove("is-lit");
      },
    });
  }

  /* --- 04 the path: pinned horizontal travel --------------------------------
     The chapter pins and the three panels travel sideways under it. This is
     the one effect that genuinely needs GSAP, and the one with a real cost if
     it goes wrong, so it is the most heavily guarded thing in the file:

       - `useGsap` false: the track keeps its own overflow-x and snap points
         and is an ordinary rail. Nothing below runs.
       - the track is not wider than the viewport (a short rail, a very wide
         monitor): no pin, because pinning to travel zero distance is a scroll
         that does nothing.
       - `is-pinned` is what switches the CSS off the rail behaviour, and it is
         only added once the pin is actually created.
       - resize re-measures through ScrollTrigger's own invalidateOnRefresh
         rather than a resize listener of ours. */
  function path() {
    var viewport = page.querySelector(".path_viewport");
    var track = page.querySelector(".path_track");
    if (!viewport || !track) return;
    if (!useGsap) return;
    if (window.matchMedia("(max-width: 767px)").matches) return; // a rail is right on a phone

    var distance = function () {
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    };
    if (distance() <= 8) return;

    viewport.classList.add("is-pinned");
    var fill = page.querySelector(".path_rule-fill");

    var tween = gsap.to(track, {
      x: function () {
        return -distance();
      },
      ease: "none",
      scrollTrigger: {
        trigger: viewport,
        // Pin the VIEWPORT, not the whole chapter. Pinning the chapter meant
        // the heading and the panels had to share one screen, so the panel size
        // was being decided by what would fit inside a pin rather than by the
        // composition. The heading now scrolls away normally and the rail takes
        // the screen, which is also what makes the sideways move read as a
        // change of direction rather than as a section that got stuck.
        pin: viewport,
        start: "center center",
        // 1.5x the horizontal distance, so the travel is unhurried rather than
        // a flick. A 1:1 mapping made three large panels rush past in the
        // length of one thumb swipe.
        end: function () {
          return "+=" + Math.round(distance() * 1.5);
        },
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: function (self) {
          if (fill) fill.style.transform = "scaleX(" + self.progress + ")";
        },
      },
    });

    // Each panel lifts as it arrives. containerAnimation is what lets a
    // ScrollTrigger fire off horizontal position inside a scrubbed tween.
    gsap.utils.toArray(".path_panel").forEach(function (panel) {
      gsap.from(panel, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left 82%" },
      });
    });
  }

  /* --- 02 the four ways: differential drift ---------------------------------
     The four frames move at slightly different rates inside their own masks,
     which is what stops a staggered row reading as four pasted rectangles.
     Small on purpose: 6% of the frame, not a parallax showpiece. */
  function ways() {
    if (!useGsap) return;
    gsap.utils.toArray(".ways_media img").forEach(function (img, i) {
      gsap.fromTo(
        img,
        { yPercent: -3 - i * 0.6 },
        {
          yPercent: 3 + i * 0.6,
          ease: "none",
          scrollTrigger: { trigger: img.closest(".ways_card"), start: "top bottom", end: "bottom top", scrub: 0.5 },
        }
      );
    });
  }

  /* --- 05 the standard ------------------------------------------------------
     There is no JS here on purpose. `.stone-band` carries
     `background-attachment: fixed`, which already parallaxes the marble: the
     background does not move with the layer. A scrubbed `backgroundPositionY`
     used to sit on top of that, repainting a full-viewport image every frame to
     produce a second copy of an effect the stylesheet was giving away for free.
     50-journey.css drops the fixed attachment below 991 and under reduced
     motion, which is the whole responsive story for this chapter. */

  function boot() {
    reveals();
    readout();
    counters();
    if (useGsap) {
      splitLines();
      arrival();
      thesis();
      ways();
      path();
      // Webfonts change line heights, which changes every pinned distance and
      // every trigger position. Refresh once they have landed.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          ST.refresh();
        });
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();


/* ===== js/11-dossier.js ===== */
/* ===========================================================================
   THE DOSSIER RUNTIME — the service page's interactions. 2026-09-01.

   NO GSAP. `motion: false` in build-site.mjs's page table, so this page never
   requests the 122KB vendor bundle at all. The home page's chapters genuinely
   need ScrollTrigger — a pinned viewport travelling sideways is not something
   to hand-roll — and nothing here does. A reference page should also be the
   lighter of the two, which is a design decision as much as a performance one.

   Four things, all guarded on `.dossier_page` so the home page runs none of it:

     1. reveals()  the hero's four lines, on an IntersectionObserver.
     2. layers()   the tab switcher and its depth indicator.
     3. check()    the self-assessment tally.
     4. spine()    the timeline draw and the rail's scroll-spy, on one shared
                   scroll handler.

   THE SAME THREE RULES AS 10-journey.js, and they are not negotiable:

     1. NOTHING IS HIDDEN BY THIS FILE except panels it can also show again.
        Every other hidden state lives in 51-dossier.css scoped to `.js`, and
        the head partial strips `.js` after 2.5s if the bundle never boots. The
        tab panels are the one exception and they are handled explicitly:
        `hidden` is applied HERE, on boot, never in the markup, so a page that
        never runs this file shows all three panels stacked with rules between
        them. That is a complete section, not a broken control.
     2. REDUCED MOTION IS A BRANCH. No spine draw, no dot sequencing, no
        cross-fade. The timeline is simply drawn and every stop is lit, which is
        the correct still state; the tabs and the checkboxes still work, because
        they are controls rather than effects and turning them off would remove
        function rather than motion.
     3. GUARD ON THE POSITIVE. Every query is checked for what it found, never
        for what it did not, so a renamed class fails loudly here rather than
        reporting success while doing nothing.
   =========================================================================== */
(function () {
  "use strict";

  var page = document.querySelector(".dossier_page");
  if (!page) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 1. the hero reveal ---------------------------------------------------
     The only decorative motion on the page, and it is four lines on one
     screen. Everything below this is a control. */
  function reveals() {
    var items = page.querySelectorAll('[data-d="rise"]');
    if (!items.length) return;
    if (!("IntersectionObserver" in window) || reduce) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-in");
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );
    for (var n = 0; n < items.length; n++) io.observe(items[n]);
  }

  /* --- 2. the layer switcher ------------------------------------------------
     The ARIA tab pattern, done properly: `aria-selected` on the tabs,
     `aria-controls` pointing at the panels, roving tabindex so the tab strip is
     ONE stop in the tab order and the arrow keys move between the three, which
     is what a screen-reader user expects from `role="tablist"` and what a
     three-stop tab strip that steals three tab presses does not give them. */
  function layers() {
    var strip = page.querySelector(".layers_tabs");
    var tabs = page.querySelectorAll(".layers_tab");
    var panels = page.querySelectorAll(".layers_panel");
    var bars = page.querySelectorAll(".layers_bar");
    if (!strip || tabs.length !== 3 || panels.length !== 3) return;

    // The depth indicator fills from the surface DOWN TO the active layer, so
    // "muscle" lights all three and "skin" lights one. That is the point being
    // made: the deep work is under the other two, and an operation that reaches
    // the muscle has been through them.
    var order = ["skin", "fat", "muscle"];

    function select(idx, focus) {
      for (var i = 0; i < tabs.length; i++) {
        var on = i === idx;
        tabs[i].setAttribute("aria-selected", on ? "true" : "false");
        tabs[i].tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      }
      var active = tabs[idx].id.replace("tab-", "");
      var depth = order.indexOf(active);
      for (var b = 0; b < bars.length; b++) {
        var layer = bars[b].getAttribute("data-layer");
        // `is-on` = passed through, `is-active` = the one being described. Two
        // classes because one green fill on three bars says nothing.
        bars[b].classList.toggle("is-on", order.indexOf(layer) <= depth);
        bars[b].classList.toggle("is-active", layer === active);
      }
      if (focus) tabs[idx].focus();
    }

    for (var t = 0; t < tabs.length; t++) {
      (function (i) {
        tabs[i].addEventListener("click", function () {
          select(i, false);
        });
      })(t);
    }
    strip.addEventListener("keydown", function (e) {
      var cur = -1;
      for (var i = 0; i < tabs.length; i++) if (tabs[i].getAttribute("aria-selected") === "true") cur = i;
      if (cur < 0) return;
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (cur + 1) % tabs.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (cur - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      select(next, true);
    });

    select(0, false);
  }

  /* --- 3. the self-check ----------------------------------------------------
     A tally and a sentence. NOT A SCORE, NOT A DIAGNOSIS, NOT A LEAD FORM:
     nothing is stored, nothing is sent, and every reading ends by handing the
     question back to a consultation, including four out of four. A page that
     tells a stranger they need surgery would be the worst thing on this site,
     and the copy below is the guard against this component drifting into it. */
  function check() {
    var form = page.querySelector(".check_component");
    if (!form) return;
    var inputs = form.querySelectorAll(".check_input");
    var count = form.querySelector(".check_out-count");
    var text = form.querySelector(".check_out-text");
    if (!inputs.length || !count || !text) return;

    var READINGS = [
      "Tick whichever apply. Nothing here is stored or sent.",
      "One sign on its own settles nothing. It is worth an hour with Dr. Stone to find out which of the three neck procedures, if any, fits what she measures.",
      "Two of the four is the usual reason people book. Bring them to a consultation; the answer may still be the smaller operation.",
      "Three of the four is the pattern this operation is for, though the retraction test is what actually decides it and that has to be done in person.",
      "All four is the picture this page describes. It is still Dr. Stone's examination that says whether it is a neck lift, a face and neck lift, or something less.",
    ];

    function update() {
      var n = 0;
      for (var i = 0; i < inputs.length; i++) if (inputs[i].checked) n++;
      count.textContent = n + " of " + inputs.length;
      text.textContent = READINGS[Math.min(n, READINGS.length - 1)];
    }
    for (var i = 0; i < inputs.length; i++) inputs[i].addEventListener("change", update);
    // The browser restores checkbox state on a back-navigation, so read the
    // real state on boot rather than assuming zero.
    update();
  }

  /* --- 4. the spine and the scroll-spy --------------------------------------
     One scroll handler for both, rAF-throttled. Two listeners doing their own
     getBoundingClientRect on every scroll event is how a page that measures
     fine in isolation drops frames in the wild.

     The spine's progress is measured against the point where the LAST stop is
     reached rather than the end of the list, or the line finishes drawing after
     the reader has already passed the thing it is drawing towards. */
  function spine() {
    var list = page.querySelector(".tl_component");
    var stops = page.querySelectorAll(".tl_stop");
    var links = page.querySelectorAll(".toc_link");
    var sections = [];
    for (var i = 0; i < links.length; i++) {
      var id = links[i].getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (el) sections.push({ link: links[i], el: el });
    }
    if (!list && !sections.length) return;

    var ticking = false;

    function measure() {
      ticking = false;
      var vh = window.innerHeight;

      if (list && stops.length && !reduce) {
        var last = stops[stops.length - 1];
        var start = list.getBoundingClientRect().top;
        var end = last.getBoundingClientRect().top;
        var span = end - start;
        var travelled = vh * 0.62 - start;
        var p = span > 0 ? travelled / span : 1;
        list.style.setProperty("--p", String(Math.max(0, Math.min(1, p))));
        for (var s = 0; s < stops.length; s++) {
          var r = stops[s].getBoundingClientRect();
          stops[s].classList.toggle("is-lit", r.top < vh * 0.66);
        }
      }

      if (sections.length) {
        // The current section is the LAST one whose top has passed the reading
        // line. Picking "the one intersecting the middle" fails on a section
        // taller than the viewport, and several here are.
        var cur = -1;
        for (var k = 0; k < sections.length; k++) {
          if (sections[k].el.getBoundingClientRect().top <= vh * 0.34) cur = k;
        }
        for (var m = 0; m < sections.length; m++) {
          sections[m].link.classList.toggle("is-here", m === cur);
        }
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(measure);
    }

    // Reduced motion still gets the scroll-spy: it is wayfinding, not decoration.
    if (reduce && list) {
      list.style.setProperty("--p", "1");
      for (var s2 = 0; s2 < stops.length; s2++) stops[s2].classList.add("is-lit");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    measure();
  }

  /* --- 5. the matrix, on a narrow screen ------------------------------------
     The table's minimum is 44rem and a phone is 24rem, so it scrolls sideways
     inside its own box. Left at rest it opens on the FIRST column, which is
     MyEllevate: the reader is on the neck lift page and the first thing the
     comparison shows them is a different operation.

     So it opens scrolled to the column they are on, with the sticky row labels
     still in view beside it. `scroll-behavior: smooth` is on the container in
     CSS, so this is turned off for the one programmatic jump and put back:
     animating a scroll the reader did not ask for, on load, is exactly the kind
     of motion `prefers-reduced-motion` exists to stop. */
  function matrix() {
    var box = page.querySelector(".matrix_scroll");
    if (!box) return;
    var current = box.querySelector("thead .is-current");
    var label = box.querySelector("tbody th");
    if (!current || !label) return;
    if (box.scrollWidth <= box.clientWidth + 8) return; // it fits; nothing to do

    var prev = box.style.scrollBehavior;
    box.style.scrollBehavior = "auto";
    box.scrollLeft = Math.max(0, current.offsetLeft - label.offsetWidth);
    box.style.scrollBehavior = prev;
  }

  function boot() {
    reveals();
    layers();
    check();
    spine();
    matrix();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
