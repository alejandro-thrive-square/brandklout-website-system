// Parity diff between two capture sets produced by capture.mjs / capture2.mjs.
// Usage: node diffcap.mjs <baseDirA(reference)> <baseDirB(subject)> <slugA:slugB> [...]
import fs from "node:fs";
import path from "node:path";

const A = process.argv[2], B = process.argv[3];
const PAIRS = process.argv.slice(4).map((p) => p.split(":"));

const rd = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const norm = (s) => s.replace(/\s+/g, " ").trim();

function multiset(arr) {
  const m = new Map();
  for (const t of arr) m.set(t, (m.get(t) || 0) + 1);
  return m;
}
function msDiff(refTexts, subTexts) {
  const r = multiset(refTexts), s = multiset(subTexts);
  const missing = [], added = [];
  for (const [k, n] of r) { const d = n - (s.get(k) || 0); if (d > 0) missing.push([k, d]); }
  for (const [k, n] of s) { const d = n - (r.get(k) || 0); if (d > 0) added.push([k, d]); }
  return { missing, added };
}

const out = [];
for (const [sa, sb] of PAIRS) {
  const da = path.join(A, sa), db = path.join(B, sb);
  const ca = rd(path.join(da, "content.json")), cb = rd(path.join(db, "content.json"));
  const ma = rd(path.join(da, "metrics.json")), mb = rd(path.join(db, "metrics.json"));
  const o = { ref: sa, sub: sb };

  o.title = { ref: ca.title, sub: cb.title };
  o.heights = {};
  for (const w of [1440, 768, 390]) {
    const a = ma.bodyHeight[w], b = mb.bodyHeight[w];
    o.heights[w] = { ref: a, sub: b, delta: b - a, pct: a ? +(((b - a) / a) * 100).toFixed(1) : null };
  }
  o.overflow = mb.overflow ? Object.fromEntries(Object.entries(mb.overflow).map(([w, v]) => [w, {
    scrollWidth: v.scrollWidth, innerWidth: v.innerWidth, ok: v.scrollWidth <= v.innerWidth,
    offenders: (v.offenders || []).slice(0, 6),
  }])) : null;

  o.sections = {
    refCount: ca.sections.length, subCount: cb.sections.length,
    ref: ca.sections.map((s) => ({ h: s.height, head: s.heading, cls: s.class })),
    sub: cb.sections.map((s) => ({ h: s.height, head: s.heading, cls: s.class })),
  };

  const td = msDiff(ca.texts.map(norm), cb.texts.map(norm));
  o.texts = { refCount: ca.texts.length, subCount: cb.texts.length, missing: td.missing, added: td.added };

  o.images = {
    refCount: ca.images.length, subCount: cb.images.length,
    badInSub: cb.images.filter((i) =>
      (i.renderedSize.w === 0 && i.renderedSize.h === 0) ||
      (i.naturalSize && i.naturalSize.w === 0) || i.complete === false)
      .map((i) => ({ src: (i.src || "").slice(-70), alt: i.alt, r: i.renderedSize, n: i.naturalSize })),
    altsSub: cb.images.map((i) => ({ alt: i.alt, r: i.renderedSize, src: (i.src || "").split("/").pop() })),
  };

  const badHref = (h) => !h || h === "#" || h.trim() === "" || /^tel:\d+:/.test(h) || /^(tel|mailto):\s*$/.test(h) || /\{\{/.test(h);
  o.links = {
    refBad: ca.links.filter((l) => badHref(l.href)).map((l) => `${l.text} -> ${l.href}`),
    subBad: cb.links.filter((l) => badHref(l.href)).map((l) => `${l.text} -> ${l.href}`),
    subAll: [...new Set(cb.links.map((l) => l.href))],
  };

  o.forms = {
    ref: ca.forms.map((f) => ({ name: f.name, fields: f.fields.length })),
    sub: cb.forms.map((f) => ({
      name: f.name, action: f.action, rect: f.rect,
      fields: f.fields.map((x) => `${x.tag}/${x.type}/${x.name}${x.required ? "*" : ""} ${x.visibleSize ? x.visibleSize.w + "x" + x.visibleSize.h : ""}`),
    })),
  };
  o.embeds = { ref: ca.embeds, sub: cb.embeds };
  out.push(o);
}
fs.writeFileSync(process.env.DIFF_OUT || "diff-out.json", JSON.stringify(out, null, 2));
console.log("wrote", process.env.DIFF_OUT || "diff-out.json");
