// screenshots of the hero (first viewport) for visual review:  node seo-v3/hero-shot.mjs <host> <outdir> slug@width ...
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-brandklout-website/node_modules/')
const puppeteer = require('puppeteer-core')
const [S, OUT, ...shots] = process.argv.slice(2)
mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
for (const s of shots) {
  const [slug, w] = s.split('@')
  const page = await browser.newPage()
  await page.setViewport({ width: +w, height: +w > 600 ? 900 : 844 })
  await page.goto(`${S}/${slug}?shot=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 3000))
  await page.screenshot({ path: `${OUT}/${slug}@${w}.png` })
  await page.close()
}
await browser.close()
console.log('shots', shots.length, '→', OUT)
