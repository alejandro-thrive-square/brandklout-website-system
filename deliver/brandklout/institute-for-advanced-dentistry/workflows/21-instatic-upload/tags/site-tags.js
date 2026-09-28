/* src/scripts/000-brandklout-tags.js — Google Tag Manager and the GoHighLevel number pool.
 *
 * Instatic has no custom-head field and `importHtml` strips every <script>, so a tag that a
 * marketer would normally paste into <head> has to arrive as a code asset. Classic script assets
 * are emitted in path order ahead of the `site.js` module, so `000-` puts this first — as close to
 * the top of <head> as the platform allows, which is what GTM wants.
 *
 * Gated to the production host, exactly like the WordPress Google tag in `runtime.js`: the Railway
 * review link must not report into the practice's analytics or burn call-tracking pool numbers.
 *
 * CSP: every page carries `data-wz-embed`, so `brandklout.embed-origins` publishes it with
 * `script-src 'self' https: 'unsafe-inline' 'unsafe-eval'` and `connect-src 'self' https: wss:`.
 * Nothing here needs an origin adding to the plugin settings. See 21-instatic-upload.md.
 *
 * Source of truth for what is live. `push-tags.mjs` writes this file into the site shell.
 */
(function () {
  if (!/(^|\.)ifadentistry\.com$/i.test(location.hostname)) return
  // `staging.ifadentistry.com` matches the test above — it is a subdomain of the production zone.
  // The staging clone is a full copy of the site, so without this line every page a reviewer opens
  // reports into the practice's GTM and burns a number from the GoHighLevel pool. Excluded by name
  // rather than by an allow-list of production hosts, so a new production host keeps working.
  if (/^staging\./i.test(location.hostname)) return
  if (window.BrandkloutSiteTags) return
  window.BrandkloutSiteTags = '1.2.1'

  var GTM_ID = 'GTM-5XR78DN7'
  var GHL = [
    'https://backend.leadconnectorhq.com/appengine/loc/dSz8gLnp5vds5AZOMmuq/pool/wnVQAOzcvIVq0i4qqnZs/number_pool.js',
    'https://backend.leadconnectorhq.com/appengine/js/user_session.js',
  ]

  // --- Google Tag Manager, the vendor's own bootstrap ---------------------------------------
  ;(function (w, d, s, l, i) {
    w[l] = w[l] || []
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
    var f = d.getElementsByTagName(s)[0]
    var j = d.createElement(s)
    var dl = l != 'dataLayer' ? '&l=' + l : ''
    j.async = true
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl
    f.parentNode.insertBefore(j, f)
  })(window, document, 'script', 'dataLayer', GTM_ID)

  // The <noscript> iframe cannot be in a script asset — it is added once the body exists, where it
  // is inert for anyone running JavaScript and is the fallback for anyone who is not.
  function noscript() {
    if (!document.body || document.getElementById('brandklout-gtm-noscript')) return
    var ns = document.createElement('noscript')
    ns.id = 'brandklout-gtm-noscript'
    var f = document.createElement('iframe')
    f.src = 'https://www.googletagmanager.com/ns.html?id=' + GTM_ID
    f.height = '0'
    f.width = '0'
    f.style.display = 'none'
    f.style.visibility = 'hidden'
    ns.appendChild(f)
    document.body.insertBefore(ns, document.body.firstChild)
  }

  // --- GoHighLevel: the number pool, then the session script, in that order -------------------
  // `async = false` on a created element keeps insertion order; without it the pool script can run
  // after the session script and miss the attribution it is meant to read.
  /* GoHighLevel's call-tracking pair runs for EVERY visitor, consent or not.
     That is the client's instruction (2026-09-22, recorded in dr-nahlah's
     runbook 2026-09-22e: "The pools should be running even if the cookie
     consent is not accepted"), made knowingly. It was briefly tagged
     type="text/plain" data-categories="advertising" earlier the same day;
     do not put that back without a new client decision. The Termly banner
     still governs the GTM tags and ahrefs - just not call tracking.
     1.2.0 removed this function along with the hold and left the call below,
     so the asset threw `ghl is not defined` and neither the pool nor the
     <noscript> ran from 2026-09-22 to 2026-09-28. Restored in 1.2.1. */
  function ghl() {
    for (var i = 0; i < GHL.length; i++) {
      var s = document.createElement('script')
      s.src = GHL[i]
      s.async = false
      document.head.appendChild(s)
    }
  }

  ghl()
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', noscript)
  else noscript()
})()
