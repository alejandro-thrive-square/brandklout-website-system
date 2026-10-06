// THE BOOKING FORM IS THE PRACTICE'S GO HIGH LEVEL FORM (2026-09-17).
//
// It replaced a local form that deliberately posted nowhere: there was no
// endpoint, no scheduler, and no answer to whether the channel was
// HIPAA-appropriate, so submitting told the visitor to call instead. The client
// has now supplied their GHL form ("Contact Page"), which is their main contact
// point alongside the phone number, and it is the only form on the site.
//
// NOTHING HERE RENDERS OR SUBMITS IT. The vendor's iframe is inlined into
// [data-embed="ghl-form"] at build time from ghl-form.mjs, and the vendor's own
// form_embed.js sizes it. On Instatic the same snippet ships as an Embed block
// (push-site.mjs), because the importer will not carry a third-party iframe.
//
// What is left is the guard below: on a page where the embed did not arrive —
// an old published copy, a blocked third party, a corporate network that eats
// leadconnectorhq.com — the slot would otherwise be an empty box with no
// explanation. It gets the phone number instead.
//
// The "in person / by video" buttons above the form are plain anchors again.
// They used to preselect a <select> in the local form; the GHL form has no such
// field, and silently doing nothing is worse than scrolling honestly.
(function () {
  "use strict";

  var PHONE = "(817) 674-2061";

  function initEmbedFallback() {
    var slot = document.querySelector('[data-embed="ghl-form"]');
    if (!slot) return;
    var frame = slot.querySelector("iframe");

    function fallback() {
      if (slot.getAttribute("data-embed-state") === "fallback") return;
      slot.setAttribute("data-embed-state", "fallback");
      var p = document.createElement("p");
      p.className = "form_fallback";
      p.setAttribute("role", "status");
      p.textContent =
        "Our booking form could not load. Please call " +
        PHONE +
        " and we will book you in.";
      slot.appendChild(p);
    }

    if (!frame) return fallback();
    frame.addEventListener("error", fallback);
    // Judge the frame by whether the visitor can SEE it. form_embed.js hides
    // it (opacity 0, visibility hidden, left -9999px) until the form inside
    // reports its height, so a frame that never loads keeps its 565px and
    // only looks absent — the old height check never fired. A reveal takes
    // 5-15s (up to ~25s on a slow phone); still hidden at 25s means it
    // failed. If it reveals after that, the message goes away again.
    function hidden() {
      var f = slot.querySelector("iframe");
      if (!f) return true;
      var cs = window.getComputedStyle(f);
      return f.clientHeight < 40 || cs.visibility === "hidden" || cs.opacity === "0" || f.style.left === "-9999px";
    }
    window.setTimeout(function () {
      if (hidden()) fallback();
    }, 25000);
    var watch = window.setInterval(function () {
      if (slot.getAttribute("data-embed-state") !== "fallback" || hidden()) return;
      var p = slot.querySelector(".form_fallback");
      if (p) p.parentNode.removeChild(p);
      slot.removeAttribute("data-embed-state");
      window.clearInterval(watch);
    }, 1000);
    window.setTimeout(function () {
      window.clearInterval(watch);
    }, 120000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEmbedFallback);
  } else {
    initEmbedFallback();
  }
})();
