#!/usr/bin/env node
/**
 * push-bio.mjs — the client's bio corrections on /meet-dr-nahlah.
 *
 * Removes the Inova Fairfax hospital privileges and adds the VCU adjunct
 * faculty post, the American College of Prosthodontists fellowship, the
 * Virginia dental license, and the 18,000 implants / 15,000 arches. The
 * credential record goes from twelve to fourteen.
 *
 * The replacements are written in INSTATIC'S class idiom, not the local
 * build's. The two diverged when the local package was re-architected on
 * 2026-08-17 (`.k` here is `.cr-key` locally, `pk alt` is `pk pk-alt`), and
 * Instatic has no CSS for the newer names — importing local markup verbatim
 * would land correct copy in unstyled elements. Migrating the whole vocabulary
 * is a separate piece of work; this change is content only.
 */
import { callJson } from './instatic-mcp.mjs';

const cred = (n, text) => `<li><span class="k">${n}</span>${text}</li>`;

const EDITS = [
  // hero lead
  { label: 'hero lead', uid: 'tj9cLaeqtd-4MBfX-lp9J',
    html: 'Board-certified prosthodontist. Diplomate of the American Board of Prosthodontics and Fellow of the American College of Prosthodontists. Practising since 2003, in Northern Virginia since 2013.' },

  // hero meta: "1 of 12 recognised specialties" gives way to the case volume.
  // The specialty framing is not lost, it is the whole next section's headline.
  { label: 'hero meta', uid: 'bQHUeBKBT9rDuoBf2WRxG',
    html: '<div><b>Since 2003</b><span>In practice</span></div>'
        + '<div><b>Diplomate</b><span>Am. Board of Prosthodontics, 2013</span></div>'
        + '<div><b>18,000+</b><span>Implants placed</span></div>'
        + '<div><b>15,000+</b><span>Arches restored</span></div>' },

  // the specialty body: paragraph three loses Inova and gains the fellowship
  // and the Virginia licence; a fourth paragraph carries the volume figures
  { label: 'specialty body', uid: 'PxgHeIGhfO4QExyLekD5W',
    html: '<p>Prosthodontics is one of twelve dental specialties recognised in the United States. It is the one concerned with <strong>replacing and restoring teeth</strong>: implants, crowns, bridges, veneers, dentures and full-mouth rehabilitation. It takes three years of training beyond dental school to practise.</p>'
        + '<p>Dr. Nahlah has been a practising dentist <strong>since 2003</strong>. He moved to Northern Virginia in 2013 to focus entirely on prosthodontics: esthetic dentistry, implant dentistry, full-mouth rehabilitation and smile makeovers.</p>'
        + '<p>In <strong>2013 the American Board of Prosthodontics awarded him Diplomate status</strong>, the most prestigious credential in the field. He is also a <strong>Fellow of the American College of Prosthodontists</strong>, and holds a Virginia dental license alongside his original California one.</p>'
        + '<p>Across that career he has placed <strong>over 18,000 implants</strong> and restored <strong>over 15,000 arches</strong>. He has published in national and international scientific journals and lectures extensively on smile design and dental implants. That is the kind of work that tends to bring other dentists&rsquo; difficult cases to his door.</p>' },

  { label: 'credentials h2', uid: 'TeqPAAuxY3HwmMAKwEH8q', html: 'All fourteen, in full.' },
  { label: 'credentials lede', uid: 'DtRMrx-HqyleaxbuglcgD',
    html: 'The home page shows eight of these. Here is the complete record.' },

  { label: 'credentials col 1', uid: 'PbVqMsCaxYGSOBlvIM_Vr',
    html: cred('01', 'Diplomate, American Board of Prosthodontics')
        + cred('02', 'Fellow, American College of Prosthodontists')
        + cred('03', 'Adjunct Faculty, Virginia Commonwealth University, Prosthodontics Postgraduate Program')
        + cred('04', 'Certificate in Prosthodontics')
        + cred('05', 'M.S., Master of Science in Oral Biology')
        + cred('06', 'Fellow, International Congress of Oral Implantologists')
        + cred('07', 'Associate Fellow, American Academy of Implant Dentistry') },

  { label: 'credentials col 2', uid: 'DdwvZGiBj-WyTsmI3Eyfy',
    html: cred('08', 'IV Sedation Certificate')
        + cred('09', 'BLS &amp; ACLS Provider')
        + cred('10', 'CRDTS, Central Regional Dental Testing Service')
        + cred('11', 'American National Dental Board')
        + cred('12', 'Virginia Dental License')
        + cred('13', 'California Dental License')
        + cred('14', 'California Dental Board') },

  // teaching: the VCU post takes the lead paragraph, UCSF moves to a second one
  { label: 'teaching lead', uid: 'JPsj3a2Ych1sKBLn2VwHG',
    html: 'Dr. Nahlah is <strong>adjunct faculty at Virginia Commonwealth University</strong>, teaching the residents in its Prosthodontics Postgraduate Program: the dentists who are themselves training to become prosthodontists.' },

  { label: 'memberships fellow', uid: 'cPGi1Q_9PEroLayUj7uqz',
    html: '<i></i>Fellow, American College of Prosthodontists' },
];

// The UCSF sentence needs a paragraph of its own, inserted after the new VCU
// one. Children of the teaching copy block are: chapter-tag, h2, p(VCU),
// p(Tysons Study Club), ul — so index 3 puts it between the two.
const INSERT = {
  label: 'teaching UCSF paragraph',
  parentId: 'NR2du8G9h2efIRp172-IA',
  index: 3,
  html: '<p data-rv="">He was a <strong>clinical instructor at the University of California, San Francisco School of Dentistry</strong> before relocating, and still takes time out of the practice to run hands-on courses and lectures for other dentists.</p>',
};

let ok = 0;
const problems = [];

for (const e of EDITS) {
  try {
    const r = await callJson('site_replace_node_html', { nodeId: e.uid, html: e.html });
    if (r && typeof r.text === 'string') {
      if (!/does not accept children/i.test(r.text)) throw new Error(r.text.slice(0, 150));
      // plain-text node: the { text } prop escapes markup, so it may only be
      // used when the replacement carries none
      if (/<[a-z]/i.test(e.html)) throw new Error('text node but replacement has markup — rewrite its parent instead');
      const r2 = await callJson('site_update_node_props', { nodeId: e.uid, patch: { text: e.html } });
      if (!r2 || r2.ok !== true) throw new Error(`props patch rejected: ${JSON.stringify(r2).slice(0, 130)}`);
    }
    ok++;
    console.log(`  ${e.label.padEnd(22)} ${e.uid} ok`);
  } catch (err) {
    problems.push(`${e.label} (${e.uid}): ${err.message.slice(0, 170)}`);
  }
}

try {
  const r = await callJson('site_insert_html', INSERT);
  if (r && typeof r.text === 'string' && !/ok/i.test(r.text)) throw new Error(r.text.slice(0, 150));
  ok++;
  console.log(`  ${INSERT.label.padEnd(22)} inserted at ${INSERT.parentId}[${INSERT.index}]`);
} catch (err) {
  problems.push(`${INSERT.label}: ${err.message.slice(0, 170)}`);
}

console.log(`\n${ok}/${EDITS.length + 1} applied`);
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
