#!/usr/bin/env node
/**
 * add-vimeo-frame-origin.mjs — add player.vimeo.com to the Embed Origins
 * frame allowlist, without disturbing the other four settings.
 *
 *   node add-vimeo-frame-origin.mjs            # show current
 *   node add-vimeo-frame-origin.mjs --apply
 *
 * READ-MERGE-WRITE, deliberately. The shared `set-origins.mjs` in
 * process/18-instatic-embeds sends all three origin fields from its own flags,
 * so running it here would blank `connectOrigins` (Termly) and, because the
 * PUT replaces the record, `siteScripts` — which carries Sienna, Termly, GTM
 * and both LeadConnector tags. Never call it on this site.
 *
 * Why this is needed at all: `autoTrust` lifts frame-src only for embeds that
 * are IN the published HTML. The .vl-card facades build their iframe in
 * JavaScript on click, so the player origin is invisible to that scan and the
 * film dies silently behind CSP. The two Vimeo films already live here are
 * static snippets, which is why they work without this entry.
 */
import { api, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const ID = 'brandklout.embed-origins'
const ORIGIN = 'https://player.vimeo.com'
const APPLY = process.argv.includes('--apply')

const cur = await api('GET', '/admin/api/cms/plugins/' + ID + '/settings')
const settings = cur.settings ?? {}
console.log('BASE', BASE)
for (const [k, v] of Object.entries(settings)) {
  console.log('  ' + k.padEnd(15), JSON.stringify(v).slice(0, 150))
}

const frames = String(settings.frameOrigins ?? '').split(/[\n,]/).map(s => s.trim()).filter(Boolean)
if (frames.includes(ORIGIN)) { console.log('\n' + ORIGIN + ' already present — nothing to do'); process.exit(0) }

const next = { ...settings, frameOrigins: [...frames, ORIGIN].join('\n') }
console.log('\nframeOrigins: ' + frames.length + ' -> ' + (frames.length + 1))
console.log(JSON.stringify(next.frameOrigins))
console.log('other settings carried through unchanged: ' + Object.keys(settings).filter(k => k !== 'frameOrigins').join(', '))

if (!APPLY) { console.log('\nplan only — pass --apply to write'); process.exit(0) }

await api('PUT', '/admin/api/cms/plugins/' + ID + '/settings', { settings: next })
const back = (await api('GET', '/admin/api/cms/plugins/' + ID + '/settings')).settings ?? {}
const ok = String(back.frameOrigins).includes(ORIGIN)
  && String(back.siteScripts ?? '') === String(settings.siteScripts ?? '')
  && String(back.connectOrigins ?? '') === String(settings.connectOrigins ?? '')
console.log('\nwritten. vimeo present: ' + String(back.frameOrigins).includes(ORIGIN)
  + ' | siteScripts intact: ' + (String(back.siteScripts ?? '') === String(settings.siteScripts ?? ''))
  + ' | connectOrigins intact: ' + (String(back.connectOrigins ?? '') === String(settings.connectOrigins ?? '')))
if (!ok) process.exit(1)
