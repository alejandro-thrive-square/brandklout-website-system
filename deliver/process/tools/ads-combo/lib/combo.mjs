/**
 * combo.mjs - shared helpers for the scenario 3 gates.
 *
 * Every gate reads ONE campaign manifest (see ../combo.example.json) instead of a
 * hardcoded page list. A gate with its own page list goes blind the day a campaign is
 * added (three gates once watched 11 of 57 pages and all reported clean).
 *
 *   import { loadCombo, comboUrls, UA, get, readGhlForm } from './lib/combo.mjs'
 *
 * No npm dependencies. Node 20+ (global fetch, WebSocket on Node 22+).
 */
import { readFileSync } from 'node:fs'

export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
export const ADSBOT_UA = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)'
export const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

/** --flag value / --flag parsing. Returns { flags, rest }. */
export function parseArgs(argv = process.argv.slice(2)) {
  const flags = {}
  const rest = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2)
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith('--')) { flags[k] = next; i++ } else flags[k] = true
    } else rest.push(a)
  }
  return { flags, rest }
}

/**
 * Load the manifest. `--origin` on the command line overrides the manifest origin, so the
 * same file gates staging and production.
 */
export function loadCombo(path, originOverride) {
  if (!path) throw new Error('missing --combo <path to combo.json>')
  const c = JSON.parse(readFileSync(path, 'utf8'))
  c.origin = String(originOverride || c.origin || '').replace(/\/+$/, '')
  c.productionOrigin = String(c.productionOrigin || c.origin).replace(/\/+$/, '')
  c.prefix = (c.prefix ?? 'ads-landing-pages/').replace(/^\/+/, '')
  if (c.prefix && !c.prefix.endsWith('/')) c.prefix += '/'
  if (!c.origin) throw new Error('combo.json has no origin and no --origin was given')
  if (!Array.isArray(c.campaigns) || !c.campaigns.length) throw new Error('combo.json has no campaigns')
  for (const k of c.campaigns) for (const f of ['name', 'landing', 'consultation', 'thankYou', 'formId'])
    if (!k[f]) throw new Error(`campaign ${k.name || '?'} is missing "${f}"`)
  return c
}

/** Path (with leading slash) of a slug inside the ads folder. */
export const pathOf = (c, slug) => '/' + c.prefix + slug.replace(/^\/+/, '')

/** Every page of every campaign, flat: { campaign, kind, slug, path, url }. */
export function comboUrls(c, origin = c.origin) {
  const out = []
  for (const k of c.campaigns) for (const kind of ['landing', 'consultation', 'thankYou']) {
    const p = pathOf(c, k[kind])
    out.push({ campaign: k, kind, slug: k[kind], path: p, url: origin + p })
  }
  return out
}

/** Fetch with a browser UA; never follows redirects so a 301 is visible. */
export async function get(url, { ua = UA, follow = false } = {}) {
  const r = await fetch(url, { headers: { 'user-agent': ua }, redirect: follow ? 'follow' : 'manual' })
  return { status: r.status, location: r.headers.get('location'), body: await r.text() }
}

/**
 * Read a GoHighLevel form's public settings from its __NUXT_DATA__ payload (read only, submits
 * nothing). Numbers in the devalue array are references into the array.
 *   actionType '1' = redirect to redirectUrl, '2' = inline thank-you message.
 */
export async function readGhlForm(idOrUrl) {
  const id = (String(idOrUrl).match(/widget\/form\/([A-Za-z0-9]+)/) || [null, idOrUrl])[1]
  const html = await (await fetch(`https://api.leadconnectorhq.com/widget/form/${id}`, { headers: { 'user-agent': UA } })).text()
  const m = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) return { id, ok: false }
  const d = JSON.parse(m[1])
  const R = (v) => (typeof v === 'number' ? d[v] : v)
  const isObj = (n) => n && typeof n === 'object' && !Array.isArray(n)
  const node = d.find((n) => isObj(n) && 'enableSaveExitConfirmation' in n)
  const fa = node && isObj(R(node.formAction)) ? R(node.formAction) : {}
  const meta = d.find((n) => isObj(n) && 'parentFolderName' in n && 'name' in n)
  const privacy = new Set(d.filter((s) => typeof s === 'string' && /^privacy_[a-z_]+$/.test(s)))
  return {
    id,
    ok: true,
    name: meta ? R(meta.name) : null,
    saveExit: node ? R(node.enableSaveExitConfirmation) === true : false,
    actionType: R(fa.actionType) ?? null,
    redirectUrl: R(fa.redirectUrl) || '',
    privacyFields: privacy.size,
  }
}

/** Same URL, ignoring trailing slash and query. */
export const sameUrl = (a, b) => {
  const n = (u) => { try { const x = new URL(u); return (x.origin + x.pathname).replace(/\/+$/, '').toLowerCase() } catch { return String(u) } }
  return n(a) === n(b)
}

/** A glob with * only, matched against a path without its leading slash. */
export const globMatch = (glob, path) => new RegExp('^' + glob.replace(/^\/+/, '').replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(path.replace(/^\/+/, ''))
