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
    csp.order.push(directive)
    csp.map[directive] = origins.slice()
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

export function activate(api) {
  api.cms.hooks.filter('publish.html', function (html) {
    if (typeof html !== 'string' || html.length === 0) return html

    var frame = parseOrigins(api.cms.settings.get('frameOrigins'))
    var script = parseOrigins(api.cms.settings.get('scriptOrigins'))
    var connect = parseOrigins(api.cms.settings.get('connectOrigins'))
    if (frame.length === 0 && script.length === 0 && connect.length === 0) {
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
    if (widen(csp, 'script-src', script)) changed = true
    if (widen(csp, 'connect-src', connect)) changed = true
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
