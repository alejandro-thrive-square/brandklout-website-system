#!/usr/bin/env node
/**
 * Exercise the Embed module's render()/preview() off-platform.
 *
 * The module pack is pure string work, so everything here runs with no host,
 * no network and no site. What it CANNOT prove is that the host registers the
 * module and calls it — that is what installing and publishing a page shows.
 *
 * The escaped-props cases are the ones that matter. `escapeProps()` runs before
 * render() on the publish path and HTML-escapes every non-URL string prop, so
 * each test below is written TWICE where it matters: once with raw props (the
 * editor canvas) and once with escaped props (the publisher). Both must agree.
 */
import mod from './embed-origins/modules/index.js'

const EMBED = mod[0]
const D = EMBED.defaults

/** Mirror of the publisher's escapeHtml (core/html-sanitize/index.ts). */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[c])

/**
 * Apply the publisher's escape rules to a props bag the way escapeProps() does:
 * `url`-typed props pass through raw, everything else is escaped.
 */
const asPublished = (props) => {
  const out = {}
  for (const [k, v] of Object.entries(props)) {
    out[k] = typeof v === 'string' && EMBED.schema[k]?.type !== 'url' ? esc(v) : v
  }
  return out
}

const render = (props) => EMBED.render({ ...D, ...props }).html
const published = (props) => EMBED.render(asPublished({ ...D, ...props })).html
const preview = (props) => EMBED.preview({ ...D, ...props }).html

let pass = 0, fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n          ' + detail : ''}`) }
}

console.log('\nEmbed module — render behaviour\n')

// 1. Identity and shape the host requires of a plugin module.
check('module id is namespaced under the plugin id',
  EMBED.id === 'brandklout.embed-origins.embed')
check('every schema key has a default', Object.keys(EMBED.schema)
  .every((k) => Object.prototype.hasOwnProperty.call(D, k)))
check('root element is a single wrapper div (author classes land on it)',
  /^<div class="wz-embed"[^>]*>/.test(render({ url: 'https://v.example/w' })))
check('root tag carries no author text — classInjection scans it with [^>]*',
  /^<div [^>]*>/.test(render({ url: 'https://v.example/w', title: 'a > b' })) &&
  !/^<div[^>]*a > b/.test(render({ url: 'https://v.example/w', title: 'a > b' })))

// 2. URL mode.
const url = 'https://reputationhub.site/reputation/widgets/review_widget/xJDu?widgetId=6a73&z=1'
check('URL mode emits one iframe with the pasted src',
  render({ url }).includes('src="https://reputationhub.site/reputation/widgets/review_widget/xJDu?widgetId=6a73&amp;z=1"'))
check('query-string ampersand is escaped exactly once, not doubled',
  !render({ url }).includes('&amp;amp;'))
check('publisher path (url prop passed raw by escapeProps) agrees with the canvas',
  published({ url }) === render({ url }))
check('lazy by default, eager when switched off',
  render({ url }).includes('loading="lazy"') &&
  render({ url, lazy: false }).includes('loading="eager"'))
check('title is used, and defaults when empty',
  render({ url, title: 'Patient reviews' }).includes('title="Patient reviews"') &&
  render({ url }).includes('title="Embedded content"'))
check('allowfullscreen only when asked for',
  !render({ url }).includes('allowfullscreen') &&
  render({ url, allowFullscreen: true }).includes('allowfullscreen'))
check('allow attribute passes through when set',
  render({ url, allow: 'clipboard-write; encrypted-media' })
    .includes('allow="clipboard-write; encrypted-media"'))

// 3. Text props: escaped once, in BOTH contexts. A double-escape here is the
//    bug that would ship "Tom &amp;amp; Jerry" to a visitor.
for (const [label, fn] of [['canvas', render], ['published', published]]) {
  const html = fn({ url, title: 'Tom & Jerry\'s "reviews"' })
  check(`${label}: title escaped exactly once`,
    html.includes('title="Tom &amp; Jerry&#x27;s &quot;reviews&quot;"'), html)
  check(`${label}: no double-escaped entities anywhere`,
    !/&amp;(amp|lt|gt|quot|#x27);/.test(html), html)
}
check('a title that tries to close the attribute cannot escape it',
  !render({ url, title: '" onload="alert(1)' }).includes('onload="alert'))

// 4. Scheme guard — the canvas gets RAW props, so the module cannot lean on
//    the publisher's isSafeUrl().
for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<b>x',
                   'vbscript:x', '\u0001javascript:alert(1)', ' java\tscript:alert(1)']) {
  check(`refuses ${JSON.stringify(bad)}`,
    !/<iframe/.test(render({ url: bad })), render({ url: bad }))
}
check('accepts a protocol-relative and a relative URL',
  /<iframe/.test(render({ url: '//v.example/w' })) &&
  /<iframe/.test(render({ url: '/local/page' })))

// 5. Snippet mode — the escaped-props round trip is the whole point.
const snippet = '<iframe src="https://v.example/w?a=1&b=2" title="x"></iframe>'
check('canvas: snippet is emitted verbatim',
  render({ source: 'snippet', snippet }).includes(snippet))
check('published: an ESCAPED snippet is decoded back to real markup',
  published({ source: 'snippet', snippet }).includes(snippet),
  published({ source: 'snippet', snippet }))
check('published snippet round-trip is byte-identical to the canvas',
  published({ source: 'snippet', snippet }) === render({ source: 'snippet', snippet }))
