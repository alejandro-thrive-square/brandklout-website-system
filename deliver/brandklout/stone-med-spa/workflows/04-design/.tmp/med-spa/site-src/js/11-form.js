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
        " and we will book you in, Monday to Friday, 9 to 5.";
      slot.appendChild(p);
    }

    if (!frame) return fallback();
    frame.addEventListener("error", fallback);
    // A frame that has not started loading after 12s is not going to.
    window.setTimeout(function () {
      if (!frame.isConnected || frame.clientHeight < 40) fallback();
    }, 12000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEmbedFallback);
  } else {
    initEmbedFallback();
  }
})();
