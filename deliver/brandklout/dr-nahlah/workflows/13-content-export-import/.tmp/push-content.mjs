#!/usr/bin/env node
/**
 * push-content.mjs — push the client's content corrections to Instatic.
 *
 * Each entry names the sentence as it stands on Instatic (`was`) and as it
 * stands in the local build (`now`). The node is located on Instatic by `was`,
 * and the replacement HTML is lifted from the LOCAL build by `now` rather than
 * hand-typed, so any <strong>/<em>/<a> inside the sentence comes across exactly
 * as designed instead of being flattened to plain text.
 *
 * `href` is set separately where a link target changed too: the markup carries
 * the local build's relative path (`all-on-4.html#thin-arch`) and Instatic
 * serves path style (`/all-on-4#thin-arch`), so it is rewritten on the way in.
 *
 * Text nodes take a { text } props patch; container nodes take replace_node_html.
 * A write whose response is a bare { text } message is a failure, whatever it says.
 */
import fs from 'node:fs';
import path from 'node:path';
import { callJson } from './instatic-mcp.mjs';
import { parseNodes, inner, textOf, findDeepest } from './lib-nodes.mjs';

const HERE = import.meta.dirname;
const SNAP = path.join(HERE, '.instatic');
const LOCAL = path.resolve(HERE, '..', '..', '04-design', '.tmp', 'final-site');

const EDITS = [
  { slug: 'about',
    was: 'An in-house digital lab for prosthesis fabrication',
    now: 'An in-house digital lab in each of the two practices' },
  { slug: 'about',
    was: 'Computer-guided surgery means smaller incisions and shorter recovery. An in-house lab means fewer visits',
    now: 'Computer-guided implant surgery means smaller incisions and shorter' },

  { slug: 'crowns-and-bridges',
    was: 'Designed and milled here', now: 'Designed and milled in both offices' },

  { slug: 'dental-implants',
    was: 'The gold standard when a whole arch has failed.',
    now: 'The gold standard when a whole arch has failed, and planned as a thin FP1' },
  { slug: 'dental-implants',
    was: 'IV-sedation certified, with hospital privileges at Inova Fairfax.',
    now: 'IV-sedation certified, with an anaesthesiologist for oral and IV cases.' },

  { slug: 'doctor-referral',
    was: 'Design and fabrication', now: 'In both practices' },
  { slug: 'doctor-referral',
    was: 'Design, milling and firing in the in-house digital laboratory, which is what removes',
    now: 'Design, milling and firing in the in-house digital laboratory, one in each' },

  { slug: 'our-facility',
    was: 'Digital laboratory', now: 'Digital lab in both offices' },
  { slug: 'our-facility',
    was: 'Computer-guided surgery', now: 'Computer-guided implant surgery' },
  { slug: 'our-facility',
    was: 'The implant position is planned on the scan and placed through a guide.',
    now: 'Every implant position is planned on the scan and placed through a printed guide,' },
  { slug: 'our-facility',
    was: 'Prostheses are designed on site by a lab designer on staff,',
    now: 'Both practices have one. Prostheses are designed on site by a lab designer' },

  { slug: 'our-team',
    was: 'And because the digital lab is in the building, the person designing',
    now: 'And because each office has its own digital lab, the person designing' },

  { slug: 'sedation-dentistry',
    was: 'Hospital privileges: Level 1 trauma', now: 'Present for oral and IV cases' },
  { slug: 'sedation-dentistry',
    was: 'Inova Fairfax', now: 'Anaesthesiologist' },
  { slug: 'sedation-dentistry',
    was: 'Plenty of practices refer sedation out. Dr. Nahlah holds an',
    now: 'Plenty of practices refer sedation out. Dr. Nahlah holds an' },

  { slug: 'veneers',
    was: 'hand-designed to your lip line, your gum line and your own colouring.',
    now: 'hand-designed to your lip line, your gum line and your own colouring, and prepared minimally,' },
  { slug: 'veneers', was: 'Enamel removed', now: 'Minimally invasive prep' },
  { slug: 'veneers',
    was: 'Two appointments, and a lab in the building.',
    now: 'A minimally invasive prep, and a lab in the building.' },
  { slug: 'veneers', was: 'Preparation', now: 'Minimally invasive preparation' },
  { slug: 'veneers',
    was: 'so the veneer sits flush and feels like a tooth rather than a layer stuck on one.',
    now: 'so the veneer sits flush and feels like a tooth rather than a layer stuck on one. Enamel does not grow back,' },
  { slug: 'veneers',
    was: 'Impressions of the prepared teeth go to the laboratory, where each veneer',
    now: 'The prepared teeth are scanned, and each veneer is hand-designed in the' },
];

/** Instatic serves path-style URLs; the local build links to .html files. */
const fixLinks = (html) => html
  .replace(/href="index\.html"/g, 'href="/"')
  .replace(/href="([a-z0-9-]+)\.html(#[a-z0-9-]+)?"/gi, (m, p, h) => `href="/${p}${h || ''}"`);

const snap = new Map();
for (const f of fs.readdirSync(SNAP).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(SNAP, f), 'utf8'));
  snap.set(d.slug, { ...d, nodes: parseNodes(d.html) });
}
const localCache = new Map();
function localDoc(slug) {
  if (!localCache.has(slug)) {
    const html = fs.readFileSync(path.join(LOCAL, `${slug}.html`), 'utf8');
    localCache.set(slug, { html, nodes: parseNodes(html) });
  }
  return localCache.get(slug);
}

let ok = 0;
const problems = [];

for (const e of EDITS) {
  const s = snap.get(e.slug);
  if (!s) { problems.push(`${e.slug}: no snapshot`); continue; }
  const target = findDeepest(s.html, s.nodes, e.was);
  if (!target) { problems.push(`${e.slug}: instatic node not found for "${e.was.slice(0, 60)}"`); continue; }

  const l = localDoc(e.slug);
  const source = findDeepest(l.html, l.nodes, e.now, { requireUid: false });
  if (!source) { problems.push(`${e.slug}: local node not found for "${e.now.slice(0, 60)}"`); continue; }

  const html = fixLinks(inner(l.html, source)).replace(/\s+/g, ' ').trim();
  if (!html) { problems.push(`${e.slug}: empty replacement for "${e.now.slice(0, 60)}"`); continue; }

  try {
    const r = await callJson('site_replace_node_html', { nodeId: target.uid, html });
    if (r && typeof r.text === 'string') {
      if (!/does not accept children/i.test(r.text)) throw new Error(r.text.slice(0, 140));
      const r2 = await callJson('site_update_node_props', { nodeId: target.uid, patch: { text: html } });
      if (!r2 || r2.ok !== true) throw new Error(`props patch rejected: ${JSON.stringify(r2).slice(0, 140)}`);
    }
    const back = (await callJson('site_get_node_html', { nodeId: target.uid })).html ?? '';
    const plain = back.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
    const wantWord = e.now.replace(/<[^>]+>/g, '').split(' ').slice(0, 6).join(' ');
    if (!plain.includes(wantWord.split(' ').slice(0, 4).join(' '))) {
      throw new Error(`read-back does not contain "${wantWord.slice(0, 40)}"`);
    }
    ok++;
    console.log(`  ${e.slug.padEnd(20)} ${target.uid} <${target.tag}> ok`);
  } catch (err) {
    problems.push(`${e.slug} ${target.uid}: ${err.message.slice(0, 170)}`);
  }
}

console.log(`\n${ok}/${EDITS.length} applied`);
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
