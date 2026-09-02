/* ===========================================================================
   THE ELEVATION RUNTIME — added 2026-09-01. See css/52-elevate.css for why.

   Same three rules as 10-journey.js, and they are not negotiable:
     1. NOTHING IS HIDDEN BY THIS FILE. Every hidden state is CSS scoped to
        `.js`, and the head strips `.js` if the bundle never boots.
     2. GSAP IS OPTIONAL. The parallax and the ghost drift use ScrollTrigger
        when it is there and do nothing when it is not; everything else runs
        on IntersectionObserver and CSS transitions and needs no library.
     3. REDUCED MOTION IS A BRANCH. No veil, no parallax, no marquee loop, no
        autoplay, no cursor-following frame. The controls still work.

   Every module guards on its own selector, so a page that does not carry the
   markup pays nothing. Bundled after 10-journey.js and 11-dossier.js; it does
   not depend on either.
   =========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var gsap = window.gsap;
  var ST = gsap && window.ScrollTrigger;
  var useGsap = !!(gsap && ST) && !reduce;
  if (useGsap) gsap.registerPlugin(ST);

  var $ = function (s, root) {
    return (root || document).querySelector(s);
  };
  var $$ = function (s, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(s));
  };

  /* --- the veil ------------------------------------------------------------
     Shown once per session. Whatever happens, it is gone inside 2.4s: the
     timer is the guarantee, the animation is the nicety. */
  function veil() {
    var el = $(".veil_component");
    if (!el) return;
    var seen = false;
    try {
      seen = sessionStorage.getItem("ssa-veil") === "1";
    } catch (e) {}
    if (reduce || seen) {
      el.classList.add("is-done");
      return;
    }
    try {
      sessionStorage.setItem("ssa-veil", "1");
    } catch (e) {}
    var mark = $(".veil_mark", el);
    var rule = $(".veil_rule", el);
    var finish = function () {
      el.classList.add("is-done");
    };
    setTimeout(finish, 2400);
    if (gsap) {
      var tl = gsap.timeline({ onComplete: finish });
      tl.to(mark, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.05)
        .to(rule, { width: "6rem", duration: 0.6, ease: "power2.inOut" }, 0.2)
        .to(el, { yPercent: -100, duration: 0.85, ease: "power3.inOut" }, 1.0);
    } else {
      mark.style.transition = "opacity 0.5s, transform 0.5s";
      mark.style.opacity = "1";
      mark.style.transform = "none";
      setTimeout(function () {
        el.style.transition = "transform 0.8s cubic-bezier(0.7,0,0.3,1)";
        el.style.transform = "translateY(-100%)";
      }, 900);
    }
  }

  /* --- the mask reveals ----------------------------------------------------
     A frame opens as it enters. IntersectionObserver, not ScrollTrigger: a
     class toggle is all it needs and it has to work without GSAP. */
  function masks() {
    var items = $$('[data-j="mask"]');
    if (!items.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }
    // A photograph that is ALSO parallaxed gets its settle from GSAP, not
    // from the stylesheet. parallax() writes an inline transform, and GSAP
    // folds whatever scale the CSS held at that moment into it, so the
    // stylesheet's `.is-in img { transform: none }` could never win and the
    // frame stayed at 1.18 forever. Found by probe.mjs on 2026-09-01.
    var settled = function (el) {
      if (!useGsap) return null;
      var imgs = $$("img", el).filter(function (im) {
        return im.closest("[data-parallax]");
      });
      if (!imgs.length) return null;
      gsap.set(imgs, { scale: 1.18 });
      return imgs;
    };
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          var imgs = e.target.__settle;
          if (imgs) gsap.to(imgs, { scale: 1, duration: 1.5, ease: "power3.out" });
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );
    items.forEach(function (el) {
      el.__settle = settled(el);
      io.observe(el);
    });
  }

  /* --- parallax ------------------------------------------------------------
     data-parallax="12" means the image travels 12% of its own height across
     the frame's time on screen. The image is set slightly taller than the
     frame so the travel never shows an edge. */
  function parallax() {
    if (!useGsap) return;
    $$("[data-parallax]").forEach(function (frame) {
      var img = $("img", frame);
      if (!img) return;
      var amount = parseFloat(frame.getAttribute("data-parallax")) || 10;
      // A frame whose subject sits at the TOP of the photograph (the practice's
      // consultation room, whose seated figure is at the top right; anything
      // carrying .u-focus-figure or data-parallax-anchor="top") keeps its top
      // edge in the frame and only ever drifts upward. Centred, the first 8%
      // of the picture was off the top of the frame before the scroll began,
      // and on that photograph the 8% was the person's face. 2026-09-02.
      var top = frame.classList.contains("u-focus-figure") || frame.getAttribute("data-parallax-anchor") === "top";
      gsap.set(img, { height: 100 + amount * 2 + "%", top: top ? 0 : -amount + "%", position: "relative" });
      gsap.fromTo(
        img,
        { yPercent: top ? 0 : -amount * 0.5 },
        {
          yPercent: top ? -amount : amount * 0.5,
          ease: "none",
          scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 0.6 },
        }
      );
    });
  }

  /* --- the ghost words -----------------------------------------------------
     Drift sideways with the scroll. Decoration; aria-hidden in the markup. */
  function ghosts() {
    if (!useGsap) return;
    $$(".ghost_word").forEach(function (el) {
      var dir = el.classList.contains("is-right") ? 1 : -1;
      gsap.fromTo(
        el,
        { xPercent: dir * 6 },
        {
          xPercent: dir * -6,
          ease: "none",
          scrollTrigger: { trigger: el.parentNode, start: "top bottom", end: "bottom top", scrub: 0.8 },
        }
      );
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
    track.style.setProperty("--marquee-duration", Math.round(half / pxPerSecond) + "s");
    if (!reduce) track.classList.add("is-ready");
  }
  function marquees() {
    $$(".marquee_track").forEach(function (t) {
      marquee(t, 45);
    });
    $$(".strip_track").forEach(function (t) {
      marquee(t, 32);
    });
    $$(".ticker_row").forEach(function (t) {
      marquee(t, 40);
    });
  }

  /* --- magnetic buttons ----------------------------------------------------
     A few pixels toward the pointer, and a spring back. Fine pointers only,
     and the CSS transition on .button is what makes the spring. */
  function magnetic() {
    if (!finePointer || reduce) return;
    $$(".button").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width;
        var y = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.transform = "translate(" + x * 8 + "px," + y * 6 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* --- 02 the catalogue ----------------------------------------------------
     One open category at a time. Hover opens on a fine pointer, click and
     keyboard everywhere; the sticky photograph follows the open one. */
  function catalogue() {
    var root = $(".catalogue_component");
    if (!root) return;
    var items = $$(".catalogue_item", root);
    var imgs = $$(".catalogue_media img", root);
    var caption = $(".catalogue_caption", root);
    var activate = function (item) {
      items.forEach(function (it) {
        var on = it === item;
        it.classList.toggle("is-active", on);
        var btn = $(".catalogue_trigger", it);
        if (btn) btn.setAttribute("aria-expanded", on ? "true" : "false");
      });
      var key = item.getAttribute("data-cat");
      imgs.forEach(function (im) {
        im.classList.toggle("is-active", im.getAttribute("data-cat") === key);
      });
      if (caption) {
        var name = $(".catalogue_name", item);
        var count = $$(".catalogue_link", item).length;
        caption.innerHTML =
          "<span>" + count + " treatments</span><strong>" + (name ? name.textContent : "") + "</strong>";
      }
    };
    items.forEach(function (item) {
      var btn = $(".catalogue_trigger", item);
      if (!btn) return;
      btn.addEventListener("click", function (e) {
        // An anchor, not a <button>: Instatic's importer flattens a button's
        // children into a label string and the trigger carries three spans.
        // The href is a real in-page anchor for the no-JS case; with JS the
        // accordion opens in place instead of the page jumping.
        e.preventDefault();
        activate(item);
      });
      if (finePointer) {
        btn.addEventListener("mouseenter", function () {
          activate(item);
        });
      }
    });
    var first = $(".catalogue_item.is-active", root) || items[0];
    if (first) activate(first);
  }

  /* --- 03 the surgeon's frames ---------------------------------------------
     The step in the reader's eyeline decides which portrait is showing. */
  function surgeon() {
    var root = $(".surgeon_component");
    if (!root) return;
    var steps = $$(".surgeon_step", root);
    var frames = $$(".surgeon_frames img", root);
    if (!steps.length || !frames.length) return;
    var show = function (step) {
      var key = step.getAttribute("data-frame");
      steps.forEach(function (s) {
        s.classList.toggle("is-current", s === step);
      });
      frames.forEach(function (f) {
        f.classList.toggle("is-active", f.getAttribute("data-frame") === key);
      });
    };
    show(steps[0]);
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) show(e.target);
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );
    steps.forEach(function (s) {
      io.observe(s);
    });
  }

  /* --- 06 the concerns -----------------------------------------------------
     The floating frame follows the pointer inside the section with a little
     lag, and swaps its photograph to the row under the pointer. */
  function concerns() {
    var root = $(".concern_component");
    if (!root) return;
    var frame = $(".concern_float", root);
    var rows = $$(".concern_row", root);
    if (!frame || !rows.length || !finePointer || reduce) return;
    var imgs = $$("img", frame);
    var tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      raf = null,
      on = false;
    var tick = function () {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      frame.style.left = cx + "px";
      frame.style.top = cy + "px";
      if (on || Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) raf = requestAnimationFrame(tick);
      else raf = null;
    };
    var move = function (e) {
      var r = root.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    root.addEventListener("mousemove", move);
    rows.forEach(function (row) {
      row.addEventListener("mouseenter", function (e) {
        var key = row.getAttribute("data-img");
        imgs.forEach(function (im) {
          im.classList.toggle("is-active", im.getAttribute("data-img") === key);
        });
        if (!on) {
          var r = root.getBoundingClientRect();
          cx = tx = e.clientX - r.left;
          cy = ty = e.clientY - r.top;
        }
        on = true;
        frame.classList.add("is-on");
        if (!raf) raf = requestAnimationFrame(tick);
      });
      row.addEventListener("mouseleave", function () {
        on = false;
        frame.classList.remove("is-on");
      });
    });
  }

  /* --- 07 the proof carousel -----------------------------------------------
     Arrows, keyboard, swipe, a seven second autoplay with a visible bar that
     stops while the reader is on it and never runs under reduced motion. */
  function proof() {
    var root = $(".proof_component");
    if (!root) return;
    var slides = $$(".proof_slide", root);
    if (slides.length < 2) return;
    var prev = $(".proof_arrow.is-prev", root);
    var next = $(".proof_arrow.is-next", root);
    var count = $(".proof_count", root);
    var bar = $(".proof_bar-fill", root);
    var live = $(".proof_slides", root);
    var i = 0,
      timer = null,
      paused = false;
    var pad = function (n) {
      return (n < 10 ? "0" : "") + n;
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
    var arm = function () {
      if (timer) clearTimeout(timer);
      if (bar) {
        bar.classList.remove("is-running");
        // force the reset to paint before the next run starts
        void bar.offsetWidth;
      }
      if (reduce || paused) return;
      if (bar) bar.classList.add("is-running");
      timer = setTimeout(function () {
        go(i + 1);
      }, 7000);
    };
    if (prev)
      prev.addEventListener("click", function () {
        go(i - 1);
      });
    if (next)
      next.addEventListener("click", function () {
        go(i + 1);
      });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") go(i - 1);
      if (e.key === "ArrowRight") go(i + 1);
    });
    var hold = function () {
      paused = true;
      arm();
    };
    var release = function () {
      paused = false;
      arm();
    };
    root.addEventListener("mouseenter", hold);
    root.addEventListener("mouseleave", release);
    root.addEventListener("focusin", hold);
    root.addEventListener("focusout", release);
    // swipe
    var x0 = null;
    if (live) {
      live.addEventListener(
        "touchstart",
        function (e) {
          x0 = e.touches[0].clientX;
        },
        { passive: true }
      );
      live.addEventListener(
        "touchend",
        function (e) {
          if (x0 === null) return;
          var dx = e.changedTouches[0].clientX - x0;
          if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
          x0 = null;
        },
        { passive: true }
      );
    }
    // only autoplay while on screen
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) release();
            else hold();
          });
        },
        { threshold: 0.2 }
      );
      io.observe(root);
    }
    go(0);
  }

  /* --- the jump bar --------------------------------------------------------
     The treatments hub's sticky category strip. Marks the link whose section
     is in the reader's eyeline; every link is a plain anchor and works
     without this. */
  function jump() {
    var bar = $(".jump_component");
    if (!bar || !("IntersectionObserver" in window)) return;
    var links = $$(".jump_link", bar);
    var targets = links
      .map(function (a) {
        var id = (a.getAttribute("href") || "").slice(1);
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);
    if (!targets.length) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id);
          });
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    targets.forEach(function (t) {
      io.observe(t);
    });
  }

  /* --- the membership calculator ------------------------------------------
     Months in, banked credit and what it buys out, per tier. The milestones
     are the practice's published fees (treatments.html); the tier's monthly
     credit is a data attribute on the card, so replacing the proposed tiers
     with the real programme is a markup edit. */
  function calculator() {
    var range = $("[data-calc-range]");
    if (!range) return;
    var cards = $$("[data-monthly]");
    var monthsOut = $$("[data-calc-months]");
    var milestones = [
      [11000, "a full neck lift"],
      [6000, "a MyEllevate neck lift"],
      [3400, "blepharoplasty"],
      [2800, "a Morpheus8 course of three"],
      [1600, "two syringes of filler"],
      [800, "a syringe of filler"],
      [380, "a microneedling session"],
      [189, "a HydraFacial"],
    ];
    var money = function (n) {
      return "$" + Math.round(n).toLocaleString("en-US");
    };
    var update = function () {
      var m = parseInt(range.value, 10) || 1;
      monthsOut.forEach(function (el) {
        el.textContent = String(m);
      });
      cards.forEach(function (card) {
        var monthly = parseFloat(card.getAttribute("data-monthly")) || 0;
        var banked = monthly * m;
        var out = $("[data-calc-banked]", card);
        var buys = $("[data-calc-buys]", card);
        if (out) out.textContent = money(banked);
        if (buys) {
          var hit = null;
          for (var i = 0; i < milestones.length; i++) {
            if (banked >= milestones[i][0]) {
              hit = milestones[i];
              break;
            }
          }
          if (!hit) buys.innerHTML = "Building towards <strong>a HydraFacial</strong> at $189";
          else {
            var change = banked - hit[0];
            buys.innerHTML = "Enough for <strong>" + hit[1] + "</strong>" + (change >= 189 ? " with " + money(change) + " to spare" : "");
          }
        }
      });
    };
    range.addEventListener("input", update);
    update();
  }

  /* --- the review filter ---------------------------------------------------
     Tag buttons over a wall of cards. Cards carry data-filter-tags; the
     count and the empty state follow the selection. */
  function filter() {
    var root = $("[data-filter]");
    if (!root) return;
    var buttons = $$("[data-filter-value]", root);
    var cards = $$("[data-filter-tags]", root);
    var count = $("[data-filter-count]", root);
    var empty = $("[data-filter-empty]", root);
    var apply = function (value) {
      var shown = 0;
      cards.forEach(function (c) {
        var tags = (c.getAttribute("data-filter-tags") || "").split(/\s+/);
        var on = value === "all" || tags.indexOf(value) > -1;
        c.classList.toggle("is-hidden", !on);
        if (on) shown++;
      });
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-filter-value") === value ? "true" : "false");
      });
      if (count) count.textContent = shown + (shown === 1 ? " review" : " reviews");
      if (empty) empty.classList.toggle("is-on", shown === 0);
    };
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        apply(b.getAttribute("data-filter-value"));
      });
    });
  }

  /* --- the consultation form -----------------------------------------------
     The form has no endpoint yet (HANDOFF.md, the wiring job at Instatic
     setup). Until it does, submitting it must not look like it worked: the
     page says so and points at the two ways in that do. Remove this the day
     the action attribute exists. */
  function form() {
    var f = $('form[data-form="consultation"]');
    if (!f || f.getAttribute("action")) return;
    var status = $(".form_status", f);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (status) {
        status.hidden = false;
        status.focus();
      }
    });
  }

  function boot() {
    veil();
    jump();
    calculator();
    filter();
    form();
    masks();
    marquees();
    magnetic();
    catalogue();
    surgeon();
    concerns();
    proof();
    if (useGsap) {
      parallax();
      ghosts();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          ST.refresh();
        });
      }
    }
    window.addEventListener("resize", function () {
      // the cloned strips were sized for the old viewport
      $$(".marquee_track, .strip_track, .ticker_row").forEach(function (t) {
        if (t.scrollWidth < window.innerWidth * 2) t.classList.remove("is-ready");
      });
      marquees();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
