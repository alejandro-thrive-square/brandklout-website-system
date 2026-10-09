// Alki House — the hero film: one dark studio, six product types revealed by moving light, cut into
// a seamless 1080p loop. Magnific/Freepik API (MAGNIFIC key): Mystic keyframes -> Seedance 2.0 Pro
// 1080p image-to-video -> ffmpeg dissolves.
//
//   node make-hero-film.mjs --stage keys        > keys.log 2>&1   # 6 keyframes (look at them)
//   node make-hero-film.mjs --stage crop        > crop.log 2>&1   # re-cut the 16:9 frames after editing CROPX
//   node make-hero-film.mjs --stage ab          > ab.log 2>&1     # shot 1 in Seedance 2.0 and Kling 2.6, side by side
//   node make-hero-film.mjs --stage video       > video.log 2>&1  # every shot in the chosen engine
//   node make-hero-film.mjs --stage edit        > edit.log 2>&1   # ../scenes/video/hero-film.mp4 + poster + segments
//   node make-hero-film.mjs --redo <shot> --why "<reason>" --stage keys|video   # regenerate one, keeping the reject
//
// Idempotent: a stage skips what exists. Never pipe stdout on Windows/Node 24 — redirect to a file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../../../../..'); // repo root
const KEYS = path.join(HERE, 'keys');
const CLIPS = path.join(HERE, 'clips');
const SCENES = path.resolve(HERE, '..', 'scenes');
const STATE = path.join(HERE, 'hero-film-state.json');
for (const d of [KEYS, CLIPS]) fs.mkdirSync(d, { recursive: true });

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const STAGE = flag('--stage');
const REDO = flag('--redo');
const WHY = flag('--why');
const ENGINE = flag('--engine') || 'seedance'; // the video stage's engine, chosen after the A/B

