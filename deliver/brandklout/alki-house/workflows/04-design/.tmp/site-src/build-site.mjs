// Assembles the Alki House site into ../final-site/. The site is in Spanish.
//
//   partials/        head, nav, drawer, cart, footer — the shell no page can drift from
//   pages/*.body.html   markup only, with {{TOKENS}} the renderers below fill
//   css/*.css        one file per component, concatenated in filename order
//   js/ + sections/  the runtime, one module per chapter, the boot sequence
//   data/products.json  THE CMS. Today it is generated from the shop's WhatsApp
//                    Business catalogue by data/build-catalogue.mjs; in production
//                    the Google-Sheet sync plugin writes the same shape into Instatic.
//   data/site.json   site settings: the shop's WhatsApp number.
//   assets/          logo, scenes, product photography (prepare-assets.py)
//
// Pages: index.html · productos.html (the catalogue) · productos/<slug>.html
// (one per product, from the one template, exactly as the CMS will render it
// live) · pedido.html (the cart's checkout, which hands the order to WhatsApp)
// · producto.html (the canary product page, for the design gate).
//
// A product has two keys: `id` (images live under assets/products/<id>/ and it
// never changes) and `slug` (the URL). Both are fixed per WhatsApp product in
// data/catalogue-keys.json.
//
// Status, from the client's "Estado": disponible (can go in the cart), en-camino
// (ordered, not here yet: reserve by WhatsApp), agotado (ask for the next one).
// `stock` is a count when the sheet has one; the WhatsApp catalogue has none.
//
// Usage: node build-site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(SRC, '..', 'final-site');
const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const cms = JSON.parse(read('data/products.json'));
const site = JSON.parse(read('data/site.json'));
const { categories } = cms;
const catLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]));

/* ---- WhatsApp: every "ask" link and the checkout go to one number ---- */
const WA = String(site.whatsapp || '').replace(/\D/g, '');
if (!WA) console.warn('  data/site.json has no WhatsApp number: links open WhatsApp\'s contact picker until it is set');
const wa = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
const WA_ASK = wa('¡Hola, Alki House! Tengo una pregunta sobre su equipo.');

/* ---- product images: whatever prepare-assets.py has put in assets/products/<id>/ ---- */
const imgIndexPath = path.join(SRC, 'assets', 'products', 'index.json');
const imgIndex = fs.existsSync(imgIndexPath) ? JSON.parse(fs.readFileSync(imgIndexPath, 'utf8')) : {};
for (const p of cms.products) {
  // [{src, cutout}] — cut-outs float on the plate; photos fill the frame.
  p.images = (imgIndex[p.id] || []).map((e) => ({ src: `assets/products/${p.id}/${e.file}`, cutout: !!e.cutout }));
}
const products = cms.products;
const byId = (id) => products.find((p) => p.id === id) || console.warn(`  no product "${id}" in the CMS: dropped from the page`);
const avail = (p) => p.status === 'disponible' && (p.stock == null || p.stock > 0);
const inStock = products.filter(avail);
const stats = {
  products: products.length, inStock: inStock.length,
  brands: new Set(products.map((p) => p.brand).filter(Boolean)).size,
  date: cms.generated, year: new Date().getFullYear(),
};

/* ---- bundles ---- */
function bundle(dirs, ext) {
  const parts = [];
  for (const dir of dirs) {
    const abs = path.join(SRC, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).filter((n) => n.endsWith(ext)).sort())
      parts.push(`/* ===== ${dir}/${f} ===== */\n` + fs.readFileSync(path.join(abs, f), 'utf8').replace(/\s*$/, '') + '\n');
  }
  return parts.join('\n');
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets', 'gsap'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'productos'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'assets', 'site.css'), bundle(['css'], '.css'));
const runtime = bundle(['js'], '.js');
const boot = runtime.indexOf('/* ===== js/90-boot.js ===== */');
if (boot === -1) throw new Error('js/90-boot.js missing');
fs.writeFileSync(path.join(OUT, 'assets', 'site.js'), runtime.slice(0, boot) + bundle(['sections'], '.js') + '\n' + runtime.slice(boot));
fs.cpSync(path.join(SRC, 'vendor', 'gsap'), path.join(OUT, 'assets', 'gsap'), { recursive: true });
// Product folders of products no longer in the CMS stay out of the site.
fs.cpSync(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true,
  filter: (src) => { const top = path.relative(path.join(SRC, 'assets', 'products'), src).split(path.sep)[0]; return top === '..' || top === '' || top === 'index.json' || !!imgIndex[top]; } });

