#!/usr/bin/env node
/**
 * consent-kit.mjs — put the Brandklout consent standard (Termly or Silktide + GoHighLevel bridge) on a site, and check it.
 * Read 23-termly-ghl-consent.md first.
 *
 *   node consent-kit.mjs minify                                   # kit/ghl-consent-bridge.min.js (Webflow, <= 2000 chars)
 *   node consent-kit.mjs snippet [--disclosure YYYY-MM-DD]        # a paste-able footer block, to stdout
 *   node consent-kit.mjs merge-footer <current.html> <out.html>   # current footer code + the block, idempotent
 *   node consent-kit.mjs instatic status  [--only a,b]            # read-only, every Instatic site
 *   node consent-kit.mjs instatic apply   [--only a,b] [--apply]  # write the script asset (draft only)
 *   node consent-kit.mjs instatic publish  --only a,b  [--apply]  # publish sites whose only draft change is ours
 *   node consent-kit.mjs check <url>[,<url>...] [--termly-proxy]  # headless: bridge live? forms carry values?
 *
 * Silktide (sites with no Termly account; settings per site in kit/silktide/sites.json):
 *   node consent-kit.mjs silktide-snippet <site>                  # the head block, to stdout
 *   node consent-kit.mjs silktide-merge <site> <head.html> <footer.html> <outdir>
 *        # current head/footer code -> <outdir>/head.html, footer.html: block first in head, listed tracker tags removed
 *   node consent-kit.mjs silktide-check <url> [--gpc] [--shot <dir>] [--preview <dir>]
 *        # headless: banner, trackers, Reject/Accept/Preferences, form values; --preview tests merge output before writing
 *        # (banner forced on; add --as-published to see what a non-test host gets)
 *
 * Instatic sites are every section of ~/.webzite/.env with an INSTATIC_BASE_URL. Each runs in a child
 * process, because insta-api.mjs resolves its site once at import.
 *
 * Run with output redirected to a file, not piped: Node on Windows can die on a libuv assertion when
 * stdout is a pipe.
 */
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BRIDGE_FILE = join(HERE, 'kit', 'ghl-consent-bridge.js')
const MIN_FILE = join(HERE, 'kit', 'ghl-consent-bridge.min.js')
// Webflow's registered inline scripts are capped at 2000 characters.
const WEBFLOW_LIMIT = 2000
const SILKTIDE_FILE = join(HERE, 'kit', 'silktide', 'brandklout-silktide.js')
const SILKTIDE_MIN = join(HERE, 'kit', 'silktide', 'brandklout-silktide.min.js')
const SILKTIDE_SITES = join(HERE, 'kit', 'silktide', 'sites.json')
const INSTA_API = join(HERE, '..', '18-instatic-embeds', 'lib', 'insta-api.mjs')
const ASSET_PATH = 'src/scripts/brandklout-consent-bridge.js'
const BEGIN = '<!-- BEGIN brandklout-consent-bridge -->'
const END = '<!-- END brandklout-consent-bridge -->'
// Footer blocks pasted before the markers existed (v1.x, v2.0.0): the header comment through its </script>.
const LEGACY = /<!-- Brandklout: Termly -> GoHighLevel consent bridge \(v[\d.]+\)[\s\S]*?<\/script>\s*/

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(name)
const option = (name) => {
  const i = argv.indexOf(name)
  return i === -1 ? null : argv[i + 1] ?? ''
}

// Always deployed as LF. Checkouts differ (core.autocrlf): bk-stone-dental had the kit as CRLF, main has LF.
const CR = String.fromCharCode(13)
const bridgeSource = () => readFileSync(BRIDGE_FILE, 'utf8').split(CR).join('').trim()
// Line endings do not count: assets deployed from a CRLF checkout carry CR characters.
const sameCode = (a, b) => (a || '').split(CR).join('').trim() === (b || '').split(CR).join('').trim()
const bridgeVersion = () => (bridgeSource().match(/BrandkloutConsentBridge = "([\d.]+)"/) || [])[1]

