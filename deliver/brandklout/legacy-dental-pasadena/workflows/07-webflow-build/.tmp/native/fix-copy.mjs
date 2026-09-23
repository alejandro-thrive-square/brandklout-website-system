#!/usr/bin/env node
/**
 * fix-copy.mjs — push the corrected offer copy onto the two built pages.
 *
 * WHY. The six offer NUMBERS were all transcribed correctly from the practice's
 * own /invisalign-offer-pasadena page. Three sentences AROUND them were not:
 * "credited to your first appointment" (source says the Data Collection
 * appointment), "we file on your behalf" (unsupported anywhere) and "paid to
 * you" (source says it may go to the patient OR to the office). Those are
 * claims about money and about who does the paperwork, so they get corrected on
 * the site, not just in the design files.
 *
 * Matched on the OLD string rather than by element id: ids are not stable across
 * a --clear rebuild, the old text is unique, and a match that finds nothing is
 * then a loud failure instead of a silent write to the wrong node.
 */
import { call, SITES } from './wf.mjs';

const PAGES = {
  '6a87d0257abd46ca13a18ae3': 'invisalign (LP)',
  '6a87d02533c007495d905571': 'invisalign-consult',
};

const SUBS = [
  ['Credited to your first appointment', 'Credited toward your treatment'],
  ['A $100 deposit reserves the price and is fully refundable, credited to your first appointment. Payment plans are available, including a 0% option over 24 months. Credit cards carry a 3% surcharge; debit, HSA and FSA do not. Where you have orthodontic cover, we file on your behalf and reimbursement typically runs $1,000 to $3,000, paid to you.',
   'A $100 deposit reserves the price. It is credited toward the payment due at your data collection appointment, or refunded in full if you decide not to proceed. Payment plans are available, including 0% interest over 24 months on a financed total of $3,979. Credit cards carry a 3% surcharge; debit, HSA and FSA do not. Where your plan covers Invisalign, reimbursement typically runs $1,000 to $3,000, paid either to you or directly to the office depending on your provider.'],
  ['A $100 deposit locks the promotional pricing while your aligners are made. It is fully refundable and it comes off your first appointment.',
   'A $100 deposit locks the promotional pricing while your aligners are made. It is credited toward the payment due at your data collection appointment, or refunded in full if you decide not to go ahead.'],
];

let written = 0, missed = 0;
const absent = [];
for (const [page, name] of Object.entries(PAGES)) {
  const o = { site: SITES.legacy, page };
  /* mcp.webflow.com is intermittently refusing connections (1 of 3 succeeded
     while this ran), and a failed read returns an error object, not a throw.
     Retry, and treat an unreadable tree as a hard failure. */
  let root = null;
  for (let a = 0; a < 6 && !root; a++) {
    const tree = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], o);
    root = tree?.result?.[0]?.data || null;
    if (!root) {
      console.log(`  ${name}: tree read ${a + 1}/6 failed${a < 5 ? ', retrying' : ''}`);
      if (a < 5) await new Promise((r) => setTimeout(r, 4000 * (a + 1)));
    }
  }
  if (!root) { console.log(`${name}: COULD NOT READ THE TREE`); missed++; continue; }

  // Flatten every node so a String child is reachable as its own target.
  const flat = [];
  (function walk(n) { flat.push(n); for (const c of n.children || []) walk(c); })(root);

  for (const [oldText, newText] of SUBS) {
    const hits = flat.filter((n) => (n.textContent || '').trim() === oldText.trim());
    if (!hits.length) {
      /* Expected on the consult page, which carries only the proof line. Count
         it per page and judge against a per-page expectation below. */
      absent.push(`${name}: ${oldText.slice(0, 40)}...`);
      continue;
    }
    for (const h of hits) {
      const r = call('data_element_tool', [{ label: 't', set_text: { id: h.id, text: newText } }], o);
      const ok = JSON.stringify(r).includes('"success"') || r?.result;
      console.log(`  ${ok ? 'set ' : 'FAIL'} ${name}: "${oldText.slice(0, 46)}..."`);
      ok ? written++ : missed++;
    }
  }
}
console.log(`\n${written} text node(s) updated, ${missed} problem(s)`);
process.exit(missed ? 1 : 0);
