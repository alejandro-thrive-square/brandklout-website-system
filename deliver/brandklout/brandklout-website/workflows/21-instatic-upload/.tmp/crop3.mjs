import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const [base, y0, h, out] = process.argv.slice(2)
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64')
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440 * 3 + 40, height: Number(h) })
const imgs = ['local', 'live', 'diff'].map((k) => `<div style="width:1440px;height:${h}px;overflow:hidden;position:relative;display:inline-block;margin-right:20px"><img src="${b64(`visual/${base}-${k}.png`)}" style="position:absolute;top:-${y0}px;left:0"></div>`).join('')
await page.setContent(`<body style="margin:0;background:#888;white-space:nowrap">${imgs}</body>`)
await new Promise((r) => setTimeout(r, 500))
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1440 * 3 + 40, height: Number(h) } })
await browser.close()
