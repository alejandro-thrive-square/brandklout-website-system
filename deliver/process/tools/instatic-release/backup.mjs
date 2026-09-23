#!/usr/bin/env node
/**
 * backup.mjs — full backup of ONE Instatic service instance before its image changes.
 *
 * Written 2026-09-23 for Scenario 5. Extends tools/instatic-site/ops/backup-site.mjs (the API snapshot,
 * run here as a child process) with what an image change needs on top:
 *   record.json    project/env/service ids, image ref, RUNNING digest and its version tag, deployment id,
 *                  volume id, PUBLIC_ORIGIN, base URL. rollback.mjs and update-image.mjs read it.
 *   db-before.json cms.db facts, read with a readonly open: schema_migrations, row counts, quick_check.
 *   api/           backup-site.mjs output (site shell, page rows, published HTML, seq) plus
 *                  plugins.json, media.json, publish-status.json.
 *   db-copy.json   the VACUUM INTO copy on the volume (/app/storage/backups/), checked with
 *                  integrity_check and a row count, plus a tar of /app/storage/uploads (media and
 *                  plugin code). Never `cp cms.db`: recent writes sit in cms.db-wal.
 * Optional: --railway-backup asks Railway for a native volume backup (volumeInstanceBackupCreate), the
 * only copy that survives the volume itself; --download pulls the DB copy to this machine.
 *
 * Usage (run from the client folder or any folder; output goes to ./output/instatic-release/):
 *   node backup.mjs --site <env section> --env <production|staging>            plan only, reads Railway
 *   node backup.mjs --site dr-nahlah --env staging --snapshot                  + API snapshot (read only)
 *   node backup.mjs --site dr-nahlah --env staging --apply [--label pre-0.0.20] [--railway-backup] [--download]
 *   --project <id|name> instead of --site; --service <name> if a project has two; --base <url> to override.
 * --apply writes ONLY backup files (on the volume and locally). It changes no page, setting or variable.
 * Env: credentials from ~/.webzite/.env (the site's section) or INSTATIC_EMAIL / INSTATIC_PASSWORD.
 */
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { pickTarget, baseFor, siteCreds, publicOrigin, ghcrDigestMap, bunScript, lastJson, ssh, gql, DB_INFO_JS, DB, MOUNT,
  has, opt, stamp, outDir, writeJson, health, role, TOOLS, die } from './lib.mjs'

const APPLY = has('apply')
const t = await pickTarget()
const base = baseFor(t)
const creds = siteCreds(t)
const map = await ghcrDigestMap()
const version = t.digest ? map.get(t.digest) ?? null : null
const label = (opt('label', 'pre-update')).replace(/[^a-z0-9.-]+/gi, '-')

const record = {
  at: new Date().toISOString(), label,
  projectId: t.projectId, project: t.project, environmentId: t.environmentId, environment: t.environment, role: role(t),
  serviceId: t.serviceId, service: t.service, base, envSection: creds.section,
  image: t.image, digest: t.digest, version, deploymentId: t.deploymentId, deploymentStatus: t.deploymentStatus,
  volume: t.volume, hosts: [...t.customDomains, ...t.serviceDomains],
  publicOrigin: await publicOrigin(t).catch((e) => `error: ${e.message}`),
  health: base ? await health(base) : null,
}
console.log(`target  ${t.project} / ${t.environment} / ${t.service}  (${record.role})`)
console.log(`image   ${t.image}  running ${version ?? 'unknown version'} ${t.digest}`)
console.log(`volume  ${t.volume ? `${t.volume.mountPath} ${Math.round(t.volume.currentSizeMB)}/${t.volume.sizeMB}MB ${t.volume.state}` : 'NONE'}`)
console.log(`base    ${base}  /health ${record.health}   creds: ${creds.section ?? 'env'}${creds.email ? '' : ' (MISSING EMAIL)'}`)
if (!t.volume) die('REFUSING: no volume at /app/storage. This instance keeps its data in the container and a deploy wipes it. Create the volume first (railway-duplicate-env-has-no-volume).')
if (!t.deploymentStatus || t.deploymentStatus !== 'SUCCESS') console.warn(`WARNING: latest deployment is ${t.deploymentStatus}; back up what is running, then look at why.`)

