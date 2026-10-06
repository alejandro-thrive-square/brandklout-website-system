import { readFileSync } from 'node:fs'
const plan = JSON.parse(readFileSync('.tmp/seo-plan.json', 'utf8')).filter(p => !['404', 'post'].includes(p.slug))
const sm = await (await fetch('https://www.drnahlah.com/sitemap.xml')).text()
const urls = new Set([...sm.matchAll(/<loc>([^<]+)/g)].map(m => m[1].replace('https://www.drnahlah.com', '') || '/'))
for (const p of plan) urls.add(p.path)
const rows = []
for (const u of urls) {
  let r, h = ''
  for (let i = 0; i < 4 && !h; i++) try { r = await fetch('https://www.drnahlah.com' + u, { redirect: 'manual' }); h = await r.text() } catch { await new Promise(s => setTimeout(s, 800)) }
  const g = re => (h.match(re) || [])[1] || ''
  rows.push({ u, s: r?.status, t: g(/<title>([^<]*)<\/title>/i), d: g(/<meta name="description" content="([^"]*)"/i), og: g(/<meta property="og:description" content="([^"]*)"/i), n: (h.match(/name="description"/g) || []).length })
}
const c = {}; rows.forEach(r => c[r.d] = (c[r.d] || 0) + 1)
console.log('urls', rows.length, '| non-200', rows.filter(r => r.s !== 200).map(r => r.u + ' ' + r.s))
console.log('missing title', rows.filter(r => !r.t).map(r => r.u), '| missing desc', rows.filter(r => !r.d).map(r => r.u), '| desc tags != 1', rows.filter(r => r.n !== 1).map(r => r.u))
console.log('og:description != description', rows.filter(r => r.og !== r.d).map(r => r.u))
console.log('duplicate descriptions', Object.entries(c).filter(([, n]) => n > 1).map(([d, n]) => n + 'x ' + d.slice(0, 60) + ' :: ' + rows.filter(r => r.d === d).map(r => r.u).join(' ')))
for (const u of ['/all-on-4', '/meet-dr-nahlah', '/ads-landing-pages/tysons-veneers', '/ads-landing-pages/alexandria-all-on-4-chatgpt']) console.log(u, '=>', rows.find(r => r.u === u)?.d)
