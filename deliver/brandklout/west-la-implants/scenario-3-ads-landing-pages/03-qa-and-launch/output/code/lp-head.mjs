#!/usr/bin/env node
/**
 * The RENDERED <head> of every combo page. This instance has no seo-head plugin, so noindex and
 * the canonical are written at runtime by site-src/js/80-seo.js, and verify-combo-live.mjs (a
 * fetch-only gate) reports "not noindex" on pages that are. This is the check that can see it.
 * Usage: node lp-head.mjs [--base=https://host] > ../lp-head.log 2>&1
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../../../../../../..')
const puppeteer = createRequire(process.env.PUPPETEER_DIR || path.join(REPO, 'node_modules') + path.sep)('puppeteer-core')
const combo = JSON.parse(fs.readFileSync(path.resolve(HERE, '../../../01-campaign-intake/output/combo.json'), 'utf8'))
const base = ((process.argv.find((a) => a.startsWith('--base=')) || '').slice(7) || combo.origin).replace(/\/$/, '')
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--disable-gpu'] })
let bad = 0
for (const c of combo.campaigns) for (const slug of [c.landing, c.consultation, c.thankYou]) {
  const url = `${base}/${combo.prefix}${slug}`
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 })
  const h = await page.evaluate(() => ({
    robots: document.querySelector('meta[name="robots"]')?.content || '',
    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
    title: document.title,
  }))
  const ok = /noindex/.test(h.robots) && h.canonical.replace(/\/$/, '') === url
  if (!ok) bad++
  console.log(`${ok ? 'ok  ' : 'FAIL'} /${combo.prefix}${slug}  robots="${h.robots}"  canonical=${h.canonical}  "${h.title}"`)
  await page.close()
}
await browser.close()
console.log(bad ? `\nFAIL  ${bad}` : '\nFAIL  none')
process.exitCode = bad ? 1 : 0
