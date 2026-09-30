/**
 * Step 4 — write the converted site into Instatic.
 *
 * One atomic `PUT /site-document` carries all three things at once:
 *   - the shell: 509 style rules + 9 conditions + site.js as a code asset
 *   - the seven pages
 *   - deletion of the starter Home page setup created
 *
 * `mode: 'replace'` is deliberate and is the platform's own documented import
 * path ("imports are deliberate replace-everything operations" —
 * server/handlers/cms/siteDocument.ts). It ignores baseSeqs/shellBaseSeq,
 * which is right for a first import into an empty site and WRONG for anything
 * afterwards: a second run of this against a site someone has edited would
 * discard their work. Guarded below.
 *
 * Usage:
 *   node push-site.mjs           dry run — prints what would change
 *   node push-site.mjs --apply
 */
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, api } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'
import { SNIPPET as GHL_SNIPPET, HEIGHT as GHL_HEIGHT, FORM_NAME as GHL_NAME } from '../04-design/.tmp/med-spa/site-src/ghl-form.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(HERE, '.tmp')
const SITE_SRC = path.resolve(HERE, '../04-design/.tmp/med-spa/final-site')

const apply = process.argv.includes('--apply')
const force = process.argv.includes('--force')

const converted = JSON.parse(fs.readFileSync(path.join(TMP, 'import-out.json'), 'utf8'))
const input = JSON.parse(
  zlib.gunzipSync(fs.readFileSync(path.join(TMP, 'import-input.json.gz'))).toString('utf8'),
)

const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

/* --- site.js -------------------------------------------------------------
   The static build sets `class="js"` on <html> from an inline <head> script,
   and 39-motion.css hides every [data-reveal] behind that class. Instatic has
   no custom-head field, and importHtml strips inline scripts anyway, so the
   class has to come from the bundle instead.

   It is prepended HERE rather than left to the bundle so the failure mode
   stays the one the design chose: if site.js does not load, `.js` is never
   set, the reveal rules never match, and every section is simply visible.
   The alternative — putting `js` on the body node statically — would hide the
   whole site behind a script that might not arrive.

   The cost is a possible flash on first paint, since the asset runs after
   parse. That is strictly better than a blank page. */
const BOOTSTRAP = `/* Added by push-site.mjs — see the comment there before removing.
   Replaces the static build's inline <head> script, which Instatic strips. */
document.documentElement.classList.add('js');
`
/* THE VENDOR BUNDLE GOES IN FRONT OF IT, added 2026-09-01.

   The static build keeps GSAP + ScrollTrigger + SplitText in a separate
   `vendor.js` that only pages with `motion: true` request, so the neck lift
   page never downloads 122KB it has no use for. **Instatic has one script asset
   for the whole site**, so the split cannot survive the import and both
   published pages carry the vendor bundle. That is a real regression against
   the static build and it is recorded here rather than quietly absorbed; the
   split still pays on any host that serves the files as they are.

   ORDER IS LOAD-BEARING. `js/10-journey.js` reads `window.gsap` at call time
   and guards on it, so a reversed order does not throw — it silently produces a
   home page with no pinned chapter and no split headlines, which looks like a
   design decision. Vendor first, always.

   `build-import-input.mjs` strips the page-level `<script src="assets/vendor.js">`
   for the same reason it strips site.js. */
const vendorJs = fs.readFileSync(path.join(SITE_SRC, 'assets', 'vendor.js'), 'utf8')
const siteJs =
  BOOTSTRAP +
  '/* ---- vendor.js, concatenated by push-site.mjs: Instatic has one script asset. ---- */\n' +
  vendorJs +
  '\n/* ---- site.js ---- */\n' +
  fs.readFileSync(path.join(SITE_SRC, 'assets', 'site.js'), 'utf8')

/* --- the token layer -----------------------------------------------------
   CUSTOM PROPERTIES DO NOT SURVIVE THE REGISTRY CONVERSION.

   happy-dom's CSSStyleDeclaration does not enumerate `--*` declarations, so
   `cssToStyleRules` turns every `:root { --ivory: …; --space-large: … }` block
   into an EMPTY rule. It reports no warning: the conversion "succeeds", the
   var() usages all survive on the rules that consume them, and the published
   site loads a stylesheet in which every single var() resolves to nothing.

   The symptom is not a missing colour or two. This design system is entirely
   token-driven — spacing, radii, type scale, easing, the fluid rem basis — so
   the first publish rendered as unstyled centred text with working fonts, and
   looked like the CSS had half-loaded rather than like a token failure.

   The fix is a layer split the platform already provides: the token
   PRIMITIVES ship as a code asset (served verbatim as userStyles-*.css, never
   parsed by happy-dom), and everything built on top of them stays in the
   registry where the Styles panel can edit it. Nobody edits a raw token from
   the panel anyway, so nothing is lost.

   Cascade order is `reset -> framework -> style -> userStyles`, and these are
   definitions consumed by var() at computed-value time, so loading last is
   harmless.

   Source files, verbatim and in order — keep them in step with site-src/css/. */
