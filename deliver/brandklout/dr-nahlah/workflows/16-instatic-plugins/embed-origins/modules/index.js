/**
 * Embed Origins — canvas module pack.
 *
 * Ships ONE module, `webzite.embed-origins.embed`, so a developer (or anyone
 * with editor access) can place a third-party embed BY HAND: insert the block,
 * paste a URL or the vendor's snippet in the Properties Panel, publish. No
 * script, no code asset, no agent.
 *
 * This is the second half of the plugin. The first half (server/index.js)
 * widens the published page's CSP from operator-typed settings; without it a
 * frame placed here is refused by the browser. Deliberately two halves: the
 * block is content, the allowlist is a security decision, and `moduleAdapter.ts`
 * drops a plugin module's `cspSources` anyway, so a module could not grant
 * itself the origin even if we wanted it to.
 *
 * ## Two contexts, two prop shapes — the reason `norm()` exists
 *
 * `render()` is called from two places with DIFFERENT prop values:
 *
 *   - the PUBLISHER (`src/core/publisher/renderNode.ts`) runs `escapeProps()`
 *     first (Constraint #211). It dispatches on the declared control type:
 *     `url`/`image`/`media` props are scheme-checked and passed through raw,
 *     and EVERYTHING ELSE is `escapeHtml()`'d. The plugin control vocabulary
 *     (`src/core/plugin-sdk/modules.ts`) has no `richtext` or `svg` type, so a
 *     `textarea` snippet arrives as `&lt;iframe …&gt;` and would publish as
 *     visible literal markup;
 *   - the EDITOR canvas (`pluginModuleComponentFactory.tsx`) calls
 *     `preview() ?? render()` with the RAW props straight from the store.
 *
 * So every text prop is normalised through `norm()` — decode entities, then
 * escape once. Idempotent, and identical in both contexts. `snippet` is the one
 * prop that is decoded and NOT re-escaped: emitting markup is its entire job.
 *
 * ## The canvas gets a CARD, never the embed (v1.1.0)
 *
 * `preview()` no longer emits the frame or the snippet. It returns a static
 * description of the block — mode, destination host(s), height rule — sized to
 * the box the block will occupy, and nothing else.
 *
 * Rendering the real thing on the canvas was never worth what it cost, in both
 * modes and for different reasons:
 *
 *   - a URL-mode iframe DOES load in the editor (the admin CSP sets no
 *     `frame-src`), so the vendor's widget booted inside the canvas — third
 *     party requests, cookie banners and all — and then sat at its START height
 *     forever, because the auto-height runtime is a `render()` output and never
 *     ships to the canvas. A widget that publishes at 1800px showed as a 600px
 *     box with its own scrollbar;
 *   - a snippet is mounted with `dangerouslySetInnerHTML`, so its `<script>`
 *     never runs and what appears is the vendor's *undressed* markup — the bare
 *     divs a bundle was supposed to fill — while any `<style>` or `<link>` in
 *     the same paste leaks OUT of the module and restyles the editor around it.
 *
 * Neither is a preview of the published page, so neither is worth showing. The
 * card is: it is the same in both modes, costs no third-party request, cannot
 * leak styles, and states in words what publishing will produce. The published
 * output is unchanged — `render()` does not know this function exists.
 *
 * ## Why emitting a raw snippet is not a new hole
 *
 * The published CSP still decides what runs. It carries `script-src 'self'
 * '<importmap-sha>'` with no `'unsafe-inline'`, and this plugin's settings only
 * accept ORIGINS (`ORIGIN_RE` in server/index.js), so a pasted snippet's inline
 * `<script>` and its `onclick=` handlers are refused by the browser. A vendor's
 * `<script src>` runs only when an operator has typed that origin into the
 * script-src box, which is the same explicit decision it was before this module
 * existed. Anyone who can edit a page here can already ship a site-wide code
 * asset, so this widens no authority.
 *
 * ## Auto height
 *
 * `fit: 'auto'` emits the module runtime (served as
 * `/_instatic/module-js/webzite.embed-origins.embed.js`, requires the plugin's
 * granted `frontend.assets`). It sizes a frame from the resize message the
 * frame posts — the same mechanism the hand-written Dr. Nahlah reviews widget
 * uses, generalised. Frames are matched by `e.source === frame.contentWindow`,
 * never by origin string, so two widgets from the same vendor cannot resize
 * each other and no allowlist has to be maintained here.
 *
 * Requires: modules.register (+ frontend.assets for the auto-height runtime)
 */

