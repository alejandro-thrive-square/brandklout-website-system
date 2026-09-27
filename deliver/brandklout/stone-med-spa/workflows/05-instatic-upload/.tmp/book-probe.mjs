import puppeteer from 'puppeteer-core'
const BASE = process.argv[2]
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const p = await b.newPage()
const msgs = [], failed = []
p.on('console', m => msgs.push(`${m.type()}: ${m.text().slice(0, 200)}`))
p.on('requestfailed', r => failed.push(`${r.failure()?.errorText}  ${r.url().slice(0, 100)}`))
await p.goto(`${BASE}/book`, { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise(r => setTimeout(r, 6000))
const info = await p.evaluate(() => {
  const f = document.querySelector('iframe[src*="leadconnectorhq.com/widget/form/"]')
  if (!f) return { iframe: null }
  const r = f.getBoundingClientRect()
  return { iframe: { src: f.src, sandbox: f.getAttribute('sandbox'), w: Math.round(r.width), h: Math.round(r.height), inDoc: document.contains(f) } }
})
console.log(BASE)
console.log('iframe:', JSON.stringify(info.iframe))
console.log('frames attached:', b ? p.frames().map(f => f.url().slice(0, 70)).join('\n  ') : '')
const csp = await p.evaluate(() => [...document.querySelectorAll('meta[http-equiv]')].map(m => m.getAttribute('http-equiv') + '=' + m.content.slice(0, 300)))
console.log('meta http-equiv:', JSON.stringify(csp))
console.log('console:\n  ' + msgs.slice(0, 12).join('\n  '))
if (failed.length) console.log('failed requests:\n  ' + failed.slice(0, 8).join('\n  '))
await b.close()
