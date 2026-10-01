// Compare two snapshot-site.mjs folders for round seven (2026-10-01).
//   node bugherd/r7/compare.mjs <before-dir> <after-dir>
//
// 1. Every <img> must carry exactly one alt in AFTER, and image by image it must equal the FIRST
//    alt the same <img> carried in BEFORE (the one browsers used), except where the media asset's
//    alt is the file's most used one (a different phrasing of the same file), which is listed.
// 2. With every <img> alt removed, the CSP meta, the userStyles/script bundle names and any
//    reference to mason-park-lp.css normalised, every page except the six ad pages must be
//    byte-identical.
import fs from "node:fs";
import path from "node:path";

const [before, after] = process.argv.slice(2);
const AD = /^ads-landing-pages__/;
const imgs = (s) => [...s.matchAll(/<img\b[^>]*>/g)].map((m) => ({ src: (m[0].match(/\ssrc="([^"]*)"/) || [])[1], alts: [...m[0].matchAll(/\salt="([^"]*)"/g)].map((x) => x[1]) }));
const strip = (s) => s
  .replace(/<img\b[^>]*>/g, (t) => t.replace(/\salt="[^"]*"/g, ""))
  .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g, "<meta CSP>")
  .replace(/\/_instatic\/(css|js)\/[A-Za-z]+-[0-9a-f]+\.(css|js)/g, "/_instatic/$1/BUNDLE.$2")
  .replace(/\/_instatic\/[^"]*mason-park-lp[^"]*/g, "LP");

let pages = 0, images = 0, dup = 0, changedAlt = 0, same = 0;
const diffs = [], altChanges = new Map(), bad = [];
for (const f of fs.readdirSync(after)) {
  if (!fs.existsSync(path.join(before, f))) { bad.push(`${f}: not in before`); continue; }
  pages++;
  const a = fs.readFileSync(path.join(after, f), "utf8"), b = fs.readFileSync(path.join(before, f), "utf8");
  const ia = imgs(a), ib = imgs(b);
  for (const x of ia) { images++; if (x.alts.length !== 1) dup++; }
  if (!AD.test(f)) {
    if (ia.length !== ib.length) bad.push(`${f}: ${ib.length} -> ${ia.length} images`);
    else ia.forEach((x, i) => {
      if (x.alts[0] !== ib[i].alts[0]) { changedAlt++; const k = `${JSON.stringify(ib[i].alts[0])} -> ${JSON.stringify(x.alts[0])}`; altChanges.set(k, (altChanges.get(k) ?? 0) + 1); }
    });
    if (strip(a) === strip(b)) same++; else diffs.push(f);
  }
}
console.log(`${pages} pages, ${images} <img>, ${dup} without exactly one alt`);
console.log(`non-ad pages identical once alts/CSP/bundles are set aside: ${same}; differ: ${diffs.join(", ") || "none"}`);
console.log(`alts that changed value on non-ad pages: ${changedAlt}`);
for (const [k, n] of altChanges) console.log(`  x${n} ${k}`);
if (bad.length) console.log(`problems:\n  ${bad.join("\n  ")}`);
process.exitCode = dup || diffs.length || bad.length ? 1 : 0;
