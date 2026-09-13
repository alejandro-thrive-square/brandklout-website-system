// Alki House — decorative scene generation (Freepik Mystic / Kling / stock).
//
//   node generate-scenes.mjs > generate-scenes.log 2>&1        # everything (idempotent)
//   node generate-scenes.mjs --stage ai                         # one stage: ai | video | stock-search | stock | manifest
//   node generate-scenes.mjs --only hero-gimbal --why "mangled hands"   # force-regenerate one render (and its video)
//   node generate-scenes.mjs --stage stock-search               # previews + contact sheets per query (look at them, then fill stock-picks.json)
//
// Never pipe stdout on Windows/Node 24 (libuv assertion) — redirect to a file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../../../..'); // repo root
const OUT = path.join(HERE, 'scenes');
const DIRS = {
  ai: path.join(OUT, 'ai'),
  video: path.join(OUT, 'video'),
  stock: path.join(OUT, 'stock'),
  previews: path.join(OUT, 'stock', 'previews'),
};
for (const d of Object.values(DIRS)) fs.mkdirSync(d, { recursive: true });

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const ONLY = flag('--only') ? flag('--only').split(',') : undefined; // one or more shot names
const WHY = flag('--why');
const STAGE = flag('--stage');
const CONCURRENCY = 3;

