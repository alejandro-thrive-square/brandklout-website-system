/**
 * Embed MARKERS in the built pages, found with balanced tags.
 *
 * A marker is `<div … data-embed="<key>" …>` holding a vendor's snippet
 * verbatim. Until 2026-09-30 every script that needed one used the same lazy
 * regex, `<div[^>]*\sdata-embed="…"[^>]*>([\s\S]*?)<\/div>`, which stops at the
 * FIRST `</div>` after the opening tag. That was fine while the only snippet
 * was an <iframe> plus a <script>. The Elfsight snippet is a <script> and a
 * <div>, so the lazy match ends inside the snippet: `build-import-input.mjs`
 * would have left a stray `</div>` in the page, `place-embeds.mjs` would have
 * published half a snippet, and `all-pages.mjs` would have read no hosts at
 * all. This walks the tags instead and returns the whole marker.
 *
 * Used by build-import-input.mjs, place-embeds.mjs, add-google-reviews.mjs and
 * site-src/all-pages.mjs. Keep it dependency-free: the gate runs on the built
 * site with nothing but node.
 */

const OPEN = /<div\b[^>]*\sdata-embed="([^"]*)"[^>]*>/g

/** Every marker in `html`: `{ key, start, end, open, inner, hosts }`. */
export function findMarkers(html) {
  const out = []
  OPEN.lastIndex = 0
  let m
  while ((m = OPEN.exec(html))) {
    const start = m.index
    const open = m[0]
    let depth = 1
    let i = start + open.length
    const tag = /<\/?div\b[^>]*>/g
    tag.lastIndex = i
    let t
    let close = -1
    while ((t = tag.exec(html))) {
      depth += t[0].startsWith('</') ? -1 : 1
      if (depth === 0) {
        close = t.index
        i = t.index + t[0].length
        break
      }
    }
    if (close < 0) throw new Error(`embed marker "${m[1]}" is never closed`)
    const inner = html.slice(start + open.length, close)
    out.push({ key: m[1], start, end: i, open, inner, hosts: hostsIn(inner, open) })
    OPEN.lastIndex = i
  }
  return out
}

/** The marker with this key, or a thrown error naming what was expected. */
export function markerFor(html, key, where = 'the page') {
  const hit = findMarkers(html).find((x) => x.key === key)
  if (!hit || !hit.inner.trim()) throw new Error(`no marker "${key}" with contents in ${where} — build the site first`)
  return hit
}

/** Replace every marker's contents with nothing, keeping the opening tag. */
export function emptyMarkers(html) {
  const marks = findMarkers(html)
  let out = ''
  let at = 0
  for (const x of marks) {
    out += html.slice(at, x.start) + x.open + '</div>'
    at = x.end
  }
  return out + html.slice(at)
}

/**
 * The hosts a marker reaches: every https host named in the snippet, plus the
 * ones its `data-embed-hosts` attribute declares. The attribute exists for a
 * vendor script that renders IN the page rather than in a frame (Elfsight):
 * its own follow-up requests come from the page's main frame, from hosts the
 * snippet never names. Each entry is a suffix: `elfsight.com` allows
 * `core.service.elfsight.com`.
 */
export function hostsIn(inner, open = '') {
  const hosts = new Set()
  for (const u of inner.matchAll(/https:\/\/([a-z0-9.-]+)/gi)) hosts.add(u[1].toLowerCase())
  const declared = /\sdata-embed-hosts="([^"]*)"/.exec(open)?.[1] ?? ''
  for (const h of declared.split(/[\s,]+/).filter(Boolean)) hosts.add(h.toLowerCase())
  return hosts
}

/** Is `host` one of `hosts`, or under one of them? */
export function hostAllowed(host, hosts) {
  host = String(host).toLowerCase()
  for (const h of hosts) if (host === h || host.endsWith('.' + h)) return true
  return false
}
