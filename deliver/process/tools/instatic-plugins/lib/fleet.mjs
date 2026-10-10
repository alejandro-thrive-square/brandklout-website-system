/**
 * fleet.mjs — who the plugin toolkit talks to, and with which credentials.
 *
 * Three sources, each the single owner of one fact:
 *   plugins.json                          which plugins exist, their released version, their grants,
 *                                         and which sites must carry which
 *   ../instatic-domain-origins/sites.json every Instatic host: `<client>` is production,
 *                                         `<client>-staging` is that client's staging instance
 *   ~/.brandklout/.env                       credentials, one `[<client>]` section per site
 *                                         (same sectioned format scripts/env-sync.mjs reads)
 *
 * `readMaster()` moved here from ../instatic-embeds/rollout-site-scripts.mjs (2026-09-23), which now
 * imports it, so the two fleet tools read the master the same way.
 *
 * Staging uses the production section's login (owner decision: same admin logins on both). A section
 * may carry INSTATIC_STAGING_URL / INSTATIC_STAGING_PASSWORD to override. A host with no password is
 * NEVER tried: an empty INSTATIC_PASSWORD would let lib/site.mjs fill it from the worktree .env,
 * which belongs to another client, and five failed logins lock the account.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

export const HERE = join(dirname(fileURLToPath(import.meta.url)), '..')
export const TOOLS = join(HERE, '..')
export const SITES_JSON = join(TOOLS, 'instatic-domain-origins', 'sites.json')

/* ── master env ─────────────────────────────────────────────────────────── */

export function readMasterSections(file = process.env.WEBZITE_ENV_MASTER || join(homedir(), '.brandklout', '.env')) {
  const sections = new Map([['shared', new Map()]])
  let current = 'shared'
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith(';')) continue
    const header = line.match(/^\[\s*([^\]]+?)\s*\]$/)
    if (header) {
      current = header[1].toLowerCase()
      if (!sections.has(current)) sections.set(current, new Map())
      continue
    }
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/)
    if (!kv) continue
    let value = kv[2].trim()
    if (value.length >= 2 && /^(["']).*\1$/.test(value)) value = value.slice(1, -1)
    sections.get(current).set(kv[1], value)
  }
  const vars = sections.get('vars') ?? new Map()
  const shared = sections.get('shared')
  const expand = (value, trail = []) =>
    value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (whole, name) => {
      if (trail.includes(name)) throw new Error(`circular reference ${whole}`)
      const hit = vars.get(name) ?? shared.get(name)
      if (hit === undefined) throw new Error(`${whole} is not defined in [vars] or [shared]`)
      return expand(hit, trail.concat(name))
    })
  const get = (section, key) => {
    const keys = sections.get(section) ?? new Map()
    return expand(keys.get(key) ?? shared.get(key) ?? '')
  }
  return { sections, get }
}

/** Every master section carrying an INSTATIC_BASE_URL, as { name, env } — the shape
 *  rollout-site-scripts.mjs has always used. */
export function readMaster(file) {
  const { sections, get } = readMasterSections(file)
  const sites = []
  for (const [name, keys] of sections) {
    if (['shared', 'vars', 'aliases'].includes(name) || !keys.get('INSTATIC_BASE_URL')) continue
    sites.push({
      name,
      env: {
        INSTATIC_BASE_URL: get(name, 'INSTATIC_BASE_URL'),
        INSTATIC_EMAIL: get(name, 'INSTATIC_EMAIL'),
        INSTATIC_PASSWORD: get(name, 'INSTATIC_PASSWORD'),
      },
    })
  }
  return sites
}

/* ── registry ───────────────────────────────────────────────────────────── */

export function loadRegistry() {
  const reg = JSON.parse(readFileSync(join(HERE, 'plugins.json'), 'utf8'))
  const problems = []
  for (const [id, p] of Object.entries(reg.plugins)) {
    const file = join(HERE, p.dir, 'plugin.json')
    if (!existsSync(file)) { problems.push(`${id}: no ${p.dir}/plugin.json`); continue }
    const m = JSON.parse(readFileSync(file, 'utf8'))
    p.manifest = m
    if (m.id !== id) problems.push(`${id}: ${p.dir}/plugin.json says id ${m.id}`)
    if (m.version !== p.version) problems.push(`${id}: registry says ${p.version}, ${p.dir}/plugin.json says ${m.version} (bump both in one commit)`)
    if (!p.changelog?.[p.version]) problems.push(`${id}: no changelog entry for ${p.version}`)
    const extra = (m.permissions ?? []).filter((x) => !p.grants.includes(x))
    if (extra.length) problems.push(`${id}: plugin.json asks for ${extra.join(', ')}, which the registry does not grant`)
    if (!id.startsWith('brandklout.')) problems.push(`${id}: every in-house plugin id is brandklout.* since 2026-09-10`)
  }
  for (const [client, s] of Object.entries(reg.sites)) {
    const list = s.plugins === 'defaults' ? reg.defaults : s.plugins
    for (const id of list) if (!reg.plugins[id]) problems.push(`sites.${client}: unknown plugin ${id}`)
  }
  return { reg, problems }
}