function terser(input, output) {
  const quote = (p) => `"${p}"` // shell: true (npx is a .cmd on Windows), and the repo path has spaces
  const res = spawnSync('npx', ['-y', 'terser@5', quote(input), '-c', '-m', '--comments', 'false', '-o', quote(output)], { shell: true, encoding: 'utf8' })
  if (res.status !== 0) throw new Error('terser failed: ' + (res.stderr || '').slice(-300))
}

function minify() {
  terser(SILKTIDE_FILE, SILKTIDE_MIN)
  console.log(`${SILKTIDE_MIN}: ${readFileSync(SILKTIDE_MIN, 'utf8').length} chars (goes in freeform head code, no cap)`)
  terser(BRIDGE_FILE, MIN_FILE)
  const size = readFileSync(MIN_FILE, 'utf8').length
  console.log(`${MIN_FILE}: ${size} chars (Webflow limit ${WEBFLOW_LIMIT})${size > WEBFLOW_LIMIT ? ' TOO LONG' : ''}`)
  if (size > WEBFLOW_LIMIT) process.exitCode = 1
}

function snippet() {
  const disclosure = option('--disclosure')
  const config = disclosure
    ? `<script>window.BrandkloutConsentConfig = { marketingDisclosureVersion: "${disclosure}" };</script>\n`
    : ''
  return `${BEGIN}\n${config}<script>\n${bridgeSource()}\n</script>\n${END}`
}

function mergeFooter(current) {
  const block = snippet()
  const a = current.indexOf(BEGIN)
  const b = current.indexOf(END)
  if (a !== -1 && b > a) return { how: 'replaced marked block', code: current.slice(0, a) + block + current.slice(b + END.length) }
  if (LEGACY.test(current)) return { how: 'replaced legacy block', code: current.replace(LEGACY, block + '\n') }
  return { how: 'appended', code: current.replace(/\s*$/, '') + '\n\n' + block + '\n' }
}

/* ── Silktide (no Termly account) ─────────────────────────────────────────── */

const SILKTIDE_BEGIN = '<!-- BEGIN brandklout-silktide -->'
const SILKTIDE_END = '<!-- END brandklout-silktide -->'

function silktideSite(name) {
  const sites = JSON.parse(readFileSync(SILKTIDE_SITES, 'utf8'))
  if (!sites[name]) throw new Error(`no "${name}" in ${SILKTIDE_SITES}; known: ${Object.keys(sites).join(', ')}`)
  return sites[name]
}

function silktideSnippet(name) {
  const { settings } = silktideSite(name)
  const loader = readFileSync(SILKTIDE_MIN, 'utf8').split(CR).join('').trim()
  return `${SILKTIDE_BEGIN}\n<script>window.BrandkloutSilktide = ${JSON.stringify(settings)};</script>\n` +
    `<script>${loader}</script>\n${SILKTIDE_END}`
}

// The loader now owns every tracker listed in sites.json, so their plain tags come out of the code.
// Only a tag whose src is listed is removed; anything else stays untouched.
function stripTrackers(code, settings) {
  const srcs = Object.values(settings.trackers || {}).flat().map((t) => t.src)
  let out = code
  const removed = []
  for (const src of srcs) {
    const tag = new RegExp(`[ \\t]*<script\\b[^>]*\\bsrc="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>\\s*</script>[ \\t]*\\r?\\n?`, 'g')
    out = out.replace(tag, (m) => { removed.push(src); return '' })
  }
  return { code: out, removed }
}

// Head: the block goes first (above GTM), replacing an earlier block. Footer: trackers removed only.
function silktideMerge(name, head, footer) {
  const { settings } = silktideSite(name)
  const block = silktideSnippet(name)
  const a = head.indexOf(SILKTIDE_BEGIN)
  const b = head.indexOf(SILKTIDE_END)
  const rest = a !== -1 && b > a ? head.slice(0, a) + head.slice(b + SILKTIDE_END.length) : head
  const h = stripTrackers(rest, settings)
  const f = stripTrackers(footer, settings)
  return {
    head: block + '\n\n' + h.code.replace(/^\s+/, ''),
    footer: f.code,
    removed: [...h.removed, ...f.removed],
  }
}

/* ── Instatic ─────────────────────────────────────────────────────────────── */

