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
  if (window.BrandkloutSiteTags) return
  window.BrandkloutSiteTags = '1.0.0'

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
