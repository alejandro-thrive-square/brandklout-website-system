// Oceanic Dental — GoHighLevel DNI pool loader (Webflow registered script "OceanicDNI").
// Fountain Valley's pool runs on every page except the Huntington Beach contact page, which gets
// Huntington Beach's pool. Only one number_pool.js may be on a page: it finds its pool from its src.
//
// Consent: NOT gated, on purpose. From 1.2.0 (2026-09-22) DNI runs on page load for every visitor,
// before any banner choice. The user asked for that because a gated pool never swaps for a visitor who
// ignores the banner. This departs from the kit's "tag GHL as advertising" rule
// (deliver/process/23-termly-ghl-consent) for this site only. 1.1.0 waited for
// Termly.getConsentState().advertising.
(function () {
  var base = "https://backend.leadconnectorhq.com/appengine/";
  var hb = /^\/contact-huntington-beach\/?$/.test(location.pathname);
  var pool = hb
    ? "loc/v7GvWjHADYoI7Kae7xbU/pool/jDTseh7DnGa4HW0afYIj" // Huntington Beach
    : "loc/8WmQ7YIU19Ypcyg8yYnJ/pool/aYgvG0JnqrbWrGyktHNv"; // Fountain Valley
  [base + pool + "/number_pool.js", base + "js/user_session.js"].forEach(function (src) {
    var s = document.createElement("script");
    s.src = src;
    s.async = false;
    document.head.appendChild(s);
  });
})();
