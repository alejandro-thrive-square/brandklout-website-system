import fs from 'node:fs';
const trees = JSON.parse(fs.readFileSync('C:/Users/ACER/AppData/Local/Temp/phone-trees.json', 'utf8'));
const PAGES = JSON.parse(fs.readFileSync('phone-pages.json', 'utf8'));
const RE = /(\(?\d{3}\)?[ .\u00a0-]?\d{3}[ .-]\d{4})/;
export function root(t) { const r = t?.result ?? t; const a = Array.isArray(r) ? r : [r]; return a[0]?.data ?? a[0]; }
export function scan(node) {
  const hits = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (n.type === 'String' && RE.test(n.textContent || '')) hits.push({ kind: 'text', id: n.id, value: n.textContent });
    const href = n.attributes?.href ?? n.settings?.link?.href;
    if (typeof href === 'string' && /tel:|\d{3}[ .-]?\d{4}/.test(href)) hits.push({ kind: 'href', id: n.id, type: n.type, value: href, linkType: n.settings?.link?.linkType });
    for (const [k, v] of Object.entries(n.attributes || {})) if (k !== 'href' && typeof v === 'string' && RE.test(v)) hits.push({ kind: 'attr', name: k, id: n.id, value: v });
    for (const [k, v] of Object.entries(n.settings || {})) if (typeof v === 'string' && RE.test(v)) hits.push({ kind: 'setting', name: k, id: n.id, value: v });
    walk(n.children);
  };
  walk(node);
  return hits;
}
if ((process.argv[1]||'').endsWith('phone-report.mjs')) {
  let total = 0;
  for (const p of PAGES) {
    const hits = scan(root(trees[p.id]));
    total += hits.length;
    const tally = {};
    for (const h of hits) { const k = `${h.kind}${h.name ? ':' + h.name : ''} = ${h.value}`; tally[k] = (tally[k] || 0) + 1; }
    console.log(`\n${p.slug}  (${hits.length})`);
    for (const [k, n] of Object.entries(tally).sort()) console.log(`  ${String(n).padStart(3)}x  ${k}`);
  }
  console.log('\nTOTAL', total);
}
