#!/usr/bin/env node
/**
 * fix-fineprint.mjs — replace the offer fine print on the built LP.
 *
 * Matched on a UNIQUE ANCHOR substring rather than whole-string equality.
 * Equality failed here against a node whose text looked byte-identical when
 * printed, and chasing the invisible difference is not worth the time when an
 * anchor is both unambiguous and immune to it. "we file on your behalf" appears
 * exactly once on the site, and it is precisely the unsupported claim being
 * removed, so a match is self-verifying.
 */
import { call, SITES } from './wf.mjs';

const ANCHOR = 'we file on your behalf';
const NEW = "New patients only, limited-time promotional pricing. A $100 deposit reserves the price. "
  + "It is credited toward the payment due at your data collection appointment, or refunded in full if "
  + "you decide not to proceed. Payment plans are available, including 0% interest over 24 months on a "
  + "financed total of $3,979. Credit cards carry a 3% surcharge; debit, HSA and FSA do not. Where your "
  + "plan covers Invisalign, reimbursement typically runs $1,000 to $3,000, paid either to you or "
  + "directly to the office depending on your provider.";

const o = { site: SITES.legacy, page: '6a87d0257abd46ca13a18ae3' };

let root = null;
for (let a = 0; a < 8 && !root; a++) {
  const t = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], o);
  root = t?.result?.[0]?.data || null;
  if (!root) { console.log(`tree read ${a + 1}/8 failed`); await new Promise((r) => setTimeout(r, 3000 * (a + 1))); }
}
if (!root) { console.log('COULD NOT READ THE TREE'); process.exit(1); }

const flat = [];
(function w(n) { flat.push(n); for (const c of n.children || []) w(c); })(root);

const hits = flat.filter((n) => n.type === 'String' && (n.textContent || '').includes(ANCHOR));
console.log(`${hits.length} String node(s) carrying the anchor`);
if (hits.length !== 1) { console.log('EXPECTED EXACTLY 1. Not writing.'); process.exit(1); }

const r = call('data_element_tool', [{ label: 'fp', set_text: { id: hits[0].id, text: NEW } }], o);
console.log(JSON.stringify(r).slice(0, 220));

/* Read back. A write that reports success and changes nothing is the failure
   mode this whole task exists to correct, so prove it by re-reading. */
let after = null;
for (let a = 0; a < 8 && !after; a++) {
  const t = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], o);
  after = t?.result?.[0]?.data || null;
  if (!after) await new Promise((x) => setTimeout(x, 3000 * (a + 1)));
}
const flat2 = [];
(function w(n) { flat2.push(n); for (const c of n.children || []) w(c); })(after);
const still = flat2.filter((n) => n.type === 'String' && (n.textContent || '').includes(ANCHOR));
const now = flat2.filter((n) => n.type === 'String' && (n.textContent || '').includes('financed total of $3,979'));
console.log(`after: ${still.length} node(s) still claim "${ANCHOR}", ${now.length} carry the corrected text`);
process.exit(still.length === 0 && now.length === 1 ? 0 : 1);