function instaticSites() {
  const file = process.env.WEBZITE_ENV_MASTER || join(homedir(), '.webzite', '.env')
  const sections = { shared: {} }
  let current = 'shared'
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const header = line.match(/^\[\s*([^\]]+?)\s*\]$/)
    if (header) { current = header[1].toLowerCase(); sections[current] ??= {}; continue }
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (kv) (sections[current] ??= {})[kv[1]] = kv[2].trim().replace(/^(["'])(.*)\1$/, '$2')
  }
  const expand = (v) => v.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, n) => sections.vars?.[n] ?? sections.shared[n] ?? '')
  const only = option('--only')?.split(',').map((s) => s.trim().toLowerCase())
  return Object.entries(sections)
    .filter(([name, keys]) => !['shared', 'vars', 'aliases'].includes(name) && keys.INSTATIC_BASE_URL)
    .filter(([name]) => !only || only.includes(name))
    .map(([name, keys]) => {
      const get = (k) => expand(keys[k] ?? sections.shared[k] ?? '')
      return { name, env: { INSTATIC_BASE_URL: get('INSTATIC_BASE_URL'), INSTATIC_EMAIL: get('INSTATIC_EMAIL'), INSTATIC_PASSWORD: get('INSTATIC_PASSWORD') } }
    })
}

function instaticParent() {
  const sub = argv[1]
  if (!['status', 'apply', 'publish'].includes(sub)) throw new Error('instatic status | apply | publish')
  if (sub === 'publish' && !option('--only')) throw new Error('publish needs --only <site>[,<site>]: name the sites you mean to ship')
  const sites = instaticSites()
  let failed = 0
  for (const site of sites) {
    console.log(`\n== ${site.name}  ${site.env.INSTATIC_BASE_URL}`)
    const res = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...argv, '--worker'], {
      env: { ...process.env, ...site.env },
      stdio: 'inherit',
    })
    if (res.status !== 0) failed++
  }
  console.log(`\n${sites.length} sites, ${failed} failed`)
  if (failed) process.exitCode = 1
}

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const newId = () => Array.from(randomBytes(21), (b) => ALPHABET[b & 63]).join('')

async function instaticWorker() {
  const { api, getSite, publish, publishStatus, BASE } = await import(pathToFileURL(INSTA_API).href)
  const sub = argv[1]
  const want = bridgeSource() + '\n'
  const { site: shell, seq } = await getSite()
  const status = await publishStatus()
  const file = (shell.files ?? []).find((f) => f.path === ASSET_PATH)
  const runtime = file ? shell.runtime?.scripts?.[file.id] : null
  const live = await fetch(BASE + '/').then((r) => r.text()).catch(() => '')
  const state = !file ? 'missing' : sameCode(file.content, want) ? 'current' : 'outdated'
  const csp = (live.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1] || ''
  const frameSrc = (csp.match(/frame-src ([^;]*)/) || [])[1] || '(no CSP)'
  console.log(`  asset ${state}${runtime ? ` (${runtime.placement}/${runtime.timing}/${runtime.scope?.type}, enabled=${runtime.enabled})` : ''}`)
  console.log(`  draft matches published: ${status.draftMatchesPublished}   frame-src: ${frameSrc.slice(0, 90)}`)
  if (/frame-src 'none'/.test(csp)) console.log('  NOTE frame-src none: no GHL form can render here until the Embed block grants its origin')

  if (sub === 'status') return

  if (sub === 'apply') {
    if (state === 'current') { console.log('  nothing to do'); return }
    const files = [...(shell.files ?? [])]
    const now = Date.now()
    const id = file?.id ?? newId()
    const entry = { ...(file ?? { id, path: ASSET_PATH, type: 'script', createdAt: now }), content: want, updatedAt: now }
    if (file) files[files.indexOf(file)] = entry
    else files.push(entry)
    const scripts = {
      ...(shell.runtime?.scripts ?? {}),
      [id]: { enabled: true, runInCanvas: false, format: 'classic', placement: 'body-end', timing: 'dom-ready', scope: { type: 'all-pages' }, priority: 50 },
    }
    if (!flag('--apply')) { console.log(`  DRY RUN: would ${file ? 'update' : 'add'} ${ASSET_PATH} (bridge v${bridgeVersion()})`); return }
    if (!status.draftMatchesPublished) console.log('  WARNING the draft already differs from live; `publish` will refuse this site')
    const res = await api('PUT', '/admin/api/cms/site-document', {
      mode: 'incremental',
      site: { ...shell, files, runtime: { ...(shell.runtime ?? {}), scripts } },
      changedPages: [], deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
      changedLayouts: [], deletedLayoutIds: [], baseSeqs: {}, shellBaseSeq: seq,
    })
    // A SiteFile the server does not accept is dropped silently while the save answers ok, so read back.
    const after = (await getSite()).site
    const saved = (after.files ?? []).find((f) => f.path === ASSET_PATH)
    const ok = saved && sameCode(saved.content, want) && after.runtime?.scripts?.[saved.id]?.enabled
    console.log(`  saved seq ${res?.seq ?? '?'}; read back: ${ok ? 'OK' : 'FAILED'}`)
    const marker = JSON.parse(readFileSync(cleanMarker(), 'utf8'))
    writeFileSync(cleanMarker(), JSON.stringify({ ...marker, ourSeq: res?.seq }))
    if (!ok) process.exitCode = 1
    return
  }

  if (sub === 'publish') {
    if (state !== 'current') { console.log('  refusing: the asset is not current; run apply first'); process.exitCode = 1; return }
    if (status.draftMatchesPublished) { console.log('  nothing to publish'); return }
    const clean = await onlyOurChangeIsPending()
    if (!clean.ok && !flag('--force')) {
      console.log(`  refusing: other draft changes are pending (${clean.why}). Publish from the editor once the owner is ready, or pass --force.`)
      process.exitCode = 1
      return
    }
    if (!flag('--apply')) { console.log('  DRY RUN: would publish'); return }
    const res = await publish()
    console.log(`  published: ${JSON.stringify(res).slice(0, 160)}`)
    rmSync(cleanMarker(), { force: true })
  }
}

