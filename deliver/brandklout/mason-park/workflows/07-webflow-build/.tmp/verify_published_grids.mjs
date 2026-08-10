/* The API read-back is not the gate; the served stylesheet is. Fetch each page,
   find its Webflow CSS, and read the real cascade for the grid ladders. */
const PAGES = ['invisalign', 'new-patient-special', 'thank-you'];
const BASE = 'https://mason-park-dental.webflow.io';
const RULES = ['.foot-grid', '.grid--3'];

for (const p of PAGES) {
  const html = await (await fetch(`${BASE}/${p}`, { cache: 'no-store' })).text();
  const href = (html.match(/href="([^"]+\.css[^"]*)"/g) || [])
    .map(h => h.slice(6, -1)).find(h => /\.css/.test(h));
  if (!href) { console.log(p, 'NO STYLESHEET FOUND'); continue; }
  const url = href.startsWith('http') ? href : new URL(href, BASE).href;
  const css = await (await fetch(url, { cache: 'no-store' })).text();
  console.log(`\n== ${p} ==  ${url.split('/').pop()}`);
  for (const sel of RULES) {
    // every occurrence, with the @media it sits in
    const re = new RegExp(`@media[^{]*\{[^@]*?\${sel}\s*\{[^}]*grid-template-columns:([^;}]+)`, 'g');
    let m, found = [];
    while ((m = re.exec(css))) {
      const media = m[0].slice(0, m[0].indexOf('{')).trim();
      found.push(`${media} -> ${m[1].trim()}`);
    }
    const baseRe = new RegExp(`(^|\})\s*\${sel}\s*\{[^}]*grid-template-columns:([^;}]+)`, 'g');
    let b; const baseHits = [];
    while ((b = baseRe.exec(css))) baseHits.push(b[2].trim());
    console.log(` ${sel}  base: ${baseHits.join(' | ') || '(none)'}`);
    for (const f of found) console.log(`   ${f}`);
  }
}
