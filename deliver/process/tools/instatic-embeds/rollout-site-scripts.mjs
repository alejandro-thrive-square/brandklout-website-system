#!/usr/bin/env node
/**
 * Put one site-wide script on every Instatic instance, through the
 * `brandklout.embed-origins` plugin's `siteScripts` setting.
 *
 *   node rollout-site-scripts.mjs status                         # read-only
 *   node rollout-site-scripts.mjs apply   --url <script> [--apply]
 *   node rollout-site-scripts.mjs publish [--apply]
 *   node rollout-site-scripts.mjs verify  --url <script>
 *   ...add --only <section>[,<section>] to any of them
 *
 * The instances are every section of `~/.webzite/.env` carrying an
 * `INSTATIC_BASE_URL`, so a new client is picked up without editing this file.
 * Each site runs in a CHILD process with that section's credentials in its
 * environment: `insta-api.mjs` resolves `BASE` once at import, so one process
 * can only ever talk to one site.
 *
 * `apply` upgrades the plugin where the installed version is older than the one in
 * `../instatic-plugins/embed-origins/plugin.json`, installs it where it is missing and refuses a
 * site that is newer, then merges
 * the URL into `siteScripts` without touching any other setting. It publishes
 * nothing. `publish` is separate because a publish bakes EVERY page, and
 * `status` shows the draft state first so unrelated drift is seen before it
 * ships.
 *
 * Run with output redirected to a file, not piped: Node on Windows can die on
 * a libuv assertion when stdout is a pipe.
 */
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readMaster } from '../instatic-plugins/lib/fleet.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ID = 'brandklout.embed-origins'
const GRANT = ['cms.hooks', 'modules.register', 'frontend.assets']
// The plugin source and its packages live in ../instatic-plugins since 2026-09-23 (one home for
// every plugin). For a plugin upgrade on its own, use ../instatic-plugins/plugins.mjs rollout.
const PLUGINS = join(HERE, '..', 'instatic-plugins')
const WANT_VERSION = JSON.parse(readFileSync(join(PLUGINS, 'embed-origins', 'plugin.json'), 'utf8')).version
const ZIP = join(PLUGINS, 'output', 'packages', `${ID}-${WANT_VERSION}.zip`)
const newer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false }

const cmd = process.argv[2]
const APPLY = process.argv.includes('--apply')
const argOf = (flag) => {
  const i = process.argv.indexOf(flag)
  return i === -1 ? null : process.argv[i + 1] ?? ''
}

/* ── master env: lib/fleet.mjs in ../instatic-plugins owns the reader now ──── */

/* ── parent: loop the sites, one child each ──────────────────────────────── */

async function parent() {
  const only = argOf('--only')?.split(',').map((s) => s.trim().toLowerCase())
  const sites = readMaster().filter((s) => !only || only.includes(s.name))
  if (cmd === 'apply' && !argOf('--url')) throw new Error('apply needs --url <script>')
  if (cmd === 'verify' && !argOf('--url')) throw new Error('verify needs --url <script>')
  if (cmd === 'apply' && !existsSync(ZIP)) {
    throw new Error(`no package at ${ZIP} — run: node ../instatic-plugins/plugins.mjs pack --plugin embed-origins`)
  }
  let failed = 0
  for (const site of sites) {
    console.log(`\n== ${site.name}  ${site.env.INSTATIC_BASE_URL}`)
    const res = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2), '--worker'], {
      env: { ...process.env, ...site.env },
      stdio: 'inherit',
    })
    if (res.status !== 0) failed++
  }
  console.log(`\n${sites.length} sites, ${failed} failed`)
  if (failed) process.exitCode = 1
}

/* ── worker: one site ────────────────────────────────────────────────────── */

