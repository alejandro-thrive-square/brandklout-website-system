#!/usr/bin/env node
/**
 * render-page.mjs — fill the slotted template with a topic's content.
 *
 *   node render-page.mjs <topic>
 *
 * Reads  _shared/page-template.tokens.html + content/<topic>.json
 * Writes 04-design/.tmp/v2/<topic>/index.html   (the local version the Webflow
 *        page is graded against) and a body-only fragment for the builder.
 *
 * Fails loudly on an unfilled slot: a `{{…}}` shipping to production is the
 * kind of thing that survives every structural gate and is caught by a client.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V1 = path.resolve(HERE, '../../../04-design/.tmp/v1');
const topic = process.argv[2];
// kind: ads (default) | consult | ty — each has its own template and content file.
const kind = process.argv[3] || 'ads';
if (!topic) { console.log('usage: render-page.mjs <topic> [ads|consult|ty]'); process.exit(1); }
const TEMPLATE = { ads: 'page-template.tokens.html', consult: 'consult-template.tokens.html', ty: 'thankyou-template.tokens.html' }[kind];
const SUFFIX = { ads: '', consult: '.consult', ty: '.ty' }[kind];
if (!TEMPLATE) { console.log('kind must be ads, consult or ty'); process.exit(1); }

const tpl = fs.readFileSync(path.join(V1, '_shared', TEMPLATE), 'utf8');

// `_base.json` holds the practice-wide facts every page repeats — header, proof
// bar, Dr Bennett, footer, image assets, the real reviews. A topic file carries
// only what differs, and overrides the base where it needs to. Keeping the
// shared facts in one place is also what stops six pages drifting apart on a
// credential or a phone number.
const basePath = path.join(V1, 'content', '_base.json');
const base = fs.existsSync(basePath) ? JSON.parse(fs.readFileSync(basePath, 'utf8')) : {};
const topicContent = JSON.parse(fs.readFileSync(path.join(V1, 'content', `${topic}${SUFFIX}.json`), 'utf8'));
const content = { ...base, ...topicContent };

/**
 * Repeatable blocks: `{{#faq}} … {{.q}} … {{/faq}}` renders once per item of
 * the array at `content.faq`, with `{{.field}}` reading that item.
 *
 * Needed because the carried-over sections are not fixed length — the v1 FAQ
 * runs 6 items on emergency and 10 on all-on-x — and a fixed-slot template
 * would silently truncate the difference.
 */
let expanded = tpl;
for (const m of tpl.matchAll(/\{\{#([\w-]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g)) {
  const [whole, name, inner] = m;
  const rows = content[name];
  if (!Array.isArray(rows)) {
    console.log(`template repeats "${name}" but content has no array for it`);
    process.exit(1);
  }
  const out = rows.map((row) =>
    inner.replace(/\{\{\.([\w-]+)\}\}/g, (_, f) => {
      if (!(f in row)) { console.log(`repeat "${name}": item is missing "${f}"`); process.exit(1); }
      return String(row[f]);
    })).join('');
  expanded = expanded.split(whole).join(out);
}

const needed = [...new Set([...expanded.matchAll(/\{\{([^}#/.][^}]*)\}\}/g)].map((m) => m[1]))];

const missing = needed.filter((k) => !(k in content));

// An unused key in the TOPIC file is very likely a typo — the slot it meant to
// fill is silently left to the base. An unused key in `_base.json` is expected:
// the consult and thank-you templates are leaner than the ads-landing one and
// use only part of the shared set.
const repeats = new Set([...tpl.matchAll(/\{\{#([\w-]+)\}\}/g)].map((m) => m[1]));
const extra = Object.keys(topicContent).filter((k) => !k.startsWith('_') && !needed.includes(k) && !repeats.has(k));

if (missing.length) {
  console.log(`${missing.length} slot(s) have no content in ${topic}.json:`);
  for (const k of missing) console.log('  ' + k);
}
if (extra.length) {
  console.log(`${extra.length} key(s) in ${topic}.json match no slot (typo?):`);
  for (const k of extra) console.log('  ' + k);
}
if (missing.length || extra.length) process.exit(1);

let html = expanded;
for (const [k, v] of Object.entries(content)) {
  if (k.startsWith('_') || Array.isArray(v)) continue;
  html = html.split(`{{${k}}}`).join(String(v));
}

const left = [...html.matchAll(/\{\{([^}]+)\}\}/g)];
if (left.length) { console.log('UNFILLED SLOTS REMAIN: ' + left.map((m) => m[1]).join(', ')); process.exit(1); }

const outDir = path.join(V1, topic + SUFFIX.replace(/^\./, '-'));
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'body.html'), html);

// A standalone local page, so the design can be reviewed and diffed offline.
const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${content['_title'] || topic}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700&family=Noto+Serif:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../_shared/camp.css">
<link rel="stylesheet" href="../_shared/camp-convert.css">
<link rel="stylesheet" href="../_shared/camp-sections.css">
<style>
/* Marvel's real faces. Noto Serif carries every heading and Karla every piece of
   UI text on marveldentaldds.com, and both are already installed in the Webflow
   site, so the local preview and the built page share metrics. Without them the
   page falls back to system fonts, text wraps differently, and anything sized by
   content lands somewhere else than it does live.
   NB: no backticks in this block, it lives inside a template literal. */
body { font-family: Karla, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.65; color: #222222; background-color: #ffffff; }

/* Webflow's own normalize, only the parts that change geometry. Without these
   the local page renders content-box with an 8px body margin while the Webflow
   page is border-box with none — so every padded element is wider locally by
   its own padding, and a local-vs-live spacing comparison is meaningless.
   This lives in the local page shell, NOT in camp.css: bare-tag selectors
   merge site-wide in Webflow and the linter rightly refuses them. */
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; }
img { max-width: 100%; vertical-align: middle; display: inline-block; }
h1, h2, h3, p, figure, blockquote { margin: 0; }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; color: inherit; margin: 0; }
</style>
</head>
<body>
${html}
</body>
</html>
`;
fs.writeFileSync(path.join(outDir, 'index.html'), page);

console.log(`${topic}: ${needed.length} slots filled -> ${path.relative(process.cwd(), outDir)}/index.html`);
