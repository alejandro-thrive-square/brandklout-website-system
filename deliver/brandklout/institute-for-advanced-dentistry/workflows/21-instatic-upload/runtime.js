/* IFA clone runtime — replays what WordPress put in <head> and every <script> it served.
 *
 * Instatic strips all scripts at import and has no custom-head field, so prepare-wp.mjs left:
 *   - <body data-wz-head="id id …">  the page's head tags and head scripts, in document order
 *   - <x-wz-script hidden data-wz-s="id">  one placeholder where each body <script> stood
 * and build-wp.mjs puts the dictionary `D` (id -> item) above this code.
 *
 * Each placeholder is replaced by a real classic <script> carrying the original code or src, so
 * it runs in global scope with document.currentScript set, where WordPress ran it. This asset is
 * a module, so it runs after parsing and BEFORE DOMContentLoaded: the listeners Motion.page
 * (body{visibility:hidden} until DOMContentLoaded) and Bricks register still fire. Scripts that
 * WordPress marked `defer` run after the rest, in order. Items flagged `g` (Google tag, Site Kit)
 * run only on the production host, so the review link never reports into the practice's analytics.
 *
 * Needs `'unsafe-inline'`: the embed-origins plugin grants it (compatible policy) on every page,
 * because every page carries data-wz-embed. See 21-instatic-upload.md.
 */
var PROD = /(^|\.)ifadentistry\.com$/i.test(location.hostname)
var deferred = []

// Off the production host the Google tag never loads, but WordPress's own inline code still
// calls gtag() (the thank-you page's conversion event). A queue-only stub keeps those calls from
// throwing; nothing reads the queue, so nothing is reported.
if (!PROD) {
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== 'function') {
    window.gtag = function () {
      window.dataLayer.push(arguments)
    }
  }
}

function setAttrs(el, a) {
  if (!a) return
  for (var k in a) {
    if (k === 'src') continue
    try {
      el.setAttribute(k, a[k])
    } catch (e) {}
  }
}

function headHtml(it) {
  var t = document.createElement('template')
  t.innerHTML = it.h
  var nodes = Array.prototype.slice.call(t.content.childNodes)
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i]
    if (n.nodeType === 1) {
      // og:image and friends must be absolute; the media library gives a same-origin path.
      var c = n.getAttribute('content')
      if (c && c.charAt(0) === '/' && c.charAt(1) !== '/') n.setAttribute('content', location.origin + c)
    }
    document.head.appendChild(n)
  }
}

function make(it) {
  var s = document.createElement('script')
  setAttrs(s, it.a)
  if (it.t === 'src') s.src = it.u
  else s.text = it.c
  return s
}

function place(s, anchor) {
  if (anchor && anchor.parentNode) anchor.parentNode.replaceChild(s, anchor)
  else document.head.appendChild(s)
}

function run(id, anchor) {
  var it = D[id]
  if (!it || (it.g && !PROD)) {
    if (anchor && anchor.parentNode) anchor.parentNode.removeChild(anchor)
    return
  }
  if (it.t === 'html') {
    headHtml(it)
    return
  }
  // `defer` only ever meant something on a script with a src; those became local code here.
  if (it.t === 'js' && it.f && it.a && Object.prototype.hasOwnProperty.call(it.a, 'defer')) {
    deferred.push([it, anchor])
    return
  }
  place(make(it), anchor)
}

var headIds = (document.body.getAttribute('data-wz-head') || '').split(/\s+/)
for (var i = 0; i < headIds.length; i++) if (headIds[i]) run(headIds[i], null)
var holders = document.querySelectorAll('x-wz-script[data-wz-s]')
for (var j = 0; j < holders.length; j++) run(holders[j].getAttribute('data-wz-s'), holders[j])
for (var k = 0; k < deferred.length; k++) place(make(deferred[k][0]), deferred[k][1])
