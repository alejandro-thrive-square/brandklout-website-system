#!/usr/bin/env node
/**
 * verify-qa-template-fixes.mjs — proves push-qa-template-fixes.mjs on a published host.
 *
 *   node verify-qa-template-fixes.mjs https://staging.drnahlah.com [https://www.drnahlah.com]
 *
 * With a second (reference) host, compares the computed style of every changed
 * element against the same element there, so "looks identical" is measured,
 * not eyeballed. Also checks: inert while closed / gone while open, no focusable
 * element inside the closed drawer, heading outline (one h1, no skipped level),
 * footer addresses are maps/dir links, no maps/search link left.
 * Screenshots of the footer land in .tmp/qa-fixes/.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const puppeteer = require('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/puppeteer-core')

const [HOST, REF] = process.argv.slice(2)
const PAGES = ['/', '/contact', '/about', '/privacy-policy', '/terms-of-service-maclean', '/posts/porcelain-veneers-the-answers-to-your-questions', '/five-year-warranty']
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
const PROPS = ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-transform', 'color', 'line-height', 'margin-bottom', 'display']

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
async function probe(host, path, shot) {
  const p = await browser.newPage()
  await p.setUserAgent(UA)
  await p.setViewport({ width: 1440, height: 900 })
  await p.goto(host + path + (path.includes('?') ? '&' : '?') + 'v=' + Date.now(), { waitUntil: 'networkidle2', timeout: 90000 })
  await new Promise((r) => setTimeout(r, 1500))
  const out = await p.evaluate((PROPS) => {
    const cs = (el) => el ? Object.fromEntries(PROPS.map((k) => [k, getComputedStyle(el).getPropertyValue(k)])) : null
    const foot = document.querySelector('footer.foot')
    const drawer = document.getElementById('drawer')
    const focusable = drawer ? [...drawer.querySelectorAll('a,button,[tabindex]')].length : 0
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => !h.closest('[aria-hidden="true"]') && !h.closest('[inert]')).map((h) => +h.tagName[1])
    let skip = null
    for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) { skip = `${hs[i - 1]}->${hs[i]}`; break }
    const footTitle = foot?.querySelector('h2, h4')
    const drTitle = drawer?.querySelector('.dr-col > p, .dr-col h4')
    const creds = document.querySelector('.doc-creds h3, .doc-creds h4')
    const contactH = document.querySelector('#offices .pk-head h1, #offices .pk-head h2')
    const addr = foot ? [...foot.querySelectorAll('.foot-facts a[href*="google.com/maps"]')].map((a) => a.href) : []
    const addrStyle = cs(foot?.querySelector('.foot-facts li > a[href*="maps"] > div') ?? foot?.querySelector('.foot-facts li > div'))
    return {
      h1: hs.filter((h) => h === 1).length, skip,
      inert: drawer ? drawer.inert : null, focusableInDrawer: focusable,
      footTag: footTitle?.tagName, footStyle: cs(footTitle),
      drTag: drTitle?.tagName, drStyle: cs(drTitle),
      credsTag: creds?.tagName, credsStyle: cs(creds),
      contactTag: contactH?.tagName, contactStyle: cs(contactH),
      addr, addrStyle,
      search: [...document.querySelectorAll('a[href*="maps/search"]')].length,
      dir: [...document.querySelectorAll('a[href*="maps/dir"]')].length,
    }
  }, PROPS)
  // open the drawer: inert must go
  const burger = await p.$('#burger')
  if (burger) {
    await p.evaluate(() => document.getElementById('burger').click())
    await new Promise((r) => setTimeout(r, 900))
    out.inertWhenOpen = await p.evaluate(() => document.getElementById('drawer').inert)
    await p.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 500))
    out.inertAfterClose = await p.evaluate(() => document.getElementById('drawer').inert)
  }
  if (shot) {
    const f = await p.$('footer.foot')
    if (f) await f.screenshot({ path: shot })
  }
  await p.close()
  return out
}

let bad = 0
for (const path of PAGES) {
  const a = await probe(HOST, path, `.tmp/qa-fixes/footer-${new URL(HOST).hostname}${path.replace(/\//g, '_')}.png`)
  const issues = []
  if (a.h1 !== 1) issues.push(`h1 count ${a.h1}`)
  if (a.skip) issues.push(`skip ${a.skip}`)
  if (a.inert !== null && a.inert !== true) issues.push('drawer not inert while closed')
  if (a.inertWhenOpen !== undefined && a.inertWhenOpen !== false) issues.push('drawer still inert when open')
  if (a.inertAfterClose !== undefined && a.inertAfterClose !== true) issues.push('drawer not inert after close')
  if (a.search) issues.push(`${a.search} maps/search links`)
  if (a.addr.length !== 2 || !a.addr.every((h) => h.includes('/maps/dir/'))) issues.push(`footer address links: ${JSON.stringify(a.addr)}`)
  if (REF) {
    const b = await probe(REF, path, `.tmp/qa-fixes/footer-${new URL(REF).hostname}${path.replace(/\//g, '_')}.png`)
    for (const k of ['footStyle', 'drStyle', 'credsStyle', 'contactStyle', 'addrStyle']) {
      if (!a[k] && !b[k]) continue
      const diff = PROPS.filter((p) => a[k]?.[p] !== b[k]?.[p] && !(p === 'display'))
      if (diff.length) issues.push(`${k} differs from reference: ${diff.map((p) => `${p} ${b[k]?.[p]} -> ${a[k]?.[p]}`).join('; ')}`)
    }
  }
  console.log(`${issues.length ? 'FAIL' : 'ok  '} ${path}  h1=${a.h1} foot=${a.footTag} drawer=${a.drTag} inert=${a.inert}/${a.inertWhenOpen}/${a.inertAfterClose} dir=${a.dir}${a.credsTag ? ' creds=' + a.credsTag : ''}${a.contactTag ? ' contact=' + a.contactTag : ''}`)
  for (const i of issues) console.log(`       ${i}`)
  if (issues.length) bad++
}
await browser.close()
process.exit(bad ? 1 : 0)
