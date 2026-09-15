/* ===========================================================================
   THE MOTION LAYER — Mason Park Dental for Kids
   Ships as a site-wide code asset alongside site.js and runs only on a page
   that carries `section[data-chapter]`, so every other page pays nothing but
   one script tag.

   THE RULE THIS FILE EXISTS TO OBEY (DESIGN-STANDARD.md): scroll must DO
   WORK, not trigger work. An IntersectionObserver can only say "this is now
   visible"; it cannot express HOW FAR THROUGH something you are, which is
   what a written statement, a pinned track, a growth chart and a progress
   bar all depend on.

   PORTED FROM THE PARENT PRACTICE'S journey.js (bk-mason-park, workflow 09)
   with the homepage-specific blocks removed. Every scene here binds by
   ATTRIBUTE or by a system chapter class, never by a page's own id:

     data-write     a statement written word by word as you scroll
     data-count     a number that counts up to the value it already shows
     data-rail      a row that travels sideways as the page scrolls
     data-marquee   a velocity-reactive drift
     data-wipe      a frame revealed from the top edge down
     data-stagger   the children of a grid arrive one after another
     data-split     a headline that rises through a mask, line by line
     data-drift     a photograph that parallaxes against the scroll
     data-grow      the growth chart: a ruler that fills and an age that
                    changes as each stage passes the middle of the window
     .ch-path       the pinned horizontal path, with #pathPin/#pathTrack/#pathBar

   Everything degrades. With GSAP missing or reduced motion on, `jr-fail`
   reveals every hidden element and the page reads as ordinary static markup.
   The final state of every scene is in the HTML before any script runs.
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
     THE CHROME. Deliberately FIRST, and deliberately free of GSAP. The header
     floating over the arrival chapter is a LAYOUT decision, so it has to
     survive both reduced motion and GSAP failing to load. The header height
     is measured rather than assumed.
     --------------------------------------------------------------------- */
  (function chrome() {
    var nav = $(".masthead_component");
    var hero = $(".ch-arrival");
    if (!nav || !hero || !document.body.classList.contains("has-journey")) return;

    var navH = 0;
    function measure() {
      navH = nav.offsetHeight;
      root.style.setProperty("--jr-nav-h", navH + "px");
    }
    function solidity() {
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
  var INK = "#2f3940";

  function dark(el) { var s = el.closest("[data-theme]"); return !!(s && s.getAttribute("data-theme") === "dark"); }

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

  /* How far a masked line starts below its mask, as a percentage of its own
     height. It was 112 on the arrival and 108 on the rest; both were exactly
     one line box plus a little, which is only enough while the mask clips at
     the line box. site.css now bleeds the mask 0.18em past both edges so
     Fraunces' caps and descenders survive it, and the line has to clear that
     bleed as well as its own cap overshoot to stay hidden at the start.
     The condition is (RISE - 100)% of the line-height >= bleed + cap
     overshoot; at the tightest heading on the site (the h1, line-height .98,
     cap overshoot .131em) 150 leaves 18px of margin and 133 would leave one. */
  var RISE = 150;

  /* -------------------------------------------------------------------------
     SPLIT ONLY ONCE THE DISPLAY FACE IS ACTUALLY THERE.

     A line split is a MEASUREMENT, and the wrapper divs it produces are
     permanent - re-measuring later cannot re-break the lines. So splitting
     while the browser is still painting the fallback bakes the FALLBACK's
     line breaks into the page for good.

     That is what was happening on the published site. On 2026-09-08 the same
     h1, at the same 835.4px, with the same variable Fraunces and identical
     metrics on both sides (measured: "The dentist your child" costs 801.4px
     in both), came out as two lines locally and THREE lines live.

     `document.fonts.ready` does not help, and worse, it lies: it resolves
     when nothing is PENDING, and at that moment the stylesheet declaring the
     faces has not been parsed yet, so nothing is pending. It resolved at 12ms
     locally and 1016ms live, both before the faces were requested.

     `document.fonts.load()` is the honest question - it names a face and
     resolves when THAT face can be used. The local pages also carry a
     <link rel="preload">, which the published pages cannot (their <head> is
     the platform's), so on Instatic this is the only thing standing between
     the design and the fallback's line breaks.

     The timeout is not a nicety: `.ar-title` is hidden until the arrival
     timeline runs, so a font that never arrives must not leave the hero
     headline invisible. 1200ms, then go regardless. --------------------- */
  function whenDisplayFace(cb) {
    var fonts = document.fonts;
    if (!fonts || !fonts.load) return cb();
    var stack = getComputedStyle(root).getPropertyValue("--font-display") || "";
    var family = (stack.split(",")[0] || "").trim().replace(/^["']|["']$/g, "");
    if (!family) return cb();
    var fired = false;
    function go() { if (!fired) { fired = true; cb(); } }
    try {
      Promise.all([
        fonts.load('500 99px "' + family + '"'),
        fonts.load('italic 500 99px "' + family + '"'),
      ]).then(go, go);
    } catch (e) { return go(); }
    setTimeout(go, 1200);
  }

  /* -------------------------------------------------------------------------
     REVEALS, shared by every chapter. A chapter ARRIVES (the tag's dot pops,
     the headline lines rise through a mask) and DEPARTS (its head recedes on
     a scrub bound to its own exit).
     --------------------------------------------------------------------- */
  if (!reduced) {
    $$(".chapter-tag").forEach(function (tag) {
      var dot = $("i", tag);
      var tl = gsap.timeline({ scrollTrigger: { trigger: tag, start: "top 88%" } });
      if (dot) tl.from(dot, { scale: 0, duration: .7, ease: "back.out(2.5)" }, 0);
      tl.from(tag.querySelectorAll("b"), { opacity: 0, x: -14, duration: .7, stagger: .08, ease: EASE }, .12);
    });

    /* Deferred until the display face can be used - see whenDisplayFace. */
    whenDisplayFace(function () {
      $$("[data-split]").forEach(function (el) {
        var sp = splitLines(el);
        var targets = sp && sp.lines && sp.lines.length ? sp.lines : [el];
        gsap.from(targets, {
          yPercent: RISE, opacity: 0, duration: 1.05, stagger: .09, ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 86%" }
        });
      });
      ScrollTrigger.refresh();
    });

    /* Photographs drift against the scroll. Scale never lands exactly on 1:
       a scrubbed transform that resolves to the identity matrix flickers. */
    $$("[data-drift] img").forEach(function (img) {
      gsap.fromTo(img,
        { yPercent: -4, scale: 1.09 },
        {
          yPercent: 4, scale: 1.03, ease: "none",
          scrollTrigger: { trigger: img.closest("[data-drift]"), start: "top bottom", end: "bottom top", scrub: .8 }
        });
    });

    /* Departures: the head, not the chapter, recedes as it passes the top
       edge. A sticky head departs by itself and is left alone. */
    $$("section[data-chapter]").forEach(function (sec) {
      if (sec.classList.contains("ch-arrival")) return;
      var head = [sec.querySelector(".chapter-tag"), sec.querySelector("h2")].filter(Boolean);
      if (!head.length) return;
      var holder = head[head.length - 1].parentElement;
      if (holder && getComputedStyle(holder).position === "sticky") return;
      gsap.to(head, {
        yPercent: -55, opacity: 0, ease: "none",
        scrollTrigger: { trigger: head[0], start: "top top", end: "top -35%", scrub: .6, invalidateOnRefresh: true }
      });
    });
  }

  /* -------------------------------------------------------------------------
     ARRIVAL
     --------------------------------------------------------------------- */
  (function arrival() {
    var sec = $(".ch-arrival");
    if (!sec || reduced) return;

    /* The headline is the one element on the site whose line breaks are a
       design decision, so it waits for the face it was designed in. */
    whenDisplayFace(function () {
    var tl = gsap.timeline({ delay: .15 });
    var title = $(".ar-title", sec);
    var sp = splitLines(title);
    if (sp && sp.lines) {
      gsap.set(title, { visibility: "visible" });
      tl.from(sp.lines, { yPercent: RISE, duration: 1.15, stagger: .1, ease: "power4.out" }, 0);
    } else if (title) {
      gsap.set(title, { visibility: "visible" });
    }
    var rest = $$(".ar-lede, .ar-offer, .ar-actions, .ar-meta > div", sec);
    gsap.set(rest, { opacity: 0, y: 26 });
    tl.to(rest, { visibility: "visible", opacity: 1, y: 0, duration: .95, stagger: .1, ease: EASE }, .45);
    });

    /* The chapter departs: the copy lifts away as the photograph sinks. */
    gsap.to($(".ar-in", sec), {
      yPercent: -14, opacity: .15, ease: "none",
      scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: .5 }
    });
  })();

  /* -------------------------------------------------------------------------
     THE PATH — pinned horizontal travel  (scrub: the track follows progress)
     --------------------------------------------------------------------- */
  (function path() {
    var sec = $(".ch-path");
    if (!sec) return;
    var pin = $("#pathPin", sec), track = $("#pathTrack", sec), bar = $("#pathBar", sec);
    if (!pin || !track) return;

    var TOUCH = window.matchMedia("(hover:none) and (pointer:coarse)").matches;
    if (reduced || TOUCH) {
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
          /* Measured first: pinning inserts a spacer and everything below moves
             down by the length of the pin. A trigger refreshed before this one
             measures a document that does not yet contain the spacer. */
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

    function buildFlow() {
      sec.classList.remove("is-static");
      gsap.set(track, { clearProps: "transform" });
      $$(".pa-card", sec).forEach(function (card) { card.classList.add("is-on"); });
    }

    function decide() {
      /* The CSS decides the layout below 900; the runtime has to agree, or the
         pin holds the reader still while a clipped track translates. */
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
     THE GROWTH CHART  (scrub: the ruler fills with the section's progress)
     `data-grow` on the section. Inside it: `.gr-ruler i` is the fill,
     `.gr-age` shows the age of the stage nearest the middle of the window,
     and each `.gr-stage` carries `data-age` and `data-age-note`. The ruler
     is scrubbed; the age and the active stage flip at the midline, which is
     what a reader scrolling back and forth expects of a chart.
     --------------------------------------------------------------------- */
  (function grow() {
    $$("[data-grow]").forEach(function (sec) {
      var fill = $(".gr-ruler i", sec);
      var age = $(".gr-age", sec);
      var stages = $$(".gr-stage", sec);
      if (!stages.length) return;
      var ageText = age ? $(".gr-age_value", age) : null;
      var ageNote = age ? $("small", age) : null;

      if (reduced) {
        stages.forEach(function (s) { s.classList.add("is-on"); });
        if (fill) fill.style.transform = "scaleX(1)";
        return;
      }

      var list = stages[0].parentElement;
      if (fill) {
        gsap.fromTo(fill, { scaleX: 0 }, {
          scaleX: 1, ease: "none",
          scrollTrigger: { trigger: list, start: "top 60%", end: "bottom 60%", scrub: .4, invalidateOnRefresh: true }
        });
      }
      function show(stage) {
        stages.forEach(function (s) { s.classList.toggle("is-on", s === stage); });
        if (ageText && stage.getAttribute("data-age")) ageText.textContent = stage.getAttribute("data-age");
        if (ageNote && stage.getAttribute("data-age-note")) ageNote.textContent = stage.getAttribute("data-age-note");
      }
      stages.forEach(function (stage, i) {
        ScrollTrigger.create({
          trigger: stage,
          start: "top 60%",
          end: "bottom 60%",
          onEnter: function () { show(stage); },
          onEnterBack: function () { show(stage); }
        });
      });
      /* Before the first stage reaches the midline the first one is shown, so
         the chart never opens with nothing selected. */
      show(stages[0]);
    });
  })();

  /* -------------------------------------------------------------------------
     THE GENERIC HOOKS
     --------------------------------------------------------------------- */
  if (!reduced) {
    /* data-write: the statement, written word by word. The unwritten colour
       is set by the stylesheet, which keeps the text readable when this never
       runs. `data-write-to` overrides the written colour.
       It finishes when the statement's MIDDLE reaches the middle of the window.
       Until 2026-09-15 it ran to "bottom 45%", so a long review was still half
       grey after the photograph beside it had gone (BugHerd #26). */
    $$("[data-write]").forEach(function (el) {
      var to = el.getAttribute("data-write-to") || (dark(el) ? "#ffffff" : INK);
      var sp = splitWords(el);
      if (sp && sp.words && sp.words.length) {
        gsap.to(sp.words, {
          color: to, stagger: .35, ease: "none",
          scrollTrigger: { trigger: el, start: "top 85%", end: "center 50%", scrub: .4 }
        });
      } else {
        gsap.to(el, { color: to, scrollTrigger: { trigger: el, start: "top 75%" } });
      }
    });

    /* data-count: counts UP to the value the HTML already states. */
    $$("[data-count]").forEach(function (b) {
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

    /* data-rail: a row that rotates on its own and STOPS while the pointer or
       keyboard focus is on it, so a review can be read where it stands. Until
       2026-09-15 it was scrubbed to the scroll, which carried reviews off the
       edge before anyone could finish them (BugHerd #27). The children are
       cloned once, aria-hidden and inert, so the loop has no seam; the loop
       length is measured between the first card and its clone, which is right
       whatever the padding and gaps are. It only runs while the row is on
       screen, and only above 900, where the stylesheet has not already made it
       a native scroller. */
    $$("[data-rail]").forEach(function (row) {
      if (window.innerWidth < 900) return;
      var host = row.parentElement;
      var kids = Array.prototype.slice.call(row.children);
      if (kids.length < 2) return;
      kids.forEach(function (kid) {
        var c = kid.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.setAttribute("inert", "");
        row.appendChild(c);
      });
      var twin = row.children[kids.length];
      var x = 0, paused = false, seen = false;
      var SPEED = 0.6; /* px per 60fps frame: about 36px a second */
      function pause() { paused = true; }
      function resume() { paused = false; }
      host.addEventListener("mouseenter", pause);
      host.addEventListener("mouseleave", resume);
      host.addEventListener("focusin", pause);
      host.addEventListener("focusout", resume);
      ScrollTrigger.create({ trigger: host, start: "top bottom", end: "bottom top", onToggle: function (st) { seen = st.isActive; } });
      gsap.ticker.add(function (time, dt) {
        if (window.innerWidth < 900) { if (x) { x = 0; gsap.set(row, { x: 0 }); } return; }
        if (paused || !seen) return;
        var loop = twin.offsetLeft - kids[0].offsetLeft;
        x -= SPEED * (dt / 16.67);
        if (loop > 0 && x <= -loop) x += loop;
        gsap.set(row, { x: x });
      });
    });

    /* data-marquee: velocity reactive drift. Duplicated once so the loop is
       seamless whatever the row measures. */
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

    /* data-wipe: a frame revealed from the top edge down. */
    $$("[data-wipe]").forEach(function (el) {
      gsap.from(el, {
        clipPath: "inset(0% 0% 100% 0%)", duration: 1.05, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 84%" }
      });
    });

    /* data-stagger: the children of a grid arrive one after another. */
    $$("[data-stagger]").forEach(function (group) {
      var kids = Array.prototype.slice.call(group.children);
      if (!kids.length) return;
      gsap.from(kids, {
        opacity: 0, y: 26, duration: .85, stagger: .08, ease: EASE,
        scrollTrigger: { trigger: group, start: "top 82%" }
      });
    });
  }

  /* -------------------------------------------------------------------------
     CONTINUITY — reading progress and the chapter readout.
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