const stampNow = stamp()
const dbFile = `${MOUNT}/backups/cms-${stampNow}-${label}.db`
const upFile = `${MOUNT}/backups/uploads-${stampNow}-${label}.tgz`
if (!APPLY && !has('snapshot')) {
  console.log('\nplan (dry run; nothing read from the site, nothing written):')
  console.log(`  1 record.json + db facts (readonly) over railway ssh`)
  console.log(`  2 API snapshot: backup-site.mjs + plugins, media, publish status at ${base}`)
  console.log(`  3 VACUUM INTO ${dbFile}, integrity_check, row count`)
  console.log(`  4 tar ${MOUNT}/uploads -> ${upFile}`)
  if (has('railway-backup')) console.log(`  5 Railway volume backup of ${t.volume.id}`)
  console.log('\nrun with --snapshot (read only) or --apply (all of it).')
  process.exit(0)
}

const dir = outDir('backup', t)
writeJson(join(dir, 'record.json'), record)

/* 1 database facts (readonly) */
if (APPLY) {
  record.dbBefore = lastJson(bunScript(t, DB_INFO_JS))
  writeJson(join(dir, 'db-before.json'), record.dbBefore)
  console.log(`db      ${record.dbBefore.lastMigration}  rows ${record.dbBefore.counts?.data_rows}  media ${record.dbBefore.counts?.media_live}  quick_check ${record.dbBefore.quickCheck}`)
  if (record.dbBefore.quickCheck !== 'ok') die(`REFUSING: quick_check says ${record.dbBefore.quickCheck}. The database is already damaged; stop and escalate.`, 1)
}

/* 2 API snapshot: backup-site.mjs, then what it does not cover */
if (!creds.email || !creds.password) die('no INSTATIC_EMAIL / INSTATIC_PASSWORD for this site (add a section to ~/.webzite/.env)')
const env = { ...process.env, INSTATIC_BASE_URL: base, INSTATIC_EMAIL: creds.email, INSTATIC_PASSWORD: creds.password }
const r = spawnSync(process.execPath, [join(TOOLS, 'instatic-site', 'ops', 'backup-site.mjs'), '--out', join(dir, 'api')], { cwd: dir, env, encoding: 'utf8' })
if (r.status !== 0) die(`backup-site.mjs failed:\n${r.stderr || r.stdout}`, 1)
record.snapshot = JSON.parse(readFileSync(join(dir, 'api', 'summary.json'), 'utf8'))
Object.assign(process.env, { INSTATIC_EMAIL: creds.email, INSTATIC_PASSWORD: creds.password })
const { login, api } = await import('../instatic-site/staging-clone/lib.mjs')
const cookie = await login(base)
const plugins = await api(base, cookie, 'GET', '/admin/api/cms/plugins')
const media = await api(base, cookie, 'GET', '/admin/api/cms/media?limit=500')
const pub = await api(base, cookie, 'GET', '/admin/api/cms/publish/status')
writeJson(join(dir, 'api', 'plugins.json'), plugins)
writeJson(join(dir, 'api', 'media.json'), media)
writeJson(join(dir, 'api', 'publish-status.json'), pub)
const list = plugins.plugins ?? plugins
record.plugins = (Array.isArray(list) ? list : []).map((p) => ({ id: p.manifest?.id ?? p.id, version: p.manifest?.version ?? p.version, enabled: p.enabled ?? null, lastError: p.lastError ?? null }))
record.mediaCount = (media.assets ?? media.rows ?? media.items ?? []).length
record.publishStatus = pub
console.log(`api     seq ${record.snapshot.seq}  pages ${record.snapshot.pageRows}  html ${record.snapshot.htmlSaved}  media ${record.mediaCount}  plugins ${record.plugins.map((p) => `${p.id}@${p.version}`).join(', ') || 'none'}`)
if (pub.draftMatchesPublished === false) console.warn(`WARNING: unpublished drafts (${pub.draftPages} draft / ${pub.publishedPages} published). Do not publish them as part of the update; tell the owner.`)

