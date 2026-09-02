/* ===========================================================================
   THE ELEVATION LAYER — Mason Park Dental, 2026-09-02.

   WHY. The client, reviewing staging: "There is too much text overall ...
   more images, less text and more animations", pointing at the elevation
   done on the Stone Surgical Arts home page the day before. This is that
   layer in Mason Park's vocabulary: the components the Stone page grew
   (mask reveals, parallax frames, a filmstrip, a catalogue with a sticky
   photograph, an index whose photograph follows the cursor, a review
   carousel, ghost words, a town ticker, magnetic buttons, a one-second
   veil) rebuilt on this site's tokens, and fed with the practice's OWN
   photographs from the client's album (see .tmp/import-album.mjs).

   Same three rules as journey.js, and they are not negotiable:
     1. NOTHING IS HIDDEN BY THIS FILE. Every hidden state in site.css is
        scoped to `html.el-ready`, which this file sets first thing, so a
        page whose script never runs is the plain page.
     2. GSAP IS OPTIONAL. Parallax and the ghost drift use ScrollTrigger
        when it is there and do nothing when it is not; everything else runs
        on IntersectionObserver and CSS transitions.
     3. REDUCED MOTION IS A BRANCH. No veil, no parallax, no marquee loop,
        no autoplay, no cursor-following frame. The controls still work.

   Every module guards on its own selector, so a page that does not carry
   the markup pays nothing. Bundled after journey.js by import-scripts.mjs;
   it does not depend on it.
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

  /* --- the veil ------------------------------------------------------------
     Shown once per session. Whatever happens, it is gone inside 2.4s: the
     timer is the guarantee, the animation is the nicety. */
  function veil() {
    var el = $(".el-veil");
    if (!el) return;
    var seen = false;
    try { seen = sessionStorage.getItem("mp-veil") === "1"; } catch (e) {}
    if (reduce || seen) { el.classList.add("is-done"); return; }
    try { sessionStorage.setItem("mp-veil", "1"); } catch (e) {}
    var mark = $(".el-veil_mark", el);
    var rule = $(".el-veil_rule", el);
    var finish = function () { el.classList.add("is-done"); };
    setTimeout(finish, 2400);
    if (gsap) {
      var tl = gsap.timeline({ onComplete: finish });
      tl.to(mark, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.05)
        .to(rule, { width: "6rem", duration: 0.6, ease: "power2.inOut" }, 0.2)
        .to(el, { yPercent: -100, duration: 0.85, ease: "power3.inOut" }, 1.0);
    } else {
      mark.style.transition = "opacity .5s, transform .5s";
      mark.style.opacity = "1";
      mark.style.transform = "none";
      setTimeout(function () {
        el.style.transition = "transform .8s cubic-bezier(.7,0,.3,1)";
        el.style.transform = "translateY(-100%)";
      }, 900);
    }
  }

  /* --- the mask reveals ----------------------------------------------------
     A frame opens as it enters. IntersectionObserver, not ScrollTrigger: a
     class toggle is all it needs and it has to work without GSAP. */
  function masks() {
    var items = $$('[data-el="mask"]');
    if (!items.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    // A photograph that is ALSO parallaxed gets its settle from GSAP, not
    // from the stylesheet: parallax() writes an inline transform and GSAP
    // folds whatever scale the CSS held into it, so the stylesheet's
    // `.is-in img { transform: none }` could never win. (Stone, 2026-09-01.)
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
        var imgs = e.target.__settle;
        if (imgs) gsap.to(imgs, { scale: 1, duration: 1.5, ease: "power3.out" });
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    items.forEach(function (el) { el.__settle = settled(el); io.observe(el); });
  }

  /* --- parallax ------------------------------------------------------------
     data-parallax="12" means the image travels 12% of its own height across
     the frame's time on screen. The image is set slightly taller than the
     frame so the travel never shows an edge. data-parallax-anchor="top"
     keeps the top edge in the frame for a photograph whose subject is up
     there. */
  function parallax() {
    if (!useGsap) return;
    $$("[data-parallax]").forEach(function (frame) {
      var img = $("img", frame);
      if (!img) return;
      var amount = parseFloat(frame.getAttribute("data-parallax")) || 10;
      var top = frame.getAttribute("data-parallax-anchor") === "top";
      gsap.set(img, { height: 100 + amount * 2 + "%", top: top ? 0 : -amount + "%", position: "relative" });
      gsap.fromTo(img,
        { yPercent: top ? 0 : -amount * 0.5 },
        { yPercent: top ? -amount : amount * 0.5, ease: "none",
          scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });
  }

  /* --- the ghost words -----------------------------------------------------
     Drift sideways with the scroll. Decoration; aria-hidden in the markup. */
  function ghosts() {
    if (!useGsap) return;
    $$(".el-ghost").forEach(function (el) {
      var dir = el.classList.contains("is-right") ? 1 : -1;
      gsap.fromTo(el, { xPercent: dir * 6 }, { xPercent: dir * -6, ease: "none",
        scrollTrigger: { trigger: el.parentNode, start: "top bottom", end: "bottom top", scrub: 0.8 } });
    });
  }

  /* --- the marquees --------------------------------------------------------
     Clone a track's children until it is at least twice the viewport, then
     let CSS loop it by translating half its width. The duration scales with
     the width so every strip moves at about the same speed. */
  function marquee(track, pxPerSecond) {
    if (!track || track.classList.contains("is-ready")) return;
    var kids = Array.prototype.slice.call(track.children);
    if (!kids.length) return;
    var target = Math.max(window.innerWidth * 2, track.scrollWidth * 2);
    var guard = 0;
    while (track.scrollWidth < target && guard < 12) {
      kids.forEach(function (k) {
        var c = k.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        track.appendChild(c);
      });
      guard++;
    }
    var half = track.scrollWidth / 2;
    track.style.setProperty("--el-marquee-duration", Math.round(half / pxPerSecond) + "s");
    if (!reduce) track.classList.add("is-ready");
  }
  function marquees() {
    $$(".el-strip_track").forEach(function (t) { marquee(t, 32); });
    $$(".el-ticker_row").forEach(function (t) { marquee(t, 40); });
    $$(".el-words_track").forEach(function (t) { marquee(t, 45); });
  }

  /* --- magnetic buttons ----------------------------------------------------
     A few pixels toward the pointer, and a spring back. Fine pointers only;
     the transition in site.css makes the spring. */
  function magnetic() {
    if (!finePointer || reduce) return;
    $$(".ch .button").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width;
        var y = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.transform = "translate(" + x * 8 + "px," + y * 6 + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* --- the catalogue -------------------------------------------------------
     One open group at a time. Hover opens on a fine pointer, click and
     keyboard everywhere; the sticky photograph follows the open one. The
     trigger is an <a>, not a <button>: Instatic's importer flattens a
     button's children into a label string and the trigger carries three
     spans. The href is a real in-page anchor for the no-JS case. */
  function catalogue() {
    $$(".el-catalogue").forEach(function (rootEl) {
      var items = $$(".el-catalogue_item", rootEl);
      var imgs = $$(".el-catalogue_media img", rootEl);
      var caption = $(".el-catalogue_caption", rootEl);
      var activate = function (item) {
        items.forEach(function (it) {
          var on = it === item;
          it.classList.toggle("is-active", on);
          var btn = $(".el-catalogue_trigger", it);
          if (btn) btn.setAttribute("aria-expanded", on ? "true" : "false");
        });
        var key = item.getAttribute("data-cat");
        imgs.forEach(function (im) { im.classList.toggle("is-active", im.getAttribute("data-cat") === key); });
        if (caption) {
          var name = $(".el-catalogue_name", item);
          var count = $$(".el-catalogue_link", item).length;
          caption.innerHTML = "<span>" + count + (count === 1 ? " treatment" : " treatments") + "</span><strong>" + (name ? name.textContent : "") + "</strong>";
        }
      };
      items.forEach(function (item) {
        var btn = $(".el-catalogue_trigger", item);
        if (!btn) return;
        btn.addEventListener("click", function (e) { e.preventDefault(); activate(item); });
        if (finePointer) btn.addEventListener("mouseenter", function () { activate(item); });
      });
      var first = $(".el-catalogue_item.is-active", rootEl) || items[0];
      if (first) activate(first);
    });
  }

  /* --- the story -----------------------------------------------------------
     A sticky frame whose photograph changes with the step in the reader's
     eyeline. Scrollytelling without a control. */
  function story() {
    $$(".el-story").forEach(function (rootEl) {
      var steps = $$(".el-story_step", rootEl);
      var frames = $$(".el-story_frames img", rootEl);
      if (!steps.length || !frames.length) return;
      var show = function (step) {
        var key = step.getAttribute("data-frame");
        steps.forEach(function (s) { s.classList.toggle("is-current", s === step); });
        frames.forEach(function (f) { f.classList.toggle("is-active", f.getAttribute("data-frame") === key); });
      };
      show(steps[0]);
      if (!("IntersectionObserver" in window)) return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) show(e.target); });
      }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
    });
  }

  /* --- the index -----------------------------------------------------------
     A list of lines; hovering one floats a photograph that follows the
     pointer with a little lag and swaps to the row under it. On a touch
     screen the stylesheet shows the thumbnail inline instead. */
  function index() {
    $$(".el-index").forEach(function (rootEl) {
      var frame = $(".el-index_float", rootEl);
      var rows = $$(".el-index_row", rootEl);
      if (!frame || !rows.length || !finePointer || reduce) return;
      var imgs = $$("img", frame);
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null, on = false;
      var tick = function () {
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        frame.style.left = cx + "px";
        frame.style.top = cy + "px";
        if (on || Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) raf = requestAnimationFrame(tick);
        else raf = null;
      };
      rootEl.addEventListener("mousemove", function (e) {
        var r = rootEl.getBoundingClientRect();
        tx = e.clientX - r.left;
        ty = e.clientY - r.top;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      rows.forEach(function (row) {
        row.addEventListener("mouseenter", function (e) {
          var key = row.getAttribute("data-img");
          imgs.forEach(function (im) { im.classList.toggle("is-active", im.getAttribute("data-img") === key); });
          if (!on) {
            var r = rootEl.getBoundingClientRect();
            cx = tx = e.clientX - r.left;
            cy = ty = e.clientY - r.top;
          }
          on = true;
          frame.classList.add("is-on");
          if (!raf) raf = requestAnimationFrame(tick);
        });
        row.addEventListener("mouseleave", function () { on = false; frame.classList.remove("is-on"); });
      });
    });
  }

  /* --- the carousel --------------------------------------------------------
     One review at a time at the size of a statement. Arrows, keyboard,
     swipe, a seven second autoplay with a visible bar that stops while the
     reader is on it and never runs under reduced motion. */
  function carousel() {
    $$(".el-carousel").forEach(function (rootEl) {
      var slides = $$(".el-carousel_slide", rootEl);
      if (slides.length < 2) return;
      var prev = $(".el-carousel_arrow.is-prev", rootEl);
      var next = $(".el-carousel_arrow.is-next", rootEl);
      var count = $(".el-carousel_count", rootEl);
      var bar = $(".el-carousel_bar-fill", rootEl);
      var live = $(".el-carousel_slides", rootEl);
      var i = 0, timer = null, paused = false;
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };
      var arm = function () {
        if (timer) clearTimeout(timer);
        if (bar) { bar.classList.remove("is-running"); void bar.offsetWidth; }
        if (reduce || paused) return;
        if (bar) bar.classList.add("is-running");
        timer = setTimeout(function () { go(i + 1); }, 7000);
      };
      var go = function (n) {
        i = (n + slides.length) % slides.length;
        slides.forEach(function (s, k) {
          s.classList.toggle("is-active", k === i);
          s.setAttribute("aria-hidden", k === i ? "false" : "true");
        });
        if (count) count.innerHTML = pad(i + 1) + " <span>/ " + pad(slides.length) + "</span>";
        arm();
      };
      var stop = function (e) { if (e) e.preventDefault(); };
      if (prev) prev.addEventListener("click", function (e) { stop(e); go(i - 1); });
      if (next) next.addEventListener("click", function (e) { stop(e); go(i + 1); });
      rootEl.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") go(i - 1);
        if (e.key === "ArrowRight") go(i + 1);
      });
      var hold = function () { paused = true; arm(); };
      var release = function () { paused = false; arm(); };
      rootEl.addEventListener("mouseenter", hold);
      rootEl.addEventListener("mouseleave", release);
      rootEl.addEventListener("focusin", hold);
      rootEl.addEventListener("focusout", release);
      var x0 = null;
      if (live) {
        live.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
        live.addEventListener("touchend", function (e) {
          if (x0 === null) return;
          var dx = e.changedTouches[0].clientX - x0;
          if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
          x0 = null;
        }, { passive: true });
      }
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) release(); else hold(); });
        }, { threshold: 0.2 });
        io.observe(rootEl);
      }
      go(0);
    });
  }

  /* --- the tilt cards ------------------------------------------------------
     A photograph card that leans a few degrees toward the pointer. Fine
     pointers only; the stylesheet's transition returns it. */
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

  function boot() {
    veil();
    masks();
    marquees();
    magnetic();
    catalogue();
    story();
    index();
    carousel();
    tilt();
    if (useGsap) {
      parallax();
      ghosts();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    }
    window.addEventListener("resize", function () {
      $$(".el-strip_track, .el-ticker_row, .el-words_track").forEach(function (t) {
        if (t.scrollWidth < window.innerWidth * 2) t.classList.remove("is-ready");
      });
      marquees();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