const TOKEN_FILES = ['00-fluid-root.css', '01-tokens.css']
const CSS_SRC = path.resolve(HERE, '../04-design/.tmp/med-spa/site-src/css')

/* --- AND EVERY OTHER :root BLOCK, harvested ------------------------------
   FOUND ON THE PUBLISHED SITE, 2026-09-01. The two files above were the whole
   token layer when every custom property lived in them. They stopped being the
   whole token layer on 2026-08-31, when `50-journey.css` opened its own `:root`
   for `--size-display`, `--size-display-sm`, `--size-numeral`, `--size-h3-j`,
   `--gutter`, `--section`, `--section-sm` and `--pad-panel` — and again on
   2026-09-01, when `51-dossier.css` added `--spec-w` and `--spec-top`.

   Those declarations went into the registry and happy-dom dropped them, exactly
   as the note above describes, and nobody noticed because the FAILURE IS NOT
   UNIFORM. `--size-h2` is in 01-tokens.css so every section heading was the
   right size; `--size-display` is not, so the <h1> rendered at inherited body
   size. `--gutter` is not, so `padding: var(--section) var(--gutter)` was an
   invalid declaration and the whole page sat flush against x=0 while every
   other spacing value looked correct. A half-tokenised page reads as a layout
   bug, not as a token bug, which is why this cost a publish to find.

   So harvest them rather than maintain a second list that will drift the same
   way. Every `:root` block in every other stylesheet, top level and inside
   `@media`, is appended verbatim. A new stylesheet that declares a token is
   covered the day it is written. */