/* ---------------------------------------------------------------------------
 * String helpers. Written in the conservative style of server/index.js: this
 * pack also executes inside the QuickJS-WASM sandbox on the publish path.
 * ------------------------------------------------------------------------ */

var ESCAPES = [
  ['&lt;', '<'],
  ['&gt;', '>'],
  ['&quot;', '"'],
  ['&#x27;', "'"],
  ['&#39;', "'"],
]

/**
 * Reverse `escapeHtml()`. `&amp;` is decoded LAST so that an author who typed
 * a literal `&amp;lt;` gets `&lt;` back rather than a `<` they never wrote.
 */
function decode(value) {
  if (typeof value !== 'string' || value.length === 0) return ''
  var out = value
  for (var i = 0; i < ESCAPES.length; i++) {
    out = out.split(ESCAPES[i][0]).join(ESCAPES[i][1])
  }
  return out.split('&amp;').join('&')
}

function escape(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Normalise a text prop to exactly-once-escaped, whichever context called us.
 * Decode-then-escape is idempotent, so the publisher's already-escaped value
 * and the canvas's raw value both land on the same output.
 */
function norm(value) {
  return escape(decode(value))
}

/**
 * Scheme guard for the frame `src`.
 *
 * The publisher already ran `isSafeUrl()` on `url`-typed props, but the CANVAS
 * did not — and an embed frame has no business pointing anywhere but http(s)
 * in either context. Control characters are stripped the way the WHATWG URL
 * parser strips them, so `javascript:` cannot read as safe here and
 * resolve as script in the browser.
 */
function safeSrc(value) {
  var raw = decode(value)
    .replace(/^[\u0000-\u0020]+/, '')
    .replace(/[\u0000-\u0020]+$/, '')
    .replace(/[\u0009\u000A\u000D]/g, '')
  if (raw.length === 0) return ''
  var scheme = raw.match(/^([a-zA-Z][a-zA-Z0-9+\-.]*):/)
  if (scheme) {
    var s = scheme[1].toLowerCase()
    if (s !== 'http' && s !== 'https') return ''
  }
  return escape(raw)
}

/**
 * Host of a URL, for the canvas card. Deliberately a regex and not `new URL()`:
 * this pack also has to parse under QuickJS, and a half-typed URL must degrade
 * to something readable rather than throw.
 */
function hostOf(value) {
  var raw = decode(value).replace(/^[\u0000-\u0020]+/, '')
  var m = raw.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/([^/?#]+)/)
  if (m) return m[1]
  m = raw.match(/^([^/?#\s]+)/)
  return m ? m[1] : ''
}

/** "1 iframe + 2 scripts" — what a paste actually contains. */
function snippetShape(snippet) {
  var bits = []
  var frames = snippet.match(/<iframe\b/gi)
  var scripts = snippet.match(/<script\b/gi)
  if (frames) bits.push(frames.length + (frames.length === 1 ? ' iframe' : ' iframes'))
  if (scripts) bits.push(scripts.length + (scripts.length === 1 ? ' script' : ' scripts'))
  return bits.length ? bits.join(' + ') : 'HTML'
}

/**
 * The hosts a snippet reaches for. Shown on the card because they are exactly
 * what has to appear in this plugin's settings for the paste to work once
 * published — the one thing the editor cannot discover by looking at it.
 */
function hostsIn(snippet) {
  var out = []
  var re = /\b(?:src|href|data-src)\s*=\s*["']?(https?:\/\/[^"'\s>]+)/gi
  var m = re.exec(snippet)
  while (m) {
    var h = hostOf(m[1])
    if (h.length && out.indexOf(h) === -1) out.push(h)
    if (out.length >= 3) return out
    m = re.exec(snippet)
  }
  return out
}

function num(value, fallback) {
  var n = parseInt(String(value === null || value === undefined ? '' : value).replace(/[^0-9-]/g, ''), 10)
  return isNaN(n) || n <= 0 ? fallback : n
}

var RATIOS = ['16 / 9', '4 / 3', '1 / 1', '3 / 4', '9 / 16']

function fitOf(props) {
  var fit = decode(props.fit)
  return fit === 'fixed' || fit === 'ratio' ? fit : 'auto'
}

function ratioOf(props) {
  var r = decode(props.ratio)
  for (var i = 0; i < RATIOS.length; i++) if (RATIOS[i] === r) return r
  return RATIOS[0]
}

/* ---------------------------------------------------------------------------
 * Markup
 * ------------------------------------------------------------------------ */

var CSS = [
  '.wz-embed{position:relative;width:100%;max-width:100%}',
  '.wz-embed>iframe{display:block;width:100%;border:0}',
  '.wz-embed[data-wz-embed="ratio"]>iframe{height:100%;position:absolute;inset:0}',
  '.wz-embed[data-wz-embed="ratio"]{aspect-ratio:var(--wz-embed-ratio,16/9)}',
  '.wz-embed-note{font:500 12px/1.5 system-ui,sans-serif;letter-spacing:.02em;',
  'padding:10px 12px;border:1px dashed currentColor;border-radius:6px;opacity:.65}',
  /* The canvas card. Everything below is EDITOR-ONLY: `render()` never emits a
     [data-wz-embed-card] element, so a published page gets none of these rules
     matching anything. They ship on the published page all the same — the CSS
     string is per module type, not per call — which is a few hundred bytes and
     keeps the two paths from needing two stylesheets. */
  '.wz-embed[data-wz-embed-card]{display:flex;align-items:center;justify-content:center;',
  'box-sizing:border-box;overflow:hidden;padding:12px;text-align:center;',
  'border:1px dashed currentColor;border-radius:6px;opacity:.65}',
  '.wz-embed-card{display:flex;flex-direction:column;gap:3px;max-width:100%;',
  'font:500 12px/1.5 system-ui,sans-serif;letter-spacing:.02em}',
  '.wz-embed-card-kind{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}',
  '.wz-embed-card-to{font-size:13px;word-break:break-all}',
  '.wz-embed-card-meta{opacity:.75}',
].join('')

/**
 * The wrapper is the ROOT element and carries NO author-supplied text.
 * `injectClassIntoRootElement` (publisher/classInjection.ts) rewrites the first
 * tag with a `[^>]*` attribute scan, which assumes no `>` inside an attribute
 * value — true only while the root's attributes stay machine-generated. Author
 * text (title, allow, the snippet) goes INSIDE.
 */
function wrapper(fit, ratio, styles, inner) {
  var style = styles.length ? ' style="' + styles.join(';') + '"' : ''
  var rat = fit === 'ratio' ? ' data-wz-embed-ratio="' + escape(ratio) + '"' : ''
  return '<div class="wz-embed" data-wz-embed="' + fit + '"' + rat + style + '>' + inner + '</div>'
}

function frame(props, fit, height) {
  var src = safeSrc(props.url)
  if (src.length === 0) return ''
  var attrs = ' src="' + src + '"'
  attrs += ' title="' + (norm(props.title) || 'Embedded content') + '"'
  attrs += ' loading="' + (props.lazy === false ? 'eager' : 'lazy') + '"'
  attrs += ' referrerpolicy="strict-origin-when-cross-origin"'
  if (props.allowFullscreen) attrs += ' allowfullscreen'
  var allow = norm(props.allow)
  if (allow.length) attrs += ' allow="' + allow + '"'
  if (fit === 'fixed') attrs += ' style="height:' + height + 'px"'
  else if (fit === 'auto') attrs += ' style="height:' + height + 'px"'
  return '<iframe' + attrs + '></iframe>'
}

function placeholder(text) {
  return '<div class="wz-embed-note">' + escape(text) + '</div>'
}

/** How the block's height is decided, said in the words the control uses. */
function fitLabel(fit, ratio, height) {
  if (fit === 'fixed') return 'Fixed ' + height + 'px'
  if (fit === 'ratio') return 'Aspect ratio ' + ratio
  return 'Auto height, from ' + height + 'px'
}

/**
 * The canvas stand-in. Same root shape as `wrapper()` — machine-generated
 * attributes only, author text strictly INSIDE — so `injectClassIntoRootElement`
 * still lands an author class on it and the block stays selectable, resizable
 * and stylable in the editor exactly as before.
 *
 * `data-wz-embed` is kept so the editor gate's `[data-wz-embed], .wz-embed-note`
 * probe still finds a placed block; `data-wz-embed-card` is what tells the two
 * apart. The box is sized to what will publish (fixed height, aspect ratio, or
 * the auto starting height as a minimum) so the page around it lays out
 * honestly, which is the one thing rendering the live embed actually bought.
 */
function card(fit, ratio, styles, kind, to, meta) {
  var s = styles.slice(0)
  if (fit === 'fixed') s.push('height:' + meta.height + 'px')
  else if (fit === 'auto') s.push('min-height:' + meta.height + 'px')
  var style = s.length ? ' style="' + s.join(';') + '"' : ''
  var rat = fit === 'ratio' ? ' data-wz-embed-ratio="' + escape(ratio) + '"' : ''
  var inner = '<div class="wz-embed-card">'
  inner += '<span class="wz-embed-card-kind">' + escape(kind) + '</span>'
  if (to.length) inner += '<span class="wz-embed-card-to">' + escape(to) + '</span>'
  inner += '<span class="wz-embed-card-meta">' + escape(meta.text) + '</span>'
  inner += '<span class="wz-embed-card-meta">Appears when the page is published</span>'
  inner += '</div>'
  return '<div class="wz-embed" data-wz-embed="' + fit + '" data-wz-embed-card="1"' +
    rat + style + '>' + inner + '</div>'
}

function build(props, isPreview) {
  var mode = decode(props.source) === 'snippet' ? 'snippet' : 'url'
  var fit = fitOf(props)
  var ratio = ratioOf(props)
  var height = num(props.height, 600)
  var styles = []
  if (fit === 'ratio') styles.push('--wz-embed-ratio:' + escape(ratio.replace(/\s+/g, '')))

  var meta = { height: height, text: fitLabel(fit, ratio, height) }

  if (mode === 'snippet') {
    var snippet = decode(props.snippet).trim()
    if (snippet.length === 0) {
      return isPreview
        ? { html: placeholder('Embed — paste the vendor snippet in the properties panel'), css: CSS }
        : { html: '<!-- instatic: embed not configured -->' }
    }
    if (isPreview) {
      /* The hosts are the useful half: they are exactly what has to be listed
         in the plugin's settings for this paste to survive the published CSP,
         and no amount of staring at the markup on the canvas would say so. */
      var hosts = hostsIn(snippet)
      return {
        html: card(fit, ratio, styles, 'HTML snippet',
          hosts.length ? hosts.join(', ') : '', {
            height: height,
            text: snippetShape(snippet) + ' · ' + meta.text,
          }),
        css: CSS,
      }
    }
    /* Verbatim, by design: see the header. */
    return { html: wrapper(fit, ratio, styles, snippet), css: CSS }
  }

  var src = safeSrc(props.url)
  if (src.length === 0) {
    return isPreview
      ? { html: placeholder('Embed — paste a URL in the properties panel'), css: CSS }
      : { html: '<!-- instatic: embed not configured -->' }
  }
  if (isPreview) {
    return { html: card(fit, ratio, styles, 'Embed', hostOf(props.url), meta), css: CSS }
  }
  return { html: wrapper(fit, ratio, styles, frame(props, fit, height)), css: CSS }
}

/* ---------------------------------------------------------------------------
 * Published runtime — auto height only.
 * ------------------------------------------------------------------------ */

var RUNTIME = [
  '(function(){',
  'function px(f,h){if(h>0){f.style.height=h+"px"}}',
  'function height(d){',
  'if(!d)return 0;',
  /* LeadConnector / HighLevel post `["lc.setHeight",{height,widgetId}]`. */
  'if(Object.prototype.toString.call(d)==="[object Array]"){',
  'return d[1]&&d[1].height?parseInt(d[1].height,10):0}',
  'if(typeof d==="string"){',
  'if(d.charAt(0)!=="{"&&d.charAt(0)!=="[")return 0;',
  'try{return height(JSON.parse(d))}catch(e){return 0}}',
  'if(typeof d==="object"){',
  'var h=d.height!=null?d.height:(d.value!=null?d.value:0);',
  'return parseInt(h,10)||0}',
  'return 0}',
  'window.addEventListener("message",function(e){',
  'var h=height(e.data);if(!(h>0))return;',
  /* Match on the WINDOW, never the origin: two widgets from one vendor share an
     origin, and matching by string would let either resize the other. */
  'var list=document.querySelectorAll(\'[data-wz-embed="auto"]>iframe\');',
  'for(var i=0;i<list.length;i++){',
  'if(list[i].contentWindow===e.source){px(list[i],h)}}',
  '},false)',
  '})()',
].join('')

/* ---------------------------------------------------------------------------
 * Definition
 * ------------------------------------------------------------------------ */

var EMBED = {
  id: 'webzite.embed-origins.embed',
  name: 'Embed',
  description:
    'Place a third-party embed by hand: paste a URL, or the vendor snippet. The origin must also be allowed in this plugin\'s settings, and the page republished.',
  category: 'Media',
  version: '1.1.0',
  htmlTag: 'div',
  canHaveChildren: false,

  schema: {
    source: {
      type: 'select',
      label: 'Source',
      description: 'A URL is built into a sandboxed iframe here. Snippet emits the vendor markup verbatim.',
      options: [
        { label: 'URL', value: 'url' },
        { label: 'HTML snippet', value: 'snippet' },
      ],
    },
    url: {
      type: 'url',
      label: 'Embed URL',
      description: 'The vendor\'s iframe URL. http(s) only. Its origin must be listed under Allowed iframe origins in this plugin\'s settings.',
    },
    snippet: {
      type: 'textarea',
      rows: 8,
      label: 'HTML snippet',
      placeholder: '<iframe src="https://vendor.example/widget/abc"></iframe>',
      description: 'Pasted verbatim. Inline scripts and on* handlers are refused by the page CSP; a vendor <script src> runs only if its origin is in Allowed script origins.',
    },
    title: {
      type: 'text',
      label: 'Frame title',
      description: 'Announced by screen readers. URL mode only.',
      placeholder: 'Patient reviews',
    },
    fit: {
      type: 'select',
      label: 'Height',
      description: 'Auto listens for the resize message the widget posts. Fixed and ratio need no cooperation from the vendor.',
      options: [
        { label: 'Auto (widget reports its height)', value: 'auto' },
        { label: 'Fixed height', value: 'fixed' },
        { label: 'Aspect ratio', value: 'ratio' },
      ],
    },
    height: {
      type: 'number',
      label: 'Height (px)',
      min: 40,
      max: 20000,
      step: 10,
      unit: 'px',
      description: 'The fixed height, or the starting height before a widget reports its own.',
    },
    ratio: {
      type: 'select',
      label: 'Aspect ratio',
      options: [
        { label: '16 : 9', value: '16 / 9' },
        { label: '4 : 3', value: '4 / 3' },
        { label: '1 : 1', value: '1 / 1' },
        { label: '3 : 4', value: '3 / 4' },
        { label: '9 : 16', value: '9 / 16' },
      ],
    },
    lazy: { type: 'toggle', label: 'Lazy load' },
    allowFullscreen: { type: 'toggle', label: 'Allow fullscreen' },
    allow: {
      type: 'text',
      label: 'Permissions (allow attribute)',
      description: 'Optional, e.g. "clipboard-write; encrypted-media". Leave empty unless the vendor asks for it.',
    },
  },

  defaults: {
    source: 'url',
    url: '',
    snippet: '',
    title: '',
    fit: 'auto',
    height: 600,
    ratio: '16 / 9',
    lazy: true,
    allowFullscreen: false,
    allow: '',
  },

  render: function (props) {
    var out = build(props, false)
    /* The runtime is per-module-TYPE and deduped by the publisher, so it ships
       once for the page as soon as ANY embed on it asks for auto height. */
    if (out.css && fitOf(props) === 'auto') out.js = RUNTIME
    return out
  },

  /* The canvas never gets the embed itself — see "The canvas gets a CARD" at
     the top of this file. It gets a static description of the block, in the box
     the block will occupy. No third-party request, no undressed vendor markup,
     no leaked <style>, and no auto-height runtime to be missing. */
  preview: function (props) {
    return build(props, true)
  },
}

export default [EMBED]
