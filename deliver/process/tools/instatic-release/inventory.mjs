#!/usr/bin/env node
/**
 * inventory.mjs — which Instatic version is every site running? READ ONLY.
 *
 * Written 2026-09-23 for Scenario 5 (Instatic Release Update). Enumerates the Brandklout Railway
 * workspace (the source of truth: sites.json listed 2 of 14 service instances on the day this was
 * written), joins it with tools/instatic-domain-origins/sites.json and ~/.webzite/.env, and maps each
 * running digest to its ghcr.io version tag.
 *
 * Usage (from anywhere):
 *   node inventory.mjs                  table + output/instatic-release/<stamp>-inventory.json
 *   node inventory.mjs --origins        also read PUBLIC_ORIGIN per service (one extra query each)
 *   node inventory.mjs --db             also read cms.db facts over railway ssh (readonly open; slow)
 *   node inventory.mjs --json           print the JSON instead of the table
 *   node inventory.mjs --only <project substring>
 *
 * Flags raised per row:
 *   UNPINNED       the service image is a moving tag (:latest). Any redeploy can become an upgrade.
 *   NO-VOLUME      no volume at /app/storage. The next deploy loses the whole site. Stop everything.
 *   DRIFT          the image ref's tag no longer points at the digest this service runs.
 *   VOLUME>80%     near 90% writes fail silently (Dr. Nahlah, 2026-08-18).
 *   NOT-REGISTERED no sites.json entry for any of its hosts.
 *   NO-CREDS       no ~/.webzite/.env section matches it: backup and verify cannot log in.
 * Never prints a token or a variable other than PUBLIC_ORIGIN.
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { listTargets, ghcrDigestMap, ghcrTags, readRegistry, sectionFor, role, publicOrigin, bunScript, lastJson,
  DB_INFO_JS, has, opt, stamp, writeJson, IMAGE_REPO } from './lib.mjs'

const targets = (await listTargets()).filter((t) => !opt('only') || t.project.toLowerCase().includes(opt('only').toLowerCase()))
const digests = await ghcrDigestMap()
const tags = await ghcrTags()
const newest = tags[tags.length - 1]
const latestDigest = [...digests].find(([, t]) => t === newest)?.[0]
const registry = readRegistry()
const regHosts = new Set(registry.flatMap((s) => [s.adminUrl, ...(s.alternates ?? [])]).map((u) => { try { return new URL(u).hostname } catch { return null } }))

const rows = []
for (const t of targets) {
  const version = t.digest ? digests.get(t.digest) ?? 'unknown' : 'none'
  const tag = (t.image ?? '').startsWith(IMAGE_REPO) ? (t.image.includes('@') ? t.image.split('@')[1] : t.image.split(':')[1] ?? 'latest') : null
  const flags = []
  if (!t.image || /:latest$/.test(t.image) || !/[:@]/.test(t.image.replace(/^[^/]*\//, ''))) flags.push('UNPINNED')
  if (!t.volume) flags.push('NO-VOLUME')
  if (tag && !tag.startsWith('sha256:') && tag !== 'latest' && digests.get(t.digest) !== tag) flags.push('DRIFT')
  if (t.volume && t.volume.sizeMB && t.volume.currentSizeMB / t.volume.sizeMB > 0.8) flags.push('VOLUME>80%')
  const hosts = [...t.customDomains, ...t.serviceDomains]
  if (!hosts.some((h) => regHosts.has(h))) flags.push('NOT-REGISTERED')
  const sec = sectionFor(t)
  if (!sec) flags.push('NO-CREDS')
  const row = {
    project: t.project, environment: t.environment, role: role(t), service: t.service,
    projectId: t.projectId, environmentId: t.environmentId, serviceId: t.serviceId,
    image: t.image, version, digest: t.digest, behindNewest: t.digest !== latestDigest,
    deploymentId: t.deploymentId, deploymentStatus: t.deploymentStatus, deployedAt: t.deployedAt,
    volume: t.volume ? { id: t.volume.id, mountPath: t.volume.mountPath, usedMB: Math.round(t.volume.currentSizeMB), sizeMB: t.volume.sizeMB, state: t.volume.state } : null,
    hosts, envSection: sec?.name ?? null, flags,
  }
  if (has('origins')) { try { row.publicOrigin = await publicOrigin(t) } catch (e) { row.publicOrigin = `error: ${e.message}` } }
  if (has('db')) { try { row.db = lastJson(bunScript(t, DB_INFO_JS)) } catch (e) { row.db = { error: e.message.slice(0, 200) } } }
  rows.push(row)
}
rows.sort((a, b) => a.project.localeCompare(b.project) || a.environment.localeCompare(b.environment))

const report = { at: new Date().toISOString(), newestTag: newest, newestDigest: latestDigest, sites: rows }
const dir = join(process.cwd(), 'output', 'instatic-release')
mkdirSync(dir, { recursive: true })
const file = join(dir, `${stamp()}-inventory.json`)
writeJson(file, report)

if (has('json')) { console.log(JSON.stringify(report, null, 1)); process.exit(0) }
console.log(`newest release on ghcr: ${newest} (${latestDigest?.slice(0, 19)})\n`)
const pad = (s, n) => String(s ?? '').padEnd(n).slice(0, n)
console.log(pad('project', 30), pad('env', 11), pad('role', 10), pad('version', 8), pad('digest', 14), pad('volume', 16), 'hosts / flags')
for (const r of rows) {
  const vol = r.volume ? `${r.volume.usedMB}/${r.volume.sizeMB}MB` : 'NONE'
  console.log(pad(r.project, 30), pad(r.environment, 11), pad(r.role, 10), pad(r.version, 8), pad((r.digest ?? '').slice(7, 19), 14), pad(vol, 16),
    r.hosts.join(' '), r.flags.length ? ' [' + r.flags.join(' ') + ']' : '')
  if (r.publicOrigin !== undefined) console.log(' '.repeat(62), 'PUBLIC_ORIGIN', r.publicOrigin)
  if (r.db) console.log(' '.repeat(62), 'db', JSON.stringify({ last: r.db.lastMigration, rows: r.db.counts?.data_rows, media: r.db.counts?.media_live, check: r.db.quickCheck, err: r.db.error }))
}
console.log(`\nwrote ${file}`)