/* ---- shared renderers ---- */
// Prices are bolívares, written the way the shop writes them: 48.850 Bs.
const fmt = (n) => { const [i, d] = String(Math.round(n * 100) / 100).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d.padEnd(2, '0') : '') + ' Bs'; };
const money = (p) => (p.price == null ? '<span class="price">Precio<small>a consultar</small></span>' : `<span class="price">${fmt(p.price)}</span>`);
const STATUS = { disponible: ['badge-stock', 'En stock'], 'en-camino': ['badge-soon', 'En camino'], agotado: ['badge-out', 'Agotado'] };
// "Nuevo" is the condition of nearly every listing, so the badge is the client's 🆕 (justIn) instead.
const badge = (p) => { const [cls, label] = avail(p) ? STATUS.disponible : STATUS[p.status] || STATUS.agotado; return `<span class="badge ${cls}">${label}</span>` + (p.justIn ? '<span class="badge badge-new">Recién llegado</span>' : ''); };
const PLUS = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>';
const CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.6 18.6z"/><path d="M9 10.5h6M9 13.5h3.5"/></svg>';
const GLYPH = {
  gimbals: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M24 6v10M16 16h16v8H16zM24 24v6M18 30h12l-2 12h-8z"/><circle cx="24" cy="20" r="2"/></svg>',
  iluminacion: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="18" r="9"/><path d="M24 27v15M16 42h16M24 3v3M9 18H6M42 18h-3M12 6l2 2M36 6l-2 2"/></svg>',
  modificadores: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10h32l-6 26H14z"/><path d="M14 36l-2 8M34 36l2 8M8 10l16 26 16-26"/></svg>',
  audio: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="6" width="12" height="22" rx="6"/><path d="M12 22a12 12 0 0 0 24 0M24 34v8M17 42h14"/></svg>',
  monitores: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="10" width="36" height="24" rx="2"/><path d="M18 40h12M24 34v6M12 28l8-8 6 6 10-10"/></svg>',
  rigs: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="14" width="28" height="22" rx="3"/><path d="M18 14V8h12v6M6 20h4M38 20h4M24 36v6"/><circle cx="24" cy="25" r="5"/></svg>',
  adaptadores: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="9"/><circle cx="24" cy="24" r="3"/><path d="M24 8v4M24 36v4"/></svg>',
  energia: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="14" width="30" height="20" rx="3"/><path d="M38 20h4v8h-4M24 18l-5 7h8l-5 7"/></svg>',
  cuidado: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 12h28l-3 30H13z"/><path d="M17 12V8h14v4M24 20v14"/></svg>',
  camaras: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="14" width="36" height="24" rx="3"/><circle cx="24" cy="26" r="8"/><path d="M16 14l3-5h10l3 5"/></svg>',
  accesorios: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 34l20-20M10 38l4-4M34 14l4-4"/><circle cx="12" cy="36" r="4"/><circle cx="36" cy="12" r="4"/></svg>',
};
const glyph = (cat) => GLYPH[cat] || GLYPH.accesorios;

/* ---- the cart payload -------------------------------------------------------
   One JSON object per product on every add button (data-item) and a list on a
   kit button (data-kit); sections/cart.js stores it in the browser. The image
   path is relative to the site root; the cart prefixes the page's own root. */
const itemOf = (p) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price, stock: p.stock, img: p.images[0] ? p.images[0].src : '' });
const item = (p) => esc(JSON.stringify(itemOf(p)));
const addBtn = (p, cls, label = 'Añadir al carrito') =>
  `<button class="btn ${cls}" type="button" data-item="${item(p)}"><span>${label}</span>${PLUS}</button>`;

