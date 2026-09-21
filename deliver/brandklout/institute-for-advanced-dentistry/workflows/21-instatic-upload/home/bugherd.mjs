/**
 * BugHerd on STAGING — the review sidebar Brandklout leaves feedback through.
 *
 *   node home/bugherd.mjs status                     read-only: BugHerd projects, staging's plugin settings
 *   node home/bugherd.mjs create                     create the BugHerd project for staging (once)
 *   node home/bugherd.mjs install <projectApiKey>    add the sidebar to staging's siteScripts + CSP origins
 *   node home/bugherd.mjs uninstall                  take it off again (do this before any promotion)
 *
 * WHY A PLUGIN SETTING. Instatic bakes `script-src 'self'` into every published page, so a tag
 * injected from site.js is blocked (it shows as a 503 in the browser and 200 from curl). The only
 * way in is `brandklout.embed-origins`: `siteScripts` loads the URL, and scriptOrigins /
 * connectOrigins / frameOrigins open the CSP for it. Settings are written READ-MERGE-WRITE: the
 * record also carries the Sienna widget and the embed policy, and a blind PUT drops them. A CSP
 * change only reaches pages at the next publish, so `install` is followed by publish-home.mjs.
 *
 * The BugHerd key is `BUGHERD` in ~/.webzite/.env (basic auth, key as the username, `x` as the
 * password). Never printed. Staging only: staging-only.mjs refuses any other host.
 *
 * Redirect output to a file, never a pipe (Node 24 on Windows).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { api, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
const PLUGIN = 'brandklout.embed-origins'
const PROJECT_NAME = 'Institute for Advanced Dentistry'
const STAGING = 'https://staging.ifadentistry.com'
// What the sidebar needs, measured on a published page (see the run file): the loader, its
// bundles and API, uploads of screenshots, and the realtime socket.
const ORIGINS = {
  scriptOrigins: ['https://www.bugherd.com', 'https://sidebar.bugherd.com'],
  connectOrigins: ['https://www.bugherd.com', 'https://sidebar.bugherd.com', 'https://api.bugherd.com', 'https://files.bugherd.com', 'https://screenshots.bugherd.com', 'wss://ws.pusherapp.com', 'https://sockjs.pusher.com'],
  frameOrigins: ['https://www.bugherd.com', 'https://sidebar.bugherd.com'],
}

function bugherdKey () {
  if (process.env.BUGHERD) return process.env.BUGHERD
  for (const f of [path.join(os.homedir(), '.webzite', '.env'), path.resolve('.env')]) {
    if (!fs.existsSync(f)) continue
    const m = fs.readFileSync(f, 'utf8').match(/^BUGHERD=(.+)$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  throw new Error('BUGHERD is not set in ~/.webzite/.env')
}
async function bh (method, p, body) {
  const r = await fetch('https://www.bugherd.com/api_v2' + p, {
    method,
    headers: { authorization: 'Basic ' + Buffer.from(bugherdKey() + ':x').toString('base64'), 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`BugHerd ${method} ${p} -> ${r.status} ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : {}
}
const lines = (v) => String(v ?? '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
const merge = (cur, add) => [...new Set([...lines(cur), ...add])].join('\n')
const isBugherd = (s) => /bugherd\.com|pusherapp\.com|pusher\.com/.test(s)

const cmd = process.argv[2]
const current = await api('GET', `/admin/api/cms/plugins/${PLUGIN}/settings`)
const settings = current.settings ?? {}

if (cmd === 'status') {
  const { projects } = await bh('GET', '/projects.json')
  console.log(`BugHerd projects (${projects.length}):`)
  for (const p of projects) console.log(`  ${String(p.id).padEnd(8)} ${p.name}`)
  console.log(`\nstaging plugin settings (${PLUGIN}):`)
  for (const def of current.schema ?? []) console.log(`  ${def.id.padEnd(16)} ${JSON.stringify(settings[def.id] ?? '').slice(0, 300)}`)
} else if (cmd === 'create') {
  const { projects } = await bh('GET', '/projects.json')
  const existing = projects.find((p) => p.name.trim().toLowerCase() === PROJECT_NAME.toLowerCase())
  if (existing) { console.log(`exists: ${existing.id} ${existing.name}`); process.exit(0) }
  const { project } = await bh('POST', '/projects.json', { project: { name: PROJECT_NAME, devurl: STAGING, is_active: true, is_public: false } })
  console.log(`created: ${project.id} ${project.name}  devurl ${project.devurl}`)
  console.log(`project api key: ${project.api_key}   (a public embed key: it is in the page source of every site that runs the sidebar)`)
} else if (cmd === 'install' || cmd === 'uninstall') {
  const next = { ...settings }
  if (cmd === 'install') {
    const key = process.argv[3]
    if (!/^[a-z0-9]{10,}$/i.test(key || '')) throw new Error('install needs the PROJECT api key (from `create`, or BugHerd > project > Settings > Install)')
    next.siteScripts = merge(lines(settings.siteScripts).filter((s) => !isBugherd(s)).join('\n'), [`https://www.bugherd.com/sidebarv2.js?apikey=${key}`])
    for (const k of Object.keys(ORIGINS)) next[k] = merge(settings[k], ORIGINS[k])
  } else {
    for (const k of ['siteScripts', ...Object.keys(ORIGINS)]) next[k] = lines(settings[k]).filter((s) => !isBugherd(s)).join('\n')
  }
  const res = await api('PUT', `/admin/api/cms/plugins/${PLUGIN}/settings`, { settings: next })
  const after = (await api('GET', `/admin/api/cms/plugins/${PLUGIN}/settings`)).settings ?? {}
  // everything we did not mean to touch must come back unchanged
  for (const k of Object.keys(settings)) {
    if (['siteScripts', ...Object.keys(ORIGINS)].includes(k)) continue
    if (JSON.stringify(after[k]) !== JSON.stringify(settings[k])) throw new Error(`setting "${k}" changed and should not have: ${JSON.stringify(settings[k])} -> ${JSON.stringify(after[k])}`)
  }
  const kept = lines(settings.siteScripts).filter((s) => !isBugherd(s))
  for (const s of kept) if (!lines(after.siteScripts).includes(s)) throw new Error(`siteScripts lost ${s}`)
  console.log(`${cmd} ok${res?.ok === false ? ' (?)' : ''}`)
  for (const k of ['siteScripts', ...Object.keys(ORIGINS)]) console.log(`  ${k.padEnd(16)} ${JSON.stringify(after[k])}`)
  console.log('\nnow publish: node home/publish-home.mjs   (the CSP only changes at publish)')
} else {
  console.log('usage: node home/bugherd.mjs status | create | install <projectApiKey> | uninstall')
  process.exit(1)
}
