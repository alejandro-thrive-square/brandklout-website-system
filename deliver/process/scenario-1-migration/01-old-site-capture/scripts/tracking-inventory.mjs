#!/usr/bin/env node
/**
 * Inventory every tracker, tag and third-party widget on the old site, from a RENDERED page (tags
 * injected at runtime by GTM or a plugin never show in the raw HTML).
 *
 * Origin: written 2026-09-23 for scenario 1. No client had a tracking inventory of the old site;
 * the gaps it closes were found late on bk-ifa-dentistry (WordPress GTM-K8N3JK3Q plus Site Kit, then
 * two containers on every page after launch; UserWay injected at runtime duplicating Sienna) and
 * bk-mason-park (GHL number pool silently off when connect-src missed leadconnectorhq).
 *
 *   node tracking-inventory.mjs --urls <scrape>/site-data.json --out <dir> --limit 15 > tracking.log
 *   node tracking-inventory.mjs --urls urls.txt --out <dir>
 *
 * Renders each URL once (desktop), records every request host and every tag id found in the DOM,
 * inline scripts and request URLs. A sample of pages is enough when the templates repeat (--limit),
 * but always include the home page, a contact/booking page and a blog post.
 * Writes <out>/tracking-inventory.json and .md: per tag, the id, where it loads from and on how
 * many pages. The .md is the list to re-create (or deliberately drop) on the new site and to hand
 * to whoever owns the GA4 / Ads / GHL accounts. Phone numbers seen are listed too (a DNI pool
 * swaps them, so a number that differs between pages is a tracking number).
 */
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const val = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d }
const URLS = val('urls'), OUT = path.resolve(val('out', '.')), LIMIT = Number(val('limit', '0'))
if (!URLS) { console.error('usage: node tracking-inventory.mjs --urls <site-data.json|urls.txt> --out <dir> [--limit n]'); process.exit(2) }
const raw = fs.readFileSync(URLS, 'utf8')
let urls = URLS.endsWith('.json') ? (() => { const j = JSON.parse(raw); return (Array.isArray(j) ? j : j.pages ?? []).filter((r) => !r.error).map((r) => r.url) })()
  : raw.split(/\r?\n/).map((s) => s.trim()).filter((s) => /^https?:/.test(s))
urls = [...new Set(urls)]
if (LIMIT) urls = urls.slice(0, LIMIT)

