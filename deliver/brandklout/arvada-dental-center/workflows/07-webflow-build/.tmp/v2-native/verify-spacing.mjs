#!/usr/bin/env node
/**
 * verify-spacing.mjs — compare COMPUTED spacing between the local source and
 * the published Webflow page, element for element.
 *
 * `verify-v2.mjs` proves the copy and the class names travelled. It cannot see
 * whether a class actually carries the same padding on both sides — a class
 * can be applied by name and still resolve differently, because Webflow's own
 * normalize is in the cascade, because a value was stored in a form the panel
 * mangled, or because a rule landed on the wrong breakpoint.
 *
 * Pairs elements by a depth-first walk over both DOMs. The markup is the same
 * file, so the walks line up; a length mismatch is itself the finding.
 *
 *   node verify-spacing.mjs <page-dir> <slug> [widths]
 *   node verify-spacing.mjs --all [widths]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '../../../04-design/.tmp/v2');
const STAGING = 'https://arvadadentalcenter.webflow.io';

const PAGES = {
  implants: 'dental-implants-ads-landing',
  aox: 'all-on-x-ads-landing',
  veneers: 'porcelain-veneers-ads-landing',
  emergency: 'emergency-dentist-ads-landing',
  'dentist-near-me': 'dentist-near-me-ads-landing',
  'next-door': 'next-door-family-ads-landing',
  'implants-consult': 'dental-implants-consult',
  'aox-consult': 'all-on-x-full-arch-consult',
  'veneers-consult': 'porcelain-veneers-consult',
  'emergency-consult': 'emergency-dentist-consult',
  'dentist-near-me-consult': 'dentist-near-me-consult',
  'next-door-consult': 'next-door-family-consult',
  'implants-ty': 'dental-implant-thank-you',
  'aox-ty': 'all-on-x-thank-you',
  'veneers-ty': 'porcelain-veneers-thank-you',
  'emergency-ty': 'emergency-dentist-thank-you',
  'dentist-near-me-ty': 'dentist-near-me-thank-you',
  'next-door-ty': 'next-door-family-thank-you',
};

const args = process.argv.slice(2);
const all = args.includes('--all');
const widths = (args.find((a) => /^\d+(,\d+)*$/.test(a)) || '1440,767').split(',').map(Number);
const targets = all ? Object.keys(PAGES) : [args[0]];

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p));

const userDir = path.join(os.tmpdir(), 'wz-space-' + process.pid);
const port = 9500 + (process.pid % 300);
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`,
  '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let nextId = 1;
function rpc(ws, method, params, sessionId) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id !== id) return;
      ws.removeEventListener('message', onMsg);
      m.error ? reject(new Error(method + ': ' + m.error.message)) : resolve(m.result);
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

/** Collect class chain + computed spacing for every classed element, in document order. */
const PROBE = `(() => {
  const P = ['margin-top','margin-right','margin-bottom','margin-left',
             'padding-top','padding-right','padding-bottom','padding-left',
             'row-gap','column-gap'];
  // Anchor on the page wrapper. The live document also carries Webflow's
  // wf-*-active webfont classes on <html> and the site-wide accessibility
  // widget, neither of which exists locally — without this the walk desyncs at
  // element 0 and every comparison after it is noise.
  const root = document.querySelector('.camp_page');
  if (!root) return JSON.stringify([]);
  const out = [];
  for (const el of [root, ...root.querySelectorAll('[class]')]) {
    // De-duplicate. Webflow keeps a literal class attribute on a DOM element
    // (<details>/<summary>) AND applies the same class as a styleName, so the
    // published HTML carries it twice — visually identical, but it desyncs a
    // name-based walk. Cosmetic in the output, not a defect.
    const cls = [...new Set((el.getAttribute('class') || '').split(/\\s+/)
      .filter(c => c && !/^wf?-/.test(c)))].join('.');
    if (!cls) continue;
    const cs = getComputedStyle(el);
    const rec = { c: cls, t: el.tagName };
    for (const p of P) {
      const v = cs.getPropertyValue(p);
      if (v && v !== '0px' && v !== 'normal') rec[p] = v;
    }
    out.push(rec);
  }
  return JSON.stringify(out);
})()`;

/**
 * `class|property` pairs the stylesheets declare as `auto`. Derived from the
 * CSS rather than hardcoded, so adding another auto margin does not silently
 * start producing noise.
 */