const cleanMarker = () => join(HERE, '.tmp', `clean-before-apply-${new URL(process.env.INSTATIC_BASE_URL).host}.json`)

/**
 * True only when the draft was clean (matched live) before our first `apply --apply` and the page
 * counts still agree. Instatic exposes no diff, so anything this cannot prove clean counts as pending.
 */
async function onlyOurChangeIsPending() {
  const { publishStatus } = await import(pathToFileURL(INSTA_API).href)
  const s = await publishStatus()
  if (s.draftPages !== s.publishedPages) return { ok: false, why: `${s.draftPages} draft pages vs ${s.publishedPages} published` }
  const marker = cleanMarker()
  if (!existsSync(marker)) return { ok: false, why: 'no record that the draft was clean before apply' }
  const before = JSON.parse(readFileSync(marker, 'utf8'))
  if (!before.draftMatchesPublished) return { ok: false, why: 'the draft was already dirty before apply' }
  const { getSite } = await import(pathToFileURL(INSTA_API).href)
  const { seq } = await getSite()
  if (before.ourSeq == null || seq !== before.ourSeq) return { ok: false, why: `the site was saved after our write (seq ${seq}, ours ${before.ourSeq})` }
  return { ok: true }
}

/* ── check ────────────────────────────────────────────────────────────────── */