const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const KEY = envText.split(/\r?\n/).find((l) => l.startsWith('MAGNIFIC=')).slice('MAGNIFIC='.length).trim().replace(/^["']|["']$/g, '');
const API = 'https://api.freepik.com/v1';

// ---------- the look ----------
const NOTEXT = 'Every piece of gear is a completely unbranded generic design: plain matte-black and gunmetal bodies with no lettering, no engraving, no labels, no logos, no model names, no symbols, no markings of any kind on any surface.';
const STUDIO =
  'Ultra-premium product commercial still, shot on a cinema camera with a 50mm prime lens. A pitch-dark studio: a deep coffee-brown to black seamless backdrop, thin atmospheric haze hanging in the air. ' +
  'The product is the hero: large in frame, filling about half the frame height, dead centre, standing on a glossy black lacquered floor that mirrors it with a soft reflection; wide dark empty space on both sides. ' +
  'Lighting: two narrow warm ember-orange (#A65E2A) volumetric light beams slanting down through the haze from above, crisp apricot (#FFEBB7) rim lights tracing the product\'s silhouette on both sides, glossy specular highlights on its metal, a faint warm glow pooling on the floor beneath it. ' +
  'Rich deep blacks, crisp detail on the product, subtle film grain. Strictly warm colours: dark coffee brown, ember orange, apricot, touches of white; no blue, no teal, no cold light. No people, no hands. ' +
  NOTEXT + ' No text, no logos, no watermark.';
const MOTION =
  'A slow, smooth cinematic push-in with a gentle arc around the product. Warm volumetric light beams slowly sweep across the scene through the drifting haze, a moving rim light glides along the product\'s edges and specular highlights travel across its surfaces; the backdrop stays dark. ' +
  'The product itself stays completely still, solid and unchanged: no parts move or bend, nothing new appears, no text, no people, no hands. Elegant, premium product commercial.';

// cat = the site's aisle id the caption links to while the shot is on screen.
const SHOTS = [
  { name: 'gimbal', cat: 'gimbals', subject: 'A large professional 3-axis motorised camera gimbal stabiliser in matte black and gunmetal with a sculpted handle, its arms balancing a full-frame mirrorless camera with a cinema prime lens, standing upright on its small folding tripod base, seen in three-quarter view.' },
  { name: 'cob-light', cat: 'iluminacion', subject: 'A compact professional COB LED video light with a polished silver parabolic reflector, mounted on a short black light stand, its lamp glowing warm and bright inside the reflector.' },
  { name: 'softbox', cat: 'modificadores', subject: 'A deep parabolic octagonal studio softbox, black fabric outside with fine silver edge seams, mounted on a compact COB light on a black light stand, seen in three-quarter view so its round white front diffuser faces the camera and glows bright warm apricot from within.' },
  { name: 'audio', cat: 'audio', subject: 'A compact wireless lavalier microphone system seen close, low angle: an open matte-black charging case the size of a sunglasses case lying flat on the floor, holding two tiny square transmitters each the size of a matchbox, with a thin clip-on lavalier microphone on a short cable resting in front, and one slightly larger square receiver standing upright beside the case. A modern compact digital system with no antennas anywhere. No handheld microphone, no microphone stand, no phone.' },
  { name: 'monitor', cat: 'monitores', subject: 'A 7-inch on-camera field monitor with a black sunhood, its screen glowing with a soft warm abstract amber image, mounted on a small articulating arm on a short black stand, seen in three-quarter view.' },
  { name: 'rig', cat: 'rigs', subject: 'A full-frame mirrorless camera built into a black aluminium camera cage with a top handle, a wooden side handle and a cinema prime lens, the cage\'s machined holes catching the warm light, seen in three-quarter view. The lens barrel is smooth and blank: no numbers, no scales, no letters, no rings of text.' },
];
// cropX: where the 16:9 window starts in the 20:9 render, in px (0 = flush left, product at 62.5 %
// when Mystic centred it). Set per shot from the raw render when the product came out off centre.
const CROPX = { audio: 130 };

// ---------- http ----------
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(method, p, body) {
  const res = await fetch(API + p, { method, headers: { 'x-freepik-api-key': KEY, 'content-type': 'application/json', accept: 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) { const e = new Error(`${method} ${p} -> ${res.status}: ${text.slice(0, 400)}`); e.status = res.status; throw e; }
  return json;
}
async function create(p, body) {
  for (let a = 0; ; a++) {
    try { return await api('POST', p, body); }
    catch (e) { if (e.status >= 500 && a < 3) { log('5xx, retrying', p); await sleep(5000 * (a + 1)); continue; } throw e; }
  }
}
async function waitTask(p, every, label) {
  const t0 = Date.now();
  for (;;) {
    await sleep(every);
    const r = await api('GET', p).catch((e) => (e.status >= 500 ? null : Promise.reject(e)));
    const s = r?.data?.status;
    if (s === 'COMPLETED') return r.data;
    if (s === 'FAILED' || s === 'ERROR') throw new Error(`${label}: ${s} ${JSON.stringify(r).slice(0, 300)}`);
    if (Date.now() - t0 > 40 * 60 * 1000) throw new Error(`${label}: timeout`);
  }
}
async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download -> ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: ['ignore', 'ignore', 'inherit'] });
const probe = (f) => { const o = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:format=duration', '-of', 'json', f], { encoding: 'utf8' }); const j = JSON.parse(o); return { ...j.streams[0], duration: +j.format.duration }; };

const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { keys: {}, clips: {}, rejected: [] };
// Two runs can be in flight at once (an A/B poll beside a video stage): merge with what is on disk
// so neither drops the other's records. A finished clip clears its pending entry on both sides.
const save = () => {
  const disk = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
  for (const k of ['keys', 'clips', 'pending']) state[k] = { ...(disk[k] || {}), ...(state[k] || {}) };
  for (const c of Object.keys(state.clips)) delete state.pending[c];
  const seen = new Set((state.rejected || []).map((r) => r.file));
  state.rejected = [...(state.rejected || []), ...(disk.rejected || []).filter((r) => !seen.has(r.file))];
  if (disk.edit && !state.edit) state.edit = disk.edit;
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
};
function reject(file, kind, name) {
  if (!fs.existsSync(file)) return;
  const n = state.rejected.filter((r) => r.name === name && r.kind === kind).length + 1;
  const to = file.replace(/(\.\w+)$/, `.rejected-${n}$1`);
  fs.renameSync(file, to);
  state.rejected.push({ kind, name, why: WHY || '(no reason given)', file: path.relative(HERE, to).replace(/\\/g, '/'), at: new Date().toISOString() });
  save();
}

// ---------- keyframes (Mystic, 2k 20:9 -> 16:9) ----------
async function key(shot) {
  const dest = path.join(KEYS, `${shot.name}.jpg`);
  if (fs.existsSync(dest)) return dest;
  const prompt = shot.subject + ' ' + STUDIO;
  log('mystic ->', shot.name);
  const c = await create('/ai/mystic', { prompt, resolution: '2k', aspect_ratio: 'smartphone_horizontal_20_9', realism: true, creative_detailing: 33, model: 'realism' });
  const done = await waitTask(`/ai/mystic/${c.data.task_id}`, 5000, `mystic ${shot.name}`);
  const tmp = dest + '.download';
  await download(done.generated[0], tmp);
  // Rendered 20:9 with the product centred; the 16:9 window flush left puts it at 62.5 % across,
  // right of the headline, in every shot. The raw render is kept beside it.
  ff(['-i', tmp, '-q:v', '2', dest.replace(/\.jpg$/, '.raw.jpg')]);
  fs.rmSync(tmp);
  crop(shot);
  state.keys[shot.name] = { engine: 'mystic', task_id: c.data.task_id, prompt, at: new Date().toISOString() };
  save();
  log('key done', shot.name);
  return dest;
}

function crop(shot) {
  const raw = path.join(KEYS, `${shot.name}.raw.jpg`);
  ff(['-i', raw, '-vf', `crop=trunc(ih*16/9/2)*2:ih:min(${CROPX[shot.name] || 0}\\,iw-trunc(ih*16/9/2)*2):0`, '-q:v', '2', path.join(KEYS, `${shot.name}.jpg`)]);
}

// ---------- clips ----------
// status: where the task reports; Kling 2.6 creates at kling-v2-6-pro but reports at kling-v2-6.
const ENGINES = {
  seedance: { path: '/ai/video/seedance-2-pro-1080p', status: '/ai/video/seedance-2-pro-1080p', body: (image) => ({ prompt: MOTION, image, duration: 6, camera_fixed: false, sound_effects: false, seed: -1 }) },
  kling: { path: '/ai/image-to-video/kling-v2-6-pro', status: '/ai/image-to-video/kling-v2-6', body: (image) => ({ image, prompt: MOTION, duration: '5', cfg_scale: 0.5, negative_prompt: 'text, letters, logo, watermark, people, hands, morphing, melting, extra objects, blue light' }) },
};
async function clip(shot, engine, suffix = '') {
  const key = `${shot.name}${suffix}`;
  const dest = path.join(CLIPS, `${key}.mp4`);
  if (fs.existsSync(dest)) return dest;
  const src = path.join(KEYS, `${shot.name}.jpg`);
  if (!fs.existsSync(src)) throw new Error(`${shot.name}: keyframe missing`);
  const e = ENGINES[engine];
  // A task is recorded the moment it exists, so a crashed or interrupted run resumes it instead of
  // paying for a new one (Seedance 2.0 Pro 1080p takes 10+ minutes a clip).
  state.pending ??= {};
  let id = state.pending[key]?.engine === engine ? state.pending[key].task_id : null;
  if (id) log(engine, 'resume', key, id);
  else {
    log(engine, '->', key);
    id = (await create(e.path, e.body(fs.readFileSync(src).toString('base64')))).data.task_id;
    state.pending[key] = { engine, task_id: id, at: new Date().toISOString() };
    save();
  }
  const done = await waitTask(`${e.status}/${id}`, 15000, `${engine} ${key}`);
  await download(done.generated[0], dest);
  delete state.pending[key];
  state.clips[key] = { engine, endpoint: e.path, task_id: id, prompt: MOTION, ...probe(dest), at: new Date().toISOString() };
  save();
  log('clip done', shot.name + suffix, JSON.stringify(probe(dest)));
  return dest;
}
async function pool(items, n, fn) {
  let i = 0; const out = [];
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

// ---------- edit ----------
// Clips joined by dissolves; the last shot dissolves back into the first and the cut sits inside the
// first shot, so the file loops without a seam. segments.json says which aisle is on screen when.
// Seconds used per clip (from 0.25 s), dissolve length. 4.4 not 5.4: Seedance's push-in ends so
// tight that on a wide, short desktop the rig's top handle left the frame and the products reached
// behind the headline.
const L = 4.4, D = 1.0;
function edit() {
  // Cuts whatever shots have clips, in SHOTS order; a missing one is skipped with a warning (on
  // 2026-10-09 audio and monitor hit 402 Insufficient credits) and joins on the next edit.
  const have = SHOTS.filter((s) => fs.existsSync(path.join(CLIPS, `${s.name}.mp4`)));
  for (const s of SHOTS) if (!have.includes(s)) log(`edit: no clip for ${s.name} yet, cutting without it`);
  if (have.length < 2) throw new Error('edit: need at least two clips');
  const files = have.map((s) => path.join(CLIPS, `${s.name}.mp4`));
  const seq = [...files, files[0]];
  const inputs = seq.flatMap((f) => ['-i', f]);
  const norm = seq.map((_, i) => `[${i}:v]trim=start=0.25:duration=${L},setpts=PTS-STARTPTS,fps=24,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,format=yuv420p[v${i}]`);
  let last = 'v0';
  const chain = [];
  for (let i = 1; i < seq.length; i++) {
    const out = i === seq.length - 1 ? 'vall' : `x${i}`;
    chain.push(`[${last}][v${i}]xfade=transition=fade:duration=${D}:offset=${(i * (L - D)).toFixed(3)}[${out}]`);
    last = out;
  }
  const S = have.length * (L - D); // loop length
  const filter = [...norm, ...chain, `[vall]trim=start=${D}:duration=${S},setpts=PTS-STARTPTS[vout]`].join(';');
  const out = path.join(SCENES, 'video', 'hero-film.mp4');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  ff([...inputs, '-filter_complex', filter, '-map', '[vout]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  const poster = path.join(SCENES, 'ai', 'hero-film-poster.jpg');
  ff(['-ss', '0.5', '-i', out, '-frames:v', '1', '-q:v', '2', poster]);
  // Shot k (from 0) is on screen from the middle of the dissolve that brings it in.
  const segments = have.map((s, k) => ({ t: +(k === 0 ? 0 : k * (L - D) - D / 2).toFixed(2), cat: s.cat, shot: s.name }));
  fs.writeFileSync(path.join(HERE, 'segments.json'), JSON.stringify({ duration: +S.toFixed(2), segments }, null, 2) + '\n');
  state.edit = { out: path.relative(HERE, out).replace(/\\/g, '/'), ...probe(out), bytes: fs.statSync(out).size, L, D, at: new Date().toISOString() };
  save();
  log('edit done', JSON.stringify(state.edit));
}

// ---------- run ----------
if (REDO) {
  const s = SHOTS.find((x) => x.name === REDO);
  if (!s) throw new Error(`--redo ${REDO}: unknown shot`);
  if (STAGE === 'keys') { reject(path.join(KEYS, `${s.name}.jpg`), 'key', s.name); reject(path.join(CLIPS, `${s.name}.mp4`), 'clip', s.name); }
  if (STAGE === 'video') reject(path.join(CLIPS, `${s.name}.mp4`), 'clip', s.name);
}
if (STAGE === 'keys') await pool(SHOTS, 3, key);
else if (STAGE === 'crop') SHOTS.forEach(crop); // re-cut every keyframe from its raw render after editing CROPX
else if (STAGE === 'ab') await Promise.allSettled([clip(SHOTS[0], 'seedance', '.seedance'), clip(SHOTS[0], 'kling', '.kling')]).then((r) => r.forEach((x) => x.status === 'rejected' && log('ab failed:', x.reason.message)));
else if (STAGE === 'video') {
  const only = flag('--shots') ? flag('--shots').split(',') : null; // e.g. --shots cob-light,softbox
  await Promise.allSettled((only ? SHOTS.filter((s) => only.includes(s.name)) : SHOTS).map((s) => clip(s, ENGINE)))
    .then((r) => r.forEach((x) => x.status === 'rejected' && log('clip failed:', x.reason.message)));
}
else if (STAGE === 'edit') edit();
else throw new Error('--stage keys | ab | video | edit');
log('stage done', STAGE);
