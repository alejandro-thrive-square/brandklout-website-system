#!/usr/bin/env node
/**
 * Exercise the Embed Origins filter against the REAL published CSP string,
 * with a stub `api` standing in for the QuickJS host.
 *
 * The filter is pure string work, so it is fully testable off-platform; what
 * this cannot prove is that the host actually calls it, which is what
 * `verify-live.mjs` checks against the served page after install.
 */
import { createHash } from 'node:crypto'
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

// 7. absent directive is created — and inherits, rather than silently revoking
// what default-src was granting. It reads `frame-src 'self' https://c.com`: the
// origin is added, and same-origin framing keeps working because default-src
// allowed it before this directive existed.
const noFrame = "default-src 'self'; script-src 'self';"
const created = cspOf(run({ frameOrigins: 'https://c.com' }, page(noFrame)))
check('an absent frame-src is created rather than left to default-src',
  /frame-src[^;]*https:\/\/c\.com/.test(created) && /frame-src[^;]*'self'/.test(created),
  created)

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


// ---------------------------------------------------------------------------
// autoTrust — the policy derived from the page itself (v1.2.0).
//
// This is the half that makes a pasted embed behave the way it does on Webflow.
// Every assertion here is about what the page CONTAINS, so the runs below pass
// empty settings: nobody typed anything.
// ---------------------------------------------------------------------------

const sha = (body) => "'sha256-" + createHash('sha256').update(body, 'utf8').digest('base64') + "'"

const pageWith = (bodyHtml, csp = LIVE_CSP, head = '') =>
  '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n' +
  '  <meta http-equiv="Content-Security-Policy" content="' + csp + '">\n' + head +
  '  <title>x</title>\n</head>\n<body>\n' + bodyHtml + '\n</body>\n</html>'

console.log('\nEmbed Origins — autoTrust, derived from the page\n')

// 1. An inline script is trusted by HASH, never by 'unsafe-inline'.
const inline = 'window.__vendor = 1;\n  init({ id: "abc" });'
const inlineCsp = cspOf(run({}, pageWith('<div class="wz-embed"><script>' + inline + '</script></div>')))
check('an inline script is hashed into script-src', inlineCsp.includes(sha(inline)), inlineCsp)
check('the hash has the shape a browser will check', /'sha256-[A-Za-z0-9+/]{43}='/.test(inlineCsp), inlineCsp)
check("'unsafe-inline' is never introduced", !/script-src[^;]*'unsafe-inline'/.test(inlineCsp), inlineCsp)
check("the host's own importmap hash survives",
  inlineCsp.includes("'sha256-JjJVpPcuFN6Z7GOg4PkiVfiyklUS+vTDCbASsgWy7ik='"), inlineCsp)

// 2. Byte-for-byte identity where there is nothing to trust.
const plain = pageWith('<p>hi</p>')
check('a page with no embed is byte-identical', run({}, plain) === plain)
const dataOnly = pageWith('<script type="application/ld+json">{"@type":"Dentist"}</script>')
check('ld+json is data, not script — not hashed, page unchanged', run({}, dataOnly) === dataOnly)

// 3. External scripts and frames are read off the page.
const vendor =
  '<div class="wz-embed"><iframe src="https://api.leadconnectorhq.com/widget/form/x"></iframe>' +
  '<script src="https://link.msgsndr.com/js/form_embed.js"></script></div>'
const vendorCsp = cspOf(run({}, pageWith(vendor)))
check('an embedded frame origin reaches frame-src',
  /frame-src[^;]*https:\/\/api\.leadconnectorhq\.com/.test(vendorCsp), vendorCsp)
check('an embedded script origin reaches script-src',
  /script-src[^;]*https:\/\/link\.msgsndr\.com/.test(vendorCsp), vendorCsp)
check('a script origin also gets connect-src, style-src and font-src',
  /connect-src[^;]*https:\/\/link\.msgsndr\.com/.test(vendorCsp) &&
  /style-src[^;]*https:\/\/link\.msgsndr\.com/.test(vendorCsp) &&
  /font-src[^;]*https:\/\/link\.msgsndr\.com/.test(vendorCsp), vendorCsp)
check('a FRAME origin gets none of those — it cannot reach into this document',
  !/connect-src[^;]*leadconnectorhq/.test(vendorCsp) &&
  !/style-src[^;]*leadconnectorhq/.test(vendorCsp), vendorCsp)
