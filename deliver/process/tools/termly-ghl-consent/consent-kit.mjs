#!/usr/bin/env node
/**
 * consent-kit.mjs — put the Brandklout Termly → GoHighLevel consent bridge on a site, and check it.
 * Read termly-ghl-consent.md first.
 *
 *   node consent-kit.mjs minify                                   # kit/ghl-consent-bridge.min.js (Webflow, <= 2000 chars)
 *   node consent-kit.mjs snippet [--disclosure YYYY-MM-DD]        # a paste-able block for the site-wide HEADER
 *                                                                 # of a platform with no API, to stdout
 *   node consent-kit.mjs instatic status  [--only a,b]            # read-only, every Instatic site
 *   node consent-kit.mjs instatic apply   [--only a,b] [--apply]  # write BOTH script assets (draft only)
 *   node consent-kit.mjs instatic termly  [--only a,b] [--apply]  # phase 2: Termly head script + origins
 *   node consent-kit.mjs instatic publish  --only a,b  [--apply]  # publish sites whose only draft change is ours
 *   node consent-kit.mjs check <url>[,<url>...] [--termly-proxy]  # headless: bridge live? forms carry values?
 *
 * Instatic sites are every section of ~/.brandklout/.env with an INSTATIC_BASE_URL. Each runs in a child
 * process, because insta-api.mjs (tools/instatic-api-sync) resolves its site once at import.
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
const INSTA_API = join(HERE, '..', 'instatic-api-sync', 'insta-api.mjs')
const ASSET_PATH = 'src/scripts/brandklout-consent-bridge.js'
const PREFS_FILE = join(HERE, 'kit', 'consent-preferences.js')
const PREFS_PATH = 'src/scripts/brandklout-consent-preferences.js'
const PREFS_MIN_FILE = join(HERE, 'kit', 'consent-preferences.min.js')
// Every code asset this kit owns on an Instatic site, in the order it is written.
// The bridge reads Termly and feeds GHL; the preferences control puts the footer
// link on the page. They are separate files because Webflow registers each as its
// own script against a 2,000-character cap that the bridge alone nearly fills.
const ASSETS = [
  { path: ASSET_PATH, file: BRIDGE_FILE, label: 'bridge' },
  { path: PREFS_PATH, file: PREFS_FILE, label: 'preferences' },
]
const REGISTRY = join(HERE, 'kit', 'termly-websites.json')
/** The one Termly website record for a client folder, or null. */
const termlyFor = (clientFolder) =>
  JSON.parse(readFileSync(REGISTRY, 'utf8')).find((r) => r.clientFolder === clientFolder) ?? null
const BEGIN = '<!-- BEGIN brandklout-consent-bridge -->'
const END = '<!-- END brandklout-consent-bridge -->'

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(name)
const option = (name) => {
  const i = argv.indexOf(name)
  return i === -1 ? null : argv[i + 1] ?? ''
}

// Always deployed as LF. Checkouts differ (core.autocrlf): bk-stone-dental had the kit as CRLF, main has LF.
const CR = String.fromCharCode(13)
const bridgeSource = () => readFileSync(BRIDGE_FILE, 'utf8').split(CR).join('').trim()
const sourceOf = (file) => readFileSync(file, 'utf8').split(CR).join('').trim()
// Line endings do not count: assets deployed from a CRLF checkout carry CR characters.
const sameCode = (a, b) => (a || '').split(CR).join('').trim() === (b || '').split(CR).join('').trim()
const bridgeVersion = () => (bridgeSource().match(/BrandkloutConsentBridge = "([\d.]+)"/) || [])[1]

