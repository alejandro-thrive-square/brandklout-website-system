/* ==========================================================================
   Webzite Studio — Home · "The Bottom Line"
   Dependency-free motion layer. Everything runs offline; every effect has a
   reduced-motion fallback. No scroll-jacking: the hero drama is a one-time
   load timeline, and scroll effects are lightweight rAF-throttled reads.
   ========================================================================== */

(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Progressive enhancement flag — CSS only hides [data-hero]/[data-reveal]
     content once this class is present, so a failed script never blanks it. */
  document.documentElement.classList.add("js");

  /* ---- shared eased value tween (count-ups + ledger) --------------------- */
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  function tween(from, to, duration, onUpdate, onDone) {
    if (prefersReduced || duration <= 0) {
      onUpdate(to);
      if (onDone) onDone();
      return function () {};
    }
    var start = null;
    var raf = 0;
    var step = function (ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      onUpdate(from + (to - from) * easeOut(p));
      if (p < 1) raf = window.requestAnimationFrame(step);
      else if (onDone) onDone();
    };
    raf = window.requestAnimationFrame(step);
    return function () { window.cancelAnimationFrame(raf); };
  }

  /* ----------------------------------------------------------------------- */
  /* Boot — stage the hero load timeline (CSS owns the delays)               */
  /* ----------------------------------------------------------------------- */
  function initBoot() {
    var arm = function () { document.body.classList.add("is-booted"); };
    if (prefersReduced) { arm(); return; }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { window.setTimeout(arm, 180); });
    });
  }

  /* ----------------------------------------------------------------------- */
  /* Custom cursor — a small ledger tick (pointer-fine, motion-on only)      */
  /* ----------------------------------------------------------------------- */
  function initCursor() {
    if (!pointerFine || prefersReduced) return;
    var dot = document.querySelector("[data-cursor-dot]");
    var ring = document.querySelector("[data-cursor-ring]");
    if (!dot || !ring) return;

    document.body.classList.add("has-cursor");

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var seen = false;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0) translate(-50%,-50%)";
      if (!seen) { seen = true; rx = mx; ry = my; }
    }, { passive: true });

    var loop = function () {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = "translate3d(" + rx.toFixed(2) + "px," + ry.toFixed(2) + "px,0) translate(-50%,-50%)";
      window.requestAnimationFrame(loop);
    };
    window.requestAnimationFrame(loop);

    var interactive = "a,button,input,[tabindex],[data-cursor-stick],[data-cursor-view]";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(interactive)) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(interactive)) document.body.classList.remove("cursor-hover");
    });
    document.addEventListener("mousedown", function () { document.body.classList.add("cursor-down"); });
    document.addEventListener("mouseup", function () { document.body.classList.remove("cursor-down"); });
    document.addEventListener("mouseleave", function () { document.body.classList.add("cursor-out"); });
  }

  /* ----------------------------------------------------------------------- */
  /* Scroll progress rail                                                    */
  /* ----------------------------------------------------------------------- */
  function initProgress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar) return;
    var ticking = false;
    var update = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ----------------------------------------------------------------------- */
  /* Nav — solidify/compress, drawer, scrollspy                              */
  /* ----------------------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector("[data-nav]");
    var toggle = document.querySelector("[data-nav-toggle]");
    var drawer = document.querySelector("[data-nav-drawer]");

    if (nav) {
      var onScroll = function () { nav.classList.toggle("is-stuck", window.scrollY > 24); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    if (toggle && drawer) {
      var setOpen = function (open) {
        toggle.setAttribute("aria-expanded", String(open));
        drawer.classList.toggle("is-open", open);
        document.body.classList.toggle("is-locked", open);
      };
      toggle.addEventListener("click", function () {
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
      });
      drawer.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () { setOpen(false); });
      });
      window.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    }

    var spyLinks = document.querySelectorAll("[data-spy]");
    if (!spyLinks.length || !("IntersectionObserver" in window)) return;
    var map = new Map();
    spyLinks.forEach(function (link) {
      var section = document.getElementById(link.dataset.spy);
      if (section) map.set(section, link);
    });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          spyLinks.forEach(function (l) { l.classList.remove("is-active"); });
          var active = map.get(entry.target);
          if (active) active.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach(function (_l, section) { obs.observe(section); });
  }

  /* ----------------------------------------------------------------------- */
  /* Reel — brand renders crossfade in the hero card                         */
  /* ----------------------------------------------------------------------- */
  function initReel() {
    var reel = document.querySelector("[data-reel]");
    if (!reel) return;
    var frames = Array.prototype.slice.call(reel.querySelectorAll("img"));
    var toggle = document.querySelector("[data-reel-pause]");
    if (frames.length < 2) { if (toggle) toggle.hidden = true; return; }

    var index = 0, timer = null, userPaused = prefersReduced;

    var show = function (next) {
      frames[index].classList.remove("is-active");
      index = next;
      frames[index].classList.add("is-active");
    };
    var stop = function () { if (timer) { window.clearInterval(timer); timer = null; } };
    var schedule = function () {
      stop();
      if (userPaused) return;
      timer = window.setInterval(function () { show((index + 1) % frames.length); }, 2800);
    };

    if (toggle) {
      toggle.classList.toggle("is-paused", userPaused);
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.setAttribute("aria-label", userPaused ? "Play reel" : "Pause reel");
      toggle.addEventListener("click", function () {
        userPaused = !userPaused;
        toggle.setAttribute("aria-pressed", String(userPaused));
        toggle.setAttribute("aria-label", userPaused ? "Play reel" : "Pause reel");
        toggle.classList.toggle("is-paused", userPaused);
        schedule();
      });
    }
    schedule();
  }

  /* ----------------------------------------------------------------------- */
  /* Services — hovered/focused row drives the sticky well                   */
  /* ----------------------------------------------------------------------- */
  function initServices() {
    var root = document.querySelector("[data-services]");
    if (!root) return;
    var rows = Array.prototype.slice.call(root.querySelectorAll("[data-service]"));
    var wells = Array.prototype.slice.call(root.querySelectorAll("[data-well]"));
    var tag = root.querySelector("[data-well-tag]");
    if (!rows.length) return;
    var names = ["Design", "Build", "Grow"];

    var activate = function (key) {
      rows.forEach(function (row) { row.classList.toggle("is-active", row.dataset.service === key); });
      wells.forEach(function (img) { img.classList.toggle("is-active", img.dataset.well === key); });
      if (tag) tag.textContent = names[Number(key)] || "";
    };
    rows.forEach(function (row) {
      var key = row.dataset.service;
      row.addEventListener("pointerenter", function () { activate(key); });
      row.addEventListener("focus", function () { activate(key); });
    });
  }

  /* ----------------------------------------------------------------------- */
  /* Marquee — play/pause control                                            */
  /* ----------------------------------------------------------------------- */
  function initMarquee() {
    var marquee = document.querySelector("[data-marquee]");
    var btn = document.querySelector("[data-marquee-pause]");
    if (!marquee || !btn) return;
    var paused = prefersReduced;
    var apply = function () {
      marquee.classList.toggle("is-paused", paused);
      btn.classList.toggle("is-paused", paused);
      btn.setAttribute("aria-pressed", String(paused));
      btn.setAttribute("aria-label", paused ? "Play capability marquee" : "Pause capability marquee");
    };
    apply();
    btn.addEventListener("click", function () { paused = !paused; apply(); });
  }

  /* ----------------------------------------------------------------------- */
  /* Reveal — staggered entrance                                             */
  /* ----------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    items.forEach(function (item) {
      var delay = Number(item.dataset.delay || 0);
      if (delay) item.style.setProperty("--reveal-delay", delay + "ms");
    });

    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }

    var CAP = 220;
    var initialDone = false;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (initialDone) {
            var delay = Number(entry.target.dataset.delay || 0);
            entry.target.style.setProperty("--reveal-delay", Math.min(delay, CAP) + "ms");
          }
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach(function (item) { obs.observe(item); });
    window.requestAnimationFrame(function () {
      items.forEach(function (item) {
        var rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          item.classList.add("is-visible");
          obs.unobserve(item);
        }
      });
      initialDone = true;
    });
  }

  /* ----------------------------------------------------------------------- */
  /* Word fill — statement brightens word-by-word on scroll                  */
  /* ----------------------------------------------------------------------- */
  function initWordFill() {
    var blocks = document.querySelectorAll("[data-wordfill]");
    if (!blocks.length) return;

    var splitWords = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (token) {
            if (!token) return;
            if (/^\s+$/.test(token)) {
              frag.appendChild(document.createTextNode(token));
            } else {
              var span = document.createElement("span");
              span.className = "wf";
              span.textContent = token;
              frag.appendChild(span);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          splitWords(child);
        }
      });
    };
    blocks.forEach(splitWords);

    if (prefersReduced) {
      document.querySelectorAll(".wf").forEach(function (w) { w.classList.add("lit"); });
      return;
    }

    var update = function () {
      blocks.forEach(function (block) {
        var rect = block.getBoundingClientRect();
        var vh = window.innerHeight;
        var start = vh * 0.86;
        var end = vh * 0.36;
        var travel = rect.height + (start - end);
        var progress = Math.min(1, Math.max(0, (start - rect.top) / travel));
        var words = block.querySelectorAll(".wf");
        var lit = Math.round(progress * words.length);
        words.forEach(function (w, i) { w.classList.toggle("lit", i < lit); });
      });
    };
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(function () { update(); ticking = false; }); }
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* ----------------------------------------------------------------------- */
  /* Count-ups — hero index + stat grid, on first reveal                     */
  /* ----------------------------------------------------------------------- */
  function initMetrics() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      nums.forEach(function (el) { el.textContent = el.dataset.count; });
      return;
    }
    var run = function (el) {
      var target = Number(el.dataset.count);
      if (!Number.isFinite(target)) return;
      el.textContent = "0";
      tween(0, target, 2200, function (v) { el.textContent = String(Math.round(v)); },
        function () { el.textContent = String(target); });
    };
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { obs.observe(el); });
  }

  /* ----------------------------------------------------------------------- */
  /* Interactive pricing ledger — the signature interaction                  */
  /* Design $200/pg + Dev $200/pg = $400/pg ; 2 working days/pg.             */
  /* ----------------------------------------------------------------------- */
  function initLedger() {
    var root = document.querySelector("[data-calc]");
    if (!root) return;
    var slider = root.querySelector("[data-slider]");
    var pagesOut = root.querySelector("[data-pages-out]");
    var elDesign = root.querySelector("[data-line-design]");
    var elDev = root.querySelector("[data-line-dev]");
    var elTotal = root.querySelector("[data-total]");
    var elTime = root.querySelector("[data-time]");
    if (!slider) return;

    var money = new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD", maximumFractionDigits: 0
    });

    var shown = { design: 0, dev: 0, total: 0 };
    var cancel = { design: null, dev: null, total: null };

    var setMoney = function (el, key, value) {
      if (!el) return;
      if (cancel[key]) cancel[key]();
      var from = shown[key];
      cancel[key] = tween(from, value, 340, function (v) {
        shown[key] = v;
        el.textContent = money.format(Math.round(v));
      }, function () { shown[key] = value; el.textContent = money.format(value); });
    };

    var render = function () {
      var pages = Number(slider.value);
      var design = pages * 200;
      var dev = pages * 200;
      var total = pages * 400;
      var days = pages * 2;

      if (pagesOut) pagesOut.innerHTML = "<b>" + pages + "</b> " + (pages === 1 ? "page" : "pages");
      setMoney(elDesign, "design", design);
      setMoney(elDev, "dev", dev);
      setMoney(elTotal, "total", total);
      if (elTime) elTime.textContent = days + (days === 1 ? " working day" : " working days");
      slider.setAttribute("aria-valuetext", pages + (pages === 1 ? " page" : " pages"));
    };

    slider.addEventListener("input", render);
    render();
  }

  /* ---- go ---------------------------------------------------------------- */
  initBoot();
  initCursor();
  initProgress();
  initNav();
  initReel();
  initServices();
  initMarquee();
  initReveal();
  initWordFill();
  initMetrics();
  initLedger();
})();
