#!/usr/bin/env node
/**
 * shot.mjs — screenshots for review: the viewport at the top of a page, or one element by selector.
 *   node shot.mjs <url> <out.png> [width] [selector]
 * Run from scenario-7-seo-aeo/02-on-page (puppeteer-core via tools/instatic-site/lib/browser.mjs).
 */
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const [url, out, w, sel] = process.argv.slice(2)
const { default: puppeteer, CHROME } = await import(pathToFileURL(resolve('../../tools/instatic-site/lib/browser.mjs')).href)
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: Number(w || 1440), height: 900 })
await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 }).catch((e) => { if (e.name !== 'TimeoutError') throw e })
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
await new Promise((r) => setTimeout(r, 3000))
if (sel) {
  const el = await page.$(sel)
  if (!el) { console.log('no element', sel); process.exit(1) }
  // GSAP ScrollSmoother keeps the page in a fixed wrapper: scroll with its own API so the reveal
  // animations fire, then shoot the viewport (an element shot of a smoothed page comes out blank)
  await page.evaluate((s) => { const sm = window.ScrollSmoother?.get?.(); if (sm) sm.scrollTo(s, false, 'top 80px'); else document.querySelector(s).scrollIntoView({ block: 'start' }) }, sel)
  await page.addStyleTag({ content: '[id^=termly],[class*=termly],#termly-code-snippet-support{display:none!important}' })
  await new Promise((r) => setTimeout(r, 3500))
  await page.screenshot({ path: out })
} else await page.screenshot({ path: out })
await browser.close()
console.log('wrote', out)
