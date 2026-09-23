#!/usr/bin/env node
/**
 * plugins.mjs — install and update the brandklout.* Instatic plugins across every site.
 *
 *   node plugins.mjs registry                                   # what we release, who must carry it
 *   node plugins.mjs test   [--plugin <name>]                   # offline suites, no site
 *   node plugins.mjs pack   [--plugin <name>]                   # output/packages/<id>-<version>.zip
 *   node plugins.mjs status [--plugin <name>] [--sites a,b] [--env production|staging|both]   # read-only
 *   node plugins.mjs rollout --plugin <name> --sites a,b|expected --env staging|production|both
 *                           [--apply] [--publish] [--allow-drift] [--allow-downgrade] [--no-staging-ok] [--limit 6]
 *   node plugins.mjs verify --plugin <name> [--sites a,b] [--env ...] [--limit 6]            # read-only
 *
 * Everything is a DRY RUN unless --apply is given. Nothing here deletes or uninstalls a plugin.
 *
 * Hosts: ../instatic-domain-origins/sites.json (`<client>` = production, `<client>-staging` =
 * staging). Credentials: the `[<client>]` section of ~/.webzite/.env (staging uses the same
 * login). Each host runs in its own CHILD process with that host's credentials in its
 * environment, because the admin client fixes its host at import. No host is ever guessed.
 *
 * rollout, per host, one at a time, stopping at the first failure:
 *   1. read the plugin row, its settings, its stored records and the draft state
 *   2. refuse: the old webzite.* id (migrate first), a downgrade, a production host whose staging
 *      is not already on the released version (parity: staging first), no staging at all
 *      (unless --no-staging-ok)
 *   3. snapshot: plugin-before.json (settings + every record) and ops/backup-site.mjs
 *   4. baseline the SEO head gate on production when the plugin writes the head
 *   5. install the rebuilt package with the registry grants
 *   6. check: active, enabled, released version, settings key for key, record counts
 *   7. --publish: only when the draft matches what is live (--allow-drift to override)
 *   8. verify: published pages still carry exactly one of each tag, no unknown module, no
 *      webzite.* marker; seo-head-check failures must not grow
 *
 * Origin: written 2026-09-23 for scenario 4. Reuses lib/install.mjs (the per-id GRANTS installer
 * from bk-dr-nahlah 16-instatic-plugins/install-plugin.mjs), pack-plugin.mjs, the fleet loop and
 * draft-drift check of ../instatic-embeds/rollout-site-scripts.mjs, the export and verify checks
 * of ../instatic-api-sync/migrate-plugin-ids.mjs, ../instatic-site/ops/backup-site.mjs and
 * ../instatic-site/gates/seo-head-check.mjs.
 *
 * Windows: redirect output to a file (`> output/x.log 2>&1`); Node 24 can die when stdout is a pipe.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, openSync, closeSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { HERE, TOOLS, loadRegistry, expectedPlugins, resolvePluginId, targets } from './lib/fleet.mjs'
import { packPlugin } from './lib/pack.mjs'

const SELF = fileURLToPath(import.meta.url)
const argv = process.argv.slice(2)
const cmd = argv[0]
const has = (f) => argv.includes(f)
const arg = (f, d = null) => { const i = argv.indexOf(f); return i === -1 ? d : argv[i + 1] ?? d }
const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
const cmpVersion = (a, b) => {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0) ? -1 : 1
  return 0
}

const { reg, problems } = loadRegistry()

/* ═══ worker: one host, credentials in the environment ═══════════════════ */

if (has('--worker')) {
  const job = JSON.parse(process.env.PLUGINS_JOB)
  const write = (r) => writeFileSync(process.env.PLUGINS_OUT, JSON.stringify(r, null, 1))
  try {
    write(await worker(job))
  } catch (e) {
    console.log(`  ERROR ${e.message}`)
    write({ ok: false, error: e.message })
  }
  process.exit(0)
}

