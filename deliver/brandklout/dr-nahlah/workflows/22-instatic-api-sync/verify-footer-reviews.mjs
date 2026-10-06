// Read-only gate for push-footer-reviews.mjs, against the PUBLISHED site of the host in use.
//   node verify-footer-reviews.mjs [--layout]
// Every public URL (page rows minus templates + every published post):
//   site pages  one "Find Us Online" block; McLean and Alexandria each with Facebook, Google, Yelp
//               at exactly the supplied URLs; Instagram, RealSelf, Vitals, Healthgrades after them;
//               the two superseded links gone; every link target=_blank with ONE rel and an
//               aria-label; nothing else in the footer changed in count (3 other columns, base row)
//   ads pages   no block at all
// --layout: Chrome, scripts ON, at 1440 / 760 / 390 on two pages: no link sticks out of the first
//           column, no horizontal page overflow; screenshots in .tmp/social/.
import { pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE } from './sedation-api.mjs'
import { OFFICES, OTHERS } from './footer-reviews-links.mjs'
const HERE = dirname(fileURLToPath(import.meta.url))
const lib = await import(pathToFileURL('C:/Users/ACER/Documents/Webzite Studio/Brandklout Website System/deliver/process/tools/instatic-api-sync/insta-api.mjs').href)
const slugs = await lib.pageSlugs()
const OLD = ['https://www.facebook.com/drnahlahprosthodontist/"', 'maps.google.com/?cid=16584195885077624360']
let bad = 0, site = 0, ads = 0
const fail = (slug, why) => { bad++; console.log(`FAIL  /${slug}: ${why}`) }
for (const slug of slugs) {
  const res = await fetch(`${BASE}/${slug}`)
  const html = await res.text()
  if (res.status !== 200) { fail(slug, `status ${res.status}`); continue }
  const blocks = html.split('Find Us Online').length - 1
  if (slug.startsWith('ads-landing-pages/')) {
    ads++
    if (blocks || /DrNahlahAlexandria|yelp\.com/.test(html)) fail(slug, 'an ads page carries the block')
    continue
  }
  site++
  if (blocks !== 1) { fail(slug, `${blocks} "Find Us Online" blocks`); continue }
  const foot = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'))
  const col1 = foot.slice(foot.indexOf('Find Us Online'), foot.indexOf('Treatments'))
  const links = [...col1.matchAll(/<a\b([^>]*)>([^<]*)<\/a>/g)].map((m) => ({ attrs: m[1], text: m[2], href: (m[1].match(/href="([^"]*)"/) ?? [])[1]?.replace(/&amp;/g, '&') }))
  const want = [...OFFICES.flatMap(([, l]) => l), ...OTHERS]
  if (links.length !== want.length) { fail(slug, `${links.length} links in the block, want ${want.length}`); continue }
  links.forEach((l, i) => {
    if (l.text !== want[i][0] || l.href !== want[i][1]) fail(slug, `link ${i + 1} is ${l.text} ${l.href}, want ${want[i][0]} ${want[i][1]}`)
    if (!/target="_blank"/.test(l.attrs) || (l.attrs.match(/\brel=/g) ?? []).length !== 1 || !/rel="noopener noreferrer"/.test(l.attrs)) fail(slug, `link ${l.text}: target/rel`)
    if (!/aria-label="Dr\. Nahlah [^"]*\(opens in a new tab\)"/.test(l.attrs)) fail(slug, `link ${l.text}: aria-label`)
  })
  const labels = [...col1.matchAll(/<b\b[^>]*>([^<]*)<\/b>/g)].map((m) => m[1])
  if (labels.join('|') !== OFFICES.map(([o]) => o).join('|')) fail(slug, `office labels ${labels.join('|')}`)
  for (const o of OLD) if (foot.includes(o)) fail(slug, `superseded link still there: ${o}`)
  const h2 = [...foot.matchAll(/<h2\b[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1]).join('|')
  if (h2 !== 'Find Us Online|Treatments|Patients|Hours') fail(slug, `footer headings ${h2}`)
  const total = (foot.match(/<a\b/g) ?? []).length
  if (total !== 10 + 5 + 6 + 4 + 3) fail(slug, `${total} links in the footer, want 28`)
}
console.log(`${bad ? 'FAIL' : 'ok  '}  ${BASE}: ${slugs.length} URLs — ${site} site pages with the block, ${ads} ads pages without; ${bad} problem(s)`)

if (process.argv.includes('--layout')) {
  const { createRequire } = await import('node:module')
  const require = createRequire('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-brandklout-website/node_modules/')
  const puppeteer = require('puppeteer-core')
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
  const host = BASE.replace(/^https?:\/\//, '')
  try {
    for (const slug of ['about', 'posts']) for (const width of [1440, 760, 390]) {
      const page = await browser.newPage()
      await page.setViewport({ width, height: 900 })
      try { await page.goto(`${BASE}/${slug}`, { waitUntil: 'networkidle2', timeout: 90000 }) } catch { await page.goto(`${BASE}/${slug}`, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {}) }
      await new Promise((r) => setTimeout(r, 3000))
      const m = await page.evaluate(() => {
        const h = [...document.querySelectorAll('footer h2')].find((x) => x.textContent.trim() === 'Find Us Online')
        const col = h.parentElement
        const cr = col.getBoundingClientRect()
        const items = [...col.querySelectorAll('a, b')]
        const over = Math.round(Math.max(...items.map((e) => e.getBoundingClientRect().right)) - cr.right)
        const lines = new Map()
        for (const e of items) { const t = Math.round(e.getBoundingClientRect().top - cr.top); lines.set(t, [...(lines.get(t) ?? []), e.textContent.trim()]) }
        const next = col.nextElementSibling?.getBoundingClientRect()
        return { colW: Math.round(cr.width), over, lines: [...lines.values()].map((l) => l.join(' ')).join(' / '), overflowX: document.documentElement.scrollWidth - window.innerWidth, intoNext: next && next.top < cr.bottom ? Math.round(Math.max(...items.map((e) => e.getBoundingClientRect().right)) - next.left) : null, small: items.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 11).length }
      })
      const ok = m.over <= 0 && m.overflowX <= 0 && (m.intoNext === null || m.intoNext <= 0)
      if (!ok) bad++
      console.log(`${ok ? 'ok  ' : 'FAIL'}  layout /${slug} @${width}: column ${m.colW}px, sticks out ${m.over}px, page overflow-x ${m.overflowX} | ${m.lines}`)
      if (slug === 'about') {
        await page.setJavaScriptEnabled(false)
        await page.goto(`${BASE}/${slug}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
        await new Promise((r) => setTimeout(r, 1500))
        await (await page.$('footer')).screenshot({ path: join(HERE, '.tmp', 'social', `footer-reviews-${host}-${width}.png`) })
      }
      await page.close()
    }
  } finally { await browser.close() }
}
process.exit(bad ? 1 : 0)