async function worker() {
  const { api, requestForm, publish, publishStatus, getPages, BASE } = await import('./lib/insta-api.mjs')
  const url = argOf('--url')

  const findPlugin = async () =>
    ((await api('GET', '/admin/api/cms/plugins')).plugins ?? []).find((p) => p.id === ID)
  const readSettings = async () => (await api('GET', `/admin/api/cms/plugins/${ID}/settings`)).settings ?? {}

  if (cmd === 'status') {
    const p = await findPlugin()
    const s = p ? await readSettings() : {}
    console.log(`  plugin   ${p ? `v${p.version} ${p.lifecycleStatus} enabled=${p.enabled}` : 'NOT INSTALLED'}`)
    if (p) console.log(`  settings ${JSON.stringify({ embedPolicy: s.embedPolicy, siteScripts: s.siteScripts ?? '' })}`)
    console.log(`  publish  ${JSON.stringify(await publishStatus()).slice(0, 400)}`)
    return
  }

  if (cmd === 'apply') {
    let p = await findPlugin()
    const before = p ? await readSettings() : {}
    // Never downgrade: a site ahead of the source (Dr. Nahlah ran 1.8.0 while this folder said 1.7.0)
    // would lose features live. Bring the newer source into ../instatic-plugins first.
    if (p && newer(p.version, WANT_VERSION)) throw new Error(`refused: installed v${p.version} is newer than the source v${WANT_VERSION}`)
    if (!p || p.version !== WANT_VERSION) {
      console.log(`  plugin   ${p ? `v${p.version}` : 'missing'} -> v${WANT_VERSION}${APPLY ? '' : '  (dry run)'}`)
      if (APPLY) {
        const bytes = readFileSync(ZIP)
        const form = () => {
          const f = new FormData()
          f.append('file', new Blob([bytes], { type: 'application/zip' }), basename(ZIP))
          f.append('grantedPermissions', JSON.stringify(GRANT))
          return f
        }
        const inspected = await requestForm('/admin/api/cms/plugins/inspect-package', form())
        const m = inspected.manifest ?? inspected.plugin ?? inspected
        const extra = (m.permissions ?? []).filter((x) => !GRANT.includes(x))
        if (m.id !== ID || extra.length) throw new Error(`refused: ${m.id} asks for ${extra.join(', ')}`)
        await requestForm('/admin/api/cms/plugins/package', form())
        p = await findPlugin()
        if (!p || p.version !== WANT_VERSION || p.lifecycleStatus !== 'active' || !p.enabled) {
          throw new Error(`after install: ${JSON.stringify(p && { v: p.version, s: p.lifecycleStatus, e: p.enabled })}`)
        }
      }
    } else {
      console.log(`  plugin   v${p.version} already current`)
    }
    if (!APPLY) { console.log(`  would set siteScripts to include ${url}`); return }

    const now = await readSettings()
    // An upgrade must not have reset what the site already had configured.
    const lost = Object.keys(before).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(now[k]))
    if (lost.length) throw new Error(`upgrade changed settings: ${lost.join(', ')}`)
    const lines = String(now.siteScripts ?? '').split(/\s+/).filter(Boolean)
    if (!lines.includes(url)) lines.push(url)
    const next = { ...now, siteScripts: lines.join('\n') }
    await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, { settings: next })
    const after = await readSettings()
    const wrong = Object.keys(next).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(next[k]))
    if (wrong.length) throw new Error(`settings did not round-trip: ${wrong.join(', ')}`)
    console.log(`  settings siteScripts = ${JSON.stringify(after.siteScripts)}`)
    return
  }

  if (cmd === 'publish') {
    // Re-read at the moment of publishing, not trusted from an earlier status:
    // an editor may have started work since.
    const before = await publishStatus()
    if (before.draftMatchesPublished === false && !process.argv.includes('--allow-drift')) {
      console.log(`  SKIPPED  the draft differs from what is live and would ship with it` +
        ` (${before.draftPages} draft / ${before.publishedPages} published pages); --allow-drift to publish anyway`)
      process.exitCode = 1
      return
    }
    if (!APPLY) { console.log('  dry run — add --apply'); return }
    console.log(`  publish  ${JSON.stringify(await publish()).slice(0, 300)}`)
    console.log(`  status   ${JSON.stringify(await publishStatus()).slice(0, 300)}`)
    return
  }

  if (cmd === 'verify') {
    const host = new URL(url).origin
    const { rows } = await getPages()
    const slugs = rows.map((r) => r.cells?.slug ?? r.slug).filter(Boolean)
    let bad = 0
    for (const slug of slugs) {
      const pageUrl = `${BASE}/${slug === 'index' ? '' : slug}`
      const res = await fetch(pageUrl, { headers: { 'user-agent': 'brandklout-site-script-check' } })
      if (res.status === 404) continue // drafts that were never published
      const html = await res.text()
      const tags = html.split(`src="${url.replace(/&/g, '&amp;')}"`).length - 1
      const csp = (html.match(/<meta http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i) ?? [])[1]
      const allows = (d) => {
        if (!csp) return true
        const list = (csp.split(';').map((x) => x.trim()).find((x) => x.split(' ')[0] === d) ?? '').split(' ')
        return list.includes(host) || list.includes('https:')
      }
      const ok = tags === 1 && ['script-src', 'connect-src', 'font-src'].every(allows)
      if (!ok) bad++
      if (!ok) console.log(`  FAIL ${res.status} ${pageUrl}  tags=${tags} csp=${csp ? 'yes' : 'none'}`)
    }
    console.log(`  ${slugs.length} pages checked, ${bad} failing`)
    if (bad) process.exitCode = 1
    return
  }
}

if (!['status', 'apply', 'publish', 'verify'].includes(cmd)) {
  console.error('usage: rollout-site-scripts.mjs <status|apply|publish|verify> [--url <script>] [--only a,b] [--apply]')
  process.exit(2)
}
await (process.argv.includes('--worker') ? worker() : parent())