function card(p, root) {
  // The hover angle: the next cut-out if there is one (the client's later shots are often
  // packing lists and lifestyle photos), else the next shot as it is.
  const alt = p.images.slice(1).find((im) => im.cutout) || p.images[1];
  const img = p.images[0]
    ? `<img class="pcard-main${p.images[0].cutout ? '' : ' is-photo'}" src="${root}${p.images[0].src}" alt="${esc(p.name)}" loading="lazy" width="800" height="800">` +
      (alt ? `<img class="pcard-alt${alt.cutout ? '' : ' is-photo'}" src="${root}${alt.src}" alt="" loading="lazy" width="800" height="800">` : '')
    : `<div class="pcard-glyph" aria-hidden="true">${glyph(p.category)}</div>`;
  // The name is the link and stretches over the whole card; the + button sits above it.
  return `<article class="pcard${p.status === 'agotado' ? ' is-out' : ''}" data-slug="${p.slug}" data-cat="${p.category}" data-brand="${esc(p.brand)}" data-status="${p.status}" data-price="${p.price ?? ''}">
  <div class="pcard-media"><div class="pcard-badges">${badge(p)}</div>${img}</div>
  <div class="pcard-body"><p class="pcard-cat">${esc(p.brand || catLabel[p.category])}</p><h4><a class="pcard-link" href="${root}productos/${p.slug}.html">${esc(p.name)}</a></h4>
    <div class="pcard-row">${money(p)}<span class="pcard-cat">${esc(catLabel[p.category])}</span></div></div>
  ${avail(p) ? `<button class="pcard-add" type="button" data-item="${item(p)}" aria-label="Añadir ${esc(p.name)} al carrito">${PLUS}</button>` : ''}
</article>`;
}

/* ---- page-specific renderers ---- */
const featured = products.filter((p) => p.featured);
const STAGE = ['zhiyun-weebill-3e', 'luz-colbor-cl60', 'dji-mic-mini-2-combo', 'monitor-viltrox-dc-550', 'feiyutech-scorp-c2'].map(byId).filter(Boolean);

const SCENES = { gimbals: 'hero-gimbal', iluminacion: 'studio-lighting', modificadores: 'softbox-glow', audio: 'audio-desk', monitores: 'monitor-glow',
  rigs: 'rig-build', adaptadores: 'adapter-macro', energia: 'product-stage', cuidado: 'creator-room', camaras: 'rig-build', accesorios: 'product-stage' };
const sceneExists = (n) => fs.existsSync(path.join(SRC, 'assets', 'scenes', n + '.webp'));
const scene = (n) => (sceneExists(n) ? `assets/scenes/${n}.webp` : '');

/* ---- the hero film: six aisles in one dark studio (03-graphic-resources/.tmp/hero-film/).
   segments.json says when each aisle is on screen; the caption and pills follow the film. ---- */
const FILM_SEGMENTS = path.resolve(SRC, '../../../03-graphic-resources/.tmp/hero-film/segments.json');
// ?v= from the file's size and time: a re-cut film must not play from the browser cache against
// the new segments (the caption then names the wrong aisle).
const stamp = (rel) => { const st = fs.statSync(path.join(SRC, rel)); return `${rel}?v=${(st.size + st.mtimeMs).toString(36).replace('.', '')}`; };
const filmFile = fs.existsSync(path.join(SRC, 'assets/scenes/hero-film.mp4')) ? stamp('assets/scenes/hero-film.mp4') : '';
const plural = (n) => `${n} ${n === 1 ? 'producto' : 'productos'}`;
const heroScenes = (filmFile && fs.existsSync(FILM_SEGMENTS) ? JSON.parse(fs.readFileSync(FILM_SEGMENTS, 'utf8')).segments : [])
  .filter((s) => catLabel[s.cat])
  .map((s) => ({ t: s.t, label: catLabel[s.cat], n: plural(products.filter((p) => p.category === s.cat).length), href: `productos.html?cat=${s.cat}` }));
if (!heroScenes.length) heroScenes.push({ t: 0, label: 'Todo el catálogo', n: plural(products.length), href: 'productos.html' });
const heroDots = heroScenes.length > 1
  ? heroScenes.map((s, i) => `<button class="ar-dot${i ? '' : ' is-on'}" type="button" data-i="${i}" aria-label="${esc(s.label)}"${i ? '' : ' aria-current="true"'}><i></i></button>`).join('')
  : '';

function railPanels(root) {
  return categories.map((c, i) => {
    const items = products.filter((p) => p.category === c.id);
    const stock = items.filter(avail).length;
    const prices = items.map((p) => p.price).filter((x) => x != null);
    const from = prices.length ? Math.min(...prices) : null;
    const s = scene(SCENES[c.id]);
    return `<a class="rail-panel" href="${root}productos.html?cat=${c.id}" data-i="${i}">
  <div class="rail-media">${s ? `<img src="${root}${s}" alt="" loading="lazy">` : `<div class="rail-glyph">${glyph(c.id)}</div>`}</div>
  <span class="rail-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
  <div class="rail-body"><h3>${esc(c.label)}</h3>
    <p class="mono"><b>${items.length}</b> productos · <b>${stock}</b> en stock${from != null ? ` · desde ${fmt(from)}` : ''}</p></div>
</a>`;
  }).join('\n');
}

