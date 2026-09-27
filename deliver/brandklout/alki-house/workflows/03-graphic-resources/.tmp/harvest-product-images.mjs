// Harvest product photography for every product in products.json.
//
//   node harvest-product-images.mjs [--only <slug>[,<slug>]] [--force] [--limit N] > harvest.log 2>&1
//
// Sources: DuckDuckGo images (primary, returns width/height) and Bing images (fallback / top-up).
// Output:  product-images/<slug>/01.jpg .. 05.jpg (+ manifest.json)
// Resume:  a slug whose folder already holds >= 3 images is skipped unless --force.
// Never pipe this script's stdout (Node 24 + Windows libuv assertion) - redirect to a file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..'); // deliver/brandklout/alki-house
const PRODUCTS = path.join(ROOT, 'workflows/04-design/.tmp/site-src/data/products.json');
const OUT = path.join(__dirname, 'product-images');
const MANIFEST = path.join(OUT, 'manifest.json');
const IMGCHECK = path.join(__dirname, 'imgcheck.py');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const MAX_KEEP = 5;
const MAX_TRY = 12; // candidates downloaded per product
const MIN_LONG = 700;
const MIN_KEEP_SCORE = 1.5; // below this an image only fills a slot when fewer than 2 better ones exist
const PRODUCT_CONCURRENCY = 3;
const DOWNLOAD_CONCURRENCY = 3;
const SEARCH_GAP_MS = 1500;

