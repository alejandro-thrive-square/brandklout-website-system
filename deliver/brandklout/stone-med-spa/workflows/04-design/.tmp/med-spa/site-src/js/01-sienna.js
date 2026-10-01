// Sienna text-size repair — the site-wide accessibility widget froze text at 16px.
//
// Sienna (a `siteScripts` line of brandklout.embed-origins, an `async` tag in
// <head>) runs `W(1)` on start-up: for every p, a, span, li, h1–h6 … it reads
// getComputedStyle().fontSize, keeps it as `data-asw-org-font-size` and writes
// it back as an inline px size — even at 100%. An async script does not wait
// for stylesheets, so when Sienna is cached and the page CSS is still on its
// way, it reads the browser default and pins 131 elements at 16px: the nav
// links (12px) came out a third bigger, on whichever page lost the race (found
// 2026-10-01; the home page, the heaviest, lost it most).
//
// Even when it wins the race, the inline px freezes the fluid type at the
// width the page loaded at.
//
// This bundle is a module, so it runs only once the stylesheets apply. It
// re-reads each stamped element's real size, stores THAT as Sienna's original,
// and drops the inline size, leaving 100% to the CSS. A visitor's own scale
// (any other value) is kept, re-applied to the correct original. Sienna stamps
// once per element and only scales from the stamp afterwards, so the widget's
// size buttons keep working. The observer catches a Sienna that starts after
// this script.
(function () {
  "use strict";

  var ATTR = "data-asw-org-font-size";
  var observer;

  function repair() {
    var els = document.querySelectorAll("[" + ATTR + "]");
    if (!els.length) return;
    var scales = [];
    var sizes = [];
    var i;
    // Three passes, so no element is read while an ancestor still carries a
    // stale or re-scaled inline size.
    for (i = 0; i < els.length; i++) {
      var org = Number(els[i].getAttribute(ATTR));
      var now = parseFloat(els[i].style.fontSize);
      scales.push(org && now ? now / org : 1);
      els[i].style.removeProperty("font-size");
    }
    for (i = 0; i < els.length; i++) sizes.push(parseFloat(getComputedStyle(els[i]).fontSize));
    for (i = 0; i < els.length; i++) {
      els[i].setAttribute(ATTR, String(sizes[i]));
      if (Math.abs(scales[i] - 1) > 0.001) els[i].style.fontSize = sizes[i] * scales[i] + "px";
    }
    // Our own writes are not Sienna's.
    if (observer) observer.takeRecords();
  }

  repair();
  if (window.MutationObserver) {
    observer = new MutationObserver(repair);
    observer.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: [ATTR] });
  }
})();
