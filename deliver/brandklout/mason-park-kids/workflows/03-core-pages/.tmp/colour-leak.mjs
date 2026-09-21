// BugHerd #33 generalised: a single-class rule that sets `color` loses to a
// contextual rule like `.ch p` (0,1,1 beats 0,1,0), so the element paints an ink
// its own rule never asked for. That is how the sticker ended up dark slate on
// copper. Walk every page and report every element whose winning `color` comes
// from a rule OTHER than the one its own class declares, with the contrast it
// actually has against its own background.
//
//   node colour-leak.mjs             # every class, on the first page that uses it
//   node colour-leak.mjs --all       # every class on every page (slow: ~215 loads)
//   node colour-leak.mjs index.html contacts/index.html
//
// The default is NOT a hard-coded page list. One stylesheet dresses all 215
// pages, so the thing that must be covered is every class the sheet colours,
// not every page: the script greps home/ for the first page carrying each one
// and visits only those. `--all` is there for when the question is per page.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, '..', 'home');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name === 'index.html' ? [path.join(dir, e.name)] : []
  );

const args = process.argv.slice(2).filter((a) => a !== '--all');
const ALL = process.argv.includes('--all');

const lum = (r, g, b) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const [x, y] = [lum(...a), lum(...b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);

// Single-class rules that declare `color`, read from the stylesheet on disk.
// Comments go first: one of them contains a brace and derails the block match.
const CSS = fs.readFileSync(path.join(SITE, 'assets', 'site.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const DECLARING = [...new Set(
  [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => /(^|;)\s*color\s*:/.test(m[2]))
    .map((m) => m[1].trim().split(/\n/).pop().trim())
    .filter((sel) => /^\.[a-z0-9_-]+$/i.test(sel))
    .map((sel) => sel.slice(1))
)];
console.log(`${DECLARING.length} single-class rules declare color`);

// The smallest set of pages that between them carry every one of those classes.
const everyPage = walk(SITE);
let pages;
if (args.length) {
  pages = args.map((a) => path.join(SITE, a));
} else if (ALL) {
  pages = everyPage;
} else {
  const need = new Set(DECLARING);
  const chosen = new Set([path.join(SITE, 'index.html')]);
  const has = (src, cls) => new RegExp(`class="[^"]*\\b${cls.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')}\\b`).test(src);
  const home = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  for (const c of [...need]) if (has(home, c)) need.delete(c);
  for (const f of everyPage) {
    if (!need.size) break;
    const src = fs.readFileSync(f, 'utf8');
    let used = false;
    for (const c of [...need]) if (has(src, c)) { need.delete(c); used = true; }
    if (used) chosen.add(f);
  }
  pages = [...chosen];
  console.log(`${pages.length} page(s) cover them all${need.size ? `; ${need.size} class(es) are in the sheet but on no page: ${[...need].join(', ')}` : ''}`);
}
console.log('');

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send('DOM.enable');
await cdp.send('CSS.enable');

const hits = new Map();
for (const file of pages) {
  await page.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(600);

  // candidates: elements whose class list names a rule that declares `color`.
  // The class list comes from the stylesheet ON DISK: Chrome refuses cssRules on a
  // file:// stylesheet, so reading it in the page returns nothing at all.
  const ids = await page.evaluate((declaringArr) => {
    const declaring = new Set(declaringArr);
    const out = [];
    document.querySelectorAll('[class]').forEach((el, i) => {
      for (const c of el.classList) if (declaring.has(c)) { el.setAttribute('data-leak-probe', String(i)); out.push({ i, cls: c, tag: el.tagName.toLowerCase() }); break; }
    });
    return out;
  }, DECLARING);

  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  for (const cand of ids) {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-leak-probe="${cand.i}"]` });
    if (!nodeId) continue;
    const m = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
    const setters = (m.matchedCSSRules || []).filter((r) => r.rule.style.cssProperties.some((p) => p.name === 'color' && !p.disabled));
    if (setters.length < 2) continue;
    const winner = setters[setters.length - 1].rule.selectorList.text;   // CDP orders weakest first
    if (winner === `.${cand.cls}`) continue;
    const seen = await page.evaluate((i) => {
      const el = document.querySelector(`[data-leak-probe="${i}"]`);
      const cs = getComputedStyle(el);
      // Walk up for the ground this text actually sits on. If anything on the
      // way paints a picture, or the element is fixed over whatever scrolls
      // under it, there is no single colour to measure: the masthead is
      // transparent over the hero photograph, and pretending its ground is the
      // page's white made three links read 1.00:1 on every page.
      // What is actually BEHIND this text? Ask the document, not the ancestor
      // chain. The transparent sticky masthead sits over the hero PHOTOGRAPH,
      // which is an <img> -- no ancestor carries a url(), so walking up for a
      // colour lands on the page white and calls three white links 1.00:1 on
      // every page. Meanwhile `.ft-side` is sticky too and sits over a flat
      // chapter ground, which is perfectly measurable. Hit-testing tells the
      // two apart; a rule about `position` cannot.
      const r = el.getBoundingClientRect();
      const px = Math.round(r.left + r.width / 2), py = Math.round(r.top + r.height / 2);
      let overImage = false;
      if (r.width && r.height && px >= 0 && py >= 0 && px < innerWidth && py < innerHeight) {
        for (const under of document.elementsFromPoint(px, py)) {
          if (under === el || el.contains(under)) continue;
          const us = getComputedStyle(under);
          if (under.tagName === 'IMG' || under.tagName === 'VIDEO' || under.tagName === 'CANVAS') { overImage = true; break; }
          if (/url\(/.test(us.backgroundImage)) { overImage = true; break; }
          if (us.backgroundColor !== 'rgba(0, 0, 0, 0)' && us.backgroundColor !== 'transparent') break;
        }
      }
      let bgEl = el, bg = cs.backgroundColor;
      while (bgEl && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
        bgEl = bgEl.parentElement;
        bg = bgEl ? getComputedStyle(bgEl).backgroundColor : 'rgb(255, 255, 255)';
      }
      return { color: cs.color, bg, overImage, text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), size: cs.fontSize };
    }, cand.i);
    const cr = seen.overImage ? NaN : ratio(rgb(seen.color), rgb(seen.bg));
    const key = `${cand.cls}|${winner}`;
    if (!hits.has(key)) hits.set(key, { ...cand, winner, ...seen, contrast: cr, pages: [] });
    hits.get(key).pages.push(path.relative(SITE, file).replace(/\\/g, '/'));
  }
}
await browser.close();

const rows = [...hits.values()].sort((a, b) => (Number.isNaN(a.contrast) ? 99 : a.contrast) - (Number.isNaN(b.contrast) ? 99 : b.contrast));
console.log(`scanned ${pages.length} page(s), ${rows.length} leaking class rule(s)\n`);
for (const r of rows) {
  const unknown = Number.isNaN(r.contrast);
  const flag = unknown ? 'over ' : r.contrast < 4.5 ? (r.contrast < 3 ? 'FAIL ' : 'warn ') : 'ok   ';
  console.log(`${flag}.${r.cls}  ->  won by "${r.winner}"`);
  console.log(unknown
    ? `      color ${r.color} over a picture or a fixed layer: no single ground, not measured`
    : `      color ${r.color} on ${r.bg} = ${r.contrast.toFixed(2)}:1 @ ${r.size}`);
  console.log(`      "${r.text}"`);
  console.log(`      ${r.pages.length} page(s), e.g. ${[...new Set(r.pages)].slice(0, 3).join(', ')}\n`);
}
const fails = rows.filter((r) => r.contrast < 4.5);
const unmeasured = rows.filter((r) => Number.isNaN(r.contrast)).length;
console.log(fails.length ? `${fails.length} below 4.5:1` : 'nothing below 4.5:1');
if (unmeasured) console.log(`${unmeasured} not measured (text over a picture or a fixed layer) - judge those by eye`);
process.exitCode = fails.length ? 1 : 0;