// ---------- CLI ----------
const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const onlyIx = argv.indexOf('--only');
const ONLY = onlyIx >= 0 ? argv[onlyIx + 1].split(',').map((s) => s.trim()).filter(Boolean) : null;
const limIx = argv.indexOf('--limit');
const LIMIT = limIx >= 0 ? Number(argv[limIx + 1]) : Infinity;

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- query building ----------
// Hand-tuned queries for products whose catalogue name searches badly.
const QUERY_OVERRIDES = {
  'canon-ef-to-rf-adapter': 'Canon EF to RF lens mount adapter EF-EOS R',
  'canon-ef-to-rf-adapter-white': 'Canon EF to RF lens mount adapter white',
  'rgb-led-tube-light-30cm': 'RGB LED tube light wand 30cm handheld video light',
  'rgb-led-tube-light-50cm': 'RGB LED tube light wand 50cm handheld video light',
  'zgrl-60-rgb-cob-light': 'ZGRL-60 RGB COB video light',
  'zgrl-80w-cob-light': 'ZGRL 80W COB video light',
  'zu80-80w-cob-light': 'ZU-80 80W COB LED video light bowens',
  'magic-arm-super-clamp-kit': 'articulating magic arm with super clamp kit camera',
  'top-handle-grip': 'camera cage top handle grip NATO cold shoe',
  '30cm-mini-bowens-softbox': '30cm mini Bowens mount softbox',
  '30cm-mini-bowens-lantern-softbox': '30cm mini Bowens mount lantern softbox',
  '30cm-mini-bowens-octa-softbox': '30cm mini Bowens mount octagon softbox',
  'camera-super-clamp': 'camera super clamp 1/4 3/8 ball head',
  'speedlite-to-bowens-adapter': 'speedlite to Bowens mount S-type bracket adapter',
  'speedlite-to-bowens-adapter-v2': 'speedlite flash Bowens mount S2 bracket adapter',
  'm42-to-sony-e-adapter': 'M42 to Sony E mount lens adapter',
  'm42-to-canon-ef-adapter': 'M42 to Canon EF mount lens adapter',
  'm42-to-fujifilm-fx-adapter': 'M42 to Fujifilm FX mount lens adapter',
  'fd-to-canon-ef-adapter': 'Canon FD to EOS EF lens mount adapter',
  'nikon-f-to-canon-ef-adapter': 'Nikon F to Canon EF lens mount adapter',
  'pk-to-sony-e-adapter': 'Pentax K PK to Sony E mount lens adapter',
  'canon-ef-to-nikon-f-adapter': 'Canon EF to Nikon F lens mount adapter',
  'canon-ef-to-sony-e-adapter': 'Canon EF to Sony E mount lens adapter',
  'sony-zv-e10-cage': 'Sony ZV-E10 camera cage',
  'sony-a6000-cage': 'Sony a6000 camera cage',
  'sony-a6700-cage': 'Sony a6700 camera cage',
  'sony-a7-cage': 'Sony a7 III camera cage',
  'sony-a7-cage-with-m-remote': 'Sony a7 camera cage with remote handle',
  'sony-a7cr-cage': 'Sony a7CR camera cage',
  'canon-r7-cage': 'Canon EOS R7 camera cage',
  'canon-r8-cage': 'Canon EOS R8 camera cage',
  'hdmi-recorder-kit': 'HDMI video capture recorder kit camera',
  'l-bracket': 'camera L bracket arca swiss quick release',
  'side-handle': 'camera cage side handle grip',
  'wooden-side-handle': 'wooden side handle camera cage',
  '2m-light-stand': '2m photography light stand',
  '90w-19v-laptop-power-cable': '90W 19V laptop power adapter DC cable',
  'camera-cleaning-kit': 'camera lens cleaning kit',
  'camera-thread-adapter-set': '1/4 to 3/8 tripod thread adapter set camera',
  'canon-24-105mm-ii-zoom-ring-rubber': 'Canon EF 24-105mm f/4L IS II USM zoom ring rubber replacement',
  'canon-24-105mm-ii-focus-ring-rubber': 'Canon EF 24-105mm f/4L IS II USM focus ring rubber replacement',
  'canon-70-200mm-f-2-8l-ring-rubber': 'Canon EF 70-200mm f/2.8L zoom ring rubber replacement',
  'canon-70-200mm-f-2-8l-tripod-collar': 'Canon EF 70-200mm f/2.8L tripod mount ring collar',
  'canon-5d-mark-iv-silicone-cover': 'Canon EOS 5D Mark IV silicone case cover',
  'canon-5d-mark-iii-silicone-cover': 'Canon EOS 5D Mark III silicone case cover',
  'canon-7d-silicone-case': 'Canon EOS 7D silicone case cover',
  'canon-600d-silicone-case-yellow': 'Canon EOS 600D silicone case yellow',
  'canon-70d-silicone-case-camo': 'Canon EOS 70D silicone case camouflage',
  'canon-70d-silicone-case-red': 'Canon EOS 70D silicone case red',
  'canon-r50v-silicone-case': 'Canon EOS R50 V silicone case',
  'canon-r8-silicone-case': 'Canon EOS R8 silicone case cover',
  'sony-a7-v-silicone-case-red': 'Sony a7 V silicone case red',
  'sony-a7-v-silicone-case-black': 'Sony a7 V silicone case black',
  'sony-a7r-iv-silicone-case-black': 'Sony a7R IV silicone case black',
  'sony-a7r-iii-silicone-case': 'Sony a7R III silicone case cover',
  'sony-a7-ii-silicone-cover': 'Sony a7 II silicone case cover',
  'canon-m50-shutter-motor': 'Canon EOS M50 shutter unit replacement part',
  'gimbal-base-plate': 'gimbal quick release base plate manfrotto arca',
  'gimbal-tripod-large': 'gimbal extended mini tripod stand',
  'handgrip-for-dji-ronin-rs2': 'DJI RS2 gimbal briefcase handle handgrip',
  'lens-cleaner-fluid-3-pack': 'lens cleaning fluid spray 3 pack',
  'phone-led-clip-light': 'clip on phone LED selfie fill light',
  'phone-led-panel-light': 'phone LED panel video light rechargeable',
  'sony-np-fz100-battery-case': 'NP-FZ100 battery storage case holder',
  'studio-backdrop-20ft-x-10ft': 'photography studio backdrop 20x10 ft',
  'sunset-projection-lamp': 'sunset projection lamp',
  'triple-cold-shoe': 'triple cold shoe mount adapter camera',
  '100w-bowens-cob-video-light': '100W Bowens mount COB LED video light',
  '100w-cob-light-softbox-kit': '100W COB LED video light softbox kit',
  '3m-selfie-stick': '3 meter extendable selfie stick',
  '4x5-65-nd-filter-for-matte-box': '4x5.65 ND filter cinema matte box',
  'flash-bracket': 'speedlite flash bracket camera',
  'gopro-hero-7-battery': 'GoPro Hero 7 battery',
  'microphone-isolation-shield': 'microphone isolation shield foldable',
  'samsung-s25-fe-case': 'Samsung Galaxy S25 FE case',
  'side-handle-for-canon-r50v': 'Canon EOS R50 V side handle grip',
  'mini-bowens-to-bowens-adapter': 'mini Bowens to Bowens mount adapter ring',
  'bowens-snoot-optical-condenser': 'Bowens mount optical snoot condenser',
  'canon-battery-cover': 'Canon camera battery compartment cover door',
  'godox-ad-15s-cover': 'Godox AD-S15 bare bulb protective cover AD200',
  'sony-a7-ii-sd-card-door': 'Sony a7 II memory card door cover replacement part',
  'sony-a7-ii-viewfinder-eyecup': 'Sony FDA-EP16 eyecup a7 II viewfinder',
  'sony-np-fw50-charger': 'Sony BC-TRW battery charger NP-FW50',
  'kastar-vbg-260-battery-kit': 'Kastar VW-VBG260 battery charger kit Panasonic',
  'kastar-np-f550-battery-pair-charger': 'Kastar NP-F550 battery charger kit',
  'kastar-np-fw50-battery-pair-charger': 'Kastar NP-FW50 battery charger kit',
  'neewer-np-fz100-batteries-charger': 'Neewer NP-FZ100 battery charger set',
  'tolifo-100w-light': 'Tolifo 100W COB LED video light',
  'sony-fx30-cage-top-handle': 'Sony FX30 cage with top handle',
  'neewer-dual-handle-for-dji-ronin-sc': 'Neewer dual handle grip for DJI Ronin SC',
  'sigma-usb-dock-ud01': 'Sigma USB Dock UD-01',
  'zhiyun-weebill-2-special-edition': 'Zhiyun Weebill 2 gimbal',
  'zhiyun-smooth-q3-combo': 'Zhiyun Smooth Q3 combo gimbal',
  'zhiyun-smooth-q4-combo': 'Zhiyun Smooth Q4 combo gimbal',
  'dji-mic-mini-2-tx-1-rx': 'DJI Mic Mini 2 TX 1 RX',
  'dji-mic-mini-1-tx-1-rx': 'DJI Mic Mini 1 TX 1 RX',
  'dji-mic-2-1-tx-1-rx': 'DJI Mic 2 1 TX 1 RX',
  'godox-x3-pro-trigger-canon': 'Godox X3 Pro trigger Canon',
  'godox-x3-pro-trigger-sony': 'Godox X3 Pro trigger Sony',
  'godox-it30-pro-flash-canon': 'Godox iT30 Pro flash Canon',
  'dji-osmo-pocket-3-silicone-case-red': 'DJI Osmo Pocket 3 silicone case red',
  'dji-osmo-mobile-se': 'DJI Osmo Mobile SE smartphone gimbal grey',
  'dji-osmo-mobile-4-se': 'DJI OM 4 SE smartphone gimbal',
  'canon-70d-silicone-case-camo': 'Canon EOS 70D camouflage silicone camera case',
  'canon-70d-silicone-case-red': 'Canon EOS 70D red silicone camera case',
  'feiyutech-scorp-c': 'FeiyuTech SCORP-C gimbal',
  'kastar-jvc-ssl-70-charger': 'Kastar SSL-JVC70 battery charger',
  'kastar-jvc-ssl-70-battery': 'Kastar SSL-JVC70 battery',
  'canon-70-200mm-f-2-8l-ring-rubber': 'Canon EF 70-200mm f/2.8L zoom rubber grip ring repair part',
  'canon-24-105mm-ii-zoom-ring-rubber': 'Canon EF 24-105mm f/4L II zoom rubber grip ring repair part',
  'canon-24-105mm-ii-focus-ring-rubber': 'Canon EF 24-105mm f/4L II focus rubber grip ring repair part',
  'sony-a7-ii-sd-card-door': 'Sony a7 II ILCE-7M2 memory card slot door cover repair part',
  'dji-osmo-nano-accessory-kit': 'DJI Osmo Nano accessories kit',
  'promediagear-bracket': 'ProMediaGear L bracket plate',
  'vello-bg-s3-battery-grip': 'Vello BG-S3 battery grip Sony a7 II',
  'vello-bg-s7-battery-grip': 'Vello BG-S7 battery grip Sony',
  'quantum-fw12-module': 'Quantum Instruments FW12 FreeXwire module',
  'quantum-qf91c-radio': 'Quantum Qflash QF91C radio',
};

