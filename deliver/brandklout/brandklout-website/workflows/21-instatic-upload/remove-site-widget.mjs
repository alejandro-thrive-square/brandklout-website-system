/**
 * Take the sienna-accessibility widget off the site: drop it from the embed-origins plugin's
 * `siteScripts` (it was added there outside this toolkit).
 *
 * WHY (2026-09-15): the widget writes every text element's font size inline, in whole px, at load.
 * agency/widget-fluid.js undid that, but only when it ran first: on a cached reload the widget ran
 * before it, and 454 elements kept frozen sizes. Sang saw the editor's size on the first load and a
 * smaller one on every refresh after. Alejandro: "I don't think we need to have the widget on this site".
 *
 * READ, MERGE, WRITE: every other setting goes back unchanged. The settings before the change are
 * saved to .tmp/plugins-before-widget-removal.json. Like a CSP change, it reaches pages on the NEXT
 * publish.
 *
 * Usage: node remove-site-widget.mjs            (dry run)
 *        node remove-site-widget.mjs --apply
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
for (const line of fs.readFileSync(path.resolve(HERE, '../../../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { api } = await import('../../../../process/22-instatic-api-sync/insta-api.mjs')

const ID = 'brandklout.embed-origins'
const WIDGET = /sienna/i

const cur = await api('GET', `/admin/api/cms/plugins/${ID}/settings`)
fs.mkdirSync(path.join(HERE, '.tmp'), { recursive: true })
fs.writeFileSync(path.join(HERE, '.tmp', 'plugins-before-widget-removal.json'), JSON.stringify(cur, null, 1))
const settings = { ...(cur.settings ?? {}) }
const before = settings.siteScripts
console.log('siteScripts before', JSON.stringify(before))
let after
if (Array.isArray(before)) after = before.filter((s) => !WIDGET.test(JSON.stringify(s)))
else after = String(before ?? '').split(/\r?\n/).filter((l) => !WIDGET.test(l)).join('\n').trim()
if (JSON.stringify(after) === JSON.stringify(before)) {
  console.log('no widget in siteScripts; nothing to do')
  process.exit(0)
}
settings.siteScripts = after
console.log('siteScripts after ', JSON.stringify(after))
if (!process.argv.includes('--apply')) {
  console.log('dry run — re-run with --apply')
  process.exit(0)
}
await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, { settings })
const back = (await api('GET', `/admin/api/cms/plugins/${ID}/settings`)).settings ?? {}
for (const [k, v] of Object.entries(settings)) {
  if (JSON.stringify(back[k]) !== JSON.stringify(v)) {
    console.error(`MISMATCH after write: ${k} = ${JSON.stringify(back[k])}, wanted ${JSON.stringify(v)}`)
    process.exitCode = 1
  }
}
console.log('read back siteScripts', JSON.stringify(back.siteScripts))
