#!/usr/bin/env node
/**
 * Malware and injected-script gate for a mirrored or recovered old site. Run it on EVERY mirror
 * before anyone opens it in a browser, deploys it, or copies content out of it.
 *
 * Origin: bk-mason-park-kids workflows/01-site-recovery/.tmp/verify-safe.mjs (2026-08-27, decoded-blob
 * check added 2026-09-15 after a ClearFake loader passed it and went live for an hour). Generalized
 * 2026-09-23: directory, old hosts and extra markers are arguments; strict and report modes.
 *
 *   node scan-mirror.mjs <mirror-dir> --host old.com                 # report: what is in there
 *   node scan-mirror.mjs <mirror-dir> --host old.com --strict        # gate for a deployable mirror
 *   node scan-mirror.mjs <mirror-dir> --host old.com --ioc evil.sbs,0xabc...   # extra markers
 *
 * Checks:
 *   1. no executable files (.php .phtml .sh .cgi .exe ...) and no unexpected archives
 *   2. no known injection markers (ClearFake/EtherHiding set from Mason Park Kids and Mason Park),
 *      INCLUDING inside base64 blobs decoded through the shift+XOR families these loaders use
 *   3. no obfuscated inline loader: atob + fromCharCode + new Function/eval in one inline script
 *   4. (strict) no external <script src> or <iframe src>; no absolute URLs to the old host
 *   5. the directory is not tracked by git (a DB dump or WXR carries credentials and PII)
 * Report mode always lists every external script host found: that list is also the raw input of
 * the tracking inventory.
 *
 * The only valid check of a LIVE WordPress site is an anonymous visit from a fresh browser with no
 * cookies: the Mason Park plugin hid from admins, showed once per 90 days, and switched off when
 * devtools opened, and a free online scanner called the site healthy. This script checks files.
 *
 * Writes scan-mirror-report.json next to the scanned directory, or to --report <file>
 * (tools/cloudflare-launch/pages-mirror.mjs requires a passing strict report before it deploys).
 * Exit code 1 on any failure.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const DIR = process.argv[2] && !process.argv[2].startsWith('--') ? path.resolve(process.argv[2]) : null
if (!DIR || !fs.existsSync(DIR)) { console.error('usage: node scan-mirror.mjs <dir> [--host old.com,www.old.com] [--strict] [--ioc a,b]'); process.exit(2) }
const val = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : '' }
const STRICT = process.argv.includes('--strict')
const HOSTS = val('host').split(',').map((s) => s.trim().replace(/^www\./, '')).filter(Boolean)

const EXECUTABLE = /\.(php\d?|phtml|phar|sh|bash|cgi|pl|py|exe|dll|so|jsp|aspx?|htaccess)$/i
const ARCHIVE = /\.(zip|rar|7z|wpress|tar|tgz|gz)$/i
const IOC = [
  'yourbodybydesign', 'webanalytics-cdn.sbs', 'data-sm="1"', '2147483647', 'eth_call',
  '0x08207B087F61d7e95E441E15fd6d40BEfd6eD308', 'bsc-dataseed', 'binance.org', 'polygon-rpc',
  'advanced-content-toolkit', 'transient-cleanup', 'wp-file-manager', 'verify you are human',
  ...val('ioc').split(',').map((s) => s.trim()).filter(Boolean),
]
const WEAK = new Set(['data-sm="1"', '2147483647', 'eth_call', 'verify you are human', 'polygon-rpc'])
const RE_INLINE = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
const RE_B64 = /atob\(\s*["']([A-Za-z0-9+/=]{200,})["']\s*\)/g
const RE_SCRIPT_SRC = /<script\b[^>]*\bsrc\s*=\s*["']((?:https?:)?\/\/[^"']+)["']/gi
const RE_IFRAME_SRC = /<iframe\b[^>]*\bsrc\s*=\s*["']((?:https?:)?\/\/[^"']+)["']/gi
const RE_ABS = HOSTS.length ? new RegExp(`(?:https?:)?//(?:www\\.)?(?:${HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|')})`, 'i') : null

const isLoader = (js) => /atob\(/.test(js) && /fromCharCode/.test(js) && /new\s+Function\s*\(|\beval\s*\(/.test(js)
/* Brute-force the single-byte shift+XOR families, cheap on a 4 KB prefix, and look for markers. */
const decodedIoc = (b64) => {
  const raw = Buffer.from(b64, 'base64')
  const probe = raw.subarray(0, 4096)
  for (let add = 0; add < 256; add++) for (let x = 0; x < 256; x++) {
    let s = ''
    for (const c of probe) s += String.fromCharCode(((c - add + 256) & 255) ^ x)
    if (!s.includes('function') && !s.includes('var ')) continue
    let full = ''
    for (const c of raw) full += String.fromCharCode(((c - add + 256) & 255) ^ x)
    const hit = IOC.find((m) => full.includes(m))
    if (hit) return hit
  }
  return null
}
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') walk(p, out) } else out.push(p)
  }
  return out
}

