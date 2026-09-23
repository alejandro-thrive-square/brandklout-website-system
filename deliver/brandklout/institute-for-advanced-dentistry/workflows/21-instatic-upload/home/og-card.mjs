/**
 * The share card: the practice's colour logo centred on white, 1200x630 (what every network crops
 * to). Rendered in the installed Chrome — there is no image library in this repo.
 *
 * The logo is 734px wide at source and is drawn at 734, so nothing is upscaled; the margins keep it
 * clear of the centre-square crop some apps apply.
 *
 * Usage: node home/og-card.mjs <logo.png> <out.png>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const [src, out] = process.argv.slice(2)
if (!src || !out) { console.error('usage: node home/og-card.mjs <logo.png> <out.png>'); process.exit(2) }
const uri = `data:image/png;base64,${readFileSync(src).toString('base64')}`

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await page.setContent(`<!doctype html><html><body style="margin:0;width:1200px;height:630px;background:#fff;display:grid;place-items:center">
  <img id="l" src="${uri}" style="width:734px;height:auto;display:block"></body></html>`)
await page.waitForFunction(() => document.getElementById('l').naturalWidth > 0)
const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 }, omitBackground: false })
writeFileSync(out, png)
await browser.close()
console.log(`wrote ${out}`)
