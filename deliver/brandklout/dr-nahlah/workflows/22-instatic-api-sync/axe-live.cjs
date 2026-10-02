#!/usr/bin/env node
/**
 * axe-live.cjs — axe-core against published pages, desktop + mobile, the way
 * QA's website-qa check runs it (serious/critical + moderate), with the colour
 * pair and contrast ratio of every color-contrast node so a fix can be aimed.
 *
 *   node axe-live.cjs <axe.min.js> <host> /path [/path …]
 *
 * Scrolls the page through first (reveal animations finish) and waits, so a
 * heading measured mid-fade is not reported — QA's note on the animated rows.
 */
const fs = require('fs')
const puppeteer = require('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/puppeteer-core')
const [AXE, HOST, ...PATHS] = process.argv.slice(2)
const axeSrc = fs.readFileSync(AXE, 'utf8')
;(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
  for (const path of PATHS) {
    for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true }]) {
      const p = await b.newPage()
      await p.setBypassCSP(true)
      await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36')
      await p.setViewport(vp)
      try { await p.goto(HOST + path + '?v=' + Date.now(), { waitUntil: 'load', timeout: 90000 }) } catch (e) { console.log(`${path} [${vp.name}] LOAD ${e.message.slice(0, 80)}`); await p.close(); continue }
      await new Promise((r) => setTimeout(r, 3000))
      await p.evaluate(async () => {
        document.documentElement.style.scrollBehavior = 'auto'
        for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) }
        window.scrollTo(0, 0)
      })
      await new Promise((r) => setTimeout(r, 2500))
      await p.addScriptTag({ content: axeSrc })
      const res = await p.evaluate(async () => {
        const r = await window.axe.run(document, { resultTypes: ['violations'] })
        return r.violations.map((v) => ({
          id: v.id, impact: v.impact,
          nodes: v.nodes.map((n) => ({ t: n.target.join(' '), d: (n.any[0]?.data && n.any[0].data.contrastRatio) ? `${n.any[0].data.fgColor} on ${n.any[0].data.bgColor} = ${n.any[0].data.contrastRatio}:1 (need ${n.any[0].data.expectedContrastRatio})` : (n.failureSummary || '').split('\n')[1]?.trim() ?? '' })),
        }))
      })
      for (const v of res) {
        console.log(`${path} [${vp.name}] ${v.id} (${v.impact}) x${v.nodes.length}`)
        for (const n of v.nodes.slice(0, 6)) console.log(`     ${n.t.slice(0, 90)}  ${n.d.slice(0, 120)}`)
      }
      if (!res.length) console.log(`${path} [${vp.name}] clean`)
      await p.close()
    }
  }
  await b.close()
})()