async function worker(job) {
  const L = await import('./lib/install.mjs')
  const S = await import('../instatic-site/lib/site.mjs')
  const { api, BASE } = L
  const id = job.id
  const p = id ? reg.plugins[id] : null

  const rowOf = async () => (await L.listInstalled()).find((x) => L.idOf(x) === id)
  const brief = (x) => x && ({ id: L.idOf(x), version: L.versionOf(x), enabled: x.enabled, status: x.lifecycleStatus, lastError: x.lastError ?? null })

  if (job.op === 'read') {
    const plugins = (await L.listInstalled()).map(brief)
    let publish = null
    try { publish = await S.publishStatus() } catch (e) { publish = { error: e.message } }
    return { ok: true, plugins, publish: publish && { draftMatchesPublished: publish.draftMatchesPublished, draftPages: publish.draftPages, publishedPages: publish.publishedPages } }
  }

  if (job.op === 'verify') return verifyHost({ L, S, id, p, limit: job.limit, env: job.env })

  if (job.op === 'rollout') {
    const row = await rowOf()
    const from = row ? L.versionOf(row) : null
    const manifest = row?.manifest ?? p.manifest
    const beforeSettings = row ? await L.readSettings(id, manifest) : {}
    const beforeRecords = row ? await L.readRecords(id, manifest) : {}
    const pub = await S.publishStatus()
    const counts = Object.fromEntries(Object.entries(beforeRecords).map(([k, v]) => [k, v.length]))
    console.log(`  before   ${row ? `v${from} ${row.lifecycleStatus} enabled=${row.enabled}` : 'not installed'}` +
      `  settings:${Object.keys(beforeSettings).length}  records:${JSON.stringify(counts)}  draftMatchesPublished=${pub.draftMatchesPublished}`)

    const willInstall = from !== p.version
    let willPublish = job.publish && p.publishes && willInstall
    if (willPublish && !from) {
      console.log('  note     fresh install: settings are empty. Configure them (siteUrl, organisation, origins) and publish by hand; not publishing.')
      willPublish = false
    }
    if (job.publish && !p.publishes) console.log(`  note     ${id} is editor-only; nothing to publish`)
    if (willPublish && pub.draftMatchesPublished === false && !job.allowDrift) {
      throw new Error(`the draft differs from what is live (${pub.draftPages} draft / ${pub.publishedPages} published pages); ` +
        `a publish would ship it. Ask the site owner, then --allow-drift, or roll out without --publish`)
    }

    const seoGate = job.env === 'production' && p.publishes && ['brandklout.open-graph', 'brandklout.aeo-schema'].includes(id)
    const snap = join(job.snapDir, new URL(BASE).host)

    if (job.apply && (willInstall || willPublish)) {
      mkdirSync(snap, { recursive: true })
      writeFileSync(join(snap, 'plugin-before.json'), JSON.stringify({ base: BASE, at: new Date().toISOString(), row: brief(row), settings: beforeSettings, records: beforeRecords, publish: pub }, null, 1))
      console.log(`  snapshot ${join(snap, 'plugin-before.json')}`)
      const b = spawnSync(process.execPath, [join(TOOLS, 'instatic-site', 'ops', 'backup-site.mjs'), '--out', join(snap, 'site')], { stdio: 'inherit', env: process.env })
      if (b.status !== 0) throw new Error('ops/backup-site.mjs failed; nothing was installed')
    }

    let baseline = null
    if (job.apply && seoGate && willPublish) baseline = runSeoGate(snap, 'before', job.limit)

    const zip = packPlugin(p, id)
    const res = await L.installPlugin({ id, p, zip, apply: job.apply, allowDowngrade: job.allowDowngrade })
    if (res.action === 'dry') {
      console.log(`  would    snapshot + backup-site, install v${p.version}${willPublish ? ', publish' : ''}, verify`)
      return { ok: true, action: 'dry', from, to: p.version }
    }

    if (res.action === 'installed') {
      const now = await rowOf()
      if (!now || L.versionOf(now) !== p.version || !now.enabled || now.lifecycleStatus !== 'active' || now.lastError) {
        throw new Error(`after install: ${JSON.stringify(brief(now))}`)
      }
      const afterSettings = await L.readSettings(id, now.manifest ?? p.manifest)
      const lost = Object.keys(beforeSettings).filter((k) => JSON.stringify(beforeSettings[k]) !== JSON.stringify(afterSettings[k]))
      if (lost.length) throw new Error(`settings changed by the upgrade: ${lost.join(', ')} (restore from ${join(snap, 'plugin-before.json')})`)
      const afterRecords = await L.readRecords(id, now.manifest ?? p.manifest)
      for (const [rid, rows] of Object.entries(beforeRecords)) {
        if ((afterRecords[rid] ?? []).length !== rows.length) throw new Error(`${rid}: ${(afterRecords[rid] ?? []).length} records after, ${rows.length} before`)
      }
      console.log(`  after    v${p.version} active, settings ${Object.keys(beforeSettings).length}/${Object.keys(beforeSettings).length} kept, records kept`)
    }

    if (willPublish && job.apply) {
      const again = await S.publishStatus() // re-read: an editor may have started since
      if (again.draftMatchesPublished === false && !job.allowDrift) throw new Error('the draft changed during the rollout; not publishing')
      await S.publish()
      console.log('  publish  done')
    } else if (p.publishes && res.action === 'installed') {
      console.log('  publish  not run: the new code reaches pages at the next publish')
    }

    const v = await verifyHost({ L, S, id, p, limit: job.limit, env: job.env })
    if (!v.ok) return { ...v, action: res.action, from }
    if (baseline) {
      const after = runSeoGate(snap, 'after', job.limit)
      if (after.fail > baseline.fail) return { ok: false, action: res.action, from, error: `seo-head-check failures grew ${baseline.fail} -> ${after.fail} (logs in ${snap})` }
      console.log(`  seo-gate ${baseline.fail} -> ${after.fail} failures (not worse)`)
    }
    return { ok: true, action: res.action, from, to: p.version }
  }
  throw new Error(`unknown worker op ${job.op}`)
}

