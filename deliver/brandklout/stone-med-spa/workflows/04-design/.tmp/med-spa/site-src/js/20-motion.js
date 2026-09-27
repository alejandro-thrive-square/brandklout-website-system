/* ===========================================================================
   THE MOTION RUNTIME — 2026-09-03. See css/40-motion.css for the vocabulary
   and the three rules. Every module guards on its own selector, so a page that
   does not carry the markup pays nothing for it. GSAP, ScrollTrigger and
   SplitText arrive from assets/vendor.js on every page (motion: true in
   build-site.mjs); everything here still guards on them, because the vendor
   bundle can fail on its own.
   =========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var gsap = window.gsap;
  var ST = gsap && window.ScrollTrigger;
  var Split = window.SplitText;
  var useGsap = !!(gsap && ST) && !reduce;
  if (useGsap) gsap.registerPlugin(ST);
  if (gsap && Split) gsap.registerPlugin(Split);

  var $ = function (s, root) {
    return (root || document).querySelector(s);
  };
  var $$ = function (s, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(s));
  };
  var wide = function () {
    return window.innerWidth > 991;
  };

  /* --- an IntersectionObserver that adds a class once ---------------------- */
  function once(selector, cls, margin) {
    var items = $$(selector);
    if (!items.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add(cls);
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add(cls);
          io.unobserve(e.target);
        });
      },
      { rootMargin: margin || "0px 0px -10% 0px", threshold: 0 }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /* --- split lines ----------------------------------------------------------
     The heading's lines rise out of a mask, in order. SplitText gives the
     lines; the mask is one wrapper per line. Re-split on resize would be the
     correct thing and is not done: a heading that has already played stays
     played, and the split is revert()ed so the text reflows naturally. */
  function split() {
    var items = $$("[data-split]");
    if (!items.length) return;
    if (reduce || !gsap || !Split) {
      items.forEach(function (el) {
        el.classList.add("is-plain");
      });
      return;
    }
    var run = function () {
      items.forEach(function (el) {
        var s;
        try {
          s = new Split(el, { type: "lines", linesClass: "split_inner" });
        } catch (e) {
          el.classList.add("is-plain");
          return;
        }
        var lines = s.lines.map(function (line) {
          var mask = document.createElement("span");
          mask.className = "split_line";
          line.parentNode.insertBefore(mask, line);
          mask.appendChild(line);
          line.style.display = "block";
          return line;
        });
        el.classList.add("is-split");
        gsap.set(lines, { yPercent: 110 });
        var play = function () {
          gsap.to(lines, {
            yPercent: 0,
            duration: 1.1,
            ease: "power4.out",
            stagger: 0.09,
            onComplete: function () {
              s.revert();
              el.classList.add("is-split");
            },
          });
        };
        if (el.hasAttribute("data-split-now")) {
          play();
        } else if (useGsap) {
          ST.create({ trigger: el, start: "top 88%", once: true, onEnter: play });
        } else {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              if (!e.isIntersecting) return;
              play();
              io.unobserve(e.target);
            });
          });
          io.observe(el);
        }
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
    else run();
  }

  /* --- the wipe (class toggle; the CSS does the rest) ----------------------- */
  function wipes() {
    once("[data-wipe]", "is-in", "0px 0px -12% 0px");
    // Anything else that wants a one-shot .is-in when it arrives — the year
    // grid's dots, a drawn line — opts in with data-in and styles the rest.
    once("[data-in]", "is-in", "0px 0px -15% 0px");
  }

  /* --- parallax --------------------------------------------------------------
     data-parallax="14" drifts the photograph 14% of its height across the
     frame's time on screen. The image is made taller than the frame first so
     no edge ever shows. data-speed="-0.2" drifts an element itself. */
  function parallax() {
    if (!useGsap) return;
    $$("[data-parallax]").forEach(function (frame) {
      var img = frame.querySelector("img");
      if (!img) return;
      var amount = parseFloat(frame.getAttribute("data-parallax")) || 12;
      gsap.set(img, { height: 100 + amount * 2 + "%", top: -amount + "%", position: "relative" });
      gsap.fromTo(
        img,
        { yPercent: -amount * 0.5 },
        {
          yPercent: amount * 0.5,
          ease: "none",
          scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 0.5 },
        }
      );
    });
    $$("[data-speed]").forEach(function (el) {
      var speed = parseFloat(el.getAttribute("data-speed")) || 0;
      var travel = speed * 120;
      gsap.fromTo(
        el,
        { y: -travel },
        {
          y: travel,
          ease: "none",
          scrollTrigger: { trigger: el.parentNode, start: "top bottom", end: "bottom top", scrub: 0.6 },
        }
      );
    });
  }

  /* --- counted numerals ---------------------------------------------------- */
  function counts() {
    var items = $$("[data-count]");
    if (!items.length) return;
    items.forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";
      var write = function (n) {
        el.textContent = prefix + Math.round(n) + suffix;
      };
      if (isNaN(target)) return;
      if (reduce || !gsap) {
        write(target);
        return;
      }
      write(0);
      var play = function () {
        var o = { n: 0 };
        gsap.to(o, {
          n: target,
          duration: 1.6,
          ease: "power3.out",
          onUpdate: function () {
            write(o.n);
          },
        });
      };
      if (useGsap) ST.create({ trigger: el, start: "top 88%", once: true, onEnter: play });
      else play();
    });
  }

  /* --- the hero pin ----------------------------------------------------------
     The photograph starts full-bleed and, over one extra viewport of scroll,
     shrinks into a rounded frame inside the page while the headline lifts away.
     Phones skip the pin: a pinned hero on a 390px screen is a screen you cannot
     leave. */
  function heroPin() {
    var hero = $("[data-hero-pin]");
    if (!hero || !useGsap || !wide()) return;
    var media = $(".hero_media", hero);
    var copy = $(".hero_copy", hero);
    var meta = $$(".hero_meta, .hero_scroll", hero);
    if (!media) return;
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "+=90%",
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
      },
    });
    tl.to(media, { scale: 0.84, borderRadius: "1.75rem", ease: "none" }, 0);
    if (copy) tl.to(copy, { yPercent: -18, opacity: 0, ease: "none" }, 0);
    if (meta.length) tl.to(meta, { opacity: 0, ease: "none" }, 0);
  }

  /* --- the hero intro ----------------------------------------------------------
     On arrival, once: the photograph settles from an over-scale and the
     headline splits in. The class does the CSS half. */
  function heroIntro() {
    var hero = $(".hero_component") || $(".cover_component");
    if (!hero) return;
    var done = function () {
      hero.classList.add("is-in");
    };
    if (reduce) {
      done();
      return;
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(done);
    });
  }

  /* --- the sideways chapter ------------------------------------------------- */
  function hscroll() {
    var roots = $$("[data-hscroll]");
    if (!roots.length || !useGsap || !wide()) return;
    roots.forEach(function (root) {
      var track = $(".hscroll_track", root);
      if (!track) return;
      var distance = function () {
        return track.scrollWidth - root.clientWidth;
      };
      if (distance() <= 0) return;
      gsap.to(track, {
        x: function () {
          return -distance();
        },
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: function () {
            return "+=" + distance();
          },
          scrub: 0.5,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      var bar = $(".hscroll_bar-fill", root);
      if (bar) {
        gsap.fromTo(
          bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: function () {
                return "+=" + distance();
              },
              scrub: 0.5,
            },
          }
        );
      }
    });
  }

  /* --- stacked cards ----------------------------------------------------------
     The CSS makes them sticky; this scales each one down a little as the next
     card covers it, so the stack reads as depth. */
  function stacks() {
    if (!useGsap) return;
    $$("[data-stack]").forEach(function (root) {
      var items = $$(".stack_item", root);
      items.forEach(function (item, i) {
        var next = items[i + 1];
        if (!next) return;
        // Scale only. A fade here showed the covered card through the one
        // above it while it was still the top of the stack (found on About).
        gsap.to(item, {
          scale: 0.94,
          ease: "none",
          scrollTrigger: { trigger: next, start: "top 80%", end: "top 7rem", scrub: true },
        });
      });
    });
  }

  /* --- rotating words --------------------------------------------------------- */
  function words() {
    $$("[data-words]").forEach(function (root) {
      var items = $$(".words_item", root);
      if (items.length < 2) return;
      var i = 0;
      items[0].classList.add("is-current");
      if (reduce) return;
      var every = parseInt(root.getAttribute("data-words"), 10) || 2400;
      setInterval(function () {
        var from = items[i];
        i = (i + 1) % items.length;
        var to = items[i];
        from.classList.remove("is-current");
        from.classList.add("is-leaving");
        to.classList.remove("is-leaving");
        to.classList.add("is-current");
        setTimeout(function () {
          from.classList.remove("is-leaving");
        }, 600);
      }, every);
    });
  }

  /* --- the drag rail ----------------------------------------------------------
     Mouse-drag to scroll, on top of native touch scrolling and the arrows. */
  function drags() {
    $$("[data-drag]").forEach(function (rail) {
      var x0 = 0,
        s0 = 0,
        down = false,
        moved = false;
      rail.addEventListener("mousedown", function (e) {
        down = true;
        moved = false;
        x0 = e.clientX;
        s0 = rail.scrollLeft;
        rail.classList.add("is-dragging");
      });
      window.addEventListener("mousemove", function (e) {
        if (!down) return;
        var dx = e.clientX - x0;
        if (Math.abs(dx) > 3) moved = true;
        rail.scrollLeft = s0 - dx;
      });
      window.addEventListener("mouseup", function () {
        if (!down) return;
        down = false;
        rail.classList.remove("is-dragging");
      });
      // a drag must not also be a click on the card underneath
      rail.addEventListener(
        "click",
        function (e) {
          if (moved) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      );
      var step = function (dir) {
        var card = rail.firstElementChild;
        var w = card ? card.getBoundingClientRect().width + 24 : rail.clientWidth * 0.8;
        rail.scrollBy({ left: dir * w, behavior: reduce ? "auto" : "smooth" });
      };
      /* THE ARROWS' SCOPE. The buttons sit in the section's HEAD, which is a
         SIBLING of the rail — the head is inside .padding-global/.container-large
         and the rail is full-bleed below it. `closest("[data-drag-scope]")`
         therefore returned null on every page and the fallback (rail.parentNode)
         does not contain the buttons either, so no arrow was ever bound. Found
         2026-09-17 by the client: "the sliders buttons don't work".
         Walk up until an ancestor actually holds the arrows; the attribute (now
         on the <section>) is the fast path, not the only one. */
      var scope = rail.closest("[data-drag-scope]");
      if (!scope || !scope.querySelector("[data-drag-prev],[data-drag-next]")) {
        scope = rail.parentNode;
        while (scope && scope.querySelector && !scope.querySelector("[data-drag-prev],[data-drag-next]")) {
          scope = scope.parentElement;
        }
        if (!scope) scope = document;
      }
      $$("[data-drag-prev]", scope).forEach(function (b) {
        b.addEventListener("click", function () {
          step(-1);
        });
      });
      $$("[data-drag-next]", scope).forEach(function (b) {
        b.addEventListener("click", function () {
          step(1);
        });
      });
    });
  }

  /* --- the marquee ------------------------------------------------------------- */
  function marquee(track, pxPerSecond) {
    if (!track || track.classList.contains("is-ready")) return;
    var kids = Array.prototype.slice.call(track.children).filter(function (k) {
      return !k.hasAttribute("data-clone");
    });
    if (!kids.length) return;
    $$("[data-clone]", track).forEach(function (c) {
      track.removeChild(c);
    });
    var target = Math.max(window.innerWidth * 2, track.scrollWidth * 2);
    var guard = 0;
    while (track.scrollWidth < target && guard < 12) {
      kids.forEach(function (k) {
        var c = k.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.setAttribute("data-clone", "");
        c.removeAttribute("id");
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
      marquee(t, parseFloat(t.getAttribute("data-speed-px")) || 50);
    });
  }

  /* --- magnetic buttons --------------------------------------------------------- */
  function magnetic() {
    if (!fine || reduce) return;
    $$(".button").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width;
        var y = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.transform = "translate(" + x * 10 + "px," + y * 8 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* --- the cursor ---------------------------------------------------------------- */
  function cursor() {
    if (!fine || reduce) return;
    var el = document.createElement("div");
    el.className = "cursor_component is-hidden";
    el.setAttribute("aria-hidden", "true");
    var label = document.createElement("span");
    label.className = "cursor_label";
    el.appendChild(label);
    document.body.appendChild(el);
    document.documentElement.classList.add("has-cursor");
    var x = -100,
      y = -100,
      cx = -100,
      cy = -100,
      raf = null;
    var tick = function () {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      el.style.transform = "translate(" + cx + "px," + cy + "px)";
      if (Math.abs(x - cx) > 0.2 || Math.abs(y - cy) > 0.2) raf = requestAnimationFrame(tick);
      else raf = null;
    };
    document.addEventListener("mousemove", function (e) {
      x = e.clientX;
      y = e.clientY;
      el.classList.remove("is-hidden");
      if (!raf) raf = requestAnimationFrame(tick);
    });
    document.addEventListener("mouseleave", function () {
      el.classList.add("is-hidden");
    });
    document.addEventListener("mouseover", function (e) {
      var t = e.target;
      var labelled = t.closest && t.closest("[data-cursor]");
      if (labelled) {
        label.textContent = labelled.getAttribute("data-cursor");
        el.classList.add("is-label");
        el.classList.remove("is-link");
        return;
      }
      el.classList.remove("is-label");
      var link = t.closest && t.closest("a, button, summary, .button");
      el.classList.toggle("is-link", !!link);
    });
  }

  /* --- the progress hairline ------------------------------------------------------- */
  function progress() {
    var bar = $(".navbar_progress");
    if (!bar) return;
    var paint = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ")";
    };
    paint();
    window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
  }

  /* --- the shelf -----------------------------------------------------------------
     The seven treatments as expanding panels. Hover opens on a fine pointer
     (CSS); a click or a keyboard focus opens everywhere, and a second click on
     the open panel follows its link. */
  function shelf() {
    var root = $(".shelf_component");
    if (!root) return;
    var items = $$(".shelf_item", root);
    var open = function (item) {
      items.forEach(function (it) {
        it.classList.toggle("is-open", it === item);
      });
    };
    items.forEach(function (item) {
      var link = $(".shelf_link", item);
      if (!link) return;
      link.addEventListener("click", function (e) {
        if (fine) return; // a pointer user hovered first; let the click go through
        if (!item.classList.contains("is-open")) {
          e.preventDefault();
          open(item);
        }
      });
      link.addEventListener("focus", function () {
        open(item);
      });
      if (fine) {
        item.addEventListener("mouseenter", function () {
          open(item);
        });
      }
    });
    open(items[0]);
  }

  function boot() {
    heroIntro();
    split();
    wipes();
    counts();
    words();
    drags();
    marquees();
    magnetic();
    cursor();
    progress();
    shelf();
    if (useGsap) {
      heroPin();
      hscroll();
      stacks();
      parallax();
      var refresh = function () {
        ST.refresh();
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      window.addEventListener("load", refresh);
    }
    window.addEventListener("resize", function () {
      $$(".marquee_track").forEach(function (t) {
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