function buildQuery(p) {
  if (QUERY_OVERRIDES[p.slug]) return QUERY_OVERRIDES[p.slug];
  let name = p.name.replace(/[()]/g, ' ').replace(/\s\+\s/g, ' ').replace(/\bPair\b/i, '').replace(/\s+/g, ' ').trim();
  let q = name;
  if (p.brand && !name.toLowerCase().includes(p.brand.toLowerCase())) q = `${p.brand} ${name}`;
  const lq = q.toLowerCase();
  if (p.category === 'gimbals' && !lq.includes('gimbal')) q += ' gimbal';
  if (p.category === 'audio' && /lark|mic/i.test(q) && !/microphone|mic/i.test(q)) q += ' wireless microphone';
  if (p.category === 'monitors' && /monitor/i.test(q) && !/field|camera/i.test(q)) q += ' field monitor';
  return q;
}

// ---------- scoring ----------
const GOOD_HOSTS = [
  'dji.com', 'djicdn.com', 'zhiyun-tech.com', 'zhiyun', 'feiyu-tech', 'feiyutech', 'hollyland', 'godox', 'colborlight', 'colbor',
  'neewer', 'smallrig', 'ulanzi', 'viltrox', 'feelworld', 'kandfconcept', 'kentfaith', 'bhphotovideo', 'bhphoto', 'adorama',
  'shopmoment', 'm.media-amazon.com', 'images-na.ssl-images-amazon.com', 'ae01.alicdn.com', 'alicdn', 'aliexpress',
  'gudsen', 'mozagimbal', 'andycine', 'triopo', 'kastar', 'sirui', 'nitze', 'tolifo', 'ambitful', 'sony.', 'sony.com', 'canon.',
  'usa.canon', 'presonus', 'calibrite', 'sigma-global', 'sigmaphoto', 'satechi', 'vellogear', 'ritzgear', 'qtm.com', 'puluz',
  'promediagear', 'fifine', 'llano', 'manbily', 'soonpho', 'vrig', 'minifocus', 'globalpr.agency', 'static.bhphoto.com',
  'cdn.shopify.com', 'cvp.com', 'wexphotovideo', 'parkcameras', 'jessops', 'calumet', 'fotokoch', 'foto-erhardt', 'proav.co.uk',
];
const BAD_URL = /review|unboxing|youtube|ytimg|pinterest|pinimg|reddit|redd\.it|wp-content\/uploads\/[^ ]*-\d{2,4}x\d{2,4}\.|facebook|fbcdn|instagram|tiktok|twimg|screenshot|thumb|lookaside|aplus-media|banner|hero|infographic|_vs_|-vs-|comparison|compare/i;
const MAX_ASPECT = 1.75; // wider/taller than this is a banner or infographic, not a product shot

