#!/usr/bin/env node
/**
 * assets.mjs — client media (gitignored) backed up to Cloudflare R2, tracked by a manifest in git.
 *
 * Git carries code, copy and runbooks; images, video, PDFs, fonts and zips are gitignored and used
 * to live only in the worktree that made them. This gives every such file a second home:
 *
 *   R2 object    clients/<client>/<path inside the client folder>
 *   manifest     deliver/brandklout/<client>/assets.tsv   (sha256, size, path — committed on main)
 *
 * Usage (from any checkout of the repo):
 *   node scripts/assets.mjs push   [--client <slug>] [--from <checkout>]... [--no-worktrees] [--dry]
 *   node scripts/assets.mjs pull   <client> [--to <checkout>] [--dry]
 *   node scripts/assets.mjs status [<client>]
 *
 * push reads every untracked file under deliver/brandklout/<client>/ in each source checkout
 * (every worktree of this repo, plus any --from checkout such as the old Webzite Agentic Workflow
 * repo, which still holds media the 2026-08-22 split left behind), skips what R2 already holds byte-identical (MD5 = ETag),
 * uploads the rest, and rewrites the client's manifest in THIS checkout. The same path in two
 * worktrees with different content: the newer file wins and the clash is printed.
 * pull downloads a client's manifest into a checkout and verifies each file's sha256.
 * Loose files at the root of deliver/brandklout/ are never read (they are not client media), and
 * neither is anything SENSITIVE matches: session cookies, keys, env files and recovered/ DB dumps
 * stay on the machine that made them.
 *
 * Credentials (process.env, then ~/.webzite/.env [shared], then the nearest .env):
 *   R2_TOKEN   a Cloudflare API token with R2 read/write (falls back to CLOUDFLARETESTING)
 *   R2_BUCKET  bucket name (default brandklout-assets-test)
 *   R2_ACCOUNT account id (optional; the token's first account otherwise)
 * One token is the S3 credential too: access key = the token's id, secret = sha256(token).
 *
 * Node 24 on Windows: redirect output to a file, never pipe it (libuv assertion on a piped stdout).
 */
import { execFileSync } from 'node:child_process'
import { createHash, createHmac } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const CLIENTS_REL = 'deliver/brandklout'
const MASTER = process.env.WEBZITE_ENV_MASTER || path.join(os.homedir(), '.webzite', '.env')
const SKIP_DIRS = /(^|\/)(node_modules|\.git|__pycache__|\.venv|\.pytest_cache)(\/|$)/
// Never leaves this machine: login cookies (.session-<host>, a scrape's cookies.json with a live
// PHPSESSID), keys, env files, and recovered/ (DB dumps with credentials and patient-adjacent PII).
const SENSITIVE = /(^|\/)(\.session[^/]*|cookies\.json|\.secrets|recovered|\.env[^/]*|id_rsa[^/]*|id_ed25519[^/]*|[^/]*\.pem|php_errorlog)(\/|$)/
const BIG = 64 * 1024 * 1024
const PARALLEL = 8

const argv = process.argv.slice(2)
const flag = (n) => argv.includes(n)
const opts = (n) => argv.flatMap((a, i) => (a === n && argv[i + 1] ? [argv[i + 1]] : []))
const positional = argv.filter((a, i) => !a.startsWith('--') && !['--client', '--from', '--to'].includes(argv[i - 1]))
const [cmd, clientArg] = positional
const DRY = flag('--dry')

// ---------- credentials ----------
function parseEnv (file, section) {
  const out = {}
  if (!file || !fs.existsSync(file)) return out
  let current = null
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const s = line.match(/^\s*\[([^\]]+)\]\s*$/)
    if (s) { current = s[1].trim(); continue }
    if (section && current !== section) continue
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return out
}
function creds () {
  const local = path.join(ROOT, '.env')
  const env = { ...parseEnv(fs.existsSync(local) ? local : null), ...parseEnv(MASTER, 'shared') }
  for (const k of ['R2_TOKEN', 'R2_BUCKET', 'R2_ACCOUNT', 'CLOUDFLARETESTING']) if (process.env[k]) env[k] = process.env[k]
  const token = env.R2_TOKEN || env.CLOUDFLARETESTING
  if (!token) throw new Error('no R2_TOKEN (or CLOUDFLARETESTING) in the environment or ~/.webzite/.env [shared]')
  return { token, bucket: env.R2_BUCKET || 'brandklout-assets-test', account: env.R2_ACCOUNT }
}

