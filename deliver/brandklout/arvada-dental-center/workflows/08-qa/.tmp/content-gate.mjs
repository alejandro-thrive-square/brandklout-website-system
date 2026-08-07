#!/usr/bin/env node
/**
 * content-gate.mjs — the standing safety net, carried forward from the previous
 * QA harness when the architecture was rebuilt.
 *
 * The journey audit checks the page is a journey. The scrub proof checks the
 * motion is real. Neither of them stops a fabrication getting back in, which is
 * the failure with actual consequences for a real dental practice.
 *
 * Static by design: it reads the shipped HTML, so it cannot be fooled by a
 * script that has not run yet, and it costs nothing to run on every change.
 *
 *   node content-gate.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp');
const PAGES = ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door'];

let pass = 0, fail = 0;
const check = (page, name, ok, detail = '') => {
  ok ? pass++ : fail++;
  if (!ok) console.log(`   FAIL  ${page.padEnd(16)} ${name}${detail ? '  ← ' + detail : ''}`);
};

/* Three fabrications Brandklout flagged in the source material on 2026-08-06,
   plus the claims this practice cannot honestly make. None are ours to inherit;
   each is a gap to raise, never a fact to copy forward. */
const FORBIDDEN = [
  { re: /open 24\/7|24 hours a day|always open|walk-?ins welcome/i, why: 'practice is Mon-Fri 8-5 only' },
  { re: /guaranteed same-?day|same-?day guaranteed/i, why: "client says 'whenever possible', not guaranteed" },
  { re: /painless|no pain at all/i, why: 'absolute clinical claim' },
  { re: /\b\d{1,3}% success\b/i, why: 'unsourced success-rate statistic' },
  { re: /\(720\)\s*419-3699/, why: 'tracking line — see Open Question 2' },
  { re: /\$14,999/, why: 'the conflicting price variant' },
  { re: /\b4[.,]8\b|\b931\b|\b1,?270\b|\b1,?000\+?\s*(?:reviews|patients)/i,
    why: 'the aggregated 4.8 / 1,000+ review figure — an estimate, not a real number' },
  { re: /average rating|star rating|\b\d(?:\.\d)?\s*(?:out of|\/)\s*5\b|rated \d(?:\.\d)? stars/i,
    why: 'an aggregate rating claim' },
  { re: /\bCareCredit\b|\bSunbit\b|\bPatientFi\b|\bLendingClub\b|\bProceed Finance\b|\bCherry\b/,
    why: 'an unconfirmed named finance partner' },
  { re: /without affecting your credit( score)?|soft credit (check|pull)|no credit check/i,
    why: 'a soft-pull credit claim that rides on the unconfirmed lender list' },
  { re: /before[- ]and[- ]after|before ?\/ ?after|\bsmile transformation photo/i,
    why: "before/after imagery — the client's are stock placeholders, not consented patient photos" },
  { re: /actual patient|real patient results?|patient photo(?!graph\b)/i,
    why: 'presenting imagery as a real patient result' },
  { re: /\$105\s*\/?\s*mo|\$185\s*\/?\s*mo|\$230\s*\/?\s*mo|10\+ lending partners/i,
    why: "the vendor's unverified monthly financing figures" },
  { re: /images\.unsplash\.com|unsplash/i, why: 'stock photography from the vendor build' },
  { re: /aggregateRating/i, why: 'fabricated review markup — a Google structured-data policy violation' },
];

/* Brandklout is a partner engagement, not a per-page client. No rate, quote or
   cost of OURS belongs in this folder. The practice's own patient-facing prices
   ($109, $18,795) are landing-page content and are expected. */
const OUR_TERMS = /PRICING_TIMELINE_RULES|per-page rate|our (?:rate|fee)\b|we (?:charge|quote)\b|project (?:cost|fee)\b|day rate|\bretainer fee\b/i;

console.log('=== content gate\n');

for (const slug of PAGES) {
  const file = join(DESIGN, slug, 'index.html');
  if (!existsSync(file)) { check(slug, 'page exists', false); continue; }
  const html = readFileSync(file, 'utf8');
  // Strip comments so a note *about* a purged fabrication does not trip its own
  // guard, and strip <style> so CSS values are not read as copy — `aspect-ratio:4/5`
  // is not a four-out-of-five rating. <script> stays in scope: chapter captions
  // genuinely live in the per-chapter scripts and must be guarded too.
  const body = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');

  for (const f of FORBIDDEN) {
    const hit = f.re.test(body);
    check(slug, `no ${f.why}`, !hit, hit ? String(body.match(f.re)) : '');
  }
  check(slug, 'no commercial terms of ours', !OUR_TERMS.test(body));

  /* ---- journey integrity ---- */
  const chapters = [...html.matchAll(/data-chapter="(\d+)"\s+data-chapter-name="([^"]+)"/g)]
    .map(([, n, name]) => ({ n: Number(n), name }));
  check(slug, '6-8 chapters', chapters.length >= 6 && chapters.length <= 8, String(chapters.length));
  check(slug, 'chapters numbered 0..n with no gaps',
    chapters.every((c, i) => c.n === i));
  check(slug, 'chapter names unique', new Set(chapters.map((c) => c.name)).size === chapters.length);
  check(slug, 'no chapter named for a colour or spacing',
    !chapters.some((c) => /light|dark|paper|warm|tight|base|summit|band/i.test(c.name)));
  check(slug, 'section classes name the beat, not the background',
    ![...html.matchAll(/<section[^>]*class="([^"]+)"/g)]
      .some(([, cls]) => /\bband-|section--(light|dark|paper|warm|tight|base|summit)/.test(cls)));

  /* ---- conversion is still the job ---- */
  check(slug, 'phone reachable in nav, body and action bar',
    (html.match(/href="tel:\+13034217611"/g) || []).length >= 4);
  check(slug, 'sticky mobile action bar present', /class="actionbar"/.test(html));
  check(slug, 'a lead form exists', /form[^>]*data-lead=/.test(html));
  check(slug, 'skip link present', /class="skip"/.test(html));
  check(slug, 'reading progress present', /id="navProgress"/.test(html));
  check(slug, 'chapter readout present', /id="navChName"/.test(html));

  /* ---- accessibility basics ---- */
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map(([m]) => m);
  check(slug, 'every img has alt', imgs.every((i) => /\balt=/.test(i)),
    imgs.filter((i) => !/\balt=/.test(i)).slice(0, 2).join(' '));
  check(slug, 'reduced-motion guard declared in the page', /prefers-reduced-motion/.test(html));
  check(slug, 'no-JS fallback declared in the page', /html:not\(\.js-motion\)/.test(html));

  /* ---- the motion layer is GSAP, not an observer ---- */
  check(slug, 'no IntersectionObserver', !/IntersectionObserver/.test(html));
  check(slug, 'GSAP registered in body, not head',
    html.indexOf('journey-boot.js') > html.indexOf('</head>'));
}

console.log(`\n${'='.repeat(64)}`);
console.log(`content gate: ${pass}/${pass + fail} checks pass`);
process.exit(fail ? 1 : 0);
