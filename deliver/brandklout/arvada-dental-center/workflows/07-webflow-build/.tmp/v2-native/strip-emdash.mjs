#!/usr/bin/env node
/**
 * strip-emdash.mjs — take em dashes out of the copy.
 *
 * Every occurrence is the spaced `" — "` form joining a clause, so a blind
 * swap to one character reads badly across all of them. The rules below are
 * ordered specific-first and chosen per construction:
 *
 *   independent clause follows  -> full stop
 *   relative / participial      -> comma
 *   list or restatement follows -> colon
 *
 * Idempotent, and it asserts nothing is left.
 *
 *   node strip-emdash.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(HERE, '../../../04-design/.tmp/v2/content');
const DRY = process.argv.includes('--dry');

/** [find, replace] — applied in order. */
const RULES = [
  // independent clause follows: a full stop is the honest punctuation
  ['Thank you — your request is with the team.', 'Thank you. Your request is with the team.'],
  ['Yes — the practice treats both children and adults.', 'Yes. The practice treats both children and adults.'],
  ['the plan — what follows is entirely your decision.', 'the plan. What follows is entirely your decision.'],
  ['spread the cost — the patient coordinator will go through the options with you.',
    'spread the cost. The patient coordinator will go through the options with you.'],

  // restatement / qualification
  ['accepted — not HMO or Medicaid.', 'accepted, but not HMO or Medicaid.'],
  ['Yes — patients of all ages', 'Yes, patients of all ages'],
  ['deciding factor — bone volume', 'deciding factor: bone volume'],
  ['in the chair — quicker and cheaper', 'in the chair: quicker and cheaper'],
  ['an evaluation — gum health', 'an evaluation: gum health'],
  ['Dr. Gregory Bennett — an examination', 'Dr. Gregory Bennett: an examination'],
  ['book it — a comprehensive exam', 'book it: a comprehensive exam'],
  ['a consultation — a 3D scan to measure', 'a consultation: a 3D scan to measure'],
  ['Wadsworth Boulevard — consultation, surgery', 'Wadsworth Boulevard: consultation, surgery'],
  ['implant case himself — the planning', 'implant case himself: the planning'],
  ['in the hero — the practice does not publish', 'in the hero: the practice does not publish'],
  ['Next Door / Family — the neighbourhood angle', 'Next Door / Family: the neighbourhood angle'],
  ['book it — for you, or for everyone', 'book it, for you, or for everyone'],
  ['talked through — with a doctor, not a leaflet', 'talked through, with a doctor, not a leaflet'],
  ['talked through — minutes from your door', 'talked through, minutes from your door'],
  ['CO 80003 — on Wadsworth with parking', 'CO 80003, on Wadsworth with parking'],
  ['would cost — before anything is scheduled', 'would cost, before anything is scheduled'],

  ['If it cannot wait, call — the phone is faster than a form.',
    'If it cannot wait, call. The phone is faster than a form.'],
  ['Yes — a small portion from the front', 'Yes. A small portion from the front'],
  // unspaced form — the spaced rules below never see this one
  ['the care—and the people providing it.', 'the care, and the people providing it.'],

  // general constructions, after the specific ones above
  [' — which ', ', which '],
  [' — including ', ', including '],
  [' — all at ', ', all at '],
  [' — and ', ', and '],
];

let changed = 0;
const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith('.json'));

for (const f of files) {
  const p = path.join(CONTENT, f);
  const before = fs.readFileSync(p, 'utf8');
  let after = before;
  for (const [find, repl] of RULES) after = after.split(find).join(repl);

  if (after !== before) {
    changed++;
    if (!DRY) fs.writeFileSync(p, after);
  }
  const left = (after.match(/—/g) || []).length;
  if (left) {
    console.log(`${f}: ${left} em dash(es) STILL PRESENT — add a rule for each:`);
    for (const m of after.matchAll(/(.{0,50})—(.{0,50})/g)) console.log('   …' + (m[1] + '—' + m[2]).replace(/\s+/g, ' '));
  }
}

const remaining = files.reduce((n, f) => n + ((fs.readFileSync(path.join(CONTENT, f), 'utf8').match(/—/g) || []).length), 0);
console.log(`\n${changed} file(s) ${DRY ? 'would change' : 'changed'}; ${remaining} em dash(es) remain in content/`);

// En dashes are left alone on purpose: `Monday–Friday` and `8:00 AM–5:00 PM`
// are ranges, where an en dash is the correct character, not a stylistic one.
const en = files.reduce((n, f) => n + ((fs.readFileSync(path.join(CONTENT, f), 'utf8').match(/–/g) || []).length), 0);
console.log(`${en} en dash(es) left in place (ranges like Monday–Friday).`);
process.exit(remaining ? 1 : 0);
