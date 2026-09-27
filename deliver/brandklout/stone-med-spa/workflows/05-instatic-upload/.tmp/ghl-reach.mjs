import puppeteer from 'puppeteer-core'
const URL_ = 'https://api.leadconnectorhq.com/widget/form/Gqnb0W1NH95MjROPRaLe'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const p = await b.newPage()
const fails = []
p.on('requestfailed', r => fails.push(`${r.failure()?.errorText}  ${r.url().slice(0, 90)}`))
let status = 'none'
try {
  const res = await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 30000 })
  status = res ? `${res.status()} ${(await res.text()).length} bytes` : 'no response'
} catch (e) { status = 'THREW: ' + e.message.slice(0, 120) }
console.log('direct load of the GHL form in Chrome:', status)
console.log('inputs seen:', await p.evaluate(() => document.querySelectorAll('input, textarea').length).catch(() => 'n/a'))
if (fails.length) console.log('failed requests:\n  ' + fails.slice(0, 5).join('\n  '))
await b.close()