async function check() {
  const urls = (argv[1] || '').split(',').filter(Boolean)
  if (!urls.length) throw new Error('check <url>[,<url>...]')
  const core = [
    process.env.PLAYWRIGHT_CORE,
    join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.js'),
  ].find((p) => p && existsSync(p))
  if (!core) throw new Error('playwright-core not found; set PLAYWRIGHT_CORE to its index.js')
  const { chromium } = (await import(pathToFileURL(core).href)).default
  const browser = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
  for (const url of urls) {
    const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' })
    if (flag('--termly-proxy')) {
      // NordVPN Threat Protection answers app.termly.io with a bare 204 inside Chrome; Node is not filtered.
      await ctx.route(/termly\.io/, async (route) => {
        const r = route.request()
        const res = await fetch(r.url(), { method: r.method(), headers: { ...r.headers(), origin: new URL(url).origin }, body: r.postDataBuffer() || undefined })
        const headers = {}
        res.headers.forEach((v, k) => { if (!/encoding|length/.test(k)) headers[k] = v })
        await route.fulfill({ status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) })
      })
    }
    const page = await ctx.newPage()
    const tracking = new Set()
    page.on('request', (r) => { const m = r.url().match(/number_pool\.js|user_session\.js/); if (m) tracking.add(m[0]) })
    await page.goto(url, { waitUntil: 'load', timeout: 60000 })
    await page.waitForTimeout(7000)
    const r = await page.evaluate(() => {
      const forms = [...document.querySelectorAll('iframe')].filter((f) => /\/widget\/(form|survey|booking)\//.test(f.getAttribute('src') || f.getAttribute('data-src') || ''))
      const termly = [...document.scripts].find((s) => /app\.termly\.io\/resource-blocker/.test(s.src))
      return {
        bridge: window.BrandkloutConsentBridge || null,
        termly: termly ? (termly.src.match(/autoBlock=(\w+)/) || [, 'default(off)'])[1] : null,
        banner: !!document.querySelector('[data-testid="cookie-policy-link"]'),
        autoblocked: document.querySelectorAll('[data-autoblocked]').length,
        preferencesLink: document.querySelectorAll('.termly-display-preferences').length,
        forms: forms.map((f) => {
          const q = new URL(f.getAttribute('src') || 'about:blank', location.href).searchParams
          return (q.get('privacy_analytics_consent') || 'NO VALUES') + ' ' + (f.getBoundingClientRect().height | 0) + 'px'
        }),
      }
    })
    console.log(`${url}\n  ${JSON.stringify({ ...r, trackingBeforeConsent: [...tracking] })}`)
    await ctx.close()
  }
  await browser.close()
}