function runSeoGate(snap, label, limit) {
  mkdirSync(snap, { recursive: true })
  const log = join(snap, `seo-head-check-${label}.log`)
  // Output to a file descriptor, never a pipe: Node 24 on Windows can die when stdout is a pipe.
  const fd = openSync(log, 'w')
  spawnSync(process.execPath, [join(TOOLS, 'instatic-site', 'gates', 'seo-head-check.mjs'), '--limit', String(limit)],
    { stdio: ['ignore', fd, fd], env: process.env })
  closeSync(fd)
  const m = /(\d+) passed, (\d+) failed/.exec(existsSync(log) ? readFileSync(log, 'utf8') : '')
  return { pass: m ? Number(m[1]) : 0, fail: m ? Number(m[2]) : Infinity, log }
}

/** Published output check for one plugin on the host in process.env. Read-only. */
async function verifyHost({ L, S, id, p, limit = 6 }) {
  const { BASE, api } = L
  const fails = []
  const row = (await L.listInstalled()).find((x) => L.idOf(x) === id)
  if (!row) return { ok: false, error: `${id} is not installed` }
  const v = L.versionOf(row)
  if (v !== p.version) fails.push(`version ${v}, released ${p.version}`)
  if (!row.enabled || row.lifecycleStatus !== 'active' || row.lastError) fails.push(`row ${JSON.stringify({ enabled: row.enabled, status: row.lifecycleStatus, lastError: row.lastError ?? null })}`)
  if (!p.publishes) {
    console.log(`  verify   ${id} v${v} ${fails.length ? 'FAIL ' + fails.join('; ') : 'ok (editor-only: nothing on published pages)'}`)
    return { ok: !fails.length, error: fails.join('; ') || undefined }
  }
  const settings = await L.readSettings(id, row.manifest ?? p.manifest)

  const { rows } = await S.getPages()
  const live = rows.filter((r) => !r.cells?.templateEnabled)
  const slug = (r) => r.cells?.slug ?? r.slug
  const hasEmbed = (r) => JSON.stringify(r.cells?.body ?? {}).includes('"brandklout.embed-origins.embed"')
  const pick = new Set(['index'])
  for (const r of live) { if (pick.size >= limit) break; if (slug(r)) pick.add(slug(r)) }
  if (id === 'brandklout.embed-origins') for (const r of live.filter(hasEmbed).slice(0, 3)) pick.add(slug(r))

  const count = (html, s) => html.split(s).length - 1
  const scripts = String(settings.siteScripts ?? '').split(/\s+/).filter(Boolean).map((line) => {
    const hash = line.indexOf('#')
    return { url: hash === -1 ? line : line.slice(0, hash), scoped: /[#&](pages|except)=/.test(line) }
  })
  let checked = 0, sawEmbed = false
  for (const s of pick) {
    const url = `${BASE}/${s === 'index' ? '' : s}`
    const res = await fetch(url, { headers: { 'user-agent': 'brandklout-plugin-check' } })
    if (res.status === 404) continue // a draft that was never published
    const html = await res.text()
    checked++
    const bad = []
    if (res.status !== 200) bad.push(`status ${res.status}`)
    if (html.includes('instatic: unknown module')) bad.push('unknown module')
    if (/data-aeo="webzite\.|webzite\.(embed-origins|open-graph|aeo-schema|link-editor)/.test(html)) bad.push('old webzite.* marker')
    if (id === 'brandklout.aeo-schema' && settings.enabled !== false) {
      const n = count(html, 'data-aeo="brandklout.aeo-schema"')
      if (n > 1 || (settings.siteUrl && n !== 1)) bad.push(`${n} aeo graphs`)
      const m = /<script type="application\/ld\+json" data-aeo="brandklout\.aeo-schema">([\s\S]*?)<\/script>/.exec(html)
      if (m) { try { JSON.parse(m[1]) } catch { bad.push('aeo graph does not parse') } }
    }
    if (id === 'brandklout.open-graph' && settings.enabled !== false) {
      if (count(html, 'property="og:title"') !== 1) bad.push(`${count(html, 'property="og:title"')} og:title`)
      if (settings.emitCanonical !== false && settings.siteUrl && count(html, 'rel="canonical"') < 1) bad.push('no canonical')
    }
    if (id === 'brandklout.embed-origins') {
      if (count(html, 'http-equiv="Content-Security-Policy"') !== 1) bad.push(`${count(html, 'http-equiv="Content-Security-Policy"')} CSP meta tags`)
      for (const sc of scripts) {
        const n = count(html, `src="${sc.url.replace(/&/g, '&amp;')}"`)
        if (sc.scoped ? n > 1 : n !== 1) bad.push(`${n} tags for ${sc.url}`)
      }
      if (html.includes('data-wz-embed')) sawEmbed = true
    }
    if (bad.length) fails.push(`${url}: ${bad.join(', ')}`)
  }
  if (sawEmbed) {
    const js = await fetch(`${BASE}/_instatic/module-js/brandklout.embed-origins.embed.js`)
    if (!js.ok) fails.push(`module-js ${js.status}`)
  }
  if (!checked) fails.push('no published page could be fetched')
  console.log(`  verify   ${id} v${v}  ${checked} pages  ${fails.length ? 'FAIL' : 'ok'}`)
  for (const f of fails) console.log(`           ${f}`)
  return { ok: !fails.length, error: fails.join('; ') || undefined }
}

/* ═══ parent ════════════════════════════════════════════════════════════ */

function runOn(t, job) {
  const dir = join(HERE, 'output', 'work')
  mkdirSync(dir, { recursive: true })
  const out = join(dir, `${t.client}-${t.env}-${job.op}.json`)
  writeFileSync(out, '{}')
  // Explicit credentials for THIS host; never let lib/site.mjs fill a gap from the worktree .env.
  const r = spawnSync(process.execPath, [SELF, '--worker'], {
    stdio: 'inherit',
    env: { ...process.env, ...t.creds, PLUGINS_JOB: JSON.stringify(job), PLUGINS_OUT: out },
  })
  const res = JSON.parse(readFileSync(out, 'utf8'))
  if (res.ok === undefined) return { ok: false, error: `worker wrote no result (exit ${r.status})` }
  return res
}

function needRegistry() {
  if (problems.length) {
    console.error(`plugins.json does not match the plugin sources:\n  ${problems.join('\n  ')}`)
    process.exit(1)
  }
}

function pickTargets() {
  const env = arg('--env', 'both')
  if (!['production', 'staging', 'both'].includes(env)) throw new Error('--env is production, staging or both')
  const s = arg('--sites')
  const only = s && s !== 'expected' ? s.split(',').map((x) => x.trim()) : null
  return targets({ only, env })
}

async function cmdRegistry() {
  for (const [id, p] of Object.entries(reg.plugins)) {
    console.log(`${id.padEnd(26)} v${p.version.padEnd(7)} ${p.dir.padEnd(14)} grants: ${p.grants.join(', ')}`)
  }
  console.log('')
  for (const t of targets({ env: 'production' })) {
    console.log(`${t.client.padEnd(34)} ${expectedPlugins(reg, t.client).map((x) => x.replace('brandklout.', '')).join(', ')}`)
  }
  if (problems.length) { console.log(`\nPROBLEMS\n  ${problems.join('\n  ')}`); process.exitCode = 1 }
}

async function cmdTest() {
  needRegistry()
  const only = arg('--plugin') ? resolvePluginId(reg, arg('--plugin')) : null
  let failed = 0
  for (const [id, p] of Object.entries(reg.plugins)) {
    if (only && id !== only) continue
    for (const t of p.tests ?? []) {
      console.log(`\n== ${id}: ${t}`)
      const r = spawnSync(process.execPath, [join(HERE, t)], { stdio: 'inherit', cwd: HERE })
      if (r.status !== 0) failed++
    }
  }
  console.log(`\n${failed ? `${failed} suite(s) FAILED` : 'all suites passed'}`)
  if (failed) process.exitCode = 1
}

async function cmdPack() {
  needRegistry()
  const only = arg('--plugin') ? resolvePluginId(reg, arg('--plugin')) : null
  for (const [id, p] of Object.entries(reg.plugins)) {
    if (only && id !== only) continue
    console.log(`${id} v${p.version} -> ${packPlugin(p, id)}`)
  }
}

async function cmdStatus() {
  needRegistry()
  const only = arg('--plugin') ? resolvePluginId(reg, arg('--plugin')) : null
  const ids = only ? [only] : Object.keys(reg.plugins)
  const rows = []
  for (const t of pickTargets()) {
    console.log(`\n== ${t.client} ${t.env}  ${t.url}`)
    const res = t.problem ? { ok: false, error: t.problem } : runOn(t, { op: 'read' })
    rows.push({ ...t, creds: undefined, res })
  }
  const issues = []
  const installedOf = (r, id) => r.res.ok ? r.res.plugins.find((x) => x.id === id) : undefined
  const clients = [...new Set(rows.map((r) => r.client))]
  console.log(`\n${'site'.padEnd(34)} ${'env'.padEnd(10)} ${ids.map((i) => i.replace('brandklout.', '').padEnd(15)).join(' ')} draft`)
  for (const r of rows) {
    const want = expectedPlugins(reg, r.client)
    if (!r.res.ok) {
      console.log(`${r.client.padEnd(34)} ${r.env.padEnd(10)} UNREACHABLE: ${r.res.error}`)
      issues.push(`${r.client} ${r.env}: unreachable (${r.res.error})` +
        (/login failed/.test(r.res.error) ? ' — fix the master before re-running; five failed logins lock the account' : ''))
      continue
    }
    const cells = ids.map((id) => {
      const x = installedOf(r, id)
      const rel = reg.plugins[id].version
      if (!x) return (want.includes(id) ? 'MISSING' : '-').padEnd(15)
      const c = cmpVersion(x.version, rel)
      const tag = c < 0 ? 'OLD' : c > 0 ? 'AHEAD' : 'ok'
      if (!want.includes(id)) issues.push(`${r.client} ${r.env}: ${id} installed but not in the registry for this site (add it to plugins.json sites, or leave it)`)
      if (c < 0) issues.push(`${r.client} ${r.env}: ${id} v${x.version} < released v${rel}`)
      if (c > 0) issues.push(`${r.client} ${r.env}: ${id} v${x.version} is AHEAD of the source v${rel} — bring the newer source into tools/instatic-plugins before any rollout`)
      if (!x.enabled || x.status !== 'active' || x.lastError) issues.push(`${r.client} ${r.env}: ${id} ${x.status} enabled=${x.enabled} lastError=${x.lastError}`)
      return `${x.version} ${tag}`.padEnd(15)
    })
    for (const id of want) if (ids.includes(id) && !installedOf(r, id)) issues.push(`${r.client} ${r.env}: ${id} MISSING`)
    for (const x of r.res.plugins) if (x.id.startsWith('webzite.')) issues.push(`${r.client} ${r.env}: old id ${x.id} — run migrate-plugin-ids.mjs`)
    const d = r.res.publish?.draftMatchesPublished
    console.log(`${r.client.padEnd(34)} ${r.env.padEnd(10)} ${cells.join(' ')} ${d === true ? 'clean' : d === false ? 'DRIFT' : '?'}`)
  }
  for (const c of clients) {
    const prod = rows.find((r) => r.client === c && r.env === 'production' && r.res.ok)
    const stg = rows.find((r) => r.client === c && r.env === 'staging' && r.res.ok)
    if (!rows.some((r) => r.client === c && r.env === 'staging') && arg('--env', 'both') !== 'production') issues.push(`${c}: no staging host in sites.json (info)`)
    if (!prod || !stg) continue
    for (const id of ids) {
      const a = installedOf(prod, id)?.version, b = installedOf(stg, id)?.version
      if (a !== b) issues.push(`${c}: PARITY ${id} production ${a ?? 'missing'} vs staging ${b ?? 'missing'}`)
    }
  }
  const out = join(HERE, 'output', 'status', `status-${stamp()}.json`)
  mkdirSync(join(HERE, 'output', 'status'), { recursive: true })
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), released: Object.fromEntries(Object.entries(reg.plugins).map(([k, v]) => [k, v.version])), rows, issues }, null, 1))
  console.log(issues.length ? `\n${issues.length} issue(s)\n  ${issues.join('\n  ')}` : '\nno drift')
  console.log(`\nwrote ${out}`)
  if (issues.some((i) => !i.endsWith('(info)'))) process.exitCode = 1
}

