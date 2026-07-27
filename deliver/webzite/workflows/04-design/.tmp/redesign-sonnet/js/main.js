/* ==========================================================================
   Webzite Studio — Home redesign motion
   Every enhancement below is progressive: the DOM/CSS default is a fully
   visible, fully usable page. Nothing here EVER hides content that a failed
   CDN load or missing feature would leave stuck — hidden states are only
   ever applied by the script that also promises to reveal them.
   ========================================================================== */

(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointerFine = window.matchMedia("(pointer: fine)").matches;
  var isDesktop = window.matchMedia("(min-width: 981px)").matches;

  var hasGsap = typeof window.gsap !== "undefined";
  var hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== "undefined";

  if (hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ------------------------------------------------------------------
     Nav — compress on scroll, mobile drawer, scroll-spy
     ------------------------------------------------------------------ */
  (function nav() {
    var navEl = document.querySelector("[data-nav]");
    var toggle = document.querySelector("[data-nav-toggle]");
    var drawer = document.querySelector("[data-nav-drawer]");
    if (!navEl) return;

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        navEl.classList.toggle("is-stuck", window.scrollY > 4);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toggle && drawer) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        drawer.classList.toggle("is-open", !open);
        document.body.classList.toggle("is-locked", !open);
      });
      drawer.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          toggle.setAttribute("aria-expanded", "false");
          drawer.classList.remove("is-open");
          document.body.classList.remove("is-locked");
        });
      });
    }

    var spySections = ["thesis", "work", "capabilities", "engagement"]
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var spyLinks = document.querySelectorAll("[data-spy]");
    if (spySections.length && "IntersectionObserver" in window) {
      var spyObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var id = entry.target.id;
            spyLinks.forEach(function (link) {
              link.classList.toggle("is-active", link.dataset.spy === id);
            });
          });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
      );
      spySections.forEach(function (section) { spyObserver.observe(section); });
    }
  })();

  /* ------------------------------------------------------------------
     Scroll progress bar
     ------------------------------------------------------------------ */
  (function progress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar) return;
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, ratio)) + ")";
    }
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  })();

  /* ------------------------------------------------------------------
     Custom cursor — desktop pointer-fine only, purely decorative
     ------------------------------------------------------------------ */
  if (pointerFine && !reduceMotion) {
    (function cursor() {
      var el = document.querySelector("[data-cursor]");
      if (!el) return;
      var dot = el.querySelector(".cursor-dot");
      var ring = el.querySelector(".cursor-ring");
      var x = 0, y = 0, rx = 0, ry = 0;
      var active = false;

      window.addEventListener("mousemove", function (e) {
        x = e.clientX;
        y = e.clientY;
        if (!active) {
          active = true;
          rx = x;
          ry = y;
          document.body.classList.add("has-cursor");
        }
        dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      });

      function raf() {
        rx += (x - rx) * 0.18;
        ry += (y - ry) * 0.18;
        ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      var hoverables = "a, button, [data-service], .case-item";
      document.addEventListener("mouseover", function (e) {
        if (e.target.closest(hoverables)) el.classList.add("is-hover");
      });
      document.addEventListener("mouseout", function (e) {
        if (e.target.closest(hoverables)) el.classList.remove("is-hover");
      });
    })();
  }

  /* ------------------------------------------------------------------
     Marquee — CSS-driven scroll, JS only toggles play/pause
     ------------------------------------------------------------------ */
  (function marquee() {
    var wrap = document.querySelector("[data-marquee]");
    var toggle = document.querySelector("[data-marquee-toggle]");
    if (!wrap || !toggle) return;
    toggle.addEventListener("click", function () {
      var paused = wrap.classList.toggle("is-paused");
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "Play marquee" : "Pause marquee");
    });
  })();

  /* ------------------------------------------------------------------
     Hero theater — auto-rotating case reel, honest 3D-render stand-ins
     ------------------------------------------------------------------ */
  (function reel() {
    var reel = document.querySelector("[data-reel]");
    if (!reel) return;
    var imgs = reel.querySelectorAll("img");
    if (imgs.length < 2 || reduceMotion) return;
    var i = 0;
    var timer = null;

    function next() {
      imgs[i].classList.remove("is-active");
      i = (i + 1) % imgs.length;
      imgs[i].classList.add("is-active");
    }
    function start() {
      if (timer) return;
      timer = window.setInterval(next, 3400);
    }
    function stop() {
      window.clearInterval(timer);
      timer = null;
    }
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : start();
    });
    start();
  })();

  /* ------------------------------------------------------------------
     Services — hover/focus swaps the sticky media well
     ------------------------------------------------------------------ */
  (function services() {
    var rows = document.querySelectorAll("[data-service]");
    var wellImgs = document.querySelectorAll("[data-well]");
    if (!rows.length || !wellImgs.length) return;

    function activate(index) {
      rows.forEach(function (row) {
        row.classList.toggle("is-active", row.dataset.service === String(index));
      });
      wellImgs.forEach(function (img) {
        img.classList.toggle("is-active", img.dataset.well === String(index));
      });
    }
    rows.forEach(function (row) {
      row.addEventListener("mouseenter", function () { activate(row.dataset.service); });
      row.addEventListener("focus", function () { activate(row.dataset.service); });
    });
  })();

  /* ------------------------------------------------------------------
     Stat count-up — native rAF, IntersectionObserver-triggered, once
     ------------------------------------------------------------------ */
  (function stats() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nums.forEach(function (n) { n.textContent = n.dataset.count; });
      return;
    }

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function run(el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      var duration = 1300;
      var start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / duration);
        el.textContent = Math.round(target * easeOutExpo(t));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach(function (n) { observer.observe(n); });
  })();

  /* ------------------------------------------------------------------
     Pricing calculator — canonical $200/page design + $200/page dev,
     2 working days/page (sales/PRICING_TIMELINE_RULES.md)
     ------------------------------------------------------------------ */
  (function calc() {
    document.querySelectorAll("[data-pages]").forEach(function (row) {
      var pages = parseInt(row.dataset.pages, 10) || 0;
      var cost = row.querySelector("[data-cost]");
      var time = row.querySelector("[data-time]");
      if (cost) cost.textContent = "$" + (pages * 400).toLocaleString("en-US");
      if (time) time.textContent = pages * 2 + " days";
    });
  })();

  /* ------------------------------------------------------------------
     Word-fill statement — lights words as the reader scrolls past.
     Native, no GSAP dependency. Skipped entirely under reduced motion
     (plain, fully-lit text is the correct reduced-motion result).
     ------------------------------------------------------------------ */
  (function wordFill() {
    var el = document.querySelector("[data-wordfill]");
    if (!el || reduceMotion) return;

    function wrapWords(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          var frag = document.createDocumentFragment();
          var parts = child.textContent.split(/(\s+)/);
          parts.forEach(function (part) {
            if (part === "") return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              var span = document.createElement("span");
              span.className = "wf";
              span.textContent = part;
              frag.appendChild(span);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          wrapWords(child);
        }
      });
    }
    wrapWords(el);

    var words = el.querySelectorAll(".wf");
    if (!words.length) return;

    var ticking = false;
    function update() {
      ticking = false;
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var start = vh * 0.85;
      var end = vh * 0.35;
      var raw = (start - rect.top) / (start - end);
      raw = Math.min(1, Math.max(0, raw));
      var litCount = Math.round(raw * words.length);
      words.forEach(function (w, i) {
        w.classList.toggle("lit", i < litCount);
      });
    }
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    window.addEventListener("resize", update);
    update();
  })();

  /* ------------------------------------------------------------------
     Hero boot sequence — curtain-up fade/rise. GSAP-authored only; the
     DOM default (no inline styles) is fully visible, so a blocked CDN
     or reduced-motion simply skips this and the hero is already correct.
     ------------------------------------------------------------------ */
  if (hasGsap && !reduceMotion) {
    var bootEls = document.querySelectorAll("[data-boot]");
    if (bootEls.length) {
      var delayMs = { 1: 150, 2: 380, 3: 520, 4: 680, 5: 820, 6: 980 };
      gsap.set(bootEls, { opacity: 0, y: 18 });
      bootEls.forEach(function (el) {
        var step = el.dataset.bootDelay || 1;
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "expo.out",
          delay: (delayMs[step] || 0) / 1000,
        });
      });
    }
  }

  /* ------------------------------------------------------------------
     Section reveals — GSAP ScrollTrigger, per-element delay preserved
     from data-delay (ms). Skipped under reduced motion / missing GSAP.
     ------------------------------------------------------------------ */
  if (hasScrollTrigger && !reduceMotion) {
    var revealEls = document.querySelectorAll("[data-reveal]");
    revealEls.forEach(function (el) {
      gsap.set(el, { opacity: 0, y: 30 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.95,
            ease: "expo.out",
            delay: (parseInt(el.dataset.delay, 10) || 0) / 1000,
          });
        },
      });
    });
  }

  /* ------------------------------------------------------------------
     Hero theater — gentle scroll parallax, desktop only
     ------------------------------------------------------------------ */
  if (hasScrollTrigger && !reduceMotion && isDesktop) {
    var theater = document.querySelector("[data-theater]");
    var heroSection = document.querySelector(".hero");
    if (theater && heroSection) {
      gsap.to(theater, {
        y: -36,
        ease: "none",
        scrollTrigger: {
          trigger: heroSection,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }
  }

  /* ------------------------------------------------------------------
     Lenis smooth scroll — optional, wired to ScrollTrigger/GSAP ticker
     when present so scrub/pin math stays correct; native scroll if not.
     ------------------------------------------------------------------ */
  if (typeof window.Lenis !== "undefined" && !reduceMotion) {
    var lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", hasScrollTrigger ? ScrollTrigger.update : function () {});
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      });
    }
  }
})();
