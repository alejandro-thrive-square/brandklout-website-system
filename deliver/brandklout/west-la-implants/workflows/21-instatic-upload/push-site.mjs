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
import { getSite, getPages, api } from '../../tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(HERE, '.tmp')
const SITE_SRC = path.resolve(HERE, '../04-design/.tmp/site-src/dist')

const apply = process.argv.includes('--apply')
const force = process.argv.includes('--force')

const converted = JSON.parse(fs.readFileSync(path.join(TMP, 'import-out.json'), 'utf8'))
const input = JSON.parse(
  zlib.gunzipSync(fs.readFileSync(path.join(TMP, 'import-input.json.gz'))).toString('utf8'),
)

const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

/* --- site.js -------------------------------------------------------------
   NO BOOTSTRAP ON THIS SITE, AND THAT IS THE POINT.

   The sibling prepended `document.documentElement.classList.add('js')` here,
   because its build set that class from an inline `<head>` script that the
   importer strips and `39-motion.css` hid every `[data-reveal]` behind it.
   West LA Implants has no `.js` scope at all: the reveal masks key on
   `html.wz-ready`, which `js/90-boot.js` sets itself as its first statement —
   so the class arrives from the bundle on BOTH sides with nothing added here.

   Carrying the line over anyway was not free. `compare-live.mjs` compares the
   runtime scope and reported `the .js scope — local false, live true`: a class
   on the published document that the build never sets, matching no rule in
   this stylesheet, and a real (if harmless) divergence between the two copies.
   A bootstrap that no rule consumes is dead code with a false positive
   attached, so it is empty rather than deleted, with this note in its place. */
const BOOTSTRAP = ''

/* GSAP GOES IN FRONT OF site.js, ALL SIX FILES, IN THIS ORDER.

   West LA Implants vendors GSAP 3.15 into `dist/assets/gsap/` and loads the six
   files with six <head> tags, deliberately: a published Instatic page carries
   `default-src 'self'; script-src 'self'`, so a CDN is blocked outright and
   there is no custom-head field to declare one in anyway.

   **Instatic has ONE script asset for the whole site**, `src/scripts/site.js`,
   so the six tags cannot survive the import — `build-import-input.mjs` strips
   them and they are concatenated here instead.

   ORDER IS LOAD-BEARING AND FAILS QUIETLY WHEN IT IS WRONG. gsap first, then
   ScrollTrigger, then the plugins that depend on it; ScrollSmoother in
   particular reads ScrollTrigger at definition time. `js/00-runtime.js` reads
   `window.gsap && window.ScrollTrigger` at call time and GUARDS on it, so a
   reversed order does not throw — it produces a page with no smoother, no pins
   and no split headlines, which reads as a design decision.

   Draggable and InertiaPlugin are vendored but NOT loaded by the build's own
   <head>, so they are not here either: the list mirrors index.html exactly.

   The runtime registers the plugins ITSELF at the end of `js/90-boot.js`
   (`gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)` …) — deliberately,
   because registering ScrollTrigger before `document.body` exists leaves
   ScrollSmoother dead on getScrollFunc. Do NOT add a registration bootstrap. */
