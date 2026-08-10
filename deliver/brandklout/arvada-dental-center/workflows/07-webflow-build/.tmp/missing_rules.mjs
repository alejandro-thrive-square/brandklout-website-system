#!/usr/bin/env node
/**
 * missing_rules.mjs — which journey.css kit rules are absent from a published
 * page AND actually match something on it?
 *
 * cssdiff.mjs lists everything the published CSS lacks, but most of that is
 * the packager tree-shaking rules the page never uses — correct behaviour, not
 * a defect. The interesting set is much smaller: rules whose selector DOES
 * match an element on the published page. Those are styles the design applies
 * and the published page does not.
 *
 *   node missing_rules.mjs <design-dir> <staging-slug> <prefix>
 *
 * Writes missing-<page>.json.
 */
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [page, slug, prefix] = process.argv.slice(2);
const DESIGN = join(HERE, '../../04-design/.tmp');
const kit = readFileSync(join(DESIGN, '_shared', 'journey.css'), 'utf8');
const stagingHtml = readFileSync(join(HERE, 'staging', `${slug}.html`), 'utf8');

/**
 * Published page: selector -> the set of PROPERTY NAMES it declares.
 *
 * Keying on the selector alone is not enough. `.checks li` exists on the
 * published page as the chapter's `{color:#4a3418}`, while the kit's
 * `{display:grid;grid-template-columns:auto 1fr;gap;align-items;font-size}`
 * was dropped — so a selector-only check calls it present and the icon column
 * silently collapses. Coverage is per property.
 */
function publishedProps() {
  const map = new Map();
  for (const m of stagingHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    const flat = m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/@(scope|media|supports|layer)[^{]*\{/g, '');
    for (const r of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = r[1].trim().replace(/:scope\s*/g, '').replace(/\s+/g, ' ');
      if (!sel || sel.startsWith('@')) continue;
      if (!map.has(sel)) map.set(sel, new Set());
      for (const d of r[2].split(';')) {
        const p = d.split(':')[0]?.trim().toLowerCase();
        if (p) map.get(sel).add(p);
      }
    }
  }
  return map;
}

const propNames = (body) => body.split(';')
  .map((d) => d.split(':')[0]?.trim().toLowerCase()).filter(Boolean);

/**
 * Parse the kit into top-level rules, remembering the @media wrapper each one
 * sits in so a restored rule keeps its breakpoint.
 */
function kitRules(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  let i = 0, media = null, depth = 0;
  while (i < clean.length) {
    const brace = clean.indexOf('{', i);
    if (brace < 0) break;
    const head = clean.slice(i, brace).trim();
    if (head.startsWith('@')) {
      // enter an at-rule block
      if (/^@(media|supports|layer)/.test(head)) { media = head; depth++; i = brace + 1; continue; }
      // skip @keyframes / @font-face wholesale
      let d = 1, j = brace + 1;
      while (j < clean.length && d > 0) { if (clean[j] === '{') d++; else if (clean[j] === '}') d--; j++; }
      i = j; continue;
    }
    const close = clean.indexOf('}', brace);
    if (close < 0) break;
    const body = clean.slice(brace + 1, close).trim();
    if (head) out.push({ sel: head.replace(/\s+/g, ' '), body: body.replace(/\s+/g, ' '), media });
    i = close + 1;
    // leave the media block when we hit its closing brace
    while (depth > 0 && clean.slice(i).trimStart().startsWith('}')) {
      i = clean.indexOf('}', i) + 1; depth--; media = null;
    }
  }
  return out;
}

/** Map a design selector into the published page's namespace. */
const mapSel = (sel) => sel
  .replace(/\.([A-Za-z_][\w-]*)/g, `.${prefix}-$1`)
  .replace(/#([A-Za-z_][\w-]*)/g, `#${prefix}-$1`);

const published = publishedProps();
const rules = kitRules(kit).filter((r) => r.body && !/^(:root|html|body)/.test(r.sel));
const candidates = rules
  .map((r) => ({ ...r, mapped: mapSel(r.sel).replace(/\s+/g, ' ') }))
  .filter((r) => {
    const have = published.get(r.mapped) || published.get(r.sel);
    if (!have) return true;
    // Present only if EVERY property the kit rule declares is already declared
    // for that selector on the published page.
    return propNames(r.body).some((p) => !have.has(p));
  });

// Now ask a real browser which of those actually match something.
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, '.chrome-missing'), '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (me, p = {}, s) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId);
await send('Page.navigate', { url: `https://arvadadentalcenter.webflow.io/${slug}` }, sessionId);
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
await wait(1200);

const counts = await ev(`(function(){var S=${JSON.stringify(candidates.map((c) => c.mapped))};
  return S.map(function(s){ try { return document.querySelectorAll(s).length } catch(e){ return -1 } });})()`);

const hits = candidates.map((c, i) => ({ ...c, n: counts[i] })).filter((c) => c.n > 0);
writeFileSync(join(HERE, `missing-${page}.json`), JSON.stringify(hits, null, 1));
console.log(`kit rules ${rules.length}  absent from published ${candidates.length}  AND matching the page: ${hits.length}\n`);
for (const h of hits) console.log(`  [${String(h.n).padStart(3)}] ${h.mapped.slice(0, 80)}${h.media ? '   ' + h.media : ''}\n        { ${h.body.slice(0, 110)} }`);
try { await send('Browser.close'); } catch {}
proc.kill();
