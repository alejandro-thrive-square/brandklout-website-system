/* ===========================================================================
   THE MOTION LAYER — Mason Park Dental
   Ships as a site-wide code asset alongside site.js and runs only on a page
   that carries `section[data-chapter]`, so every other page pays nothing but
   one 404-free script tag.

   THE RULE THIS FILE EXISTS TO OBEY (DESIGN-STANDARD.md):
   scroll must DO WORK, not trigger work. An IntersectionObserver can only say
   "this is now visible"; it cannot express HOW FAR THROUGH something you are,
   which is what a scrubbed statement, a pinned track and a progress bar all
   depend on. The previous Mason Park build was made entirely of observers and
   contained no GSAP at all, and that single choice is most of why it read as a
   stack of cards. Three chapters here are scrubbed:

     Chapter 01  the statement is written word by word as you scroll
     Chapter 05  the path travels sideways under a pin, driven by progress
     Chapter 06  the pull quote is written the same way, and the rail drifts

   Everything degrades. With GSAP missing or reduced motion on, `jr-fail`
   reveals every hidden element and the page reads as ordinary static markup.
   ======================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var chapters = document.querySelectorAll("section[data-chapter]");
  if (!chapters.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ok = !!(window.gsap && window.ScrollTrigger);

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  root.classList.add("jr-ready");
  if (!ok || reduced) root.classList.add("jr-fail");

  /* -------------------------------------------------------------------------
     THE CHROME. Deliberately FIRST, and deliberately free of GSAP.
     The header floating over the arrival chapter is a LAYOUT decision, not a
     motion one, so it has to survive both reduced motion and GSAP failing to
     load. Everything below this block may not run; this always does.

     The header height is measured rather than assumed, because it changes with
     the logo's intrinsic size and with the breakpoint, and the hero is pulled
     up by exactly that amount.
     --------------------------------------------------------------------- */
  (function chrome() {
    var nav = $(".navbar_component");
    var hero = $(".ch-arrival");
    if (!nav || !hero || !document.body.classList.contains("has-journey")) return;

    var navH = 0;
    function measure() {
      navH = nav.offsetHeight;
      root.style.setProperty("--jr-nav-h", navH + "px");
    }
    function solidity() {
      /* Solid from the point the hero's bottom edge reaches the header, so the
         bar never turns white while there is still photograph behind it. */
      var edge = hero.getBoundingClientRect().bottom;
      nav.classList.toggle("is-solid", edge <= navH + 1);
    }
    measure();
    solidity();
    window.addEventListener("scroll", solidity, { passive: true });
    window.addEventListener("resize", function () {
      clearTimeout(chrome._t);
      chrome._t = setTimeout(function () {
        measure(); solidity();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, 200);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); solidity(); });
  })();

  if (!ok) return;

  /* Registered here rather than in <head>: ScrollTrigger initialised before
     document.body exists leaves its internals half built. */
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  var EASE = "power3.out";

  function splitWords(el) {
    if (!el || !window.SplitText) return null;
    try {
      return SplitText.create
        ? SplitText.create(el, { type: "words", wordsClass: "jr-word" })
        : new SplitText(el, { type: "words", wordsClass: "jr-word" });
    } catch (e) { return null; }
  }
  function splitLines(el) {
    if (!el || !window.SplitText) return null;
    try {
      var o = { type: "lines", mask: "lines", linesClass: "jr-line" };
      return SplitText.create ? SplitText.create(el, o) : new SplitText(el, o);
    } catch (e) { return null; }
  }

  /* -------------------------------------------------------------------------
     REVEALS, shared by every chapter.
     A chapter ARRIVES (tag rule draws out, headline lines rise through a mask,
     the lede and actions follow) and DEPARTS (the whole block recedes on a
     scrub bound to its own exit), so leaving a chapter feels like leaving a
     room rather than scrolling past a div.
     --------------------------------------------------------------------- */
  if (!reduced) {
    $$(".chapter-tag").forEach(function (tag) {
      var rule = $("i", tag);
      var tl = gsap.timeline({ scrollTrigger: { trigger: tag, start: "top 88%" } });
      if (rule) tl.from(rule, { scaleX: 0, duration: .7, ease: EASE }, 0);
      tl.from(tag.querySelectorAll("b"), { opacity: 0, x: -14, duration: .7, stagger: .08, ease: EASE }, .12);
    });

    $$("[data-split]").forEach(function (el) {
      var sp = splitLines(el);
      var targets = sp && sp.lines && sp.lines.length ? sp.lines : [el];
      gsap.from(targets, {
        yPercent: 108, opacity: 0, duration: 1.05, stagger: .09, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });

    /* Photographs drift against the scroll. Scale never lands exactly on 1:
       a scrubbed transform that resolves to the identity matrix flickers at
       the edges as the compositor drops and re-takes the layer. */
    $$("[data-drift] img").forEach(function (img) {
      gsap.fromTo(img,
        { yPercent: -4, scale: 1.09 },
        {
          yPercent: 4, scale: 1.03, ease: "none",
          scrollTrigger: { trigger: img.closest("[data-drift]"), start: "top bottom", end: "bottom top", scrub: .8 }
        });
    });
  }

  /* -------------------------------------------------------------------------
     CHAPTER DEPARTURES.
     DESIGN-STANDARD.md asks that a chapter both arrive AND depart, so that
     leaving one feels like leaving a room rather than scrolling past a div.
     Only Arrival had an exit; these are the other seven.

     WHAT DEPARTS IS THE HEAD, NOT THE CHAPTER. The reference scrubs its whole
     scene out on `start:'top top', end:'bottom top'`, which is right for a
     chapter that is exactly one viewport tall. These are not: The Range runs
     three screens. Fading a whole chapter from the moment its top touches the
     viewport top would dim the paragraph somebody is still reading, several
     hundred pixels lower down. So the tag and the headline recede as THEY pass
     the top edge, which is the part of the scene that is genuinely leaving,
     and the media keeps its own [data-drift] parallax underneath.

     Triggered on the head rather than the section for the same reason the pin
     needs it: in The Path the section is pinned at the viewport top for the
     whole scene, so a section-anchored exit would fade the heading on arrival
     and hold it faded. The head's own box only leaves when the pin releases.
     --------------------------------------------------------------------- */
  if (!reduced) {
    $$("section[data-chapter]").forEach(function (sec) {
      if (sec.classList.contains("ch-arrival")) return;   // has its own, above
      var head = [sec.querySelector(".chapter-tag"), sec.querySelector("h2")].filter(Boolean);
      if (!head.length) return;
      /* A STICKY HEAD DEPARTS BY ITSELF, and must not be faded on top of that.
         The treatment pages hold the chapter tag and heading in a sticky column
         beside the prose, so the head sits near the top edge for the WHOLE
         chapter. A departure keyed to the head passing "top 5%" then starts
         fading it while the reader is still in the first paragraph: measured at
         opacity < 1 with the chapter centred, on four chapters of every
         treatment page. The sticky column already reads as leaving when it
         finally scrolls out with its own section. */
      var holder = head[head.length - 1].parentElement;
      if (holder && getComputedStyle(holder).position === "sticky") return;
      gsap.to(head, {
        yPercent: -55, opacity: 0, ease: "none",
        scrollTrigger: {
          trigger: head[0],
          /* "top top", not "top 5%". A SHORT chapter centred in the window
             puts its heading about 25px from the top edge, which is inside 5%
             of a 900px viewport, so the departure had already begun while the
             whole chapter was still comfortably on screen and readable. The
             heading has to actually reach the top edge before it starts to go. */
          start: "top top",
          end: "top -35%",
          scrub: .6,
          invalidateOnRefresh: true
        }
      });
    });
  }

  /* -------------------------------------------------------------------------
     CHAPTER 00 — ARRIVAL
     --------------------------------------------------------------------- */
  (function arrival() {
    var sec = $(".ch-arrival");
    if (!sec || reduced) return;

    var tl = gsap.timeline({ delay: .15 });
    var title = $(".ar-title", sec);
    var sp = splitLines(title);
    if (sp && sp.lines) {
      gsap.set(title, { visibility: "visible" });
      tl.from(sp.lines, { yPercent: 112, duration: 1.15, stagger: .1, ease: "power4.out" }, 0);
    }
    tl.to($$(".ar-lede, .ar-actions, .ar-meta", sec), {
      visibility: "visible", opacity: 1, y: 0, duration: .95, stagger: .12, ease: EASE
    }, .45);
    gsap.set($$(".ar-lede, .ar-actions, .ar-meta", sec), { opacity: 0, y: 26 });

    /* The chapter departs: the photograph sinks and the copy lifts away, so
       the hero is visibly LEFT rather than simply scrolled off. */
    gsap.to($(".ar-in", sec), {
      yPercent: -14, opacity: .15, ease: "none",
      scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: .5 }
    });
  })();

  /* -------------------------------------------------------------------------
     CHAPTER 01 — THE RELAY   (scrub #1: the statement, written word by word)
     --------------------------------------------------------------------- */
  (function relay() {
    var sec = $(".ch-relay");
    if (!sec || reduced) return;
    var big = $("#relayBig", sec);
    var sp = splitWords(big);

    if (sp && sp.words && sp.words.length) {
      /* The closing clause is owned by the copper tween and excluded from the
         ink one. Two scrubbed tweens writing `color` on the same word over
         overlapping ranges overwrite each other every frame and flicker. One
         word, one owner. */
      var tail = sp.words.slice(-9);
      var body = sp.words.slice(0, -9);
      gsap.to(body, {
        color: "#2e3538", stagger: .4, ease: "none",
        scrollTrigger: { trigger: sec, start: "top 68%", end: "center 45%", scrub: .5 }
      });
      gsap.to(tail, {
        color: "#8c6349", stagger: .3, ease: "none",
        scrollTrigger: { trigger: sec, start: "center 55%", end: "bottom 68%", scrub: .5 }
      });
    } else {
      gsap.to(big, { color: "#2e3538", scrollTrigger: { trigger: sec, start: "top 70%" } });
    }

    gsap.from($$("#relayAfter p", sec), {
      opacity: 0, y: 26, duration: .9, stagger: .14, ease: EASE,
      scrollTrigger: { trigger: "#relayAfter", start: "top 85%" }
    });
    gsap.fromTo($(".re-img", sec), { yPercent: -8, scale: 1.14 }, {
      yPercent: 8, scale: 1.08, ease: "none",
      scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: .8 }
    });
  })();

  /* -------------------------------------------------------------------------
     CHAPTER 02 — UNDER ONE ROOF
     Counters, staggered comparison rows, and a marquee whose speed is the
     scroll velocity rather than a fixed animation.
     --------------------------------------------------------------------- */
  (function together() {
    var sec = $(".ch-together");
    if (!sec) return;

    if (!reduced) {
      /* The final value is in the HTML, and the tween counts UP to it. It used
         to be a literal "0" that the tween replaced, which meant a reduced
         motion visitor, and anyone whose JS failed, read "0 Doctors on staff".
         A number the page states must be true before any script runs. */
      $$(".tg-fig b", sec).forEach(function (b) {
        var to = parseFloat(b.getAttribute("data-count")) || 0;
        var suffix = b.getAttribute("data-suffix") || "";
        var o = { v: 0 };
        gsap.to(o, {
          v: to, duration: 1.8, ease: "power2.out",
          scrollTrigger: { trigger: "#tgFigures", start: "top 82%" },
          onUpdate: function () { b.textContent = Math.round(o.v) + suffix; }
        });
      });

      gsap.from($$(".tg-shot", sec), {
        opacity: 0, y: 40, duration: 1, stagger: .14, ease: EASE,
        scrollTrigger: { trigger: ".tg-pair", start: "top 80%" }
      });
      gsap.from($$(".vs-row", sec), {
        opacity: 0, y: 18, duration: .7, stagger: .07, ease: EASE,
        scrollTrigger: { trigger: ".vs-table", start: "top 84%" }
      });
    }

    /* Velocity reactive marquee. It drifts on its own and the scroll adds to
       it, so a fast flick visibly throws it. Duplicated once so the loop is
       seamless whatever the row measures. */
    var row = $("#mqRow", sec);
    if (row && !reduced) {
      row.innerHTML += row.innerHTML;
      var half = row.scrollWidth / 2;
      var x = 0, extra = 0;
      var last = window.pageYOffset;
      gsap.ticker.add(function () {
        var now = window.pageYOffset;
        extra += (now - last) * 0.55;
        last = now;
        extra *= 0.92;
        x -= 0.6 + extra * 0.06;
        if (half && x <= -half) x += half;
        if (x > 0) x -= half;
        gsap.set(row, { x: x });
      });
    }
  })();

  /* -------------------------------------------------------------------------
     CHAPTER 03 — THE RANGE
     --------------------------------------------------------------------- */
  (function range() {
    var sec = $(".ch-range");
    if (!sec || reduced) return;
    $$(".rg-arc", sec).forEach(function (arc) {
      gsap.from($(".rg-body", arc), {
        opacity: 0, y: 34, duration: 1, ease: EASE,
        scrollTrigger: { trigger: arc, start: "top 76%" }
      });
      gsap.from($$(".rg-item", arc), {
        opacity: 0, x: 18, duration: .6, stagger: .06, ease: EASE,
        scrollTrigger: { trigger: $(".rg-index", arc), start: "top 84%" }
      });
      gsap.from($(".rg-numeral", arc), {
        opacity: 0, yPercent: 30, duration: 1.1, ease: EASE,
        scrollTrigger: { trigger: arc, start: "top 78%" }
      });
    });
  })();

  /* -------------------------------------------------------------------------
     CHAPTER 04 — THE PEOPLE
     --------------------------------------------------------------------- */
  (function people() {
    var sec = $(".ch-people");
    if (!sec || reduced) return;
    $$(".pe-card", sec).forEach(function (card, i) {
      var tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 82%" } });
      tl.from($(".pe-plate", card), {
        clipPath: "inset(0% 0% 100% 0%)", duration: 1.05, ease: "power4.out", delay: i * .08
      }, 0);
      tl.from(card.querySelectorAll(".pe-note, h3, .pe-role, .pe-blurb"), {
        opacity: 0, y: 20, duration: .75, stagger: .07, ease: EASE
      }, .3);
    });
    gsap.from($(".pe-band-in", sec), {
      opacity: 0, y: 30, duration: .9, ease: EASE,
      scrollTrigger: { trigger: ".pe-band", start: "top 78%" }
    });
  })();

  /* -------------------------------------------------------------------------
     CHAPTER 05 — THE PATH   (scrub #2: pinned horizontal travel)
     --------------------------------------------------------------------- */
  (function path() {
    var sec = $(".ch-path");
    if (!sec) return;
    var pin = $("#pathPin", sec), track = $("#pathTrack", sec), bar = $("#pathBar", sec);
    if (!pin || !track) return;

    var TOUCH = window.matchMedia("(hover:none) and (pointer:coarse)").matches;
    if (reduced || TOUCH) {
      /* No pin. Below 900px the CSS turns the track into a snapping scroll
         region; above it the track is `width: max-content` and would run off
         the right edge with no way to reach the last card, so it has to wrap.
         Leaving this out is a horizontal overflow bug that only a reduced
         motion desktop visitor ever sees. */
      $$(".pa-card", sec).forEach(function (c) { c.classList.add("is-on"); });
      if (window.innerWidth >= 900) sec.classList.add("is-static");
      return;
    }

    function distance() { return Math.max(0, track.scrollWidth - window.innerWidth + 40); }

    var built = null;

    function buildStatic() {
      sec.classList.add("is-static");
      gsap.set(track, { x: 0 });
      $$(".pa-card", sec).forEach(function (card, i) {
        card.classList.add("is-on");
        gsap.from(card, {
          opacity: 0, y: 30, duration: .9, ease: EASE, delay: i * .07,
          scrollTrigger: { trigger: pin, start: "top 74%" }
        });
      });
    }

    function buildPinned() {
      sec.classList.remove("is-static");
      var tween = gsap.to(track, {
        x: function () { return -distance(); },
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: function () { return "+=" + (distance() + window.innerHeight * 0.55); },
          pin: true,
          scrub: .3,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          /* MEASURED FIRST, because pinning inserts a spacer and everything
             below Chapter 05 moves down by the length of the pin. A trigger
             that refreshes before this one measures a document that does not
             yet contain the spacer, and lands its start and end several hundred
             pixels too high. That is what put The Proof's heading at 0.05
             opacity while it was still half a screen from the top edge: its
             departure had already run. Higher priority refreshes earlier. */
          refreshPriority: 1,
          onUpdate: function (self) { if (bar) gsap.set(bar, { scaleX: self.progress }); }
        }
      });
      $$(".pa-card", sec).forEach(function (card) {
        ScrollTrigger.create({
          trigger: card,
          containerAnimation: tween,
          start: "left 78%",
          end: "right 24%",
          onEnter: function () { card.classList.add("is-on"); },
          onEnterBack: function () { card.classList.add("is-on"); },
          onLeaveBack: function () { card.classList.remove("is-on"); }
        });
      });
    }

    /* Below 900 the STYLESHEET has already turned the track into a snapping,
       horizontally scrollable region, so there is nothing here for GSAP to do
       but stay out of the way. */
    function buildFlow() {
      sec.classList.remove("is-static");
      gsap.set(track, { clearProps: "transform" });
      $$(".pa-card", sec).forEach(function (card) { card.classList.add("is-on"); });
    }

    function decide() {
      /* THE WIDTH TEST IS NOT OPTIONAL, and leaving it out cost the homepage
         3,000px of dead scroll at every width from 768 to 899.
         `TOUCH` above catches phones and tablets, but a NON-touch window in
         that range - a laptop browser resized, a small desktop - fell through
         to this line, and `track.scrollWidth > innerWidth` is trivially true
         there, so it pinned. Meanwhile the max-width:899 block in site.css had
         already set `overflow-x:auto` on the track and cancelled `min-height`
         on the pin. The result: the pin spacer held the reader still for three
         thousand pixels while the tween translated a track that its own
         container was clipping. The section measured 4,064px around a 1,051px
         scene, and nothing moved for most of it.
         The CSS decides the layout below 900; the runtime has to agree. */
      var wants = window.innerWidth < 900 ? "flow"
        : (track.scrollWidth > window.innerWidth + 40 ? "pinned" : "static");
      if (wants === built) return;
      built = wants;
      ScrollTrigger.getAll().forEach(function (st) {
        if (st.trigger === pin || (st.trigger && st.trigger.classList && st.trigger.classList.contains("pa-card"))) st.kill();
      });
      if (wants === "pinned") buildPinned();
      else if (wants === "static") buildStatic();
      else buildFlow();
    }
    decide();
    ScrollTrigger.addEventListener("refreshInit", function () { gsap.set(track, { x: 0 }); });
    window.addEventListener("resize", function () { clearTimeout(path._t); path._t = setTimeout(decide, 200); });
  })();

  /* -------------------------------------------------------------------------
     CHAPTER 06 — THE PROOF   (scrub #3: the quote, and a drifting rail)
     --------------------------------------------------------------------- */
  (function proof() {
    var sec = $(".ch-proof");
    if (!sec || reduced) return;
    var q = $("#proofQuote", sec);
    var sp = splitWords(q);
    if (sp && sp.words && sp.words.length) {
      gsap.to(sp.words, {
        color: "#2e3538", stagger: .35, ease: "none",
        scrollTrigger: { trigger: ".pr-lead", start: "top 78%", end: "bottom 55%", scrub: .5 }
      });
    } else if (q) {
      gsap.to(q, { color: "#2e3538", scrollTrigger: { trigger: ".pr-lead", start: "top 78%" } });
    }
    gsap.from($(".pr-mark", sec), {
      opacity: 0, scale: .7, duration: 1, ease: EASE,
      scrollTrigger: { trigger: ".pr-lead", start: "top 84%" }
    });

    /* The rail travels sideways with the page, so the reviews are read by
       scrolling rather than by dragging something nobody notices is draggable. */
    var rail = $(".pr-rail-in", sec);
    if (rail) {
      var over = function () { return Math.max(0, rail.scrollWidth - window.innerWidth + 40); };
      gsap.fromTo(rail, { x: 0 }, {
        x: function () { return -over(); },
        ease: "none",
        scrollTrigger: {
          trigger: ".pr-rail", start: "top bottom", end: "bottom top",
          scrub: .6, invalidateOnRefresh: true
        }
      });
    }
  })();

  /* -------------------------------------------------------------------------
     CHAPTER 07 — THE INVITATION
     --------------------------------------------------------------------- */
  (function invitation() {
    var sec = $(".ch-invitation");
    if (!sec || reduced) return;
    gsap.from($$(".iv-actions, .iv-facts > div", sec), {
      opacity: 0, y: 24, duration: .85, stagger: .09, ease: EASE,
      scrollTrigger: { trigger: ".iv-copy", start: "top 76%" }
    });
    gsap.from($(".iv-map", sec), {
      opacity: 0, y: 34, duration: 1, ease: EASE,
      scrollTrigger: { trigger: ".iv-map", start: "top 84%" }
    });
  })();

  /* -------------------------------------------------------------------------
     CONTINUITY — reading progress and the chapter readout.
     The divisor is the LAST chapter index rather than a constant, so inserting
     a chapter cannot drive the bar past 100%.
     --------------------------------------------------------------------- */
  (function continuity() {
    var bar = document.createElement("div");
    bar.className = "jr-progress";
    document.body.appendChild(bar);

    var readout = document.createElement("p");
    readout.className = "jr-readout";
    readout.innerHTML = '<span id="jrName">Arrival</span>';
    document.body.appendChild(readout);

    gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .25 } });

    var name = $("#jrName");
    Array.prototype.forEach.call(chapters, function (sec) {
      var i = parseInt(sec.getAttribute("data-chapter"), 10) || 0;
      var nm = sec.getAttribute("data-chapter-name") || "";
      function on() {
        if (name) name.textContent = nm;
        readout.classList.toggle("is-on", i > 0);
      }
      ScrollTrigger.create({ trigger: sec, start: "top 55%", end: "bottom 45%", onEnter: on, onEnterBack: on });
    });
  })();

  /* Fonts change line breaks, and every split above measured against the
     fallback. Re-measure once the real faces are in. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();


/* ===========================================================================
   THE GENERIC HOOKS — added 2026-09-01 with the nine core pages.

   The block above binds every scene to a homepage chapter class and an id:
   `#relayBig` inside `.ch-relay`, `#mqRow` inside `.ch-together`, and so on.
   That was right for one page. Nine more pages each wanted one of those
   mechanisms in a different chapter, and copying the scene per chapter is
   how a runtime grows a page-specific branch for every page it serves.

   So these bind by ATTRIBUTE. A page authors `data-write` on a paragraph and
   gets the relay's word-by-word scrub; `data-count` on a number and gets the
   counter; `data-rail` on a row and gets the proof rail's sideways travel;
   `data-marquee`, `data-wipe` and `data-stagger` likewise. The homepage and
   the Invisalign page carry none of these attributes, so nothing here can
   touch them: that is the constraint, and it is checked by rendering both.

   Same three rules as everything above. The final state is in the HTML
   (a counter's value, a statement's words), reduced motion runs none of it,
   and a missing GSAP leaves the page as plain markup.
   ======================================================================== */
