// blog-cho.mjs — Dr. Cho leads in the 161 blog articles (brief: ./BRIEF.md, rule 1).
//
// Every edit is an exact, hand-written string replacement, keyed by slug. No regex over prose.
//   node blog-cho.mjs            dry run: prints per-article counts and the paragraph-level check
//   node blog-cho.mjs --write    also writes ../../../blog/cms-rows.json (backup: cms-rows.before-cho.json)
//
// Idempotent: each replacement is applied only to text outside existing copies of its `new` string,
// so a second run changes nothing. `slug` is never touched.
//
// Entry forms per slug:
//   [old, new]                       replace once in each field where found (must be unique in that field)
//   [old, new, { all: true }]        replace every occurrence
//   [old, new, { f: 'seoTitle' }]    restrict to one field
//   { move: [linePrefix, beforeLinePrefix] }   body: move the line starting with linePrefix to sit
//                                              directly before the line starting with beforeLinePrefix
//   { insert: [beforeLinePrefix, html] }       body: insert html as its own line before that line
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(here, '../../../blog/cms-rows.json');
const BACKUP = path.resolve(here, '../../../blog/cms-rows.before-cho.json');
const FIELDS = ['title', 'seoTitle', 'metaDescription', 'excerpt', 'body'];
const WRITE = process.argv.includes('--write');

// Dr. Cho's bio, from the brief's facts only. Inserted where an article carries Dr. Sung's bio and none for Dr. Cho.
const CHO_BIO = '<p>Dr. Dave Cho, DMD, is a general dentist at Mason Park Dental, offering cosmetic, restorative and general care to patients of all ages. After a Bachelor’s in Biochemistry at the University of California, Riverside and five years at a pharmaceutical company, he earned his dental degree at Tufts University. He is experienced in oral sedation, root canals, oral surgery, implant placement and cosmetic dentistry, and his calm, laid-back manner puts nervous patients at ease.</p>';

// Name-order swaps, applied to every row after its own entries. Both doctors are already named; Dr. Cho moves first.
const SWAPS = [
  ['Dr. William Sung and Dr. Dave Cho', 'Dr. Dave Cho and Dr. William Sung'],
  ['Dr. William Sung or Dr. Dave Cho', 'Dr. Dave Cho or Dr. William Sung'],
  ['Dr. William Sung, DMD and Dr. Dave Cho', 'Dr. Dave Cho and Dr. William Sung, DMD'],
  ['Dr. Sung & Dr. Cho', 'Dr. Cho & Dr. Sung'],
  ['Dr. Sung and Dr. Cho', 'Dr. Cho and Dr. Sung'],
  ['Dr. Sung or Dr. Cho', 'Dr. Cho or Dr. Sung'],
  ['Dr Sung and Dr Cho', 'Dr Cho and Dr Sung'],
  ['Drs. Sung & Cho', 'Drs. Cho & Sung'],
];
// Excerpts cut mid-name ("... by Dr. William Sung and Dr.") — the cut now falls after Dr. Cho.
const EXCERPT_TAIL = ['Dr. William Sung and Dr.', 'Dr. Dave Cho and Dr.'];

// Location posts: the team list names Dr. Sung, Dr. Nguyen, Dr. Cho in that order; Dr. Cho moves to the top,
// and the intro that led with Dr. Sung names Dr. Cho first.
const TEAM = [
  ['Dr. William Sung, Dr. Tam Nguyen,', 'Dr. Dave Cho, Dr. William Sung, Dr. Tam Nguyen,'],
  { move: ['<p>Dr. Dave Cho: ', '<p>Dr. William Sung: '] },
];