let S3 = null
async function s3 () {
  if (S3) return S3
  const { token, bucket, account: acct } = creds()
  const cf = async (p) => {
    const r = await fetch(`https://api.cloudflare.com/client/v4${p}`, { headers: { Authorization: `Bearer ${token}` } })
    const j = await r.json()
    if (!j.success) throw new Error(`Cloudflare ${p}: ${JSON.stringify(j.errors)}`)
    return j.result
  }
  const account = acct || (await cf('/accounts'))[0].id
  const { id } = await cf(`/accounts/${account}/tokens/verify`) // account-owned token: /user/tokens/verify says Invalid
  S3 = { bucket, host: `${account}.r2.cloudflarestorage.com`, keyId: id, secret: createHash('sha256').update(token).digest('hex') }
  return S3
}

// ---------- SigV4 ----------
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
const encKey = (k) => k.split('/').map(enc).join('/')
const hmac = (k, s) => createHmac('sha256', k).update(s).digest()
async function signed (method, key, { query = {}, headers = {}, body } = {}) {
  const c = await s3()
  const now = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const day = now.slice(0, 8)
  const uri = `/${c.bucket}${key ? '/' + encKey(key) : ''}`
  const qs = Object.keys(query).sort().map((k) => `${enc(k)}=${enc(query[k])}`).join('&')
  const h = { host: c.host, 'x-amz-date': now, 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD', ...headers }
  const names = Object.keys(h).map((n) => n.toLowerCase()).sort()
  const lower = Object.fromEntries(Object.entries(h).map(([k, v]) => [k.toLowerCase(), String(v).trim()]))
  const canon = [method, uri, qs, names.map((n) => `${n}:${lower[n]}\n`).join(''), names.join(';'), 'UNSIGNED-PAYLOAD'].join('\n')
  const scope = `${day}/auto/s3/aws4_request`
  const sts = ['AWS4-HMAC-SHA256', now, scope, createHash('sha256').update(canon).digest('hex')].join('\n')
  const kSig = hmac(hmac(hmac(hmac('AWS4' + c.secret, day), 'auto'), 's3'), 'aws4_request')
  const sig = createHmac('sha256', kSig).update(sts).digest('hex')
  const auth = `AWS4-HMAC-SHA256 Credential=${c.keyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${sig}`
  const { host, ...send } = lower
  void host
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(`https://${c.host}${uri}${qs ? '?' + qs : ''}`, { method, headers: { ...send, authorization: auth }, body })
      if ((r.status === 429 || r.status >= 500) && attempt < 6) { await r.arrayBuffer(); throw new Error(`HTTP ${r.status}`) }
      return r
    } catch (e) {
      if (attempt >= 6) throw e
      await new Promise((res) => setTimeout(res, 1000 * 2 ** attempt))
    }
  }
}

async function listRemote (prefix) {
  const out = new Map()
  let token
  do {
    const query = { 'list-type': '2', prefix, 'max-keys': '1000', ...(token ? { 'continuation-token': token } : {}) }
    const r = await signed('GET', '', { query })
    const xml = await r.text()
    if (!r.ok) throw new Error(`list ${prefix}: HTTP ${r.status} ${xml.slice(0, 200)}`)
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const g = (t) => (m[1].match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)) || [])[1]
      const key = g('Key').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      out.set(key, { size: Number(g('Size')), etag: g('ETag').replace(/&quot;|"/g, '') })
    }
    token = (xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/) || [])[1]
  } while (token)
  return out
}