(function () {
  "use strict";
  if (!document.querySelector("section[data-chapter]")) return;
  if (!(window.gsap && window.ScrollTrigger)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  var EASE = "power3.out";
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function dark(el) { var s = el.closest("[data-theme]"); return !!(s && s.getAttribute("data-theme") === "dark"); }

  /* --- data-write: the statement, written word by word --------------------
     The relay writes its body to ink and its last clause to the brand; here
     the whole element writes to its theme's foreground unless `data-write-to`
     says otherwise. The unwritten colour is set by the stylesheet, which is
     what keeps the text readable when this never runs. */
  $$("[data-write]").forEach(function (el) {
    var to = el.getAttribute("data-write-to") || (dark(el) ? "#ffffff" : "#2e3538");
    var sp = null;
    if (window.SplitText) {
      try {
        sp = SplitText.create
          ? SplitText.create(el, { type: "words", wordsClass: "jr-word" })
          : new SplitText(el, { type: "words", wordsClass: "jr-word" });
      } catch (e) { sp = null; }
    }
    if (sp && sp.words && sp.words.length) {
      gsap.to(sp.words, {
        color: to, stagger: .35, ease: "none",
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: .5 }
      });
    } else {
      gsap.to(el, { color: to, scrollTrigger: { trigger: el, start: "top 75%" } });
    }
  });

  /* --- data-count: a number that counts up to the value it already shows.
     `data-count` is the target, `data-decimals` the precision, `data-prefix`
     and `data-suffix` the furniture. Skipped inside `.ch-together`, where
     the homepage's own counter already owns the element. --------------- */
  $$("[data-count]").forEach(function (b) {
    if (b.closest(".ch-together")) return;
    var to = parseFloat(b.getAttribute("data-count")) || 0;
    var dec = parseInt(b.getAttribute("data-decimals") || "0", 10);
    var pre = b.getAttribute("data-prefix") || "", suf = b.getAttribute("data-suffix") || "";
    var group = b.closest("[data-counters]") || b;
    var o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 1.8, ease: "power2.out",
      scrollTrigger: { trigger: group, start: "top 82%" },
      onUpdate: function () {
        var v = dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString("en-US");
        b.textContent = pre + v + suf;
      }
    });
  });

  /* --- data-rail: a row that travels sideways as the page scrolls -------
     The proof rail, generalised. Only above 900, where the stylesheet has not
     already turned the row into a native snapping scroller. ------------- */
  $$("[data-rail]").forEach(function (row) {
    var over = function () {
      if (window.innerWidth < 900) return 0;
      var host = row.parentElement;
      return Math.max(0, row.scrollWidth - host.clientWidth + 24);
    };
    gsap.fromTo(row, { x: 0 }, {
      x: function () { return -over(); },
      ease: "none",
      scrollTrigger: { trigger: row.parentElement, start: "top 85%", end: "bottom 15%", scrub: .6, invalidateOnRefresh: true }
    });
  });

  /* --- data-marquee: velocity reactive drift, the homepage's mechanism --- */
  $$("[data-marquee]").forEach(function (row) {
    row.innerHTML += row.innerHTML;
    var half = row.scrollWidth / 2;
    var x = 0, extra = 0, last = window.pageYOffset;
    gsap.ticker.add(function () {
      var now = window.pageYOffset;
      extra += (now - last) * 0.55;
      last = now;
      extra *= 0.92;
      x -= 0.5 + extra * 0.06;
      if (half && x <= -half) x += half;
      if (x > 0) x -= half;
      gsap.set(row, { x: x });
    });
  });

  /* --- data-wipe: a frame revealed from the top edge down, as the doctor
     plates are on the homepage --------------------------------------- */
  $$("[data-wipe]").forEach(function (el, i) {
    gsap.from(el, {
      clipPath: "inset(0% 0% 100% 0%)", duration: 1.05, ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 84%" }
    });
  });

  /* --- data-stagger: the children of a grid arrive one after another ---- */
  $$("[data-stagger]").forEach(function (group) {
    var kids = Array.prototype.slice.call(group.children);
    if (!kids.length) return;
    gsap.from(kids, {
      opacity: 0, y: 26, duration: .85, stagger: .08, ease: EASE,
      scrollTrigger: { trigger: group, start: "top 82%" }
    });
  });
})();