// ---------- key ----------
const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const keyLine = envText.split(/\r?\n/).find((l) => l.startsWith('MAGNIFIC='));
if (!keyLine) throw new Error('MAGNIFIC= not found in repo-root .env');
const KEY = keyLine.slice('MAGNIFIC='.length).trim().replace(/^["']|["']$/g, '');
const API = 'https://api.freepik.com/v1';

// ---------- palette / style ----------
const PALETTE =
  'Colour palette strictly: dark coffee brown #432818 grounds and shadows, autumn ember orange #A65E2A warm practical and rim light, ' +
  'light apricot #FFEBB7 highlights and softbox glow, touches of white. Dark, warm, cinematic, premium moody product-shoot mood. ' +
  'No blue or teal light anywhere, no cold tones. Photoreal, shot on a full-frame cinema camera, 35mm lens, shallow depth of field, ' +
  'fine film grain, no text, no logos, no watermarks, no brand names, no readable labels.';

// added after round 1: five renders came back with garbled pseudo-brand lettering on the gear
const NOTEXT =
  'Every piece of gear is a completely unbranded generic design: plain matte-black bodies with no lettering, no engraving, no labels, no logos, no model names, no symbols, no markings of any kind on any surface.';

const SHOTS = [
  {
    name: 'hero-gimbal', aspect: 'widescreen_16_9',
    prompt: "A filmmaker's hands holding a mirrorless camera mounted on a 3-axis motorised gimbal in a dark studio, seen from the side, hands in focus with natural anatomy, warm amber rim light from a softbox off to one side, deep coffee-brown shadows, apricot highlights glinting on the brushed metal of the gimbal arms, shallow depth of field, cinematic." + NOTEXT + " " + PALETTE,
  },
  {
    name: 'hero-gimbal-portrait', aspect: 'social_story_9_16',
    prompt: "Vertical composition for a phone screen: a filmmaker's hands holding a mirrorless camera mounted on a 3-axis motorised gimbal in a dark studio, gimbal filling the middle of the frame with dark empty space above, warm amber rim light from a softbox, deep coffee-brown shadows, apricot highlights on the brushed metal, shallow depth of field, cinematic." + NOTEXT + " " + PALETTE,
  },
  {
    name: 'studio-lighting', aspect: 'widescreen_16_9',
    prompt: 'A moody photography studio: an RGB LED panel light and a large octagonal softbox on light stands, both switched on and glowing warm apricot, warm ember glow falling across a dark brown seamless paper backdrop, thin haze in the air catching the light beams, no people, cinematic wide shot. ' + PALETTE,
  },
  {
    name: 'audio-desk', aspect: 'classic_4_3',
    prompt: 'Two small wireless lavalier microphone transmitters with clip-on lav mics and a matching dual-channel receiver laid on a dark walnut wood desk beside a mirrorless camera, one warm desk lamp lighting the scene from the side, the rest of the room in dark coffee-brown shadow, product still life, top-down three-quarter angle. ' + PALETTE,
  },
  {
    name: 'rig-build', aspect: 'traditional_3_4',
    prompt: 'A cinema camera built into a black aluminium camera cage with a top handle, a 7-inch field monitor mounted on top showing a soft warm amber blurred image, the monitor is a smooth featureless black slab with no buttons and no markings, a matte box on the lens, all on a fluid-head tripod, side lit by warm ember light with apricot edge highlights, dark studio background fading to coffee-brown black, vertical composition, no people.' + NOTEXT + ' ' + PALETTE,
  },
  {
    name: 'adapter-macro', aspect: 'square_1_1', engine: 'seedream', // Mystic put lettering on this subject four times running
    prompt: 'Extreme macro photograph of a brass-and-black lens mount adapter ring standing upright on its edge on a dark walnut wood surface, the ring alone in sharp focus filling the frame, behind it only a vintage chrome manual-focus lens as a soft blurred shape, no camera body anywhere in the frame, smooth plain unengraved brass surface with fine knurling only, warm ember light raking across the brass threads with apricot highlights, dark coffee-brown ground, very shallow depth of field.' + NOTEXT + ' ' + PALETTE,
  },
  {
    name: 'creator-room', aspect: 'widescreen_16_9',
    prompt: 'A small cosy modern home content-creator studio seen from behind a creator (back of head and shoulders only, out of focus), a smartphone mounted on a handheld gimbal on the desk in front of them, a ring of warm LED tube bar lights glowing apricot on the wall, warm apricot-toned painted wall, plants and a wooden shelf, dark warm shadows in the corners. ' + PALETTE,
  },
  {
    name: 'softbox-glow', aspect: 'square_1_1',
    prompt: 'Abstract minimal close-up of a lit softbox diffusion fabric panel glowing soft apricot light with a warm ember gradient toward the edges, against pure dark coffee-brown darkness, soft fabric texture, gentle falloff, no other objects. ' + PALETTE,
  },
  {
    name: 'product-stage', aspect: 'widescreen_16_9',
    prompt: 'An empty round dark-walnut wooden product display stage under a single warm spotlight from above, a smooth coffee-brown seamless backdrop behind it, subtle haze in the beam of light, soft apricot highlight on the rim of the stage, wide composition with empty space, backdrop plate for product photography, nothing on the stage. ' + PALETTE,
  },
  {
    name: 'monitor-glow', aspect: 'classic_4_3',
    prompt: 'A 5-inch on-camera field monitor mounted on top of a mirrorless camera via an articulating arm, the monitor screen showing a warm amber-toned blurry cinematic image (no text, no menus), in a dark studio, ember rim light outlining the camera body, apricot glow from the screen spilling onto the camera, shallow depth of field, plain black monitor bezel.' + NOTEXT + ' ' + PALETTE,
  },
];

// Visual review verdicts (every render viewed after generation), carried into the manifest.
const REVIEW = {
  'hero-gimbal': 'accepted round 2; hands natural, warm; a faint sub-1% pseudo-mark remains on the camera body',
  'hero-gimbal-portrait': 'accepted round 2; a faint sub-1% mark on the camera body',
  'studio-lighting': 'accepted round 1; two softboxes (the RGB panel did not render), no haze beams',
  'audio-desk': 'accepted round 1; a faint mark on one transmitter, no readable text',
  'rig-build': 'accepted round 3; monitor bezel now clean, small mark on the camera nameplate',
  'adapter-macro': 'accepted round 5 (seedream-v4); Mystic lettered the subject four times running',
  'creator-room': 'accepted round 1; ring light instead of a ring of bar lights, reads well',
  'softbox-glow': 'accepted round 1; abstract glowing panel with a faint hot spot',
  'product-stage': 'accepted round 1; clean plate',
  'monitor-glow': 'accepted round 2; small Rams-like mark on the camera body, screen image clean',
};

const VIDEOS = [
  { name: 'hero-gimbal', from: 'hero-gimbal', prompt: 'Slow cinematic dolly, the camera barely moves, the warm rim light flickers very subtly and thin haze drifts through the beam, the hands hold still, no cuts, seamless loop, photoreal, warm amber tones.' },
  { name: 'studio-lighting', from: 'studio-lighting', prompt: 'Slow cinematic dolly, the camera barely moves, the softbox and LED panel glow flickers very subtly, haze drifts slowly through the light beams, no cuts, seamless loop, photoreal, warm amber tones.' },
  { name: 'hero-gimbal-portrait', from: 'hero-gimbal-portrait', prompt: 'Slow cinematic dolly, the camera barely moves, the warm rim light flickers very subtly and thin haze drifts through the beam, the hands hold still, no cuts, seamless loop, photoreal, warm amber tones.' },
];

const STOCK_QUERIES = [
  { slug: 'studio-softbox', term: 'photography studio softbox dark' },
  { slug: 'gimbal-in-use', term: 'camera gimbal filmmaker' },
  { slug: 'filmmaker-set', term: 'filmmaker on set lights cinematic' },
  { slug: 'lav-mic', term: 'wireless lavalier microphone' },
  { slug: 'field-monitor', term: 'camera field monitor rig' },
  { slug: 'lens-mount', term: 'camera lens mount close up' },
  { slug: 'led-panel', term: 'LED panel light video studio' },
  { slug: 'dark-backdrop', term: 'dark photo studio backdrop' },
  { slug: 'creator-home', term: 'content creator filming at home' },
  // second pass: the first field-monitor / gimbal queries came back outdoor, green or blue
  { slug: 'monitor-studio', term: 'cinema camera rig monitor studio dark' },
  { slug: 'gimbal-dark', term: 'gimbal stabilizer camera dark studio' },
];

// ---------- http ----------
const stats = { calls: 0, polls: 0, downloads: 0, byEndpoint: {} };
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, p, body, { poll = false } = {}) {
  const ep = p.replace(/\/[0-9a-f-]{20,}$/i, '/{id}').replace(/\?.*$/, '');
  stats.calls++;
  if (poll) stats.polls++;
  stats.byEndpoint[ep] = (stats.byEndpoint[ep] || 0) + 1;
  const res = await fetch(API + p, {
    method,
    headers: { 'x-freepik-api-key': KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`${method} ${p} -> ${res.status}: ${text.slice(0, 500)}`);
    err.status = res.status; err.body = json;
    throw err;
  }
  return json;
}

async function download(url, dest) {
  stats.downloads++;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf;
}

async function waitTask(getPath, { every, label, max = 60 * 60 * 1000 }) {
  const t0 = Date.now();
  for (;;) {
    await sleep(every);
    const r = await api('GET', getPath, undefined, { poll: true });
    const s = r?.data?.status;
    if (s === 'COMPLETED') return r.data;
    if (s === 'FAILED' || s === 'ERROR') throw new Error(`${label}: task ${s} ${JSON.stringify(r).slice(0, 300)}`);
    if (Date.now() - t0 > max) throw new Error(`${label}: timeout`);
  }
}

async function pool(items, n, fn) {
  const results = [];
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = { ok: true, value: await fn(items[idx]) }; }
      catch (e) { results[idx] = { ok: false, error: String(e?.message || e) }; log('FAIL', items[idx]?.name ?? items[idx]?.slug ?? idx, results[idx].error); }
    }
  }));
  return results;
}

