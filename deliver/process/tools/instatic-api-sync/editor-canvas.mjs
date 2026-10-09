#!/usr/bin/env node
/**
 * EDITOR CANVAS GATE (read-only): does the Instatic editor show the page the way a person can edit it?
 *
 *   node editor-canvas.mjs --site <client>:staging [--out <png>]      # needs PUPPETEER_DIR
 *
 * Opens /admin/site headlessly with the admin session (nothing is edited or saved), waits for the
 * breakpoint frames, screenshots the editor, and FAILS when any frame shows a fixed element covering
 * more than 30% of the frame's first screen (a modal, drawer or overlay that is closed on the live
 * page). Every other gate reads the store or the PUBLISHED page; the canvas is a different renderer:
 *   - nodes render through React, which drops `hidden=""` (htmlAttributesForReact passes the empty
 *     string), so anything closed only by the `hidden` attribute SHOWS;
 *   - site scripts do not run, so nothing closes it, and vh/vw are pinned to the frame size.
 * IFA staging, 2026-10-07: the story modal (92% dark) and the menu drawer covered every frame; the
 * user read it as "Instatic completely broken" while every published-page gate was green. Fix at the
 * source: close overlays in CSS by default and open them with a runtime class or a data- attribute.
 * Always look at the screenshot too: "no overlay" is not "looks right".
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connect, argOf } from './target.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const { api, target } = await connect()
// Staging is the resolved target's environment: a Railway-only staging is <name>-staging.up.railway.app
// (West LA, Livewell, Oceanic), which a `staging.` host test refused.
const isStaging = target.env === 'staging' || /(^|[.-])staging[.-]/.test(new URL(target.url).hostname)
if (!isStaging && !process.argv.includes('--allow-production')) throw new Error('refusing: staging only (--allow-production to read a production editor)')
await api.getSite() // leaves a fresh session cookie on disk
const [name, ...rest] = readFileSync(api.SESSION_FILE, 'utf8').trim().split('=')
const { default: puppeteer, CHROME } = await import('../instatic-site/lib/browser.mjs')
const client = (argOf('--site') ?? 'site').split(':')[0]
const out = argOf('--out') ?? join(HERE, 'output', 'fleet', client, 'editor-canvas.png')
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--disable-crash-reporter', '--window-size=1900,1000'] })
let failures = 0
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1900, height: 1000 })
  await page.setCookie({ name, value: rest.join('='), domain: new URL(target.url).hostname, path: '/', secure: true, httpOnly: true })
  await page.goto(`${target.url.replace(/\/$/, '')}/admin/site`, { waitUntil: 'load', timeout: 240000 })
  // A big site (217 pages) needs ~20 s before the frames are filled.
  let frames = []
  for (let i = 0; i < 30 && !frames.length; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    frames = page.frames().filter((f) => f !== page.mainFrame() && f.url() === 'about:srcdoc')
  }
  await new Promise((r) => setTimeout(r, Number(process.env.CANVAS_WAIT ?? 10000)))
  frames = page.frames().filter((f) => f !== page.mainFrame() && f.url() === 'about:srcdoc')
  await page.screenshot({ path: out })
  if (!frames.length) throw new Error('no canvas frames rendered: the editor did not load')
  for (const f of frames) {
    const r = await f.evaluate(() => {
      const vw = innerWidth, first = Math.min(innerHeight, 1200)
      const shown = []
      for (const el of document.body.querySelectorAll('*')) {
        const cs = getComputedStyle(el)
        if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue
        if (cs.clipPath && cs.clipPath !== 'none') continue
        const b = el.getBoundingClientRect()
        const area = Math.max(0, Math.min(b.right, vw) - Math.max(b.left, 0)) * Math.max(0, Math.min(b.bottom, first) - Math.max(b.top, 0))
        if (area > 0.3 * vw * first) shown.push(`${el.tagName.toLowerCase()}${el.classList.length ? '.' + [...el.classList].join('.') : ''}${el.hasAttribute('hidden') ? ' [hidden]' : ''} bg ${cs.backgroundColor}`)
      }
      return { width: vw, shown }
    })
    failures += r.shown.length
    console.log(`${r.shown.length ? 'FAIL' : 'ok  '}  frame ${r.width}px${r.shown.length ? ': overlay showing in the editor: ' + r.shown.join(' | ') : ''}`)
  }
  console.log(`${failures ? 'FAIL' : 'ok  '}  editor canvas ${target.url}: ${frames.length} frame(s), ${failures} overlay(s) showing; screenshot ${out}`)
} finally {
  await browser.close()
}
process.exit(failures ? 1 : 0)
