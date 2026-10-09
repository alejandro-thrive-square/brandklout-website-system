// Turns the shop's WhatsApp Business catalogue into the catalogue the site
// renders: one row per product, the client's own Spanish name, brand,
// category, price in bolívares, status, specs and photos.
//
// Source: 01-content-intake/.tmp/whatsapp-catalog/catalog.json, extracted from
// WhatsApp Web (method in that folder's README). It replaced the purchase
// ledger (00-…/client-handoff/Stock/products.csv) on 2026-10-09; the ledger
// version of this script is in git history (6591b8f7).
//
// This JSON is the stand-in for the Google Sheet the client will maintain. Its
// columns ARE the sheet's columns; docs/cms-schema.md fixes them.
// Hand-written copy (taglines, descriptions, extra specs, featured flags) lives
// in catalogue-overrides.json keyed by id, so re-running never loses it.
//
// Keys: `id` and `slug` are made from the name the first time a WhatsApp
// product is seen and recorded in catalogue-keys.json against its WhatsApp id,
// so a product renamed in WhatsApp keeps its URL, its photos and saved carts.
//
// Usage: node build-catalogue.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WA_DIR = path.resolve(HERE, '../../../../01-content-intake/.tmp/whatsapp-catalog');
const OUT = path.join(HERE, 'products.json');
const OVERRIDES = path.join(HERE, 'catalogue-overrides.json');
const KEYS = path.join(HERE, 'catalogue-keys.json');
// prepare-assets.py resolves `photos` against this, relative to site-src/.
const PHOTO_ROOT = path.relative(path.dirname(HERE), WA_DIR).split(path.sep).join('/');

const wa = JSON.parse(fs.readFileSync(path.join(WA_DIR, 'catalog.json'), 'utf8'));
const overrides = fs.existsSync(OVERRIDES) ? JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')) : {};
const keys = fs.existsSync(KEYS) ? JSON.parse(fs.readFileSync(KEYS, 'utf8')) : {};

const slugify = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/* ---- brand -------------------------------------------------------------
   The maker, never the camera an accessory fits: "Jaula para Sony A7 IV marca
   Smallrig" is SmallRig, "Adaptador Pentax PK a Sony E" has none. A "Marca:"
   line in the client's description wins. */
const BRANDS = ['DJI', 'Zhiyun', 'Feiyutech', 'Hollyland', 'Godox', 'Neewer', 'SmallRig', 'Ulanzi', 'Viltrox', 'Feelworld', 'Colbor',
  'Triopo', 'Kastar', 'Sirui', 'K&F Concept', 'Andoer', 'Fotga'];
function brand(name, marca) {
  if (marca) return BRANDS.find((b) => fold(b) === fold(marca)) || marca;
  const l = fold(name);
  return BRANDS.find((b) => l.includes(fold(b))) || (/\bosmo\b|\bdji\b/i.test(name) ? 'DJI' : '');
}

/* ---- category ------------------------------------------------------------
   The site's eleven aisles (ids appear in ?cat= links). First match wins, so
   the specific rules come first: a tripod for gimbals is support, a Bowens
   adapter or a snoot "para luz de video" is a light modifier, a lens adapter
   is not, and "Luz ZU80 Mini Bowens" is a light. */
const CATS = [
  ['gimbals', 'Gimbals y estabilizadores'], ['iluminacion', 'Iluminación de estudio'], ['modificadores', 'Softboxes y modificadores'],
  ['audio', 'Audio'], ['monitores', 'Monitores y grabación'], ['rigs', 'Jaulas, rigs y soportes'], ['adaptadores', 'Adaptadores y filtros'],
  ['energia', 'Baterías y energía'], ['cuidado', 'Cuidado y fundas'], ['camaras', 'Cámaras y lentes'], ['accesorios', 'Accesorios'],
];
const RULES = [
  ['rigs', /tr[ií]pode|jaula|handle|magic arm|brazo m[aá]gico|clamp|abrazadera/i],
  ['modificadores', /softbox|snoot|adaptador.*bowens/i],
  ['gimbals', /weebill|crane|smooth|scorp|osmo mobile|estabilizador/i],
  ['iluminacion', /\bluz\b|barra led|colbor|cinepeer/i],
  ['audio', /hollyland|lark|\bmic\b|micr[oó]fono/i],
  ['monitores', /monitor|capturadora|hdmi/i],
  ['adaptadores', /adaptador|filtro/i],
  ['energia', /bater[ií]a/i],
];
const category = (name) => (RULES.find(([, re]) => re.test(name)) || ['accesorios'])[0];

