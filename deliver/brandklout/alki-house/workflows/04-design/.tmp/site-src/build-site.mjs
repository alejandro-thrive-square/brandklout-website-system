// Assembles the Alki House site into ../final-site/.
//
//   partials/        head, nav, drawer, footer — the shell no page can drift from
//   pages/*.body.html   markup only, with {{TOKENS}} the renderers below fill
//   css/*.css        one file per component, concatenated in filename order
//   js/ + sections/  the runtime, one module per chapter, the boot sequence
//   data/products.json  THE CMS. Today it is generated from the client's stock
//                    ledger by data/build-catalogue.mjs; in production the
//                    Google-Sheet sync plugin writes the same shape into Instatic.
//   assets/          logo, scenes, product photography (prepare-assets.mjs)
//
// Every product gets its own page at products/<slug>.html from the one
// product template, exactly as the CMS will render it live.
//
// Usage: node build-site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(SRC, '..', 'final-site');
const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cms = JSON.parse(read('data/products.json'));
const { categories } = cms;
const catLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]));

/* ---- product images: whatever prepare-assets.mjs has put in assets/products/<slug>/ ---- */
const imgIndexPath = path.join(SRC, 'assets', 'products', 'index.json');
const imgIndex = fs.existsSync(imgIndexPath) ? JSON.parse(fs.readFileSync(imgIndexPath, 'utf8')) : {};
for (const p of cms.products) {
  // [{src, cutout}] — cut-outs float on the plate; photos fill the frame.
  p.images = (imgIndex[p.slug] || []).map((e) => ({ src: `assets/products/${p.slug}/${e.file}`, cutout: !!e.cutout }));
}
const products = cms.products;
const inStock = products.filter((p) => p.stock > 0);
const stats = {
  products: products.length, inStock: inStock.length,
  brands: new Set(products.map((p) => p.brand).filter(Boolean)).size,
  sold: products.reduce((a, p) => a + (p.sold || 0), 0),
  units: products.reduce((a, p) => a + (p.stock || 0), 0),
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
fs.mkdirSync(path.join(OUT, 'products'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'assets', 'site.css'), bundle(['css'], '.css'));
const runtime = bundle(['js'], '.js');
const boot = runtime.indexOf('/* ===== js/90-boot.js ===== */');
if (boot === -1) throw new Error('js/90-boot.js missing');
fs.writeFileSync(path.join(OUT, 'assets', 'site.js'), runtime.slice(0, boot) + bundle(['sections'], '.js') + '\n' + runtime.slice(boot));
fs.cpSync(path.join(SRC, 'vendor', 'gsap'), path.join(OUT, 'assets', 'gsap'), { recursive: true });
fs.cpSync(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true });

/* ---- shared renderers ---- */
const money = (p) => (p.price == null ? '<span class="price">Ask<small>for price</small></span>' : `<span class="price">$${Number.isInteger(p.price) ? p.price : p.price.toFixed(2)}</span>`);
const badge = (p) => (p.stock > 0 ? `<span class="badge badge-stock">In stock</span>` : `<span class="badge badge-out">Sold out</span>`) + (p.condition ? `<span class="badge badge-new">New</span>` : '');
const GLYPH = {
  gimbals: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M24 6v10M16 16h16v8H16zM24 24v6M18 30h12l-2 12h-8z"/><circle cx="24" cy="20" r="2"/></svg>',
  lighting: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="18" r="9"/><path d="M24 27v15M16 42h16M24 3v3M9 18H6M42 18h-3M12 6l2 2M36 6l-2 2"/></svg>',
  modifiers: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10h32l-6 26H14z"/><path d="M14 36l-2 8M34 36l2 8M8 10l16 26 16-26"/></svg>',
  audio: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="6" width="12" height="22" rx="6"/><path d="M12 22a12 12 0 0 0 24 0M24 34v8M17 42h14"/></svg>',
  monitors: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="10" width="36" height="24" rx="2"/><path d="M18 40h12M24 34v6M12 28l8-8 6 6 10-10"/></svg>',
  rigs: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="14" width="28" height="22" rx="3"/><path d="M18 14V8h12v6M6 20h4M38 20h4M24 36v6"/><circle cx="24" cy="25" r="5"/></svg>',
  adapters: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="9"/><circle cx="24" cy="24" r="3"/><path d="M24 8v4M24 36v4"/></svg>',
  power: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="14" width="30" height="20" rx="3"/><path d="M38 20h4v8h-4M24 18l-5 7h8l-5 7"/></svg>',
  care: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 12h28l-3 30H13z"/><path d="M17 12V8h14v4M24 20v14"/></svg>',
  cameras: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="14" width="36" height="24" rx="3"/><circle cx="24" cy="26" r="8"/><path d="M16 14l3-5h10l3 5"/></svg>',
  accessories: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 34l20-20M10 38l4-4M34 14l4-4"/><circle cx="12" cy="36" r="4"/><circle cx="36" cy="12" r="4"/></svg>',
};
const glyph = (cat) => GLYPH[cat] || GLYPH.accessories;