const VENDOR = [
  'gsap.min.js',
  'ScrollTrigger.min.js',
  'ScrollToPlugin.min.js',
  'ScrollSmoother.min.js',
  'SplitText.min.js',
  'Observer.min.js',
]
{
  // The one thing that would silently halve this bundle is a filename that
  // moved. Assert, rather than let `readFileSync` throw a bare ENOENT.
  const have = new Set(fs.readdirSync(path.join(SITE_SRC, 'assets', 'gsap')))
  const gone = VENDOR.filter((f) => !have.has(f))
  if (gone.length) {
    console.error(`REFUSING: dist/assets/gsap is missing ${gone.join(', ')}`)
    process.exit(1)
  }
  // And a tag in index.html that this list does not carry would publish a page
  // whose motion layer is missing exactly one plugin.
  const inHtml = [
    ...fs
      .readFileSync(path.join(SITE_SRC, 'index.html'), 'utf8')
      .matchAll(/<script[^>]+src="assets\/gsap\/([^"]+)"/g),
  ].map((m) => m[1])
  const missed = inHtml.filter((f) => !VENDOR.includes(f))
  if (missed.length) {
    console.error(`REFUSING: index.html loads ${missed.join(', ')} and VENDOR does not carry it.`)
    process.exit(1)
  }
}
/* --- TRAP 36: THE PUBLISHER BUNDLES THE SCRIPT ASSET AS CommonJS, AND EVERY
       UMD THEN EXPORTS TO `exports` INSTEAD OF TO `window`.

   FOUND 2026-09-10 by `verify-motion-live.mjs`, which is the only gate that
   runs the page. `window.SplitText` and `window.Observer` were **undefined on
   the published site** while `window.gsap`, `ScrollTrigger`, `ScrollToPlugin`
   and `ScrollSmoother` were all present — so the page pinned and scrubbed
   correctly and the split headlines simply never split. The reality chapter's
   nineteen words, which light one at a time as its pin scrubs, published as one
   static paragraph at full opacity. Nothing failed: `WZ.splitWords` catches and
   returns null, and the timeline then tweens the paragraph itself.

   The mechanism is visible in the published bundle. Instatic runs the code
   asset through esbuild as a CommonJS module, and esbuild REWRITES a top-level
   `this` to `exports`. Every GSAP file is a UMD that begins

       typeof exports == "object" && typeof module != "undefined" ? A(exports)
         : … : (k = globalThis, A(k.window = k.window || {}))

   and is invoked as `})(this, function (k) {…})`. Published, every one of the
   six reads `})(exports, function (k) {…})` and takes the FIRST branch: the
   library attaches itself to the module's exports object, which nothing ever
   reads, and never touches `window`.

   Four of the six survived by accident and that is why this was so quiet:
   gsap's core puts itself on `window` from the inside, and ScrollTrigger,
   ScrollToPlugin and ScrollSmoother each call `gsap.registerPlugin`, which
   re-exposes them globally. SplitText is not a gsap plugin and registers
   nothing; the standalone Observer is shadowed by ScrollTrigger's own internal
   copy (it appears in `gsap.core.globals()` as `Observer2`, which reads like
   success). So the two files with no self-registration are exactly the two that
   vanished — and ONLY a gate that scrolls the live page can see it.

   **Fix: give each file a scope where `exports`, `module` and `define` are all
   undefined, and where `this` is `window`.** The UMD's own browser branch then
   runs unchanged. Shadowing by parameter is deliberate — it cannot be defeated
   by whatever the outer bundle declares, and `.call(window, …)` restores the
   `this` esbuild rewrote. Nothing about the libraries is patched.

   AND THE GLOBAL IT IS HANDED CANNOT BE `window` ITSELF. The first version of
   this wrapper passed `window` as `this` and the whole bundle died on the first
   line of gsap with

       Cannot set property window of #<Window> which has only a getter

   because the UMD's browser branch is `t((t = t || self).window = t.window ||
   {})` — it writes `window.window`, which is an accessor with no setter. In a
   classic `<script>` that assignment fails SILENTLY, sloppy-mode style, and the
   expression still evaluates to `window`. **Instatic serves the script asset as
   `<script type="module">`, and a module is always strict**, so the same line
   throws and takes every library with it. So the shim is a plain object whose
   `window` property is writable and already IS window: the UMD writes to the
   shim, reads `window` back out, and hands the real global to the factory.

   `globalThis` and `self` are shadowed by the same object for the same reason —
   SplitText's UMD prefers `globalThis` and ignores `this` entirely, and it
   would walk straight back into `window.window`. Both names appear in these
   files ONLY in that UMD line (checked: `globalThis` twice in SplitText, `self`
   once per file, all in the prelude), so shadowing them reaches nothing else.

   `verify-motion-live.mjs` asserts all six globals now. Do not remove the
   wrapper without re-running it. */
const VENDOR_SHIM = '__wzUmdGlobal'
const vendorJs =
  `/* The UMD shim — see the note in push-site.mjs. NOT window itself: a module\n` +
  `   is strict, and \`window.window = …\` throws there. */\n` +
  `var ${VENDOR_SHIM} = { window: window };\n` +
  VENDOR.map(
    (f) =>
      `/* ---- ${f} ---- */\n` +
      `;(function (exports, module, define, globalThis, self) {\n` +
      fs.readFileSync(path.join(SITE_SRC, 'assets', 'gsap', f), 'utf8') +
      `\n}).call(${VENDOR_SHIM}, void 0, void 0, void 0, ${VENDOR_SHIM}, ${VENDOR_SHIM});\n`,
  ).join('\n')
