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

function build(props, isPreview) {
  var mode = decode(props.source) === 'snippet' ? 'snippet' : 'url'
  var fit = fitOf(props)
  var ratio = ratioOf(props)
  var height = num(props.height, 600)
  var styles = []
  if (fit === 'ratio') styles.push('--wz-embed-ratio:' + escape(ratio.replace(/\s+/g, '')))

  if (mode === 'snippet') {
    var snippet = decode(props.snippet).trim()
    if (snippet.length === 0) {
      return isPreview
        ? { html: placeholder('Embed — paste the vendor snippet in the properties panel'), css: CSS }
        : { html: '<!-- instatic: embed not configured -->' }
    }
    /* Verbatim, by design: see the header. In the CANVAS this markup is mounted
       with dangerouslySetInnerHTML, which never executes <script> — so a
       script-driven widget looks empty there and is fine once published. Say so
       rather than letting someone conclude the block is broken. */
    var note = isPreview && /<script/i.test(snippet)
      ? placeholder('Snippet contains a script — scripts never run in the canvas. Publish to see it.')
      : ''
    return { html: wrapper(fit, ratio, styles, note + snippet), css: CSS }
  }

  var f = frame(props, fit, height)
  if (f.length === 0) {
    return isPreview
      ? { html: placeholder('Embed — paste a URL in the properties panel'), css: CSS }
      : { html: '<!-- instatic: embed not configured -->' }
  }
  return { html: wrapper(fit, ratio, styles, f), css: CSS }
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
  version: '1.0.0',
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

  /* The canvas needs a different answer in exactly two cases — an unconfigured
     block (publish must emit nothing, the editor must show something to click)
     and a script snippet (which cannot run under innerHTML). */
  preview: function (props) {
    return build(props, true)
  },
}

export default [EMBED]
