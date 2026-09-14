/**
 * Allow the YouTube players v11 creates at runtime: the embed-origins plugin's `frameOrigins`.
 *
 * FOUND 2026-09-14 by verify-live.mjs and form-probe.mjs on the first v11 publish: 31 of 32 pages
 * published `frame-src 'none'`, so every story's in-place player (stories-v10.js) and the video
 * pop-up (visual.js) were blocked ("Framing 'https://www.youtube-nocookie.com/' violates … frame-src
 * 'none'"). On v2 every page carried a static YouTube embed (base.video), and the plugin's
 * `autoTrust` opened frame-src per page. v11 creates its iframes in script on Play, so only
 * /authority-score (one static embed) was opened. `frameOrigins` applies to every page at publish.
 * frame-src is the low-risk half of the plugin (a cross-origin frame cannot touch the page).
 *
 * READ, MERGE, WRITE. `deliver/process/18-instatic-embeds/set-origins.mjs` PUTs only the three origin
 * keys; this one sends back every current setting, so `siteScripts` (the accessibility widget),
 * `embedPolicy`, `autoTrust` and `connectOrigins` stay as they are. A CSP change reaches pages on the
 * NEXT publish.
 *
 * Usage: node set-frame-origins.mjs            (dry run)
 *        node set-frame-origins.mjs --apply
 */
import { api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const ID = 'brandklout.embed-origins'
const WANT = ['https://www.youtube-nocookie.com', 'https://www.youtube.com']

const cur = await api('GET', `/admin/api/cms/plugins/${ID}/settings`)
const settings = { ...(cur.settings ?? {}) }
const have = String(settings.frameOrigins ?? '').split(/\s+/).filter(Boolean)
const next = [...new Set([...have, ...WANT])].join(' ')
console.log('before', JSON.stringify(settings))
if (next === have.join(' ')) {
  console.log('frameOrigins already allows YouTube; nothing to do')
  process.exit(0)
}
settings.frameOrigins = next
console.log('after ', JSON.stringify(settings))
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
console.log('read back', JSON.stringify(back))
