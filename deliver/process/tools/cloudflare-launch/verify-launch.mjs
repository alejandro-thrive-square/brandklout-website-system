#!/usr/bin/env node
/**
 * Prove a launched domain from the outside. No credentials; changes nothing.
 *
 * Origin: bk-stone-med-spa 06-cloudflare-sitemap/verify-sitemap.mjs (2026-09-15) and bk-dr-nahlah
 * cloudflare-launch/verify-live.mjs (2026-08-25), generalized 2026-09-23. Redirect maps are
 * verified separately with scenario-1-migration/scripts/verify-redirects.mjs.
 *
 *   node verify-launch.mjs --canonical https://www.example.com --sitemap out/sitemap.xml > verify.log
 *   node verify-launch.mjs --canonical https://www.example.com --sitemap out/sitemap.xml --no-staging
 *
 * Checks, ending "FAIL  none" or the list of failures (exit code follows):
 *   - the other host (apex or www) answers ONE 301 to the canonical host, path and query kept
 *   - http:// answers a redirect to https:// (Always Use HTTPS)
 *   - /sitemap.xml on both hosts: 200, XML, byte-identical to the build (a ?query variant too,
 *     which catches a route without its trailing *)
 *   - every <loc> answers 200 on the canonical host, none is a redirect
 *   - robots.txt is still the edge's file (a Worker on robots.txt shrank it to 70 B once)
 *   - staging.<domain>: X-Robots-Tag noindex, no sitemap, and the page carries no canonical or
 *     og:url pointing at production (raw HTML only: also run the rendered staging gate)
 *   - /admin answers (the login itself is proven by check-origins.mjs, not here)
 */
import { readFileSync } from 'node:fs'
import { arg, flag } from './cf-api.mjs'

const CANONICAL = (arg('canonical') || '').replace(/\/$/, '')
const SITEMAP = arg('sitemap')
if (!/^https:\/\/[^/]+$/.test(CANONICAL)) { console.error('usage: node verify-launch.mjs --canonical https://www.example.com [--sitemap out/sitemap.xml] [--no-staging]'); process.exit(2) }
const host = CANONICAL.replace('https://', '')
const apex = host.replace(/^www\./, '')
const other = host.startsWith('www.') ? apex : `www.${apex}`
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' }
const fails = []
const get = (u, o = {}) => fetch(u, { redirect: 'manual', headers: UA, ...o }).catch((e) => ({ status: e.cause?.code ?? e.message, headers: new Headers(), text: async () => '' }))
const ok = (label, cond, detail = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${detail ? `  ${detail}` : ''}`); if (!cond) fails.push(label) }

// canonical host
{
  const r = await get(`https://${other}/some-path?utm_source=verify`)
  ok(`${other} 301s to the canonical host, path + query kept`, r.status === 301 && r.headers.get('location') === `${CANONICAL}/some-path?utm_source=verify`, `${r.status} ${r.headers.get('location') ?? ''}`)
  const h = await get(`http://${host}/`)
  ok('http:// redirects to https://', [301, 302, 307, 308].includes(h.status) && /^https:/.test(h.headers.get('location') ?? ''), `${h.status} ${h.headers.get('location') ?? ''}`)
  const home = await get(CANONICAL + '/')
  ok('canonical home answers 200', home.status === 200, String(home.status))
}

// sitemap
if (SITEMAP) {
  const built = readFileSync(SITEMAP, 'utf8')
  for (const h of [host, other]) for (const q of ['', `?v=${Date.now()}`]) {
    const r = await get(`https://${h}/sitemap.xml${q}`)
    const body = r.status === 200 ? await r.text() : ''
    ok(`https://${h}/sitemap.xml${q ? '?v=' : ''} serves the build`, r.status === 200 && /xml/.test(r.headers.get('content-type') ?? '') && body === built, `${r.status} ${r.headers.get('content-type') ?? ''} ${body.length} B`)
  }
  const locs = [...built.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  const bad = []
  const q = [...locs]
  await Promise.all(Array.from({ length: 8 }, async () => { while (q.length) { const u = q.shift(); const r = await get(u); if (r.status !== 200) bad.push(`${r.status} ${u}`) } }))
  ok(`all ${locs.length} sitemap URLs answer 200`, bad.length === 0, bad.slice(0, 8).join(' | '))
  ok('every <loc> is on the canonical host', locs.every((l) => l.startsWith(CANONICAL + '/')))
}

// robots.txt belongs to the edge
{
  const r = await get(CANONICAL + '/robots.txt')
  const t = r.status === 200 ? await r.text() : ''
  /* 404 = the zone's managed robots.txt is off (ifadentistry.com, 2026-09-23): turn it on in the
     dashboard. Under ~200 B = something (a Worker) replaced the edge file. */
  ok('robots.txt is the edge file, not a Worker fallback', r.status === 200 && t.length > 200,
    `${r.status} ${t.length} B${r.status === 404 ? ' (no robots.txt at all: enable the zone\'s managed robots.txt, never a Worker)' : ''}`)
}

// admin
{
  const r = await get(CANONICAL + '/admin')
  ok('/admin answers', [200, 301, 302, 303].includes(r.status), `${r.status} (prove the login with check-origins.mjs)`)
}

// staging
if (!flag('no-staging')) {
  const st = `https://staging.${apex}`
  const r = await get(st + '/')
  const html = r.status === 200 ? await r.text() : ''
  ok(`${st} carries X-Robots-Tag noindex`, /noindex/i.test(r.headers.get('x-robots-tag') ?? ''), `${r.status} ${r.headers.get('x-robots-tag') ?? '(none)'}`)
  const leaks = [...html.matchAll(/<(?:link[^>]+rel=["']canonical["'][^>]*|meta[^>]+property=["']og:url["'][^>]*)>/gi)].map((m) => m[0]).filter((t) => t.includes(`//${apex}`) || t.includes(`//www.${apex}`))
  ok('staging has no canonical/og:url pointing at production (raw HTML)', leaks.length === 0, leaks.slice(0, 2).join(' '))
  const sm = await get(st + '/sitemap.xml')
  ok('staging serves no sitemap', sm.status !== 200, String(sm.status))
}

console.log(fails.length ? `\nFAIL  ${fails.length}\n  ${fails.join('\n  ')}` : '\nFAIL  none')
process.exit(fails.length ? 1 : 0)