function norm(s) {
  return ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' ';
}

// Model phrases: every digit-bearing token of the query with its preceding word, e.g. "weebill 3", "cl60", "lark m2".
function modelPhrases(query) {
  const toks = query.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ');
  const out = [];
  toks.forEach((t, i) => {
    if (!/\d/.test(t)) return;
    if (/^\d+(mm|cm|m|w|v|ft|gb|x)$/.test(t) || /^\d+$/.test(t) && !toks[i - 1]) return; // sizes, wattage
    const prev = toks[i - 1] && /^[a-z]+$/.test(toks[i - 1]) ? toks[i - 1] : '';
    out.push({ prev, tok: t });
  });
  return out;
}

function modelCheck(query, text) {
  // returns { mismatch: bool, unknown: bool }
  // exact: the model token appears (optionally with its preceding word); mismatch: only a longer variant
  // of it appears ("5s" for "5", "cl60r" for "cl60"); unknown: the token is nowhere in title/page/image URL.
  const phrases = modelPhrases(query);
  if (!phrases.length) return { mismatch: false, unknown: false };
  const t = norm(text);
  let mismatch = false, unknown = false;
  for (const { prev, tok } of phrases) {
    if (/^\d+(mm|cm|m|w|v|ft|gb|x)$/.test(tok)) continue;
    const exactBare = new RegExp(`(^| )${tok}( |$)`);
    const exactPrev = prev ? new RegExp(`(^| )${prev} ?${tok}( |$)`) : null;
    const variant = new RegExp(`(^| )(${prev ? prev + ' ?' : ''})${tok}[a-z0-9]+( |$)`);
    if ((exactPrev && exactPrev.test(t)) || (/^\d+$/.test(tok) ? false : exactBare.test(t))) continue;
    if (/^\d+$/.test(tok) && prev && !exactPrev.test(t) && exactBare.test(t)) { unknown = true; continue; } // bare "3" proves little
    if (variant.test(t)) { mismatch = true; continue; }
    unknown = true;
  }
  return { mismatch, unknown };
}