function stageSlides(root) {
  return STAGE.map((p, i) => `<article class="stage-slide" data-i="${i}">
  <div class="stage-copy">
    <p class="label">${esc(p.brand || catLabel[p.category])} · ${esc(catLabel[p.category])}</p>
    <h3 class="stage-name">${esc(p.name)}</h3>
    <p class="stage-tag">${esc(p.tagline)}</p>
    <dl class="stage-specs">${(p.specs || []).slice(0, 3).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <div class="stage-row">${money(p)}${badge(p)}</div>
    <div class="stage-row">${avail(p) ? addBtn(p, 'btn-primary btn-sm magnetic') : ''}<a class="btn btn-ghost btn-sm magnetic" href="${root}productos/${p.slug}.html"><span>Ver la pieza</span></a></div>
  </div>
  <figure class="stage-fig">${p.images[0] ? `<img src="${root}${p.images[0].src}" alt="${esc(p.name)}" width="1200" height="1200">` : `<div class="stage-glyph">${glyph(p.category)}</div>`}</figure>
</article>`).join('\n');
}

const KITS = [
  { id: 'creator', name: 'El kit creador', line: 'Primero el celular. Estable, iluminado y bien escuchado.', scene: 'creator-room', ids: ['zhiyun-smooth-5', 'barra-led-rgb-30cm', 'dji-mic-mini-2-tx-1-rx'] },
  { id: 'interview', name: 'El kit entrevista', line: 'Dos sillas, una luz principal, audio limpio.', scene: 'audio-desk', ids: ['luz-colbor-cl60', 'softbox-triopo-k3-65cm-grid', 'hollyland-lark-a1-duo-case'] },
  { id: 'studio', name: 'El kit estudio', line: 'Un rig mirrorless con el que grabas todo el día.', scene: 'rig-build', ids: ['zhiyun-weebill-3e', 'monitor-viltrox-dc-550', 'smallrig-magic-arm-clamp', 'bateria-kastar-np-f780-con-usb-c'] },
];
function kitCards(root) {
  return KITS.map((k, i) => {
    const items = k.ids.map(byId).filter(Boolean);
    const ready = items.filter(avail);
    const total = ready.reduce((a, p) => a + (p.price || 0), 0);
    const ask = ready.some((p) => p.price == null);
    const s = scene(k.scene);
    return `<article class="set-card" data-i="${i}">
  <div class="set-media">${s ? `<img src="${root}${s}" alt="" loading="lazy">` : ''}</div>
  <div class="set-body">
    <p class="label">Kit ${String(i + 1).padStart(2, '0')}</p>
    <h3>${esc(k.name)}</h3>
    <p class="lead">${esc(k.line)}</p>
    <ul class="set-list">${items.map((p) => `<li><a href="${root}productos/${p.slug}.html"><span>${esc(p.name)}</span><b>${avail(p) ? (p.price != null ? fmt(p.price) : 'Consultar') : (STATUS[p.status] || STATUS.agotado)[1]}</b></a></li>`).join('')}</ul>
    ${ready.length ? `<div class="set-foot"><p class="set-total"><span class="label">Total del kit</span><b>${fmt(total)}${ask ? ' + consultar' : ''}</b></p>
      <button class="btn btn-primary btn-sm magnetic" type="button" data-kit="${esc(JSON.stringify(ready.map(itemOf)))}"><span>Añadir el kit al carrito</span>${PLUS}</button></div>` : ''}
  </div>
</article>`;
  }).join('\n');
}

function floorCards(root) {
  const pick = [...inStock].sort((a, b) => b.featured - a.featured || (b.price || 0) - (a.price || 0)).slice(0, 8);
  return pick.map((p) => card(p, root)).join('\n');
}

