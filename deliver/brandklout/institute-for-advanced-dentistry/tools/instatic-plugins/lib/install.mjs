/**
 * install.mjs — pack, inspect and install one plugin on the instance INSTATIC_BASE_URL names.
 *
 * Shared by install-plugin.mjs (one site, by hand) and plugins.mjs rollout (the fleet). The logic
 * is the per-id GRANTS installer from bk-dr-nahlah's workflows/16-instatic-plugins/install-plugin.mjs,
 * with the grant lists moved into plugins.json so there is one table, not one per worktree (on
 * 2026-09-10 bk-mason-park-kids' copy granted embed-origins only and refused the SEO pair).
 *
 * Import this only after INSTATIC_BASE_URL is set: lib/site.mjs fixes the host at import time.
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { api, requestForm, BASE } from '../../instatic-site/lib/site.mjs'
export { packPlugin } from './pack.mjs'
export { api, BASE }

export const idOf = (p) => p.id ?? p.manifest?.id
export const versionOf = (p) => p.version ?? p.manifest?.version

export async function listInstalled() {
  return (await api('GET', '/admin/api/cms/plugins')).plugins ?? []
}

/** Semver compare, numeric parts only. */
export function cmpVersion(a, b) {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0) ? -1 : 1
  return 0
}

/** A plugin that declares no settings 400s on the settings route (link-editor). Ask the manifest. */
export async function readSettings(id, manifest) {
  if (!Array.isArray(manifest?.settings) || manifest.settings.length === 0) return {}
  return (await api('GET', `/admin/api/cms/plugins/${id}/settings`)).settings ?? {}
}

/** Every stored record per resource (the rows an uninstall would cascade away). */
export async function readRecords(id, manifest) {
  const out = {}
  for (const r of manifest?.resources ?? []) {
    const rows = []
    for (let offset = 0; ; offset += 100) {
      const b = await api('GET', `/admin/api/cms/plugins/${id}/resources/${r.id}/records?limit=100&offset=${offset}`)
      const page = b.records ?? []
      rows.push(...page)
      if (page.length === 0 || rows.length >= (b.totalCount ?? rows.length)) break
    }
    out[r.id] = rows
  }
  return out
}

/**
 * Inspect (no grants), check, then install with exactly the registry grants.
 * Refuses: a zip whose id or version is not the registry's, a manifest asking for an ungranted
 * permission, a downgrade (unless allowDowngrade), and any site still carrying the old webzite.* id.
 * Returns { action: 'installed'|'current'|'dry', from, to }.
 */
export async function installPlugin({ id, p, zip, apply = false, allowDowngrade = false, log = console.log }) {
  const installed = await listInstalled()
  const old = installed.find((x) => idOf(x) === id.replace(/^brandklout\./, 'webzite.'))
  if (old) {
    throw new Error(`${BASE} still carries ${idOf(old)} v${versionOf(old)}: migrate it first with ` +
      `tools/instatic-api-sync/migrate-plugin-ids.mjs (export, swap, publish, verify, uninstall)`)
  }
  const cur = installed.find((x) => idOf(x) === id)
  const from = cur ? versionOf(cur) : null

  const bytes = readFileSync(zip)
  const form = (grant) => {
    const f = new FormData()
    f.append('file', new Blob([bytes], { type: 'application/zip' }), basename(zip))
    f.append('grantedPermissions', JSON.stringify(grant))
    return f
  }
  // Inspect with NO grants: it only reads the manifest, and a grant list sent before we know
  // which plugin this is would defeat the per-id table.
  const inspected = await requestForm('/admin/api/cms/plugins/inspect-package', form([]))
  const m = inspected.manifest ?? inspected.plugin ?? inspected
  log(`  package  ${m.name ?? '(unnamed)'}  ${m.id}  v${m.version}`)
  log(`  requests ${(m.permissions ?? []).join(', ') || '(none)'}`)
  log(`  granting ${p.grants.join(', ')}`)
  if (m.id !== id) throw new Error(`the package is ${m.id}, expected ${id} — an old zip? rebuild from source`)
  if (m.version !== p.version) throw new Error(`the package is v${m.version}, the registry releases v${p.version}`)
  const extra = (m.permissions ?? []).filter((x) => !p.grants.includes(x))
  if (extra.length) throw new Error(`REFUSED: ${id} asks for ungranted permissions: ${extra.join(', ')} (review, then add to plugins.json grants)`)

  if (from && cmpVersion(from, p.version) > 0 && !allowDowngrade) {
    throw new Error(`REFUSED: ${BASE} runs ${id} v${from}, newer than the released v${p.version}. ` +
      `A downgrade drops features live (1.8.0 -> 1.7.0 puts both DNI pools on every page). ` +
      `Bring the newer source into tools/instatic-plugins first, or pass --allow-downgrade on purpose.`)
  }
  if (from === p.version) {
    log(`  current  v${from} already installed`)
    return { action: 'current', from, to: p.version }
  }
  log(`  plan     ${from ? `v${from}` : 'not installed'} -> v${p.version}${apply ? '' : '  (dry run)'}`)
  if (!apply) return { action: 'dry', from, to: p.version }

  await requestForm('/admin/api/cms/plugins/package', form(p.grants)) // step-up is automatic
  return { action: 'installed', from, to: p.version }
}
