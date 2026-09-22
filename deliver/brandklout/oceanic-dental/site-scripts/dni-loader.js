// Oceanic Dental — GoHighLevel DNI loader (Webflow registered script "OceanicDNI").
//
// Both pools run on every page, and each swaps only its own location's forwarding number:
// Fountain Valley (714) 378-0085 and Huntington Beach (714) 841-0203. The footer and /book show
// both numbers, so a single pool left one of them unswapped.
//
// How two pools share one page: number_pool.js starts initNumberPool() from a setTimeout, where
// document.currentScript is null, so it falls back to scanning every <script> whose src contains
// "number_pool" and asks each pool for a number. So only ONE copy is executed (FV). HB is added as an
// inert <script type="text/plain"> that the browser never runs but the scan still finds. Two executed
// copies would run init twice. After the fetch, getNumber keys everything by the response's poolId and
// the location, so the pools don't clash.
//
// Consent: NOT gated, on purpose (the user, 2026-09-22). DNI runs on page load for every visitor. This
// departs from the kit's "tag GHL as advertising" rule (deliver/process/23-termly-ghl-consent).
// History: 1.1.0 waited for Termly consent; 1.2.0 ran one pool per page (HB only on
// /contact-huntington-beach); 2.0.0 runs both pools everywhere.
(function () {
  var base = "https://backend.leadconnectorhq.com/appengine/";
  var fv = base + "loc/8WmQ7YIU19Ypcyg8yYnJ/pool/aYgvG0JnqrbWrGyktHNv/number_pool.js"; // Fountain Valley
  var hb = base + "loc/v7GvWjHADYoI7Kae7xbU/pool/jDTseh7DnGa4HW0afYIj/number_pool.js"; // Huntington Beach
  var marker = document.createElement("script");
  marker.type = "text/plain";
  marker.src = hb;
  document.head.appendChild(marker);
  [fv, base + "js/user_session.js"].forEach(function (src) {
    var s = document.createElement("script");
    s.src = src;
    s.async = false;
    document.head.appendChild(s);
  });
})();
