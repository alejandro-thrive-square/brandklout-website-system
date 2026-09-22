#!/usr/bin/env node
/**
 * install-seo-plugins.mjs — put `brandklout.open-graph` and
 * `brandklout.aeo-schema` on a Brandklout Instatic instance.
 *
 *   node install-seo-plugins.mjs --to https://brandklout.ai
 *   node install-seo-plugins.mjs --to https://staging.brandklout.ai
 *
 * WHY THIS EXISTS
 * ---------------
 * Instatic has no SEO controls of its own: a page cell is `title`, `slug` and
 * `body`, and `canonical`, `og:*` and JSON-LD come from these two plugins.
 * Brandklout's instance was provisioned with only `embed-origins`, so until
 * 2026-09-22 the agency's own site emitted no canonical, no share tags and no
 * structured data at all.
 *
 * The plugin SOURCE is vendored beside this script from
 * `bk-dr-nahlah/.../16-instatic-plugins/`, for the same reason module 21
 * vendors `pack-plugin.mjs`: one client's worktree cannot read another's, and
 * this worktree is sparse. Re-vendor with `git show bk-dr-nahlah:<path>` if the
 * upstream package changes; the bytes here are v1.1.2 / v1.2.0 verbatim.
 *
 * PERMISSIONS — this grants the manifest's full list (six each), not
 * embed-origins' three. `16-instatic-plugins/install-plugin.mjs` refuses that
 * by design, because it is the script a human uses to approve a NEW plugin.
 * These two are first-party packages already granted the same six on Dr Nahlah,
 * Mason Park and IFA, so the approval is the house one, made once, here.
 *
 * Install is step-up gated, and step-up ROTATES the session cookie — use the
 * rotated one or every later call 401s.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1] }
const TO = flag('to')
if (!TO) { console.error('usage: node install-seo-plugins.mjs --to <url>'); process.exit(2) }

// repo-root .env, same loader shape as module 21's lib.mjs
let dir = HERE
for (let i = 0; i < 10 && !existsSync(join(dir, '.env')); i++) dir = dirname(dir)
for (const line of readFileSync(join(dir, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const EMAIL = process.env.INSTATIC_EMAIL, PASSWORD = process.env.INSTATIC_PASSWORD

async function session(base) {
  const r = await fetch(base + '/admin/api/cms/login', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!r.ok) throw new Error(`login ${r.status}`)
  let cookie = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ')
  const su = await fetch(base + '/admin/api/cms/auth/step-up', {
    method: 'POST', headers: { 'content-type': 'application/json', cookie, origin: base },
    body: JSON.stringify({ password: PASSWORD }),
  })
  if (!su.ok) throw new Error(`step-up ${su.status}`)
  const rot = (su.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0])
  if (rot.length) cookie = rot.join('; ')          // step-up rotates the cookie
  return cookie
}

const cookie = await session(TO)
let ok = 0
for (const name of ['open-graph', 'aeo-schema']) {
  const src = join(HERE, name)
  const manifest = JSON.parse(readFileSync(join(src, 'plugin.json'), 'utf8'))
  const zip = join(HERE, '.tmp', `${manifest.id}.zip`)
  execFileSync(process.execPath, [join(HERE, 'pack-plugin.mjs'), src, zip], { stdio: 'pipe' })

  const form = new FormData()
  form.append('file', new Blob([readFileSync(zip)], { type: 'application/zip' }), `${manifest.id}.zip`)
  form.append('grantedPermissions', JSON.stringify(manifest.permissions))

  const r = await fetch(TO + '/admin/api/cms/plugins/package', {
    method: 'POST', headers: { cookie, origin: TO }, body: form,
  })
  const out = await r.text()
  console.log(`${manifest.id.padEnd(24)} v${manifest.version}  ${r.status} ${r.ok ? 'OK' : out.slice(0, 220)}`)
  if (r.ok) ok++
}
console.log(`\ninstalled ${ok} of 2 on ${TO}`)
console.log('Settings are a SEPARATE record — run configure-seo-plugins.mjs next, then publish.')
