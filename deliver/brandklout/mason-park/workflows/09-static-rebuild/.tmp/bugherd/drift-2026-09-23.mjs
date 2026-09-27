// Does the local source still match staging? For every page an open note is
// on, list the photographs in document order, locally and live, reduced to
// their album key (mp-<key>), and print the pages where the two differ.
//
//   node drift-2026-09-23.mjs > drift-2026-09-23.log
import fs from "node:fs";

const R = JSON.parse(fs.readFileSync("resolve-2026-09-23.json", "utf8"));
const pages = [...new Set(R.map((r) => r.page))];
const key = (src) => {
  const b = src.split("/").pop().split("?")[0];
  const m = b.match(/mp-(.+?)-\d+x\d+(?:-w\d+)?\.(?:jpe?g|png|webp)$/);
  return m ? m[1] : b.replace(/^[A-Za-z0-9_-]{21}-/, "");
};
const imgs = (html) => [...html.matchAll(/<img\b[^>]*?\ssrc="([^"]+)"/g)].map((m) => key(m[1])).filter((k) => !/logo|icon|seal|\.svg/.test(k));
let bad = 0;
for (const p of pages) {
  const local = fs.readFileSync(`../../home${p}index.html`, "utf8");
  const res = await fetch(`https://staging.masonparkdental.com${p.replace(/\/$/, "") || "/"}`);
  const live = await res.text();
  const a = imgs(local), b = imgs(live);
  const same = a.join(" ") === b.join(" ");
  if (!same) bad++;
  console.log(`${same ? "same " : "DIFF "} ${res.status} ${p}  local ${a.length} live ${b.length}`);
  if (!same) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) console.log(`   ${i}: local ${a[i]} | live ${b[i]}`);
  }
}
console.log(`${bad} of ${pages.length} pages differ`);
