#!/usr/bin/env node
/**
 * update-image.mjs — move ONE Instatic service to a pinned release, redeploy, wait, prove the digest.
 *
 * Written 2026-09-23 for Scenario 5. Uses Railway GraphQL with ~/.railway/config.json user.accessToken
 * (serviceInstanceUpdate source.image, then serviceInstanceDeployV2 if the update did not deploy by
 * itself), the same calls tools/instatic-site/setup/provision-instance.mjs makes.
 *
 * Usage:
 *   node update-image.mjs --site <section> --env staging --version 0.0.20                     dry run (default)
 *   node update-image.mjs --site <section> --env staging --version 0.0.20 --backup <dir> --apply
 *   node update-image.mjs --site <section> --env staging --pin-current --backup <dir> --apply   pin what runs now
 *   production also needs: --allow-production and --staging-proof <verify dir or verify.json>
 *                          (or --no-staging when the project has no staging instance, and say why)
 *   --by-digest   set ghcr.io/corebunch/instatic@sha256:... instead of :<version>
 *
 * Refuses when: the version is `latest` or unknown on ghcr; there is no volume at /app/storage; the backup
 * record is missing, older than --max-age hours (default 24), for another service, or taken on a
 * different digest than the one running now; production without a passing staging verify on the same
 * digest. After the deploy it asserts the new deployment runs the expected digest with /app/storage
 * mounted and /health answers 200. Then run verify-data.mjs.
 * Downtime: about 5 to 10 seconds per deploy (one volume, one container). Open editor tabs lose unsaved state.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pickTarget, baseFor, ghcrDigest, ghcrDigestMap, imageRef, deployImage, currentDeployment, health, role,
  has, opt, readJson, writeJson, outDir, die, MOUNT } from './lib.mjs'

const APPLY = has('apply')
const t = await pickTarget()
const r = role(t)
const map = await ghcrDigestMap()
const runningVersion = map.get(t.digest) ?? 'unknown'

let version = opt('version')
if (has('pin-current')) {
  if (runningVersion === 'unknown' || runningVersion === 'latest') die(`cannot pin in place: the running digest ${t.digest} has no version tag on ghcr`)
  version = runningVersion
}
if (!version) die('pass --version <x.y.z> or --pin-current')
if (/^latest$/i.test(version)) die('REFUSING: `latest` is a moving tag. Pin a version.')
const digest = await ghcrDigest(version).catch((e) => die(e.message))
const image = imageRef(version, digest, has('by-digest'))
const base = baseFor(t)

console.log(`target   ${t.project} / ${t.environment} / ${t.service}  (${r})`)
console.log(`now      ${t.image}  running ${runningVersion} ${t.digest}`)
console.log(`to       ${image}  ${digest}${digest === t.digest ? '  (same digest: pin only, no code change)' : ''}`)

/* guards */
const problems = []
if (!t.volume) problems.push(`no volume at ${MOUNT}: a deploy would wipe the site`)
if (!t.volumeMounts.includes(MOUNT)) problems.push(`the running deployment does not mount ${MOUNT}`)
const backupArg = opt('backup')
let record = null
if (backupArg) {
  const f = backupArg.endsWith('.json') ? backupArg : join(backupArg, 'record.json')
  if (!existsSync(f)) problems.push(`no backup record at ${f}`)
  else {
    record = readJson(f)
    const ageH = (Date.now() - new Date(record.at).getTime()) / 3.6e6
    if (record.serviceId !== t.serviceId || record.environmentId !== t.environmentId) problems.push('the backup is for another service or environment')
    if (record.digest !== t.digest) problems.push(`the backup was taken on ${record.digest}, the service now runs ${t.digest}: back up again`)
    if (ageH > Number(opt('max-age', 24))) problems.push(`the backup is ${ageH.toFixed(1)}h old (max ${opt('max-age', 24)}h)`)
    if (!record.dbCopy || record.dbCopy.integrity !== 'ok') problems.push('the backup has no checked VACUUM INTO copy (run backup.mjs --apply)')
  }
} else problems.push('no --backup <dir> given')
if (r !== 'staging') {
  if (!has('allow-production')) problems.push('this is production: pass --allow-production after staging passed and the owner said go')
  if (!has('no-staging') && digest !== t.digest) { // a pin in place (same digest) changes no code and needs no staging proof
    const p = opt('staging-proof')
    const f = p && (p.endsWith('.json') ? p : join(p, 'verify.json'))
    if (!f || !existsSync(f)) problems.push('no --staging-proof <verify.json> (or --no-staging for a project with no staging instance)')
    else {
      const v = readJson(f)
      if (v.projectId !== t.projectId) problems.push('the staging proof is for another project')
      if (v.result !== 'PASS') problems.push(`the staging proof says ${v.result}`)
      if (v.digestAfter !== digest) problems.push(`staging was verified on ${v.digestAfter}, not ${digest}`)
    }
  }
}
if (problems.length) {
  console.log('\nblocked:\n  - ' + problems.join('\n  - '))
  if (APPLY) process.exit(1)
}
if (!APPLY) { console.log('\ndry run: nothing changed. Add --apply once nothing above is blocked.'); process.exit(0) }

/* the change */
const dir = outDir('update', t)
const log = { at: new Date().toISOString(), projectId: t.projectId, environmentId: t.environmentId, serviceId: t.serviceId, role: r,
  imageBefore: t.image, digestBefore: t.digest, versionBefore: runningVersion, imageAfter: image, digestExpected: digest, version, backup: backupArg }
const { before, after } = await deployImage(t, image)
const fresh = await currentDeployment(t)
log.deploymentBefore = before.id; log.deploymentAfter = after.id; log.status = after.status
log.digestAfter = fresh.digest; log.volumeMounts = fresh.volumeMounts
log.health = base ? await health(base) : null
const ok = after.id !== before.id && after.status === 'SUCCESS' && fresh.digest === digest && fresh.volumeMounts.includes(MOUNT) && log.health === 200
log.result = ok ? 'DEPLOYED' : 'FAILED'
writeJson(join(dir, 'update.json'), log)
console.log(`\n${log.result}: deployment ${after.id} ${after.status}, digest ${fresh.digest === digest ? 'as expected' : 'WRONG ' + fresh.digest}, mount ${fresh.volumeMounts.join(',') || 'NONE'}, /health ${log.health}`)
console.log(`wrote ${dir}`)
if (!ok) {
  console.log(`\nSTOP. Do not touch the next site. Roll back: node rollback.mjs --backup ${backupArg} --apply`)
  process.exit(1)
}
console.log(`next: node verify-data.mjs --backup ${backupArg}`)
