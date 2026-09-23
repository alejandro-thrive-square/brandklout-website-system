// Download the practice's own media. Webflow serves each image as a family of
// responsive variants (-p-500, -p-800, ...); we keep the largest of each family
// and record the family so the build can regenerate the smaller ones.
import fs from 'node:fs';
import path from 'node:path';

const outRoot = process.argv[2];
const inputs = process.argv.slice(3);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';

const all = new Map();
for (const f of inputs) {
  for (const a of JSON.parse(fs.readFileSync(f, 'utf8')).assets) {
    const prev = all.get(a.url);
    if (prev) { prev.pages = [...new Set([...prev.pages, ...a.pages])]; prev.kinds = [...new Set([...prev.kinds, ...a.kinds])]; prev.alts = [...new Set([...prev.alts, ...a.alts])]; }
    else all.set(a.url, { ...a });
  }
}

// group Webflow responsive families: <base>-p-500.ext / <base>.ext
const fam = new Map();
for (const a of all.values()) {
  const m = a.url.match(/^(.*?)(?:-p-(\d+))?(\.[a-z0-9]+)(?:\?.*)?$/i);
  const key = m ? m[1] + m[3].toLowerCase() : a.url;
  const width = m && m[2] ? Number(m[2]) : Infinity; // no suffix = original, largest
  if (!fam.has(key)) fam.set(key, { variants: [], alts: new Set(), pages: new Set(), kinds: new Set() });
  const g = fam.get(key);
  g.variants.push({ url: a.url, width });
  a.alts.forEach(x => g.alts.add(x)); a.pages.forEach(x => g.pages.add(x)); a.kinds.forEach(x => g.kinds.add(x));
}

fs.mkdirSync(outRoot, { recursive: true });
const manifest = [];
let ok = 0, fail = 0, bytes = 0;

for (const [key, g] of fam) {
  g.variants.sort((a, b) => b.width - a.width);
  const best = g.variants[0];
  let name = decodeURIComponent(path.basename(new URL(best.url).pathname));
  name = name.replace(/[^\w.\-]+/g, '_').slice(-120);
  const dest = path.join(outRoot, name);
  let size = 0, status = 0;
  try {
    const r = await fetch(best.url, { headers: { 'User-Agent': UA, Referer: 'https://legacydentalpasadena.com/' } });
    status = r.status;
    if (r.ok) { const buf = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(dest, buf); size = buf.length; ok++; bytes += size; }
    else fail++;
  } catch (e) { fail++; status = String(e.message).slice(0, 60); }
  manifest.push({
    file: name, url: best.url, status, bytes: size,
    variants: g.variants.map(v => v.url),
    alt: [...g.alts].filter(Boolean)[0] || '',
    pages: [...g.pages], kinds: [...g.kinds],
  });
}

manifest.sort((a, b) => b.bytes - a.bytes);
fs.writeFileSync(path.join(outRoot, '..', 'asset-catalogue.json'), JSON.stringify({ downloaded: ok, failed: fail, totalBytes: bytes, assets: manifest }, null, 2));
console.log(`families ${fam.size}  downloaded ${ok}  failed ${fail}  ${(bytes / 1048576).toFixed(1)} MB`);
