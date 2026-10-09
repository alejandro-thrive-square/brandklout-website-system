#!/usr/bin/env node
/**
 * hero-shot.mjs — screenshots of the first viewport, for looking at a hero before and after a
 * keyword-H1 change (hero-look.mjs measures; this is for the eye).
 *
 *   node hero-shot.mjs <origin> <outDir> /path@1440 /path@390 …   → <outDir>/<path>@<width>.png
 *
 * Needs puppeteer-core and Chrome (../lib/browser.mjs). Read-only.
 * Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v3/hero-shot.mjs.
 */
import { mkdirSync } from 'node:fs'
import puppeteer, { CHROME } from '../lib/browser.mjs'
import { pagePaths } from './lib/seo-config.mjs'

const [S0, OUT, ...shots] = process.argv.slice(2)
if (!S0 || !OUT || !shots.length) { console.error('usage: node hero-shot.mjs <origin> <outDir> /path@1440 /path@390 …'); process.exit(2) }
const S = S0.replace(/\/+$/, '')
mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
for (const s of shots) {
  const [p0, w] = s.split('@')
  const [p] = pagePaths(p0) // undoes Git Bash's rewrite of a leading "/"
  const page = await browser.newPage()
  await page.setViewport({ width: +w, height: +w > 600 ? 900 : 844 })
  // see hero-look.mjs: embeds can keep the network busy forever; the hero is ready once the page loaded
  await page.goto(`${S}${p}?shot=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 20000 }).catch((e) => { if (e.name !== 'TimeoutError') throw e })
  await page.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, 3000))
  await page.screenshot({ path: `${OUT}/${(p === '/' ? 'index' : p.slice(1)).replace(/\//g, '_')}@${w}.png` })
  await page.close()
}
await browser.close()
console.log('shots', shots.length, '→', OUT)
