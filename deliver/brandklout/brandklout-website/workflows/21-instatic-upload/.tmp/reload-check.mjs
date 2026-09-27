/* "Larger font on the first load, small again on the second refresh, same in incognito" (Sang,
   2026-09-15). Load live three times in ONE browser profile (like a refresh), with the widget, and
   sample the hero h1 and the "Growth you can tie" block over time on each load. */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
const URL = process.argv[2] || 'https://brandklout-production.up.railway.app/'
const widths = (process.argv[3] || '1440,1920').split(',').map(Number)
const sample = (page) => page.evaluate(() => {
  const h1 = document.querySelector('h1')
  const growth = [...document.querySelectorAll('h2')].find((h) => /Growth you can tie/i.test(h.textContent))
  const gp = growth && growth.closest('section')?.querySelector('p')
  let ls = null
  try { ls = localStorage.getItem('asw-user-settings') } catch {}
  return {
    root: getComputedStyle(document.documentElement).fontSize,
    h1: h1 && getComputedStyle(h1).fontSize,
    h1Inline: h1 && h1.getAttribute('style'),
    h1Org: h1 && h1.dataset.aswOrgFontSize,
    growth: growth && getComputedStyle(growth).fontSize,
    growthP: gp && getComputedStyle(gp).fontSize,
    inlineCount: document.querySelectorAll('[style*="font-size"]').length,
    ls,
    fonts: document.fonts.status,
  }
})
for (const w of widths) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-reload-'))
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: dir })
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: 1000 })
  for (let n = 1; n <= 3; n++) {
    if (n === 1) await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    else await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
    for (const t of [0, 300, 1000, 2500, 5000]) {
      if (t) await new Promise((r) => setTimeout(r, t - (t === 300 ? 0 : [0, 300, 1000, 2500, 5000][[0, 300, 1000, 2500, 5000].indexOf(t) - 1])))
      const s = await sample(page)
      console.log(`w${w} load${n} t${t}: root ${s.root} h1 ${s.h1} inline[${s.h1Inline}] org ${s.h1Org} | growth ${s.growth} p ${s.growthP} | inlineFS ${s.inlineCount} | fonts ${s.fonts} | ls ${s.ls}`)
    }
  }
  await browser.close()
}
