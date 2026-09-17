/* Brandklout: Silktide Consent Manager loader (v1.0.0)
   Goes in the site-wide head, ABOVE Google Tag Manager, inside the block that
   `node consent-kit.mjs silktide-snippet <site>` renders from kit/silktide/sites.json.
   Docs: deliver/process/23-termly-ghl-consent/23-termly-ghl-consent.md ("Silktide")

   It does five things:
   1. Sets Google Consent Mode defaults to denied (and restores a saved choice at once).
   2. Loads the pinned Silktide build (jsDelivr, SRI-checked) and configures the banner.
   3. Loads the trackers that sit outside GTM only after the matching consent.
   4. Writes the consent record the GHL bridge reads (localStorage "bk.consent") on every real choice, in
      Termly's shape: { createdAt, value: { analytics, advertising, visitor_id (our receipt ID),
      document_version_id (policy date) } }.
   5. Opens the preferences panel from any link to "#consent-preferences".

   Per-site settings, set just before this runs:
     window.BrandkloutSilktide = { live, testHosts, policyVersion, privacyUrl, cookieUrl, position, iconPosition,
                                 theme, css, trackers } */
(function () {
  var S = window.BrandkloutSilktide || {};
  var w = window, d = document;
  if (w.BrandkloutSilktideLoader) return;
  w.BrandkloutSilktideLoader = "1.0.0";

  var VENDOR = "https://cdn.jsdelivr.net/gh/silktide/consent-manager@2.0.1/silktide-consent-manager";
  var SRI_JS = "sha384-5Pt34uiIbCsvfiiZXoLi4HRf/YBXjr9c8e+gYeVo9smUaInNHYVtc8NZ8wUnXJIq";
  var SRI_CSS = "sha384-EdMq+R+YOnsbelo08wPenoTlnxbAyxI11NMIxzugx/qAsbh64KcOkqxYqq6pfvO/";
  var RECORD = "bk.consent";
  var ADS = ["ad_storage", "ad_user_data", "ad_personalization"];
  var trackers = S.trackers || {};
  var loaded = {};

  function load(list, id) {
    (list || []).forEach(function (t) {
      if (d.querySelector('script[src="' + t.src + '"]')) return;
      var s = d.createElement("script");
      s.src = t.src;
      s.async = true;
      for (var k in t.attrs || {}) s.setAttribute(k, t.attrs[k]);
      d.head.appendChild(s);
      loaded[id] = true;
    });
  }

  // Until the site is switched live, the banner only runs on the test hosts; everywhere else the
  // trackers load exactly as they did before the banner existed.
  var on = S.live === true || (S.testHosts || []).indexOf(location.hostname) !== -1;
  if (!on) { load(trackers.analytics, "analytics"); load(trackers.advertising, "advertising"); return; }

  function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function choice(id) { return get("stcm.consent." + id) === "true"; }
  var gpc = navigator.globalPrivacyControl === true;

  // 1. Consent Mode. Silktide calls the global gtag() on every change, so it must exist.
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  var consent = { analytics_storage: "denied", functionality_storage: "granted", security_storage: "granted", wait_for_update: 500 };
  ADS.forEach(function (k) { consent[k] = "denied"; });
  w.gtag("consent", "default", consent);
  var saved = {};
  if (choice("analytics")) saved.analytics_storage = "granted";
  if (choice("advertising") && !gpc) ADS.forEach(function (k) { saved[k] = "granted"; });
  if (Object.keys(saved).length) w.gtag("consent", "update", saved);

  // 4. The record the GHL bridge reads. Written only when the stored choice differs from the record,
  // so page loads (which re-run Silktide's callbacks) never refresh the timestamp.
  var timer;
  function stamp() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var old = null;
      try { old = JSON.parse(get(RECORD) || "null"); } catch (e) {}
      if (get("stcm.hasConsented") === null) {
        if (old) { try { localStorage.removeItem(RECORD); } catch (e) {} w.dispatchEvent(new Event("bk:consent")); }
        return;
      }
      var prev = (old && old.value) || {};
      var now = { analytics: choice("analytics"), advertising: choice("advertising") && !gpc };
      if (old && prev.analytics === now.analytics && prev.advertising === now.advertising) return;
      now.visitor_id = prev.visitor_id ||
        (w.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
      now.document_version_id = S.policyVersion || "";
      try { localStorage.setItem(RECORD, JSON.stringify({ createdAt: new Date().toISOString(), value: now })); } catch (e) {}
      w.dispatchEvent(new Event("bk:consent"));
    }, 0);
  }

  // 3. Revoking a consent whose trackers already ran on this page reloads it, as Silktide does for its own scripts.
  function type(id, label, description, gtag) {
    return {
      id: id, label: label, description: description, gtag: gtag,
      onAccept: function () { load(trackers[id], id); stamp(); },
      onReject: function () { stamp(); if (loaded[id]) setTimeout(function () { location.reload(); }, 150); }
    };
  }

  var links = (S.privacyUrl ? '<a href="' + S.privacyUrl + '">Privacy Policy</a>' : "") +
    (S.privacyUrl && S.cookieUrl ? " and " : "") +
    (S.cookieUrl ? '<a href="' + S.cookieUrl + '">Cookie Policy</a>' : "");
  var types = [
    { id: "essential", label: "Essential", required: true, gtag: ["functionality_storage", "security_storage"],
      description: "<p>Needed for the site to work: page security, forms and your privacy choices. Always on.</p>" },
    type("analytics", "Analytics",
      "<p>Helps us understand how visitors use the site so we can improve it.</p>", "analytics_storage")
  ];
  if (!gpc) {
    types.push(type("advertising", "Advertising",
      "<p>Call tracking and measurement of our ads. Turning this off also opts you out of the sale or sharing of your personal information.</p>", ADS));
  }

  function init() {
    w.silktideConsentManager.init({
      consentTypes: types,
      prompt: { position: S.position || "bottomLeft" },
      icon: { position: S.iconPosition || "bottomLeft" },
      text: {
        prompt: {
          description: "<p>We use cookies to run this site, understand how it is used and measure our advertising." +
            (links ? " Read our " + links + "." : "") + "</p>" +
            (gpc ? "<p>Your browser sent a Global Privacy Control signal, so advertising cookies stay off.</p>" : ""),
          acceptAllButtonText: "Accept all",
          rejectNonEssentialButtonText: "Reject non-essential",
          preferencesButtonText: "Preferences"
        },
        preferences: {
          title: "Your privacy choices",
          description: "<p>Choose which cookies we may use. You can change this at any time from the cookie icon or the " +
            "Consent Preferences link in the footer." + (links ? " Read our " + links + "." : "") + "</p>",
          saveButtonText: "Save and close"
        }
      }
    });
    stamp();
  }

  // 2. Vendor files, then the theme and the banner.
  var css = d.createElement("link");
  css.rel = "stylesheet"; css.href = VENDOR + ".css"; css.integrity = SRI_CSS; css.crossOrigin = "anonymous";
  d.head.appendChild(css);
  // Theme variables, no vendor branding, then the site's own layout fixes (e.g. clearing a widget's corner).
  var style = d.createElement("style"), rules = "";
  for (var k in S.theme || {}) rules += "--" + k + ":" + S.theme[k] + ";";
  style.textContent = "#stcm-wrapper{" + rules + "}" +
    "#stcm-wrapper .stcm-credit-link,#stcm-wrapper a.stcm-logo{display:none!important}" + (S.css || "");
  d.head.appendChild(style);
  var js = d.createElement("script");
  js.src = VENDOR + ".js"; js.integrity = SRI_JS; js.crossOrigin = "anonymous";
  js.onload = init;
  d.head.appendChild(js);

  // 5. Footer link.
  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href="#consent-preferences"]');
    var m = w.silktideConsentManager && w.silktideConsentManager.getInstance();
    if (!a || !m) return;
    e.preventDefault();
    m.toggleModal(true);
  });
})();
