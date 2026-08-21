#!/usr/bin/env node
/**
 * check-claims.mjs — gate the BUILT pages against unsupported wording.
 *
 * Every phrase below was either corrected after review or is a figure the
 * practice's own page prints but which is not verifiable, and which the brief
 * forbids inventing. This reads the live element tree, not the design files,
 * because the design files being right proves nothing about what was built.
 */
import { call, SITES } from './wf.mjs';

const PAGES = {
  '6a87d0257abd46ca13a18ae3': 'invisalign (LP)',
  '6a87d02533c007495d905571': 'invisalign-consult',
  '6a87d0264d281999f40557e4': 'invisalign-ty',
};

/** phrase -> why it must not appear */
const BANNED = {
  'we file on your behalf': 'unsupported: the source page never says who files',
  'paid to you.': 'source says payment may go to you OR directly to the office',
  'first appointment': 'source names the Data Collection appointment, not the first',
  '500+': 'unverified case count',
  '480+': 'contradicted review count',
  '4.9': 'contradicted rating',
  'CONSULATION': "the practice's live typo, not carried across",
};
/* Corrections that must be PRESENT, so a rebuild that reverts them fails here. */
const REQUIRED = {
  '6a87d0257abd46ca13a18ae3': ['financed total of $3,979', 'data collection appointment'],
};

let bad = 0;
for (const [page, name] of Object.entries(PAGES)) {
  const o = { site: SITES.legacy, page };
  let root = null;
  for (let a = 0; a < 8 && !root; a++) {
    const t = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], o);
    root = t?.result?.[0]?.data || null;
    if (!root) await new Promise((r) => setTimeout(r, 3000 * (a + 1)));
  }
  if (!root) { console.log(`${name}: COULD NOT READ THE TREE`); bad++; continue; }

  const text = [];
  (function w(n) { if (n.textContent) text.push(n.textContent); for (const c of n.children || []) w(c); })(root);
  const blob = text.join('\n');

  const found = Object.entries(BANNED).filter(([p]) => blob.includes(p));
  const missing = (REQUIRED[page] || []).filter((p) => !blob.includes(p));

  console.log(`\n${name}: ${text.length} text node(s)`);
  for (const [p, why] of found) { console.log(`  BANNED PHRASE "${p}" - ${why}`); bad++; }
  for (const p of missing) { console.log(`  MISSING CORRECTION "${p}"`); bad++; }
  if (!found.length && !missing.length) console.log('  clean');
}
console.log(`\n${bad} problem(s)`);
process.exit(bad ? 1 : 0);
