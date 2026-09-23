#!/usr/bin/env node
/**
 * Install the source instance's plugins onto the target, with their settings.
 *
 *   node clone-plugins.mjs --from https://www.drnahlah.com \
 *                          --to   https://staging.drnahlah.com \
 *                          --files ./output/plugins        # unpacked plugin assets
 *
 * WHY THIS EXISTS
 * ---------------
 * Plugins are NOT in the export bundle. A cloned site therefore comes up with
 * ZERO plugins and looks completely fine — while silently losing its entire
 * SEO layer. On Dr. Nahlah that was `canonical`, `og:*` and the JSON-LD
 * @graph: 22.8 KB of HTML per page instead of 45 KB, with nothing in the UI
 * saying anything is missing. This is the single most dangerous gap in a
 * clone, because a redesign signed off on a plugin-less staging site ships to
 * production with no schema and no canonicals.
 *
 * THE ASSETS
 * ----------
 * Plugin CODE lives on the source's volume under `/app/storage/uploads/plugins/
 * <id>/<version>/`, and the MANIFEST lives in its database (returned by
 * `GET /admin/api/cms/plugins`). Neither is downloadable over the API, so pull
 * the code off the source container first (252 KB for all four):
 *
 *   railway ssh -s "<Service>" -e production \
 *     "sh -lc 'tar czf - -C /app/storage/uploads/plugins . | base64 -w0'" \
 *     | grep -v '^Using SSH' | tr -d '\r\n' > all.b64
 *   base64 -d all.b64 > all.tgz && mkdir -p output/plugins && cd output/plugins && tar xzf ../../all.tgz
 *
 * This script writes each `plugin.json` from the live manifest, packs with
 * `16-instatic-plugins/pack-plugin.mjs`, installs, then copies settings.
 *
 * PERMISSIONS — why not `16-instatic-plugins/install-plugin.mjs`
 * -------------------------------------------------------------
 * That script hard-codes `GRANT = ['cms.hooks','modules.register','frontend.assets']`
 * — embed-origins' three — and REFUSES anything asking for more, which is
 * correct for installing a new plugin a human is approving. AEO Schema asks
 * for six, so it would be refused here. A clone is not a new approval: this
 * grants exactly what the SOURCE had already granted, and nothing else. If the
 * source granted something you would not approve, fix it there first.
 */
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { session, login, api } from './lib.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1] }

const FROM = flag('from'), TO = flag('to')
const FILES = flag('files', join(HERE, 'output', 'plugins'))
// Vendored beside this script (identical bytes to 16-instatic-plugins/pack-plugin.mjs,
// which is client-scoped). A root process module cannot reach into one client's
// workflow folder, so module 21 carries its own copy. `--packer` overrides it.
const PACKER = flag('packer', join(HERE, '..', '..', 'instatic-plugins', 'pack-plugin.mjs'))
if (!FROM || !TO) { console.error('usage: node clone-plugins.mjs --from <url> --to <url> [--files <dir>]'); process.exit(2) }
if (!existsSync(FILES)) { console.error(`no plugin assets at ${FILES} — pull them off the source container first (see header)`); process.exit(2) }

const fromCookie = await login(FROM)
const { plugins } = await api(FROM, fromCookie, 'GET', '/admin/api/cms/plugins')
console.log(`source has ${plugins.length} plugin(s): ${plugins.map((p) => p.manifest.id).join(', ')}\n`)

const toCookie = await session(TO)          // install is step-up gated
// Runtime-only keys the host adds at install; they are not source manifest fields.
const RUNTIME_KEYS = new Set(['grantedPermissions', 'assetBasePath'])
let installed = 0

for (const p of plugins) {
  const m = p.manifest
  const dir = join(FILES, m.id, m.version)
  if (!existsSync(dir)) { console.log(`${m.id.padEnd(26)} SKIP — no assets at ${dir}`); continue }

  writeFileSync(join(dir, 'plugin.json'),
    JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k]) => !RUNTIME_KEYS.has(k))), null, 2))

  const zip = join(FILES, `${m.id}.zip`)
  execFileSync(process.execPath, [PACKER, dir, zip], { stdio: 'pipe' })

  const granted = m.grantedPermissions ?? m.permissions ?? []
  const form = new FormData()
  form.append('file', new Blob([readFileSync(zip)], { type: 'application/zip' }), basename(zip))
  form.append('grantedPermissions', JSON.stringify(granted))

  const r = await fetch(TO + '/admin/api/cms/plugins/package', {
    method: 'POST', headers: { cookie: toCookie, origin: TO }, body: form,
  })
  const out = await r.text()
  console.log(`${m.id.padEnd(26)} v${m.version}  install ${r.status} ${r.ok ? 'OK' : out.slice(0, 180)}`)
  if (!r.ok) continue
  installed++

  // Settings are a separate record; without them AEO Schema and Open Graph
  // install but emit nothing useful (`siteUrl` in particular).
  let settings = null
  try { settings = (await api(FROM, fromCookie, 'GET', `/admin/api/cms/plugins/${m.id}/settings`)) } catch {}
  const payload = settings?.settings ?? settings
  if (payload && typeof payload === 'object' && Object.keys(payload).length) {
    const sr = await fetch(`${TO}/admin/api/cms/plugins/${m.id}/settings`, {
      method: 'PUT', headers: { 'content-type': 'application/json', cookie: toCookie, origin: TO },
      body: JSON.stringify({ settings: payload }),
    })
    console.log(`${''.padEnd(26)}   settings ${sr.status} ${sr.ok ? `OK (${Object.keys(payload).length} keys)` : (await sr.text()).slice(0, 160)}`)
  }
}

console.log(`\ninstalled ${installed} of ${plugins.length}`)
console.log(`
NOTE — \`siteUrl\` on AEO Schema and Open Graph was copied VERBATIM from the
source, so the target emits canonical/og:url pointing at the SOURCE domain.
On a staging clone that is deliberate: it stops Google indexing staging as a
separate site. Do not "fix" it to the staging host unless you have Cloudflare
Access in front, and never promote plugin settings back to production.`)
