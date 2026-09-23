#!/usr/bin/env node
/**
 * set-openai-pixel.mjs — the OpenAI Ads (ChatGPT Ads) conversion pixel on the
 * six All-on-4 ads landing pages (2026-09-23).
 *
 *   node set-openai-pixel.mjs            # show current and intended
 *   node set-openai-pixel.mjs --apply    # write the draft; publish separately
 *
 * Two halves, because Instatic's CSP refuses inline script:
 *
 *  1. The SDK, `https://bzrcdn.openai.com/sdk/oaiq.min.js`, as an embed-origins
 *     `siteScripts` line scoped `pages=ads-landing-pages/*-all-on-4*`. NOT
 *     consent-tagged, by client instruction (2026-09-23): like the GoHighLevel
 *     pools, it runs whether or not the cookie banner is accepted. The line
 *     grants bzrcdn.openai.com; the SDK POSTs events to bzr.openai.com, which
 *     goes into `connectOrigins` or every event is refused on a strict-CSP page.
 *
 *  2. `openai-ads-pixel.js` as the code asset `src/scripts/openai-ads-pixel.js`,
 *     scoped to those six pages: the queue stub, `init`, and on the two
 *     thank-you pages `measure lead_created`. Both All-on-4 LeadConnector forms
 *     redirect to their office's thank-you page on submit (read from the forms
 *     on 2026-09-23), so the thank-you page view IS the lead.
 *
 * Read-merge-write throughout. Nothing here publishes.
 */
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, saveShell, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PLUGIN = 'brandklout.embed-origins'
const SDK_LINE = 'https://bzrcdn.openai.com/sdk/oaiq.min.js#pages=ads-landing-pages/*-all-on-4*'
const CONNECT = 'https://bzr.openai.com'
const ASSET = 'src/scripts/openai-ads-pixel.js'
const SLUG_RE = /^ads-landing-pages\/(alexandria|tysons)-all-on-4(-consultation|-thank-you)?$/

const lines = (s) => String(s ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
const merge = (cur, add) => { const out = lines(cur); if (!out.includes(add)) out.push(add); return out.join('\n') }

console.log(BASE)

// ── 1. site script + connect origin ─────────────────────────────────────────
const cur = (await api('GET', `/admin/api/cms/plugins/${PLUGIN}/settings`)).settings ?? {}
const nextSettings = {
  ...cur,
  siteScripts: merge(lines(cur.siteScripts).filter((l) => !l.includes('/sdk/oaiq.min.js')).join('\n'), SDK_LINE),
  connectOrigins: merge(cur.connectOrigins, CONNECT),
}
for (const k of ['siteScripts', 'connectOrigins']) {
  console.log(`  ${k.padEnd(15)} ${cur[k] === nextSettings[k] ? 'keep  ' : 'CHANGE'}`)
}

// ── 2. code asset, scoped to the six pages ──────────────────────────────────
const rows = (await getPages()).rows
const pages = rows.filter((r) => SLUG_RE.test(r.cells?.slug ?? r.slug))
for (const r of pages) console.log(`  page ${r.id}  /${r.cells?.slug ?? r.slug}`)
if (pages.length !== 6) { console.error(`expected 6 All-on-4 pages, found ${pages.length}`); process.exit(1) }

const content = readFileSync(resolve(HERE, 'openai-ads-pixel.js'), 'utf8')
const { site: shell, seq } = await getSite()
let file = (shell.files ?? []).find((f) => f.path === ASSET)
const now = Date.now()
const scriptCfg = {
  enabled: true, runInCanvas: false, format: 'classic', placement: 'body-end', timing: 'immediate',
  scope: { type: 'pages', pageIds: pages.map((r) => r.id) }, priority: 50,
}
const assetSame = file && file.content === content &&
  JSON.stringify(shell.runtime?.scripts?.[file.id]) === JSON.stringify(scriptCfg)
console.log(`  asset          ${!file ? 'CREATE' : assetSame ? 'keep  ' : 'CHANGE'} ${ASSET} (${content.length} chars)`)

if (!APPLY) { console.log('\nplan only — pass --apply'); process.exit(0) }

const put = await api('PUT', `/admin/api/cms/plugins/${PLUGIN}/settings`, { settings: nextSettings })
const back = (await api('GET', `/admin/api/cms/plugins/${PLUGIN}/settings`)).settings ?? {}
if (back.siteScripts !== nextSettings.siteScripts || back.connectOrigins !== nextSettings.connectOrigins) {
  console.error('plugin settings READ-BACK MISMATCH'); process.exit(1)
}
console.log('plugin settings written and read back')

if (!assetSame) {
  if (!file) {
    file = { id: randomBytes(16).toString('base64url').slice(0, 21), path: ASSET, type: 'script', content, createdAt: now, updatedAt: now }
    shell.files.push(file)
  } else {
    file.content = content
    file.updatedAt = now
  }
  shell.runtime.scripts ??= {}
  shell.runtime.scripts[file.id] = scriptCfg
  await saveShell(shell, seq)
  const { site: after } = await getSite()
  const f2 = after.files.find((f) => f.path === ASSET)
  const ok = f2 && f2.content === content && JSON.stringify(after.runtime.scripts[f2.id]) === JSON.stringify(scriptCfg)
  if (!ok) { console.error('code asset READ-BACK MISMATCH'); process.exit(1) }
  console.log(`code asset written and read back (id ${f2.id})`)
}
console.log('draft only — publish with insta-api.mjs publish')
