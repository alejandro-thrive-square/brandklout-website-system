#!/usr/bin/env node
// One-off probe: evaluate an expression at a given scroll position.
//   node probe.mjs <width> <height> <scrollY> "<expression>"
import puppeteer from 'puppeteer-core'
const [W, H, Y, EXPR] = [Number(process.argv[2]), Number(process.argv[3]), Number(process.argv[4]), process.argv[5]]
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1, isMobile: W < 768, hasTouch: W < 768 })
await page.goto(process.env.URL_ || 'http://localhost:4173/home/?smooth=off', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 3000))
await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), Y)
await new Promise(r => setTimeout(r, 600))
const out = await page.evaluate(EXPR)
console.log(JSON.stringify(out, null, 2))
await browser.close()