const siteJs =
  BOOTSTRAP +
  '/* ---- GSAP, concatenated by push-site.mjs: Instatic has one script asset. ---- */\n' +
  vendorJs +
  '\n;\n/* ---- site.js ---- */\n' +
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
const TOKEN_FILES = ['00-fluid-root.css', '01-tokens.css', '03-runtime.css', '05-site-review.css']
const CSS_SRC = path.resolve(HERE, '../04-design/.tmp/site-src/css')

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
  /* The comma-layered background LONGHANDS go in too, added 2026-09-10 for West
     LA Implants after `css-parity.mjs` reported `.in-fields select
     {background-position}` missing. The select's dropdown arrow is drawn as two
     gradient triangles, so `background-image`, `background-position` and
     `background-size` are each two comma-separated layers; only the image half
     was covered, and half a layered background is not a smaller bug than none
     of it — the two triangles land on top of each other in the wrong corner. */
  const LAYERABLE = /^(?:background|background-image|background-position(?:-x|-y)?|background-size|background-repeat|mask|mask-image|mask-position|mask-size|-webkit-mask-image)$/

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
  /* `font-variation-settings` is added for West LA Implants, PRE-EMPTIVELY. All
     three faces here are variable woff2 and `.display` / `.h2` set `opsz` by
     hand; if the converter does not know the property, the headline publishes
     at the default optical size and looks like a slightly different typeface
     rather than like a dropped declaration. It costs one line in the asset and
     `css-parity.mjs` confirms it either way. */
  const DROPPED = /^(?:scroll-behavior|scroll-padding(?:-|$)|scroll-margin(?:-|$)|-webkit-text-size-adjust|text-size-adjust|overscroll-behavior(?:-|$)|font-variation-settings$)/

  /* TWO MORE VALUE SHAPES, both found by `css-parity.mjs` on West LA Implants'
     first publish. The pattern is trap 21's: the engine that decides what
     survives is happy-dom's, not a browser's, and what it rejects is a matter
     of fact rather than of reasoning — so the gate names them and they are
     added here.

     `!important`. `02-base.css` kills every animation under
     `prefers-reduced-motion` with
     `*,*::before,*::after{animation-duration:.001ms!important; …}`. All three
     declarations were dropped; `scroll-behavior:auto!important` in the same
     rule survived only because `DROPPED` had already claimed the property.
     A site whose reduced-motion escape hatch is silently gone still passes
     every other gate, because no gate has ever run with the preference set.

     VIEWPORT-RELATIVE UNITS OF THE svh/lvh/dvh FAMILY. `.pr-pin{height:100svh}`
     published without a height, which on a PINNED section is not a cosmetic
     loss — it is the pin's own measurement. `.an-pin{min-height:100svh}` in the
     same stylesheet survived, exactly as trap 21 says: `min-height` keeps what
     `height` rejects, and there is no rule to infer. Cover the unit wherever it
     appears rather than the one property that happened to be caught. */
  const IMPORTANT = /!\s*important/i
  const NEWVIEWPORT = /\b\d*\.?\d+(?:s|l|d)v(?:h|w|b|i|min|max)\b/i

  const isLossy = (prop, value) =>
    (MATH.test(value) && !SAFE.test(value)) ||
    (LAYERABLE.test(prop) && layers(value) > 1) ||
    IMPORTANT.test(value) ||
    NEWVIEWPORT.test(value) ||
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

/* --- AND THE THREE @font-face RULES ---------------------------------------
   WEST LA IMPLANTS ONLY. The sibling put its typefaces into Instatic's own font
   library with `install-fonts.mjs` and let the publisher emit the @font-face
   rules; `build-import-input.mjs` excised them from the payload and asserted
   none survived.

   That road is closed here. Instatic's installer downloads Google's STATIC
   instances and silently ignores `font-variation-settings`, and all three faces
   in this build are VARIABLE woff2: Bodoni Moda at `font-weight: 400 900`
   upright and italic, Manrope at `200 800`, with `.display` and `.h2` setting
   an `opsz` axis by hand. Installed statically the headline loses its optical
   size and every weight between the named cuts, and NOTHING FAILS — the family
   name still resolves and the page renders in a nearby weight.

   So the woff2 files are uploaded as ordinary media (`font/woff2` is an
   accepted mime; see upload-media.mjs) and the rules travel here, in the code
   asset, verbatim and never parsed by happy-dom — the same road the tokens
   take, for the same reason. `url('../fonts/x.woff2')` is rewritten to the
   uploaded `/uploads/…` path, because a RELATIVE url() in published CSS
   resolves against `/_instatic/css/` and 404s invisibly (trap 14).

   Read from the SOURCE file rather than the bundle, so the block that lands
   here is the block a human wrote. */
