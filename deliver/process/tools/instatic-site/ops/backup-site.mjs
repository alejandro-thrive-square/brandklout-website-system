#!/usr/bin/env node
/**
 * backup-site.mjs — API snapshot of a live Instatic site before any risky write
 * (push-site --apply --force, a clone, a wipe, a BugHerd round on production).
 *
 * Origin: bk-west-la-implants, workflows/21-instatic-upload/.tmp/backup-live.mjs (itself copied from
 * the Brandklout website worktree), with Mason Park Kids' backup-site.mjs as the lighter variant.
 * Generalized 2026-09-23.
 *
 * Writes <out>/site.json (shell: styles, assets, settings, seq), pages.json (every row as the API
 * returns it), html/<slug>.html (each route's published HTML) and summary.json.
 *
 * This is ONE of three backups. Before a --force push also make:
 *   1. a git tag of the source, and
 *   2. a DB copy (admin edits live only in the DB; `cp cms.db` misses the WAL). Print the command:
 *        node backup-site.mjs --db-command [--label pre-push]
 *      and run it from a directory linked to the Railway project BY ID.
 * Compare summary.seq with your last publish: equal means nobody edited in the admin since. Check it
 * again right before the push.
 *
 * Usage: node backup-site.mjs [--out .tmp/backups/<name>]
 * Env: INSTATIC_BASE_URL (+ login).
 */
import fs from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const arg = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined }
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')

if (argv.includes('--db-command')) {
  const label = arg('label') || 'backup'
  const file = `/app/storage/backups/cms-${stamp}-${label}.db`
  const js = `const {Database}=require('bun:sqlite');new Database('/app/storage/data/cms.db').run("VACUUM INTO '${file}'")`
  console.log('# run from a directory linked to the Railway project by ID (railway link -p <id> -e <env>):')
  console.log(`MSYS_NO_PATHCONV=1 railway ssh "mkdir -p /app/storage/backups && cd /app && bun -e \\"${js.replace(/"/g, '\\\\\\"')}\\" && ls -la /app/storage/backups"`)
  console.log('# /app/storage is the volume, so the copy survives redeploys.')
  console.log('# restore: stop the service, copy the backup over cms.db, delete cms.db-wal and cms.db-shm, start.')
  process.exit(0)
}

const { getSite, getPages, BASE } = await import('../lib/site.mjs')
const OUT = path.resolve(arg('out') || path.join('.tmp', 'backups', `backup-${new URL(BASE).host}-${stamp}`))
fs.mkdirSync(path.join(OUT, 'html'), { recursive: true })

const site = await getSite()
fs.writeFileSync(path.join(OUT, 'site.json'), JSON.stringify(site, null, 1))
const pages = await getPages()
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages, null, 1))
const rows = Array.isArray(pages) ? pages : pages.rows ?? pages.pages ?? []

let n = 0
const failed = []
for (const r of rows) {
  if (r.cells?.templateEnabled) continue // templates are never served at their own slug
  const slug = r.cells?.slug ?? r.slug
  const route = !slug || slug === 'index' ? '/' : '/' + slug
  const res = await fetch(BASE + route, { headers: { 'user-agent': 'Mozilla/5.0' } })
  if (!res.ok) { failed.push(`${route} ${res.status}`); continue }
  const file = path.join(OUT, 'html', (route === '/' ? 'index' : slug) + '.html')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, await res.text())
  n++
}
const summary = { base: BASE, at: new Date().toISOString(), seq: site.seq ?? site.site?.seq, pageRows: rows.length, htmlSaved: n, notServed: failed }
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 1))
console.log(JSON.stringify(summary))
console.log(`wrote ${OUT}`)