function harvestRoots(src) {
  // Comments first. `50-journey.css` opens with a fifty-line banner and its
  // `:root` follows a `*/`, not a `}` — the first version of this keyed on the
  // preceding character and harvested nothing at all, silently, which is the
  // same class of failure it was written to prevent. The `MUST` assertion below
  // is what caught it.
  const css = src.replace(/\/\*[\s\S]*?\*\//g, ' ')
  const out = []

  // Walk rules by brace MATCHING, so an @media wrapper is one rule rather than
  // something a `{[^}]*}` regex stops in the middle of.
  const rules = (text) => {
    const found = []
    let i = 0
    while (i < text.length) {
      const open = text.indexOf('{', i)
      if (open < 0) break
      let depth = 0
      let close = -1
      for (let j = open; j < text.length; j++) {
        if (text[j] === '{') depth++
        else if (text[j] === '}') {
          depth--
          if (depth === 0) {
            close = j
            break
          }
        }
      }
      if (close < 0) break
      found.push({ sel: text.slice(i, open).trim(), body: text.slice(open + 1, close) })
      i = close + 1
    }
    return found
  }

  const isRoot = (sel) => /(^|,)\s*:root\s*$/.test(sel)

  /* A CUSTOM PROPERTY IS NOT ALWAYS DECLARED ON :root, and trap 1 does not care
     where it was declared — happy-dom drops it either way.

     `--pos` on `.compare_component` was the sibling's instance of this and was
     handled by hand, as one literal rule appended below. Hand-handling does not
     scale and does not warn: this site declares `--marquee-duration` on
     `.marquee_component` (40-motion.css) and `--cad-label` on `.cadence_grid`
     (52-cadence.css, and again at a breakpoint in 90-wide.css), and all three
     would have gone the same way in silence. The marquee would not scroll and
     the year grid's labels would size from nothing — neither of which fails,
     warns, or looks like a token problem.

     So harvest by DECLARATION rather than by selector. Any rule that declares a
     custom property contributes its selector and ONLY its custom-property
     declarations. Taking the whole body would be wrong: the token asset is
     served after the registry, so a `display` or `padding` riding along would
     silently outrank the registry copy the Styles panel edits. */
  const customProps = (body) => {
    const kept = []
    // Split on top-level `;` so a `var(--x, a; b)` or a nested block cannot cut
    // a declaration in half.
    let depth = 0
    let start = 0
    const parts = []
    for (let i = 0; i < body.length; i++) {
      const c = body[i]
      if (c === '(' || c === '{') depth++
      else if (c === ')' || c === '}') depth--
      else if (c === ';' && depth === 0) {
        parts.push(body.slice(start, i))
        start = i + 1
      }
    }
    parts.push(body.slice(start))
    for (const p of parts) {
      if (/^\s*--[a-zA-Z0-9-]+\s*:/.test(p)) kept.push(p.trim())
    }
    return kept
  }

  /* CUSTOM PROPERTIES ONLY, `:root` INCLUDED, AND THAT IS THE WHOLE POINT.
     FOUND 2026-09-04 by compare-live.mjs: the footer published charcoal
     (#272727) instead of the near-black it is designed in (#1e1e1e), on all
     eleven pages, and the same cause was one card on /financing publishing
     green instead of white.

     The token asset is the LAST stylesheet in the cascade
     (reset -> framework -> style -> userStyles). Any ORDINARY declaration in it
     therefore outranks the registry copy of itself whenever specificity ties —
     and it ties constantly, because `[data-theme="dark"]` (an attribute, 0-1-0)
     ties with `.footer_component` (a class, 0-1-0). Locally 01-tokens.css is
     read before 22-footer.css so the footer's `background-color: var(--bg-alt)`
     wins; published, the theme block is re-emitted after it and
     `background-color: var(--bg)` wins instead. Nothing errors. The site is
     simply the wrong colour, in a way that reads as a design decision.

     The ordinary declarations are not lost: they are in the registry already,
     which is where they belong and where the Styles panel can edit them. Only
     the custom properties need this second road, because those are what the
     conversion drops. So carry those and nothing else. */
  const emit = (r) => {
    if (/^@/.test(r.sel)) return null // handled by the caller
    const props = customProps(r.body)
    if (!props.length) return null
    return (isRoot(r.sel) ? ':root' : r.sel) + ' { ' + props.join('; ') + '; }'
  }

  for (const r of rules(css)) {
    if (/^@(media|supports)\b/.test(r.sel)) {
      const inner = rules(r.body).map(emit).filter(Boolean)
      if (inner.length) out.push(r.sel + ' {' + inner.join('') + '}')
    } else {
      const one = emit(r)
      if (one) out.push(one)
    }
  }
  return out
}

/* --- AND EVERY clamp()/min()/max() DECLARATION, harvested ---------------------
   FOUND 2026-09-02 by compare-live.mjs on the twelve-page publish: 168
   findings, and nearly all of them one cause. happy-dom's cssToStyleRules
   DROPS any declaration whose value is a math function without a var() in
   it: `font-size: clamp(6rem, 21vw, 22rem)` on the ghost words (16px live),
   `height: min(calc(100vh - 9rem), 44rem)` on the catalogue's sticky
   photograph (0px live, a page with an invisible picture), the doctor's name
   at 32px, the hub's category words at 16px. `min(40rem, 86vw)` on
   .path_panel survived the same run, so which math functions it keeps is
   not predictable.

   The encoder route (conv-encode.ts, trap 19) does NOT help here: it rewrites
   the declaration to a `--instatic-sub-*` custom property, and custom
   properties are exactly what the conversion drops (trap 1). import-out.json
   carried zero of them after a run that reported 23 encoded.

   So these declarations take the same road as the tokens: verbatim, in the
   code asset, which is served last in the cascade (reset -> framework ->
   style -> userStyles) and never parsed by happy-dom. Each rule is emitted
   with its own selector and, where it sat inside one, its @media prelude, and
   carries ONLY the math declarations; the rest of the rule stays in the
   registry where the Styles panel can reach it. A value with var() in it is
   left alone because Instatic protects those itself. */
function harvestLossy(files) {
  /* THE WHOLE CASCADE FOR EVERY AFFECTED PAIR, not just the math value.
     The first version emitted only the math declarations, and the asset
     loads LAST: an unconditional `.catalogue_media { height: min(...) }`
     then beat the registry's own `@media (max-width: 991px) { height: auto }`
     and the hero's `width: min(28rem, 74%)` at 991 beat the registry's
     `width: 100%` at 600. So for every (selector, property) pair that has at
     least one math value anywhere in the bundle, EVERY declaration of that
     pair is emitted, in source order, inside its own @media where it had
     one. The asset then carries the same cascade the source does for those
     pairs, and the registry's surviving copies of the non-math ones repeat
     identical values. Selectors are matched on their exact text. */
  const MATH = /\b(?:clamp|min|max)\(/
  const SAFE = /\b(?:var|env)\(/

  /* AND EVERY MULTI-LAYER background, WHICH LOSES ALL BUT ITS LAST LAYER.
     FOUND 2026-09-04 by visual-diff.mjs, on ten of the eleven pages at once,
     and it is the worst defect this build has shipped.

     happy-dom expands a `background` shorthand into longhands and keeps ONE
     layer. `.cover_media::after` is written as

         background:
           linear-gradient(180deg, rgba(39,39,39,.55) 0%, … .82 100%),   <- the scrim
           linear-gradient(90deg,  rgba(39,39,39,.4)  0%, … 0 60%);

     and published as `background-image: linear-gradient(90deg, …)` alone. The
     180deg layer is what darkens the top and foot of every interior header so
     white type can be read over a photograph; without it the published covers
     are the raw photograph at full brightness with white text lying on it. The
     /thank-you neon sign is the extreme case — the heading is barely legible.

     NOTHING ELSE COULD SEE THIS. `verify-live.mjs` checks routes and assets.
     `compare-live.mjs` compares computed properties on elements it can pair by
     class, and `::after` is a pseudo-element: it has no node, so it is not in
     `document.querySelectorAll('body *')` and never gets compared. `filter`,
     `backdrop-filter` and `mix-blend-mode` are not in its property list either.
     It took subtracting the two screenshots.

     There are three of these on the site and all three are scrims — the home
     hero, the interior cover, and the /thank-you override. They take the same
     road as the math declarations: verbatim, in the code asset, last. */
  const layers = (value) => {
    let depth = 0
    let n = 1
    for (const c of value) {
      if (c === '(') depth++
      else if (c === ')') depth--
      else if (c === ',' && depth === 0) n++
    }
    return n
  }
  const LAYERABLE = /^(?:background|background-image|mask|mask-image|-webkit-mask-image)$/

  /* AND PROPERTIES THE CONVERSION DOES NOT KNOW AT ALL, which it drops without
     a word. FOUND 2026-09-04 by css-parity.mjs — the only one of the three
     lossy failures that was found by ASKING rather than by noticing.

     `html { -webkit-text-size-adjust; scroll-behavior; scroll-padding-top }`
     published as `html { font-size }` alone. `scroll-padding-top: 7rem` is the
     one that matters: the navbar is fixed and about 5.5rem tall, so without it
     every in-page anchor on the published site scrolls its target UNDERNEATH
     the navbar. The local build is correct and `menu-test.mjs` asserts it, so
     the check passes and the published site still does the wrong thing.

     This list is not a guess and it is not exhaustive. It is what
     `css-parity.mjs` reported missing on a real publish; run that after any
     change to the stylesheets and add whatever it names. */
  const DROPPED = /^(?:scroll-behavior|scroll-padding(?:-|$)|scroll-margin(?:-|$)|-webkit-text-size-adjust|text-size-adjust|overscroll-behavior(?:-|$))/

  const isLossy = (prop, value) =>
    (MATH.test(value) && !SAFE.test(value)) ||
    (LAYERABLE.test(prop) && layers(value) > 1) ||
    DROPPED.test(prop)
  const rules = (text) => {
    const found = []
    let i = 0
    while (i < text.length) {
      const open = text.indexOf('{', i)
      if (open < 0) break
      let depth = 0
      let close = -1
      for (let j = open; j < text.length; j++) {
        if (text[j] === '{') depth++
        else if (text[j] === '}') {
          depth--
          if (depth === 0) {
            close = j
            break
          }
        }
      }
      if (close < 0) break
      found.push({ sel: text.slice(i, open).trim(), body: text.slice(open + 1, close) })
      i = close + 1
    }
    return found
  }
  const isRoot = (sel) => /(^|,)\s*:root\s*$/.test(sel)
  const entries = []
  const push = (file, media, sel, body) => {
    for (const d of body.split(';')) {
      const t = d.trim()
      const colon = t.indexOf(':')
      if (colon < 1) continue
      const prop = t.slice(0, colon).trim()
      const value = t.slice(colon + 1).trim()
      if (!/^-?[a-zA-Z][a-zA-Z-]*$/.test(prop)) continue
      // A grouped selector is split into its parts, one entry each, so that a
      // responsive override written as `.catx_band, .catx_band.is-reverse
      // { min-height: 0 }` joins the `.catx_band` cascade. Found 2026-09-02:
      // the hub's category band kept its desktop min-height on a phone.
      for (const part of sel.split(',')) {
        const one = part.replace(/\s+/g, ' ').trim()
        if (one) entries.push({ file, media, sel: one, prop, value, math: isLossy(prop, value) })
      }
    }
  }
  for (const file of files) {
    const css = fs.readFileSync(path.join(CSS_SRC, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ')
    for (const r of rules(css)) {
      if (/^@(media|supports)\b/.test(r.sel)) {
        for (const n of rules(r.body)) if (!n.sel.startsWith('@') && !isRoot(n.sel)) push(file, r.sel, n.sel, n.body)
      } else if (!r.sel.startsWith('@') && !isRoot(r.sel)) push(file, '', r.sel, r.body)
    }
  }
  // A group is one (selector, property); a group is affected if any member
  // is a bare math value. Every member of an affected group is emitted.
  const affected = new Set(entries.filter((e) => e.math).map((e) => e.sel + '\u0000' + e.prop))
  const out = []
  for (const e of entries) {
    if (!affected.has(e.sel + '\u0000' + e.prop)) continue
    const rule = `${e.sel} { ${e.prop}: ${e.value}; }`
    out.push({ file: e.file, text: e.media ? `${e.media} { ${rule} }` : rule })
  }
  return out
}

const lossyRules = harvestLossy(fs.readdirSync(CSS_SRC).filter((n) => n.endsWith('.css') && !TOKEN_FILES.includes(n)).sort())
const lossy = []
for (const r of lossyRules) {
  const last = lossy[lossy.length - 1]
  if (last && last.file === r.file) last.blocks.push(r.text)
  else lossy.push({ file: r.file, blocks: [r.text] })
}

const harvested = []
for (const f of fs.readdirSync(CSS_SRC).filter((n) => n.endsWith('.css')).sort()) {
  if (TOKEN_FILES.includes(f)) continue
  const blocks = harvestRoots(fs.readFileSync(path.join(CSS_SRC, f), 'utf8'))
  if (blocks.length) harvested.push({ file: f, blocks })
}

const tokensCss =
  `/* Token primitives, pushed as a code asset by push-site.mjs.\n` +
  `   These CANNOT live in the style registry: happy-dom drops --custom-property\n` +
  `   declarations during conversion, silently. Edit site-src/css/ and re-push. */\n\n` +
  // THE TOKEN FILES GO THROUGH THE SAME FILTER, not in verbatim. They used to
  // be pasted whole, which is how `[data-theme="dark"] { background-color }`
  // reached the end of the cascade — see the note in harvestRoots.
  TOKEN_FILES.map(
    (f) =>
      `/* ===== ${f} ===== */\n` +
      harvestRoots(fs.readFileSync(path.join(CSS_SRC, f), 'utf8')).join('\n') +
      '\n',
  ).join('\n') +
  harvested
    .map(
      ({ file, blocks }) =>
        `\n/* ===== :root harvested from ${file} ===== */\n` + blocks.join('\n\n') + '\n',
    )
    .join('') +
  // The sibling appended one literal rule here — `.compare_component { --pos }`
  // from a deleted stylesheet — because harvestRoots only looked at `:root`.
  // It now harvests by declaration instead, so a custom property on a class is
  // picked up wherever it is written and there is nothing to append by hand.
  lossy
    .map(
      ({ file, blocks }) =>
        `\n/* ===== the cascade of every pair the conversion is lossy on — a clamp()/min()/max()\n` +
        `        value, or a multi-layer background — from ${file}. See push-site.mjs ===== */\n` +
        blocks.join('\n') + '\n',
    )
    .join('')

/* A token that is declared and never reaches the asset is the failure this
   whole block exists to stop, so assert the ones the layout cannot survive
   without rather than trusting the harvest. */
{
  /* DERIVED, not written by hand. The sibling listed eight token names it could
     not survive without, and that list had to be extended by hand twice — once
     per stylesheet that opened a new `:root` — which is the same drift the
     harvest above exists to prevent, moved one file along. It also cannot
     travel: those eight names are the sibling's, and six of them do not exist
     on this site at all, so the first run here refused a payload that was fine.

     Every custom property DECLARED anywhere in site-src/css/ must appear in the
     token asset. That is the actual invariant, it needs no maintenance, and it
     covers a stylesheet written tomorrow. */
  const MUST = [
    ...new Set(
      fs
        .readdirSync(CSS_SRC)
        .filter((n) => n.endsWith('.css'))
        .flatMap((n) =>
          [
            ...fs
              .readFileSync(path.join(CSS_SRC, n), 'utf8')
              .replace(/\/\*[\s\S]*?\*\//g, ' ')
              .matchAll(/(^|[;{])\s*(--[a-zA-Z0-9-]+)\s*:/g),
          ].map((m) => m[2]),
        ),
    ),
  ]
  const missing = MUST.filter((t) => !tokensCss.includes(t + ':'))
  if (missing.length) {
    console.error(`REFUSING: the token asset is missing ${missing.join(', ')}. Every var() using them would resolve to nothing on the published site.`)
    process.exit(1)
  }
  console.log(
    `tokens     ${TOKEN_FILES.join(' + ')} + ${harvested.reduce((n, h) => n + h.blocks.length, 0)} harvested :root block(s) from ` +
      `${harvested.map((h) => h.file).join(', ') || '(none)'}`,
  )
  console.log(`lossy      ${lossy.reduce((n, h) => n + h.blocks.length, 0)} declaration(s) in the cascade of the pairs the conversion is lossy on (math values, multi-layer backgrounds, properties it drops outright), from ${lossy.map((h) => h.file).join(', ') || '(none)'}`)
}

/* --- the embed blocks ------------------------------------------------------
   THE ONE THING THE CONVERSION CANNOT CARRY.

   `importHtml` treats a non-YouTube <iframe> as a forbidden custom tag and
   publishes it as an EMPTY DIV — no error, no warning, an empty box on the live
   page (memory: "Instatic iframe is a forbidden custom tag"). The practice's Go
   High Level form is an iframe plus the vendor's script, so it cannot travel
   that way.

   The route that works is the Embed block from workflow 18
   (`brandklout.embed-origins`, installed and enabled on this instance): a plugin
   module whose snippet mode emits the paste VERBATIM into the published page,
   and whose server half widens that page's CSP — and only that page's — so the
   vendor's script and frame are allowed. Both halves are needed: the block
   without the policy publishes markup the CSP then blocks.

   So the static build carries the real iframe inside a marked slot, the
   conversion reduces it to the empty div it always would, and here the slot's
   children are replaced by ONE module node carrying the same snippet from
   ghl-form.mjs. The slot keeps its own id, class and parent, so the page's CSS
   still lays it out.

   If the plugin is ever uninstalled, a page carrying this node publishes
   `<!-- instatic: unknown module -->` in its place. That is why `embeds` is
   verified below rather than assumed. */
const EMBEDS = {
  'ghl-form': {
    props: {
      source: 'snippet',
      snippet: GHL_SNIPPET,
      url: '',
      title: GHL_NAME,
      fit: 'auto',
      height: GHL_HEIGHT,
      ratio: '16 / 9',
      lazy: true,
      allowFullscreen: false,
      allow: '',
    },
  },
}
const EMBED_MODULE_ID = 'brandklout.embed-origins.embed'
{
  let placed = 0
  for (const p of converted.pages) {
    for (const node of Object.values(p.nodes)) {
      const key = node.props?.htmlAttributes?.['data-embed']
      if (!key) continue
      const spec = EMBEDS[key]
      if (!spec) throw new Error(`${p.slug}: data-embed="${key}" has no entry in EMBEDS`)
      // Drop whatever the conversion made of the vendor markup ...
      for (const childId of node.children ?? []) delete p.nodes[childId]
      // ... and hang one module node off the slot in its place.
      const id = `ghlembed${Math.random().toString(36).slice(2, 10)}`
      p.nodes[id] = {
        id,
        moduleId: EMBED_MODULE_ID,
        props: spec.props,
        breakpointOverrides: {},
        children: [],
        classIds: [],
        parentId: node.id,
      }
      node.children = [id]
      placed++
      console.log(`embed      ${p.slug.padEnd(18)} ${key} -> ${EMBED_MODULE_ID} (${GHL_SNIPPET.length} chars, fit auto from ${GHL_HEIGHT}px)`)
    }
  }
  if (placed === 0) console.log('embed      no [data-embed] slot in the build')
  else {
    // The block is worthless if the plugin that renders it is not there.
    const installed = await api('GET', '/admin/api/cms/plugins').catch(() => null)
    const row = (installed?.plugins ?? []).find((x) => x.id === 'brandklout.embed-origins')
    if (!row || !row.enabled || row.lifecycleStatus !== 'active') {
      throw new Error(
        'brandklout.embed-origins is not installed/enabled on this instance — the Embed ' +
          'block would publish as "unknown module". Install it first (deliver/process/18-instatic-embeds).',
      )
    }
    const policy = await api('GET', '/admin/api/cms/plugins/brandklout.embed-origins/settings').catch(() => null)
    const mode = policy?.values?.embedPolicy ?? policy?.settings?.embedPolicy ?? '(unset)'
    console.log(`embed      plugin ${row.version} active, embedPolicy=${mode}`)
  }
}

/* --- read current state --------------------------------------------------- */
const { site, seq } = await getSite()
const existingPages = (await getPages()).rows ?? []

const authored = existingPages.filter((r) => {
  const nodes = r.cells?.body?.nodes ?? {}
  // The starter page setup creates has exactly one node and no children.
  return Object.keys(nodes).length > 1
})
if (authored.length > 0 && !force) {
  console.error(
    `REFUSING: ${authored.length} page(s) already carry authored content ` +
      `(${authored.map((p) => p.slug).join(', ')}).\n` +
      `replace mode would delete them. Re-run with --force only if that is intended.`,
  )
  process.exit(1)
}

/* --- build the payload ---------------------------------------------------- */
const now = Date.now()

/* --- survive the publish-time tree shake ---------------------------------
   `styleRuleTreeShake.ts` drops registry rules at publish:
     - a CLASS rule survives iff its id appears in some `node.classIds`;
     - an AMBIENT rule survives iff no class token in its selector is a known
       class-kind rule name that is unused.

   Every class this site adds at RUNTIME — `is-solid`, `is-open`, `is-active`,
   `is-revealed`, and `js` on <html> — appears in no static markup, so each is
   an unused class-kind rule. That purges the rule itself AND, worse, every
   ambient rule that so much as mentions it. Six rules of the form
   `.navbar_component:not(.is-solid):not(.is-static) .navbar_link` went with
   `is-solid`, which is why the first styled publish had a navbar in the wrong
   colour over the hero photograph.

   Demoting an unassigned class rule to `kind: 'ambient'` makes it and every
   selector mentioning it survive — this is exactly what `--cutover` does in
   15-instatic-api-sync. The selectors are already complete and correct
   (`.navbar_component.is-solid`), so nothing else has to change.

   Done generically rather than from a hard-coded list: any class the markup
   does not carry is by definition runtime-or-dead, and either way belongs in
   the ambient layer.

   EXCEPT the Client-First spacing utilities (2026-09-29). Demoted, `.margin-top`
   and friends appear in the editor's class picker only under "Ambient selectors",
   greyed "Doesn't match this element", and cannot be put on an element. They are
   standalone rules no script adds, so they stay class-kind as long as no OTHER
   rule's selector mentions them: an unused one is then purged at publish (it
   styles nothing, so that is harmless) and a used one survives. */
const KEEP_CLASS = /^(margin|padding|spacer)-[a-z0-9-]+$/
{
  const usedClassIds = new Set()
  for (const p of converted.pages) {
    for (const node of Object.values(p.nodes)) {
      for (const id of node.classIds ?? []) usedClassIds.add(id)
    }
  }
  const rules = Object.values(converted.styleRules)
  const mentionedElsewhere = (rule) => {
    const token = new RegExp(`\\.${rule.name.replace(/[-]/g, '\\-')}(?![\\w-])`)
    return rules.some((r) => r !== rule && token.test(r.selector ?? ''))
  }
  const demoted = []
  const kept = []
  for (const rule of rules) {
    if (rule.kind === 'class' && !usedClassIds.has(rule.id)) {
      if (KEEP_CLASS.test(rule.name) && !mentionedElsewhere(rule)) {
        kept.push(rule.name)
        continue
      }
      rule.kind = 'ambient'
      demoted.push(rule.name)
    }
  }
  console.log(
    `tree-shake  demoted ${demoted.length} unassigned class rule(s) to ambient` +
      (demoted.length ? `: ${demoted.slice(0, 12).join(', ')}${demoted.length > 12 ? ' …' : ''}` : ''),
  )
  console.log(`tree-shake  kept ${kept.length} spacing utility class(es) pickable: ${kept.join(', ')}`)
}

const shell = {
  ...site,
  styleRules: converted.styleRules,
  ...(converted.conditions.length ? { conditions: converted.conditions } : {}),
  files: [
    ...(site.files ?? []).filter(
      (f) => f.path !== 'src/scripts/site.js' && f.path !== 'src/styles/tokens.css',
    ),
    {
      id: nid(),
      path: 'src/styles/tokens.css',
      type: 'style',
      content: tokensCss,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nid(),
      path: 'src/scripts/site.js',
      type: 'script',
      content: siteJs,
      createdAt: now,
      updatedAt: now,
    },
  ],
  settings: {
    // `metaTitle` is stripped, not merely omitted: `...site.settings` would
    // carry forward a value saved by an earlier run and keep overriding every
    // page's title.
    ...Object.fromEntries(Object.entries(site.settings ?? {}).filter(([k]) => k !== 'metaTitle')),
    // metaTitle is deliberately NOT set.
    //
    // The publisher builds the <title> as
    //     settings.metaTitle ?? page.title ?? site.name
    // (buildDocumentMetaTags, src/core/publisher/render.ts) — a SITE-level
    // value that wins on every page. Setting it gave all seven pages the
    // identical <title>. Leaving it unset lets each page's own title through,
    // which is why `title` below carries the full SEO string.
    // THE HOME PAGE'S OWN DESCRIPTION, read from seo.json rather than typed here.
    //
    // Trap 6: `meta description` is site-level, so all eleven pages share one
    // and the per-page `seoDescription` cells sit stored and unread. That is a
    // platform limit and it is not what went wrong. What went wrong is that
    // this was a HARDCODED STRING, and when the workflow was copied to a second
    // client it came with it — every page of the med spa published
    // "Boutique facial and cosmetic surgery… Dr. Mona Stone plans and performs
    // every case herself", which is the SIBLING's surgical positioning on a
    // non-surgical site. `verify-live.mjs` does not look at descriptions and
    // `compare-live.mjs` compares rendered pages, not <head>, so nothing caught
    // it; it was found by reading the published <head> by hand.
    //
    // Deriving it means the value follows the build, and a third client that
    // copies this file cannot inherit the second one's words.
    metaDescription:
      input.pages.find((p) => p.slug === 'index')?.seoDescription ??
      (() => {
        throw new Error('no seoDescription for the index page — seo.json is missing pages.index.description')
      })(),
    language: 'en',
  },
}

// Reuse the existing row id for a slug we already have, so a re-run UPDATES a
// page rather than replacing it with a new row — page ids are what the media
// panel, the audit log and any external link point at.
const idBySlug = new Map(existingPages.filter((p) => p.slug).map((p) => [p.slug, p.id]))
const seoBySlugForTitle = Object.fromEntries(input.pages.map((p) => [p.slug, p]))
const pages = converted.pages.map((p) => ({
  id: idBySlug.get(p.slug) ?? nid(),
  // The SEO title, not the short name.
  //
  // This publisher build renders <title> from `page.title` and has no per-page
  // hook at all: the `seoTitle` / `seoDescription` cells exist on the pages
  // table and are populated below, but `buildDocumentMetaTags` never reads
  // them. Carrying the SEO string as the page title is the only way to get a
  // correct, distinct <title> per page today. The cost is that Instatic's
  // page list shows the long form, which is the better trade for a site that
  // is found through search.
  title: seoBySlugForTitle[p.slug]?.seoTitle || p.title,
  slug: p.slug,
  nodes: p.nodes,
  rootNodeId: p.rootNodeId,
}))

// Replace mode derives deletions itself and 400s if this is non-empty:
//   "replace mode derives deletions server-side — deleted*Ids must be empty"
// Any stored row not in changedPages is removed for us.
const deletedPageIds = []

const body = {
  mode: 'replace',
  site: shell,
  changedPages: pages,
  deletedPageIds,
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs: {},
  shellBaseSeq: seq,
}

const bytes = Buffer.byteLength(JSON.stringify(body))
console.log(`shell      styleRules ${Object.keys(shell.styleRules).length}, conditions ${(shell.conditions ?? []).length}, files ${shell.files.length}`)
console.log(`site.js    ${(siteJs.length / 1024).toFixed(1)}KB (bootstrap + vendor ${(vendorJs.length / 1024).toFixed(1)}KB + bundle)`)
console.log(`pages      ${pages.length} written, ${deletedPageIds.length} deleted`)
for (const p of pages) console.log(`   ${p.slug.padEnd(18)} ${Object.keys(p.nodes).length} nodes  id=${p.id}`)
console.log(`payload    ${(bytes / 1024 / 1024).toFixed(2)}MB`)

if (!apply) {
  console.log('\ndry run — re-run with --apply to write')
  process.exit(0)
}

const res = await api('PUT', '/admin/api/cms/site-document', body)
console.log('\nsaved:', JSON.stringify(res).slice(0, 200))

/* --- SEO cells -----------------------------------------------------------
   `pageToCells` maps title/slug/body/template only, so seoTitle and
   seoDescription — which ARE built-in fields on the pages table — cannot ride
   along on the Page object. They go in a second pass through the data-rows API.

   > [!WARNING]
   > `PATCH /data/rows/:id` is a **full replacement** of `cells`, not a merge:
   >     const rawCells = body.cells ?? currentRow.cells      (rows.ts)
   >     const slug = slugForTable(table, cells)
   > Sending only `{seoTitle, seoDescription}` therefore deletes title, slug
   > and body, and the derived slug becomes "". It answers 200 while doing it.
   > That is exactly what happened on the first run of this script: all seven
   > pages saved correctly and were then emptied a second later, and the site
   > published as seven blank pages with working CSS.
   >
   > Always read the row, merge, and send the WHOLE cells object back. */
const seoBySlug = Object.fromEntries(input.pages.map((p) => [p.slug, p]))
for (const p of pages) {
  const src = seoBySlug[p.slug]
  if (!src?.seoTitle) continue
  try {
    const current = await api('GET', `/admin/api/cms/data/rows/${p.id}`)
    const cells = { ...(current.row?.cells ?? current.cells ?? {}) }
    if (!cells.body || !cells.slug) {
      throw new Error(`row is missing body/slug before the merge — refusing to write`)
    }
    cells.seoTitle = src.seoTitle
    cells.seoDescription = src.seoDescription
    await api('PATCH', `/admin/api/cms/data/rows/${p.id}`, { cells })

    // Read back: this platform reports some write failures as a 200.
    const after = await api('GET', `/admin/api/cms/data/rows/${p.id}`)
    const ac = after.row?.cells ?? after.cells ?? {}
    const nodeCount = Object.keys(ac.body?.nodes ?? {}).length
    if (!ac.slug || nodeCount === 0) {
      throw new Error(`row lost content after write (slug="${ac.slug}", nodes=${nodeCount})`)
    }
    console.log(`seo  ${p.slug.padEnd(18)} ok  (${nodeCount} nodes intact)`)
  } catch (e) {
    console.log(`seo  ${p.slug.padEnd(18)} FAILED ${e.message.slice(0, 160)}`)
    process.exitCode = 1
  }
}