// Sibling models that share a name stem but no digit the model check could catch: -4 when the title/page names one.
const NEGATIVE = {
  'dji-osmo-mobile-se': ['osmo mobile ?[23456]', 'om ?[23456]', 'mobile ?4 ?se', 'om4 se'],
  'dji-osmo-mobile-4-se': ['osmo mobile [2356]', 'om ?[2356]', 'mobile se(?! 4)', 'osmo mobile 4(?! se)'],
  'dji-osmo-mobile-4': ['osmo mobile [2356]', 'om ?[2356]', 'mobile se', '4 se', 'om4 se'],
  'dji-osmo-mobile-5': ['osmo mobile [2346]', 'om ?[2346]', 'mobile se'],
  'dji-osmo-mobile-3': ['osmo mobile [2456]', 'om ?[2456]', 'mobile se'],
  'dji-osmo-mobile-2': ['osmo mobile [3456]', 'om ?[3456]', 'mobile se'],
  'dji-mic-mini-combo': ['dji mic 2', 'dji mic 3', 'mic mini 2', 'dji mic [12] tx', 'dji mic wireless', 'dji mic 250m'],
  'dji-mic-mini-1-tx-1-rx': ['dji mic 2', 'dji mic 3', 'mic mini 2', 'dji mic [12] tx', 'dji mic wireless', 'dji mic 250m'],
  'dji-mic-mini-2-tx-1-rx': ['dji mic 2', 'dji mic 3', 'mic mini 2', 'dji mic [12] tx', 'dji mic wireless', 'dji mic 250m'],
  'dji-mic-2-1-tx-1-rx': ['mic mini', 'dji mic 3'],
  'feiyutech-scorp-c': ['scorp ?mini', 'scorp ?c ?2( |$)', 'scorp ?2( |$)', 'scorp ?pro'],
  'feiyutech-scorp-c2': ['scorp mini', 'scorp pro'],
  'feiyutech-scorp-mini': ['mini ?2( |$)', 'mini ?3( |$)', 'scorp ?c( |$)', 'mini ?p( |$)'],
  'feiyutech-scorp-mini-2': ['mini ?3( |$)', 'scorp ?c( |$)', 'mini ?p( |$)'],
  'feiyutech-scorp-mini-2-kit': ['mini ?3( |$)', 'scorp ?c( |$)'],
  'feiyutech-ak2000': ['ak2000s', 'ak2000c', 'ak4000'],
  'zhiyun-smooth-5': ['smooth ?5 ?s( |$)'],
  'zhiyun-smooth-q3': ['q4', 'q2'],
  'zhiyun-smooth-q4': ['q3', 'q2'],
  'zhiyun-smooth-x': ['smooth ?x ?2( |$)', 'smooth ?xs'],
  'zhiyun-weebill-s': ['weebill ?2', 'weebill ?3', 'weebill ?lab'],
  'zhiyun-weebill-2': ['weebill ?3', 'weebill ?s( |$)', 'weebill ?lab'],
  'zhiyun-weebill-3': ['weebill ?3 ?[se]( |$)', 'weebill ?2( |$)', 'weebill ?s( |$)', 'weebill ?lab'],
  'zhiyun-crane-m3': ['crane ?m2', 'm3 ?s( |$)', 'm2 ?s( |$)'],
  'zhiyun-crane-m2s': ['crane ?m3', 'crane ?m2( |$)'],
  'hollyland-lark-m1': ['lark ?m2', 'lark ?max', 'lark ?a1', 'lark ?c1'],
  'hollyland-lark-m2-combo': ['lark ?m2 ?s( |$)', 'lark ?m1', 'lark ?max', 'lark ?a1'],
  'hollyland-lark-a1': ['lark m1', 'lark m2', 'lark max'],
  'colbor-cl60-cob-light': ['cl60r', 'cl60m', 'cl100', 'cl220'],
  'colbor-cl60m-cob-light': ['cl60r', 'cl100', 'cl60(?!m)'],
  'colbor-cl60r-rgb-cob-light': ['cl60m', 'cl100', 'cl60(?!r)'],
  'feelworld-f6-plus-monitor': ['plus v2', 'plusv2', 'f6 plus x', 'f6 plusx', 'f5'],
  'feelworld-f6-plus-v2-monitor-kit': ['f6 plus x', 'plusx', 'f5'],
  'moza-aircross-2': ['aircross 3', 'aircross s', 'aircross-s', 'aircross-3'],
  'moza-aircross-s': ['aircross 2', 'aircross 3', 'aircross-2', 'aircross-3'],
  'dji-ronin-sc': ['ronin-s(?!c)', 'ronin s(?!c)', 'rs 2', 'rs2', 'rs 3', 'rs3', 'rsc 2', 'rsc2'],
  'canon-70d-silicone-case-camo': ['80d', '90d', '5d', 'r6', 'r5', 'm50'],
  'canon-70d-silicone-case-red': ['80d', '90d', '5d', 'r6', 'r5', 'm50'],
  'sony-a7-v-silicone-case-black': ['a7 iii', 'a7iii', 'a7 iv', 'a7iv', 'a7m3', 'a7m4', 'a7r', 'a7 ii', 'a7ii', 'a7m2', 'mark ii', 'a7c'],
  'sony-a7-v-silicone-case-red': ['a7 iii', 'a7iii', 'a7 iv', 'a7iv', 'a7m3', 'a7m4', 'a7r', 'a7 ii', 'a7ii', 'a7m2', 'mark ii', 'a7c'],
  'canon-r8-silicone-case': ['r7', 'r6', 'r5', 'r10', 'r50'],
  'canon-r50v-silicone-case': ['r50(?! ?v)', 'r10', 'r8'],
  'canon-r7-cage': ['r8', 'r10', 'r6', 'r5'],
  'vello-bg-s3-battery-grip': ['bg ?s[1245678]', 'bg ?c', 'bg ?n', 'bg ?f', 'bg ?o', 'bg ?p'],
  'vello-bg-s7-battery-grip': ['bg ?s[1234568]', 'bg ?c', 'bg ?n', 'bg ?f', 'bg ?o', 'bg ?p'],
  'canon-r8-cage': ['r7', 'r10', 'r6', 'r5'],
};

