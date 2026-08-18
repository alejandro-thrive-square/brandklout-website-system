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
const V2 = path.resolve(HERE, '../../../04-design/.tmp/v2');
const topic = process.argv[2];
// kind: ads (default) | consult | ty — each has its own template and content file.
const kind = process.argv[3] || 'ads';
if (!topic) { console.log('usage: render-page.mjs <topic> [ads|consult|ty]'); process.exit(1); }
const TEMPLATE = { ads: 'page-template.tokens.html', consult: 'consult-template.tokens.html', ty: 'thankyou-template.tokens.html' }[kind];
const SUFFIX = { ads: '', consult: '.consult', ty: '.ty' }[kind];
if (!TEMPLATE) { console.log('kind must be ads, consult or ty'); process.exit(1); }

const tpl = fs.readFileSync(path.join(V2, '_shared', TEMPLATE), 'utf8');

// `_base.json` holds the practice-wide facts every page repeats — header, proof
// bar, Dr Bennett, footer, image assets, the real reviews. A topic file carries
// only what differs, and overrides the base where it needs to. Keeping the
// shared facts in one place is also what stops six pages drifting apart on a
// credential or a phone number.
const basePath = path.join(V2, 'content', '_base.json');
const base = fs.existsSync(basePath) ? JSON.parse(fs.readFileSync(basePath, 'utf8')) : {};
const topicContent = JSON.parse(fs.readFileSync(path.join(V2, 'content', `${topic}${SUFFIX}.json`), 'utf8'));
const content = { ...base, ...topicContent };

const needed = [...new Set([...tpl.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]))];

const missing = needed.filter((k) => !(k in content));

// An unused key in the TOPIC file is very likely a typo — the slot it meant to
// fill is silently left to the base. An unused key in `_base.json` is expected:
// the consult and thank-you templates are leaner than the ads-landing one and
// use only part of the shared set.
const extra = Object.keys(topicContent).filter((k) => !k.startsWith('_') && !needed.includes(k));

if (missing.length) {
  console.log(`${missing.length} slot(s) have no content in ${topic}.json:`);
  for (const k of missing) console.log('  ' + k);
}
if (extra.length) {
  console.log(`${extra.length} key(s) in ${topic}.json match no slot (typo?):`);
  for (const k of extra) console.log('  ' + k);
}
if (missing.length || extra.length) process.exit(1);

let html = tpl;
for (const [k, v] of Object.entries(content)) {
  if (k.startsWith('_')) continue;
  html = html.split(`{{${k}}}`).join(String(v));
}

const left = [...html.matchAll(/\{\{([^}]+)\}\}/g)];
if (left.length) { console.log('UNFILLED SLOTS REMAIN: ' + left.map((m) => m[1]).join(', ')); process.exit(1); }

const outDir = path.join(V2, topic + SUFFIX.replace(/^\./, '-'));
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'body.html'), html);

// A standalone local page, so the design can be reviewed and diffed offline.
const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${content['_title'] || topic}</title>
<link rel="stylesheet" href="../_shared/camp.css">
</head>
<body>
${html}
</body>
</html>
`;
fs.writeFileSync(path.join(outDir, 'index.html'), page);

console.log(`${topic}: ${needed.length} slots filled -> ${path.relative(process.cwd(), outDir)}/index.html`);