/* [label, regex over DOM+requests; group 1 = id when there is one] */
const TAGS = [
  ['Google Tag Manager', /\b(GTM-[A-Z0-9]{5,9})\b/g],
  ['GA4 / gtag', /\b(G-[A-Z0-9]{8,12})\b/g],
  ['Universal Analytics (dead)', /\b(UA-\d{4,10}-\d{1,3})\b/g],
  ['Google Ads', /\b(AW-\d{8,12})\b/g],
  ['Meta Pixel', /fbq\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]|facebook\.com\/tr\?id=(\d{10,20})/g],
  ['Microsoft Clarity (banned: drop and remove)', /clarity\.ms\/tag\/([a-z0-9]{8,12})/g],
  ['Hotjar', /hotjar[^\n]{0,80}?hjid[:=]\s*(\d{5,9})|static\.hotjar\.com\/c\/hotjar-(\d{5,9})/g],
  ['Bing UET', /bat\.bing\.com\/(?:bat\.js|action\/0\?ti=(\d{5,12}))/g],
  ['TikTok Pixel', /analytics\.tiktok\.com[^\s"']*?sdkid=([A-Z0-9]{10,30})|ttq\.load\(['"]([A-Z0-9]{10,30})/g],
  ['LinkedIn Insight', /_linkedin_partner_id\s*=\s*["'](\d{4,10})|snap\.licdn\.com/g],
  ['CallRail', /cdn\.callrail\.com\/companies\/(\d{6,12})/g],
  ['GoHighLevel / LeadConnector', /(leadconnectorhq\.com|msgsndr\.com|link\.[a-z0-9-]+\.com\/widget)[^\s"']*/g],
  ['Termly', /app\.termly\.io\/(?:resource-blocker|embed)\/([a-f0-9-]{36})/g],
  ['UserWay', /cdn\.userway\.org[^\s"']*?account=([A-Za-z0-9]+)|userway/g],
  ['Sienna accessibility', /website-widgets\.pages\.dev|sienna/gi],
  ['reCAPTCHA', /recaptcha\/api\.js|recaptcha\/enterprise/g],
  ['Site Kit by Google', /Google Site Kit|site-kit-by-google|googlesitekit/g],
  ['YouTube', /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/g],
  ['Vimeo', /player\.vimeo\.com\/video\/(\d+)/g],
  ['Elfsight', /elfsight(?:cdn)?\.com|elfsight-app-([a-f0-9-]{36})/g],
  ['Trustindex / reviews', /trustindex\.io|reputationhub|birdeye|podium/gi],
  ['Chat widget', /tawk\.to|intercom|drift\.com|livechatinc|podium\.com\/widget/gi],
]

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const found = new Map()   // label|id -> { label, id, pages:Set, via:Set }
const hosts = new Map()
const phones = new Map()
for (const u of urls) {
  const page = await browser.newPage()
  const reqs = []
  page.on('request', (r) => reqs.push(r.url()))
  try {
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(u, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
    await new Promise((r) => setTimeout(r, 4000))
    const dom = await page.content()
    const tels = await page.evaluate(() => [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href').replace(/[^\d+]/g, '')))
    for (const t of tels) phones.set(t, (phones.get(t) || new Set()).add(u))
    for (const r of reqs) { try { const h = new URL(r).hostname; if (h !== new URL(u).hostname) hosts.set(h, (hosts.get(h) || 0) + 1) } catch {} }
    const hay = [dom, ...reqs].join('\n')
    for (const [label, re] of TAGS) for (const m of hay.matchAll(re)) {
      const id = m.slice(1).find(Boolean) || ''
      const key = `${label}|${id}`
      const rec = found.get(key) || { label, id, pages: new Set(), via: new Set() }
      rec.pages.add(u)
      rec.via.add(dom.includes(m[0]) ? 'dom' : 'request')
      found.set(key, rec)
    }
    console.log(`ok   ${u} (${reqs.length} requests)`)
  } catch (e) { console.log(`FAIL ${u}: ${e.message}`) } finally { await page.close() }
}
await browser.close()

const rows = [...found.values()].map((r) => ({ label: r.label, id: r.id, pages: r.pages.size, via: [...r.via].join('+') }))
  .sort((a, b) => a.label.localeCompare(b.label) || b.pages - a.pages)
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'tracking-inventory.json'), JSON.stringify({ checkedAt: new Date().toISOString(), pages: urls, tags: rows, thirdPartyHosts: Object.fromEntries([...hosts].sort((a, b) => b[1] - a[1])), phones: Object.fromEntries([...phones].map(([k, v]) => [k, v.size])) }, null, 1))
fs.writeFileSync(path.join(OUT, 'tracking-inventory.md'), [
  '# Tracking inventory (old site)', '', `Rendered ${urls.length} page(s) on ${new Date().toISOString().slice(0, 10)}.`, '',
  '| Tag | Id | Pages | Seen in |', '| --- | --- | --- | --- |',
  ...rows.map((r) => `| ${r.label} | ${r.id || '-'} | ${r.pages}/${urls.length} | ${r.via} |`), '',
  '## Phone links', '', ...[...phones].map(([t, s]) => `- ${t} on ${s.size} page(s)`), '',
  '## Third-party hosts', '', ...[...hosts].sort((a, b) => b[1] - a[1]).slice(0, 60).map(([h, n]) => `- ${h} (${n} requests)`), '',
  '## Decision per tag', '', 'For each row: keep (re-create on the new site, owner account named), replace, or drop. Two GTM containers on one page is a bug.', '',
  '## Version Control', '', 'Generated by deliver/process/scenario-1-migration/01-old-site-capture/scripts/tracking-inventory.mjs; follows SYSTEM_RULES.md §4.', '',
].join('\n'))
console.log(`\n${rows.length} tags, ${hosts.size} third-party hosts, ${phones.size} phone numbers; wrote ${OUT}/tracking-inventory.md`)