const fontFaces = (() => {
  const src = fs.readFileSync(path.join(CSS_SRC, '01-tokens.css'), 'utf8')
  const mediaMap = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map.json'), 'utf8')).map
  const blocks = [...src.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0])
  if (!blocks.length) {
    console.error('REFUSING: no @font-face rules in 01-tokens.css. The three variable faces would fall back to Georgia.')
    process.exit(1)
  }
  const out = blocks.map((b) =>
    b.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, _q, ref) => {
      if (/^(data:|https?:|\/)/.test(ref)) return whole
      // `../fonts/manrope-var.woff2` from site-src/css/ -> the media-map key.
      const key = ref.replace(/^\.\.\//, '')
      const hit = mediaMap[key] ?? mediaMap[path.basename(ref)]
      if (!hit) {
        console.error(`REFUSING: @font-face url(${ref}) has no media-map entry. Upload the woff2 with upload-media.mjs first.`)
        process.exit(1)
      }
      return `url("${hit.url}")`
    }),
  )
  /* Extract each url() and test its TARGET. Written as a lookahead first —
     `/url\(\s*['"]?(?!\/|https?:|data:)/` — which is wrong in a way worth
     recording: `['"]?` is optional, so on `url("/uploads/…")` the engine
     backtracks it to empty, finds `"` in front of the lookahead, sees that a
     quote is not a slash, and reports a perfectly rewritten rule as relative.
     An optional group in front of a negative lookahead always has that escape. */
  for (const b of out) {
    for (const m of b.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
      if (!/^(data:|https?:|\/)/.test(m[2])) {
        console.error(`REFUSING: a relative url(${m[2]}) survived the @font-face rewrite:\n${b}`)
        process.exit(1)
      }
    }
  }
  console.log(`fonts      ${out.length} @font-face rule(s) into the token asset, pointing at /uploads (variable woff2, not Instatic's static instances)`)
  return out.join('\n')
})()

const tokensCss =
  `/* Token primitives, pushed as a code asset by push-site.mjs.\n` +
  `   These CANNOT live in the style registry: happy-dom drops --custom-property\n` +
  `   declarations during conversion, silently. Edit site-src/css/ and re-push. */\n\n` +
  `/* ===== @font-face, rewritten to the uploaded variable woff2 ===== */\n` +
  fontFaces +
  '\n\n' +
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

/* The token asset is the one payload here nobody can read back without
   publishing, and three of this workflow's worst defects were in it. Write it
   to `.tmp/tokens.css` on every run, dry or not, so it can be diffed and read
   BEFORE it is live. */
fs.writeFileSync(path.join(TMP, 'tokens.css'), tokensCss)

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
   the ambient layer. */
{
  const usedClassIds = new Set()
  for (const p of converted.pages) {
    for (const node of Object.values(p.nodes)) {
      for (const id of node.classIds ?? []) usedClassIds.add(id)
    }
  }
  const demoted = []
  for (const rule of Object.values(converted.styleRules)) {
    if (rule.kind === 'class' && !usedClassIds.has(rule.id)) {
      rule.kind = 'ambient'
      demoted.push(rule.name)
    }
  }
  console.log(
    `tree-shake  demoted ${demoted.length} unassigned class rule(s) to ambient` +
      (demoted.length ? `: ${demoted.slice(0, 12).join(', ')}${demoted.length > 12 ? ' …' : ''}` : ''),
  )
}