// ---------- image helpers ----------
function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'png';
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  return 'bin';
}
function py(code, argv = []) {
  return execFileSync('python', ['-c', code, ...argv], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
// Save whatever we got as a proper JPEG (Mystic may hand back png/webp).
function toJpeg(src, dest) {
  const buf = fs.readFileSync(src);
  if (sniff(buf) === 'jpg') { if (src !== dest) fs.renameSync(src, dest); return; }
  py("import sys; from PIL import Image; im=Image.open(sys.argv[1]).convert('RGB'); im.save(sys.argv[2], 'JPEG', quality=94, subsampling=0)", [src, dest]);
  fs.unlinkSync(src);
}
function imageSize(file) {
  const out = py("import sys; from PIL import Image; im=Image.open(sys.argv[1]); print(im.width, im.height)", [file]).trim().split(' ');
  return { width: +out[0], height: +out[1] };
}
function videoSize(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim().split(',');
    return { width: +out[0], height: +out[1], duration: +out[2] || undefined };
  } catch { return { width: null, height: null }; }
}

// ---------- state files ----------
const STATE = path.join(OUT, 'scenes-state.json'); // prompts actually used, task ids, regen log
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { ai: {}, video: {}, stock: {}, regenerated: [] };
// Merge on save: several stages run as parallel processes, each must only write the entries it
// produced (dirty set) — merging the whole in-memory section clobbered newer entries from other runs.
const dirty = new Set();
const put = (section, key, value) => { state[section][key] = value; dirty.add(section + '/' + key); };
const saveState = () => {
  const disk = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { ai: {}, video: {}, stock: {}, regenerated: [] };
  for (const k of ['ai', 'video', 'stock']) { disk[k] ??= {}; for (const key of Object.keys(state[k])) if (dirty.has(k + '/' + key)) disk[k][key] = state[k][key]; }
  const seen = new Set((disk.regenerated ??= []).map((r) => r.name + r.at));
  for (const r of state.regenerated) if (!seen.has(r.name + r.at)) disk.regenerated.push(r);
  Object.assign(state, disk);
  fs.writeFileSync(STATE, JSON.stringify(disk, null, 2));
};

// ---------- stage: ai ----------
async function mystic(shot) {
  const dest = path.join(DIRS.ai, `${shot.name}.jpg`);
  if (fs.existsSync(dest)) { log('skip', shot.name, '(exists)'); return dest; }
  if (shot.engine === 'seedream') return seedream(shot, dest);
  log('mystic ->', shot.name, shot.aspect);
  const body = { prompt: shot.prompt, resolution: '2k', aspect_ratio: shot.aspect, realism: true, creative_detailing: 33, model: 'realism' };
  let created;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { created = await api('POST', '/ai/mystic', body); break; }
    catch (e) {
      const inv = e.body?.invalid_params;
      if (e.status === 400 && Array.isArray(inv) && inv.length) {
        for (const p of inv) { log('mystic rejected field', p.field ?? p.param ?? JSON.stringify(p), '-', p.reason ?? p.message ?? ''); delete body[p.field ?? p.param]; }
        continue;
      }
      if (e.status >= 500 && attempt < 2) { log('mystic 5xx, retrying', shot.name); await sleep(4000 * (attempt + 1)); continue; }
      throw e;
    }
  }
  if (!created) throw new Error('mystic: could not create task');
  const id = created.data.task_id;
  log('mystic task', shot.name, id);
  const done = await waitTask(`/ai/mystic/${id}`, { every: 5000, label: `mystic ${shot.name}` });
  const url = done.generated?.[0];
  if (!url) throw new Error(`mystic ${shot.name}: no generated url ${JSON.stringify(done).slice(0, 300)}`);
  const tmp = dest + '.download';
  await download(url, tmp);
  toJpeg(tmp, dest);
  put('ai', shot.name, { task_id: id, prompt: shot.prompt, aspect: shot.aspect, body, generated_at: new Date().toISOString() });
  saveState();
  log('mystic done', shot.name, imageSize(dest));
  return dest;
}