async function cmdRollout() {
  needRegistry()
  const id = resolvePluginId(reg, arg('--plugin'))
  if (!id) throw new Error('rollout needs --plugin <name>')
  const sitesArg = arg('--sites')
  if (!sitesArg) throw new Error('rollout needs --sites a,b or --sites expected (every site the registry says must carry it)')
  const env = arg('--env', 'staging')
  const p = reg.plugins[id]
  const job = {
    op: 'rollout', id, apply: has('--apply'), publish: has('--publish'), allowDrift: has('--allow-drift'),
    allowDowngrade: has('--allow-downgrade'), limit: Number(arg('--limit', '6')),
    snapDir: join(HERE, 'output', 'rollouts', `${stamp()}-${p.dir}-${p.version}`),
  }
  let all = targets({ only: sitesArg === 'expected' ? null : sitesArg.split(',').map((s) => s.trim()), env: 'both' })
  if (sitesArg === 'expected') all = all.filter((t) => expectedPlugins(reg, t.client).includes(id))
  const clients = [...new Set(all.map((t) => t.client))]
  if (sitesArg !== 'expected') {
    const unknown = sitesArg.split(',').map((s) => s.trim()).filter((s) => !clients.includes(s))
    if (unknown.length) throw new Error(`no host for: ${unknown.join(', ')} (add it to sites.json)`)
  }
  console.log(`${id} v${p.version}  env=${env}  ${job.apply ? 'APPLY' : 'DRY RUN'}${job.publish ? ' +publish' : ''}  sites: ${clients.join(', ')}`)

  const log = []
  for (const client of clients) {
    const stg = all.find((t) => t.client === client && t.env === 'staging')
    const prod = all.find((t) => t.client === client && t.env === 'production')
    const plan = []
    if (env !== 'production') {
      if (stg) plan.push(stg)
      else if (env === 'staging') { console.log(`\n== ${client}: no staging host; skipped (use --env production --no-staging-ok)`); continue }
    }
    if (env !== 'staging' && prod) {
      // Parity: production only after staging runs the released version (or has just been verified).
      if (!stg && !has('--no-staging-ok')) throw new Error(`${client} has no staging host in sites.json; pass --no-staging-ok to roll production directly`)
      if (stg && env === 'production') {
        const s = runOn(stg, { op: 'read' })
        const v = s.ok && s.plugins.find((x) => x.id === id)?.version
        if (v !== p.version) throw new Error(`${client} staging runs ${id} ${v || 'nothing'}, not v${p.version}: roll out staging first (--env staging), verify, then production`)
      }
      plan.push(prod)
    }
    for (const t of plan) {
      if (t.problem) throw new Error(`${t.client} ${t.env}: ${t.problem}`)
      console.log(`\n== ${t.client} ${t.env}  ${t.url}`)
      const res = runOn(t, { ...job, env: t.env })
      log.push({ client: t.client, env: t.env, url: t.url, ...res })
      if (!res.ok) {
        writeLog(job, log)
        console.log(`\nSTOPPED at ${t.client} ${t.env}: ${res.error}`)
        console.log(`Snapshot to restore from: ${job.snapDir}`)
        process.exitCode = 1
        return
      }
    }
  }
  writeLog(job, log)
  console.log(`\n${log.length} host(s) ${job.apply ? 'done' : 'planned'}; next: node plugins.mjs status --plugin ${p.dir}`)
}

