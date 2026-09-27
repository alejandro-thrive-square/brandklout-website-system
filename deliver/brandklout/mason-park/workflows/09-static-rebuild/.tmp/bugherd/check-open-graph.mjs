// Gate for the share cards and SEO head (2026-09-25), against one instance. Every row of the
// newest backup for that host plus every article must carry: <meta name="description">,
// og:title, og:description, og:url equal to the page's own address, og:image (absolute, and
// the file answers 200), og:site_name, twitter:card summary_large_image; articles og:type
// article; the image 1200x630 with og:image:width/height, and under 300 KB (WhatsApp drops a
// heavier preview image); a canonical on production (staging runs with canonicals off); a Dentist entity with
// a name and an address in the schema.
//   node bugherd/check-open-graph.mjs https://www.masonparkdental.com > out.txt
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv[2] ?? "").replace(/\/$/, "");
const host = new URL(base).host;
const staging = /staging\./.test(host);
const backup = fs.readdirSync(HERE).filter((f) => f.startsWith(`backup-${host}-`)).sort().pop();
const slugs = JSON.parse(fs.readFileSync(path.join(HERE, backup), "utf8")).pages.map((p) => p.cells.slug).filter((s) => s && s !== "blog-article" && s !== "404");
const articles = JSON.parse(fs.readFileSync(path.join(HERE, "blog", "cms-rows.json"), "utf8")).map((r) => `blog/${r.slug}`);
// The six retired root ad pages only forward; they are checked for a title and nothing else.
const FORWARDERS = new Set(["invisalign", "invisalign-consultation", "invisalign-thank-you", "new-patient-special", "new-patient-special-consultation", "new-patient-thank-you"]);
const targets = [...slugs.map((s) => ({ slug: s, article: false })), ...articles.map((s) => ({ slug: s, article: true }))];
const attr = (h, re) => { const m = h.match(re); return m ? m[1].replace(/&amp;/g, "&") : null; };
const og = (h, p) => attr(h, new RegExp(`<meta property="${p}" content="([^"]*)"`));
const tw = (h, p) => attr(h, new RegExp(`<meta name="${p}" content="([^"]*)"`));
const imgStatus = new Map();
const problems = [];
let n = 0;
const q = [...targets];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (q.length) {
    const { slug, article } = q.shift();
    const pathName = slug === "index" ? "/" : `/${slug}`;
    const h = await (await fetch(base + pathName + (pathName.endsWith("/") ? "" : "/"))).text();
    n++;
    const bad = (m) => problems.push(`${pathName}: ${m}`);
    if (!og(h, "og:title")) bad("no og:title");
    if (FORWARDERS.has(slug)) continue;
    if (!tw(h, "description")) bad("no meta description");
    if (!og(h, "og:description")) bad("no og:description");
    const want = base + (slug === "index" ? "/" : `/${slug}`);
    const url = og(h, "og:url");
    if (url !== want) bad(`og:url ${url} (want ${want})`);
    const img = og(h, "og:image");
    if (!img || !/^https:\/\//.test(img)) bad(`og:image ${img}`);
    else {
      if (!imgStatus.has(img)) imgStatus.set(img, fetch(img).then(async (r) => ({ status: r.status, bytes: (await r.arrayBuffer()).byteLength })).catch(() => ({ status: 0, bytes: 0 })));
      const st = await imgStatus.get(img);
      if (st.status !== 200) bad(`og:image answers ${st.status}`);
      else if (st.bytes > 300_000) bad(`og:image is ${Math.round(st.bytes / 1024)} KB (over 300 KB)`);
      if (og(h, "og:image:width") !== "1200" || og(h, "og:image:height") !== "630") bad(`og:image ${og(h, "og:image:width")}x${og(h, "og:image:height")}, want 1200x630 with size tags`);
    }
    if (!og(h, "og:site_name")) bad("no og:site_name");
    if (tw(h, "twitter:card") !== "summary_large_image") bad(`twitter:card ${tw(h, "twitter:card")}`);
    if (article && og(h, "og:type") !== "article") bad(`og:type ${og(h, "og:type")}`);
    const canon = attr(h, /<link rel="canonical" href="([^"]*)"/);
    if (!staging && canon !== want) bad(`canonical ${canon}`);
    if (staging && canon) bad(`staging emits a canonical (${canon})`);
    if (!/"@type":\s*"Dentist"[\s\S]*?"name":\s*"Mason Park Dental of Katy"[\s\S]*?"streetAddress"/.test(h)) bad("schema Dentist has no name/address");
  }
}));
console.log(`${base}: ${n} URLs, ${imgStatus.size} distinct share images, ${problems.length} problem(s)`);
for (const p of problems) console.log("  " + p);
process.exitCode = problems.length ? 1 : 0;
