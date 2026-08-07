/* ==========================================================================
   Mason Park Dental — journey runtime, part 1 of 2 (BOOTSTRAP)
   Source Asana task GID: 1217040406855582

   Loaded in <head>. Defines window.MPD: the client constants and the queue
   that every chapter's inline <script> pushes its setup into.

   Plugins are deliberately NOT registered here. This runs inside <head> where
   document.body does not exist yet, and registering ScrollTrigger that early
   leaves its internals half-initialised. mpd-flush.js, at the end of <body>,
   does the registration.
   ========================================================================== */
window.MPD = (function () {
  "use strict";

  var queue = [];
  var flushed = false;

  var MPD = {
    /* ---------------------------------------------------------------- *
     * CLIENT CONSTANTS — the only block that changes per deployment.
     * ---------------------------------------------------------------- */

    // The practice's real public number (bestdentistinkatytx.com, every page).
    PUBLIC_PHONE: "(281) 769-8878",
    PUBLIC_PHONE_E164: "+12817698878",

    // ---- Call tracking is PER PAGE, not per client ---------------------
    // The outgoing vendor ran a different tracking number on each landing
    // page — (281) 767-8698 on Invisalign, (281) 688-1610 on the New Patient
    // Special — sharing one GTM container. Grand Mission's equivalent pages
    // do the same. Unifying these would destroy per-campaign call
    // attribution, so each page declares its own.
    //
    // Keyed by the page's data-page-key. `null` means "no tracking number
    // known for this page" and falls back to the public number.
    //
    // WARNING: the two numbers below were provisioned by the previous vendor
    // and their ownership is unconfirmed. Dial both before any spend starts.
    // See 01-content-intake/.tmp/vendor-originals.md
    TRACKING: {
      invisalign: { display: "(281) 767-8698", e164: "+12817678698" },
      "new-patient-special": { display: "(281) 688-1610", e164: "+12816881610" },
      // No vendor original exists for the thank-you page and Asana says
      // "Check GHL for proper tracking number" for it specifically.
      "thank-you": null,
    },

    // GHL inbound webhook that receives the lead. Not yet provisioned.
    WEBHOOK_URL: "{{GHL_INBOUND_WEBHOOK_URL}}",

    // Where a successful submit lands.
    THANK_YOU_URL: "../thank-you/index.html",

    BOOKING_URL: "https://www.flexbook.me/masonpark/1",
    MAP_URL:
      "https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450/@29.775949,-95.7512199,17z",

    /* ---------------------------------------------------------------- *
     * Runtime state
     * ---------------------------------------------------------------- */
    reduced: !!(
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ),
    ok: !!(window.gsap && window.ScrollTrigger),
  };

  /* ---- Which page is this? Set by <body data-page-key="..."> ---- */
  MPD.pageKey = function () {
    return (document.body && document.body.getAttribute("data-page-key")) || "";
  };

  // The thank-you page is shared by both landing pages, so it cannot have a
  // tracking number of its own baked in. The redirecting form appends ?src=,
  // letting it carry the originating page's number through and keep the call
  // attributed to the campaign that produced the lead. Validated against the
  // TRACKING keys so an arbitrary ?src= cannot inject a number.
  MPD.sourceKey = function () {
    var src = new URLSearchParams(window.location.search).get("src");
    return src && Object.prototype.hasOwnProperty.call(MPD.TRACKING, src) ? src : "";
  };

  MPD.tracking = function () {
    var own = MPD.TRACKING[MPD.pageKey()];
    if (own) return own;
    return MPD.TRACKING[MPD.sourceKey()] || null;
  };

  MPD.phone = function () {
    var t = MPD.tracking();
    return t ? t.display : MPD.PUBLIC_PHONE;
  };
  MPD.phoneE164 = function () {
    var t = MPD.tracking();
    return t ? t.e164 : MPD.PUBLIC_PHONE_E164;
  };

  /* ---- Split helpers, with graceful degradation if SplitText is absent ----
     Pass `build` when the lines carry a tween: it runs on the first split and
     again on every re-split, and whatever it returns is killed before the
     next one, so tweens never point at dead nodes after a resize reflow. */
  MPD.splitLines = function (el, build) {
    if (!el || !window.SplitText) return null;
    try {
      var opts = { type: "lines", mask: "lines", linesClass: "mpd-line", autoSplit: true };
      if (build) opts.onSplit = function (self) { return build(self); };
      return SplitText.create ? SplitText.create(el, opts) : new SplitText(el, opts);
    } catch (e) {
      try {
        return new SplitText(el, { type: "lines", linesClass: "mpd-line" });
      } catch (e2) {
        return null;
      }
    }
  };

  /* One-shot entrance splits. The hero headline is split once, tweened once on
     load, and then never needs to move again — so autoSplit is wrong for it.
     With autoSplit on, a late webfont triggers a re-split while the entrance
     timeline still holds the original line nodes, and SplitText throws
     "insertBefore ... node is no longer a child of this node" from inside the
     fonts.ready promise. Use this for entrances; use splitLines(el, build) for
     anything whose lines carry a scroll-bound tween that must survive reflow. */
  MPD.splitOnce = function (el) {
    if (!el || !window.SplitText) return null;
    try {
      var opts = { type: "lines", mask: "lines", linesClass: "mpd-line", autoSplit: false };
      return SplitText.create ? SplitText.create(el, opts) : new SplitText(el, opts);
    } catch (e) {
      return null;
    }
  };

  MPD.splitWords = function (el) {
    if (!el || !window.SplitText) return null;
    try {
      var opts = { type: "words", wordsClass: "mpd-word" };
      return SplitText.create ? SplitText.create(el, opts) : new SplitText(el, opts);
    } catch (e) {
      return null;
    }
  };

  /* ---- Chapter queue ----
     A chapter that throws is logged and skipped; the rest of the journey
     still runs, and its own content is already visible in the markup. */
  MPD.run = function (fn) {
    try {
      fn(MPD);
    } catch (e) {
      if (window.console && console.error) console.error("[MPD chapter]", e);
    }
  };
  MPD.add = function (fn) {
    if (flushed) MPD.run(fn);
    else queue.push(fn);
  };
  MPD.flushQueue = function () {
    flushed = true;
    queue.forEach(MPD.run);
    queue.length = 0;
  };

  /* ---- Arm the pre-paint guard as early as possible ----
     Only armed when GSAP is actually present. If the vendored scripts 404 the
     class is never added, so the hidden-state rules never bite and the page
     renders as plain, fully readable HTML. */
  if (MPD.ok && !MPD.reduced) {
    document.documentElement.classList.add("mpd-armed");
    // Failsafe: if mpd-flush.js never runs (blocked, parse error), un-arm so
    // nothing is left invisible.
    window.setTimeout(function () {
      if (!flushed) document.documentElement.classList.remove("mpd-armed");
    }, 3000);
  }

  return MPD;
})();
window.MPD.THANK_YOU_URL = "/thank-you";