function writeLog(job, log) {
  if (!job.apply) return
  mkdirSync(job.snapDir, { recursive: true })
  writeFileSync(join(job.snapDir, 'rollout.json'), JSON.stringify({ at: new Date().toISOString(), job, log }, null, 1))
  console.log(`\nwrote ${join(job.snapDir, 'rollout.json')}`)
}

async function cmdVerify() {
  needRegistry()
  const id = resolvePluginId(reg, arg('--plugin'))
  if (!id) throw new Error('verify needs --plugin <name>')
  let bad = 0
  for (const t of pickTargets()) {
    if (!expectedPlugins(reg, t.client).includes(id) && !arg('--sites')) continue
    console.log(`\n== ${t.client} ${t.env}  ${t.url}`)
    const res = t.problem ? { ok: false, error: t.problem } : runOn(t, { op: 'verify', id, env: t.env, limit: Number(arg('--limit', '6')) })
    if (!res.ok) { bad++; console.log(`  FAIL ${res.error}`) }
  }
  console.log(bad ? `\n${bad} host(s) failing` : '\nall hosts verified')
  if (bad) process.exitCode = 1
}

const RUN = { registry: cmdRegistry, test: cmdTest, pack: cmdPack, status: cmdStatus, rollout: cmdRollout, verify: cmdVerify }
if (!RUN[cmd]) {
  console.error('usage: node plugins.mjs <registry|test|pack|status|rollout|verify> [options] (see the header)')
  process.exit(2)
}
try { await RUN[cmd]() } catch (e) { console.error(`\n${e.message}`); process.exitCode = 1 }