// ---------- local files ----------
function worktrees () {
  const out = execFileSync('git', ['worktree', 'list', '--porcelain'], { encoding: 'utf8' })
  return out.split(/\r?\n/).filter((l) => l.startsWith('worktree ')).map((l) => l.slice(9))
}
/** Untracked (incl. ignored) files under client folders of one checkout: [{client, rel, abs}] */
function untracked (checkout, only) {
  const raw = execFileSync('git', ['-c', 'core.quotepath=false', 'ls-files', '-z', '-o', '--', CLIENTS_REL], { cwd: checkout, encoding: 'utf8', maxBuffer: 1 << 30 })
  return raw.split('\0').filter(Boolean).flatMap((p) => {
    const parts = p.split('/')
    if (parts.length < 4 || SKIP_DIRS.test(p) || SENSITIVE.test(p)) return [] // deliver/brandklout/<client>/<file…>
    const client = parts[2]
    if (only && client !== only) return []
    const rel = parts.slice(3).join('/')
    if (rel === 'assets.tsv') return []
    // The process mirror (scenario.mjs) is untracked but is main's code, not client media.
    if (/^(tools\/|\.process-mirror\.json$|scenario-[^/]+\/(?![^/]+\/output\/))/.test(rel)) return []
    return [{ client, rel, abs: path.join(checkout, p) }]
  })
}
function hashFile (abs) {
  return new Promise((resolve, reject) => {
    const sha = createHash('sha256'), md5 = createHash('md5')
    fs.createReadStream(abs).on('data', (b) => { sha.update(b); md5.update(b) }).on('error', reject)
      .on('end', () => resolve({ sha256: sha.digest('hex'), md5: md5.digest('hex') }))
  })
}
const manifestPath = (checkout, client) => path.join(checkout, CLIENTS_REL, client, 'assets.tsv')
function readManifest (checkout, client) {
  const f = manifestPath(checkout, client)
  const m = new Map()
  if (!fs.existsSync(f)) return m
  // CRLF too: with core.autocrlf a manifest that arrives by merge or checkout is CRLF on disk, and a
  // trailing \r on every path made status report 0 in R2 and pull write to the wrong names.
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const [sha256, size, ...rest] = line.split('\t')
    m.set(rest.join('\t'), { sha256, size: Number(size) })
  }
  return m
}
function writeManifest (checkout, client, m) {
  const lines = [...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([p, e]) => `${e.sha256}\t${e.size}\t${p}`)
  const head = `# ${client} media in R2 at clients/${client}/<path>. Restore: node scripts/assets.mjs pull ${client}\n# sha256\tsize\tpath\n`
  fs.mkdirSync(path.dirname(manifestPath(checkout, client)), { recursive: true })
  fs.writeFileSync(manifestPath(checkout, client), head + lines.join('\n') + '\n')
}

async function pool (items, fn, n = PARALLEL) {
  let i = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]) }))
}
let bigLock = Promise.resolve()
const withBig = (size, fn) => {
  if (size <= BIG) return fn()
  const run = bigLock.then(fn, fn)
  bigLock = run.catch(() => {})
  return run
}
const mb = (n) => (n / 1048576).toFixed(1) + ' MB'

