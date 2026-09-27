// Compare a LOCAL page with its PUBLISHED counterpart, systematically.
//
//   node diff-live.mjs ../home/index.html https://staging.masonparkdental.com/
//
// The import is lossy in ways that never raise an error, and each one has cost
// this workflow a round trip: the <script> tags (no JavaScript at all), the
// <link> tags (no webfonts), the <body> tag itself (no `has-journey`, so a
// white header). Those were found one at a time, by eye, after the client
// noticed. This looks for the whole class of them at once.
//
// FOUR COMPARISONS
//   1. HEAD          title, description, canonical, og:*, JSON-LD, favicon, lang
//   2. STRUCTURE     every element as tag + classes, in document order
//   3. TEXT          the visible text of <main>, normalised
//   4. GEOMETRY      the box of every element carrying a class, at 1440
//
// Structure is compared as a multiset of "tag.class.class" signatures rather
// than a tree diff: Instatic re-parents things (a base.container wraps where we
// wrote a bare div), so an exact tree diff is all noise, while a missing
// <figcaption> or a <blockquote> that became a <div> shows up immediately.
import { chromium } from "playwright-core";
import { settle } from "./settle.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const [localArg, liveArg] = process.argv.slice(2);
if (!localArg || !liveArg) {
  console.error("usage: node diff-live.mjs <local.html> <https://live/url>");
  process.exit(1);
}
const localUrl = "file:///" + path.resolve(localArg).split(path.sep).join("/");

const HARVEST = () => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const sig = (el) => {
    const cls = [...el.classList].sort().join(".");
    return el.tagName.toLowerCase() + (cls ? "." + cls : "");
  };
  const head = {
    lang: document.documentElement.lang || "",
    title: document.title,
    description: (document.querySelector('meta[name="description"]') || {}).content || "",
    canonical: (document.querySelector('link[rel="canonical"]') || {}).href || "",
    ogTitle: (document.querySelector('meta[property="og:title"]') || {}).content || "",
    ogDescription: (document.querySelector('meta[property="og:description"]') || {}).content || "",
    ogUrl: (document.querySelector('meta[property="og:url"]') || {}).content || "",
    ogType: (document.querySelector('meta[property="og:type"]') || {}).content || "",
    themeColor: (document.querySelector('meta[name="theme-color"]') || {}).content || "",
    favicon: ((document.querySelector('link[rel="icon"]') || {}).href || "").split("/").pop(),
    viewport: (document.querySelector('meta[name="viewport"]') || {}).content || "",
    // The local pages write one flat object per script; the aeo-schema plugin
    // writes a single `@graph` holding several. Reading only the top-level
    // `@type` reported the published graph as "?" on all eleven routes and
    // made a working plugin look like a missing one. Flatten the graph.
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')]
      .flatMap((s) => {
        try {
          const j = JSON.parse(s.textContent);
          const nodes = Array.isArray(j) ? j : Array.isArray(j["@graph"]) ? j["@graph"] : [j];
          return nodes.map((n) => n && n["@type"] ? n["@type"] : "?");
        } catch { return ["UNPARSEABLE"]; }
      })
      .sort(),
  };
  const main = document.querySelector("main") || document.body;
  const structure = [...main.querySelectorAll("*")].map(sig);
  // Semantic tags worth naming individually: these are the ones an HTML->node
  // importer is most likely to flatten into a div.
  const tags = {};
  for (const el of main.querySelectorAll("*")) {
    const t = el.tagName.toLowerCase();
    tags[t] = (tags[t] || 0) + 1;
  }
  const boxes = {};
  for (const el of main.querySelectorAll("[class]")) {
    const s = sig(el);
    const r = el.getBoundingClientRect();
    if (!boxes[s]) boxes[s] = [];
    boxes[s].push({ w: Math.round(r.width), h: Math.round(r.height) });
  }
  // A handful of attributes whose loss is silent and consequential.
  const attrs = {
    imgWithSrcset: main.querySelectorAll("img[srcset]").length,
    imgWithSizes: main.querySelectorAll("img[sizes]").length,
    imgLazy: main.querySelectorAll('img[loading="lazy"]').length,
    dataChapter: main.querySelectorAll("[data-chapter]").length,
    dataSplit: main.querySelectorAll("[data-split]").length,
    dataDrift: main.querySelectorAll("[data-drift]").length,
    dataAnim: main.querySelectorAll("[data-anim]").length,
    dataLabel: main.querySelectorAll("[data-label]").length,
    ariaLabel: main.querySelectorAll("[aria-label]").length,
    ariaHidden: main.querySelectorAll("[aria-hidden]").length,
    roleAttr: main.querySelectorAll("[role]").length,
    details: main.querySelectorAll("details").length,
    summary: main.querySelectorAll("summary").length,
    iframes: main.querySelectorAll("iframe").length,
    iframeDataSrc: main.querySelectorAll("iframe[data-src]").length,
    externalLinks: main.querySelectorAll('a[target="_blank"]').length,
    relNoopener: main.querySelectorAll('a[rel~="noopener"]').length,
    inlineStyle: main.querySelectorAll("[style]").length,
    ids: main.querySelectorAll("[id]").length,
  };
  return { head, structure, tags, boxes, attrs, text: norm(main.innerText) };
};

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const grab = async (url) => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(url, { waitUntil: "load", timeout: 120000 });
  await p.waitForTimeout(2600);
  // Both sides must be photographed AFTER the webfonts resolve, or the
  // geometry section compares one settled page with one mid-swap. See
  // settle.mjs - this is what made the local h1 read as two lines.
  await settle(p);
  const total = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 540) {
    await p.evaluate((n) => window.scrollTo({ top: n, behavior: "instant" }), y);
    await p.waitForTimeout(90);
  }
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await p.waitForTimeout(700);
  const out = await p.evaluate(HARVEST);
  await c.close();
  return out;
};

