#!/usr/bin/env node
/**
 * nav-menus.mjs — OPEN every menu and submenu the way a visitor does and fail when a link inside it
 * cannot be read or reached.
 *
 * Written 2026-10-08 for tools/instatic-site after Mason Park's phone menu (bk-mason-park). Tapping
 * "Services" in the drawer slid its list half its width past the drawer's left edge, on production
 * and staging, and nothing failed: click-controls saw the tap change something (`is-open`), and no
 * gate asked where the links it revealed ended up. The cause was CSS (DESIGN-STANDARD.md, "CSS traps").
 *
 * Below 1024px it taps like a finger: the menu toggle, then every parent that has a submenu, outer
 * first. At 1024 and up, with no toggle showing, it hovers each parent. After each open, every link
 * that open list shows (not those of a deeper list still closed) is scrolled into the drawer's view
 * and checked:
 *   invisible  no box, `visibility: hidden`, or an opacity chain under 0.1
 *   clipped    a line of its text outside the screen or a clipping ancestor (the drawer's edge)
 *   covered    `elementFromPoint` at its text's centre is something else (a call bar, a banner)
 *   navigates  tapping a parent changed the URL instead of opening its submenu (unreachable on a phone)
 *   no menu    no toggle and no visible menu at that width
 *
 * Usage:
 *   node nav-menus.mjs [slug ...] [--base https://staging.example.com] [--widths 390,768,1440]
 *        [--toggle <selector>] [--menu <selector>]
 *   without --base it serves the local build (SITE_SRC/dist via ../lib/paths.mjs). Without slugs it
 *   checks the home page: the menu is shared chrome, so name a slug only where the header differs.
 *   --toggle / --menu are comma lists tried in order; the defaults cover Client-First `navbar_*`,
 *   Webflow `w-nav-*` and a plain `header nav`.
 * Exit 1 on any problem. Sienna and consent banners are blocked so they cannot sit on top.
 */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import puppeteer, { CHROME } from '../lib/browser.mjs'
import * as P from '../lib/paths.mjs'

