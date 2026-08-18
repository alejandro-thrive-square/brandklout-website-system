#!/usr/bin/env node
/**
 * push-wfsync2.mjs — the markup half of the Webflow sync on Instatic.
 *
 * Runs after push-wfsync.mjs has uploaded the photographs and written
 * gallery-paths.json.
 *
 * Two things this has to work around:
 *  - `site_insert_html` STRIPS <script>, so the review widget's loader cannot
 *    ride in the markup. It ships as a `script` code asset instead; without it
 *    the iframe renders at a default height and never resizes to its content.
 *  - The new CSS goes in the runtime-states.css code asset, not through
 *    site_apply_css, because Instatic strips "unused" registry CSS at publish.
 */
import fs from 'node:fs';
import path from 'node:path';
import { callJson } from './instatic-mcp.mjs';

const P = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'gallery-paths.json'), 'utf8'));
const ALT = [
  'The reception desk, with the Dr. Nahlah wordmark above a marble counter and cream and gold waiting chairs',
  'A consultation room with a round table, two upholstered chairs and a monitor',
  'The corridor between treatment rooms, lined with gold arch detailing',
  'A treatment room with the dental chair, overhead light and chairside monitor',
  'The preparation corridor, with instrument cabinetry along one wall',
];

const problems = [];
let ok = 0;
const step = async (label, fn) => {
  try { await fn(); ok++; console.log(`  ${label}`); }
  catch (e) { problems.push(`${label}: ${e.message.slice(0, 200)}`); }
};
async function write(uid, html) {
  const r = await callJson('site_replace_node_html', { nodeId: uid, html });
  if (r && typeof r.text === 'string') {
    if (!/does not accept children/i.test(r.text)) throw new Error(r.text.slice(0, 150));
    if (/<[a-z]/i.test(html)) throw new Error('text node but replacement carries markup');
    const r2 = await callJson('site_update_node_props', { nodeId: uid, patch: { text: html } });
    if (!r2 || r2.ok !== true) throw new Error('props patch rejected');
  }
}

const film = (vid, title, cls = 'st-film') =>
  `<div class="${cls}"><iframe src="https://www.youtube.com/embed/${vid}" loading="lazy" title="${title}" `
  + 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '
  + 'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>';

// ---------------------------------------------------------------- chapter 02
await step('ch02 comparison heading', () =>
  write('DIQRqTU9v445HZcuBi1OM', 'Why patients travel to see Dr. Nahlah.'));
await step('ch02 column headers', () =>
  write('TWSc3-14gqtHUD5E_uVSP',
    '<span class="vs-us" role="columnheader">Here</span>'
    + '<span class="vs-mid" aria-hidden="true" role="columnheader">vs</span>'
    + '<span class="vs-them" role="columnheader">Elsewhere</span>'));

// ---------------------------------------------------------------- chapter 07
await step('ch07 story film', () =>
  write('ABh8K9tg7FGLK9aRB3kVX',
    film('HiNtywrb4Yg', 'Melanie tells her full-arch implant story', 'pf-embed')));
await step('ch07 rating 4.9', () => write('0kHvFxI02oY8Hdr_Gop5g', '4.9'));
await step('ch07 review widget replaces the six cards', () =>
  write('GYl5tHOuQWrTZMPYSQTGW',
    '<iframe class="lc_reviews_widget" title="Patient reviews" '
    + 'src="https://reputationhub.site/reputation/widgets/review_widget/xJDu1mFoW5jFYTNqmuk7?widgetId=6a7340db2bbe7819cc3536f4" '
    + 'frameborder="0" scrolling="no" style="min-width:100%;width:100%"></iframe>'));
// the grid node keeps its id but is no longer a grid; give it the embed's class
await step('ch07 review container reclassed', async () => {
  const r = await callJson('site_update_node_props',
    { nodeId: 'GYl5tHOuQWrTZMPYSQTGW', patch: { className: 'rv-embed' } });
  if (!r || r.ok !== true) throw new Error(JSON.stringify(r).slice(0, 140));
});

// ---------------------------------------------------------------- chapter 08
await step('ch08 heading', () =>
  write('CiotccDWZpJuNDmzkVP8i', 'A Space Designed For Your Comfort.'));
await step('ch08 gallery inserted', async () => {
  const imgs = P.map((src, i) =>
    `<img class="iv-shot${i === 0 ? ' iv-shot-wide' : ''}" src="${src}" loading="lazy" alt="${ALT[i]}">`).join('');
  const r = await callJson('site_insert_html', {
    parentId: 'H-OHP0EAYgHlMuR-tTM4M', index: 2,
    html: `<div class="iv-gallery">${imgs}</div>`,
  });
  if (r && typeof r.text === 'string' && !/ok/i.test(r.text)) throw new Error(r.text.slice(0, 150));
});

console.log(`\n${ok}/9 steps`);
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
