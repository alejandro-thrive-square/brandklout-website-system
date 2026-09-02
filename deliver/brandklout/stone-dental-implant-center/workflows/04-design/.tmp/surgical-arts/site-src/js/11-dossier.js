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
    // the deepest tab lights all three and the surface one lights one. That is
    // the point being made: the deep work is under the other two, and an
    // operation that reaches it has been through them.
    //
    // THE ORDER IS READ OUT OF THE MARKUP, surface first, in DOM order. It was
    // a literal `["skin", "fat", "muscle"]` until 2026-09-01, which was the
    // neck's anatomy hard-coded into a file shared by every dossier page. The
    // blepharoplasty page's three tissues are skin, muscle and fat, in that
    // order, and one page's anatomy sitting in the runtime would have meant
    // either a wrong indicator or a branch on the page name. The bars already
    // declare the order; this reads what they declare.
    var order = [];
    for (var o = 0; o < bars.length; o++) order.push(bars[o].getAttribute("data-layer"));

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

    // THE READINGS LIVE IN THE MARKUP, on `data-r1` to `data-r4` of the output
    // element, with the zero state as its own text content. They were five
    // string literals in this file until 2026-09-01, all of them about necks,
    // in a runtime shared by every dossier page.
    //
    // The zero state is read rather than declared for a reason worth keeping:
    // it is the sentence a reader sees with no JavaScript at all, so it has to
    // be the one the author wrote in the HTML, and this file must not be able
    // to disagree with it.
    var out = form.querySelector(".check_out");
    var READINGS = [text.textContent];
    for (var r = 1; out && out.dataset["r" + r]; r++) READINGS.push(out.dataset["r" + r]);

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
