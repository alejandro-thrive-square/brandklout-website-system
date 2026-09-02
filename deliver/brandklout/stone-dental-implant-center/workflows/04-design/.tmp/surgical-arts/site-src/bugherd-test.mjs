/**
 * Proves the BugHerd host gate BOTH ways, against the real built bundle.
 *
 * WHY THIS EXISTS. `js/90-bugherd.js` is the only thing in this build whose
 * correct behaviour is INVISIBLE everywhere you would normally look at it. On
 * a preview, on localhost and in `final-site/` opened off the filesystem it is
 * supposed to do nothing at all, so "I loaded the page and saw no sidebar"
 * proves nothing: it is the pass state and the total-failure state at once.
 * The only place it should act is a host this machine cannot serve.
 *
 * So the host is faked. Chrome resolves the review hostname to the local
 * server with `--host-resolver-rules`, and the suite asserts the tag appears
 * there and does NOT appear on the practice's real domain.
 *
 * IT HAS TO BE HTTPS, and that is not fastidiousness. `.app` is on the HSTS
 * preload list, so Chrome force-upgrades any http:// URL on
 * *.up.railway.app before it reaches the server. A plain-http harness fails to
 * navigate and reports "no BugHerd tag" for entirely the wrong reason, which is
 * exactly what the first run of this did. A throwaway self-signed cert and
 * `--ignore-certificate-errors` is the whole fix.
 *
 * Requires openssl on PATH (Git Bash ships it). Skips loudly without it rather
 * than passing.
 *
 * Usage:  node bugherd-test.mjs
 */
import puppeteer from 'puppeteer-core'
import https from 'node:https'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', 'final-site')
const PORT = 8819
const REVIEW = 'stone-surgical-arts-production.up.railway.app'
const REAL = 'www.stonesurgicalarts.com'
const PAGES = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort()

/* --- a throwaway cert ---------------------------------------------------- */
const TLS = path.join(os.tmpdir(), 'ssa-bugherd-tls')
fs.mkdirSync(TLS, { recursive: true })
const KEY = path.join(TLS, 'key.pem')
const CRT = path.join(TLS, 'cert.pem')
if (!fs.existsSync(KEY) || !fs.existsSync(CRT)) {
  try {
    execFileSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
      '-keyout', KEY, '-out', CRT, '-days', '7', '-subj', '/CN=ssa-test',
      '-addext', `subjectAltName=DNS:${REVIEW},DNS:${REAL}`,
    ], { stdio: 'ignore', env: { ...process.env, MSYS_NO_PATHCONV: '1' } })
  } catch (err) {
    console.error('SKIPPED: openssl is not on PATH, so the HTTPS harness cannot start.')
    console.error('This suite cannot be replaced by an http one; see the header.')
    process.exit(2)
  }
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }
const srv = https.createServer(
  { key: fs.readFileSync(KEY), cert: fs.readFileSync(CRT) },
  (q, s) => {
    let p = decodeURIComponent(q.url.split('?')[0])
    if (p === '/') p = '/index.html'
    const f = path.join(ROOT, p)
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end('nf') }
    s.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' })
    fs.createReadStream(f).pipe(s)
  },
)
await new Promise((r) => srv.listen(PORT, r))

let bad = 0
async function run(host, expect, label) {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--ignore-certificate-errors', `--host-resolver-rules=MAP ${host} 127.0.0.1`],
  })
  console.log(`\n${label}  host=${host}  expect ${expect} tag(s)`)
  for (const page of PAGES) {
    const pg = await b.newPage()
    const hits = []
    // The request is aborted rather than allowed out: this suite must not
    // depend on bugherd.com being reachable, and it must not register a page
    // view on the client's board every time somebody runs the gates.
    await pg.setRequestInterception(true)
    pg.on('request', (r) => {
      if (/bugherd\.com/.test(r.url())) { hits.push(r.url()); r.abort() } else r.continue()
    })
    await pg.goto(`https://${host}:${PORT}/${page}`, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 900))
    const tags = await pg.evaluate(() => document.querySelectorAll('script[src*="bugherd.com/sidebarv2.js"]').length)
    // BOTH halves are asserted: the tag in the DOM proves the module ran, and
    // the intercepted request proves the tag was live rather than inert.
    const ok = tags === expect && hits.length === expect
    if (!ok) bad++
    console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${page.padEnd(20)} tags=${tags} requests=${hits.length}`)
    await pg.close()
  }
  await b.close()
}

await run(REVIEW, 1, 'THE REVIEW HOST — the sidebar must load')
await run(REAL, 0, 'THE PRACTICE DOMAIN — nothing may leave the page')

console.log(bad ? `\n${bad} FAILED` : `\n${PAGES.length * 2}/${PAGES.length * 2} checks passed`)
srv.close()
process.exitCode = bad ? 1 : 0
