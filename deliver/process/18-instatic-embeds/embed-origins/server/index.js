/**
 * Embed Origins — server entrypoint.
 *
 * Instatic publishes every public page with a locked-down Content-Security-
 * Policy carrying `frame-src 'none'` and `script-src 'self' '<importmap-sha>'`.
 * That is a good default, and it makes every third-party embed impossible:
 * a booking widget, a review widget or a HighLevel form is refused by the
 * browser no matter how the markup gets onto the page.
 *
 * There is no configuration escape in the host. The server reads no CSP env
 * var, there is no site setting, and `frame-src` is only ever widened by a
 * module's `cspSources` contribution — of which `base.video` (YouTube) is the
 * only one shipped. Plugin MODULES cannot contribute either: `moduleAdapter.ts`
 * rebuilds the render output as `{ html, css, js }` and drops `cspSources` on
 * the floor.
 *
 * The `publish.html` filter is the way through, and it is a supported, public
 * part of the plugin API rather than a trick:
 *
 *   - the CSP for a PUBLIC page lives only in a `<meta http-equiv>` tag.
 *     `server/securityHeaders.ts` sends a `content-security-policy` HEADER for
 *     `/admin` paths only, so there is no header to contradict the meta tag;
 *   - `applyPublishedHtmlPipeline` runs `publish.html` LAST — after
 *     `injectFrontendAssets` and `injectModuleScripts` have done their own CSP
 *     rewriting — and returns the filter's string verbatim, with no
 *     re-validation and no CSP re-derivation.
 *
 * So rewriting the meta tag here IS the page's final policy.
 *
 * Nothing is widened unless an operator types an origin into plugin settings:
 * with empty settings this filter returns the HTML byte-for-byte unchanged.
 *
 * Requires: cms.hooks
 */

/** The exact tag the publisher emits (`src/core/publisher/cspPlan.ts`). */
var CSP_META_RE =
  /(<meta http-equiv="Content-Security-Policy"\s+content=")([^"]*)("\s*\/?>)/i

/**
 * Origins are author-supplied, so validate rather than trust. A stray line, a
 * trailing slash or a pasted full URL must not be able to inject a `;` and
 * rewrite unrelated directives.
 */
var ORIGIN_RE = /^https?:\/\/[a-z0-9.-]+(?::[0-9]{1,5})?$/i

function parseOrigins(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return []
  var out = []
  var seen = {}
  var lines = raw.split(/[\s,]+/)
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim().replace(/\/+$/, '')
    if (line.length === 0) continue
    if (!ORIGIN_RE.test(line)) continue
    var key = line.toLowerCase()
    if (seen[key]) continue
    seen[key] = true
    out.push(line)
  }
  return out
}

/** `"a 'self'; b 'none'"` -> `{ a: ["'self'"], b: ["'none'"] }`, order kept. */
function parseCsp(text) {
  var order = []
  var map = {}
  var parts = text.split(';')
  for (var i = 0; i < parts.length; i++) {
    var chunk = parts[i].trim()
    if (chunk.length === 0) continue
    var bits = chunk.split(/\s+/)
    var name = bits.shift()
    if (!name) continue
    if (!map[name]) order.push(name)
    map[name] = bits
  }
  return { order: order, map: map }
}

function serializeCsp(csp) {
  var out = []
  for (var i = 0; i < csp.order.length; i++) {
    var name = csp.order[i]
    var sources = csp.map[name]
    out.push(sources.length ? name + ' ' + sources.join(' ') : name)
  }
  return out.join('; ') + ';'
}

/**
 * Add origins to one directive.
 *
 * `'none'` is not a source that can be widened — it means "nothing", and
 * `frame-src 'none' https://x` is invalid — so it is REPLACED, exactly as the
 * host's own `addCspSources` does when a YouTube node lifts `frame-src`.
 * A directive that is absent is created, because an absent `frame-src` falls
 * back to `default-src 'self'`, which would still refuse the embed.
 */