function card(p, root) {
  const img = p.images[0]
    ? `<img class="pcard-main${p.images[0].cutout ? '' : ' is-photo'}" src="${root}${p.images[0].src}" alt="${esc(p.name)}" loading="lazy" width="800" height="800">` +
      (p.images[1] ? `<img class="pcard-alt${p.images[1].cutout ? '' : ' is-photo'}" src="${root}${p.images[1].src}" alt="" loading="lazy" width="800" height="800">` : '')
    : `<div class="pcard-glyph" aria-hidden="true">${glyph(p.category)}</div>`;
  return `<a class="pcard${p.stock > 0 ? '' : ' is-out'}" href="${root}products/${p.slug}.html" data-slug="${p.slug}" data-cat="${p.category}" data-brand="${esc(p.brand)}" data-stock="${p.stock}" data-price="${p.price ?? ''}" data-name="${esc(p.name.toLowerCase())}">
  <div class="pcard-media"><div class="pcard-badges">${badge(p)}</div>${img}
    <span class="pcard-arrow" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8h10M9 4l4 4-4 4"/></svg></span></div>
  <div class="pcard-body"><p class="pcard-cat">${esc(p.brand || catLabel[p.category])}</p><h4>${esc(p.name)}</h4>
    <div class="pcard-row">${money(p)}<span class="pcard-cat">${esc(catLabel[p.category])}</span></div></div>
</a>`;
}

/* ---- page-specific renderers ---- */
const featured = products.filter((p) => p.featured);
const STAGE = ['zhiyun-weebill-3', 'colbor-cl60-cob-light', 'hollyland-lark-m2-combo', 'viltrox-dc-550-monitor', 'feiyutech-scorp-c2']
  .map((s) => products.find((p) => p.slug === s)).filter(Boolean);

// The piece on the hero stage: the first featured product that has a cut-out.
const HERO = STAGE.find((p) => p.images[0] && p.images[0].cutout) || featured.find((p) => p.images[0] && p.images[0].cutout) || STAGE[0];
const SCENES = { gimbals: 'hero-gimbal', lighting: 'studio-lighting', modifiers: 'softbox-glow', audio: 'audio-desk', monitors: 'monitor-glow',
  rigs: 'rig-build', adapters: 'adapter-macro', power: 'product-stage', care: 'creator-room', cameras: 'rig-build', accessories: 'product-stage' };
const sceneExists = (n) => fs.existsSync(path.join(SRC, 'assets', 'scenes', n + '.webp'));
const scene = (n) => (sceneExists(n) ? `assets/scenes/${n}.webp` : '');

