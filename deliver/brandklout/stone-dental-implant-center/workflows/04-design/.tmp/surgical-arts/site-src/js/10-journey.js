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
