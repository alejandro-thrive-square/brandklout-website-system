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
 * Lives in scenario-0-new-site/03-design-build/scripts/ beside DESIGN-STANDARD.md; 04-qa runs it
 * from the same scenario copy.
 *
 * Usage (from any checkout of the repo):
 *   node <scenario-0>/03-design-build/scripts/journey-audit.mjs <dir-containing-index.html> [...]
 *   node <scenario-0>/03-design-build/scripts/journey-audit.mjs --all
 *
 * --all audits every client folder in every worktree of this repository (`git worktree list`).
 * A client's own bk-* branch is newer than main's snapshot, so a client found in a bk-* worktree is
 * not audited again from main.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { execSync } from 'node:child_process';

/** Every worktree of this repository, bk-* branches first so they win over main's snapshot. */
function worktrees() {
  const out = execSync('git worktree list --porcelain', { encoding: 'utf8' });
  const list = out.split(/\r?\n\r?\n/).map((b) => ({
    path: (b.match(/^worktree (.+)$/m) || [])[1],
    branch: ((b.match(/^branch refs\/heads\/(.+)$/m) || [])[1]) || '',
  })).filter((w) => w.path);
  return list.sort((a, b) => Number(!a.branch.startsWith('bk-')) - Number(!b.branch.startsWith('bk-')));
}

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

/**
 * Deliverable pages live in SUBDIRECTORIES of the package `output`; an `index.html` sitting at the
 * package root is the drafts index — a card listing linking to those pages for client review.
 * Judging it against the journey standard produced a permanent phantom FAIL (0 chapters, 0 pins)
 * that understated the real pass rate.
 *
 * `noindex` is NOT the discriminator, though it looks like one: every page here is an unpublished
 * draft and carries `noindex, nofollow`, so testing for it skips the entire campaign.
 *
 * The root is reported under "Not judged" rather than dropped silently, so a client that ever does
 * ship a single page at the package root is visible instead of quietly unaudited.
 */
const skipped = [];

function discover() {
  const out = [];
  const seen = new Set();
  for (const wt of worktrees()) {
    const clientsDir = join(wt.path, 'deliver/brandklout');
    if (!existsSync(clientsDir)) continue;
    for (const client of readdirSync(clientsDir)) {
      if (seen.has(client) || !statSync(join(clientsDir, client)).isDirectory()) continue;
      // Scenario 0 layout first; client branches built before 2026-09-23 still use 04-design.
      const root = ['scenario-0-new-site/03-design-build/output/code/site-src', 'workflows/03-design-build/output', 'workflows/04-design/output']
        .map((p) => join(clientsDir, client, p))
        .find((p) => existsSync(p));
      if (!root) continue;
      seen.add(client);
      for (const e of readdirSync(root)) {
        const d = join(root, e);
        if (statSync(d).isDirectory() && existsSync(join(d, 'index.html'))) out.push([client, e, d]);
      }
      if (existsSync(join(root, 'index.html'))) skipped.push(`${client}/index.html (package-root drafts index)`);
    }
  }
  return out;
}

const args = process.argv.slice(2);
const targets = args.includes('--all')
  ? discover()
  : args.map((a) => ['', basename(a), resolve(a)]);

if (!targets.length) {
  console.error('No pages found. Pass page directories, or --all from inside a checkout of this repository.');
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
  (skipped.length ? `\nNot judged: ${skipped.join('; ')}.` : '') +
  (failed ? '\nA FAIL here is architectural — it cannot be fixed by adding animation.' : '') +
  '\nStill required regardless: the scrub proof (different intermediate state at 25/50/75%)' +
  '\nand six-breakpoint screenshots, both on a focused tab.'
);
process.exit(failed ? 1 : 0);
