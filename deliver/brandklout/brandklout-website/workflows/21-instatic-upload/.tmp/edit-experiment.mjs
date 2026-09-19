import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const { api, getSite, saveShell, publish, BASE } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const SEL = '.reference-hero-copy_lead'
const measure = async (label) => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
  const out = {}
  for (const w of [1440, 1200, 900, 390]) {
    const p = await b.newPage(); await p.setViewport({ width: w, height: 900 })
    await p.goto(BASE + '/?_=' + Date.now(), { waitUntil: 'networkidle0' })
    out[w] = await p.evaluate((sel) => getComputedStyle(document.querySelector(sel)).fontSize, SEL)
    await p.close()
  }
  await b.close(); console.log(label, JSON.stringify(out))
}
const setSize = async (value) => {
  const s = await getSite(); const shell = s.site
  const rule = Object.values(shell.styleRules).find((r) => r.selector === '.text-18-7')
  console.log('rule', rule.selector, 'fontSize', rule.styles.fontSize, '->', value)
  rule.styles.fontSize = value
  const res = await saveShell(shell, s.seq); console.log('saved', JSON.stringify(res).slice(0, 80))
  console.log('publish', JSON.stringify(await publish()).slice(0, 60))
}
await measure('before')
await setSize('1.5rem')          // what a panel edit of the type chip at the base breakpoint writes: 24px
await measure('after edit')
await setSize('1.125rem')        // revert
await measure('reverted')