const withEntities = '<p>Tom &amp; Jerry &lt;3</p>'
check('entities the author typed literally survive the round trip',
  published({ source: 'snippet', snippet: withEntities }).includes(withEntities),
  published({ source: 'snippet', snippet: withEntities }))
check('a script snippet is emitted (the page CSP, not this module, decides if it runs)',
  published({ source: 'snippet', snippet: '<script src="https://v.example/w.js"></script>' })
    .includes('<script src="https://v.example/w.js"></script>'))
check('URL fields are ignored in snippet mode',
  !render({ source: 'snippet', snippet, url }).includes('reputationhub'))

// 6. Height modes.
check('auto emits a starting height and the auto marker',
  /data-wz-embed="auto"/.test(render({ url })) && /height:600px/.test(render({ url })))
check('fixed height uses the number given',
  /height:900px/.test(render({ url, fit: 'fixed', height: 900 })))
check('a junk height falls back rather than emitting height:NaNpx',
  /height:600px/.test(render({ url, fit: 'fixed', height: 'abc' })))
check('ratio mode sets the custom property and no inline height',
  /--wz-embed-ratio:4\/3/.test(render({ url, fit: 'ratio', ratio: '4 / 3' })) &&
  !/height:\d+px/.test(render({ url, fit: 'ratio' })))
check('an unknown ratio falls back to 16 / 9',
  /--wz-embed-ratio:16\/9/.test(render({ url, fit: 'ratio', ratio: '99 / 1' })))

// 7. The runtime rides only on auto, and only on a configured block.
check('auto ships the resize runtime',
  typeof EMBED.render({ ...D, url }).js === 'string')
check('fixed and ratio ship none',
  EMBED.render({ ...D, url, fit: 'fixed' }).js === undefined &&
  EMBED.render({ ...D, url, fit: 'ratio' }).js === undefined)
check('an unconfigured block ships none',
  EMBED.render({ ...D }).js === undefined)
const js = EMBED.render({ ...D, url }).js
check('runtime is a self-contained IIFE with no imports and no document.write',
  /^\(function\(\)\{/.test(js) && !/\bimport\b|document\.write/.test(js), js.slice(0, 60))
check('runtime matches frames by window identity, never by origin string',
  js.includes('contentWindow===e.source') && !js.includes('e.origin'))

// 8. Unconfigured: nothing on the published page, something to click in the editor.
check('published output for an empty block is a comment, no element',
  render({}) === '<!-- instatic: embed not configured -->' &&
  render({ source: 'snippet' }) === '<!-- instatic: embed not configured -->')
check('canvas shows a placeholder instead',
  /wz-embed-note/.test(preview({})) && /paste a URL/.test(preview({})))

// 8b. The canvas gets a CARD, never the embed. This is the whole point of
//     preview(): the editor must load no vendor, run no vendor markup and leak
//     no vendor stylesheet, while the published page is untouched.
const snip = '<div id="w"></div><style>body{background:red}</style>' +
  '<script src="https://cdn.vendor.example/w.js"></script>'

check('canvas never emits an iframe, in either mode',
  !/<iframe/i.test(preview({ url })) &&
  !/<iframe/i.test(preview({ source: 'snippet', snippet: '<iframe src="https://v.example/w"></iframe>' })))
check('canvas never emits the vendor snippet, so no script/style/link reaches the editor',
  !/<script|<style|<link/i.test(preview({ source: 'snippet', snippet: snip })))
check('the card is marked as a card and is not what publishes',
  /data-wz-embed-card="1"/.test(preview({ url })) &&
  !/data-wz-embed-card/.test(published({ url })) &&
  preview({ url }) !== published({ url }))
check('the card is still found by the editor gate probe',
  /(data-wz-embed=|wz-embed-note)/.test(preview({ url })) &&
  /(data-wz-embed=|wz-embed-note)/.test(preview({})))
check('the card names the destination host, not the whole URL',
  preview({ url }).includes('reputationhub.site') &&
  !preview({ url }).includes('widgetId'))
check('the card names the hosts a snippet reaches, which is what settings need',
  preview({ source: 'snippet', snippet: snip }).includes('cdn.vendor.example'))
check('the card says what the snippet contains',
  /1 script/.test(preview({ source: 'snippet', snippet: snip })))
check('the card reserves the box the block will occupy',
  /style="[^"]*height:600px/.test(preview({ url, fit: 'fixed', height: 600 })) &&
  /style="[^"]*min-height:600px/.test(preview({ url, fit: 'auto', height: 600 })) &&
  /--wz-embed-ratio:4\/3/.test(preview({ url, fit: 'ratio', ratio: '4 / 3' })))
check('the card root carries no author text — classInjection scans it with [^>]*',
  /^<div [^>]*>/.test(preview({ url, title: 'a > b' })) &&
  !/^<div[^>]*a > b/.test(preview({ url, title: 'a > b' })))
check('the card escapes what it echoes back',
  !preview({ source: 'snippet', snippet: '<img src="https://x.example/a" onerror="alert(1)">' })
    .includes('onerror='))
check('canvas and publisher props give the same card',
  preview({ url }) === EMBED.preview(asPublished({ ...D, url })).html &&
  preview({ source: 'snippet', snippet: snip }) ===
    EMBED.preview(asPublished({ ...D, source: 'snippet', snippet: snip })).html)
check('the card ships no auto-height runtime',
  EMBED.preview({ ...D, url }).js === undefined)

// 9. CSS is emitted for anything that renders, and never for a comment.
check('CSS ships with a rendered block and not with an empty one',
  typeof EMBED.render({ ...D, url }).css === 'string' &&
  EMBED.render({ ...D }).css === undefined)

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