const AUTO_MARGINS = new Set();
for (const f of ['camp.css', 'camp-convert.css']) {
  const css = fs.readFileSync(path.join(V2, '_shared', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/\.([\w-]+)[^{}]*\{([^{}]*)\}/g)) {
    for (const d of m[2].split(';')) {
      const mm = d.match(/^\s*(margin-(?:top|right|bottom|left))\s*:\s*auto\s*$/);
      if (mm) AUTO_MARGINS.add(`${m[1]}|${mm[1]}`);
    }
  }
}

let totalProblems = 0;

try {
  let wsUrl;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; }
    } catch { /* not up */ }
    await sleep(250);
  }
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  const { targetId } = await rpc(ws, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await rpc(ws, 'Target.attachToTarget', { targetId, flatten: true });
  await rpc(ws, 'Page.enable', {}, sessionId);

  async function probe(url, width) {
    await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width <= 767 }, sessionId);
    await rpc(ws, 'Page.navigate', { url }, sessionId);
    await sleep(url.startsWith('file') ? 2500 : 9000);
    // A probe that finds no .camp_page has not loaded — retry once rather than
    // reporting 0 elements, which reads as a huge difference and is really a
    // slow page.
    for (let tries = 0; tries < 3; tries++) {
      const seen = await rpc(ws, 'Runtime.evaluate',
        { expression: 'document.querySelectorAll(".camp_page").length', returnByValue: true }, sessionId);
      if (seen?.result?.value) break;
      await sleep(6000);
    }
    const r = await rpc(ws, 'Runtime.evaluate', { expression: PROBE, returnByValue: true }, sessionId);
    if (typeof r?.result?.value !== 'string') throw new Error('probe returned nothing for ' + url);
    return JSON.parse(r.result.value);
  }

  for (const page of targets) {
    const localUrl = 'file:///' + path.join(V2, page, 'index.html').replace(/\\/g, '/');
    const liveUrl = `${STAGING}/${PAGES[page]}`;

    for (const w of widths) {
      const local = await probe(localUrl, w);
      const live = await probe(liveUrl, w);

      const problems = [];
      if (local.length !== live.length) {
        problems.push(`element count differs: local ${local.length}, live ${live.length}`);
      }
      const n = Math.min(local.length, live.length);
      const byClass = new Map();
      for (let i = 0; i < n; i++) {
        const a = local[i], b = live[i];
        if (a.c !== b.c) { problems.push(`walk desynced at #${i}: local .${a.c} vs live .${b.c}`); break; }
        for (const p of Object.keys({ ...a, ...b })) {
          if (p === 'c' || p === 't') continue;
          const av = a[p] || '0px', bv = b[p] || '0px';
          if (av === bv) continue;
          const d = Math.abs(parseFloat(av) - parseFloat(bv));
          if (d < 0.5) continue;                      // sub-pixel rounding
          // A resolved `auto` margin is a consequence of content height, not a
          // spacing declaration — `.camp_review_name` uses margin-top:auto to
          // pin itself to the bottom of a flex card, so its computed value
          // tracks how the copy wraps. Comparing it measures text metrics, not
          // spacing, and it can never agree exactly.
          if (AUTO_MARGINS.has(`${a.c.split('.').pop()}|${p}`)) continue;
          const key = `.${a.c} ${p}`;
          if (!byClass.has(key)) byClass.set(key, { local: av, live: bv, n: 0 });
          byClass.get(key).n++;
        }
      }
      for (const [k, v] of byClass) problems.push(`${k}: local ${v.local} vs live ${v.live} (${v.n} element${v.n > 1 ? 's' : ''})`);

      totalProblems += problems.length;
      console.log(`${problems.length ? 'DIFF' : 'ok  '} ${page.padEnd(24)} @${String(w).padEnd(5)} ${n} elements`);
      for (const p of problems.slice(0, 8)) console.log('        ' + p);
      if (problems.length > 8) console.log(`        …and ${problems.length - 8} more`);
    }
  }
} finally {
  chrome.kill();
}

console.log(`\n${totalProblems === 0 ? 'No spacing differences.' : totalProblems + ' spacing difference(s) found.'}`);
process.exit(totalProblems ? 1 : 0);