function widen(csp, directive, origins) {
  if (origins.length === 0) return false
  var current = csp.map[directive]
  if (!current) {
    /* A directive that is ABSENT is not empty — it falls back to `default-src`.
       Creating it from just the new origins therefore SILENTLY REVOKES whatever
       default-src was granting: adding a vendor to `font-src` on a page that had
       none produced `font-src https://vendor` and the site's own webfonts were
       refused, on that page only, with the fonts still listed in the CSS and
       nothing in the markup to explain it. Seed from the fallback first. */
    csp.order.push(directive)
    var created = []
    var seenCreated = {}
    // Deduped like the widen path below: the same origin arrives twice when a
    // site script is ALSO found on the page by auto-trust, and a doubled source
    // makes the second publish differ from the first.
    var sources = (csp.map['default-src'] || ["'self'"]).concat(origins)
    for (var f = 0; f < sources.length; f++) {
      if (sources[f] === "'none'" || seenCreated[sources[f]]) continue
      seenCreated[sources[f]] = true
      created.push(sources[f])
    }
    csp.map[directive] = created
    return true
  }
  var next = []
  var seen = {}
  for (var i = 0; i < current.length; i++) {
    if (current[i] === "'none'") continue
    if (seen[current[i]]) continue
    seen[current[i]] = true
    next.push(current[i])
  }
  var changed = current.length !== next.length
  for (var j = 0; j < origins.length; j++) {
    if (seen[origins[j]]) continue
    seen[origins[j]] = true
    next.push(origins[j])
    changed = true
  }
  csp.map[directive] = next
  return changed
}

/* ---------------------------------------------------------------------------
 * SHA-256, in pure JS.
 *
 * CSP's other way to trust an inline script is its hash: `'sha256-<base64>'`
 * over the exact bytes between `<script>` and `</script>`. That is how the host
 * trusts its own importmap (`createBaseCspPlan`, `importmapSha`), and it is what
 * lets a pasted vendor snippet run WITHOUT `'unsafe-inline'` — which would
 * trust every inline script on every page forever, including one injected by
 * something else.
 *
 * Written out longhand because this runs inside the QuickJS-WASM sandbox: no
 * `crypto`, no `Buffer`, no `TextEncoder`. ~30 pages per publish, a few scripts
 * each, so the cost is irrelevant.
 * ------------------------------------------------------------------------ */

var SHA_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

/** UTF-8 encode. Surrogate pairs are combined; a lone surrogate becomes U+FFFD,
 *  which is what every well-behaved encoder does and keeps the hash defined. */
function utf8Bytes(str) {
  var out = []
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff) {
      var next = i + 1 < str.length ? str.charCodeAt(i + 1) : 0
      if (next >= 0xdc00 && next <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (next - 0xdc00)
        i++
      } else {
        c = 0xfffd
      }
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      c = 0xfffd
    }
    if (c < 0x80) {
      out.push(c)
    } else if (c < 0x800) {
      out.push(0xc0 | (c >> 6), 0x80 | (c & 63))
    } else if (c < 0x10000) {
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    } else {
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    }
  }
  return out
}

var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64(bytes) {
  var out = ''
  for (var i = 0; i < bytes.length; i += 3) {
    var b0 = bytes[i]
    var b1 = i + 1 < bytes.length ? bytes[i + 1] : 0
    var b2 = i + 2 < bytes.length ? bytes[i + 2] : 0
    out += B64.charAt(b0 >> 2)
    out += B64.charAt(((b0 & 3) << 4) | (b1 >> 4))
    out += i + 1 < bytes.length ? B64.charAt(((b1 & 15) << 2) | (b2 >> 6)) : '='
    out += i + 2 < bytes.length ? B64.charAt(b2 & 63) : '='
  }
  return out
}

function rotr(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0 }

/** Base64 SHA-256 of a string's UTF-8 bytes — the value CSP wants inside
 *  `'sha256-…'`. */