// Seedream v4: second engine, used per shot when Mystic keeps inventing lettering on a subject.
async function seedream(shot, dest) {
  log('seedream ->', shot.name, shot.aspect);
  const body = { prompt: shot.prompt, aspect_ratio: shot.aspect };
  let created;
  try { created = await api('POST', '/ai/text-to-image/seedream-v4', body); }
  catch (e) {
    const inv = e.body?.invalid_params;
    if (e.status === 400 && Array.isArray(inv) && inv.length) {
      for (const p of inv) { log('seedream rejected field', p.field ?? p.param ?? JSON.stringify(p), '-', p.reason ?? p.message ?? ''); delete body[p.field ?? p.param]; }
      created = await api('POST', '/ai/text-to-image/seedream-v4', body);
    } else throw e;
  }
  const id = created.data.task_id;
  log('seedream task', shot.name, id);
  const done = await waitTask(`/ai/text-to-image/seedream-v4/${id}`, { every: 5000, label: `seedream ${shot.name}` });
  const url = done.generated?.[0];
  if (!url) throw new Error(`seedream ${shot.name}: no generated url ${JSON.stringify(done).slice(0, 300)}`);
  const tmp = dest + '.download';
  await download(url, tmp);
  toJpeg(tmp, dest);
  put('ai', shot.name, { engine: 'seedream-v4', task_id: id, prompt: shot.prompt, aspect: shot.aspect, body, generated_at: new Date().toISOString() });
  saveState();
  log('seedream done', shot.name, imageSize(dest));
  return dest;
}