/* --- TRAP 35: `base.video` KEEPS NINE PROPS AND THROWS THE REST OF THE TAG AWAY
   FOUND 2026-09-10, on this build's first publish, by reading the published
   HTML. Two `<video>` elements went in and this came out:

       <video class="ar-film">        <video>

   No `id`, no `poster`, no `src`, no `data-src`, no `aria-label`, no `muted`,
   no `loop`, no `playsinline`. Both films were a blank black box, and nothing
   failed: `verify-live.mjs` checks the assets the markup references and the
   markup referenced none.

   THIS IS TRAP 22 (`<input type=range>` publishes as `type=text`) IN ITS
   GENERAL FORM, and it is worth stating that way. `importHtml` maps a tag onto
   a MODULE, and a typed module has a FIXED PROP SCHEMA: `base.video` is
   `{videoUrl, poster, autoplay, loop, muted, controls, playsinline, preload,
   title, noRelatedVideos}` and there is nowhere for anything else to go — the
   importer does not even park the leftovers in `htmlAttributes`. A plain
   `<div>` or `<section>` keeps every attribute it arrived with (this page's 8
   `data-chapter`s, 9 `data-anim`s and 50 ids all published untouched), because
   those map to `base.container`, whose whole schema is `{tag, customTag,
   htmlAttributes}`.

   **So the escape hatch is base.container, and the platform itself uses it.**
   `rules.ts` maps a non-YouTube `<iframe>` to
   `{ moduleId: 'base.container', props: { tag: 'custom', customTag: 'iframe' } }`
   with the comment "so their src/attributes are preserved via htmlAttributes".
   A `<video>` driven by a script rather than by the Properties panel wants
   exactly that treatment, so it is given it here: the node is re-pointed at
   `base.container` and the ORIGINAL tag's attributes are restored verbatim from
   the payload `build-import-input.mjs` shipped — which is the post-rewrite
   markup, so every path is already a `/uploads/…` URL.

   Doing it here rather than in the markup is deliberate. The alternative was to
   ship a `<div data-video>` and have the boot script build the element, the way
   `12-elevate.js` builds the med spa's range input — but that puts an
   Instatic-shaped compromise into a static build that renders perfectly without
   one, and it costs the `<video>` its poster on first paint. Restoring the tag
   at import time keeps `site-src/` honest and keeps LOCAL AND PUBLISHED
   IDENTICAL, which is what every gate downstream assumes.

   Paired in DOCUMENT ORDER, walked from the root rather than read off
   `Object.keys(nodes)`, because the insertion order of a node map is an
   implementation detail of the importer and pairing the wrong film with the
   wrong poster would look like nothing at all. */
{
  const VIDEO_TAG_RE = /<video\b[^>]*>/g
  const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  // class and style are the module's own business (classIds carries the class,
  // and the registry carries the style); the platform refuses them by name.
  const RESERVED = new Set(['class', 'style'])
  let revived = 0
  for (const p of converted.pages) {
    const html = input.pages.find((x) => x.slug === p.slug)?.html ?? ''
    const tags = html.match(VIDEO_TAG_RE) ?? []

    // Document order, from the root down.
    const order = []
    const walk = (id) => {
      const n = p.nodes[id]
      if (!n) return
      if (n.moduleId === 'base.video') order.push(n)
      for (const c of n.children ?? []) walk(c)
    }
    walk(p.rootNodeId)

    if (order.length !== tags.length) {
      console.error(
        `REFUSING: ${p.slug} has ${order.length} base.video node(s) but ${tags.length} <video> tag(s) in the payload. ` +
          `Pairing by position would put the wrong film in the wrong place.`,
      )
      process.exit(1)
    }
    for (let i = 0; i < order.length; i++) {
      const node = order[i]
      const attrs = {}
      for (const m of tags[i].slice('<video'.length, -1).matchAll(ATTR_RE)) {
        const name = m[1].toLowerCase()
        if (RESERVED.has(name)) continue
        // A boolean attribute (`muted`, `loop`, `playsinline`) has no value and
        // renders as `muted=""`, which is true in HTML.
        attrs[name] = m[2] ?? m[3] ?? m[4] ?? ''
      }
      node.moduleId = 'base.container'
      node.props = { tag: 'custom', customTag: 'video', htmlAttributes: attrs }
      revived++
    }
  }
  console.log(
    `video      ${revived} <video> restored as base.container[customTag=video] with every attribute ` +
      `(base.video keeps nine props and drops id, data-src and the rest — see the note above)`,
  )
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
    /* THE FAVICON, which is the only console error a clean publish otherwise
       has. `buildDocumentMetaTags` emits `<link rel=icon>` from this SITE-level
       field and from nothing else (trap 31), so without it every page answers
       404 for `/favicon.ico` and the tab shows a generic mark.
       The med spa left it empty on purpose — that brand had no logo and an
       invented favicon would have read as a proposed mark. This one does: the
       practice's own icon ships in the build as `media/img/logo-icon-dark.png`
       and is already in the media library, so this is the client's mark, not a
       new one. Read from the media map rather than pasted, so a re-upload that
       changes the id cannot leave a dead link here. */
    faviconUrl: (() => {
      const m = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map.json'), 'utf8')).map
      const hit = m['media/img/logo-icon-dark.png']
      if (!hit) throw new Error('logo-icon-dark.png is not in media-map.json — run upload-media.mjs')
      return hit.url
    })(),
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
console.log(`site.js    ${(siteJs.length / 1024).toFixed(1)}KB (GSAP ${(vendorJs.length / 1024).toFixed(1)}KB + site bundle)`)
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
  /* A NESTED SLUG IS NEVER PATCHED THROUGH /data/rows. `blog/x` serves nested
     after a site-document write, but ANY PATCH /data/rows on that row
     re-derives the slug through slugForTable and flattens the route to
     `/blog-x` until the row is re-saved through site-document. The SEO cells
     are stored-but-unread by this publisher anyway (trap 6), so the journal
     entries skip the pass rather than lose their routes. */
  if (p.slug.includes('/')) {
    console.log(`seo  ${p.slug.padEnd(18)} skipped (nested slug; a rows PATCH would flatten the route)`)
    continue
  }
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
