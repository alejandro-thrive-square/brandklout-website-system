// Gate: does the Sienna widget leave any text at a pinned inline size? (found 2026-10-01)
//
// Every other gate BLOCKS sienna-accessibility (trap 38), so none of them can see what it does
// to the page. This one keeps it, loads each page several times alternating cold and warm cache
// (warm is the race a returning visitor hits), and fails on a nav link that is not 12px or on any
// element Sienna stamped that still carries an inline font-size. See js/01-sienna.js.
//
//   node sienna-test.mjs https://westlaketxmedspa.com [loads=4]
//   PAGES=/,/about node sienna-test.mjs https://staging.westlaketxmedspa.com
//   (Git Bash rewrites PAGES=/... into a Windows path: prefix MSYS_NO_PATHCONV=1)
import puppeteer from 'puppeteer-core'
const [host, n = '4'] = process.argv.slice(2)
const pages = (process.env.PAGES || '/,/about,/results,/botox').split(',')
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
let bad = 0
for (const p of pages) {
  const row = []
  for (let i = 0; i < +n; i++) {
    const pg = await b.newPage()
    await pg.setCacheEnabled(i % 2 === 1) // alternate cold / warm (warm = the race the user hits)
    await pg.setViewport({ width: 1440, height: 900 })
    await pg.goto(host + p, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(r => setTimeout(r, 2500))
    const m = await pg.evaluate(() => {
      const a = document.querySelector('.navbar_menu > .navbar_link')
      const h1 = document.querySelector('h1')
      return { link: getComputedStyle(a).fontSize, h1: h1 ? getComputedStyle(h1).fontSize : '-', stamped: document.querySelectorAll('[data-asw-org-font-size]').length, inline: document.querySelectorAll('[data-asw-org-font-size][style*="font-size"]').length, sienna: !!document.querySelector('.asw-menu-btn, .asw-widget') }
    })
    if (m.link !== '12px' || m.inline) bad++
    row.push(`${m.link}/h1 ${m.h1}/stamped ${m.stamped}/inline ${m.inline}${m.sienna ? '' : '/NO-WIDGET'}`)
    await pg.close()
  }
  console.log(p.padEnd(9), row.join('  '))
}
console.log(bad ? `FAIL ${bad}` : 'FAIL none'); if (bad) process.exitCode = 1
await b.close()
