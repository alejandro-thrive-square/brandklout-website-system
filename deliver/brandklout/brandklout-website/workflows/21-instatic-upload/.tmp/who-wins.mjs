import puppeteer from 'puppeteer-core'
const SEL = process.argv[2] || '.reference-hero-copy_lead'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const p = await b.newPage(); await p.setViewport({ width: Number(process.argv[3] || 1440), height: 900 })
await p.goto('https://brandklout-production.up.railway.app/?_=' + Date.now(), { waitUntil: 'networkidle0' })
const out = await p.evaluate((sel) => {
  const el = document.querySelector(sel)
  const hits = []
  const walk = (rules, href, media) => { for (const r of rules) { if (r.cssRules && r.media) walk(r.cssRules, href, r.media.mediaText); else if (r.style && r.style.fontSize) { try { if (el.matches(r.selectorText)) hits.push({ href: href.split('/').pop(), media, sel: r.selectorText, fontSize: r.style.fontSize, prio: r.style.getPropertyPriority('font-size') }) } catch {} } } }
  for (const s of document.styleSheets) { try { walk(s.cssRules, s.href || 'inline', '') } catch (e) { hits.push({ href: s.href, err: String(e) }) } }
  return { classes: el.className, inline: el.getAttribute('style'), computed: getComputedStyle(el).fontSize, hits }
}, SEL)
console.log(JSON.stringify(out, null, 1))
await b.close()