// Walks one page through first visit, Reject, Accept, a reload and a preferences change, each in the
// state a real visitor would have. Prints one JSON line per step.
async function silktideCheck() {
  const url = argv[1]
  if (!url) throw new Error('silktide-check <url> [--gpc]')
  const core = [
    process.env.PLAYWRIGHT_CORE,
    join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.js'),
  ].find((p) => p && existsSync(p))
  if (!core) throw new Error('playwright-core not found; set PLAYWRIGHT_CORE to its index.js')
  const { chromium } = (await import(pathToFileURL(core).href)).default
  const browser = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
  const TRACKERS = /number_pool\.js|user_session\.js|analytics\.ahrefs\.com\/analytics\.js/
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' })
  if (flag('--gpc')) await ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true }))
  // NordVPN Threat Protection answers jsDelivr with an empty 200 inside Chrome (SRI then blocks it:
  // the computed hash is the empty-string SHA-384). Node is not filtered, so fetch the vendor files there.
  await ctx.route(/cdn\.jsdelivr\.net\/gh\/silktide\//, async (route) => {
    const res = await fetch(route.request().url())
    await route.fulfill({ status: res.status, headers: { 'content-type': res.headers.get('content-type'), 'access-control-allow-origin': '*' }, body: Buffer.from(await res.arrayBuffer()) })
  })
  // --preview <dir>: test before writing anything. Serves the live page with <dir>/before-{head,footer}.html
  // swapped for <dir>/after/{head,footer}.html (banner forced on) and the local bridge build.
  const preview = option('--preview')
  if (preview) {
    const read = (f) => readFileSync(join(preview, f), 'utf8')
    const swaps = [[read('before-head.html'), (flag('--as-published') ? read('after/head.html') : read('after/head.html').replace('"live":false', '"live":true'))], [read('before-footer.html'), read('after/footer.html')]]
    await ctx.route((u) => u.href.split('?')[0] === url.split('?')[0], async (route) => {
      let html = await (await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })).text()
      for (const [a, b] of swaps) {
        if (!html.includes(a)) throw new Error('preview: current code not found verbatim in the live page')
        html = html.replace(a, () => b)
      }
      // A site whose bridge is registered but not yet published has no tag for the route below to serve.
      if (!/brandkloutconsentbridge-/.test(html)) html = html.replace('</body>', () => `<script>${readFileSync(MIN_FILE, 'utf8')}</script></body>`)
      await route.fulfill({ status: 200, contentType: 'text/html', body: html })
    })
    await ctx.route(/brandkloutconsentbridge-[\d.]+\.js/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: readFileSync(MIN_FILE, 'utf8') }))
  }
  const page = await ctx.newPage()
  let tracking = new Set()
  page.on('request', (r) => { const m = r.url().match(TRACKERS); if (m) tracking.add(m[0]) })
  const failed = []
  page.on('requestfailed', (r) => { if (/silktide|jsdelivr/.test(r.url())) failed.push(r.url() + ' ' + r.failure()?.errorText) })
  page.on('console', (m) => { if (m.type() === 'error') failed.push(m.text()) })

  const state = () => page.evaluate(() => {
    const record = JSON.parse(localStorage.getItem('bk.consent') || 'null')
    const consent = (window.dataLayer || []).filter((e) => e && e[0] === 'consent').map((e) => `${e[1]}:${Object.entries(e[2]).filter(([k]) => k !== 'wait_for_update').map(([k, v]) => k.replace('_storage', '') + '=' + v[0]).join(',')}`)
    const forms = [...document.querySelectorAll('iframe')].filter((f) => /\/widget\/(form|survey|booking)\//.test(f.getAttribute('src') || ''))
    return {
      loader: window.BrandkloutSilktideLoader || null,
      bridge: window.BrandkloutConsentBridge || null,
      banner: !!document.querySelector('#stcm-banner'),
      icon: !!document.querySelector('#stcm-icon'),
      record,
      consent,
      forms: forms.map((f) => {
        const q = new URL(f.getAttribute('src'), location.href).searchParams
        const keys = ['analytics_consent', 'advertising_consent', 'sale_share_opt_out', 'gpc_detected', 'consent_timestamp_utc', 'cmp_receipt_id', 'policy_version']
        return Object.fromEntries(keys.map((k) => [k, q.get('privacy_' + k)]))
      }),
    }
  })
  const step = async (name) => {
    await page.waitForTimeout(2500)
    console.log(JSON.stringify({ step: name, ...(await state()), trackers: [...tracking], ...(failed.length ? { errors: failed.splice(0) } : {}) }))
    tracking = new Set()
  }
  const settle = () => page.waitForLoadState('load').then(() => page.waitForTimeout(3000))

  await page.goto(url, { waitUntil: 'load', timeout: 60000 })
  await settle()
  await step('first visit')
  // Not a test host and not live yet: only the pass-through (trackers load as before) can be checked.
  if (!(await page.evaluate(() => !!document.querySelector('#stcm-banner')))) {
    console.log(JSON.stringify({ step: 'no banner on this host: stopping' }))
    await browser.close()
    return
  }
  // The banner's buttons must not sit under a site widget either.
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h })
    await page.waitForTimeout(800)
    const covered = await page.evaluate(() => [...document.querySelectorAll('#stcm-banner button')].map((b) => {
      const r = b.getBoundingClientRect()
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
      return top && b.contains(top) ? null : b.textContent.trim() + ' under ' + (top ? top.outerHTML.slice(0, 60) : 'nothing')
    }).filter(Boolean))
    console.log(JSON.stringify({ step: `banner buttons at ${w}px`, covered }))
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  const shots = option('--shot')
  if (shots) {
    mkdirSync(shots, { recursive: true })
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      await page.setViewportSize({ width: w, height: h })
      await page.waitForTimeout(800)
      await page.screenshot({ path: join(shots, `banner-${w}.png`) })
    }
    await page.evaluate(() => document.querySelector('#stcm-banner .stcm-preferences-button').click())
    await page.waitForTimeout(800)
    await page.screenshot({ path: join(shots, 'preferences-390.png') })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.evaluate(() => document.querySelector('.stcm-modal-close').click())
    await page.waitForTimeout(500)
    await page.evaluate(() => { localStorage.clear() })
    await page.reload({ waitUntil: 'load' })
    await settle()
  }
  await page.click('#stcm-banner .stcm-reject-all')
  await step('after Reject')
  await page.evaluate(() => { localStorage.clear() })
  await page.reload({ waitUntil: 'load' })
  await settle()
  tracking = new Set()
  await page.click('#stcm-banner .stcm-accept-all')
  await step('after Accept (fresh visitor)')
  const before = (await state()).record?.createdAt
  await page.reload({ waitUntil: 'load' })
  await settle()
  const after = (await state()).record?.createdAt
  await step(`reload after Accept (timestamp ${before === after ? 'kept' : 'CHANGED'})`)
  if (!flag('--gpc')) {
    // The cookie icon must be the topmost thing at its own centre (site widgets sit in the same corners),
    // at the top of the page and at the bottom (where back-to-top buttons appear).
    const icon = []
    for (const y of [0, 100000]) {
      await page.evaluate((top) => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, top) }, y)
      await page.waitForTimeout(1200)
      icon.push(await page.evaluate(() => {
        const r = document.querySelector('#stcm-icon').getBoundingClientRect()
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
        return top && top.closest('#stcm-icon') ? 'clickable' : 'COVERED by ' + (top ? top.outerHTML.slice(0, 80) : 'nothing')
      }))
    }
    console.log(JSON.stringify({ step: 'cookie icon (top, bottom of page)', icon }))
    // Open the panel from the site's footer link (or a stand-in when the footer has none yet).
    const footerLink = await page.evaluate(() => {
      let a = document.querySelector('a[href="#consent-preferences"]')
      const real = !!a
      if (!a) { a = document.createElement('a'); a.href = '#consent-preferences'; a.textContent = 'Consent Preferences'; document.body.prepend(a) }
      a.click()
      return real
    })
    await page.waitForTimeout(800)
    const opened = await page.evaluate(() => getComputedStyle(document.querySelector('#stcm-modal') || document.body).display !== 'none' && !!document.querySelector('#stcm-modal'))
    console.log(JSON.stringify({ step: 'Consent Preferences link', footerLink: footerLink ? 'present' : 'MISSING (stand-in used)', panelOpened: opened }))
    await page.waitForTimeout(800)
    await page.click('label[for="consent-advertising"]')
    await Promise.all([page.waitForEvent('load', { timeout: 15000 }).catch(() => null), page.click('.stcm-modal-save')])
    await settle()
    await step('after turning Advertising off in Preferences (reload expected)')
  }
  if (failed.length) console.log(JSON.stringify({ errors: failed }))
  await browser.close()
}