function minify() {
  const quote = (p) => `"${p}"` // shell: true (npx is a .cmd on Windows), and the repo path has spaces
  // Both files are registered inline scripts on Webflow, so both are capped.
  // The bridge keeps its original `-c -m` flags on purpose: its minified bytes
  // are byte-compared against the copy Webflow hosts on every site that already
  // carries it, and changing terser's settings would break that check for no gain.
  const builds = [
    { src: BRIDGE_FILE, out: MIN_FILE, args: ['-c', '-m'] },
    { src: PREFS_FILE, out: PREFS_MIN_FILE, args: ['-c', 'passes=3', '-m', 'toplevel=true'] },
  ]
  let over = false
  for (const b of builds) {
    const res = spawnSync('npx', ['-y', 'terser@5', quote(b.src), ...b.args, '--comments', 'false', '-o', quote(b.out)], { shell: true, encoding: 'utf8' })
    if (res.status !== 0) throw new Error(`terser failed on ${b.src}: ` + (res.stderr || '').slice(-300))
    const size = readFileSync(b.out, 'utf8').length
    console.log(`${b.out}: ${size} chars (Webflow limit ${WEBFLOW_LIMIT})${size > WEBFLOW_LIMIT ? ' TOO LONG' : ''}`)
    if (size > WEBFLOW_LIMIT) over = true
    // The preferences control is transcribed into register_inline_script by hand.
    // A backslash can lose a layer on the way through a tool call, so the build
    // refuses to ship one (the bridge is deployed from the file, so it is exempt).
    if (b.src === PREFS_FILE && readFileSync(b.out, 'utf8').includes(String.fromCharCode(92))) {
      console.log('  contains a backslash: rewrite it without escape sequences')
      over = true
    }
  }
  if (over) process.exitCode = 1
}

function snippet() {
  const disclosure = option('--disclosure')
  const config = disclosure
    ? `<script>window.BrandkloutConsentConfig = { marketingDisclosureVersion: "${disclosure}" };</script>\n`
    : ''
  return `${BEGIN}\n${config}<script>\n${bridgeSource()}\n</script>\n${END}`
}

/* ── Instatic ─────────────────────────────────────────────────────────────── */

