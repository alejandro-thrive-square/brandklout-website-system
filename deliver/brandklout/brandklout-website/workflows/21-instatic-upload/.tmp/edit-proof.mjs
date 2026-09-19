// The proof Sang asked for, end to end: change a ROLE's size the way the panel writes it, publish,
// measure the hero paragraph at four widths; then the same on the Tablet tab; then revert.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const { getSite, saveShell, publish, BASE } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const ROLE = process.argv[2] || '.text-size-medium'
const SEL = process.argv[3] || '.reference-hero-copy_lead'
const measure = async (label) => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
  const out = {}
  for (const w of [1440, 1200, 900, 390]) {
    const p = await b.newPage(); await p.setViewport({ width: w, height: 900 })
    await p.goto(BASE + '/?_=' + Date.now(), { waitUntil: 'networkidle0' })
    out[w] = await p.evaluate((sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).fontSize : 'no element' }, SEL)
    await p.close()
  }
  await b.close(); console.log(label.padEnd(34), JSON.stringify(out))
}
const set = async (mutate, label) => {
  const s = await getSite(); const rule = Object.values(s.site.styleRules).find((r) => r.selector === ROLE)
  if (!rule) throw new Error(`${ROLE} is not in the registry`)
  mutate(rule)
  const res = await saveShell(s.site, s.seq); const pub = await publish()
  console.log(`${label}: saved seq ${res.seq}, published ${pub.publishedPages}`)
}
const s0 = await getSite(); const r0 = Object.values(s0.site.styleRules).find((r) => r.selector === ROLE)
console.log('role', ROLE, 'base', r0.styles.fontSize, 'responsive', JSON.stringify(r0.contextStyles))
const keep = JSON.parse(JSON.stringify({ styles: r0.styles, contextStyles: r0.contextStyles }))
await measure('before')
await set((r) => { r.styles.fontSize = '1.5rem' }, 'base -> 1.5rem (24px)')
await measure('after base edit')
await set((r) => { r.contextStyles.tablet = { ...(r.contextStyles.tablet ?? {}), fontSize: '0.75rem' } }, 'tablet tab -> 0.75rem (12px)')
await measure('after tablet edit')
await set((r) => { r.styles = keep.styles; r.contextStyles = keep.contextStyles }, 'revert')
await measure('reverted')