function catalogue(root) {
  return products.map((p) => card(p, root)).join('\n');
}
function catChips() {
  return `<button class="pill is-on" data-cat="">Todo <b>${products.length}</b></button>` +
    categories.map((c) => `<button class="pill" data-cat="${c.id}">${esc(c.label)} <b>${products.filter((p) => p.category === c.id).length}</b></button>`).join('');
}
function brandOptions() {
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  return `<option value="">Todas las marcas</option>` + brands.map((b) => `<option value="${esc(b)}">${esc(b)}</option>`).join('');
}
// q: what the search box matches — name, brand, category and tags, without accents.
// avail: what "Solo en stock" keeps; rank: the default order (available, en camino, agotado).
const RANK = { disponible: 0, 'en-camino': 1, agotado: 2 };
const catalogueJson = JSON.stringify(products.map((p) => ({ slug: p.slug, name: p.name, brand: p.brand, category: p.category, price: p.price, avail: avail(p), rank: avail(p) ? 0 : RANK[p.status] ?? 2, featured: p.featured,
  q: norm([p.name, p.brand, catLabel[p.category], ...(p.tags || [])].join(' ')) }))).replace(/</g, '\\u003c');

/* ---- product page ---- */
function productTokens(p, root) {
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).sort((a, b) => avail(b) - avail(a) || a.order - b.order).slice(0, 8);
  const gallery = p.images.length
    ? p.images.map((im, i) => `<figure class="pd-shot${i === 0 ? ' is-on' : ''}${im.cutout ? '' : ' is-photo'}" data-i="${i}"><img src="${root}${im.src}" alt="${esc(p.name)}${i ? ', vista ' + (i + 1) : ''}" width="1400" height="1400"${i ? ' loading="lazy"' : ''}></figure>`).join('')
    : `<figure class="pd-shot is-on" data-i="0"><div class="pd-glyph">${glyph(p.category)}</div></figure>`;
  const thumbs = p.images.length > 1 ? p.images.map((im, i) => `<button class="pd-thumb${i === 0 ? ' is-on' : ''}" data-i="${i}" aria-label="Vista ${i + 1}"><img src="${root}${im.src}" alt="" loading="lazy"></button>`).join('') : '';
  const specs = (p.specs && p.specs.length) ? p.specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')
    : `<div><dt>Marca</dt><dd>${esc(p.brand || 'Ver ficha')}</dd></div><div><dt>Categoría</dt><dd>${esc(catLabel[p.category])}</dd></div><div><dt>Estado</dt><dd>${esc(p.condition || 'Pregúntanos por esta unidad')}</dd></div><div><dt>Disponibilidad</dt><dd>${stockLine(p)}</dd></div>`;
  const desc = p.description || `${p.name}, de la vitrina de Alki House. Cada pieza se revisa, se limpia y se le actualiza el firmware antes de publicarse. Pregúntanos por los detalles y el estado actual de esta unidad.`;
  const btn = (cls, label, href) => `<a class="btn ${cls}" href="${href}" target="_blank" rel="noopener">${CHAT}<span>${label}</span></a>`;
  const ask = (cls, label) => btn(cls, label, askUrl(p));
  const v = avail(p) ? 'disponible' : p.status === 'en-camino' ? 'en-camino' : 'agotado';
  const COPY = {
    disponible: { head: '¿Lo quieres?', lead: 'Añádelo al carrito y envía tu pedido por WhatsApp, o pregúntanos primero: te lo apartamos, te decimos exactamente qué incluye y con qué lo combinaríamos para tu cámara.' },
    'en-camino': { head: '¿Lo esperas?', lead: 'Ya viene en camino. Escríbenos y te apartamos una unidad, con el precio y la fecha en que llega.' },
    agotado: { head: '¿Lo buscas?', lead: 'Este se vendió. Escríbenos y te avisamos cuando llegue la siguiente unidad, o te sugerimos lo más parecido que hay hoy en la vitrina.' },
  }[v];
  return {
    P_NAME: esc(p.name), P_BRAND: esc(p.brand || catLabel[p.category]), P_CAT: esc(catLabel[p.category]), P_CATID: p.category,
    P_TAGLINE: esc(p.tagline || `${catLabel[p.category]} · ${p.brand || 'Alki House'}`), P_DESC: esc(desc), P_PRICE: money(p), P_BADGES: badge(p),
    P_STOCK: stockLine(p), P_GALLERY: gallery, P_THUMBS: thumbs, P_SPECS: specs,
    P_RELATED: related.map((x) => card(x, root)).join('\n'), P_SLUG: p.slug, P_CONDITION: esc(p.condition || (v === 'disponible' ? 'Revisado y probado' : catLabel[p.category])),
    P_SHOTCOUNT: String(Math.max(1, p.images.length)),
    P_ACTIONS: v === 'disponible'
      ? addBtn(p, 'btn-primary magnetic pd-add') + ask('btn-ghost magnetic', 'Preguntar por WhatsApp')
      : ask('btn-primary magnetic', v === 'en-camino' ? 'Apartar por WhatsApp' : 'Avisarme cuando llegue') + '<a class="btn btn-ghost magnetic" href="#pdDetail"><span>El detalle</span></a>',
    P_INVITE_ACTIONS: v === 'disponible'
      ? addBtn(p, 'btn-primary magnetic') + ask('btn-ghost magnetic', 'Preguntar primero')
      : ask('btn-primary magnetic', v === 'en-camino' ? 'Apartar por WhatsApp' : 'Avisarme cuando llegue') + `<a class="btn btn-ghost magnetic" href="${root}productos.html"><span>Volver al catálogo</span></a>`,
    P_INVITE_LEAD: COPY.lead, P_INVITE_HEAD: COPY.head,
  };
}
function stockLine(p) {
  if (avail(p)) return p.stock != null ? `${p.stock} ${p.stock === 1 ? 'disponible' : 'disponibles'}` : 'Disponible';
  return p.status === 'en-camino' ? 'En camino — apártalo por WhatsApp' : 'Agotado — pregunta por la siguiente';
}
// The WhatsApp message each product's ask button opens, worded for its status.
function askUrl(p) {
  if (avail(p)) return wa(`¡Hola, Alki House! Me interesa ${p.name}${p.price != null ? ` (${fmt(p.price)})` : ''}. ¿Me cuentan el estado de la unidad y qué incluye?`);
  if (p.status === 'en-camino') return wa(`¡Hola, Alki House! Vi que ${p.name} viene en camino. ¿Me apartan una unidad y me dicen el precio?`);
  return wa(`¡Hola, Alki House! Busco ${p.name}, que aparece agotado. ¿Me avisan cuando llegue la siguiente?`);
}