function sha256Base64(text) {
  var bytes = utf8Bytes(text)
  var bitLen = bytes.length * 8
  bytes = bytes.slice()
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  // Length is a 64-bit big-endian count of BITS. The high word is written from
  // the byte count so inputs past 2^32 bits stay correct rather than silently
  // wrapping; nothing here is that big, but a hash that is wrong only for large
  // inputs is the worst kind of wrong.
  var hi = Math.floor(bytes.length === 0 ? 0 : bitLen / 4294967296)
  var lo = bitLen >>> 0
  bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255)
  bytes.push((lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255)

  var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
           0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]
  var w = new Array(64)

  for (var off = 0; off < bytes.length; off += 64) {
    for (var t = 0; t < 16; t++) {
      w[t] = ((bytes[off + t * 4] << 24) | (bytes[off + t * 4 + 1] << 16) |
              (bytes[off + t * 4 + 2] << 8) | bytes[off + t * 4 + 3]) >>> 0
    }
    for (var t2 = 16; t2 < 64; t2++) {
      var s0 = (rotr(w[t2 - 15], 7) ^ rotr(w[t2 - 15], 18) ^ (w[t2 - 15] >>> 3)) >>> 0
      var s1 = (rotr(w[t2 - 2], 17) ^ rotr(w[t2 - 2], 19) ^ (w[t2 - 2] >>> 10)) >>> 0
      w[t2] = (((w[t2 - 16] + s0) >>> 0) + ((w[t2 - 7] + s1) >>> 0)) >>> 0
    }
    var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7]
    for (var j = 0; j < 64; j++) {
      var S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0
      var ch = ((e & f) ^ (~e & g)) >>> 0
      var temp1 = (hh + S1 + ch + SHA_K[j] + w[j]) >>> 0
      var S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0
      var maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0
      var temp2 = (S0 + maj) >>> 0
      hh = g; g = f; f = e
      e = (d + temp1) >>> 0
      d = c; c = b; b = a
      a = (temp1 + temp2) >>> 0
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0
    h[3] = (h[3] + d) >>> 0; h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0
    h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0
  }

  var digest = []
  for (var k = 0; k < 8; k++) {
    digest.push((h[k] >>> 24) & 255, (h[k] >>> 16) & 255, (h[k] >>> 8) & 255, h[k] & 255)
  }
  return base64(digest)
}
/* ---------------------------------------------------------------------------
 * Deriving the policy from the page itself.
 *
 * The settings boxes ask an operator to declare, ahead of time, every origin
 * the site may ever load. That is fine for one review widget and wrong for the
 * thing this plugin is actually for: a marketer pasting a vendor snippet on a
 * Tuesday, who has no idea what an origin is and whose embed silently does
 * nothing until someone else edits a settings field.
 *
 * So with `autoTrust` on (the default), the filter READS the published page and
 * grants exactly what that page turned out to contain:
 *
 *   - `<iframe src>` on another origin        -> frame-src <origin>
 *   - `<script src>` on another origin        -> script-src <origin>
 *   - an inline `<script>`                    -> script-src 'sha256-<hash>'
 *
 * and, for each trusted SCRIPT origin, the directives a widget's own script
 * needs once it is running in our document: `connect-src` (its API calls),
 * `style-src` and `font-src` (the stylesheet and webfont it injects). A FRAME
 * origin gets none of those — the framed document carries its own policy and
 * cannot reach into this one.
 *
 * The trust model is the one the author already exercised: an editor pasted
 * this, on this page. It is per-PAGE, never site-wide, so a widget on /contact
 * cannot widen /veneers. It is far narrower than the platform it is imitating —
 * Webflow serves no CSP at all — and narrower than `'unsafe-inline'`, which
 * would trust every inline script forever, including one that arrives later by
 * a route nobody intended.
 *
 * Turn `autoTrust` off and the plugin behaves exactly as v1.1.0 did: nothing is
 * granted that an operator did not type.
 * ------------------------------------------------------------------------ */

var SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi
var IFRAME_RE = /<iframe\b([^>]*)>/gi
var CANONICAL_RE = /<link\b[^>]*\brel\s*=\s*["']?canonical["']?[^>]*>/i

var ATTR_SRC_RE = /\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
var ATTR_TYPE_RE = /\btype\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
var ATTR_HREF_RE = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i

/**
 * Read one attribute out of a tag's attribute text.
 *
 * The regexes are LITERALS rather than `new RegExp('\b' + name + …)`. A string-
 * built pattern needs every backslash doubled, and when one is lost the pattern
 * still compiles — `'\b'` becomes a backspace character and `'\s'` becomes the
 * letter s — so `attr()` quietly returns '' for every tag and the whole derived
 * policy is empty while every test that only looks at inline hashes still passes.
 */
function attr(attrs, which) {
  var re = which === 'src' ? ATTR_SRC_RE : which === 'type' ? ATTR_TYPE_RE : ATTR_HREF_RE
  var m = re.exec(attrs)
  if (!m) return ''
  var value = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4]
  return (value || '').trim()
}

