#!/usr/bin/env node
/**
 * set-site-tags.mjs — put the four site tags Brandklout supplied on 2026-09-17
 * on every page, through the Embed Origins plugin's `siteScripts`, and open
 * the two origins Termly needs. Read-merge-write: nothing already in the
 * plugin's settings is dropped.
 *
 *   node set-site-tags.mjs            # show current and intended
 *   node set-site-tags.mjs --apply
 *
 * The house order: Termly FIRST (autoBlock=off — on, it would hold back the
 * LeadConnector form and the films until consent, which on a paid page is the
 * whole page), then Google Tag Manager, then the LeadConnector number pool and
 * its session helper. The Sienna accessibility widget that was already there
 * stays first, because it was first.
 *
 * GTM goes in as its script URL rather than the inline bootstrap: `siteScripts`
 * takes URLs, and gtm.js loaded directly is Google's own documented async
 * install; the inline snippet only adds a `gtm.start` timing event.
 *
 * Termly's Accept/Decline POST goes to us.consent.api.termly.io (connect) and
 * its policy viewer opens from app.termly.io (frame); without the connect
 * grant the banner shows and the choice is never saved. The production CSP is
 * already `https:` for both, so this is belt and braces there and the real
 * fix on any instance with a strict CSP.
 */
import { api, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const ID = 'brandklout.embed-origins'
const APPLY = process.argv.includes('--apply')

const TAGS = [
  'https://app.termly.io/resource-blocker/7737150b-c6b0-4003-a1b0-52a6495a4a4f?autoBlock=off',
  'https://www.googletagmanager.com/gtm.js?id=GTM-MR7K64XD',
  'https://backend.leadconnectorhq.com/appengine/loc/2TREkW8S3atQcs063Pqq/pool/JwgT5kbiwBqLqoz0SpUl/number_pool.js',
  'https://backend.leadconnectorhq.com/appengine/js/user_session.js',
]
const FRAME = ['https://app.termly.io']
const CONNECT = ['https://us.consent.api.termly.io']

const lines = (s) => String(s ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
const merge = (cur, add) => { const out = lines(cur); for (const a of add) if (!out.includes(a)) out.push(a); return out.join('\n') }

const cur = await api('GET', `/admin/api/cms/plugins/${ID}/settings`)
const settings = { ...(cur.settings ?? {}) }
const next = {
  ...settings,
  siteScripts: merge(settings.siteScripts, TAGS),
  frameOrigins: merge(settings.frameOrigins, FRAME),
  connectOrigins: merge(settings.connectOrigins, CONNECT),
}
console.log(BASE)
for (const k of ['embedPolicy', 'autoTrust', 'siteScripts', 'frameOrigins', 'scriptOrigins', 'connectOrigins']) {
  const a = JSON.stringify(settings[k] ?? ''), b = JSON.stringify(next[k] ?? '')
  console.log(`  ${k.padEnd(15)} ${a === b ? 'keep   ' : 'CHANGE '} ${b}`)
}
if (!APPLY) { console.log('\nplan only — pass --apply'); process.exit(0) }
const res = await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, { settings: next })
const back = await api('GET', `/admin/api/cms/plugins/${ID}/settings`)
const ok = ['siteScripts', 'frameOrigins', 'connectOrigins'].every((k) => (back.settings ?? {})[k] === next[k])
console.log(ok ? '\nsettings written and read back' : `\nREAD-BACK MISMATCH: ${JSON.stringify(back.settings)}`)
if (!ok) process.exit(1)
console.log('published pages keep their old CSP and tags until the site is republished.')