function instaticSites() {
  const file = process.env.WEBZITE_ENV_MASTER || join(homedir(), '.brandklout', '.env')
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
  if (!['status', 'apply', 'termly', 'publish'].includes(sub)) throw new Error('instatic status | apply | termly | publish')
  if (sub === 'publish' && !option('--only')) throw new Error('publish needs --only <site>[,<site>]: name the sites you mean to ship')
  const sites = instaticSites()
  let failed = 0
  for (const site of sites) {
    console.log(`\n== ${site.name}  ${site.env.INSTATIC_BASE_URL}`)
    const res = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...argv, '--worker'], {
      // The worker needs to know WHICH client it is, to find that site's Termly
      // website in the registry. The section name is the client folder name.
      env: { ...process.env, ...site.env, WZ_SITE_NAME: site.name },
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
  const { site: shell, seq } = await getSite()
  const status = await publishStatus()
  const live = await fetch(BASE + '/').then((r) => r.text()).catch(() => '')

  // Where each of our assets stands on this site.
  const states = ASSETS.map((a) => {
    const file = (shell.files ?? []).find((f) => f.path === a.path)
    const want = sourceOf(a.file) + '\n'
    return {
      ...a,
      file,
      want,
      runtime: file ? shell.runtime?.scripts?.[file.id] : null,
      state: !file ? 'missing' : sameCode(file.content, want) ? 'current' : 'outdated',
    }
  })

  const csp = (live.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1] || ''
  const frameSrc = (csp.match(/frame-src ([^;]*)/) || [])[1] || '(no CSP)'
  for (const a of states) {
    console.log(`  ${a.label} ${a.state}${a.runtime ? ` (${a.runtime.placement}/${a.runtime.timing}/${a.runtime.scope?.type}, enabled=${a.runtime.enabled})` : ''}`)
  }
  console.log(`  draft matches published: ${status.draftMatchesPublished}   frame-src: ${frameSrc.slice(0, 90)}`)
  if (/frame-src 'none'/.test(csp)) console.log("  NOTE frame-src none: no GHL form can render here until the Embed block grants its origin")

  if (sub === 'status') {
    const want = termlyFor(process.env.WZ_SITE_NAME)
    const onPage = live.match(/app\.termly\.io\/resource-blocker\/([0-9a-f-]{36})(\?autoBlock=(\w+))?/) || []
    console.log(`  termly: ${onPage[1] ? `${onPage[1]} autoBlock=${onPage[3] ?? 'on (default)'}` : 'not on the page'}${want ? '' : '  (no registry entry for this site)'}`)
    return
  }

  if (sub === 'apply') {
    const todo = states.filter((a) => a.state !== 'current')
    if (!todo.length) { console.log('  nothing to do'); return }
    if (!flag('--apply')) { console.log(`  DRY RUN: would write ${todo.map((a) => `${a.path} (${a.state})`).join(', ')}`); return }
    if (!status.draftMatchesPublished) console.log('  WARNING the draft already differs from live; `publish` will refuse this site')

    // One atomic save for both assets: two site-document writes would make the
    // second one race the first's seq.
    const files = [...(shell.files ?? [])]
    const scripts = { ...(shell.runtime?.scripts ?? {}) }
    const now = Date.now()
    for (const a of todo) {
      const id = a.file?.id ?? newId()
      const entry = { ...(a.file ?? { id, path: a.path, type: 'script', createdAt: now }), content: a.want, updatedAt: now }
      if (a.file) files[files.indexOf(a.file)] = entry
      else files.push(entry)
      // The preferences control clones a footer link, so it must not run before
      // the footer is in the DOM: same body-end/dom-ready placement as the bridge.
      scripts[id] = { enabled: true, runInCanvas: false, format: 'classic', placement: 'body-end', timing: 'dom-ready', scope: { type: 'all-pages' }, priority: 50 }
    }
    const res = await api('PUT', '/admin/api/cms/site-document', {
      mode: 'incremental',
      site: { ...shell, files, runtime: { ...(shell.runtime ?? {}), scripts } },
      changedPages: [], deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
      changedLayouts: [], deletedLayoutIds: [], baseSeqs: {}, shellBaseSeq: seq,
    })
    // A SiteFile the server does not accept is dropped silently while the save answers ok, so read back.
    const after = (await getSite()).site
    let ok = true
    for (const a of todo) {
      const saved = (after.files ?? []).find((f) => f.path === a.path)
      const good = saved && sameCode(saved.content, a.want) && after.runtime?.scripts?.[saved.id]?.enabled
      console.log(`  ${a.label}: ${good ? 'OK' : 'FAILED'}`)
      if (!good) ok = false
    }
    console.log(`  saved seq ${res?.seq ?? '?'}`)
    const marker = JSON.parse(readFileSync(cleanMarker(), 'utf8'))
    writeFileSync(cleanMarker(), JSON.stringify({ ...marker, ourSeq: res?.seq }))
    if (!ok) process.exitCode = 1
    return
  }

  if (sub === 'termly') {
    // Phase 2. The Termly line cannot be a code asset: `script-src 'self'` and the
    // importHtml filter both refuse a third-party <script> in the head, so it goes
    // through the brandklout.embed-origins plugin's `siteScripts`, which is the one
    // supported way onto every page's head (see instatic-embeds).
    const want = termlyFor(process.env.WZ_SITE_NAME)
    if (!want) { console.log('  no registry entry for this site -- skipped'); return }
    const PLUGIN = 'brandklout.embed-origins'
    let now
    try {
      now = (await api('GET', `/admin/api/cms/plugins/${PLUGIN}/settings`))?.settings ?? {}
    } catch (e) {
      console.log(`  ${PLUGIN} not installed here (${e.status ?? e.message}) -- skipped`)
      process.exitCode = 1
      return
    }
    const lines = String(now.siteScripts ?? '').split(/\s+/).filter(Boolean)
    // Termly sets Google Consent Mode defaults, so it must come before GTM. The
    // plugin emits these tags in list order.
    const kept = lines.filter((l) => !/app\.termly\.io\/resource-blocker/.test(l))
    const dropped = lines.filter((l) => /app\.termly\.io\/resource-blocker/.test(l) && l !== want.embed)
    const gtmAt = kept.findIndex((l) => /googletagmanager\.com\/gtm\.js/.test(l))
    const next = kept.slice()
    next.splice(gtmAt === -1 ? next.length : gtmAt, 0, want.embed)

    const addOrigin = (key, origin) => {
      const cur = String(now[key] ?? '').split(/\s+/).filter(Boolean)
      return cur.includes(origin) ? cur.join('\n') : cur.concat(origin).join('\n')
    }
    const settings = {
      ...now,
      siteScripts: next.join('\n'),
      // Termly reads consent from its own API and opens its policy viewer in a frame.
      connectOrigins: addOrigin('connectOrigins', 'https://us.consent.api.termly.io'),
      frameOrigins: addOrigin('frameOrigins', 'https://app.termly.io'),
    }
    const same = ['siteScripts', 'connectOrigins', 'frameOrigins'].every((k) => String(now[k] ?? '') === settings[k])
    if (same) { console.log('  termly already set'); return }
    for (const d of dropped) console.log(`  replacing a different Termly line: ${d}`)
    if (!flag('--apply')) {
      console.log(`  DRY RUN: would set siteScripts to:\n${settings.siteScripts.split('\n').map((l) => '      ' + l).join('\n')}`)
      return
    }
    if (!status.draftMatchesPublished) console.log('  WARNING the draft already differs from live; `publish` will refuse this site')
    await api('PUT', `/admin/api/cms/plugins/${PLUGIN}/settings`, { settings })
    const after = (await api('GET', `/admin/api/cms/plugins/${PLUGIN}/settings`))?.settings ?? {}
    const ok = String(after.siteScripts ?? '').includes(want.embed)
    console.log(`  termly ${ok ? 'OK' : 'FAILED'} -- position ${next.indexOf(want.embed) + 1} of ${next.length}${gtmAt === -1 ? ' (no GTM on this site)' : ', above GTM'}`)
    if (!ok) process.exitCode = 1
    return
  }

  if (sub === 'publish') {
    const stale = states.filter((a) => a.state !== 'current')
    if (stale.length) { console.log(`  refusing: ${stale.map((a) => a.label).join(', ')} not current; run apply first`); process.exitCode = 1; return }
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

const cleanMarker = () => join(HERE, 'output', `clean-before-apply-${new URL(process.env.INSTATIC_BASE_URL).host}.json`)

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
    // Microsoft Clarity is banned on client sites (2026-10-07): no BAA, and its terms forbid health data.
    const banned = new Set()
    // GA4 is allowed, hardened (2026-10-07); report what it sends before a choice (gcs=G100 = denied, cookieless).
    const ga4 = new Set()
    page.on('request', (r) => {
      const m = r.url().match(/number_pool\.js|user_session\.js/); if (m) tracking.add(m[0])
      if (/^https?:\/\/([^/]*\.)?clarity\.ms\//.test(r.url())) banned.add('Microsoft Clarity')
      if (/\/g\/collect\?/.test(r.url())) { const q = new URL(r.url()).searchParams; ga4.add(`${q.get('tid')} ${q.get('en')} gcs=${q.get('gcs') || '-'}`) }
    })
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
    console.log(`${url}\n  ${JSON.stringify({ ...r, trackingBeforeConsent: [...tracking], ga4BeforeConsent: [...ga4], banned: [...banned] })}`)
    if (banned.size) {
      console.log(`  FAIL banned tracker: ${[...banned].join(', ')}. Remove it from GTM, siteScripts or the Webflow app; consent does not make it allowed.`)
      process.exitCode = 1
    }
    await ctx.close()
  }
  await browser.close()
}

/* ── main ─────────────────────────────────────────────────────────────────── */

const cmd = argv[0]
if (cmd === 'minify') minify()
else if (cmd === 'snippet') console.log(snippet())
else if (cmd === 'instatic' && flag('--worker')) {
  if (['apply', 'termly'].includes(argv[1]) && flag('--apply')) {
    const { publishStatus } = await import(pathToFileURL(INSTA_API).href)
    // Remember whether the draft was clean before our first write, so `publish` never ships someone else's edits.
    mkdirSync(join(HERE, 'output'), { recursive: true })
    if (!existsSync(cleanMarker())) writeFileSync(cleanMarker(), JSON.stringify(await publishStatus()))
  }
  await instaticWorker()
} else if (cmd === 'instatic') instaticParent()
else if (cmd === 'check') await check()
else {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0])
  process.exitCode = cmd ? 1 : 0
}