async function stageAi() {
  let shots = SHOTS;
  if (ONLY) {
    shots = SHOTS.filter((s) => ONLY.includes(s.name));
    if (shots.length !== ONLY.length) throw new Error(`--only ${ONLY}: unknown shot`);
    for (const name of ONLY) {
      const dest = path.join(DIRS.ai, `${name}.jpg`);
      if (!fs.existsSync(dest)) continue;
      const n = (state.regenerated.filter((r) => r.name === name).length) + 1;
      const rejected = path.join(DIRS.ai, `${name}.rejected-${n}.jpg`);
      fs.renameSync(dest, rejected);
      state.regenerated.push({ name, why: WHY || '(no reason given)', rejected_file: path.relative(OUT, rejected).replace(/\\/g, '/'), at: new Date().toISOString() });
      // the video made from the old render is stale too
      const vid = path.join(DIRS.video, `${name}.mp4`);
      if (fs.existsSync(vid)) fs.renameSync(vid, vid.replace(/\.mp4$/, `.rejected-${n}.mp4`));
    }
    saveState();
  }
  return pool(shots, CONCURRENCY, mystic);
}

// ---------- stage: video ----------
async function kling(v) {
  const dest = path.join(DIRS.video, `${v.name}.mp4`);
  if (fs.existsSync(dest)) { log('skip video', v.name, '(exists)'); return dest; }
  const src = path.join(DIRS.ai, `${v.from}.jpg`);
  if (!fs.existsSync(src)) throw new Error(`video ${v.name}: source render missing`);
  const image = fs.readFileSync(src).toString('base64');
  let model = 'kling-v2-5-pro';
  let created, err;
  try {
    log('kling ->', v.name);
    created = await api('POST', `/ai/image-to-video/${model}`, { image, prompt: v.prompt, duration: '5', cfg_scale: 0.5 });
  } catch (e) {
    err = e; log('kling failed, falling back to hailuo:', e.message.slice(0, 200));
    model = 'minimax-hailuo-02-768p';
    created = await api('POST', `/ai/image-to-video/${model}`, { image, prompt: v.prompt, duration: 6 });
  }
  const id = created.data.task_id;
  log(model, 'task', v.name, id);
  const done = await waitTask(`/ai/image-to-video/${model}/${id}`, { every: 10000, label: `${model} ${v.name}` });
  const url = done.generated?.[0];
  if (!url) throw new Error(`${model} ${v.name}: no generated url`);
  await download(url, dest);
  put('video', v.name, { model, task_id: id, prompt: v.prompt, from: path.relative(OUT, src), generated_at: new Date().toISOString(), kling_error: err?.message?.slice(0, 200) });
  saveState();
  log('video done', v.name, videoSize(dest));
  return dest;
}
async function stageVideo() {
  let vids = VIDEOS;
  if (ONLY) vids = VIDEOS.filter((v) => ONLY.includes(v.name));
  return pool(vids, CONCURRENCY, kling);
}

