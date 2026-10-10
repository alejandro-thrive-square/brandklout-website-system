#!/usr/bin/env node
/**
 * verify-data.mjs — prove an image change lost nothing. Compares a backup.mjs directory (before) with a
 * fresh snapshot of the same service (after). READ ONLY: it logs in and reads; it never saves or publishes.
 *
 * Written 2026-09-23 for Scenario 5. The after-snapshot is tools/instatic-site/ops/backup-site.mjs again,
 * the HTML normalisation follows tools/instatic-site/staging-clone/diff-sites.mjs, the admin login check
 * is tools/instatic-domain-origins/check-origins.mjs.
 *
 * Usage:
 *   node verify-data.mjs --backup <backup dir> [--db] [--no-origins]
 *   --db   also read cms.db over railway ssh (readonly): row counts, migrations, quick_check
 *
 * FAIL (exit 1): /health not 200, running digest not the one update.mjs set (when --expect given),
 *   a page row or slug gone, site seq moved, media count dropped, a plugin gone / disabled / erroring or
 *   its version changed, a route that was 200 now is not, a page lost its canonical, og:, JSON-LD or
 *   site-script tags, db rows dropped or quick_check not ok, check-origins not clean.
 * WARN: published HTML differs after normalising (expected after a REPUBLISH on a new version, not
 *   after an image change alone), CSP meta changed, new migrations applied (listed).
 * Writes <run dir>/verify.json with result PASS or FAIL; update-image.mjs reads it as the staging proof.
 */
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { listTargets, baseFor, siteCreds, currentDeployment, bunScript, lastJson, publicOrigin, health, role,
  DB_INFO_JS, has, opt, readJson, writeJson, outDir, die, TOOLS } from './lib.mjs'

const bdir = opt('backup') || die('pass --backup <dir written by backup.mjs>')
const rec = readJson(join(bdir, 'record.json'))
const all = await listTargets()
const t = all.find((x) => x.serviceId === rec.serviceId && x.environmentId === rec.environmentId) || die('the service in the backup record no longer exists')
const base = opt('base') || rec.base || baseFor(t)
const creds = siteCreds(t)
const dir = outDir('verify', t)
const checks = []
const add = (level, name, detail) => { checks.push({ level, name, detail }); console.log(`${level.padEnd(4)} ${name}${detail ? '  ' + detail : ''}`) }

/* platform */
const dep = await currentDeployment(t)
add(dep.status === 'SUCCESS' ? 'OK' : 'FAIL', 'deployment', `${dep.id} ${dep.status}`)
if (opt('expect')) add(dep.digest === opt('expect') ? 'OK' : 'FAIL', 'digest', dep.digest)
add(dep.volumeMounts.includes('/app/storage') ? 'OK' : 'FAIL', 'volume mounted', dep.volumeMounts.join(','))
const h = await health(base)
add(h === 200 ? 'OK' : 'FAIL', '/health', String(h))

/* after snapshot */
if (!creds.email || !creds.password) die('no credentials for this site in ~/.brandklout/.env')
const env = { ...process.env, INSTATIC_BASE_URL: base, INSTATIC_EMAIL: creds.email, INSTATIC_PASSWORD: creds.password }
const r = spawnSync(process.execPath, [join(TOOLS, 'instatic-site', 'ops', 'backup-site.mjs'), '--out', join(dir, 'api')], { cwd: dir, env, encoding: 'utf8' })
if (r.status !== 0) die(`backup-site.mjs failed:\n${r.stderr || r.stdout}`, 1)
Object.assign(process.env, { INSTATIC_EMAIL: creds.email, INSTATIC_PASSWORD: creds.password })
const { login, api } = await import('../instatic-site/staging-clone/lib.mjs')
const cookie = await login(base)
const A = (f) => JSON.parse(readFileSync(join(bdir, 'api', f), 'utf8'))
const B = (f) => JSON.parse(readFileSync(join(dir, 'api', f), 'utf8'))
const rowsOf = (p) => (Array.isArray(p) ? p : p.rows ?? p.pages ?? [])
const slugOf = (x) => x.cells?.slug ?? x.slug

const sumA = A('summary.json'), sumB = B('summary.json')
add(sumA.seq === sumB.seq ? 'OK' : 'FAIL', 'site seq', `${sumA.seq} -> ${sumB.seq}`)
const pa = rowsOf(A('pages.json')), pb = rowsOf(B('pages.json'))
const sb = new Set(pb.map(slugOf))
const gone = pa.map(slugOf).filter((s) => !sb.has(s))
add(pa.length === pb.length && !gone.length ? 'OK' : 'FAIL', 'page rows', `${pa.length} -> ${pb.length}${gone.length ? ' missing: ' + gone.join(', ') : ''}`)
const seqA = new Map(pa.map((x) => [x.id, x.seq])), moved = pb.filter((x) => seqA.has(x.id) && seqA.get(x.id) !== x.seq)
add(moved.length ? 'FAIL' : 'OK', 'row seqs', moved.length ? moved.map(slugOf).join(', ') : 'unchanged')
const bodyLost = pb.filter((x) => pa.find((y) => y.id === x.id)?.body && !x.body)
if (bodyLost.length) add('FAIL', 'page bodies', 'empty now: ' + bodyLost.map(slugOf).join(', '))

const mediaB = await api(base, cookie, 'GET', '/admin/api/cms/media?limit=500')
const mA = rec.mediaCount ?? 0, mB = (mediaB.assets ?? mediaB.rows ?? mediaB.items ?? []).length
add(mB >= mA ? 'OK' : 'FAIL', 'media', `${mA} -> ${mB}`)

