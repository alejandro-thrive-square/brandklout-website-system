#!/usr/bin/env node
/**
 * seo-head-check.mjs — the live SEO head gate: every URL has a title, one description, one canonical,
 * a distinct og:url equal to the canonical, an absolute og:image, and JSON-LD that PARSES with no
 * duplicate @id. Optionally checks that the brandklout.open-graph / brandklout.aeo-schema plugins are
 * installed, enabled and pointed at the public host.
 *
 * Origin: bk-dr-nahlah, workflows/16-instatic-plugins/verify-seo-plugins.mjs. Promoted 2026-09-23 and
 * fixed on the way: the original imported a non-existent ../15-instatic-api-sync client, used the
 * pre-migration `webzite.*` plugin ids and hardcoded drnahlah.com and the `posts` table.
 *
 * --render reads the head from the RENDERED DOM (puppeteer) instead of the raw HTML. Use it on any
 * site whose head is replayed by site.js after parse (every WordPress clone): a raw-HTML gate reports
 * "no canonical" or "clean" there while the live page says otherwise.
 *
 * Usage:
 *   node seo-head-check.mjs --public https://www.example.com [--tables posts,articles] [--limit 8]
 *                           [--org-type Dentist] [--render] [--no-plugins]
 * Env: INSTATIC_BASE_URL (+ login) for the page list and plugin settings. Pages are fetched from
 * --public (defaults to INSTATIC_BASE_URL). Redirect output to a file on Windows.
 */
import { getPages, api, BASE } from '../lib/site.mjs'

const argv = process.argv.slice(2)
const arg = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined }
const PUBLIC = (arg('public') || BASE).replace(/\/$/, '')
const LIMIT = arg('limit') ? Number(arg('limit')) : Infinity
const TABLES = (arg('tables') || '').split(',').filter(Boolean)
const ORG = arg('org-type')
const RENDER = argv.includes('--render')
const PLUGINS = !argv.includes('--no-plugins')

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) pass++
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n          ' + String(detail).slice(0, 300) : ''}`) }
}

if (PLUGINS) {
  console.log('\nplugins\n')
  const installed = (await api('GET', '/admin/api/cms/plugins')).plugins ?? []
  for (const id of ['brandklout.open-graph', 'brandklout.aeo-schema']) {
    const p = installed.find((x) => (x.manifest?.id ?? x.id) === id)
    check(`${id} is installed`, !!p)
    if (!p) continue
    check(`${id} is enabled and active`, p.enabled === true && p.lifecycleStatus !== 'error', `enabled=${p.enabled} status=${p.lifecycleStatus}`)
    const settings = (await api('GET', `/admin/api/cms/plugins/${id}/settings`)).settings ?? {}
    check(`${id} siteUrl is the public host`, !settings.siteUrl || settings.siteUrl.replace(/\/$/, '') === PUBLIC, settings.siteUrl)
    console.log(`  ${id}  enabled=${p.enabled}  siteUrl=${settings.siteUrl ?? '(unset)'}`)
  }
}

const { rows } = await getPages()
const paths = rows
  .filter((r) => r.cells?.templateEnabled !== true)
  .map((r) => ((r.cells?.slug ?? r.slug) === 'index' ? '/' : `/${r.cells?.slug ?? r.slug}`))
for (const t of TABLES) {
  const table = ((await api('GET', '/admin/api/cms/data/tables')).tables || []).find((x) => x.slug === t)
  const { rows: entries } = await api('GET', `/admin/api/cms/data/tables/${t}/rows`)
  const base = (table?.routeBase || `/${t}`).replace(/\/$/, '')
  for (const e of entries) paths.push(`${base}/${e.slug ?? e.cells?.slug}`)
}
const list = paths.slice(0, LIMIT)
console.log(`\n${list.length} URLs on ${PUBLIC}${RENDER ? ' (rendered)' : ''}\n`)

let browser = null
if (RENDER) {
  const { default: puppeteer, CHROME } = await import('../lib/browser.mjs')
  browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
}

async function headOf(url) {
  if (!browser) {
    const r = await fetch(url)
    if (!r.ok) return { status: r.status }
    const html = await r.text()
    const doc = html.slice(0, html.indexOf('</head>') > -1 ? html.indexOf('</head>') : undefined)
    const all = (re) => [...doc.matchAll(re)].map((m) => m[1])
    return {
      status: 200,
      title: all(/<title>([^<]*)<\/title>/g),
      desc: all(/<meta name="description" content="([^"]*)"/g),
      canon: all(/<link rel="canonical" href="([^"]*)"/g),
      ogUrl: all(/<meta property="og:url" content="([^"]*)"/g),
      ogImage: all(/<meta property="og:image" content="([^"]*)"/g),
      robots: all(/<meta name="robots" content="([^"]*)"/g),
      ld: [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]),
    }
  }
  const page = await browser.newPage()
  const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  const out = await page.evaluate(() => {
    const q = (s, a) => [...document.querySelectorAll(s)].map((e) => e.getAttribute(a))
    return {
      title: [document.title], desc: q('meta[name="description"]', 'content'), canon: q('link[rel="canonical"]', 'href'),
      ogUrl: q('meta[property="og:url"]', 'content'), ogImage: q('meta[property="og:image"]', 'content'),
      robots: q('meta[name="robots"]', 'content'), ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
    }
  })
  await page.close()
  return { status: res?.status() ?? 0, ...out }
}

const seenOg = new Map()
const seenCanon = new Map()
for (const p of list) {
  const h = await headOf(PUBLIC + p)
  if (h.status !== 200) { check(`${p} answers 200`, false, h.status); continue }
  check(`${p} has a title`, h.title.length === 1 && h.title[0].trim().length > 0)
  check(`${p} has exactly one description`, h.desc.length === 1, h.desc.length)
  check(`${p} has exactly one canonical`, h.canon.length === 1, h.canon.length)
  check(`${p} og:url matches the canonical`, h.ogUrl[0] === h.canon[0], `${h.ogUrl[0]} vs ${h.canon[0]}`)
  check(`${p} canonical is on the public host and ends at this path`, h.canon[0] === PUBLIC + (p === '/' ? '/' : p) || h.canon[0] === PUBLIC + p, h.canon[0])
  check(`${p} has an absolute og:image`, /^https:\/\//.test(h.ogImage[0] || ''), h.ogImage[0])
  check(`${p} is not noindex`, !h.robots.some((r) => /noindex/i.test(r)), h.robots.join(','))
  for (const [seen, v] of [[seenOg, h.ogUrl[0]], [seenCanon, h.canon[0]]]) {
    if (!v) continue
    if (seen.has(v)) check(`${v} is unique`, false, `${seen.get(v)} and ${p}`)
    else seen.set(v, p)
  }
  check(`${p} has JSON-LD`, h.ld.length > 0)
  for (const raw of h.ld) {
    let doc
    try { doc = JSON.parse(raw) } catch (e) { check(`${p} JSON-LD parses`, false, e.message); continue }
    const nodes = doc['@graph'] || [doc]
    const types = nodes.flatMap((n) => [].concat(n['@type'] || [])) // @type is a string OR an array
    if (ORG) check(`${p} carries a ${ORG} node`, types.includes(ORG), types.join(','))
    check(`${p} interior page carries breadcrumbs`, p === '/' || types.includes('BreadcrumbList') || h.ld.length > 1, types.join(','))
    const ids = nodes.map((n) => n['@id']).filter(Boolean)
    check(`${p} no @id twice`, new Set(ids).size === ids.length)
  }
}
if (browser) await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