/* ---- assemble ---- */
const head = read('partials/head.html'), nav = read('partials/nav.html'), drawer = read('partials/drawer.html'),
  cart = read('partials/cart.html'), footer = read('partials/footer.html');
function seoHead(t) {
  return `<title>${esc(t.title)}</title>\n<meta name="description" content="${esc(t.description)}">\n<meta property="og:title" content="${esc(t.title)}">\n<meta property="og:description" content="${esc(t.description)}">\n<meta property="og:type" content="website">` +
    (t.noindex ? '\n<meta name="robots" content="noindex">' : '');
}
function fill(html, tokens) {
  return html.replace(/\{\{([A-Z_0-9]+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m));
}
function page({ file, body, root, seo, tokens, page: pageName, navKey }) {
  const base = {
    ROOT: root, PAGE: pageName, HEAD_SEO: seoHead(seo), CUR_PRODUCTS: navKey === 'PRODUCTS' ? ' aria-current="page"' : '',
    WA_NUMBER: WA, WA_ASK: esc(WA_ASK),
    STAT_PRODUCTS: String(stats.products), STAT_INSTOCK: String(stats.inStock), STAT_BRANDS: String(stats.brands),
    STAT_DATE: stats.date, YEAR: String(stats.year), ...tokens,
  };
  const html = fill(head + nav + drawer + cart + '<div id="smooth-wrapper"><div id="smooth-content">\n' + body + '\n' + footer + '</div></div>\n' +
    (tokens.MOB_BAR || '') + `<script src="${root}assets/site.js"></script>\n</body>\n</html>\n`, base);
  const left = html.match(/\{\{[A-Z_0-9]+\}\}/g);
  if (left) console.warn(`  unfilled tokens in ${file}: ${[...new Set(left)].join(' ')}`);
  fs.mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
  fs.writeFileSync(path.join(OUT, file), html);
}

page({ file: 'index.html', body: read('pages/home.body.html'), root: '', page: 'home', navKey: null,
  seo: { title: 'Alki House — Gimbals, iluminación de estudio y audio para creadores', description: `Gimbals, luz de estudio, audio inalámbrico, monitores y rigging para creadores. Nuevo y seminuevo, probado antes de enviarse. ${stats.products} productos, inventario en vivo.` },
  tokens: { RAIL_PANELS: railPanels(''), RAIL_TOTAL: String(categories.length).padStart(2, '0'),
    // The aisle count, written out: only the aisles that have products are on the rail.
    RAIL_WORD: ['Cero', 'Un', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez', 'Once', 'Doce'][categories.length] || String(categories.length),
    STAGE_SLIDES: stageSlides(''), STAGE_COUNT: String(STAGE.length), KIT_CARDS: kitCards(''), FLOOR_CARDS: floorCards(''),
    HERO_VIDEO: filmFile || (fs.existsSync(path.join(SRC, 'assets/scenes/hero-gimbal.mp4')) ? 'assets/scenes/hero-gimbal.mp4' : ''),
    HERO_POSTER: filmFile && sceneExists('hero-film-poster') ? stamp(scene('hero-film-poster')) : scene('hero-gimbal'),
    // The film's poster serves phones too: the CSS crops it to the product.
    HERO_POSTER_PORTRAIT: filmFile && sceneExists('hero-film-poster') ? stamp(scene('hero-film-poster')) : scene('hero-gimbal-portrait'),
    HERO_SCENES: esc(JSON.stringify(heroScenes)), HERO_SCENE_LABEL: esc(heroScenes[0].label), HERO_SCENE_COUNT: `${esc(heroScenes[0].n)} →`,
    HERO_SCENE_HREF: heroScenes[0].href, HERO_SCENE_DOTS: heroDots,
    PROMISE_SCENE: scene('studio-lighting'), STAGE_PLATE: scene('product-stage'), WAY_SCENE: scene('softbox-glow') } });

page({ file: 'productos.html', body: read('pages/productos.body.html'), root: '', page: 'products', navKey: 'PRODUCTS',
  seo: { title: 'El catálogo — Alki House', description: `${stats.products} productos en ${categories.length} categorías. Gimbals, iluminación, audio, monitores, rigs, adaptadores y baterías. Filtra por lo que está en stock hoy.` },
  tokens: { CATALOGUE: catalogue(''), CAT_CHIPS: catChips(), BRAND_OPTIONS: brandOptions(), CATALOGUE_JSON: catalogueJson, CAT_COUNT: String(categories.length),
    CAT_SCENE: scene('studio-lighting') } });

page({ file: 'pedido.html', body: read('pages/pedido.body.html'), root: '', page: 'order', navKey: null,
  seo: { title: 'Tu pedido — Alki House', description: 'Revisa tu carrito y envía el pedido completo a Alki House por WhatsApp.', noindex: true },
  tokens: { ORDER_SCENE: scene('product-stage') } });

const tpl = read('pages/producto.body.html');
const mobBar = (p, root) => `<div class="mob-bar" aria-hidden="false">${avail(p)
  ? addBtn(p, 'btn-primary', 'Añadir') + '<button class="btn btn-ghost" type="button" data-cart-open><span>Carrito</span><b class="mob-n" data-cart-count>0</b></button>'
  : `<a class="btn btn-primary" href="${askUrl(p)}" target="_blank" rel="noopener"><span>${p.status === 'en-camino' ? 'Apartar' : 'Avisarme'}</span></a><a class="btn btn-ghost" href="${root}productos.html"><span>Catálogo</span></a>`}</div>`;
const productSeo = (p) => ({ title: `${p.name} — Alki House`, description: p.tagline || `${p.name}. ${catLabel[p.category]} en Alki House, ${avail(p) ? 'en stock' : p.status === 'en-camino' ? 'en camino — apártalo por WhatsApp' : 'agotado — pregunta por la siguiente'}.` });
for (const p of products) {
  page({ file: `productos/${p.slug}.html`, body: tpl, root: '../', page: 'product', navKey: 'PRODUCTS', seo: productSeo(p),
    tokens: { ...productTokens(p, '../'), MOB_BAR: mobBar(p, '../') } });
}
// The canary product page at the root, for the design gate.
const canary = STAGE[0] || products[0];
page({ file: 'producto.html', body: tpl, root: '', page: 'product', navKey: 'PRODUCTS', seo: productSeo(canary),
  tokens: { ...productTokens(canary, ''), MOB_BAR: mobBar(canary, '') } });

console.log(`built ${products.length + 4} pages -> ${OUT}`);
console.log('stats', stats);