function railPanels(root) {
  return categories.map((c, i) => {
    const items = products.filter((p) => p.category === c.id);
    const stock = items.filter((p) => p.stock > 0).length;
    const prices = items.map((p) => p.price).filter((x) => x != null);
    const from = prices.length ? Math.min(...prices) : null;
    const s = scene(SCENES[c.id]);
    return `<a class="rail-panel" href="${root}products.html?cat=${c.id}" data-i="${i}">
  <div class="rail-media">${s ? `<img src="${root}${s}" alt="" loading="lazy">` : `<div class="rail-glyph">${glyph(c.id)}</div>`}</div>
  <span class="rail-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
  <div class="rail-body"><h3>${esc(c.label)}</h3>
    <p class="mono"><b>${items.length}</b> products · <b>${stock}</b> in stock${from != null ? ` · from $${from}` : ''}</p></div>
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
    <div class="stage-row">${money(p)}${badge(p)}<a class="btn btn-ghost btn-sm magnetic" href="${root}products/${p.slug}.html"><span>See the piece</span></a></div>
  </div>
  <figure class="stage-fig">${p.images[0] ? `<img src="${root}${p.images[0].src}" alt="${esc(p.name)}" width="1200" height="1200">` : `<div class="stage-glyph">${glyph(p.category)}</div>`}</figure>
</article>`).join('\n');
}

const KITS = [
  { id: 'creator', name: 'The creator kit', line: 'Phone-first. Steady, lit, heard.', scene: 'creator-room', slugs: ['zhiyun-smooth-5', 'rgb-led-tube-light-30cm', 'dji-mic-mini-2-combo', 'phone-led-clip-light'] },
  { id: 'interview', name: 'The interview kit', line: 'Two chairs, one key light, clean audio.', scene: 'audio-desk', slugs: ['colbor-cl60-cob-light', 'godox-s65t-softbox', 'hollyland-lark-m2-combo', '2m-light-stand'] },
  { id: 'studio', name: 'The studio kit', line: 'A mirrorless rig you can shoot all day.', scene: 'rig-build', slugs: ['zhiyun-weebill-3', 'viltrox-dc-550-monitor', 'magic-arm-super-clamp-kit', 'kastar-np-f550-battery-pair-charger'] },
];
function kitCards(root) {
  return KITS.map((k, i) => {
    const items = k.slugs.map((s) => products.find((p) => p.slug === s)).filter(Boolean);
    const s = scene(k.scene);
    return `<article class="set-card" data-i="${i}">
  <div class="set-media">${s ? `<img src="${root}${s}" alt="" loading="lazy">` : ''}</div>
  <div class="set-body">
    <p class="label">Kit ${String(i + 1).padStart(2, '0')}</p>
    <h3>${esc(k.name)}</h3>
    <p class="lead">${esc(k.line)}</p>
    <ul class="set-list">${items.map((p) => `<li><a href="${root}products/${p.slug}.html"><span>${esc(p.name)}</span><b>${p.price != null ? '$' + p.price : 'Ask'}</b></a></li>`).join('')}</ul>
  </div>
</article>`;
  }).join('\n');
}

function floorCards(root) {
  const pick = [...inStock].sort((a, b) => b.featured - a.featured || (b.price || 0) - (a.price || 0)).filter((p) => p.images.length || true).slice(0, 8);
  return pick.map((p) => card(p, root)).join('\n');
}

function catalogue(root) {
  return products.map((p) => card(p, root)).join('\n');
}
function catChips() {
  return `<button class="pill is-on" data-cat="">All <b>${products.length}</b></button>` +
    categories.map((c) => `<button class="pill" data-cat="${c.id}">${esc(c.label)} <b>${products.filter((p) => p.category === c.id).length}</b></button>`).join('');
}
function brandOptions() {
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
  return `<option value="">All brands</option>` + brands.map((b) => `<option value="${esc(b)}">${esc(b)}</option>`).join('');
}
const catalogueJson = JSON.stringify(products.map((p) => ({ slug: p.slug, name: p.name, brand: p.brand, category: p.category, price: p.price, stock: p.stock, featured: p.featured })));

/* ---- product page ---- */
function productTokens(p, root) {
  const related = products.filter((x) => x.category === p.category && x.slug !== p.slug).sort((a, b) => (b.stock > 0) - (a.stock > 0) || b.lots - a.lots).slice(0, 8);
  const gallery = p.images.length
    ? p.images.map((im, i) => `<figure class="pd-shot${i === 0 ? ' is-on' : ''}${im.cutout ? '' : ' is-photo'}" data-i="${i}"><img src="${root}${im.src}" alt="${esc(p.name)}${i ? ', view ' + (i + 1) : ''}" width="1400" height="1400"${i ? ' loading="lazy"' : ''}></figure>`).join('')
    : `<figure class="pd-shot is-on" data-i="0"><div class="pd-glyph">${glyph(p.category)}</div></figure>`;
  const thumbs = p.images.length > 1 ? p.images.map((im, i) => `<button class="pd-thumb${i === 0 ? ' is-on' : ''}" data-i="${i}" aria-label="View ${i + 1}"><img src="${root}${im.src}" alt="" loading="lazy"></button>`).join('') : '';
  const specs = (p.specs && p.specs.length) ? p.specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')
    : `<div><dt>Brand</dt><dd>${esc(p.brand || 'See listing')}</dd></div><div><dt>Category</dt><dd>${esc(catLabel[p.category])}</dd></div><div><dt>Condition</dt><dd>${esc(p.condition || 'Tested pre-owned or new — ask')}</dd></div><div><dt>Units on hand</dt><dd>${p.stock}</dd></div>`;
  const desc = p.description || `${p.name} from the Alki House floor. Every piece is checked, cleaned and firmware-updated before it is listed. Ask for the details and current condition on this unit.`;
  return {
    P_NAME: esc(p.name), P_BRAND: esc(p.brand || catLabel[p.category]), P_CAT: esc(catLabel[p.category]), P_CATID: p.category,
    P_TAGLINE: esc(p.tagline || `${catLabel[p.category]} · ${p.brand || 'Alki House'}`), P_DESC: esc(desc), P_PRICE: money(p), P_BADGES: badge(p),
    P_STOCK: p.stock > 0 ? `${p.stock} on hand` : 'Sold out — ask about the next one', P_GALLERY: gallery, P_THUMBS: thumbs, P_SPECS: specs,
    P_RELATED: related.map((x) => card(x, root)).join('\n'), P_SLUG: p.slug, P_CONDITION: esc(p.condition || 'Checked & tested'),
    P_SHOTCOUNT: String(Math.max(1, p.images.length)),
  };
}

/* ---- assemble ---- */
const head = read('partials/head.html'), nav = read('partials/nav.html'), drawer = read('partials/drawer.html'), footer = read('partials/footer.html');
function seoHead(t) {
  return `<title>${esc(t.title)}</title>\n<meta name="description" content="${esc(t.description)}">\n<meta property="og:title" content="${esc(t.title)}">\n<meta property="og:description" content="${esc(t.description)}">\n<meta property="og:type" content="website">`;
}
function fill(html, tokens) {
  return html.replace(/\{\{([A-Z_0-9]+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m));
}
function page({ file, body, root, seo, tokens, page: pageName, navKey }) {
  const base = {
    ROOT: root, PAGE: pageName, HEAD_SEO: seoHead(seo), CUR_PRODUCTS: navKey === 'PRODUCTS' ? ' aria-current="page"' : '',
    STAT_PRODUCTS: String(stats.products), STAT_INSTOCK: String(stats.inStock), STAT_BRANDS: String(stats.brands), STAT_SOLD: String(stats.sold),
    STAT_UNITS: String(stats.units), STAT_DATE: stats.date, YEAR: String(stats.year), ...tokens,
  };
  const html = fill(head + nav + drawer + '<div id="smooth-wrapper"><div id="smooth-content">\n' + body + '\n' + footer + '</div></div>\n' +
    (tokens.MOB_BAR || '') + `<script src="${root}assets/site.js"></script>\n</body>\n</html>\n`, base);
  const left = html.match(/\{\{[A-Z_0-9]+\}\}/g);
  if (left) console.warn(`  unfilled tokens in ${file}: ${[...new Set(left)].join(' ')}`);
  fs.mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
  fs.writeFileSync(path.join(OUT, file), html);
}

page({ file: 'index.html', body: read('pages/home.body.html'), root: '', page: 'home', navKey: null,
  seo: { title: 'Alki House — Camera gimbals, studio lighting and audio gear', description: 'Gimbals, studio light, wireless audio, monitors and rigging for creators. New and pre-owned, tested before it ships. 235 products, live inventory.' },
  tokens: { RAIL_PANELS: railPanels(''), STAGE_SLIDES: stageSlides(''), STAGE_COUNT: String(STAGE.length), KIT_CARDS: kitCards(''), FLOOR_CARDS: floorCards(''),
    HERO_VIDEO: fs.existsSync(path.join(SRC, 'assets/scenes/hero-gimbal.mp4')) ? 'assets/scenes/hero-gimbal.mp4' : '', HERO_POSTER: scene('hero-gimbal'), HERO_POSTER_PORTRAIT: scene('hero-gimbal-portrait'),
    HERO_PRODUCT: HERO && HERO.images[0] ? HERO.images[0].src : '', HERO_PRODUCT_NAME: HERO ? esc(HERO.name) : '', HERO_PRODUCT_SLUG: HERO ? HERO.slug : '',
    PROMISE_SCENE: scene('studio-lighting'), STAGE_PLATE: scene('product-stage'), WAY_SCENE: scene('softbox-glow') } });

page({ file: 'products.html', body: read('pages/products.body.html'), root: '', page: 'products', navKey: 'PRODUCTS',
  seo: { title: 'The catalogue — Alki House', description: `${stats.products} products across ${categories.length} categories. Gimbals, lighting, audio, monitors, rigs, adapters and power. Filter by what is in stock today.` },
  tokens: { CATALOGUE: catalogue(''), CAT_CHIPS: catChips(), BRAND_OPTIONS: brandOptions(), CATALOGUE_JSON: catalogueJson, CAT_COUNT: String(categories.length),
    CAT_SCENE: scene('studio-lighting') } });

const tpl = read('pages/product.body.html');
const mobBar = (p, root) => `<div class="mob-bar" aria-hidden="false"><a class="btn btn-primary" href="${root}index.html#invite"><span>Ask about this piece</span></a><a class="btn btn-ghost" href="${root}products.html"><span>Catalogue</span></a></div>`;
for (const p of products) {
  page({ file: `products/${p.slug}.html`, body: tpl, root: '../', page: 'product', navKey: 'PRODUCTS',
    seo: { title: `${p.name} — Alki House`, description: p.tagline || `${p.name}. ${catLabel[p.category]} at Alki House, ${p.stock > 0 ? 'in stock now' : 'sold out — ask about the next one'}.` },
    tokens: { ...productTokens(p, '../'), MOB_BAR: mobBar(p, '../') } });
}
// The canary product page at the root, for the design gate.
const canary = STAGE[0] || products[0];
page({ file: 'product.html', body: tpl, root: '', page: 'product', navKey: 'PRODUCTS',
  seo: { title: `${canary.name} — Alki House`, description: canary.tagline || canary.name },
  tokens: { ...productTokens(canary, ''), MOB_BAR: mobBar(canary, '') } });

console.log(`built ${products.length + 3} pages -> ${OUT}`);
console.log('stats', stats);