const E = {
  'does-invisalign-fix-teeth-permanently': [
    ['Dr. William Sung in Katy, TX ensures long-lasting results', 'Dr. Dave Cho and Dr. William Sung in Katy, TX ensure long-lasting results'],
    ['Permanent results with Dr. William Sung’s Invisalign treatment rely', 'Permanent results with Invisalign treatment from Dr. Dave Cho and Dr. William Sung rely'],
    ['During these visits, Dr. William Sung will inspect', 'During these visits, Dr. Dave Cho will inspect'],
    ['outcomes with Dr. William Sung, transforming', 'outcomes with Dr. Dave Cho and Dr. William Sung, transforming'],
    ['reinforce Dr. William Sung long', 'reinforce Dr. Dave Cho and Dr. William Sung’s long'],
    ['ensure Dr. William Sung Invisalign treatment longevity', 'ensure Invisalign treatment longevity'],
  ],
  'invisalign-for-crowded-teeth-dr-william-sungs-treatment-plan': [
    ['Invisalign for Crowded Teeth: Dr. William Sung’s Treatment Plan', 'Invisalign for Crowded Teeth: Dr. Dave Cho and Dr. William Sung’s Treatment Plan', { f: 'title' }],
    ['Invisalign for Crowded Teeth in Katy, TX | Dr. William Sung', 'Invisalign for Crowded Teeth in Katy, TX | Dr. Cho & Dr. Sung', { f: 'seoTitle' }],
    ['Dr. William Sung provides precise', 'Dr. Dave Cho and Dr. William Sung provide precise'],
    ['we tailor every Invisalign aligners in Katy, TX with Dr. William Sung treatment to each', 'we tailor every Invisalign treatment with Dr. Dave Cho and Dr. William Sung to each'],
    ['and Dr. Sung’s expertise, you can', 'and the expertise of Dr. Cho and Dr. Sung, you can'],
    ['Clear aligners in Katy, TX by Dr. William Sung combines', 'Clear aligners in Katy, TX by Dr. Dave Cho and Dr. William Sung combine'],
    ['Invisalign treatment with Dr. William Sung.</p>', 'Invisalign treatment with Dr. Dave Cho and Dr. William Sung.</p>'],
    ['adjust goals with Dr. Sung’s guidance.', 'adjust goals with Dr. Cho’s guidance.'],
    ['Mason Park Dental with Dr. William Sung offers a compassionate', 'Mason Park Dental with Dr. Dave Cho and Dr. William Sung offers a compassionate'],
    ['is guided by Dr. William Sung, a Diamond+ Top 1% Invisalign Provider whose advanced training and years of experience ensure', 'is guided by Dr. Dave Cho, alongside Dr. William Sung, a Diamond+ Top 1% Invisalign Provider. Their training and years of experience ensure'],
    ['Dr. Sung personally reviews your progress', 'Dr. Cho personally reviews your progress'],
    ['Dr. Sung will evaluate your dental anatomy', 'Dr. Cho will evaluate your dental anatomy'],
    ['enabling Dr. Sung to adjust', 'enabling Dr. Cho to adjust'],
    ['providers like Dr. Sung will be able', 'providers like Dr. Cho and Dr. Sung will be able'],
    ['Invisalign treatment with Dr. William Sung combines top care', 'Invisalign treatment with Dr. Dave Cho and Dr. William Sung combines top care'],
    ['Dr. Sung will advise if they optimize', 'Dr. Cho will advise if they optimize'],
    ['Mason Park Dental with Dr. William Sung, you’re partnering', 'Mason Park Dental with Dr. Dave Cho and Dr. William Sung, you’re partnering'],
  ],
  'how-much-does-invisalign-usually-cost': [
    ['Invisalign cost with Dr. William Sung at Mason Park Dental', 'Invisalign cost with Dr. Dave Cho and Dr. William Sung at Mason Park Dental'],
    ['Invisalign pricing with Dr. William Sung, what’s included', 'Invisalign pricing with Dr. Dave Cho and Dr. William Sung, what’s included'],
    ['support of Dr. William Sung, who has helped hundreds', 'support of Dr. Dave Cho, alongside Dr. William Sung, who has helped hundreds'],
    ['So, How Much Does Dr. William Sung Charge for Invisalign?', 'So, How Much Does Invisalign Cost with Dr. Dave Cho and Dr. William Sung?'],
    ['Invisalign treatment fees Dr. William Sung provides always include', 'Invisalign treatment fees Dr. Dave Cho provides always include'],
    ['Invisalign cost with Dr. William Sung, they’re often', 'Invisalign cost with Dr. Dave Cho and Dr. William Sung, they’re often'],
    ['Dr. Sung uses that digital model', 'Dr. Cho uses that digital model'],
    ['quick check-in with Dr. Sung.', 'quick check-in with Dr. Cho or Dr. Sung.'],
    ['Invisalign treatment fees Dr. William Sung offers—there', 'Invisalign treatment fees Dr. Dave Cho and Dr. William Sung offer—there'],
    ['Just one more way Dr. Sung helps you', 'Just one more way Dr. Cho helps you'],
    ['Dr. Sung and the team are with you', 'Dr. Cho, Dr. Sung and the team are with you'],
    ['At Mason Park Dental, Dr. William Sung Invisalign pricing reflects', 'At Mason Park Dental, Invisalign pricing with Dr. Dave Cho and Dr. William Sung reflects'],
    ['custom plan from Dr. William Sung, means', 'custom plan from Dr. Dave Cho and Dr. William Sung, means'],
    ['<p>Dr. William Sung Invisalign pricing starts around', '<p>Invisalign pricing with Dr. Dave Cho and Dr. William Sung starts around'],
    ['Invisalign cost with Dr. William Sung includes digital scans', 'Invisalign cost with Dr. Dave Cho and Dr. William Sung includes digital scans'],
    ['How much does Dr. William Sung charge for Invisalign? Between', 'How much does Invisalign cost with Dr. Dave Cho and Dr. William Sung? Between'],
    ['Invisalign treatment fees Dr. William Sung offers are flexible', 'Invisalign treatment fees Dr. Dave Cho and Dr. William Sung offer are flexible'],
    ['consultation with Dr. William Sung to discuss', 'consultation with Dr. Dave Cho or Dr. William Sung to discuss'],
  ],
  'can-you-remove-invisalign-aligners-for-special-occasions-dr-william-sung-answers': [
    ['Can You Remove Invisalign Aligners for Special Occasions? Dr. William Sung Answers', 'Can You Remove Invisalign Aligners for Special Occasions? Dr. Dave Cho and Dr. William Sung Answer', { f: 'title' }],
    ['Remove Invisalign for Special Occasions? Dr. Sung Explains', 'Remove Invisalign for Events? Dr. Cho & Dr. Sung Explain', { f: 'seoTitle' }],
    ['Dr. William Sung shares expert tips', 'Dr. Dave Cho and Dr. William Sung share expert tips'],
    ['Dr. William Sung addresses the nuanced question', 'Dr. Dave Cho and Dr. William Sung address the nuanced question'],
    ['During this session, Dr. William Sung conducts', 'During this session, Dr. Dave Cho conducts'],
    ['ClinCheck, Dr. William Sung develops', 'ClinCheck, Dr. Dave Cho develops'],
    ['Dr. William Sung will demonstrate the proper', 'Dr. Dave Cho will demonstrate the proper'],
    ['allow Dr. William Sung and the Mason Park Dental team', 'allow Dr. Dave Cho, Dr. William Sung and the Mason Park Dental team'],
    ['Dr. William Sung explains that while', 'Dr. Dave Cho explains that while'],
    ['<h2>Dr. William Sung’s Professional Insight</h2>', '<h2>Dr. Dave Cho and Dr. William Sung’s Professional Insight</h2>'],
    ['<h2>Dr. William Sung emphasizes a balanced approach:</h2>', '<h2>Dr. Dave Cho emphasizes a balanced approach:</h2>'],
    ['by Dr. William Sung</li>', 'by Dr. Dave Cho and Dr. William Sung</li>', { all: true }],
    ['with Dr. William Sung</li>', 'with Dr. Dave Cho and Dr. William Sung</li>', { all: true }],
    ['<li>Dr. William Sung ’s approach', '<li>Dr. Dave Cho and Dr. William Sung’s approach'],
    ['by Dr. William Sung in Katy, TX</li>', 'by Dr. Dave Cho and Dr. William Sung in Katy, TX</li>'],
    ['<li>Dr. William Sung ’s clear aligner', '<li>Dr. Dave Cho and Dr. William Sung’s clear aligner'],
    ['with Dr. William Sung in Katy, TX</li>', 'with Dr. Dave Cho and Dr. William Sung in Katy, TX</li>'],
    ['as advised by Dr. William Sung. Proper', 'as advised by Dr. Dave Cho. Proper'],
    ['<p>Dr. William Sung and the team at Mason Park Dental are deeply', '<p>Dr. Dave Cho, Dr. William Sung and the team at Mason Park Dental are deeply'],
    ['Dr. William Sung can help outline', 'Dr. Dave Cho can help outline'],
    ['innovative solutions by Dr. William Sung, ensuring', 'innovative solutions by Dr. Dave Cho and Dr. William Sung, ensuring'],
    ['professionals like Dr. William Sung at your side', 'professionals like Dr. Dave Cho and Dr. William Sung at your side'],
  ],
  'how-long-will-it-take-to-see-my-smile-transformed-with-dental-implants-from-dr-dave-cho-in-katy': [
    ['Whether you opt for Dr. William Sung DMD Smile Transformation with Dental Implants in Katy or', 'Whether you opt for Smile Transformation with Dental Implants in Katy with Dr. Dave Cho and Dr. William Sung DMD or'],
  ],
  'are-long-lasting-dental-implants-a-good-option-for-me-in-katy-with-dr-tam-nguyen-dmd': [
    ['Dental Implants with Dr William Sung DMD | Mason Park Dental', 'Dental Implants with Dr. Cho & Dr. Sung | Mason Park Dental', { f: 'seoTitle' }],
    ['Get care from Dr William Sung DMD and permanent solutions', 'Get care from Dr. Dave Cho or Dr. William Sung DMD and permanent solutions'],
    ['<p>Dr. William Sung, a California native', '<p>Alongside Dr. Cho, Dr. William Sung, a California native'],
    ['<p>Dr. William Sung DMD will discuss your specific needs', '<p>Dr. Dave Cho will discuss your specific needs'],
    ['services like Dental Implants with Dr. William Sung DMD in Katy.</p>', 'services like Dental Implants with Dr. Dave Cho and Dr. William Sung DMD in Katy.</p>'],
    ['treatments such as Dental Implants with Dr. William Sung DMD in Katy', 'treatments such as Dental Implants with Dr. Dave Cho and Dr. William Sung DMD in Katy'],
    ['Whether you opt for Dental Implants with Dr. William Sung DMD in Katy or explore complementary services such as Long-Lasting Dental Implants with Dr. Tam Nguyen DMD in Katy and Dental Implants with Dr. Dave Cho in Katy,',
     'Whether you opt for Dental Implants with Dr. Dave Cho in Katy or explore complementary services such as Dental Implants with Dr. William Sung DMD in Katy and Long-Lasting Dental Implants with Dr. Tam Nguyen DMD in Katy,'],
  ],
  'how-does-dr-william-sung-dmd-ensure-comfort-during-my-invisalign-treatment-in-katy': [
    ['How Does Dr. William Sung DMD Ensure Comfort', 'How Do Dr. Dave Cho and Dr. William Sung DMD Ensure Comfort', { f: 'title' }],
    ['Dr. William Sung: Comfortable Invisalign in Katy', 'Dr. Cho & Dr. Sung: Comfortable Invisalign in Katy', { f: 'seoTitle' }],
    ['Invisalign care with Dr. William Sung in Katy.', 'Invisalign care with Dr. Dave Cho and Dr. William Sung in Katy.'],
    ['Katy practice, Dr. William Sung DMD is redefining', 'Katy practice, Dr. Dave Cho and Dr. William Sung DMD are redefining'],
    ['in-depth consultation with Dr. William Sung DMD.', 'in-depth consultation with Dr. Dave Cho or Dr. William Sung DMD.'],
    ['ClinCheck, Dr. Sung creates', 'ClinCheck, Dr. Cho creates'],
    ['Precision Fitting Session: Dr. William Sung DMD personally ensures', 'Precision Fitting Session: Dr. Dave Cho personally ensures'],
    ['Dr. Sung will swiftly adjust', 'Dr. Cho will swiftly adjust'],
    ['<p>Dr. William Sung DMD’s approach to Invisalign', '<p>Dr. Dave Cho and Dr. William Sung DMD’s approach to Invisalign'],
    ['Comfortable Invisalign with Dr. William Sung DMD in Katy.</p>', 'Comfortable Invisalign with Dr. Dave Cho and Dr. William Sung DMD in Katy.</p>'],
    ['Dr. William Sung DMD’s meticulous attention', 'Dr. Dave Cho’s meticulous attention'],
    ['Regular appointments with Dr. William Sung DMD ensure', 'Regular appointments with Dr. Dave Cho or Dr. William Sung DMD ensure'],
    ['Dr. William Sung DMD is committed to promptly', 'Dr. Dave Cho is committed to promptly'],
    ['Patient-Centric Care: Dr. William Sung DMD combines', 'Patient-Centric Care: Dr. Dave Cho and Dr. William Sung DMD combine'],
    ['Comfortable Invisalign with Dr. William Sung DMD in Katy, Invisalign for Straight Teeth by Dr. Dave Cho in Katy,', 'Invisalign for Straight Teeth by Dr. Dave Cho in Katy, Comfortable Invisalign with Dr. William Sung DMD in Katy,'],
    ['Trust Dr. William Sung DMD to guide you', 'Trust Dr. Dave Cho and Dr. William Sung DMD to guide you'],
  ],
  'exceptional-dental-care-in-west-houston-discover-mason-park-dental-of-katy': [
    ['Dr. Sung, Dr. Nguyen & Dr. Cho offer', 'Dr. Cho, Dr. Sung & Dr. Nguyen offer'],
    ...TEAM,
  ],
  'exceptional-dental-services-in-cinco-ranch-discover-mason-park-dental-of-katy': [
    ['Drs. Sung, Cho, & Nguyen provide', 'Drs. Cho, Sung, & Nguyen provide'],
    ...TEAM,
  ],
  'premier-dental-care-in-houston-discover-mason-park-dental-of-katy': [...TEAM],
  'premier-dental-services-in-addicks-mason-park-dental-of-katy': [...TEAM],
  'discover-exceptional-dental-care-services-at-mason-park-dental-of-katy': [...TEAM],
  'premier-dental-services-in-fulshear-discover-mason-park-dental-of-katy': [...TEAM],
  'top-quality-dental-care-in-richmond-experience-mason-park-dental-of-katy': [...TEAM],
  'superior-dental-care-in-bear-creek-village-and-mission-bend-discover-mason-park-dental-of-katy': [...TEAM],
  'the-process-of-teeth-cleaning-for-first-time-visitors-in-katy-tx-with-dr-dave-cho': [
    ['Katy, TX with Dr. William Sung, DMD</h2>', 'Katy, TX with Dr. Dave Cho and Dr. William Sung, DMD</h2>', { all: true }],
    ['Katy, TX with Dr. William Sung, DMD. ', 'Katy, TX with Dr. Dave Cho and Dr. William Sung, DMD. ', { all: true }],
    ['Dr. Sung’s expertise in advanced cleaning', 'Their expertise in advanced cleaning'],
    ['Katy, TX with Dr. William Sung, DMD and Routine', 'Katy, TX with Dr. Dave Cho and Dr. William Sung, DMD and Routine'],
  ],
  'why-choose-dr-william-sungs-invisalign-for-straight-teeth-in-katy-texas': [
    ['Why Choose Dr. William Sung’s Invisalign for straight teeth', 'Why Choose Invisalign with Dr. Dave Cho and Dr. William Sung for straight teeth', { f: 'title' }],
    ['Dr. William Sung’s Invisalign in Katy, TX | Straight Teeth', 'Dr. Cho & Dr. Sung’s Invisalign in Katy, TX | Straight Teeth', { f: 'seoTitle' }],
    ['Choose Dr. William Sung’s Invisalign in Katy, TX', 'Choose Invisalign with Dr. Dave Cho and Dr. William Sung in Katy, TX', { f: 'metaDescription' }],
    ['Expertise and Experience: Dr. William Sung brings years of experience and a proven track record in delivering effective Invisalign treatments. His personalized',
     'Expertise and Experience: Dr. Dave Cho and Dr. William Sung bring years of experience and a proven track record in delivering effective Invisalign treatments. Their personalized'],
    ['Dr. William Sung’s Invisalign', 'Dr. Dave Cho and Dr. William Sung’s Invisalign', { all: true, f: 'body' }],
  ],
  'understanding-the-process-of-overbite-correction-with-invisalign-in-katy-tx-with-dr-tam-nguyen-dmd': [
    ['overbite correction Katy TX with Dr. William Sung, DMD, detailing', 'overbite correction Katy TX with Dr. Dave Cho and Dr. William Sung, DMD, detailing'],
    ['under the professional care of Dr. William Sung, DMD:', 'under the professional care of Dr. Dave Cho and Dr. William Sung, DMD:'],
    ['<p>Dr. William Sung, DMD, brings a wealth of expertise', '<p>Dr. Dave Cho and Dr. William Sung, DMD, bring a wealth of expertise'],
    ['With Invisalign, Dr. Sung offers a personalized', 'With Invisalign, Dr. Cho offers a personalized'],
    ['Invisalign with Dr. Sung is a trusted choice', 'Invisalign with Dr. Cho is a trusted choice'],
    ['Contact Dr. William Sung, DMD, in Katy, TX, today', 'Contact Dr. Dave Cho and Dr. William Sung, DMD, in Katy, TX, today'],
    ['in Katy TX with Dr. William Sung, DMD.</p>', 'in Katy TX with Dr. Dave Cho and Dr. William Sung, DMD.</p>'],
  ],
  'can-vitamin-d-strengthen-implants-dr-william-sung-and-dr-dave-cho-explain': [
    ['Dr. William Sung on Vitamin D benefits for dental implant healing highlights', 'Dr. Dave Cho and Dr. William Sung on Vitamin D benefits for dental implant healing highlight'],
    ['dental implant recovery by Dr. William Sung and recommend', 'dental implant recovery by Dr. Dave Cho and Dr. William Sung and recommend'],
    ['implant patients advised by Dr. William Sung is tailored', 'implant patients advised by Dr. Dave Cho and Dr. William Sung is tailored'],
    ['Vitamin D by Dr. William Sung and reduce recovery time', 'Vitamin D by Dr. Dave Cho and Dr. William Sung and reduce recovery time'],
    ['His comprehensive approach to restorative dentistry prioritizes the health and well-being of his patients', 'Their comprehensive approach to restorative dentistry prioritizes the health and well-being of their patients'],
    ['His commitment to thorough pre-surgical', 'Their commitment to thorough pre-surgical'],
  ],
  'are-invisalign-aligners-comfortable-insights-and-key-considerations': [
    { insert: ['<p>Dr. William Sung, a California native', CHO_BIO] },
    ['<p>Dr. William Sung, a California native', '<p>Alongside Dr. Cho, Dr. William Sung, a California native'],
  ],
  'how-to-ensure-the-longevity-of-your-dental-implants': [
    ['Skilled professionals like Dr. William Sung at Mason Park Dental prioritize', 'Skilled professionals like Dr. Dave Cho and Dr. William Sung at Mason Park Dental prioritize'],
  ],
  'can-i-request-a-tour-of-the-dental-practice-before-becoming-a-new-patient-in-katy-tx': [
    ['where Dr. William Sung and Dr. Dave welcome new patients', 'where Dr. Dave Cho and Dr. William Sung welcome new patients'],
  ],
  'how-to-care-for-dental-implants-during-pregnancy': [
    ['<h2>William Sung and Dr. Dave Cho’s Expertise', '<h2>Dr. Dave Cho and Dr. William Sung’s Expertise'],
  ],
  'the-long-term-benefits-of-dental-implants-katy-tx': [
    { move: ['<p>Dr. Dave Cho, a beacon of compassionate', '<p>Dr. William Sung, a California native'] },
    ['<p>Dr. William Sung, a California native', '<p>Alongside Dr. Cho, Dr. William Sung, a California native'],
  ],
  'advanced-dental-implant-techniques-in-katy-tx-whats-new': [
    ['<p>William Sung’s dental practice, Mason Park Dental,', '<p>Dr. Dave Cho and Dr. William Sung’s dental practice, Mason Park Dental,'],
    { move: ['<p>Dr. Dave Cho, a beacon of compassionate', '<p>Dr. William Sung, a California native'] },
    ['<p>Dr. William Sung, a California native', '<p>Alongside Dr. Cho, Dr. William Sung, a California native'],
  ],
  'how-to-find-the-best-invisalign-provider-in-katy-tx': [
    ['professionals like Dr. Sung and his staff.', 'professionals like Dr. Cho, Dr. Sung and their staff.'],
    ['<h2>William Sung’s Expertise in Invisalign Treatment</h2>', '<h2>Dr. Dave Cho and Dr. William Sung’s Expertise in Invisalign Treatment</h2>'],
    ['with his skillful hand and personalized approach', 'with their skillful hands and personalized approach'],
    { insert: ['<p>Dr. William Sung is a highly skilled', CHO_BIO] },
    ['<p>Dr. William Sung is a highly skilled', '<p>Alongside Dr. Cho, Dr. William Sung is a highly skilled'],
  ],
  'invisalign-in-katy-tx-a-guide-to-the-cost-and-benefits': [
    { insert: ['<p>Dr. William Sung, DMD is a highly skilled', CHO_BIO] },
    ['<p>Dr. William Sung, DMD is a highly skilled', '<p>Alongside Dr. Cho, Dr. William Sung, DMD is a highly skilled'],
  ],
  'invisalign-in-katy-tx-how-to-find-the-best-provider-for-your-smile': [
    ['<h2>William Sung: Your Partner in Invisalign Care</h2>', '<h2>Dr. Dave Cho and Dr. William Sung: Your Partners in Invisalign Care</h2>'],
    { move: ['<p>Dr. Dave Cho’s journey from biochemistry', '<p>Dr. William Sung is a highly skilled'] },
    ['<p>Dr. William Sung is a highly skilled', '<p>Alongside Dr. Cho, Dr. William Sung is a highly skilled'],
  ],
  'invisalign-a-comparison-with-traditional-braces': [
    ['Dr. William Sung, DMD and Dr. Dave Cho and Dr Dave Cho', 'Dr. Dave Cho and Dr. William Sung, DMD'],
    ['<h2>William Sung’s Expertise</h2>', '<h2>Dr. Dave Cho and Dr. William Sung’s Expertise</h2>'],
    ['benefit from Dr. William Sung, DMD and Dr. Dave Cho’s expertise', 'benefit from the expertise of Dr. Dave Cho and Dr. William Sung, DMD'],
    ['Dr. Sung & Dr.Cho guides', 'Dr. Cho & Dr. Sung guide'],
    ['Dr. William Sung, DMD and Dr. Dave Cho and his team', 'Dr. Dave Cho, Dr. William Sung, DMD, and their team'],
    { insert: ['<p>Dr. William Sung, DMD is a highly skilled', CHO_BIO] },
    ['<p>Dr. William Sung, DMD is a highly skilled', '<p>Alongside Dr. Cho, Dr. William Sung, DMD is a highly skilled'],
  ],
  'look-10-years-younger-dr-william-sung': [
    ['Look 10 Years Younger | Dr. William Sung', 'Look 10 Years Younger | Dr. Dave Cho & Dr. William Sung', { f: 'title' }],
    ['Look 10 Years Younger | Dr. William Sung - Dentist Katy', 'Look 10 Years Younger | Dr. Cho & Dr. Sung - Dentist Katy', { f: 'seoTitle' }],
  ],
};