// ---------- stage: stock-search ----------
const CANDIDATES = path.join(DIRS.stock, 'stock-candidates.json');
const PICKS = path.join(DIRS.stock, 'stock-picks.json');
const q = (o) => Object.entries(o).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

async function stageStockSearch() {
  const all = fs.existsSync(CANDIDATES) ? JSON.parse(fs.readFileSync(CANDIDATES, 'utf8')) : {};
  await pool(STOCK_QUERIES, CONCURRENCY, async (sq) => {
    const dir = path.join(DIRS.previews, sq.slug);
    const sheet = path.join(DIRS.previews, `${sq.slug}.contact.jpg`);
    if (all[sq.slug] && fs.existsSync(sheet)) { log('skip search', sq.slug); return; }
    fs.mkdirSync(dir, { recursive: true });
    const r = await api('GET', `/resources?${q({ term: sq.term, limit: 10, 'filters[content_type][photo]': 1, 'filters[orientation][landscape]': 1 })}`);
    const items = [];
    for (const d of r.data || []) {
      const preview = path.join(dir, `${d.id}.jpg`);
      try { if (!fs.existsSync(preview)) await download(d.image.source.url, preview); } catch (e) { log('preview fail', d.id, e.message); continue; }
      items.push({ id: d.id, title: d.title, url: d.url, license: d.licenses?.map((l) => l.type).join(','), author: d.author?.name, preview: path.relative(OUT, preview), source_size: d.image?.source?.size });
    }
    all[sq.slug] = { term: sq.term, items };
    // contact sheet: 5 columns, id labels, so one Read shows the whole query
    py(`
import sys, os, json
from PIL import Image, ImageDraw
items = json.loads(sys.argv[1]); out = sys.argv[2]; base = sys.argv[3]
W, H, cols = 400, 267, 5
rows = (len(items)+cols-1)//cols or 1
sheet = Image.new('RGB', (cols*W, rows*(H+22)), (30,20,15))
dr = ImageDraw.Draw(sheet)
for i, it in enumerate(items):
    im = Image.open(os.path.join(base, it['preview'])).convert('RGB'); im.thumbnail((W, H))
    x, y = (i%cols)*W, (i//cols)*(H+22)
    sheet.paste(im, (x + (W-im.width)//2, y))
    dr.text((x+4, y+H+4), str(it['id']) + '  ' + it['license'], fill=(255,235,183))
sheet.save(out, 'JPEG', quality=80)
`, [JSON.stringify(items), sheet, OUT]);
    log('search', sq.slug, items.length, 'candidates ->', path.relative(OUT, sheet));
  });
  fs.writeFileSync(CANDIDATES, JSON.stringify(all, null, 2));
  if (!fs.existsSync(PICKS)) fs.writeFileSync(PICKS, JSON.stringify({ _readme: 'ids chosen after viewing previews/*.contact.jpg; slug is the output filename suffix', picks: [] }, null, 2));
}

// ---------- stage: stock (full-res for picks) ----------
async function stageStock() {
  if (!fs.existsSync(PICKS)) { log('stock: no stock-picks.json yet, run --stage stock-search and pick'); return; }
  const picks = JSON.parse(fs.readFileSync(PICKS, 'utf8')).picks;
  const cands = fs.existsSync(CANDIDATES) ? JSON.parse(fs.readFileSync(CANDIDATES, 'utf8')) : {};
  const meta = {};
  for (const qq of Object.values(cands)) for (const it of qq.items) meta[it.id] = it;
  await pool(picks, CONCURRENCY, async (p) => {
    const dest = path.join(DIRS.stock, `${p.id}-${p.slug}.jpg`);
    if (fs.existsSync(dest)) { log('skip stock', p.id, '(exists)'); return; }
    log('stock download ->', p.id, p.slug);
    const r = await api('GET', `/resources/${p.id}/download`);
    const url = r.data?.url;
    if (!url) throw new Error(`stock ${p.id}: no download url ${JSON.stringify(r).slice(0, 200)}`);
    const tmp = dest + '.download';
    await download(url, tmp);
    toJpeg(tmp, dest);
    put('stock', p.id, { slug: p.slug, title: meta[p.id]?.title, license: meta[p.id]?.license, author: meta[p.id]?.author, resource_url: meta[p.id]?.url, downloaded_at: new Date().toISOString() });
    saveState();
    log('stock done', p.id, imageSize(dest));
  });
}