check("frame-src 'none' is still replaced rather than appended to",
  !/frame-src[^;]*'none'/.test(vendorCsp), vendorCsp)

// 4. Same-origin and relative URLs are already covered by 'self'.
const sameCsp = cspOf(run({}, pageWith(
  '<iframe src="/local/thing"></iframe><script src="/_instatic/assets/app.js"></script>' +
  '<iframe src="https://encorercm.com/other"></iframe>',
  LIVE_CSP,
  '  <link rel="canonical" href="https://encorercm.com/veneers">\n')))
check('relative URLs add nothing', !/frame-src[^;]*local/.test(sameCsp), sameCsp)
check("the page's own origin is skipped, read from the canonical link",
  !sameCsp.includes('https://encorercm.com'), sameCsp)

// 5. Protocol-relative resolves to https, and duplicates collapse.
const dupCsp = cspOf(run({}, pageWith(
  '<script src="//cdn.example.com/a.js"></script><script src="https://cdn.example.com/b.js"></script>')))
/* Dedupe is PER DIRECTIVE: one origin legitimately appears in script-src,
   style-src, connect-src and font-src, so counting it across the whole policy
   measures nothing. Count inside script-src, where both tags landed. */
const dupScriptSrc = (dupCsp.match(/script-src[^;]*/) || [''])[0]
check('protocol-relative is read as https, and the two tags collapse to one source',
  (dupScriptSrc.match(/https:\/\/cdn\.example\.com/g) || []).length === 1, dupScriptSrc)

// 6. The toggle really is a toggle — off is v1.1.0 behaviour exactly.
const offPage = pageWith(vendor)
check('autoTrust off leaves a page full of embeds byte-identical',
  run({ autoTrust: false }, offPage) === offPage)
check('autoTrust off still honours the typed boxes',
  /frame-src[^;]*https:\/\/reputationhub\.site/.test(
    cspOf(run({ autoTrust: false, frameOrigins: 'https://reputationhub.site' }, offPage))))

// 7. Two pages, two policies — a grant does not leak sideways.
const cspA = cspOf(run({}, pageWith('<script src="https://a.example/x.js"></script>')))
const cspB = cspOf(run({}, pageWith('<script src="https://b.example/y.js"></script>')))
check('a widget on one page does not widen another page',
  cspA.includes('https://a.example') && !cspA.includes('https://b.example') &&
  cspB.includes('https://b.example') && !cspB.includes('https://a.example'))

// 8. Idempotence: republishing the same page must not restack sources.
const derivedOnce = run({}, pageWith(vendor))
check('running the filter twice changes nothing the second time',
  run({}, derivedOnce) === derivedOnce)

// 9. A pasted URL cannot forge a directive.
const nastyCsp = cspOf(run({}, pageWith('<iframe src="https://x.com; default-src *"></iframe>')))
check('a pasted URL cannot inject a directive', !/default-src \*/.test(nastyCsp), nastyCsp)


// ---------------------------------------------------------------------------
// A created directive must not revoke what default-src was granting.
//
// Found by the live gate, not by these tests: adding a vendor to `font-src` on a
// page that had no `font-src` produced `font-src https://vendor`, and the SITE'S
// OWN webfonts — previously allowed by `default-src 'self'` — were refused. The
// browser reports it as a font-src violation per file, which reads like a font
// problem rather than a CSP one.
// ---------------------------------------------------------------------------

const createdCsp = cspOf(run({}, pageWith(
  '<script src="https://cdn.example.com/w.js"></script>')))
const dirOf = (name) => (createdCsp.match(new RegExp(name + '[^;]*')) || [''])[0]

for (const created of ['font-src', 'connect-src']) {
  check(`${created} is created WITH 'self' inherited from default-src`,
    dirOf(created).includes("'self'") && dirOf(created).includes('https://cdn.example.com'),
    dirOf(created))
}
check('style-src, which already existed, keeps its own sources',
  dirOf('style-src').includes("'self'") && dirOf('style-src').includes("'unsafe-inline'") &&
  dirOf('style-src').includes('https://cdn.example.com'), dirOf('style-src'))
check('a created frame-src also inherits rather than revoking same-origin framing',
  (() => {
    const c = cspOf(run({}, pageWith('<iframe src="https://v.example/x"></iframe>',
      "default-src 'self'; script-src 'self';")))
    const fs = (c.match(/frame-src[^;]*/) || [''])[0]
    return fs.includes("'self'") && fs.includes('https://v.example')
  })())
