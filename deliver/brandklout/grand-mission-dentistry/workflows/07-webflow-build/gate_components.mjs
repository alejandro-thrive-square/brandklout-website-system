/**
 * gate_components.mjs — structural gate over every extracted component
 * (PASTEABLE-COMPONENTS.md "Gates"): per component,
 *   - exactly ONE root node (a multi-root payload crashes the Designer);
 *   - complete style closure (every node class + combo child resolves);
 *   - ZERO relative asset refs anywhere in the payload;
 *   - every HtmlEmbed under 10,000 chars (the Designer's paste limit — the
 *     API takes 50k but these are pasted by hand);
 *   - the section scripts survived the split (WZ.add present where the
 *     manifest says scripted);
 *   - PASTE.html exists and its payload block round-trips.
 *
 * Usage: node gate_components.mjs .tmp/components
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.tmp/components';
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
let fails = 0;
const fail = (dir, msg) => { fails++; console.log(`FAIL  ${dir}: ${msg}`); };

for (const m of manifest) {
  const dir = path.join(root, m.dir);
  const doc = JSON.parse(fs.readFileSync(path.join(dir, 'final.json'), 'utf8'));
  const p = doc.payload;

  const referenced = new Set();
  for (const n of p.nodes) for (const c of n.children || []) referenced.add(c);
  const roots = p.nodes.filter((n) => !referenced.has(n._id));
  if (roots.length !== 1) fail(m.dir, `${roots.length} roots`);

  const styleIds = new Set(p.styles.map((s) => s._id));
  for (const n of p.nodes) {
    for (const c of n.classes || []) {
      if (!styleIds.has(c)) { fail(m.dir, `node references missing style ${c}`); break; }
    }
  }
  for (const s of p.styles) {
    for (const kid of s.children || []) {
      if (!styleIds.has(kid)) { fail(m.dir, `style ${s.name} references missing combo child`); break; }
    }
  }

  const rel = (JSON.stringify(doc).match(/["'(]assets\//g) || []).length;
  if (rel) fail(m.dir, `${rel} relative asset refs`);

  const embeds = p.nodes.filter((n) => n.type === 'HtmlEmbed');
  for (const e of embeds) {
    const len = (e.v || '').length;
    if (len >= 10000) fail(m.dir, `embed ${len} chars >= Designer 10k paste limit`);
    const metaLen = (e.data?.embed?.meta?.html || '').length;
    if (metaLen >= 10000) fail(m.dir, `embed meta.html ${metaLen} chars >= 10k`);
  }

  const scripted = embeds.some((e) => /WZ\.add|WZ\.onReady/.test(e.v || ''));
  if (m.scripted && !scripted) fail(m.dir, 'manifest says scripted but no WZ embed found');

  const pastePath = path.join(dir, 'PASTE.html');
  if (!fs.existsSync(pastePath)) fail(m.dir, 'PASTE.html missing');
  else {
    const html = fs.readFileSync(pastePath, 'utf8');
    const mm = html.match(/<script type="application\/json" id="payload">([\s\S]*?)<\/script>/);
    if (!mm) fail(m.dir, 'PASTE.html payload block missing');
    else {
      try {
        const rt = JSON.parse(mm[1]);
        if (rt.payload.nodes.length !== p.nodes.length) fail(m.dir, 'PASTE.html node count differs');
      } catch (e) { fail(m.dir, 'PASTE.html payload does not parse: ' + e.message); }
    }
    if (!html.includes("setData('application/json'")) fail(m.dir, 'PASTE.html missing application/json copy path');
  }

  const maxEmbed = embeds.reduce((a, e) => Math.max(a, (e.v || '').length), 0);
  console.log(`ok    ${m.dir.padEnd(28)} [${m.kind}] nodes=${p.nodes.length} styles=${p.styles.length} ` +
    `assets=${(p.assets || []).length} embeds=${embeds.length} maxEmbed=${maxEmbed}${m.scripted ? ' scripted' : ''}`);
}

console.log(fails ? `\n${fails} FAILURES` : `\nall ${manifest.length} components pass the structural gate`);
process.exit(fails ? 1 : 0);
