#!/usr/bin/env node
/**
 * Exercise the Embed Origins filter against the REAL published CSP string,
 * with a stub `api` standing in for the QuickJS host.
 *
 * The filter is pure string work, so it is fully testable off-platform; what
 * this cannot prove is that the host actually calls it, which is what
 * `verify-live.mjs` checks against the served page after install.
 */
import { activate } from './embed-origins/server/index.js'

// The policy encorercm.com serves today.
const LIVE_CSP =
  "default-src 'self'; frame-src 'none'; img-src 'self' data: https:; " +
  "media-src 'self' data: https:; script-src 'self' 'sha256-JjJVpPcuFN6Z7GOg4PkiVfiyklUS+vTDCbASsgWy7ik='; " +
  "style-src 'self' 'unsafe-inline'; worker-src 'self' blob:;"
const page = (csp) =>
  `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n` +
  `  <meta http-equiv="Content-Security-Policy" content="${csp}">\n` +
  `  <title>x</title>\n</head>\n<body>\n<p>hi</p>\n</body>\n</html>`

function run(settings, html = page(LIVE_CSP)) {
  let filter
  activate({
    plugin: { log: () => {} },
    cms: {
      settings: { get: (k) => settings[k] },
      hooks: { filter: (name, fn) => { if (name === 'publish.html') filter = fn } },
    },
  })
  return filter(html)
}
const cspOf = (html) =>
  (html.match(/content="([^"]*)"\s*\/?>/) || [])[1] ??
  html.match(/Content-Security-Policy"\s+content="([^"]*)"/)[1]

let pass = 0, fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n          ' + detail : ''}`) }
}

console.log('\nEmbed Origins — filter behaviour\n')

// 1. no settings -> byte-identical passthrough
const src = page(LIVE_CSP)
check('empty settings leave the page byte-identical',
  run({}, src) === src)
check('whitespace-only settings leave the page byte-identical',
  run({ frameOrigins: '\n  \n' }, src) === src)

// 2. frame-src 'none' is REPLACED, not appended to
const framed = cspOf(run({ frameOrigins: 'https://reputationhub.site' }))
check("frame-src 'none' is replaced, never appended to",
  /frame-src https:\/\/reputationhub\.site/.test(framed) && !/frame-src[^;]*'none'/.test(framed),
  framed)

// 3. every other directive survives untouched
const before = LIVE_CSP.split(';').map(s => s.trim()).filter(Boolean).filter(d => !d.startsWith('frame-src'))
const after = framed.split(';').map(s => s.trim()).filter(Boolean).filter(d => !d.startsWith('frame-src'))
check('all other directives are preserved verbatim',
  JSON.stringify(before) === JSON.stringify(after),
  `\n          before ${JSON.stringify(before)}\n          after  ${JSON.stringify(after)}`)

// 4. script-src keeps the importmap hash while gaining the origin
const scripted = cspOf(run({ scriptOrigins: 'https://link.msgsndr.com' }))
check('script-src keeps the importmap sha AND gains the origin',
  scripted.includes("'sha256-JjJVpPcuFN6Z7GOg4PkiVfiyklUS+vTDCbASsgWy7ik='") &&
  scripted.includes('https://link.msgsndr.com') && scripted.includes("'self'"),
  scripted)

// 5. multiple origins, several separators, dedupe, trailing slash
const many = cspOf(run({ frameOrigins: 'https://a.com/\nhttps://b.com , https://a.com' }))
check('multi-line / comma input dedupes and strips trailing slashes',
  /frame-src https:\/\/a\.com https:\/\/b\.com;/.test(many), many)

// 6. injection attempts are rejected, not escaped
const evil = cspOf(run({ frameOrigins: "https://ok.com\nhttps://x.com; default-src *\njavascript:alert(1)\n'unsafe-inline'\nnot a url" }))
// Assert on the TARGETED directive, not the whole policy: the live CSP already
// carries `style-src 'unsafe-inline'`, so a blanket substring check would fail
// on the host's own value and prove nothing.
const evilFrame = (evil.match(/frame-src ([^;]*)/) || [, ''])[1].trim()
check('a directive-injection payload is dropped, not escaped',
  evilFrame === 'https://ok.com' &&
  evil.split('default-src').length === 2 &&
  !evil.includes('javascript:'),
  `frame-src => "${evilFrame}"`)

// 7. absent directive is created (an absent frame-src falls back to default-src)
const noFrame = "default-src 'self'; script-src 'self';"
const created = cspOf(run({ frameOrigins: 'https://c.com' }, page(noFrame)))
check('an absent frame-src is created rather than left to default-src',
  /frame-src https:\/\/c\.com/.test(created), created)

// 8. re-running the filter is stable
const once = run({ frameOrigins: 'https://a.com' }, src)
const twice = run({ frameOrigins: 'https://a.com' }, once)
check('filter is idempotent', once === twice)

// 9. page body is never touched
check('the document body is untouched',
  run({ frameOrigins: 'https://a.com' }, src).includes('<p>hi</p>'))

// 10. no CSP meta -> unchanged, and no policy invented
const bare = '<!DOCTYPE html><html><head></head><body>x</body></html>'
check('a page with no CSP meta is returned unchanged',
  run({ frameOrigins: 'https://a.com' }, bare) === bare)

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