function scoreCandidate(c, query, slug) {
  let s = 0;
  const reasons = [];
  const host = (() => { try { return new URL(c.image).hostname; } catch { return ''; } })();
  const phost = (() => { try { return new URL(c.page || '').hostname; } catch { return ''; } })();
  if (GOOD_HOSTS.some((g) => host.includes(g) || phost.includes(g))) { s += 3; reasons.push('host'); }
  if (c.width) {
    const long = Math.max(c.width, c.height);
    if (c.width >= 1500) { s += 2; reasons.push('w1500'); } else if (c.width >= 1000) { s += 1; reasons.push('w1000'); }
    if (long < MIN_LONG) { s -= 5; reasons.push('small'); }
    const ar = Math.max(c.width, c.height) / Math.max(1, Math.min(c.width, c.height));
    if (ar > MAX_ASPECT) { s -= 3; reasons.push('banner'); }
  }
  if (BAD_URL.test(c.image) || BAD_URL.test(c.page || '')) { s -= 3; reasons.push('lifestyle'); }
  const negs = NEGATIVE[slug] || [];
  const negText = norm(`${c.title || ''} ${c.page || ''} ${c.image}`);
  if (negs.some((n) => new RegExp(`(^| )${n}`).test(negText))) { s -= 4; reasons.push('sibling'); c.approx = true; }
  const mc = modelCheck(query, `${c.title || ''} ${c.page || ''} ${c.image}`);
  if (mc.mismatch) { s -= 2; reasons.push('othermodel'); c.approx = true; }
  else if (mc.unknown) { s -= 1.5; reasons.push('modelunknown'); }
  if (/\/products?\//i.test(c.page || '') || /\/dp\//i.test(c.page || '')) { s += 0.5; }
  c.score = s;
  c.reasons = reasons;
  return s;
}

// ---------- search (serialised, polite) ----------
let searchChain = Promise.resolve();
function serialSearch(fn) {
  const p = searchChain.then(async () => { const r = await fn(); await sleep(SEARCH_GAP_MS); return r; });
  searchChain = p.catch(() => {});
  return p;
}

async function fetchText(url, headers, timeout = 20000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, ...headers }, signal: ac.signal, redirect: 'follow' });
    const txt = await r.text();
    return { status: r.status, text: txt };
  } finally { clearTimeout(t); }
}

// DuckDuckGo rate-limits i.js per IP (403). After two 403s in a row we go Bing-only for DDG_COOLDOWN_MS, then re-probe.
const DDG_COOLDOWN_MS = 10 * 60 * 1000;
let ddgBlockedUntil = 0;