const L = await grab(localUrl);
const V = await grab(liveArg);
await browser.close();

let diffs = 0;
const say = (msg) => { diffs++; console.log("  DIFF " + msg); };

console.log("local " + localArg + "\nlive  " + liveArg);

console.log("\n-- 1. head --");
for (const k of Object.keys(L.head)) {
  const a = JSON.stringify(L.head[k]), b = JSON.stringify(V.head[k]);
  if (a !== b) say(`${k}\n         local ${a}\n         live  ${b}`);
}
if (!diffs) console.log("  identical");

console.log("\n-- 2. structure (element signatures in <main>) --");
const count = (arr) => arr.reduce((m, s) => m.set(s, (m.get(s) || 0) + 1), new Map());
const cl = count(L.structure), cv = count(V.structure);
const keys = [...new Set([...cl.keys(), ...cv.keys()])].sort();
let structDiffs = 0;
for (const k of keys) {
  const a = cl.get(k) || 0, b = cv.get(k) || 0;
  if (a !== b) { say(`${k.padEnd(46)} local ${a}  live ${b}`); structDiffs++; }
}
console.log(`  ${L.structure.length} elements local, ${V.structure.length} live${structDiffs ? "" : "  - signatures identical"}`);

console.log("\n-- 3. tags in <main> --");
const tk = [...new Set([...Object.keys(L.tags), ...Object.keys(V.tags)])].sort();
for (const t of tk) {
  const a = L.tags[t] || 0, b = V.tags[t] || 0;
  if (a !== b) say(`<${t}>`.padEnd(20) + ` local ${a}  live ${b}`);
}

console.log("\n-- 4. attributes that matter --");
for (const k of Object.keys(L.attrs)) {
  if (L.attrs[k] !== V.attrs[k]) say(`${k.padEnd(20)} local ${L.attrs[k]}  live ${V.attrs[k]}`);
}

console.log("\n-- 5. visible text of <main> --");
if (L.text === V.text) console.log("  identical (" + L.text.length + " chars)");
else {
  const a = L.text, b = V.text;
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  say(`text differs at char ${i} of ${a.length}/${b.length}`);
  console.log("         local ..." + JSON.stringify(a.slice(Math.max(0, i - 60), i + 90)));
  console.log("         live  ..." + JSON.stringify(b.slice(Math.max(0, i - 60), i + 90)));
}

console.log("\n-- 6. geometry (>2px on width or height) --");
let geo = 0;
for (const k of Object.keys(L.boxes)) {
  const a = L.boxes[k], b = V.boxes[k];
  if (!b) continue; // already reported as a structure diff
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (Math.abs(a[i].w - b[i].w) > 2 || Math.abs(a[i].h - b[i].h) > 2) {
      if (geo < 25) say(`${k}[${i}]  local ${a[i].w}x${a[i].h}  live ${b[i].w}x${b[i].h}`);
      geo++;
      break;
    }
  }
}
if (!geo) console.log("  every classed box within 2px");
else console.log(`  ${geo} element(s) differ by more than 2px`);

console.log("\n" + (diffs ? diffs + " difference(s)" : "no differences"));
