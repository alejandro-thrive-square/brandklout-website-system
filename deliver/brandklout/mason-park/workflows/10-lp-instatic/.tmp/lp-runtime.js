/**
 * Landing-page runtime for the Mason Park Instatic site.
 *
 * Scoped to the six paid-traffic pages only. It restores the three things the
 * static port cannot carry, because Instatic's HTML importer drops <script> and
 * <iframe> outright:
 *
 *   1. The GoHighLevel lead form. Each page carries a `[data-ghl-form]`
 *      placeholder where the Webflow page had the embed; this rebuilds the
 *      iframe with the same attributes `form_embed.js` expects, then loads that
 *      loader so the iframe auto-resizes to the form. Order matters - the
 *      loader scans for iframes when it runs.
 *   2. The call-tracking number pool. On the Webflow original this swaps the
 *      practice's public number for a per-campaign number: the reference page
 *      renders (281) 645-5375 where the markup says (281) 769-8878. Without it
 *      every ad call is attributed to the main site.
 *   3. The Elfsight review widget on the four non-thank-you pages.
 *
 * Nothing here runs on the other 71 pages: the main site keeps its own number
 * and loads none of this.
 */
(function () {
  "use strict";

  var LOC = "mZ2q3yXtue090i2YLcrj";
  var POOL = "IEOmxFRkrrKh72B8hqHg";

  function load(src, async) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var s = document.createElement("script");
    s.src = src;
    if (async) s.async = true;
    document.body.appendChild(s);
  }

  function mountForms() {
    var slots = document.querySelectorAll("[data-ghl-form]");
    if (!slots.length) return 0;

    for (var i = 0; i < slots.length; i++) {
      var el = slots[i];
      if (el.querySelector("iframe")) continue; // already mounted
      var id = el.getAttribute("data-ghl-form");
      var height = el.getAttribute("data-ghl-height") || "723";

      var f = document.createElement("iframe");
      f.src = "https://api.leadconnectorhq.com/widget/form/" + id;
      f.id = "inline-" + id;
      f.title = el.getAttribute("data-ghl-name") || "Contact form";
      f.style.cssText = "width:100%;height:100%;border:none;border-radius:12px";
      // form_embed.js keys off these exact attributes.
      f.setAttribute("data-layout", "{'id':'INLINE'}");
      f.setAttribute("data-trigger-type", "alwaysShow");
      f.setAttribute("data-trigger-value", "");
      f.setAttribute("data-activation-type", "alwaysActivated");
      f.setAttribute("data-activation-value", "");
      f.setAttribute("data-deactivation-type", "neverDeactivate");
      f.setAttribute("data-deactivation-value", "");
      f.setAttribute("data-form-id", id);
      f.setAttribute("data-layout-iframe-id", "inline-" + id);
      f.setAttribute("data-height", height);
      el.appendChild(f);
    }
    return slots.length;
  }

  function start() {
    if (mountForms() > 0) load("https://link.msgsndr.com/js/form_embed.js");

    // Call tracking, on every landing page including the thank-you pages -
    // that is where the Webflow originals load it too.
    load("https://backend.leadconnectorhq.com/appengine/loc/" + LOC + "/pool/" + POOL + "/number_pool.js");
    load("https://backend.leadconnectorhq.com/appengine/js/user_session.js");

    if (document.querySelector('[class*="elfsight-app-"]')) {
      load("https://elfsightcdn.com/platform.js", true);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