async function ddgSearch(q) {
  if (Date.now() < ddgBlockedUntil) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const h = await fetchText(`https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`, {});
      const m = h.text.match(/vqd=["']?([\d-]+)/);
      if (h.status === 403 || !m) { log(`  ddg vqd fail (${h.status}) attempt ${attempt}`); await sleep(8000); continue; }
      const r = await fetchText(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(q)}&vqd=${m[1]}&f=size:Large&p=1`, { referer: 'https://duckduckgo.com/' });
      if (r.status === 403) { log(`  ddg i.js 403 attempt ${attempt}`); await sleep(8000); continue; }
      const j = JSON.parse(r.text);
      return (j.results || []).map((x) => ({ image: x.image, page: x.url, title: x.title, width: x.width, height: x.height, src: 'ddg' }));
    } catch (e) {
      log(`  ddg error attempt ${attempt}: ${e.message}`);
      await sleep(5000);
    }
  }
  ddgBlockedUntil = Date.now() + DDG_COOLDOWN_MS;
  log(`  ddg blocked -> bing-only until ${new Date(ddgBlockedUntil).toISOString().slice(11, 19)}`);
  return null;
}

// Bing images async endpoint: 35 hits per page, each an m="{json}" attribute whose sibling href carries exph/expw (real size).
async function bingSearch(q, first = 1) {
  try {
    const r = await fetchText(`https://www.bing.com/images/async?q=${encodeURIComponent(q)}&qft=+filterui:imagesize-large&first=${first}&count=35&mmasync=1`, { 'accept-language': 'en-US' });
    const hits = [];
    for (const m of r.text.matchAll(/ m="([^"]+)"[^>]*?href="([^"]*)"/g)) {
      try {
        const j = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
        const d = m[2].match(/exph=(\d+)&amp;expw=(\d+)/);
        if (j.murl) hits.push({ image: j.murl, page: j.purl || '', title: j.t || j.desc || '', width: d ? Number(d[2]) : 0, height: d ? Number(d[1]) : 0, src: 'bing' });
      } catch { /* skip */ }
    }
    return hits;
  } catch (e) {
    log(`  bing error: ${e.message}`);
    return [];
  }
}

// ---------- download ----------
async function download(c, dest) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 20000);
  try {
    const r = await fetch(c.image, { headers: { 'user-agent': UA, referer: c.page || c.image, accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }, signal: ac.signal, redirect: 'follow' });
    if (!r.ok) return { err: `http ${r.status}` };
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    if (!ct.startsWith('image/')) return { err: `not image (${ct.slice(0, 30)})` };
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 8000) return { err: 'tiny file' };
    fs.writeFileSync(dest, buf);
    return { bytes: buf.length };
  } catch (e) {
    return { err: e.name === 'AbortError' ? 'timeout' : e.message.slice(0, 80) };
  } finally { clearTimeout(t); }
}

function imgcheck(files) {
  if (!files.length) return [];
  const r = spawnSync('python', [IMGCHECK, ...files], { encoding: 'utf8', maxBuffer: 1 << 24 });
  if (r.error) { log('  imgcheck spawn error', r.error.message); return []; }
  const out = [];
  for (const line of (r.stdout || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* skip */ }
  }
  if (r.stderr && r.stderr.trim()) log('  imgcheck stderr:', r.stderr.trim().slice(0, 300));
  return out;
}

function hamming(a, b) {
  let x = BigInt('0x' + a) ^ BigInt('0x' + b);
  let n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const ix = i++; out[ix] = await fn(items[ix], ix); }
  });
  await Promise.all(workers);
  return out;
}