// ---------- commands ----------
async function push () {
  const sources = [...(flag('--no-worktrees') ? [] : worktrees()), ...opts('--from').map((p) => path.resolve(p))]
  const only = opts('--client')[0]
  const pick = new Map() // client/rel -> file
  const clashes = []
  for (const src of sources) {
    for (const f of untracked(src, only)) {
      f.mtime = fs.statSync(f.abs).mtimeMs
      f.size = fs.statSync(f.abs).size
      const k = `${f.client}/${f.rel}`, prev = pick.get(k)
      if (!prev) { pick.set(k, f); continue }
      if (prev.size === f.size) continue // same path, same size: treat as the same file
      clashes.push(`${k}: ${prev.abs} vs ${f.abs}`)
      if (f.mtime > prev.mtime) pick.set(k, f)
    }
  }
  const files = [...pick.values()]
  const byClient = Object.groupBy(files, (f) => f.client)
  console.log(`${files.length} file(s), ${mb(files.reduce((s, f) => s + f.size, 0))}, ${Object.keys(byClient).length} client(s) from ${sources.length} checkout(s)`)
  if (clashes.length) console.log(`  ${clashes.length} clash(es), newer kept:\n    ` + clashes.slice(0, 5).join('\n    ') + (clashes.length > 5 ? '\n    …' : ''))
  for (const [client, list] of Object.entries(byClient).sort()) {
    const remote = DRY ? new Map() : await listRemote(`clients/${client}/`)
    const manifest = readManifest(ROOT, client)
    let up = 0, skip = 0, fail = 0, bytes = 0
    const t0 = Date.now()
    await pool(list, async (f) => {
      try {
        const { sha256, md5 } = await hashFile(f.abs)
        const key = `clients/${client}/${f.rel}`
        const r = remote.get(key)
        if (!(r && r.etag === md5 && r.size === f.size)) {
          if (!DRY) {
            await withBig(f.size, async () => {
              const res = await signed('PUT', key, { headers: { 'x-amz-meta-sha256': sha256, 'content-length': String(f.size) }, body: fs.readFileSync(f.abs) })
              if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`)
              await res.arrayBuffer().catch(() => {})
            })
          }
          up++; bytes += f.size
        } else skip++
        manifest.set(f.rel, { sha256, size: f.size })
      } catch (e) { fail++; console.log(`  FAILED ${client}/${f.rel}: ${e.message}`) }
    })
    if (!DRY) writeManifest(ROOT, client, manifest)
    console.log(`${client}: ${up} uploaded (${mb(bytes)}), ${skip} already in R2, ${fail} failed, ${((Date.now() - t0) / 1000).toFixed(0)} s${DRY ? ' [dry]' : ''}`)
    if (fail) process.exitCode = 1
  }
}

async function pull () {
  if (!clientArg) throw new Error('usage: pull <client> [--to <checkout>]')
  const to = path.resolve(opts('--to')[0] || ROOT)
  const manifest = readManifest(ROOT, clientArg)
  if (!manifest.size) throw new Error(`no manifest at ${path.relative(ROOT, manifestPath(ROOT, clientArg))}`)
  let got = 0, have = 0, fail = 0
  await pool([...manifest.entries()], async ([rel, e]) => {
    const abs = path.join(to, CLIENTS_REL, clientArg, rel)
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).size === e.size && (await hashFile(abs)).sha256 === e.sha256) { have++; return }
      if (DRY) { got++; return }
      const res = await signed('GET', `clients/${clientArg}/${rel}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (createHash('sha256').update(buf).digest('hex') !== e.sha256) throw new Error('sha256 mismatch')
      fs.mkdirSync(path.dirname(abs), { recursive: true })
      fs.writeFileSync(abs, buf)
      got++
    } catch (err) { fail++; console.log(`  FAILED ${rel}: ${err.message}`) }
  })
  console.log(`${clientArg}: ${got} downloaded, ${have} already present, ${fail} failed${DRY ? ' [dry]' : ''}`)
  if (fail) process.exitCode = 1
}

async function status () {
  const dir = path.join(ROOT, CLIENTS_REL)
  const clients = clientArg ? [clientArg] : fs.readdirSync(dir).filter((d) => fs.existsSync(manifestPath(ROOT, d)))
  for (const client of clients) {
    const m = readManifest(ROOT, client)
    const remote = await listRemote(`clients/${client}/`)
    const missingRemote = [...m.entries()].filter(([rel, e]) => remote.get(`clients/${client}/${rel}`)?.size !== e.size)
    const local = [...m.keys()].filter((rel) => fs.existsSync(path.join(dir, client, rel))).length
    const total = [...m.values()].reduce((s, e) => s + e.size, 0)
    console.log(`${client}: ${m.size} in manifest (${mb(total)}), ${m.size - missingRemote.length} in R2, ${local} present here`)
    for (const [rel] of missingRemote.slice(0, 10)) console.log(`  not in R2: ${rel}`)
    if (missingRemote.length) process.exitCode = 1
  }
}

const run = { push, pull, status }[cmd]
if (!run) { console.log('usage: node scripts/assets.mjs push|pull|status (see the header)'); process.exit(2) }
run().catch((e) => { console.error(e.message); process.exit(1) })