const argv = process.argv.slice(2)
const val = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv.splice(i, 2)[1] : undefined }
const BASE = (val('base') || '').replace(/\/$/, '')
const WIDTHS = (val('widths') || '390,768,1440').split(',').map(Number)
const TOGGLE = (val('toggle') || '.navbar_toggle,.w-nav-button,[class*="menu-toggle"],[class*="nav-toggle"],[class*="burger"],header button[aria-expanded],nav button[aria-expanded]').split(',')
const MENU = (val('menu') || '.navbar_menu,.w-nav-menu,header nav,nav').split(',')
const slugs = argv.filter((a) => !a.startsWith('--'))
const routes = (slugs.length ? slugs : ['index']).map((s) => (s === 'index' ? '/' : '/' + s.replace(/^\//, '')))
const BLOCK = /sienna-accessibility|termly\.io|cookieyes|onetrust|cookiebot/

let server = null
let local = ''
if (!BASE) {
  const DIST = P.DIST
  const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' }
  server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0])
    const cands = [p, p + '.html', path.join(p, 'index.html')].map((c) => path.join(DIST, c))
    const f = cands.find((c) => c.startsWith(DIST) && fs.existsSync(c) && fs.statSync(c).isFile())
    if (!f) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' })
    fs.createReadStream(f).pipe(res)
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  local = `http://127.0.0.1:${server.address().port}`
}

// In the page: find the toggle and the menu, number the parents, and judge one open list.
function install(TOGGLE, MENU) {
  const shown = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }
  const trig = (item) => [...item.children].find((c) => c.matches('a,button,[role=button],.w-dropdown-toggle'))
  const sub = (item) => { const t = trig(item); let n = t && t.nextElementSibling; while (n && !n.querySelector('a[href]')) n = n.nextElementSibling; return n || null }
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
  const at = (sel) => document.querySelector(sel)
  // Bring an element to the middle of every vertically scrolling box around it, then of the window.
  const centre = (el) => {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (/auto|scroll/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) {
        n.style.scrollBehavior = 'auto'
        const r = el.getBoundingClientRect(), nr = n.getBoundingClientRect()
        n.scrollTop += r.top + r.height / 2 - (nr.top + nr.height / 2)
      }
    }
    const r = el.getBoundingClientRect()
    if (r.top < 0 || r.bottom > innerHeight) window.scrollBy(0, r.top + r.height / 2 - innerHeight / 2)
  }
  window.__nm = {
    toggle() {
      for (const s of TOGGLE) { const t = [...document.querySelectorAll(s)].find(shown); if (t) { t.setAttribute('data-nm-toggle', ''); return label(t) || s } }
      return null
    },
    menu() {
      for (const s of MENU) {
        const ms = [...document.querySelectorAll(s)]
        if (!ms.length) continue
        const m = ms.sort((a, b) => b.querySelectorAll('a[href]').length - a.querySelectorAll('a[href]').length)[0]
        m.setAttribute('data-nm-menu', '')
        const items = [...m.querySelectorAll('li,.w-dropdown')].filter((li) => trig(li) && sub(li))
        items.forEach((li, i) => li.setAttribute('data-nm-item', String(i)))
        return items.map((li) => {
          const chain = []
          for (let p = li.parentElement.closest('[data-nm-item]'); p; p = p.parentElement.closest('[data-nm-item]')) chain.unshift(+p.getAttribute('data-nm-item'))
          return { i: +li.getAttribute('data-nm-item'), name: label(trig(li)), chain }
        })
      }
      return null
    },
    isOpen(i) { const s = sub(at(`[data-nm-item="${i}"]`)); return !!s && shown(s) && s.getBoundingClientRect().height > 2 },
    point(i) {
      const t = i === null ? at('[data-nm-toggle]') : trig(at(`[data-nm-item="${i}"]`))
      if (!t) return null
      centre(t)
      const r = t.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    },
    hoverSel(i) { const t = trig(at(`[data-nm-item="${i}"]`)); t.setAttribute('data-nm-trig', String(i)); return `[data-nm-trig="${i}"]` },
    // The links list `i` shows once open; i === null is the menu's own top level.
    judge(i, scroll) {
      const scope = i === null ? at('[data-nm-menu]') : sub(at(`[data-nm-item="${i}"]`))
      const owner = i === null ? null : at(`[data-nm-item="${i}"]`)
      // A plain link of this list, or the trigger of a list one level down.
      const own = [...scope.querySelectorAll('a[href]')].filter((a) => {
        const home = a.closest('[data-nm-item]')
        if (home === owner) return true
        return !!home && trig(home) === a && home.parentElement.closest('[data-nm-item]') === owner
      })
      const out = []
      for (const a of own) {
        if (scroll) centre(a)
        const name = label(a)
        let o = 1
        for (let n = a; n; n = n.parentElement) o *= +getComputedStyle(n).opacity
        if (!shown(a) || o < 0.1) { out.push({ kind: 'invisible', name, detail: `opacity ${o.toFixed(2)}` }); continue }
        let L = 0, T = 0, R = document.documentElement.clientWidth, B = innerHeight
        for (let n = a.parentElement; n && n !== document.documentElement; n = n.parentElement) {
          const cs = getComputedStyle(n)
          if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue
          const nr = n.getBoundingClientRect()
          L = Math.max(L, nr.left + n.clientLeft); T = Math.max(T, nr.top + n.clientTop)
          R = Math.min(R, nr.left + n.clientLeft + n.clientWidth); B = Math.min(B, nr.top + n.clientTop + n.clientHeight)
        }
        const rg = document.createRange(); rg.selectNodeContents(a)
        let rects = [...rg.getClientRects()].filter((r) => r.width > 0 && r.height > 0)
        if (!rects.length) rects = [a.getBoundingClientRect()]
        const bad = rects.find((r) => r.left < L - 1 || r.right > R + 1 || r.top < T - 1 || r.bottom > B + 1)
        if (bad) { out.push({ kind: 'clipped', name, detail: `text x ${Math.round(bad.left)}..${Math.round(bad.right)}, visible area x ${Math.round(L)}..${Math.round(R)}` }); continue }
        const r = rects[0]
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        if (!hit || !(hit === a || a.contains(hit))) out.push({ kind: 'covered', name, detail: hit ? `${hit.tagName.toLowerCase()}.${String(hit.className).trim().split(/\s+/)[0]}` : 'nothing' })
      }
      return { n: own.length, out }
    },
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const problems = []
let checked = 0

for (const route of routes) {
  for (const width of WIDTHS) {
    const touch = width < 1024
    const page = await browser.newPage()
    await page.setViewport({ width, height: width < 700 ? 844 : 900, isMobile: touch, hasTouch: touch })
    await page.setRequestInterception(true)
    page.on('request', (r) => (BLOCK.test(r.url()) ? r.abort() : r.continue()))
    const url = (BASE || local) + route
    const load = async () => {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
      await sleep(1500)
      await page.evaluate(install, TOGGLE, MENU)
      const toggle = await page.evaluate(() => window.__nm.toggle())
      const items = await page.evaluate(() => window.__nm.menu())
      return { toggle, items }
    }
    const tap = async (i) => {
      const pt = await page.evaluate((i) => window.__nm.point(i), i)
      if (!pt) return false
      await sleep(150)
      await page.touchscreen.tap(pt.x, pt.y)
      await sleep(900)
      return true
    }
    const report = (where, res) => {
      checked += res.n
      for (const p of res.out) problems.push(`${route} @${width}  ${p.kind.padEnd(9)} ${where} > "${p.name}"  ${p.detail}`)
    }

    const { toggle, items } = await load()
    if (!items) { problems.push(`${route} @${width}  no menu    nothing matches ${MENU.join(', ')}`); await page.close(); continue }
    const drawer = !!toggle
    if (drawer) await tap(null)
    report('menu', await page.evaluate(() => window.__nm.judge(null, true)))

    next: for (const it of items) {
      const where = it.chain.map((c) => items[c].name).concat(it.name).join(' > ')
      if (drawer) {
        for (const c of [...it.chain, it.i]) {
          if (await page.evaluate((c) => window.__nm.isOpen(c), c)) continue
          const before = page.url()
          await tap(c)
          if (page.url() !== before) {
            problems.push(`${route} @${width}  navigates ${where}: tapping "${items[c].name}" opened ${page.url()}`)
            await load()
            await tap(null)
            continue next
          }
        }
        if (!(await page.evaluate((i) => window.__nm.isOpen(i), it.i))) { problems.push(`${route} @${width}  invisible ${where}: the submenu did not open on tap`); continue }
      } else {
        for (const c of [...it.chain, it.i]) await page.hover(await page.evaluate((c) => window.__nm.hoverSel(c), c))
        await sleep(500)
        if (!(await page.evaluate((i) => window.__nm.isOpen(i), it.i))) { problems.push(`${route} @${width}  invisible ${where}: the submenu did not open on hover`); continue }
      }
      report(where, await page.evaluate((i, s) => window.__nm.judge(i, s), it.i, drawer))
    }
    console.log(`${route.padEnd(36)} ${String(width).padStart(4)}  ${drawer ? `drawer (${toggle})` : 'bar'}, ${items.length} submenus`)
    await page.close()
  }
}
await browser.close()
if (server) server.close()
console.log(`\n${checked} links checked`)
if (problems.length) { console.log(`PROBLEMS (${problems.length}):\n  ${problems.join('\n  ')}`); process.exit(1) }
console.log('PROBLEMS  none')