/* ---- specs ---------------------------------------------------------------
   The client's own "Etiqueta: valor" lines first; an override adds only the
   labels the client did not write ("Carga" and "Carga máxima" are one label). */
function mergeSpecs(client, extra) {
  const have = client.map(([k]) => fold(k));
  const dup = (k) => have.some((h) => h.startsWith(fold(k)) || fold(k).startsWith(h));
  return client.concat((extra || []).filter(([k]) => !dup(k)));
}
const fmtBs = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Bs';

/* ---- rows ---------------------------------------------------------------- */
const seenId = new Set(Object.values(keys).map((k) => k.id));
const seenSlug = new Set(Object.values(keys).map((k) => k.slug));
const flags = [];
const products = wa.products.map((w) => {
  if (!keys[w.waId]) {
    let id = slugify(w.name), slug = id;
    while (seenId.has(id)) id += '-2';
    while (seenSlug.has(slug)) slug += '-2';
    seenId.add(id); seenSlug.add(slug);
    keys[w.waId] = { id, slug, firstName: w.name };
  }
  const { id, slug } = keys[w.waId];
  const o = overrides[id] || {};
  const lines = w.specs.map((s) => { const i = s.indexOf(':'); return [s.slice(0, i).trim(), s.slice(i + 1).trim()]; });
  const marca = (lines.find(([k]) => fold(k) === 'marca') || [])[1];
  const clientSpecs = lines.filter(([k]) => fold(k) !== 'marca');
  // Two prices in one listing (the FX3/FX30 cage): the first is the price, both are specs.
  const optionSpecs = w.priceOptions.map((p) => [p.label, fmtBs(p.price)]);
  // The catalogue is priced in Bs; a price in any other currency is not shown next to them.
  let price = w.price;
  if (price != null && w.currency !== 'Bs') { flags.push(`${w.order} ${w.name}: price "${w.priceText}" is not in Bs, shown as a consultar`); price = null; }
  if (price == null && w.priceOptions.length) price = w.priceOptions[0].price;
  const cat = o.category || category(w.name);
  return {
    id, slug, waId: w.waId, order: w.order,
    name: o.name || w.name, brand: o.brand ?? brand(w.name, marca),
    category: cat, categoryLabel: CATS.find(([c]) => c === cat)[1],
    price, currency: 'Bs', status: w.status, stock: null,
    condition: w.status === 'disponible' ? (w.estado || '') : '',
    justIn: !!w.markedNew,
    tagline: o.tagline || '',
    description: w.notes.join(' ') || o.description || '',
    specs: mergeSpecs(optionSpecs.concat(clientSpecs), o.specs),
    featured: !!o.featured, tags: o.tags || [],
    collections: w.collections, photos: w.images.map((i) => i.file), images: [],
  };
});

const RANK = { disponible: 0, 'en-camino': 1, agotado: 2 };
products.sort((a, b) => (b.featured - a.featured) || RANK[a.status] - RANK[b.status] || a.order - b.order);
// Only the aisles that have something on them.
const categories = CATS.filter(([c]) => products.some((p) => p.category === c)).map(([id, label]) => ({ id, label }));

for (const k of Object.keys(overrides)) if (k[0] !== '_' && !products.some((p) => p.id === k)) flags.push(`override "${k}" matches no product`);
const names = {}; for (const p of products) (names[fold(p.name)] = names[fold(p.name)] || []).push(p.order);
for (const [n, o] of Object.entries(names)) if (o.length > 1) flags.push(`rows ${o.join(' & ')} share the name "${n}"`);

fs.writeFileSync(OUT, JSON.stringify({ generated: wa.extractedAt.slice(0, 10), source: 'whatsapp-catalog', photoRoot: PHOTO_ROOT, categories, products }, null, 2) + '\n');
fs.writeFileSync(KEYS, JSON.stringify(keys, null, 2) + '\n');
const byCat = {}; for (const p of products) byCat[p.category] = (byCat[p.category] || 0) + 1;
const bySt = {}; for (const p of products) bySt[p.status] = (bySt[p.status] || 0) + 1;
console.log(products.length, 'products', JSON.stringify(byCat), JSON.stringify(bySt));
console.log('no price:', products.filter((p) => p.price == null).map((p) => p.order).join(','));
for (const f of flags) console.log('  check:', f);
