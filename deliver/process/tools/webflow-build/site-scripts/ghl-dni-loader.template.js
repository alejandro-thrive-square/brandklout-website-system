// GoHighLevel DNI loader for a Webflow registered site script. TEMPLATE.
//
// Promoted 2026-09-23 from oceanic-dental/site-scripts/dni-loader.js (OceanicDNI 2.0.0, live).
// Copy it to deliver/brandklout/<client>/site-scripts/dni-loader.js, fill POOLS, minify with
// `npx terser@5 -c -m`, register with ../wf-register-script.mjs (header), bump the version on
// every change.
//
// One pool or several. number_pool.js starts initNumberPool() from a setTimeout, where
// document.currentScript is null, so it scans EVERY <script> whose src contains "number_pool" and
// asks each pool for a number. So only the FIRST pool is executed; every other pool is added as an
// inert <script type="text/plain"> that the browser never runs but the scan still finds. Two
// executed copies would run init twice. Each pool swaps only its own location's forwarding number.
//
// Consent: NOT gated. Brandklout's client instruction (2026-09-22): number pools run even without
// cookie consent. Webflow registered scripts cannot carry type="text/plain" (data-* attributes
// only), so if a client ever wants it gated, the script must poll window.Termly and act on
// Termly.getConsentState().advertising itself. Ask before gating.
//
// The number on the page must be typed with plain hyphens or dots: "(714) 841-0203". An en dash
// stops the text swap (the tel: link still swaps).
//
// Testing claims real pool numbers (sticky per visitor). Do not clear cookies per page.
(function () {
  var base = "https://backend.leadconnectorhq.com/appengine/";
  var POOLS = [
    // "loc/<locationId>/pool/<poolId>/number_pool.js",   // first entry is the executed one
  ];
  if (!POOLS.length) return;
  for (var i = 1; i < POOLS.length; i++) {
    var marker = document.createElement("script");
    marker.type = "text/plain";
    marker.src = base + POOLS[i];
    document.head.appendChild(marker);
  }
  [base + POOLS[0], base + "js/user_session.js"].forEach(function (src) {
    var s = document.createElement("script");
    s.src = src;
    s.async = false;
    document.head.appendChild(s);
  });
})();
