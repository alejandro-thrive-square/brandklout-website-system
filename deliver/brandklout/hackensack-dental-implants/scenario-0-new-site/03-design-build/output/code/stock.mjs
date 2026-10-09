// Client script, 2026-10-09. Licensed stock from the Freepik API (the MAGNIFIC key in the worktree
// .env is a Freepik key: the account's premium licence). Objects, rooms and food only: never a face
// beside a treatment (IMAGES.md section 1).
//
//   node code/stock.mjs search <slot> "<term>" [--n 12]   previews -> assets/stock/<slot>/ + sheet.jpg
//   node code/stock.mjs get <slot> <id>                   full-res -> assets/stock/<slot>/<id>.jpg
// Every download is listed in assets/stock/stock-ledger.json (slot, id, title, url, licence).
// Never pipe this script's output on Windows; redirect to a file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..');
let dir = OUT;
for (let i = 0; i < 12 && !fs.existsSync(path.join(dir, '.env')); i++) dir = path.dirname(dir);
for (const line of fs.readFileSync(path.join(dir, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const KEY = process.env.MAGNIFIC;
if (!KEY) throw new Error('MAGNIFIC (Freepik key) is not in the worktree .env');
const H = { 'x-freepik-api-key': KEY, Accept: 'application/json' };
const STOCK = path.join(OUT, 'assets', 'stock');
const ledgerFile = path.join(STOCK, 'stock-ledger.json');
const [cmd, slot, arg] = process.argv.slice(2);
const n = Number(process.argv.includes('--n') ? process.argv[process.argv.indexOf('--n') + 1] : 12);
fs.mkdirSync(path.join(STOCK, slot || '_'), { recursive: true });

const get = async (url) => {
  for (let t = 0; t < 4; t++) {
    const r = await fetch(url, { headers: H });
    if (r.status >= 500 || r.status === 429) { await new Promise((s) => setTimeout(s, 3000 * (t + 1))); continue; }
    if (!r.ok) throw new Error(`${r.status} ${url} ${(await r.text()).slice(0, 200)}`);
    return r.json();
  }
  throw new Error(`gave up: ${url}`);
};

if (cmd === 'search') {
  const q = new URLSearchParams({ term: arg, limit: String(n), 'filters[content_type][photo]': '1', order: 'relevance' });
  const res = await get(`https://api.freepik.com/v1/resources?${q}`);
  const rows = [];
  for (const r of res.data || []) {
    const src = r.image?.source?.url;
    if (!src) continue;
    const f = path.join(STOCK, slot, `p-${r.id}.jpg`);
    if (!fs.existsSync(f)) {
      const b = await fetch(src);
      if (b.ok) fs.writeFileSync(f, Buffer.from(await b.arrayBuffer()));
    }
    rows.push({ id: r.id, title: r.title, w: r.image?.source?.size, premium: r.licenses?.some?.((l) => l.type === 'premium') });
    console.log(`${r.id}  ${r.title}`);
  }
  fs.writeFileSync(path.join(STOCK, slot, 'search.json'), JSON.stringify({ term: arg, rows }, null, 2));
} else if (cmd === 'get') {
  const res = await get(`https://api.freepik.com/v1/resources/${arg}/download`);
  const url = res.data?.url || res.data?.signed_url;
  if (!url) throw new Error(`no download url: ${JSON.stringify(res).slice(0, 300)}`);
  const b = await fetch(url);
  if (!b.ok) throw new Error(`download ${b.status}`);
  const ext = (res.data?.filename || 'x.jpg').split('.').pop().toLowerCase();
  const f = path.join(STOCK, slot, `${arg}.${ext}`);
  fs.writeFileSync(f, Buffer.from(await b.arrayBuffer()));
  const meta = await get(`https://api.freepik.com/v1/resources/${arg}`).catch(() => ({}));
  const ledger = fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, 'utf8')) : [];
  ledger.push({ slot, id: arg, title: meta.data?.title || '', url: meta.data?.url || '', file: path.relative(OUT, f).replace(/\\/g, '/'), licence: 'Freepik premium (MAGNIFIC key)', at: new Date().toISOString() });
  fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2));
  console.log(`saved ${f} ${Math.round(fs.statSync(f).size / 1024)} KB`);
} else {
  console.log('usage: stock.mjs search <slot> "<term>" | get <slot> <id>');
}
process.exitCode = 0;
