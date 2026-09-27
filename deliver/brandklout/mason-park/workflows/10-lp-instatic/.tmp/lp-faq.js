/**
 * FAQ accordions for the Mason Park landing pages.
 *
 * THE PROBLEM
 * The FAQ items are Webflow Dropdown components:
 *
 *   <div class="… w-dropdown">
 *     <div class="… w-dropdown-toggle">question<span class="…_icon">+</span></div>
 *     <nav class="… w-dropdown-list">answer</nav>
 *   </div>
 *
 * and the stylesheet hides every answer with `.w-dropdown-list{display:none}`,
 * revealing it only via `.w-dropdown-list.w--open{display:block}`. That class is
 * added by `webflow.js`, which the port strips — so on the imported pages every
 * answer is permanently hidden and clicking does nothing.
 *
 * WORTH KNOWING: the same accordions DO NOT WORK ON THE WEBFLOW ORIGINAL EITHER.
 * Verified with a real trusted click on mason-park-dental.webflow.io: webflow.js
 * initialises the toggles (it adds role/aria-expanded/tabindex) but the click
 * never opens them — `aria-expanded` stays "false" and the answer stays
 * `display:none`. So this is a pre-existing defect in the v2 Webflow build, not
 * something the port lost, and there is no working reference behaviour to copy.
 * These 26 answers across 4 pages have never been readable by a visitor.
 *
 * WHAT THIS DOES
 * Adds back exactly the one thing the CSS is waiting for — the `w--open` class —
 * so no new styling is needed for the reveal. Each item toggles independently,
 * which is what a FAQ wants; Webflow's dropdown would also close on an outside
 * click, but that behaviour only makes sense for a menu.
 *
 * Keyboard and screen-reader support is set up here rather than assumed,
 * because webflow.js is not present to do it.
 */
(function () {
  "use strict";

  var OPEN = "w--open";

  function listFor(toggle) {
    var item = toggle.closest(".w-dropdown");
    return item ? item.querySelector(".w-dropdown-list") : null;
  }

  function setOpen(toggle, list, open) {
    toggle.classList.toggle(OPEN, open);
    list.classList.toggle(OPEN, open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function init() {
    var toggles = document.querySelectorAll(".lp-page .w-dropdown-toggle");
    if (!toggles.length) return;

    for (var i = 0; i < toggles.length; i++) {
      (function (toggle, index) {
        var list = listFor(toggle);
        if (!list) return;
        if (toggle.dataset.lpFaqBound === "1") return;
        toggle.dataset.lpFaqBound = "1";

        // The toggle is a <div>, so it is not focusable or announced without
        // this. Ids are only assigned when absent, so a page that somehow
        // arrives with webflow.js's own ids keeps them.
        if (!toggle.id) toggle.id = "lp-faq-q-" + index;
        if (!list.id) list.id = "lp-faq-a-" + index;
        toggle.setAttribute("role", "button");
        toggle.setAttribute("tabindex", "0");
        toggle.setAttribute("aria-controls", list.id);
        list.setAttribute("aria-labelledby", toggle.id);
        setOpen(toggle, list, list.classList.contains(OPEN));

        toggle.addEventListener("click", function (e) {
          e.preventDefault();
          setOpen(toggle, list, !list.classList.contains(OPEN));
        });

        toggle.addEventListener("keydown", function (e) {
          if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
          e.preventDefault(); // stop Space scrolling the page
          setOpen(toggle, list, !list.classList.contains(OPEN));
        });
      })(toggles[i], i);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
