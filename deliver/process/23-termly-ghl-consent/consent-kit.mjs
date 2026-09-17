#!/usr/bin/env node
/**
 * consent-kit.mjs — put the Brandklout Termly → GoHighLevel consent bridge on a site, and check it.
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

const bridgeSource = () => readFileSync(BRIDGE_FILE, 'utf8').trim()
const bridgeVersion = () => (bridgeSource().match(/BrandkloutConsentBridge = "([\d.]+)"/) || [])[1]

function minify() {
  const quote = (p) => `"${p}"` // shell: true (npx is a .cmd on Windows), and the repo path has spaces
  const res = spawnSync('npx', ['-y', 'terser@5', quote(BRIDGE_FILE), '-c', '-m', '--comments', 'false', '-o', quote(MIN_FILE)], { shell: true, encoding: 'utf8' })
  if (res.status !== 0) throw new Error('terser failed: ' + (res.stderr || '').slice(-300))
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
  const state = !file ? 'missing' : file.content === want ? 'current' : 'outdated'
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
    const ok = saved && saved.content === want && after.runtime?.scripts?.[saved.id]?.enabled
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
else {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0])
  process.exitCode = cmd ? 1 : 0
}