/**
 * Origin of an absolute or protocol-relative URL; '' for anything relative.
 * A protocol-relative `//host/x` resolves against the page, and every published
 * page here is https, so it is read as https.
 */
function originOf(url) {
  var m = /^(https?:)?\/\/([^\/?#\s]+)/i.exec(String(url || '').trim())
  if (!m) return ''
  var scheme = m[1] ? m[1].toLowerCase() : 'https:'
  return scheme + '//' + m[2].toLowerCase()
}

/** Types a browser EXECUTES. `application/ld+json`, `importmap` and friends are
 *  data — CSP does not gate them, and hashing them would only pad the policy. */
function isExecutableScript(type) {
  var t = String(type || '').toLowerCase().split(';')[0].trim()
  return t === '' || t === 'module' || t === 'text/javascript' ||
    t === 'application/javascript' || t === 'text/ecmascript' ||
    t === 'application/ecmascript' || t === 'text/jscript'
}

function push(list, seen, value) {
  if (!value || seen[value]) return
  seen[value] = true
  list.push(value)
}

/**
 * What this page needs, read off the page. `selfOrigin` (from the canonical
 * link) is skipped everywhere: it is already covered by `'self'`, and listing it
 * would make every policy longer for no gain.
 */
function derivePageSources(html, selfOrigin) {
  var frames = [], scripts = [], hashes = []
  var seenFrame = {}, seenScript = {}, seenHash = {}
  var m

  IFRAME_RE.lastIndex = 0
  while ((m = IFRAME_RE.exec(html))) {
    var frameOrigin = originOf(attr(m[1], 'src'))
    if (frameOrigin && frameOrigin !== selfOrigin) push(frames, seenFrame, frameOrigin)
  }

  SCRIPT_RE.lastIndex = 0
  while ((m = SCRIPT_RE.exec(html))) {
    var attrs = m[1]
    var body = m[2]
    var src = attr(attrs, 'src')
    if (src) {
      var scriptOrigin = originOf(src)
      if (scriptOrigin && scriptOrigin !== selfOrigin) push(scripts, seenScript, scriptOrigin)
      continue
    }
    if (!isExecutableScript(attr(attrs, 'type'))) continue
    if (body.length === 0) continue
    /* The hash is over the raw source between the tags. `<script>` is a raw-text
       element, so no entity decoding happens on the way to the browser and what
       is in the file is exactly what is hashed. */
    push(hashes, seenHash, "'sha256-" + sha256Base64(body) + "'")
  }

  return { frames: frames, scripts: scripts, hashes: hashes }
}

function selfOriginOf(html) {
  var link = CANONICAL_RE.exec(html)
  return link ? originOf(attr(link[0], 'href')) : ''
}

/* ---------------------------------------------------------------------------
 * Compatible mode.
 *
 * Deriving the policy from the page covers what the MARKUP says. It cannot
 * cover what a vendor's JavaScript does once it runs, and that is where real
 * integrations live: Elfsight's script arrives from `elfsightcdn.com` and then
 * fetches its configuration from `core.service.elfsight.com`, an address that
 * appears nowhere in the page. Every widget of that shape loads, does nothing,
 * and reports one refusal in a console no marketer is reading.
 *
 * There is no way to predict those hosts, so compatible mode stops trying: a
 * page that CONTAINS an embed may load anything over https. That is the policy
 * Webflow ships (which is to say: no policy at all), reached deliberately and
 * with two things kept back.
 *
 *   - It is PER PAGE. A page with no Embed block on it keeps the strict policy
 *     byte for byte. On this site that is most of them.
 *   - `default-src` is untouched, so anything not named here still falls back to
 *     `'self'`.
 *
 * What it does give up, and it should be said plainly: on those pages, script
 * hashes stop being the gate. A hash and `'unsafe-inline'` cannot coexist —
 * a browser that sees any hash in `script-src` IGNORES `'unsafe-inline'`
 * entirely — so a mode whose job is "a pasted snippet works" has to drop the
 * hashes and take `'unsafe-inline'`, which also covers the `onclick=` handlers
 * that strict mode cannot run. `'unsafe-eval'` is here for the same reason:
 * enough widget bundles use `new Function` that leaving it out reintroduces
 * exactly the silent half-failure this mode exists to end.
 *
 * Strict mode remains one setting away and gives up none of it.
 * ------------------------------------------------------------------------ */

var EMBED_MARKER = /<[a-z]+[^>]*\bdata-wz-embed\b/i

/** Directives a pasted widget can need, and what "anything over https" means
 *  for each. `data:`/`blob:` ride along where a widget legitimately builds its
 *  own assets in the browser (icon fonts, object URLs for media). */
var COMPATIBLE = [
  ['script-src', ["'self'", 'https:', "'unsafe-inline'", "'unsafe-eval'"]],
  ['frame-src', ["'self'", 'https:']],
  ['connect-src', ["'self'", 'https:', 'wss:']],
  ['style-src', ["'self'", 'https:', "'unsafe-inline'"]],
  ['font-src', ["'self'", 'https:', 'data:']],
  ['img-src', ["'self'", 'https:', 'data:', 'blob:']],
  ['media-src', ["'self'", 'https:', 'data:', 'blob:']],
]

function applyCompatible(csp) {
  var changed = false
  for (var i = 0; i < COMPATIBLE.length; i++) {
    var name = COMPATIBLE[i][0]
    var want = COMPATIBLE[i][1]
    var current = csp.map[name]
    var next = []
    var seen = {}
    for (var j = 0; j < want.length; j++) {
      if (seen[want[j]]) continue
      seen[want[j]] = true
      next.push(want[j])
    }
    if (current) {
      for (var k = 0; k < current.length; k++) {
        var source = current[k]
        if (source === "'none'") continue
        /* Hashes are dropped ON PURPOSE: leaving one in makes the browser
           ignore `'unsafe-inline'`, and a pasted inline script would still be
           refused — the exact failure this mode exists to remove. The host's
           own importmap then runs under `'unsafe-inline'` like everything
           else. */
        if (source.indexOf("'sha256-") === 0 || source.indexOf("'sha384-") === 0 ||
            source.indexOf("'sha512-") === 0) continue
        if (seen[source]) continue
        seen[source] = true
        next.push(source)
      }
    } else {
      csp.order.push(name)
    }
    if (!current || current.join(' ') !== next.join(' ')) changed = true
    csp.map[name] = next
  }
  return changed
}

/* ---------------------------------------------------------------------------
 * Site scripts.
 *
 * Some tools belong on EVERY page — the accessibility widget is the first — and
 * the platform gives them no way in: `importHtml` strips a head `<script>`, and
 * a runtime injection from the site bundle is refused by `script-src 'self'`.
 * This filter already runs last over every page, so it adds the tag here and
 * grants its host in the same pass, which is the only order that works: a tag
 * without the grant is refused, a grant without the tag loads nothing.
 *
 * The host gets script-src plus connect-src, style-src and font-src, exactly
 * what an auto-trusted script origin gets below. Sienna needs three of the four
 * from `cdn.jsdelivr.net`: the script, a `fetch` of its locale JSON, and the
 * OpenDyslexic webfont.
 *
 * URLs are validated, not escaped. `&` is the one character written as an
 * entity, because it is legal in a URL and means something in an attribute.
 * ------------------------------------------------------------------------ */

var SCRIPT_URL_RE = /^https:\/\/[a-z0-9.-]+(?::[0-9]{1,5})?\/[^\s"'<>`\\]*$/i
var HEAD_CLOSE_RE = /<\/head\s*>/i

function parseScriptUrls(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return []
  var out = []
  var seen = {}
  var lines = raw.split(/\s+/)
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (line.length === 0 || !SCRIPT_URL_RE.test(line) || seen[line]) continue
    seen[line] = true
    out.push(line)
  }
  return out
}

/** Add a tag per URL just before `</head>`, skipping any already on the page so
 *  a republish of a published page never doubles it. */
function injectSiteScripts(html, urls) {
  var tags = ''
  for (var i = 0; i < urls.length; i++) {
    var src = urls[i].replace(/&/g, '&amp;')
    if (html.indexOf('src="' + src + '"') !== -1) continue
    tags += '<script src="' + src + '" async data-wz-site-script></script>'
  }
  if (tags.length === 0) return html
  var head = HEAD_CLOSE_RE.exec(html)
  if (!head) return html
  return html.slice(0, head.index) + tags + html.slice(head.index)
}

export function activate(api) {
  api.cms.hooks.filter('publish.html', function (html) {
    if (typeof html !== 'string' || html.length === 0) return html

    var siteScripts = parseScriptUrls(api.cms.settings.get('siteScripts'))
    html = injectSiteScripts(html, siteScripts)

    var frame = parseOrigins(api.cms.settings.get('frameOrigins'))
    var script = parseOrigins(api.cms.settings.get('scriptOrigins'))
    var connect = parseOrigins(api.cms.settings.get('connectOrigins'))
    // A site script's host is trusted like a typed script origin, so it gets
    // the same four directives on every page, embed or not.
    for (var s = 0; s < siteScripts.length; s++) {
      var siteOrigin = originOf(siteScripts[s])
      if (script.indexOf(siteOrigin) === -1) script.push(siteOrigin)
    }
    // Default is compatible: the setting exists because embeds were silently
    // half-failing, so an install that has never been configured gets the
    // behaviour that made them work.
    var compatible = api.cms.settings.get('embedPolicy') !== 'strict'
    var hasEmbed = EMBED_MARKER.test(html)
    // Default ON: a plugin installed before this setting existed has no stored
    // value, and the point of the setting is the behaviour it enables.
    var auto = api.cms.settings.get('autoTrust') !== false

    var hashes = []
    /* Compatible mode only engages where there is something to be compatible
       WITH. A page with no Embed block is left exactly as the publisher wrote
       it, which on this site is most of them. */
    if (compatible && hasEmbed) {
      var cspC = null
      var matchC = CSP_META_RE.exec(html)
      if (!matchC) {
        api.plugin.log('embed-origins: no CSP meta tag on this page, left as-is')
        return html
      }
      cspC = parseCsp(matchC[2])
      var changedC = applyCompatible(cspC)
      // The typed boxes still apply: an operator may have listed an origin that
      // is not https (a staging host on http, say).
      if (widen(cspC, 'frame-src', frame)) changedC = true
      if (widen(cspC, 'script-src', script)) changedC = true
      if (widen(cspC, 'connect-src', connect)) changedC = true
      if (!changedC) return html
      return (
        html.slice(0, matchC.index) + matchC[1] + serializeCsp(cspC) + matchC[3] +
        html.slice(matchC.index + matchC[0].length)
      )
    }

    if (auto) {
      var found = derivePageSources(html, selfOriginOf(html))
      frame = frame.concat(found.frames)
      script = script.concat(found.scripts)
      hashes = found.hashes
    }

    if (frame.length === 0 && script.length === 0 && connect.length === 0 && hashes.length === 0) {
      return html
    }

    var match = CSP_META_RE.exec(html)
    if (!match) {
      // No CSP meta tag means nothing to widen — a page rendered by a path
      // that does not emit one. Never synthesise a policy here: inventing one
      // could only ever be more permissive than what the host intended.
      api.plugin.log('embed-origins: no CSP meta tag on this page, left as-is')
      return html
    }

    var csp = parseCsp(match[2])
    var changed = false
    if (widen(csp, 'frame-src', frame)) changed = true
    if (widen(csp, 'script-src', script.concat(hashes))) changed = true
    /* A script that RUNS in this document needs more than permission to load:
       its API calls (connect-src), the stylesheet it injects (style-src) and the
       webfont that stylesheet asks for (font-src). Granting the origin without
       these is the shape of "the widget loaded and then did nothing", which is
       indistinguishable from a broken widget. Frame origins get none of it —
       the framed document is governed by its own policy. */
    if (widen(csp, 'connect-src', connect.concat(script))) changed = true
    if (script.length > 0) {
      if (widen(csp, 'style-src', script)) changed = true
      if (widen(csp, 'font-src', script)) changed = true
    }
    if (!changed) return html

    return (
      html.slice(0, match.index) +
      match[1] +
      serializeCsp(csp) +
      match[3] +
      html.slice(match.index + match[0].length)
    )
  })

  api.plugin.log('embed-origins active')
}

export function install(api) {
  api.plugin.log('embed-origins installed')
}

export function deactivate(api) {
  api.plugin.log('embed-origins deactivated')
}

export function uninstall(api) {
  api.plugin.log('embed-origins uninstalled')
}
