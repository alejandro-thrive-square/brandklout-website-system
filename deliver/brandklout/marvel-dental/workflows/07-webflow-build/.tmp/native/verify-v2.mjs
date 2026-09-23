#!/usr/bin/env node
/**
 * verify-v2.mjs — gate every built v2 page against its own local source.
 *
 * The criterion for this job is "the Webflow page equals the local version",
 * so this compares the PUBLISHED page against `04-design/.tmp/v1/<topic>/body.html`
 * on the things that actually go wrong:
 *
 *   - every heading, eyebrow, button label and FAQ question present, verbatim
 *   - no leftover {{token}}
 *   - no copy leaked from another topic
 *   - the class inventory matches (a dropped class is a dropped layout)
 *   - images present, and the native video element rendered
 *
 *   node verify-v2.mjs [topic …]
 *
 * PREMISE RETIRED, 2026-08-21. The client edited these pages in the Designer on
 * 2026-08-21 (the form moved into the landing hero, the hero image and video
 * slots went, an Elfsight widget replaced the review cards) and the local build
 * is deliberately no longer kept in step — it is the record of what we
 * delivered. So this reports 0/3, and that is the correct answer, not a
 * regression: it is measuring a difference that is now intended. Read its
 * output as a DIFF of local against live, never as a pass/fail gate, and do not
 * loosen its expectations to make it green. If the local build is ever re-synced
 * from the published HTML, this becomes a gate again unchanged.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '../../../04-design/.tmp/v1');
const STAGING = 'https://marvel-dental-main.webflow.io';
const SLUGS = {
  emergency: 'ads-landing-pages/emergency-dentist',
  'emergency-consult': 'ads-landing-pages/emergency-dentist-consult',
  'emergency-ty': 'ads-landing-pages/emergency-dentist-thank-you',
};

// The leak check only makes sense between pages of the SAME kind — every
// consult page legitimately shares its wording with the others.
const kindOf = (t) => (t.endsWith('-consult') ? 'consult' : t.endsWith('-ty') ? 'ty' : 'ads');

/**
 * Decode every entity form, decimal and hex alike. Webflow re-encodes a plain
 * apostrophe as `&#x27;`, so a decoder that only knew `&#39;` reported five of
 * six pages as missing copy that was in fact present and correct — a verifier
 * failing on its own encoding is worse than no verifier.
 */
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', reg: '®', copy: '©' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);

// Curly and straight quotes are the same character for comparison purposes.
const norm = (s) => decode(s)
  .replace(/[‘’ʼ]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const topics = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SLUGS);
let failures = 0;

for (const topic of topics) {
  const slug = SLUGS[topic];
  const local = fs.readFileSync(path.join(V2, topic, 'body.html'), 'utf8');
  const res = await fetch(`${STAGING}/${slug}`);
  const live = await res.text();
  /**
   * Visible text is not only text nodes. Webflow publishes a form's submit
   * button as `<input type="submit" value="Request my free consultation">`, so
   * a comparison that only reads text content calls the label missing on every
   * consult page while it is present and correct. Attribute-borne copy —
   * `value`, `placeholder`, `alt` — is folded in before comparing.
   */
  const attrText = [...live.matchAll(/\b(?:value|placeholder|alt)="([^"]*)"/g)].map((m) => m[1]).join(' ');
  const liveText = norm(
    live.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
    + ' ' + attrText);

  const problems = [];

  // 1. every visible string from the design must be on the page
  const strings = [...local.matchAll(/>([^<>{}]{6,})</g)].map((m) => norm(m[1])).filter((s) => s && !/^[·›✓★+◷☎]+$/.test(s));
  const missing = [...new Set(strings)].filter((s) => !liveText.includes(s));

  // 2. classes
  const wantCls = new Set();
  for (const m of local.matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) wantCls.add(c);
  const liveCls = new Set();
  for (const m of live.matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) liveCls.add(c);
  const lostCls = [...wantCls].filter((c) => !liveCls.has(c));

  // 3. leaks and leftovers
  if (/\{\{/.test(live)) problems.push('leftover {{token}} on the published page');
  /**
   * A leak is copy that belongs ONLY to another page turning up here — not any
   * shared wording. Comparing headlines was wrong: all six thank-you pages
   * share one headline deliberately, so the check failed twelve correct pages.
   * So: take the other page's strings, drop everything this page's own source
   * also contains, and only the genuinely exclusive remainder counts.
   */
  const mine = new Set(strings);
  for (const other of Object.keys(SLUGS)) {
    if (other === topic || kindOf(other) !== kindOf(topic)) continue;
    // Only the ads pages are meant to read differently from one another. The
    // consult and thank-you pages deliberately share almost all of their
    // wording — the only per-topic parts are the headline, the options and the
    // legal line, and the missing-strings check above already proves those.
    if (kindOf(topic) !== 'ads') continue;
    const otherLocal = fs.readFileSync(path.join(V2, other, 'body.html'), 'utf8');
    const exclusive = [...new Set([...otherLocal.matchAll(/>([^<>{}]{25,})</g)].map((m) => norm(m[1])))]
      .filter((s) => s && !mine.has(s));
    const found = exclusive.filter((s) => liveText.includes(s));
    if (found.length) problems.push(`copy exclusive to "${other}" appears here: "${found[0].slice(0, 60)}…"`);
  }

  const imgs = (live.match(/<img/g) || []).length;
  const wantImgs = (local.match(/<img/g) || []).length;
  if (imgs < wantImgs) problems.push(`${imgs}/${wantImgs} images rendered`);
  // Marvel's patient films are on Vimeo and ship as a poster that links out —
  // the native video element's URL setting is unreachable over the Data API.
  if (kindOf(topic) === 'ads' && !/vimeo\.com\/\d+/i.test(live)) problems.push('no patient-film link on the page');

  if (missing.length) problems.push(`${missing.length} design string(s) missing: ` + missing.slice(0, 4).map((s) => `"${s.slice(0, 48)}…"`).join(', '));
  if (lostCls.length) problems.push(`${lostCls.length} class(es) dropped: ${lostCls.slice(0, 6).join(', ')}`);

  const ok = problems.length === 0 && res.ok;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${topic.padEnd(16)} http ${res.status}  ${strings.length} strings  ${wantCls.size} classes  ${imgs} images`);
  for (const p of problems) console.log('        ' + p);
}

console.log(`\n${topics.length - failures}/${topics.length} pages pass`);
process.exit(failures ? 1 : 0);