/* 3 + 4 VACUUM INTO and the uploads tar, on the volume */
if (APPLY) {
  const need = (record.dbBefore.dbBytes ?? 0) + (record.dbBefore.walBytes ?? 0)
  if (record.dbBefore.volumeFree && record.dbBefore.volumeFree < need * 2 + 64 * 1048576) die(`REFUSING: ${Math.round(record.dbBefore.volumeFree / 1048576)}MB free on the volume, the copy needs about ${Math.round(need * 2 / 1048576)}MB. Prune versions first (tools/instatic-api-sync/prune-versions.mjs).`, 1)
  const js = `
const { Database } = require('bun:sqlite'); const fs = require('fs'); const cp = require('child_process')
fs.mkdirSync('${MOUNT}/backups', { recursive: true })
new Database('${DB}').run("VACUUM INTO '${dbFile}'")
const b = new Database('${dbFile}', { readonly: true })
const integrity = b.query('pragma integrity_check').get().integrity_check
const rows = b.query('select count(*) as n from data_rows').get().n
const live = new Database('${DB}', { readonly: true }).query('select count(*) as n from data_rows').get().n
cp.execSync('tar czf ${upFile} -C ${MOUNT} uploads')
const sha = (f) => cp.execSync('sha256sum ' + f).toString().split(' ')[0]
console.log(JSON.stringify({ dbFile: '${dbFile}', dbBytes: fs.statSync('${dbFile}').size, dbSha256: sha('${dbFile}'), integrity, rows, liveRows: live,
  uploadsFile: '${upFile}', uploadsBytes: fs.statSync('${upFile}').size }))`
  record.dbCopy = lastJson(bunScript(t, js, { timeout: 1_200_000 }))
  writeJson(join(dir, 'db-copy.json'), record.dbCopy)
  console.log(`copy    ${record.dbCopy.dbFile} ${Math.round(record.dbCopy.dbBytes / 1048576)}MB integrity ${record.dbCopy.integrity} rows ${record.dbCopy.rows}/${record.dbCopy.liveRows}`)
  console.log(`        ${record.dbCopy.uploadsFile} ${Math.round(record.dbCopy.uploadsBytes / 1048576)}MB`)
  if (record.dbCopy.integrity !== 'ok' || record.dbCopy.rows !== record.dbCopy.liveRows) die('BACKUP NOT GOOD: integrity or row count mismatch. Do not update this site.', 1)

  if (has('download')) {
    const b64 = ssh(t, `base64 -w0 ${dbFile}`, { timeout: 1_800_000 }).replace(/\s+/g, '')
    const local = join(dir, `cms-${stampNow}-${label}.db`)
    writeFileSync(local, Buffer.from(b64, 'base64'))
    const sha = createHash('sha256').update(readFileSync(local)).digest('hex')
    record.dbCopy.local = local; record.dbCopy.localSha256Match = sha === record.dbCopy.dbSha256
    console.log(`local   ${local} sha256 ${record.dbCopy.localSha256Match ? 'matches' : 'MISMATCH'}`)
  }
  if (has('railway-backup')) {
    const d = await gql(`mutation($v: String!, $n: String) { volumeInstanceBackupCreate(volumeInstanceId: $v, name: $n) }`, { v: t.volume.id, n: `${label} ${stampNow}` })
    record.railwayBackup = { requested: new Date().toISOString(), workflow: d.volumeInstanceBackupCreate }
    console.log(`railway volume backup requested (${JSON.stringify(d.volumeInstanceBackupCreate)}); confirm it in volumeInstanceBackupList or the dashboard`)
  }
}

writeJson(join(dir, 'record.json'), record)
console.log(`\nwrote ${dir}`)
console.log(`git tag for the client state (run in the client worktree):  git tag instatic-${record.envSection ?? 'site'}-${t.environment}-${label}-${stampNow.slice(0, 10)}`)
console.log(`seq ${record.snapshot.seq}: check it again right before the update. A different seq means someone edited since this backup.`)
