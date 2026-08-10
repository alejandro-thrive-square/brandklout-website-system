#!/usr/bin/env node
/**
 * build_head_blocks.mjs — produce the re-themed site head and the three page
 * head blocks by PATCHING what the site actually serves, not by regenerating
 * from the `_js/` artifacts.
 *
 * Source Asana task GID: 1217040406855582
 *
 * WHY PATCH RATHER THAN REGENERATE
 * --------------------------------
 * `_js/site-head.html` is what an earlier build INTENDED to install; the live
 * block has since gained the body base size and the whole sub-479 reading
 * tier, and lost nothing. Regenerating from the artifact would silently revert
 * both. `dump_custom_code.mjs` fetches the live blocks; this patches them.
 *
 * Every replacement asserts it matched. A re-theme that quietly no-ops on one
 * rule is exactly the failure this whole pass exists to undo.
 *
 *   node build_head_blocks.mjs <liveDir> <outDir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [liveDir, outDir] = process.argv.slice(2);
if (!liveDir || !outDir) {
  console.error('usage: build_head_blocks.mjs <liveDir> <outDir>');
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

/** Replace `find` exactly once, or throw naming what was being changed. */
function sub(text, find, replace, what) {
  const parts = text.split(find);
  if (parts.length !== 2) {
    throw new Error(`${what}: expected exactly 1 occurrence of ${JSON.stringify(String(find).slice(0, 60))}, found ${parts.length - 1}`);
  }
  return parts[0] + replace + parts[1];
}

const readLive = (name) => {
  const d = JSON.parse(fs.readFileSync(path.join(liveDir, `${name}.json`), 'utf8'));
  return Object.fromEntries(d.result.map((b) => [b.location, b.content]));
};

// The moodboard's type system, as the design package's own @import states it.
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Inter:wght@400;500;600&display=swap';

// ---------------------------------------------------------------- site head
{
  const live = readLive('site')['head'];
  let out = live;

  // 1. Fonts. Fraunces for display, Inter for everything else.
  const linkRe = /<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet">/;
  const m = out.match(linkRe);
  if (!m) throw new Error('site head: no Google Fonts <link> found');
  out = sub(out, m[0], `<link href="${FONT_URL}" rel="stylesheet">`, 'site head font link');

  // 2. Body base. Webflow's own stylesheet sets 14px, so this is load-bearing.
  out = sub(out, 'font-size:1.0625rem;line-height:1.65}', 'font-size:1.125rem;line-height:1.65}',
    'site head body base size');

  // 3. The sub-479 reading tier: its class lists moved with the type scale.
  const tier = fs.readFileSync(path.join(HERE, '_js', 'reading-tier.css'), 'utf8').trim();
  const start = out.indexOf('@media (max-width:478px){');
  const end = out.indexOf('\n/* Pre-paint guard');
  if (start === -1 || end === -1 || end <= start) throw new Error('site head: reading tier block not located');
  out = out.slice(0, start) + tier + out.slice(end);

  // 4. Runtime state that carries palette values.
  out = sub(out, 'border-bottom-color:#dfe4e6', 'border-bottom-color:rgba(32, 36, 42, 0.12)',
    'site head is-solid hairline');
  out = sub(out, 'rgba(27,34,36,.5)', 'rgba(32, 36, 42, 0.5)', 'site head is-solid shadow');

  fs.writeFileSync(path.join(outDir, 'site.head.html'), out, 'utf8');
  console.log(`site head: ${live.length} -> ${out.length} bytes`);
}

// --------------------------------------------------------------- page heads
const PAGE_HEAD_EDITS = {
  invisalign: [
    ['rgba(27,34,36,.19)', 'rgba(32, 36, 42, 0.19)', 'hesitation word wash'],
    ['#8a6c46', '#007E9B', 'ledger step accent'],
    ['{font-size:1.235rem}}', '{font-size:1.31rem}}', 'form input floor'],
  ],
  'new-patient-special': [
    ['rgba(27,34,36,.19)', 'rgba(32, 36, 42, 0.19)', 'catch word wash'],
    ['{font-size:1.235rem}}', '{font-size:1.31rem}}', 'form input floor'],
  ],
  'thank-you': [
    // --bg-3 / --fg. The extractor could not resolve these tokens and wrote
    // `background:;color:;`, which the previous build hand-filled with the old
    // palette; the same two values, re-derived.
    ['background:#f4ece2;color:#1b2224', 'background:#E8F6FA;color:#26292F', 'today row highlight'],
  ],
};

for (const [page, edits] of Object.entries(PAGE_HEAD_EDITS)) {
  const live = readLive(page)['head'];
  let out = live;
  for (const [find, replace, what] of edits) out = sub(out, find, replace, `${page}: ${what}`);

  // The 1439 rung of the display ladder — Webflow has no breakpoint there.
  const rung = fs.readFileSync(path.join(HERE, page, 'whtml', 'page-head.css'), 'utf8').trim();
  const oldRung = out.match(/@media \(max-width:1439px\)\{[^\n]*\}/);
  if (!oldRung) throw new Error(`${page}: 1439 display rung not found`);
  out = sub(out, oldRung[0], rung, `${page}: 1439 display rung`);

  fs.writeFileSync(path.join(outDir, `${page}.head.html`), out, 'utf8');
  console.log(`${page} head: ${live.length} -> ${out.length} bytes`);
}

// ------------------------------------------------------------- page footers
for (const page of Object.keys(PAGE_HEAD_EDITS)) {
  const live = readLive(page)['footer'] ?? '';
  const min = fs.readFileSync(path.join(HERE, '_js', `${page}.sections.min.js`), 'utf8').trim();
  const out = `<script>${min}</script>`;
  fs.writeFileSync(path.join(outDir, `${page}.footer.html`), out, 'utf8');
  console.log(`${page} footer: ${live.length} -> ${out.length} bytes`);
}