// ---- engine ---------------------------------------------------------------------------------------

function count(hay, needle) { let n = 0, i = 0; while ((i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; } return n; }

// Replace `old` with `new` only in text outside existing copies of `new` (idempotence).
function replaceOutside(text, oldS, newS, all) {
  const pieces = newS.includes(oldS) ? text.split(newS) : [text];
  let hits = 0;
  const out = pieces.map((p) => {
    const c = count(p, oldS);
    hits += c;
    return c ? p.split(oldS).join(newS) : p;
  });
  if (!all && hits > 1) throw new Error(`not unique (${hits}x): ${oldS}`);
  return { text: out.join(newS), hits };
}

function applyEntry(cells, entry, log, slug) {
  if (Array.isArray(entry)) {
    const [oldS, newS, opt = {}] = entry;
    let hits = 0, already = false;
    for (const f of opt.f ? [opt.f] : FIELDS) {
      if (typeof cells[f] !== 'string') continue;
      const r = replaceOutside(cells[f], oldS, newS, opt.all);
      if (r.hits) { cells[f] = r.text; hits += r.hits; log.push(`${f}: ${oldS}  ->  ${newS}${r.hits > 1 ? `  (x${r.hits})` : ''}`); }
      else if (cells[f].includes(newS)) already = true;
    }
    if (!hits && !already) log.push(`!! MISSING: ${oldS}`);
    return hits;
  }
  const lines = cells.body.split('\n');
  if (entry.move) {
    const [movePfx, beforePfx] = entry.move;
    const a = lines.findIndex((l) => l.startsWith(movePfx));
    let b = lines.findIndex((l) => l.startsWith(beforePfx));
    // On a re-run the anchor has already been renamed by its "Alongside Dr. Cho," entry.
    if (b < 0) b = lines.findIndex((l) => l.startsWith('<p>Alongside Dr. Cho, ' + beforePfx.slice(3)));
    if (a < 0 || b < 0) { log.push(`!! MISSING move: ${movePfx} / ${beforePfx}`); return 0; }
    if (a < b) return 0; // already ahead
    const [line] = lines.splice(a, 1);
    lines.splice(b, 0, line);
    cells.body = lines.join('\n');
    log.push(`body: moved line "${movePfx}…" before "${beforePfx}…"`);
    return 1;
  }
  if (entry.insert) {
    const [beforePfx, html] = entry.insert;
    if (cells.body.includes(html)) return 0;
    const b = lines.findIndex((l) => l.startsWith(beforePfx));
    if (b < 0) { log.push(`!! MISSING insert anchor: ${beforePfx}`); return 0; }
    lines.splice(b, 0, html);
    cells.body = lines.join('\n');
    log.push(`body: inserted Dr. Cho bio before "${beforePfx}…"`);
    return 1;
  }
  throw new Error(`bad entry in ${slug}`);
}

// Paragraph-level check: every block (field, or body line) naming Sung also names Cho, and Cho first.
// A team-list line "<p>Dr. William Sung: …" passes when the line above it is Dr. Cho's.
function check(cells) {
  const bad = [];
  for (const f of FIELDS) {
    const v = cells[f] || '';
    const blocks = f === 'body' ? v.split('\n') : [v];
    blocks.forEach((b, i) => {
      const s = b.indexOf('Sung');
      if (s < 0) return;
      const c = b.search(/\bCho\b/);
      if (c >= 0 && c < s) return;
      if (f === 'body' && b.startsWith('<p>Dr. William Sung: ') && (blocks[i - 1] || '').startsWith('<p>Dr. Dave Cho: ')) return;
      bad.push(`[${f}] ${b.slice(0, 220)}`);
    });
  }
  return bad;
}

const raw = fs.readFileSync(FILE, 'utf8');
const data = JSON.parse(raw);
if (JSON.stringify(data, null, 2) !== raw) throw new Error('cms-rows.json is not 2-space JSON without trailing newline; refusing to reformat');
const rows = Array.isArray(data) ? data : data.rows;

const known = new Set(rows.map((r) => r.slug));
for (const s of Object.keys(E)) if (!known.has(s)) throw new Error(`unknown slug in E: ${s}`);

let changed = 0, total = 0, missing = 0;
const failures = [];
for (const row of rows) {
  const cells = row.cells;
  const slugBefore = cells.slug;
  const log = [];
  let n = 0;
  for (const e of E[row.slug] || []) n += applyEntry(cells, e, log, row.slug);
  for (const [o, nw] of SWAPS) {
    for (const f of FIELDS) {
      if (typeof cells[f] !== 'string') continue;
      const r = replaceOutside(cells[f], o, nw, true);
      if (r.hits) { cells[f] = r.text; n += r.hits; log.push(`${f}: swap ${o} -> ${nw}  (x${r.hits})`); }
    }
  }
  if (typeof cells.excerpt === 'string' && cells.excerpt.endsWith(EXCERPT_TAIL[0])) {
    cells.excerpt = cells.excerpt.slice(0, -EXCERPT_TAIL[0].length) + EXCERPT_TAIL[1];
    log.push(`excerpt: tail "${EXCERPT_TAIL[0]}" -> "${EXCERPT_TAIL[1]}"`); n++;
  }
  if (cells.slug !== slugBefore) throw new Error('slug changed: ' + slugBefore);
  missing += log.filter((l) => l.startsWith('!!')).length;
  if (n) { changed++; total += n; console.log(`\n${String(n).padStart(3)}  ${row.slug}`); for (const l of log) console.log('       ' + l); }
  else if (log.length) { console.log(`\n  0  ${row.slug}`); for (const l of log) console.log('       ' + l); }
  const bad = check(cells);
  if (bad.length) failures.push([row.slug, bad]);
}

console.log(`\narticles changed: ${changed}   edits: ${total}   missing: ${missing}`);
console.log(`check (Sung named without Cho first, per field / body paragraph): ${failures.length} articles`);
for (const [s, bad] of failures) { console.log(`  ${s}`); for (const b of bad) console.log(`     ${b}`); }

if (WRITE) {
  if (missing) throw new Error('missing entries; not writing');
  if (!fs.existsSync(BACKUP)) fs.writeFileSync(BACKUP, raw);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  console.log(`\nwrote ${FILE}\nbackup ${BACKUP}`);
}