/* ── main ─────────────────────────────────────────────────────────────────── */

const cmd = argv[0]
if (cmd === 'minify') minify()
else if (cmd === 'snippet') console.log(snippet())
else if (cmd === 'merge-footer') {
  const [, input, output] = argv
  if (!input || !output) throw new Error('merge-footer <current.html> <out.html>')
  const { how, code } = mergeFooter(readFileSync(input, 'utf8'))
  writeFileSync(output, code)
  console.log(`${how}; ${code.length} chars -> ${output}`)
} else if (cmd === 'instatic' && flag('--worker')) {
  if (argv[1] === 'apply' && flag('--apply')) {
    const { publishStatus } = await import(pathToFileURL(INSTA_API).href)
    // Remember whether the draft was clean before our first write, so `publish` never ships someone else's edits.
    mkdirSync(join(HERE, '.tmp'), { recursive: true })
    if (!existsSync(cleanMarker())) writeFileSync(cleanMarker(), JSON.stringify(await publishStatus()))
  }
  await instaticWorker()
} else if (cmd === 'instatic') instaticParent()
else if (cmd === 'check') await check()
else if (cmd === 'silktide-snippet') console.log(silktideSnippet(argv[1]))
else if (cmd === 'silktide-merge') {
  const [, name, headFile, footerFile, outdir] = argv
  if (!outdir) throw new Error('silktide-merge <site> <head.html> <footer.html> <outdir>')
  const r = silktideMerge(name, readFileSync(headFile, 'utf8'), readFileSync(footerFile, 'utf8'))
  mkdirSync(outdir, { recursive: true })
  writeFileSync(join(outdir, 'head.html'), r.head)
  writeFileSync(join(outdir, 'footer.html'), r.footer)
  console.log(`head ${r.head.length} chars, footer ${r.footer.length} chars; removed: ${r.removed.join(', ') || 'nothing'}`)
} else if (cmd === 'silktide-check') await silktideCheck()
else {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0])
  process.exitCode = cmd ? 1 : 0
}
