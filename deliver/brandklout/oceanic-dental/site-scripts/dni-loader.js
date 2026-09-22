// Oceanic Dental — GoHighLevel DNI pool loader (Webflow registered script "OceanicDNI").
// Fountain Valley's pool runs on every page except the Huntington Beach contact page, which gets
// Huntington Beach's pool. Only one number_pool.js may be on a page: it finds its pool from its src.
//
// Consent: the kit (deliver/process/23-termly-ghl-consent) tags GHL's scripts type="text/plain"
// data-categories="advertising", but Webflow registered scripts accept data-* attributes only. So the
// loader gates itself: it injects the pool scripts once Termly reports advertising consent, on load
// for a returning visitor or on the Accept click. number_pool.js initialises immediately when the
// DOM is already ready, so loading after consent still swaps. No Termly, no consent, no DNI.
(function () {
  var done = false;
  function load() {
    var state;
    try { state = window.Termly.getConsentState(); } catch (e) {}
    if (done || !state || state.advertising !== true) return;
    done = true;
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
  }
  (function wait(n) {
    var T = window.Termly;
    if (T && T.on) {
      T.on("initialized", load);
      T.on("consent", load);
      load();
    } else if (n < 100) {
      setTimeout(function () { wait(n + 1); }, 100);
    }
  })(0);
})();