const plB = await api(base, cookie, 'GET', '/admin/api/cms/plugins')
const plist = (plB.plugins ?? plB).map((p) => ({ id: p.manifest?.id ?? p.id, version: p.manifest?.version ?? p.version, enabled: p.enabled ?? null, lastError: p.lastError ?? null }))
for (const p of rec.plugins ?? []) {
  const q = plist.find((x) => x.id === p.id)
  if (!q) add('FAIL', `plugin ${p.id}`, 'gone')
  else if (q.version !== p.version || q.enabled !== p.enabled || (q.lastError && !p.lastError)) add('FAIL', `plugin ${p.id}`, `${p.version}/${p.enabled} -> ${q.version}/${q.enabled}${q.lastError ? ' error: ' + JSON.stringify(q.lastError).slice(0, 160) : ''}`)
  else add('OK', `plugin ${p.id}`, q.version)
}
const pubB = await api(base, cookie, 'GET', '/admin/api/cms/publish/status')
if (rec.publishStatus && pubB.draftMatchesPublished !== rec.publishStatus.draftMatchesPublished) add('WARN', 'publish status', `draftMatchesPublished ${rec.publishStatus.draftMatchesPublished} -> ${pubB.draftMatchesPublished}`)

/* published output */
const norm = (s) => s.replace(/\s+srcset="[^"]*"/g, '').replace(/\s+sizes="[^"]*"/g, '').replace(/\s+/g, ' ').trim()
const count = (s, re) => (s.match(re) || []).length
const MARKS = { canonical: /<link[^>]+rel="canonical"/g, og: /<meta[^>]+property="og:/g, jsonld: /application\/ld\+json/g, siteScript: /data-wz-site-script/g }
const csp = (s) => (s.match(/<meta http-equiv="Content-Security-Policy"[^>]*>/i) || [''])[0]
const htmlA = join(bdir, 'api', 'html'), htmlB = join(dir, 'api', 'html')
const files = existsSync(htmlA) ? readdirSync(htmlA, { recursive: true }).filter((f) => String(f).endsWith('.html')) : []
let same = 0, diff = [], cspChanged = 0
for (const f of files) {
  const fb = join(htmlB, String(f))
  if (!existsSync(fb)) { add('FAIL', `route ${f}`, 'no longer served'); continue }
  const a = readFileSync(join(htmlA, String(f)), 'utf8'), b = readFileSync(fb, 'utf8')
  if (norm(a) === norm(b)) { same++; continue }
  diff.push(String(f))
  for (const [k, re] of Object.entries(MARKS)) if (count(b, re) < count(a, re)) add('FAIL', `route ${f}`, `${k} ${count(a, re)} -> ${count(b, re)}`)
  if (csp(a) !== csp(b)) cspChanged++
}
add(diff.length ? 'WARN' : 'OK', 'published HTML', `${same}/${files.length} identical${diff.length ? '; differs: ' + diff.slice(0, 12).join(', ') + (diff.length > 12 ? ' ...' : '') : ''}`)
if (cspChanged) add('WARN', 'CSP meta', `changed on ${cspChanged} page(s); check third-party scripts in a browser`)
const notServed = sumB.notServed ?? []
if (notServed.length > (sumA.notServed ?? []).length) add('FAIL', 'routes', 'not served now: ' + notServed.join(', '))

/* database (optional, readonly) */
if (has('db')) {
  const d = lastJson(bunScript(t, DB_INFO_JS))
  const b0 = rec.dbBefore ?? {}
  add(d.quickCheck === 'ok' ? 'OK' : 'FAIL', 'quick_check', d.quickCheck)
  for (const k of ['data_rows', 'data_tables', 'media_live', 'installed_plugins', 'users']) {
    if (b0.counts?.[k] == null) continue
    add(d.counts[k] >= b0.counts[k] ? 'OK' : 'FAIL', `db ${k}`, `${b0.counts[k]} -> ${d.counts[k]}`)
  }
  const newMig = (d.migrations ?? []).filter((m) => !(b0.migrations ?? []).includes(m))
  if (newMig.length) add('WARN', 'migrations applied', newMig.join(', ') + ' (one way: an image rollback now runs old code on this schema)')
  writeJson(join(dir, 'db-after.json'), d)
}

/* admin login origin */
if (!has('no-origins')) {
  const po = await publicOrigin(t).catch(() => null)
  const urls = (po ? po.split(',') : [base]).map((s) => s.trim()).filter(Boolean)
  for (const u of urls) {
    const c = spawnSync(process.execPath, [join(TOOLS, 'instatic-domain-origins', 'check-origins.mjs'), u], { encoding: 'utf8' })
    add(c.status === 0 ? 'OK' : 'FAIL', `check-origins ${u}`, c.status === 0 ? '' : (c.stdout + c.stderr).trim().split(/\r?\n/).slice(-2).join(' | '))
  }
}

const fail = checks.filter((c) => c.level === 'FAIL')
const out = { at: new Date().toISOString(), projectId: t.projectId, environmentId: t.environmentId, serviceId: t.serviceId, role: role(t),
  base, backup: bdir, digestBefore: rec.digest, digestAfter: dep.digest, result: fail.length ? 'FAIL' : 'PASS', checks }
writeJson(join(dir, 'verify.json'), out)
console.log(`\n${out.result} (${fail.length} fail, ${checks.filter((c) => c.level === 'WARN').length} warn)  wrote ${join(dir, 'verify.json')}`)
process.exit(fail.length ? 1 : 0)
