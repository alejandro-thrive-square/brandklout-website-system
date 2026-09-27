const fs = require('fs')
const lines = fs.readFileSync('C:/Users/ACER/.claude-team/projects/C--Users-ACER-Documents-Webzite-Studio-Brandklout-Website-System/5002216f-40b2-474b-af62-69c0f69987d0/tool-results/pages.txt', 'utf8').split('\n').slice(1).filter((l) => l.trim() && !l.includes(' DRAFT '))
;(async () => {
  const base = 'https://livewelldentalva.webflow.io'
  const map = await (await fetch(base + '/sitemap.xml')).text()
  for (const l of lines) {
    const slug = l.split(' ')[1]
    if (!slug || map.includes('/' + slug + '<') ) continue
    const r = await fetch(base + '/' + slug + '?v=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0' } })
    if (r.status !== 200) { const r2 = await fetch(base + '/ads-landing-pages/' + slug + '?v=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0' } }); if (r2.status !== 200) { console.log('NOT FOUND /' + slug); continue } ; const h2 = await r2.text(); console.log((h2.includes('href="#consent-preferences"') ? 'OK      ' : 'MISSING ') + '/ads-landing-pages/' + slug + (h2.includes('footer-bottom') ? ' main footer' : ' (no main footer)')); continue }
    const h = await r.text()
    const link = h.includes('href="#consent-preferences"')
    console.log((link ? 'OK      ' : 'MISSING ') + '/' + slug + (link ? '' : (h.includes('footer-bottom') ? ' main footer' : ' other footer: ' + ((h.match(/<footer[^>]*class="([^"]+)"/) || h.match(/class="([^"]*footer[^"]*)"/) || [])[1] || '?'))))
  }
})()