// ---------- stage: manifest ----------
function stageManifest() {
  const files = [];
  const rel = (f) => path.relative(HERE, f).replace(/\\/g, '/');
  for (const s of SHOTS) {
    const f = path.join(DIRS.ai, `${s.name}.jpg`);
    if (!fs.existsSync(f)) continue;
    const st = state.ai[s.name] || {};
    files.push({ name: s.name, path: rel(f), source: st.engine === 'seedream-v4' ? 'seedream' : 'mystic', model: st.engine ?? (st.body?.model ?? 'realism'), resolution: st.engine ? undefined : '2k', aspect_ratio: s.aspect, prompt: st.prompt ?? s.prompt, task_id: st.task_id, review: REVIEW[s.name], ...imageSize(f), bytes: fs.statSync(f).size });
  }
  for (const v of VIDEOS) {
    const f = path.join(DIRS.video, `${v.name}.mp4`);
    if (!fs.existsSync(f)) continue;
    const st = state.video[v.name] || {};
    files.push({ name: v.name, path: rel(f), source: st.model === 'minimax-hailuo-02-768p' ? 'hailuo' : 'kling', model: st.model, from: st.from, prompt: st.prompt ?? v.prompt, task_id: st.task_id, ...videoSize(f), bytes: fs.statSync(f).size });
  }
  for (const [id, st] of Object.entries(state.stock)) {
    const f = path.join(DIRS.stock, `${id}-${st.slug}.jpg`);
    if (!fs.existsSync(f)) continue;
    files.push({ name: `${id}-${st.slug}`, path: rel(f), source: 'freepik-stock', freepik_id: +id, title: st.title, license: st.license, author: st.author, resource_url: st.resource_url, ...imageSize(f), bytes: fs.statSync(f).size });
  }
  const manifest = {
    client: 'alki-house', generated_at: new Date().toISOString(),
    palette: { dark_coffee: '#432818', autumn_ember: '#A65E2A', light_apricot: '#FFEBB7', white: '#FFFFFF' },
    files, regenerated: state.regenerated,
    review_rule: 'prominent or readable pseudo-brand lettering = regenerate; sub-1% body marks accepted and noted; rejected renders kept as ai/<name>.rejected-N.jpg',
    api_calls_this_run: stats,
  };
  fs.writeFileSync(path.join(OUT, 'scenes-manifest.json'), JSON.stringify(manifest, null, 2));
  log('manifest:', files.length, 'files');
}

// ---------- main ----------
const run = async (name, fn) => { if (!STAGE || STAGE === name) { log(`== ${name} ==`); await fn(); } };
try {
  await run('ai', stageAi);
  await run('video', stageVideo);
  if (STAGE === 'stock-search') await run('stock-search', stageStockSearch);
  await run('stock', stageStock);
  if (!STAGE || STAGE === 'manifest' || STAGE === 'ai' || STAGE === 'video' || STAGE === 'stock') stageManifest();
} finally {
  log('API calls:', JSON.stringify(stats));
  // keep a running total across invocations
  const totals = path.join(OUT, 'api-calls.json');
  const prev = fs.existsSync(totals) ? JSON.parse(fs.readFileSync(totals, 'utf8')) : { runs: [] };
  prev.runs.push({ at: new Date().toISOString(), argv: args, ...stats });
  prev.total_calls = prev.runs.reduce((a, r) => a + r.calls, 0);
  prev.total_downloads = prev.runs.reduce((a, r) => a + r.downloads, 0);
  fs.writeFileSync(totals, JSON.stringify(prev, null, 2));
}
