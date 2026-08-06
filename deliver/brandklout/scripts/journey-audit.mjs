#!/usr/bin/env node
/**
 * journey-audit.mjs — static audit of built landing pages against DESIGN-STANDARD.md.
 *
 * Answers one question: is this page a *journey* or a *stack of bands*?
 *
 * Why static, when the standard insists motion is verified by interaction: this catches the
 * architectural failure, which IS visible in the source. A page with zero `pin: true` cannot have a
 * scroll-driven chapter no matter how it behaves in a browser. Passing this audit is necessary, not
 * sufficient — the scrub proof still has to be run in a focused tab.
 *
 * Resolves linked <link href>/<script src> CSS and JS, because the first round of pages kept their
 * entire motion layer in a shared external file and a body-only grep reported a false zero.
 *
 * Usage (from any worktree, or the orchestration checkout with --all):
 *   node deliver/brandklout/scripts/journey-audit.mjs <dir-containing-index.html> [...]
 *   node deliver/brandklout/scripts/journey-audit.mjs --all
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';

const WORKTREE_ROOT = 'C:/Users/ACER/orca/workspaces/Webzite Agentic Workflow';
const CLIENTS = [
  ['bk-grand-mission', 'grand-mission-dentistry'],
  ['bk-arvada', 'arvada-dental-center'],
  ['bk-mason-park', 'mason-park'],
];

/** Count non-overlapping matches, guarding against a global regex carrying lastIndex across calls. */
const count = (text, re) => (text.match(new RegExp(re.source, 'g')) ?? []).length;

/** Inline every same-origin stylesheet and script so the audit sees the whole page. */
function withAssets(htmlPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const base = dirname(htmlPath);
  let combined = html;
  const refs = html.matchAll(/(?:href|src)="([^"]+\.(?:css|js))"/g);
  for (const [, ref] of refs) {
    if (/^(https?:)?\/\//.test(ref)) continue; // CDN (gsap itself) — not our code
    const p = resolve(base, ref);
    if (existsSync(p)) combined += '\n' + readFileSync(p, 'utf8');
  }
  return combined;
}

function audit(dir) {
  const index = join(dir, 'index.html');
  if (!existsSync(index)) return null;
  const t = withAssets(index);

  const m = {
    chapters: count(t, /data-chapter=/),
    pins: count(t, /pin:\s*true/),
    scrubs: count(t, /scrub:/),
    gsap: count(t, /gsap\./),
    split: count(t, /data-split|SplitText/),
    clip: count(t, /clip-path/),
    io: count(t, /IntersectionObserver/),
    redmo: count(t, /prefers-reduced-motion/),
    // Sections class-named for a background colour or a spacing value: the band-stack tell.
    bands: count(t, /<section[^>]*class="[^"]*\b(?:band-|section--(?:light|dark|paper|ink|cloud|tint|warm|tight|summit|base))/),
  };

  // Criteria 1-3 and 5 of the Definition of done that a static read can actually decide.
  const checks = [
    ['6-8 named chapters', m.chapters >= 6 && m.chapters <= 8],
    ['>=3 scroll-driven', m.pins >= 3],
    ['scrubbing present', m.scrubs >= 3],
    ['uses GSAP', m.gsap > 0],
    ['no band sections', m.bands === 0],
    ['reduced-motion', m.redmo > 0],
  ];
  return { m, checks, pass: checks.every(([, ok]) => ok) };
}

function discover() {
  const out = [];
  for (const [wt, client] of CLIENTS) {
    const root = join(WORKTREE_ROOT, wt, 'deliver/brandklout', client, 'workflows/04-design/.tmp');
    if (!existsSync(root)) continue;
    for (const e of readdirSync(root)) {
      const d = join(root, e);
      if (statSync(d).isDirectory() && existsSync(join(d, 'index.html'))) out.push([client, e, d]);
    }
    if (existsSync(join(root, 'index.html'))) out.push([client, '(root)', root]);
  }
  return out;
}

const args = process.argv.slice(2);
const targets = args.includes('--all')
  ? discover()
  : args.map((a) => ['', basename(a), resolve(a)]);

if (!targets.length) {
  console.error('No pages found. Pass page directories, or --all from the orchestration checkout.');
  process.exit(2);
}

const H = ['CLIENT', 'PAGE', 'chap', 'pin', 'scrub', 'gsap', 'split', 'IO', 'band', 'redmo', ''];
console.log(
  H[0].padEnd(24) + H[1].padEnd(24) +
  ['chap', 'pin', 'scrub', 'gsap', 'split', 'IO', 'band', 'redmo'].map((h) => h.padStart(6)).join('') +
  '  VERDICT'
);

let failed = 0;
for (const [client, page, dir] of targets) {
  const r = audit(dir);
  if (!r) continue;
  const { m } = r;
  if (!r.pass) failed++;
  console.log(
    client.padEnd(24) + page.padEnd(24) +
    [m.chapters, m.pins, m.scrubs, m.gsap, m.split, m.io, m.bands, m.redmo]
      .map((v) => String(v).padStart(6)).join('') +
    '  ' + (r.pass ? 'PASS' : 'FAIL: ' + r.checks.filter(([, ok]) => !ok).map(([n]) => n).join(', '))
  );
}

console.log(
  `\n${targets.length - failed}/${targets.length} pages pass the static journey gate.` +
  (failed ? '\nA FAIL here is architectural — it cannot be fixed by adding animation.' : '') +
  '\nStill required regardless: the scrub proof (different intermediate state at 25/50/75%)' +
  '\nand six-breakpoint screenshots, both on a focused tab.'
);
process.exit(failed ? 1 : 0);
