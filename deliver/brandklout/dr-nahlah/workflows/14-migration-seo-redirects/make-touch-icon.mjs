#!/usr/bin/env node
/**
 * make-touch-icon.mjs — the 180×180 iOS home-screen icon (QA 2026-09-28, D02).
 *
 *   node make-touch-icon.mjs <favicon.png> <out.png>
 *
 * The approved favicon is the gold "N" on transparency. iOS paints transparent
 * home-screen icons black anyway, so the icon is the same mark, opaque, on the
 * site's own --black (#0B0B0C), with room around it for iOS's rounded mask.
 * Rendered by Chrome (no sharp on this workstation).
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const puppeteer = require('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/puppeteer-core')

const [src, out] = process.argv.slice(2)
const b64 = readFileSync(src).toString('base64')
const html = `<!doctype html><html><body style="margin:0;width:180px;height:180px;background:#0B0B0C;display:grid;place-items:center">
<img src="data:image/png;base64,${b64}" style="width:150px;height:150px;display:block"></body></html>`
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.screenshot({ path: out, type: 'png', omitBackground: false, clip: { x: 0, y: 0, width: 180, height: 180 } })
await browser.close()
console.log('wrote', out)
