#!/usr/bin/env node
/**
 * set-dni-pool.mjs — put the GoHighLevel number pool on every PRODUCTION page,
 * through the Embed Origins plugin's `siteScripts`. Read-merge-write: nothing
 * already in the plugin's settings (Sienna, Termly) is dropped.
 *
 *   node set-dni-pool.mjs            # show current and intended
 *   node set-dni-pool.mjs --apply    # write, then republish
 *
 * Supplied 2026-09-23 with the new number (817) 767-4188, which the pool
 * forwards from. The pool swaps that number in link text and tel: hrefs.
 *
 * PRODUCTION ONLY. A staging clone that loads the pool claims real tracking
 * numbers from it, so this refuses any other host.
 *
 * NOT consent-tagged, by client instruction (2026-09-22): pools run for every
 * visitor whether or not the cookie banner is accepted.
 *
 * The pool asks for its number at services.leadconnectorhq.com and the session
 * helper reports to services.msgsndr.com; pages without an Embed block keep a
 * strict connect-src, so both are granted here or the swap is refused there.
 */
import { api, BASE, publish } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const ID = 'brandklout.embed-origins'
const APPLY = process.argv.includes('--apply')
if (!/^https:\/\/(www\.)?westlaketxmedspa\.com$/.test(BASE)) {
  console.error(`refusing: ${BASE} is not production — the pool must never run on staging`)
  process.exit(1)
}

const TAGS = [
  'https://backend.leadconnectorhq.com/appengine/loc/AtD362nKfN6w4mwob4iV/pool/1ULKyOcYiRRAikT9TnhK/number_pool.js',
  'https://backend.leadconnectorhq.com/appengine/js/user_session.js',
]
const POOL_RE = /\/number_pool\.js|\/user_session\.js/
const CONNECT = ['https://services.leadconnectorhq.com', 'https://services.msgsndr.com']

const lines = (s) => String(s ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
const merge = (cur, add) => { const out = lines(cur); for (const a of add) if (!out.includes(a)) out.push(a); return out.join('\n') }

const cur = await api('GET', `/admin/api/cms/plugins/${ID}/settings`)
const settings = { ...(cur.settings ?? {}) }
const next = {
  ...settings,
  // Pool and session lines are owned here: drop any existing one, then add ours.
  siteScripts: merge(lines(settings.siteScripts).filter((l) => !POOL_RE.test(l)).join('\n'), TAGS),
  connectOrigins: merge(settings.connectOrigins, CONNECT),
}
console.log(BASE)
for (const k of ['siteScripts', 'connectOrigins']) {
  const a = JSON.stringify(settings[k] ?? ''), b = JSON.stringify(next[k] ?? '')
  console.log(`  ${k.padEnd(15)} ${a === b ? 'keep   ' : 'CHANGE '} ${b}`)
}
if (!APPLY) { console.log('\nplan only — pass --apply'); process.exit(0) }
await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, { settings: next })
const back = (await api('GET', `/admin/api/cms/plugins/${ID}/settings`)).settings ?? {}
if (!['siteScripts', 'connectOrigins'].every((k) => back[k] === next[k])) {
  console.error(`READ-BACK MISMATCH: ${JSON.stringify(back)}`)
  process.exit(1)
}
console.log('\nsettings written and read back — republishing')
console.log('published:', JSON.stringify(await publish()).slice(0, 200))
