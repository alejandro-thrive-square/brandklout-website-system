// Unpacks the payload extract.js built (received by recv.mjs) into this folder:
//   catalog.json  - one row per product, description parsed, no signed CDN URLs (tracked)
//   catalog.csv   - the same, flat, for a quick look in a sheet (tracked)
//   images/<waId>/<n>.jpg - the client's own catalogue photos (gitignored, backed up to R2)
// Usage: node unpack.mjs <payload.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// "279.585 Bs" / "34.000Bs" / "73.600" -> 279585 / 34000 / 73600; blank -> null.
const parsePrice = (v) => {
  const m = (v || '').replace(/\s/g, '').match(/^([\d.,]+)/);
  if (!m) return null;
  const [int, dec = ''] = m[1].split(',');
  return Number(int.replace(/\./g, '') + (dec ? '.' + dec : ''));
};

// The client writes the unit by hand: "Bs", "bs", "$", or nothing (which is Bs everywhere it can be checked).
const parseCurrency = (v) => (/\$/.test(v || '') ? 'USD' : /bs/i.test(v || '') ? 'Bs' : null);
const EMOJI = /[\u{1F100}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
const stripEmoji = (s) => s.replace(EMOJI, '').replace(/\s+/g, ' ').trim();

const rows = src.products.map((p) => {
  const fields = {};
  const free = [];
  const priceOptions = [];
  for (const raw of p.description.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([^:]{1,40}):\s*(.*)$/);
    const opt = line.match(/^([\d.,]+)\s*(Bs|\$)\s*\((.+)\)$/i);
    if (m) fields[m[1].trim()] = m[2].trim();
    else if (opt) priceOptions.push({ price: parsePrice(opt[1]), currency: parseCurrency(opt[2]), label: opt[3].trim() });
    else free.push(line);
  }
  const estado = fields['Estado'] || '';
  const specs = Object.entries(fields)
    .filter(([k]) => !['Precio', 'Estado'].includes(k))
    .map(([k, v]) => `${k}: ${v}`);
  const price = parsePrice(fields['Precio']);
  const status = /agotad/i.test(estado) ? 'agotado' : /en camino/i.test(estado) ? 'en-camino' : 'disponible';

  const dir = path.join(here, 'images', p.waId);
  fs.mkdirSync(dir, { recursive: true });
  const images = [];
  p.imageFiles.forEach((f, i) => {
    if (!f) return;
    const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
    const file = `${i + 1}.${ext}`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(f.data.split(',')[1], 'base64'));
    images.push({ file: `images/${p.waId}/${file}`, w: f.w, h: f.h, bytes: f.size });
  });

  return {
    order: p.order,
    waId: p.waId,
    name: stripEmoji(p.name),
    nameAsTyped: p.name,
    markedNew: /\u{1F195}/u.test(p.name + estado),
    price,
    currency: price == null ? null : parseCurrency(fields['Precio']) || 'Bs',
    currencyAssumed: price != null && !parseCurrency(fields['Precio']),
    priceOptions,
    priceText: fields['Precio'] ?? null,
    estado: stripEmoji(estado) || null,
    status,
    specs,
    notes: free,
    collections: p.collections,
    images,
    description: p.description,
    waAvailability: p.availability,
    waMaxAvailable: p.maxAvailable,
    waHidden: p.isHidden,
    waReviewStatus: p.reviewStatus,
  };
});

const out = {
  source: 'WhatsApp Business catalogue of Alki House (contact "Anferny"), read from web.whatsapp.com',
  extractedAt: src.extractedAt,
  businessWid: src.business.wid,
  collections: src.business.collections.map((c) => ({ id: c.id, name: c.name, count: c.count })),
  count: rows.length,
  products: rows,
};
fs.writeFileSync(path.join(here, 'catalog.json'), JSON.stringify(out, null, 2) + '\n');

const esc = (v) => {
  const s = Array.isArray(v) ? v.join(' | ') : v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const cols = ['order', 'waId', 'name', 'price', 'currency', 'priceOptions', 'status', 'estado', 'markedNew', 'specs', 'notes', 'collections', 'images'];
const cell = (r, c) =>
  c === 'images' ? r.images.length : c === 'priceOptions' ? r.priceOptions.map((o) => `${o.label}: ${o.price} ${o.currency}`) : r[c];
const csv = [cols.join(',')].concat(rows.map((r) => cols.map((c) => esc(cell(r, c))).join(','))).join('\n');
fs.writeFileSync(path.join(here, 'catalog.csv'), '﻿' + csv + '\n');

const imgs = rows.reduce((s, r) => s + r.images.length, 0);
const by = (k) => rows.reduce((o, r) => ((o[r[k]] = (o[r[k]] || 0) + 1), o), {});
console.log(`${rows.length} products, ${imgs} images`);
console.log('status', JSON.stringify(by('status')), 'currency', JSON.stringify(by('currency')));
console.log(`no price: ${rows.filter((r) => r.price == null && !r.priceOptions.length).map((r) => r.order).join(',')}`);
console.log(`currency assumed Bs: ${rows.filter((r) => r.currencyAssumed).map((r) => r.order).join(',')}`);
