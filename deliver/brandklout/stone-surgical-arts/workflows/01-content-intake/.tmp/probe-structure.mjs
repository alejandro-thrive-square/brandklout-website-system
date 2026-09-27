import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const ROOT = path.resolve('website-files')
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })

for (const rel of ['old-blog/what-is-good-for-acne-treatment-for-teens', 'news/3-surprising-celebrities-who-have-had-liposuction']) {
  const pg = await browser.newPage()
  await pg.setRequestInterception(true)
  pg.on('request', (r) => (r.url().startsWith('file:') ? r.continue() : r.abort()))
  await pg.setJavaScriptEnabled(false)
  await pg.goto(pathToFileURL(path.join(ROOT, rel, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 60000 })

  const d = await pg.evaluate(() => {
    const h1 = document.querySelector('h1')
    const chain = []
    let el = h1
    for (let i = 0; el && i < 6; i++, el = el.parentElement) {
      chain.push({
        lvl: i, tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 60),
        ps: el.querySelectorAll('p').length, h2: el.querySelectorAll('h2').length, chars: el.innerText.length,
      })
    }
    const cands = [...document.querySelectorAll('div,section,article,main')]
      .map((e) => ({ cls: String(e.className || '').slice(0, 55), tag: e.tagName.toLowerCase(), ps: e.querySelectorAll('p').length, h2: e.querySelectorAll('h2').length, chars: e.innerText.length }))
      .filter((c) => c.ps >= 5)
      .sort((a, b) => a.chars - b.chars)
      .slice(0, 6)
    const dates = []
    for (const e of document.querySelectorAll('time, .date, .post-date, [class*=date]')) {
      const t = e.innerText.trim()
      if (t && t.length < 40) dates.push(String(e.className || e.tagName) + ' => ' + t)
    }
    return { title: document.title, h1: h1 && h1.innerText.trim(), chain, cands, dates: dates.slice(0, 5) }
  })

  console.log('\n===', rel)
  console.log('  title:', d.title)
  console.log('  h1   :', d.h1)
  console.log('  ancestors of h1:')
  for (const c of d.chain) console.log('   ', JSON.stringify(c))
  console.log('  smallest containers with >=5 <p>:')
  for (const c of d.cands) console.log('   ', JSON.stringify(c))
  console.log('  date candidates:', JSON.stringify(d.dates))
  await pg.close()
}
await browser.close()