// ---------- per-product ----------
async function harvest(p, manifest) {
  const dir = path.join(OUT, p.slug);
  const existing = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^\d\d\.(jpg|png|webp)$/.test(f)) : [];
  if (!FORCE && existing.length >= 3 && manifest[p.slug]) { log(`skip ${p.slug} (${existing.length} images)`); return; }

  const query = buildQuery(p);
  log(`>>> ${p.slug} :: "${query}"`);
  const ddg = await serialSearch(() => ddgSearch(query));
  let cands = ddg || [];
  const usableCount = () => cands.filter((c) => !c.width || Math.max(c.width, c.height) >= MIN_LONG).length;
  const merge = (b) => { const seen = new Set(cands.map((c) => c.image)); for (const c of b) if (!seen.has(c.image)) { cands.push(c); seen.add(c.image); } };
  if (usableCount() < 10) {
    const b1 = await serialSearch(() => bingSearch(query, 1));
    merge(b1);
    log(`  ddg ${ddg ? ddg.length : 'blocked'}, bing p1 ${b1.length}`);
    if (usableCount() < 10) {
      const b2 = await serialSearch(() => bingSearch(query, 36));
      merge(b2);
      log(`  bing p2 ${b2.length}`);
    }
  }
  // dedupe by url, score, sort
  const seen = new Set();
  cands = cands.filter((c) => c.image && /^https?:/.test(c.image) && !seen.has(c.image) && seen.add(c.image));
  cands.forEach((c) => scoreCandidate(c, query, p.slug));
  cands.sort((a, b) => b.score - a.score);
  const top = cands.filter((c) => !c.reasons.includes('small')).slice(0, MAX_TRY);
  log(`  ${cands.length} candidates, trying ${top.length}`);

  // download to tmp dir
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, '_tmp');
  fs.mkdirSync(tmp);
  const dl = await mapLimit(top, DOWNLOAD_CONCURRENCY, async (c, ix) => {
    const dest = path.join(tmp, `c${String(ix).padStart(2, '0')}`);
    const r = await download(c, dest);
    if (r.err) { log(`  x ${r.err} ${c.image.slice(0, 90)}`); return null; }
    return { c, dest, bytes: r.bytes };
  });
  const got = dl.filter(Boolean);
  const checks = imgcheck(got.map((g) => g.dest));
  const byPath = new Map(checks.map((k) => [k.path, k]));
  const verified = [];
  for (const g of got) {
    const k = byPath.get(g.dest);
    if (!k || !k.ok) { log(`  x unreadable ${g.c.image.slice(0, 90)} ${k && k.error ? k.error : ''}`); continue; }
    if (Math.max(k.width, k.height) < MIN_LONG) { log(`  x small ${k.width}x${k.height} ${g.c.image.slice(0, 80)}`); continue; }
    let score = g.c.score;
    const ar = Math.max(k.width, k.height) / Math.max(1, Math.min(k.width, k.height));
    if (ar > MAX_ASPECT + 0.5) { log(`  x banner ${k.width}x${k.height} ${g.c.image.slice(0, 80)}`); continue; }
    // re-apply size/aspect bonuses on real dimensions (bing has none)
    if (!g.c.width) {
      if (k.width >= 1500) score += 2; else if (k.width >= 1000) score += 1;
      if (ar > MAX_ASPECT) score -= 3;
    }
    if (k.whiteCorners) score += 2;
    verified.push({ ...g, k, score, file: k.converted || g.dest, ext: k.ext });
  }
  verified.sort((a, b) => b.score - a.score);
  // dedupe by ahash; an "approx" (other model number) candidate only fills a slot when fewer than 2 exact ones exist
  const pick = (pool, kept) => {
    for (const v of pool) {
      if (kept.some((o) => hamming(o.k.ahash, v.k.ahash) <= 6)) { log(`  = dup ${v.c.image.slice(0, 80)}`); continue; }
      kept.push(v);
      if (kept.length >= MAX_KEEP) break;
    }
    return kept;
  };
  let kept = pick(verified.filter((v) => !v.c.approx && v.score >= MIN_KEEP_SCORE), []);
  if (kept.length < 2) kept = pick(verified.filter((v) => !(!v.c.approx && v.score >= MIN_KEEP_SCORE)), kept);
  const images = kept.map((v, i) => {
    const file = `${String(i + 1).padStart(2, '0')}.${v.ext}`;
    fs.copyFileSync(v.file, path.join(dir, file));
    return {
      file, width: v.k.width, height: v.k.height, bytes: fs.statSync(path.join(dir, file)).size,
      sourceUrl: v.c.image, pageUrl: v.c.page || '', title: (v.c.title || '').slice(0, 160), score: v.score, source: v.c.src,
      ...(v.c.approx ? { approx: true } : {}), ...(v.k.whiteCorners ? { cutout: true } : {}),
    };
  });
  fs.rmSync(tmp, { recursive: true, force: true });
  const status = images.length === 0 ? 'none' : images.length === 1 ? 'thin' : 'ok';
  const entry = { name: p.name, brand: p.brand, category: p.category, query, status, images };
  if (!p.brand) entry.generic = true;
  if (images.some((i) => i.approx)) entry.approx = true;
  manifest[p.slug] = entry;
  log(`  => ${status} ${images.length} images ${images.map((i) => `${i.width}x${i.height}`).join(' ')}`);
}

// ---------- main ----------
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  // products.json names are Spanish and its slug is the Spanish URL. The harvest
  // keys folders by the stable English id and searches by the English name.
  const products = JSON.parse(fs.readFileSync(PRODUCTS, 'utf8')).products.map((p) => ({ ...p, slug: p.id || p.slug, name: p.nameEn || p.name }));
  let list = ONLY ? products.filter((p) => ONLY.includes(p.slug)) : products;
  list = list.slice(0, LIMIT);
  log(`harvest ${list.length} products (force=${FORCE})`);
  let done = 0;
  const save = () => fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  await mapLimit(list, PRODUCT_CONCURRENCY, async (p) => {
    try { await harvest(p, manifest); }
    catch (e) { log(`!! ${p.slug} failed: ${e.stack || e.message}`); manifest[p.slug] = { ...(manifest[p.slug] || {}), name: p.name, status: 'none', images: [], error: e.message }; }
    done++;
    if (done % 3 === 0) save();
  });
  save();
  const counts = {};
  for (const s of Object.values(manifest)) counts[s.status] = (counts[s.status] || 0) + 1;
  log('DONE', JSON.stringify(counts));
}

main().catch((e) => { console.error(e); process.exit(1); });
