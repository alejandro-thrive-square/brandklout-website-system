/* Cut a y-band out of the three visual-diff images, side by side, so a band can
   be looked at rather than guessed at. Chrome is the image tool here (no sharp).
   Usage: node .tmp/crop.mjs <y0> <y1> [width] */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
// fileURLToPath, never `new URL(...).pathname`: a %20 in the workspace path
// comes back percent-encoded and every readFileSync fails.
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'visual')
const [y0, y1, W = 1440] = process.argv.slice(2).map(Number)
const SCALE = W > 700 ? 3 : 1
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, f)).toString('base64')
const html = `<body style="margin:0;background:#222;display:flex;gap:4px">` +
  ['local', 'live', 'diff'].map((k) =>
    `<div style="width:${W / SCALE}px;overflow:hidden"><div style="width:${W}px;height:${y1 - y0}px;overflow:hidden;position:relative;transform:scale(${1 / SCALE});transform-origin:0 0"><img src="${b64(`index-${W}-${k}.png`)}" style="position:absolute;top:${-y0}px;left:0;width:${W}px"></div></div>`).join('') +
  `</body>`
const br = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 300000 })
const p = await br.newPage()
await p.setViewport({ width: W, height: Math.ceil((y1 - y0) / SCALE) + 8 })
await p.setContent(html)
await p.screenshot({ path: path.join(DIR, `band-${W}-${y0}-${y1}.png`) })
await br.close()
console.log(path.join(DIR, `band-${W}-${y0}-${y1}.png`))