/** The plugins a client must carry (registry `sites`, else `defaults`). */
export function expectedPlugins(reg, client) {
  const s = reg.sites[client]
  if (!s) return reg.defaults
  return s.plugins === 'defaults' ? reg.defaults : s.plugins
}

/** Accept `embed-origins` or `brandklout.embed-origins`. */
export function resolvePluginId(reg, name) {
  if (!name) return null
  if (reg.plugins[name]) return name
  const hit = Object.entries(reg.plugins).find(([id, p]) => p.dir === name || id.endsWith('.' + name))
  if (!hit) throw new Error(`unknown plugin "${name}" — known: ${Object.keys(reg.plugins).join(', ')}`)
  return hit[0]
}

/* ── targets: one per (client, environment) ─────────────────────────────── */

const hostOf = (u) => { try { return new URL(u).hostname } catch { return '' } }

/**
 * @param {{ only?: string[], env?: 'production'|'staging'|'both' }} opts
 * @returns {{ client, env, url, creds: {INSTATIC_BASE_URL, INSTATIC_EMAIL, INSTATIC_PASSWORD}, problem?: string, source: string }[]}
 */
export function targets({ only = null, env = 'both' } = {}) {
  const sites = existsSync(SITES_JSON) ? JSON.parse(readFileSync(SITES_JSON, 'utf8')).sites : []
  let master = null
  try { master = readMasterSections() } catch (e) { master = null }
  const byClient = new Map(sites.map((s) => [s.client, s]))

  const clients = new Set(sites.map((s) => s.client.replace(/-staging$/, '')))
  if (master) {
    for (const [name, keys] of master.sections) {
      if (!['shared', 'vars', 'aliases'].includes(name) && keys.get('INSTATIC_BASE_URL')) clients.add(name)
    }
  }

  const out = []
  for (const client of [...clients].sort()) {
    if (only && !only.includes(client)) continue
    const prod = byClient.get(client)
    const get = (k) => (master && master.sections.has(client) ? master.get(client, k) : '')
    const email = get('INSTATIC_EMAIL')
    const password = get('INSTATIC_PASSWORD')

    if (env !== 'staging') {
      const url = prod?.adminUrl || get('INSTATIC_BASE_URL')
      if (url) {
        out.push({
          client, env: 'production', url: url.replace(/\/+$/, ''),
          source: prod ? 'sites.json' : 'master INSTATIC_BASE_URL (not in sites.json)',
          creds: { INSTATIC_BASE_URL: url.replace(/\/+$/, ''), INSTATIC_EMAIL: email, INSTATIC_PASSWORD: password },
          problem: !password ? `no INSTATIC_PASSWORD in the [${client}] master section` : undefined,
        })
      }
    }
    if (env !== 'production') {
      const stagingEntry = byClient.get(`${client}-staging`)
      const alt = prod && !hostOf(prod.adminUrl).startsWith('staging.')
        ? (prod.alternates ?? []).find((a) => hostOf(a).startsWith('staging.'))
        : null
      const url = stagingEntry?.adminUrl || get('INSTATIC_STAGING_URL') || alt
      if (url) {
        const pw = get('INSTATIC_STAGING_PASSWORD') || password
        out.push({
          client, env: 'staging', url: url.replace(/\/+$/, ''),
          source: stagingEntry ? 'sites.json' : get('INSTATIC_STAGING_URL') ? 'master INSTATIC_STAGING_URL' : 'sites.json alternate',
          creds: { INSTATIC_BASE_URL: url.replace(/\/+$/, ''), INSTATIC_EMAIL: email, INSTATIC_PASSWORD: pw },
          problem: !pw ? `no INSTATIC_PASSWORD in the [${client}] master section` : undefined,
        })
      }
    }
  }
  return out
}
