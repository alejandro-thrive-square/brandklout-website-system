/**
 * emit.mjs — namespacing and output for build.mjs.
 *
 * The pages ship on a Webflow site that keeps its own 330 KB stylesheet, and
 * 49 of this design's 122 class names already exist there (.hero, .btn,
 * .quiz, .faq, .step, .field, .wrap ...). So every class is prefixed `aq-`,
 * in the stylesheet, the markup and the two scripts alike, and the local
 * pages carry the prefix too: what is reviewed and gated locally is
 * byte-for-byte what goes to Webflow.
 *
 * Two outputs from one source:
 *   local     <page>.html + assets/          (open in a browser, verify.mjs)
 *   webflow   ../../../07-webflow-build/.tmp/aox-quiz/out/<key>.{head,embed,footer}.html
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const NS = 'aq-';
const IDENT = /\.(-?[a-zA-Z_][\w-]*)/g;

export const nsSelector = (s) => s.replace(IDENT, '.' + NS + '$1');
const nsClassAttr = (s) => s.replace(/class="([^"]*)"/g, (_, v) =>
  'class="' + v.split(/\s+/).filter(Boolean).map((c) => NS + c).join(' ') + '"');

/** Class selectors everywhere except inside comments. */
function nsCss(css) {
  return css.split(/(\/\*[\s\S]*?\*\/)/).map((part, i) => (i % 2 ? part : nsSelector(part))).join('');
}

/** class="" attributes inside template strings, selector literals, classList and className. */
function nsJs(code, label) {
  let out = nsClassAttr(code);
  out = out.replace(/(querySelector(?:All)?|closest)\((['"])((?:(?!\2).)*)\2\)/g, (m, fn, q, sel) => `${fn}(${q}${nsSelector(sel)}${q})`);
  out = out.replace(/classList\.(toggle|add|remove|contains)\('([\w-]+)'/g, (m, fn, c) => `classList.${fn}('${NS}${c}'`);
  out = out.replace(/className = '([\w-]+)'/g, (m, c) => `className = '${NS}${c}'`);
  // Anything that still looks like a bare class selector literal was missed.
  const missed = out.match(/['"]\.(?!aq-)[a-zA-Z][\w-]*['"]/g);
  if (missed) throw new Error(`${label}: un-namespaced selector literal(s) ${missed.join(' ')}`);
  return out;
}

/* The host stylesheet styles bare tags the design never had to undo
   (li margins, label weight, blockquote type, gold underlined links). Each
   rule here has the specificity of a single tag, so it beats the host only by
   coming later and loses to every class rule in the design. */
const RESET = `/* Host-stylesheet neutralisers: bare-tag rules the Webflow site declares. */
:where(.${NS}root) h1,:where(.${NS}root) h2,:where(.${NS}root) h3{margin:0;color:inherit}
:where(.${NS}root) p{margin:0}
:where(.${NS}root) ul,:where(.${NS}root) ol{margin:0;padding:0}
:where(.${NS}root) li{margin:0;padding:0}
:where(.${NS}root) label{margin:0;font-weight:inherit}
:where(.${NS}root) figure{margin:0}
:where(.${NS}root) blockquote{font-size:inherit;line-height:inherit}
:where(.${NS}root) a{color:inherit}
:where(.${NS}root) button{font-family:inherit}
:where(.${NS}root) img{vertical-align:baseline}
:where(.${NS}root) sup{position:static;top:auto;font-size:smaller;vertical-align:super}
`;

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n{2,}/g, '\n').trim();

export function emit({ HERE, css, js, pageJs, fontCss, pages }) {
  const nCss = RESET + nsCss(css);
  const nJs = nsJs(js, 'aox-quiz.js');
  const nPageJs = nsJs(pageJs, 'aox-page.js');

  const log = (name, text) => console.log(`  ${name}  ${text.length} bytes`);
  const put = (dir, name, text) => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, name), text); log(name, text); };

  /* ---- local ---- */
  put(join(HERE, 'assets'), 'brand-fonts.css', fontCss);
  put(join(HERE, 'assets'), 'aox-quiz.css', nCss + '\n');
  put(join(HERE, 'assets'), 'aox-quiz.js', nJs + '\n');
  put(join(HERE, 'assets'), 'aox-page.js', nPageJs);

  /* ---- webflow ---- */
  const WF = join(HERE, '../../../07-webflow-build/.tmp/aox-quiz/out');
  const manifest = {};

  for (const p of pages) {
    const markup = `<div class="${NS}root">\n${nsClassAttr(p.markup)}\n</div>`;
    const local = (m) => m;                                         // local files sit side by side
    const site = (m) => m.split(`data-thank-you="${p.thanksLocal}"`).join(`data-thank-you="${p.thanksSite}"`);

    put(HERE, p.file, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.title}</title>
<meta name="description" content="${p.description}">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="light">
<link rel="preconnect" href="https://cdn.prod.website-files.com" crossorigin>
<link rel="stylesheet" href="assets/brand-fonts.css">
<link rel="stylesheet" href="assets/aox-quiz.css">
</head>
<body>

${local(markup)}

<script src="assets/aox-page.js"></script>
${p.quiz ? '<script src="assets/aox-quiz.js"></script>\n' : ''}</body>
</html>
`);

    // Webflow: the stylesheet in the page head, the markup in one Embed, the
    // scripts in the page footer. The site already serves the brand fonts.
    const head = `<meta name="robots" content="noindex">\n<style>\n${stripComments(nCss)}\n</style>`;
    const footer = `<script>\n${nPageJs.trim()}\n</script>` + (p.quiz ? `\n<script>\n${nJs.trim()}\n</script>` : '');
    put(WF, `${p.key}.head.html`, head);
    put(WF, `${p.key}.embed.html`, site(markup));
    put(WF, `${p.key}.footer.html`, footer);
    for (const [part, text] of [['head', head], ['embed', site(markup)], ['footer', footer]])
      if (text.length > 50000) throw new Error(`${p.key}.${part} is ${text.length} chars; Webflow custom code blocks hold 50,000`);
    manifest[p.key] = { slug: p.slug, title: p.title.replace(/&amp;/g, '&'), description: p.description, quiz: p.quiz };
  }
  put(WF, 'manifest.json', JSON.stringify(manifest, null, 1) + '\n');
}
