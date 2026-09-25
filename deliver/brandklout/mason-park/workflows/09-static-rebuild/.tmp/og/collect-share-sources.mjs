// Which image each page shares today, read from the published HTML of one instance.
//   node og/collect-share-sources.mjs https://www.masonparkdental.com > og/share-sources-<host>.json
import fs from "node:fs";
const base = process.argv[2].replace(/\/$/, "");
const host = new URL(base).host;
const bk = fs.readdirSync(".").filter((f) => f.startsWith(`backup-${host}-`)).sort().pop();
const rows = JSON.parse(fs.readFileSync(bk, "utf8")).pages;
const FORWARDERS = new Set(["invisalign", "invisalign-consultation", "invisalign-thank-you", "new-patient-special", "new-patient-special-consultation", "new-patient-thank-you"]);
const targets = [
  ...rows.map((r) => r.cells.slug).filter((s) => s && !["blog-article", "404"].includes(s) && !FORWARDERS.has(s)).map((s) => ({ key: s, path: s === "index" ? "/" : `/${s}/` })),
  ...JSON.parse(fs.readFileSync("blog/cms-rows.json", "utf8")).map((r) => ({ key: `articles:${r.slug}`, path: `/blog/${r.slug}/` })),
];
const out = {}; const q = [...targets];
const get = (h, p) => (h.match(new RegExp(`<meta property="${p}" content="([^"]*)"`)) || [])[1]?.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
await Promise.all(Array.from({ length: 8 }, async () => { while (q.length) { const t = q.shift(); const h = await (await fetch(base + t.path)).text(); out[t.key] = { image: get(h, "og:image"), alt: get(h, "og:image:alt") ?? "" }; } }));
process.stdout.write(JSON.stringify(out, null, 1));