const checks = []
const result = (name, ok, detail) => checks.push({ name, ok, detail })
const all = walk(DIR)
const rel = (f) => path.relative(DIR, f).replace(/\\/g, '/')

const exe = all.filter((f) => EXECUTABLE.test(f))
result('no executable files', !exe.length, exe.length ? `${exe.length}: ${exe.slice(0, 5).map(rel).join(', ')}` : `${all.length} files scanned`)
const arch = all.filter((f) => ARCHIVE.test(f))
result('no archives', !arch.length, arch.slice(0, 5).map(rel).join(', ') || 'none')

const text = all.filter((f) => /\.(html?|js|php|txt|json|css)$/i.test(f))
const iocHits = [], loaderHits = [], scriptHits = [], iframeHits = [], absHits = []
const extHosts = new Map()
for (const f of text) {
  const s = fs.readFileSync(f, 'utf8')
  const r = rel(f)
  /* Generic markers (2147483647, eth_call, data-sm) also occur in honest JS bundles: HTML only. */
  const plain = (/\.html?$/i.test(f) ? IOC : IOC.filter((m) => !WEAK.has(m))).find((m) => s.includes(m))
  if (plain) iocHits.push(`${r} (${plain})`)
  if (/\.html?$/i.test(f)) {
    for (const [, js] of s.matchAll(RE_INLINE)) if (isLoader(js)) { loaderHits.push(r); break }
    for (const [, b64] of s.matchAll(RE_B64)) { const hit = decodedIoc(b64); if (hit) { iocHits.push(`${r} (decoded: ${hit})`); break } }
    for (const [, src] of s.matchAll(RE_SCRIPT_SRC)) { scriptHits.push(r); const h = new URL(src.startsWith('//') ? 'https:' + src : src).hostname; extHosts.set(h, (extHosts.get(h) || 0) + 1) }
    for (const [, src] of s.matchAll(RE_IFRAME_SRC)) { iframeHits.push(r); const h = new URL(src.startsWith('//') ? 'https:' + src : src).hostname; extHosts.set(`iframe:${h}`, (extHosts.get(`iframe:${h}`) || 0) + 1) }
    if (RE_ABS && RE_ABS.test(s)) absHits.push(r)
  }
}
result('no injection markers (decoded blobs included)', !iocHits.length, iocHits.slice(0, 8).join(', ') || `${text.length} text files`)
result('no obfuscated inline loader', !loaderHits.length, loaderHits.length ? `${loaderHits.length} pages: ${loaderHits.slice(0, 5).join(', ')}` : 'none')
if (STRICT) {
  result('no external <script>', !scriptHits.length, [...new Set(scriptHits)].slice(0, 5).join(', ') || 'none')
  result('no external <iframe>', !iframeHits.length, [...new Set(iframeHits)].slice(0, 5).join(', ') || 'none')
  if (RE_ABS) result('no absolute URLs to the old host', !absHits.length, absHits.slice(0, 5).join(', ') || 'none')
}

let tracked = ''
try { tracked = execFileSync('git', ['ls-files', '--', '.'], { cwd: DIR, encoding: 'utf8' }).trim() } catch {}
result('not tracked by git', !tracked, tracked ? tracked.split('\n').slice(0, 5).join(', ') : 'untracked')

console.log(`\nMirror scan: ${DIR} (${STRICT ? 'strict' : 'report'})\n`)
let bad = 0
for (const c of checks) { if (!c.ok) bad++; console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(44)} ${c.detail}`) }
if (extHosts.size) {
  console.log('\n  external script and iframe hosts (feed these into the tracking inventory):')
  for (const [h, n] of [...extHosts].sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(4)}  ${h}`)
}
fs.writeFileSync(val('report') || path.join(path.dirname(DIR), 'scan-mirror-report.json'), JSON.stringify({ scannedAt: new Date().toISOString(), dir: DIR, strict: STRICT, ok: bad === 0, checks, externalHosts: Object.fromEntries(extHosts) }, null, 2))
console.log(bad ? `\n${bad} CHECK(S) FAILED: do not open, deploy or distribute this mirror` : '\nAll checks passed.')
process.exit(bad ? 1 : 0)
