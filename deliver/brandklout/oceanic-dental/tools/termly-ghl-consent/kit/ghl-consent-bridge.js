/* Brandklout: Termly -> GoHighLevel consent bridge (v2.2.0)
   Copies each visitor's Termly choice into the hidden privacy_* fields of every embedded GHL form,
   survey or calendar, through the iframe URL (GHL prefills fields from matching query keys).
   Source of truth for Webflow (inline, footer) and Instatic (site script asset). Docs:
   deliver/process/tools/termly-ghl-consent/termly-ghl-consent.md
   Per-site overrides, optional, set before this runs:
     window.BrandkloutConsentConfig = { marketingDisclosureVersion: "YYYY-MM-DD", privacyPolicyVersion: "" } */
(function () {
  if (window.BrandkloutConsentBridge) return;
  window.BrandkloutConsentBridge = "2.2.0";

  var custom = window.BrandkloutConsentConfig || {};
  var CONFIG = {
    // Written to marketing_disclosure_version. Bump it when the SMS/email consent wording on the form changes.
    marketingDisclosureVersion: custom.marketingDisclosureVersion || "2026-09-16",
    // Written to privacy_policy_version. Empty uses the document version ID Termly reports.
    privacyPolicyVersion: custom.privacyPolicyVersion || ""
  };

  var FORM_PATH = /\/widget\/(form|survey|booking)\//;

  // Termly's saved record for this visitor, or null before they choose.
  function termlyRecord() {
    try {
      var cache = JSON.parse(localStorage.getItem("TERMLY_API_CACHE") || "{}");
      var entry = cache.TERMLY_COOKIE_CONSENT;
      return entry && entry.value ? { value: entry.value, createdAt: entry.createdAt } : null;
    } catch (e) { return null; }
  }

  function termlyState() {
    try { return window.Termly.getConsentState(); } catch (e) { return null; }
  }

  // Until the visitor answers the banner (or while Termly is not installed), the form records the
  // same values a Decline click would.
  function values() {
    var record = termlyRecord();
    var saved = record ? record.value : {};
    var state = record ? (termlyState() || saved) : {};
    var gpc = navigator.globalPrivacyControl === true || saved.gpc === true;
    var optOut = gpc || state.do_not_sell === true || state.advertising !== true;
    var ads = state.advertising === true && !optOut ? "granted" : "denied";

    // Every key is a GHL custom field key; GHL prefills a field from the query parameter of the same name.
    var p = "privacy_";
    var v = { marketing_disclosure_version: CONFIG.marketingDisclosureVersion };
    v[p + "analytics_consent"] = state.analytics === true ? "granted" : "denied";
    v[p + "advertising_consent"] = v[p + "ad_user_data_consent"] = v[p + "ad_personalization_consent"] = ads;
    v[p + "sale_share_opt_out"] = String(optOut);
    v[p + "gpc_detected"] = String(gpc);
    v[p + "consent_timestamp_utc"] = record && record.createdAt ? new Date(record.createdAt).toISOString() : "";
    v[p + "policy_version"] = CONFIG.privacyPolicyVersion || String(saved.document_version_id || "");
    v[p + "cmp_receipt_id"] = saved.visitor_id || (saved.visitor && saved.visitor.uuid) || "";
    v[p + "source_url"] = location.origin + location.pathname;
    return v;
  }

  function withConsent(src) {
    var url = new URL(src, location.href);
    var v = values();
    for (var name in v) {
      if (v[name]) url.searchParams.set(name, v[name]); else url.searchParams.delete(name);
    }
    return url.toString();
  }

  function update() {
    var frames = document.querySelectorAll("iframe");
    for (var i = 0; i < frames.length; i++) {
      var src = frames[i].getAttribute("src") || "";
      if (!FORM_PATH.test(src)) continue;
      var next = withConsent(src);
      if (src !== next) frames[i].setAttribute("src", next);
    }
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; update(); }, 50);
  }

  update();
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["src"]
  });

  // Termly loads async; re-run when it is ready and each time the visitor changes their choice.
  (function hook(tries) {
    var termly = window.Termly;
    if (termly && termly.on) {
      termly.on("initialized", schedule);
      termly.on("consent", schedule);
      schedule();
    } else if (tries < 100) {
      setTimeout(function () { hook(tries + 1); }, 100);
    }
  })(0);
})();
