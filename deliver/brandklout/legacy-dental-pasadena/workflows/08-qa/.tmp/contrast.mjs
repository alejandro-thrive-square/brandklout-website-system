#!/usr/bin/env node
/**
 * contrast.mjs — measure text contrast on the rendered funnel.
 *
 *   node contrast.mjs [page ...]            default: all three
 *   node contrast.mjs --live                the published staging pages
 *
 * WHY THIS EXISTS. Re-theming a campaign layer from one brand to another moves
 * colours between roles, and the failure it produces is specifically invisible
 * to the person doing it: the page still renders, nothing errors, and the only
 * symptom is a line of type you have to hunt for. On this build the same bug
 * appeared three times before anyone wrote this file —
 *
 *   .camp_offer-card_kicker   olive on deep olive   1.46:1
 *   .camp_form-card_kicker    olive on deep olive   1.46:1
 *   .camp_ty_mark             olive on deep olive   1.46:1
 *
 * and twice more as a template using the wrong ground variant: the thank-you
 * eyebrow carried `is-on-dark` on a cream section, and the provider eyebrow
 * carried the light-ground variant on a dark one.
 *
 * The measurement is done in the page, on COMPUTED styles, because that is the
 * only place the real answer lives. A class's declared colour tells you nothing
 * about the ground it actually lands on, which is decided by an ancestor that
 * may be three levels up and may itself be a combo.
 *
 * Thresholds are WCAG AA: 4.5:1 for body text, 3:1 for large text (>=24px, or
 * >=18.66px when bold).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp/v1');
const LIVE = process.argv.includes('--live');
const STAGING = 'https://legacy-dental.webflow.io/';
const LIVE_SLUG = {
  invisalign: 'new-invisalign-pasadena',
  'invisalign-consult': 'new-invisalign-consultation',
  'invisalign-ty': 'new-invisalign-thank-you',
};
const ARGS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const PAGES = ARGS.length ? ARGS : ['invisalign', 'invisalign-consult', 'invisalign-ty'];

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9400 + (process.pid % 500);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(join(HERE, '.chrome-contrast'), { recursive: true });
const proc = spawn(CHROME, [`--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + join(HERE, '.chrome-contrast'), '--headless=new',
  '--allow-file-access-from-files', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

/* Windows: child.kill() reaps the launcher and leaves the renderer and GPU
   processes holding the debug port, so the NEXT run reports "chrome did not
   come up". Kill the tree. */
const kill = () => {
  try {
    if (process.platform === 'win32') spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
    else process.kill(-proc.pid, 'SIGKILL');
  } catch { /* already gone */ }
};
process.on('exit', kill);
process.on('SIGINT', () => { kill(); process.exit(130); });

let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await wait(250);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    wsUrl = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl;
  } catch { /* not up yet */ }
}
if (!wsUrl) { console.log('chrome did not come up'); process.exit(1); }

const sock = new WebSocket(wsUrl);
await new Promise((r) => { sock.onopen = r; });
let id = 0; const pending = new Map();
sock.onmessage = (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params) => new Promise((r) => { const n = ++id; pending.set(n, r); sock.send(JSON.stringify({ id: n, method, params })); });
await send('Page.enable');
await send('Runtime.enable');

const PROBE = `(() => {
  const lum = (c) => {
    const s = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };
  const parse = (s) => {
    const m = (s || '').match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  };
  // Composite a colour with alpha over what is behind it.
  const over = (fg, bg) => fg.rgb.map((v, i) => v * fg.a + bg[i] * (1 - fg.a));
  /* The ground is whatever the nearest ancestor paints. Walk up through every
     transparent one, compositing as we go, because a 0.9-alpha panel over a
     photo is not the panel's colour. */
  const groundOf = (el) => {
    let node = el, stack = [];
    while (node && node !== document.documentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) { stack.push(bg); if (bg.a >= 1) break; }
      node = node.parentElement;
    }
    let base = [255, 255, 255];
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };

  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    // Only elements that paint text of their own.
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const ground = groundOf(el);
    /* Text over a background IMAGE cannot be judged from colour alone — the
       hero gradient and the film posters both sit under type. Report them
       separately rather than passing or failing them on a wrong premise. */
    let overImage = false;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (getComputedStyle(n).backgroundImage !== 'none') { overImage = true; break; }
      const b = parse(getComputedStyle(n).backgroundColor);
      if (b && b.a >= 1) break;
    }
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    out.push({
      cls: el.className && typeof el.className === 'string' ? el.className : el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0, 42),
      ratio: Math.round(ratio(over(fg, ground), ground) * 100) / 100,
      need: large ? 3 : 4.5,
      size, weight, overImage,
    });
  }
  return JSON.stringify(out);
})()`;

let failures = 0, checked = 0, overImage = 0;
for (const page of PAGES) {
  const url = LIVE ? STAGING + LIVE_SLUG[page] : pathToFileURL(join(DESIGN, page, 'index.html')).href;
  await send('Page.navigate', { url });
  await wait(4500);
  const res = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
  const rows = JSON.parse(res.result?.result?.value || '[]');
  if (!rows.length) { console.log(`${page}: probe returned nothing — treating as a FAILURE, not a pass`); failures++; continue; }

  // One row per distinct class+ratio; the same class repeats dozens of times.
  const worst = new Map();
  for (const r of rows) {
    const k = r.cls + '|' + r.ratio;
    if (!worst.has(k)) worst.set(k, r);
  }
  const bad = [...worst.values()].filter((r) => r.ratio < r.need && !r.overImage).sort((a, b) => a.ratio - b.ratio);
  const img = [...worst.values()].filter((r) => r.overImage && r.ratio < r.need);
  checked += rows.length; overImage += img.length;

  console.log(`\n${page}: ${rows.length} text element(s), ${worst.size} distinct`);
  for (const r of bad) {
    console.log(`  FAIL ${String(r.ratio).padStart(5)}:1 (needs ${r.need})  .${r.cls}\n        "${r.text}"  ${r.size}px/${r.weight}`);
    failures++;
  }
  for (const r of img) console.log(`  over an image, judge by eye: .${r.cls}  ${r.ratio}:1  "${r.text}"`);
  if (!bad.length) console.log('  every text element on a solid ground meets AA');
}

console.log(`\n${checked} element(s) measured, ${failures} failure(s), ${overImage} over an image`);
kill();
process.exit(failures ? 1 : 0);