check("a default-src of 'none' is not copied into the new directive",
  (() => {
    const c = cspOf(run({}, pageWith('<iframe src="https://v.example/x"></iframe>',
      "default-src 'none'; script-src 'self';")))
    const fs = (c.match(/frame-src[^;]*/) || [''])[0]
    return !fs.includes("'none'") && fs.includes('https://v.example')
  })())


// ---------------------------------------------------------------------------
// Compatible mode (v1.3.0) — the default.
//
// The reason it exists: a vendor's API host lives inside the vendor's
// JavaScript, never in the markup, so no amount of reading the page can find
// it. Elfsight loads from elfsightcdn.com and then calls
// core.service.elfsight.com; on the live site that call was refused and the
// widget rendered at 0px with one line in a console nobody reads.
// ---------------------------------------------------------------------------

const EMBEDDED = '<div class="wz-embed" data-wz-embed="auto">' +
  '<script src="https://elfsightcdn.com/platform.js" async></script>' +
  '<div class="elfsight-app-5b4f0a1d"></div></div>'

const compatCsp = cspOf(run({}, pageWith(EMBEDDED)))
const dir = (name) => (compatCsp.match(new RegExp(name + '[^;]*')) || [''])[0]

console.log('\nEmbed Origins — compatible mode\n')

check('compatible is the default (no setting stored)', /https:/.test(dir('script-src')), compatCsp)
check('a widget may fetch any https host, which is the whole point',
  dir('connect-src').includes('https:'), dir('connect-src'))
check('websockets too — plenty of chat and booking widgets use them',
  dir('connect-src').includes('wss:'), dir('connect-src'))
for (const d of ['script-src', 'frame-src', 'style-src', 'font-src', 'img-src', 'media-src']) {
  check(`${d} allows https`, dir(d).includes('https:'), dir(d))
}
check("script-src takes 'unsafe-inline' AND drops every hash — a browser ignores " +
      "'unsafe-inline' when any hash is present, so keeping one would refuse pasted inline scripts",
  dir('script-src').includes("'unsafe-inline'") && !dir('script-src').includes('sha256-'),
  dir('script-src'))
check("'unsafe-eval' is granted, because widget bundles use new Function",
  dir('script-src').includes("'unsafe-eval'"), dir('script-src'))
check("'self' survives in every directive it touches",
  ['script-src', 'frame-src', 'connect-src', 'style-src', 'font-src', 'img-src', 'media-src']
    .every((d) => dir(d).includes("'self'")), compatCsp)
check('default-src is left alone', /default-src 'self'/.test(compatCsp), compatCsp)

// The containment that makes this acceptable: it is per PAGE.
const noEmbed = pageWith('<p>an ordinary page</p><script type="application/ld+json">{}</script>')
check('a page with NO embed is byte-identical — the site stays locked down',
  run({}, noEmbed) === noEmbed)
const strictish = cspOf(run({}, pageWith('<iframe src="https://v.example/x"></iframe>')))
check('an iframe alone is not an Embed block, so it takes the derived path, not https:',
  !/script-src[^;]*https:(?!\/)/.test(strictish) && /frame-src[^;]*v\.example/.test(strictish),
  strictish)

// Strict mode is the escape hatch, and it must really be the old behaviour.
check('strict mode falls back to deriving from the page',
  (() => {
    const c = cspOf(run({ embedPolicy: 'strict' }, pageWith(EMBEDDED)))
    return c.includes('https://elfsightcdn.com') && !/script-src[^;]*'unsafe-inline'/.test(c) &&
      c.includes("'sha256-JjJVpPcuFN6Z7GOg4PkiVfiyklUS+vTDCbASsgWy7ik='")
  })())
check('strict mode with autoTrust off is the original v1.1.0 behaviour',
  run({ embedPolicy: 'strict', autoTrust: false }, pageWith(EMBEDDED)) === pageWith(EMBEDDED))

// Typed boxes still work in compatible mode (an http staging host, say).
check('a typed origin still applies in compatible mode',
  cspOf(run({ frameOrigins: 'http://staging.local:3000' }, pageWith(EMBEDDED)))
    .includes('http://staging.local:3000'))

check('compatible mode is idempotent across republishes',
  (() => {
    const first = run({}, pageWith(EMBEDDED))
    return run({}, first) === first
  })())

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
