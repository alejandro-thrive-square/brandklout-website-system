#!/usr/bin/env node
/**
 * Does the Link Editor panel's safety gate agree with the platform's? (v1.0.0)
 *
 *   node verify-link-editor.mjs
 *
 * The panel declines to COMMIT a value the publisher would strip, so its
 * `isSafeUrl()` has to be a faithful copy of the host's. It cannot import the
 * real one — `@core/html-sanitize` is not on the plugin import map — so the
 * copy is transcribed by hand, and a hand-transcribed security check is
 * exactly the kind of thing that rots silently.
 *
 * This gate does two things:
 *
 *   1. re-reads BOTH implementations from source (the plugin's
 *      `editor/index.js` and the host's `src/core/html-sanitize/index.ts`) and
 *      fails if the host's `urlScheme` / `isSafeUrl` / `SAFE_URL_SCHEMES` have
 *      drifted from what this file was written against — so a future Instatic
 *      release cannot quietly widen the enforcement gate while the plugin
 *      keeps using the old rules;
 *
 *   2. drives the plugin's copy over the cases that matter, including the
 *      C0-control and tab bypasses behind GHSA-pqcp-872g-gmp8.
 *
 * The host checkout defaults to `C:\ifork\Instatic-main`; override with
 * `--host=<path>`.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const hostArg = process.argv.find((a) => a.startsWith('--host='))
const HOST = hostArg ? hostArg.slice('--host='.length) : 'C:\\ifork\\Instatic-main'

const PLUGIN_SRC = join(here, 'link-editor', 'editor', 'index.js')
const HOST_SRC = join(HOST, 'src', 'core', 'html-sanitize', 'index.ts')

let failures = 0
const ok = (cond, label) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}`)
  if (!cond) failures++
}

// ---------------------------------------------------------------------------
// 1. Extract the plugin's copy and evaluate it in isolation.
// ---------------------------------------------------------------------------
//
// The plugin file is ESM with bare imports (`react`, `@instatic/host-*`) that
// only resolve inside the admin window, so it can't be imported here. The two
// pure functions are lifted out by source slice instead — which also means the
// thing under test is the REAL file, not a restatement of it.

const pluginSource = readFileSync(PLUGIN_SRC, 'utf8')

function slice(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker)
  if (start === -1) throw new Error(`${label}: could not find "${startMarker}" — the source has moved.`)
  const end = source.indexOf(endMarker, start)
  if (end === -1) throw new Error(`${label}: could not find the end of "${startMarker}".`)
  return source.slice(start, end + endMarker.length)
}

const schemesSrc = slice(pluginSource, 'const SAFE_URL_SCHEMES', '])', 'plugin SAFE_URL_SCHEMES')
const urlSchemeSrc = slice(pluginSource, 'function urlScheme(value)', '\n}', 'plugin urlScheme')
const isSafeUrlSrc = slice(pluginSource, 'function isSafeUrl(value)', '\n}', 'plugin isSafeUrl')
const prefixSrc = slice(pluginSource, 'const PAGE_REF_PREFIX', "'\n", 'plugin PAGE_REF_PREFIX')
const isPageRefSrc = slice(pluginSource, 'function isPageRef(value)', '\n}', 'plugin isPageRef')
const committableSrc = slice(pluginSource, 'function isCommittable(value)', '\n}', 'plugin isCommittable')

const { isSafeUrl, urlScheme, SAFE_URL_SCHEMES, isCommittable } = new Function(
  `${schemesSrc}\n${urlSchemeSrc}\n${isSafeUrlSrc}\n${prefixSrc}\n${isPageRefSrc}\n${committableSrc}\n`
  + 'return { isSafeUrl, urlScheme, SAFE_URL_SCHEMES, isCommittable }',
)()

// The plugin source must not carry raw control characters. It did once: writing
// the range as a literal put a NUL byte in the file, which makes it a "binary
// file" to grep and is silently mangled by editors that normalise on save.
console.log('\nplugin source hygiene:')
ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(pluginSource),
   'no raw control characters in editor/index.js')

// ---------------------------------------------------------------------------
// 2. Assert the HOST has not drifted from what this copy was written against.
// ---------------------------------------------------------------------------

console.log('\nhost parity (the copy is only valid while these hold):')

let hostSource = ''
let hostReadable = true
try {
  hostSource = readFileSync(HOST_SRC, 'utf8')
} catch {
  hostReadable = false
}

if (!hostReadable) {
  console.log(`  SKIP  host checkout not found at ${HOST} — pass --host=<path> to include these checks`)
} else {
  const hostSchemes = /SAFE_URL_SCHEMES = new Set\(\[([^\]]*)\]\)/.exec(hostSource)
  ok(!!hostSchemes, 'host declares SAFE_URL_SCHEMES as a Set literal')
  if (hostSchemes) {
    const parsed = new Set(
      hostSchemes[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean),
    )
    const same = parsed.size === SAFE_URL_SCHEMES.size && [...parsed].every((s) => SAFE_URL_SCHEMES.has(s))
    ok(same, `scheme sets identical (host: ${[...parsed].join(' ')})`)
  }

  // The host's isSafeUrl is a two-liner; if it grows a clause, this copy is stale.
  const hostIsSafe = /export function isSafeUrl\(url: string\): boolean \{([\s\S]*?)\n\}/.exec(hostSource)
  ok(!!hostIsSafe && /scheme === null \|\| SAFE_URL_SCHEMES\.has\(scheme\)/.test(hostIsSafe[1]),
     'host isSafeUrl is still "scheme === null || SAFE_URL_SCHEMES.has(scheme)"')

  // The three normalisation steps the plugin copies.
  const hostScheme = /export function urlScheme\(value: string\): string \| null \{([\s\S]*?)\n\}/.exec(hostSource)
  const body = hostScheme ? hostScheme[1] : ''
  ok(/\^\[\\u0000-\\u0020\]\+/.test(body), 'host still strips leading U+0000–U+0020')
  ok(/\[\\u0000-\\u0020\]\+\$/.test(body), 'host still strips trailing U+0000–U+0020')
  ok(/\[\\t\\n\\r\]/.test(body), 'host still removes tab / LF / CR')
  ok(/\^\(\[a-zA-Z\]\[a-zA-Z0-9\+\.-\]\*\):/.test(body), 'host scheme pattern unchanged')
}

// ---------------------------------------------------------------------------
// 3. Behaviour.
// ---------------------------------------------------------------------------

const NUL = String.fromCharCode(1)

const cases = [
  // The whole point of the plugin — every one of these is refused by the
  // platform's own `isValidUrl` and must be accepted here.
  ['', true, 'empty (clearing the field)'],
  ['#book', true, 'on-page anchor'],
  ['#invitation', true, 'the anchor the client could not edit'],
  ['/contact', true, 'root-relative path'],
  ['./contact', true, 'relative path'],
  ['../contact', true, 'parent-relative path'],
  ['contact.html', true, 'bare filename'],
  ['?q=1', true, 'query only'],
  ['//cdn.example/x', true, 'protocol-relative'],
  ['/contact-maclean#book', true, 'relative path plus fragment'],
  ['tel:+15717029900', true, 'telephone link'],
  ['sms:+15717029900', true, 'SMS link'],
  ['cms:page:abc123', false, 'page ref is NOT a safe href on its own'],

  // Still allowed, unchanged.
  ['https://flexbook.me/drnahlah', true, 'absolute https'],
  ['http://example.com', true, 'absolute http'],
  ['mailto:hello@example.com', true, 'mailto'],

  // Still refused — the backstop.
  ['javascript:alert(1)', false, 'javascript:'],
  ['JavaScript:alert(1)', false, 'javascript: mixed case'],
  ['vbscript:msgbox(1)', false, 'vbscript:'],
  ['data:text/html,<script>', false, 'data:'],
  [`${NUL}javascript:alert(1)`, false, 'javascript: behind a C0 control'],
  ['java\tscript:alert(1)', false, 'javascript: split by a tab'],
  ['  javascript:alert(1)', false, 'javascript: behind spaces'],
]

console.log('\nbehaviour:')
for (const [input, expected, label] of cases) {
  const actual = isSafeUrl(input)
  ok(actual === expected, `${JSON.stringify(input).padEnd(34)} -> ${String(actual).padEnd(5)} ${label}`)
}

// ---------------------------------------------------------------------------
// 4. The commit gate — what the panel will actually WRITE.
// ---------------------------------------------------------------------------
//
// This is the gate that matters. `isSafeUrl` alone would reject `cms:page:…`
// (it parses as scheme `cms:`) and a page-ref link would then be uneditable in
// precisely the way the platform's own field is: every intermediate keystroke
// keeps the prefix, so the value could never be edited down to anything else.
// That regression is the reason this section exists.

console.log('\ncommit gate (isCommittable):')
const commitCases = [
  ['cms:page:abc123', true, 'existing page ref stays editable'],
  ['cms:page:abc123#book', true, 'page ref plus fragment — unreachable from the Page picker'],
  ['cms:page:', true, 'mid-edit page ref (a keystroke on the way somewhere)'],
  ['#book', true, 'plain anchor'],
  ['tel:+15717029900', true, 'telephone link'],
  ['', true, 'cleared'],
  ['javascript:alert(1)', false, 'dangerous scheme still refused'],
  ['cms:evil:x', false, 'only the page-ref prefix is special-cased, not all of cms:'],
]
for (const [input, expected, label] of commitCases) {
  const actual = isCommittable(input)
  ok(actual === expected, `${JSON.stringify(input).padEnd(34)} -> ${String(actual).padEnd(5)} ${label}`)
}

console.log('\npage-ref handling:')
ok(urlScheme('cms:page:abc') === 'cms:', 'cms: parses as a scheme, so isSafeUrl alone would refuse it')
ok(isSafeUrl('cms:page:abc') === false, 'isSafeUrl refuses it — the special case is load-bearing')
ok(pluginSource.includes('isPageRef(draft)'),
   'the panel detects page refs and explains them rather than silently breaking them')

// ---------------------------------------------------------------------------
// 5. The `@instatic/host-ui` Input contract.
// ---------------------------------------------------------------------------
//
// `Input` from the host-ui shim is `PluginInput`, a NARROWED wrapper — not the
// host's design-system Input. It calls `props.onChange(event.currentTarget.value)`,
// so a handler written against a React event throws on every keystroke and the
// field silently refuses input. That shipped once; these assertions stop it
// shipping again.

// Comments are stripped first: this file DOCUMENTS the wrong shape in prose so
// the next author knows what to avoid, and the assertions must not match that.
const code = pluginSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// ---------------------------------------------------------------------------
// 6. The commit must be debounced.
// ---------------------------------------------------------------------------
//
// Committing per keystroke writes every PREFIX of what is typed, and every
// prefix of a dangerous value is itself safe — `javascript:alert(1)` walks
// through `j`, `ja`, … `javascript`, all schemeless, all committed, and only
// the colon stops it. That left the live node holding `javascript` while the
// panel said "Not saved". These assertions keep the delay in place.

console.log('\ndebounced commit:')
ok(/COMMIT_DELAY_MS\s*=\s*\d+/.test(code), 'a commit delay is defined')
ok(/setTimeout\(/.test(code) && /clearTimeout\(/.test(code),
   'the write is scheduled and cancellable, not fired inline from onChange')
ok(/const onBlur = \(\) => commit\(draft\)/.test(code),
   'blur commits immediately, so clicking away cannot lose the edit')
ok(/onBlur,/.test(code), 'onBlur is actually passed to the Input')
ok(!/onChange = \([^)]*\) => \{[\s\S]{0,400}?updateNodeProps/.test(code),
   'onChange does not call updateNodeProps directly')
ok(/target\.current\s*=\s*\{\s*nodeId/.test(code),
   'the pending write captures its node, so it cannot land on a later selection')

console.log('\nhost-ui Input contract:')
ok(!/e\.target\.value/.test(code),
   'the change handler does NOT treat its argument as a React event')
ok(/const onChange = \(v\) =>/.test(code),
   'the change handler takes the string value directly')
// Props outside PluginUiInputProps are silently dropped by the wrapper.
for (const dead of ['fieldSize', 'autoComplete', 'spellCheck']) {
  ok(!new RegExp(`\\b${dead}:`).test(code),
     `does not pass "${dead}" — not in PluginUiInputProps, silently ignored`)
}

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
