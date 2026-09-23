#!/usr/bin/env node
/**
 * rollback.mjs — put ONE Instatic service back on the release recorded in a backup.mjs directory, and
 * only if the data itself is damaged, swap the VACUUM INTO copy back in.
 *
 * Written 2026-09-23 for Scenario 5. The DB swap follows tools/instatic-api-sync/prune-versions.mjs
 * (copy to cms.db.new, integrity_check, remove cms.db + -wal + -shm, move, restart; the running server
 * keeps the old inode until it restarts), and the restore recipe in instatic-db-backup-vacuum-into.
 *
 * Usage:
 *   node rollback.mjs --backup <dir>                        dry run: shows what would happen
 *   node rollback.mjs --backup <dir> --apply                image back to the recorded version, redeploy, prove digest
 *   node rollback.mjs --backup <dir> --apply --restore-db   also swap the DB copy back (loses edits made after the backup)
 *   --force-restore   restore even though the live DB looks intact (say why in the runbook)
 *   --by-digest       set image@sha256 instead of the version tag
 *
 * Image first, data second: an old binary must boot on the old schema. Restoring the DB under the new
 * image would simply re-run the new migrations on it. Never roll back to `latest`: that is the new release.
 */
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { listTargets, ghcrDigest, imageRef, deployImage, currentDeployment, bunScript, lastJson, gql, health, DB_INFO_JS, DB,
  has, opt, readJson, writeJson, outDir, die, sleep } from './lib.mjs'

const APPLY = has('apply')
const bdir = opt('backup') || die('pass --backup <dir written by backup.mjs>')
if (!existsSync(join(bdir, 'record.json'))) die(`no record.json in ${bdir}`)
const rec = readJson(join(bdir, 'record.json'))
const t = (await listTargets()).find((x) => x.serviceId === rec.serviceId && x.environmentId === rec.environmentId) || die('that service no longer exists')
if (!rec.digest) die('the record has no digest; roll back by hand from the Railway deployments list')
if (!rec.version || rec.version === 'latest') console.warn('the recorded digest has no version tag; using image@digest')
const byDigest = has('by-digest') || !rec.version || rec.version === 'latest'
if (!byDigest && (await ghcrDigest(rec.version)) !== rec.digest) die(`ghcr tag ${rec.version} no longer points at ${rec.digest}; rerun with --by-digest`)
const image = imageRef(rec.version, rec.digest, byDigest)
const cur = await currentDeployment(t)

console.log(`target   ${rec.project} / ${rec.environment} / ${rec.service}`)
console.log(`now      ${cur.image}  ${cur.digest}  ${cur.status}`)
console.log(`back to  ${image}  ${rec.digest}  (backup ${rec.at})`)
const needImage = cur.digest !== rec.digest
if (!needImage) console.log('image already on the recorded digest')
if (has('restore-db')) console.log(`db       restore ${rec.dbCopy?.dbFile ?? '(no copy recorded!)'}; edits after ${rec.at} are lost`)
if (!APPLY) { console.log('\ndry run: nothing changed.'); process.exit(0) }

const dir = outDir('rollback', t)
const log = { at: new Date().toISOString(), backup: bdir, from: cur, to: { image, digest: rec.digest } }

if (needImage) {
  const { after } = await deployImage(t, image)
  const fresh = await currentDeployment(t)
  log.imageRollback = { deployment: after.id, status: after.status, digest: fresh.digest }
  if (fresh.digest !== rec.digest || after.status !== 'SUCCESS') {
    writeJson(join(dir, 'rollback.json'), log)
    die(`image rollback did not land (${after.status}, ${fresh.digest}). Try Railway's own rollback on deployment ${rec.deploymentId} in the dashboard.`, 1)
  }
  console.log('image rolled back')
}

if (has('restore-db')) {
  if (!rec.dbCopy?.dbFile) die('no VACUUM INTO copy in this backup; cannot restore the database', 1)
  const now = lastJson(bunScript(t, DB_INFO_JS))
  const b0 = rec.dbBefore ?? {}
  const damaged = now.quickCheck !== 'ok' || now.error ||
    ['data_rows', 'data_tables', 'media_live', 'users'].some((k) => b0.counts?.[k] != null && (now.counts?.[k] ?? 0) < b0.counts[k])
  log.dbBeforeRestore = now
  if (!damaged && !has('force-restore')) {
    writeJson(join(dir, 'rollback.json'), log)
    die('REFUSING: the live DB passes quick_check and no count dropped. The image rollback is enough; a restore would only throw away edits. --force-restore overrides.', 1)
  }
  const f = rec.dbCopy.dbFile
  const js = `
const { Database } = require('bun:sqlite'); const cp = require('child_process'); const fs = require('fs')
const chk = new Database('${f}', { readonly: true }).query('pragma integrity_check').get().integrity_check
if (chk !== 'ok') { console.log(JSON.stringify({ ok: false, why: 'backup integrity ' + chk })); process.exit(0) }
cp.execSync('cp ${f} ${DB}.new && sync')
const chk2 = new Database('${DB}.new', { readonly: true }).query('pragma integrity_check').get().integrity_check
if (chk2 !== 'ok') { console.log(JSON.stringify({ ok: false, why: 'staged copy integrity ' + chk2 })); process.exit(0) }
for (const x of ['${DB}', '${DB}-wal', '${DB}-shm']) { try { fs.unlinkSync(x) } catch {} }
fs.renameSync('${DB}.new', '${DB}'); cp.execSync('sync')
console.log(JSON.stringify({ ok: true, bytes: fs.statSync('${DB}').size }))`
  const res = lastJson(bunScript(t, js, { timeout: 1_200_000 }))
  log.restore = res
  if (!res.ok) { writeJson(join(dir, 'rollback.json'), log); die(`restore aborted before touching cms.db: ${res.why}`, 1) }
  // the running server still holds the old inode: restart so it opens the restored file
  await gql(`mutation($s: String!, $e: String!) { serviceInstanceRedeploy(serviceId: $s, environmentId: $e) }`, { s: t.serviceId, e: t.environmentId })
  console.log('db swapped; restarting')
  for (let i = 0; i < 60; i++) { await sleep(10_000); const d = await currentDeployment(t); if (d.id !== cur.id && d.status === 'SUCCESS') break }
}

log.health = rec.base ? await health(rec.base) : null
writeJson(join(dir, 'rollback.json'), log)
console.log(`/health ${log.health}. wrote ${dir}`)
console.log(`next: node verify-data.mjs --backup ${bdir} --db   (then the runbook: what failed, what was restored)`)
