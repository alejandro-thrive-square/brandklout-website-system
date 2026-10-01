// Every published URL of one instance (page rows + the blog articles), normalised and saved, so a
// footer edit can be proven to change nothing but the footer.
//   INSTATIC_BASE_URL=<base> node .tmp/hipaa/snapshot-site.mjs <dir>                 # record
//   INSTATIC_BASE_URL=<base> node .tmp/hipaa/snapshot-site.mjs <dir> --compare <old>  # record, then diff
// --compare strips the inserted footer link (" · <a …/hipaa-disclosure…>HIPAA Disclosure</a>", or
// with " | ") from the new copy and requires the rest to be identical to the old one. It also
// reports, per page, whether the footer link is present.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPages, BASE } from "../insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [dir] = process.argv.slice(2);
const old = process.argv.includes("--compare") ? process.argv[process.argv.indexOf("--compare") + 1] : null;
const { rows } = await getPages();
const slugs = rows.map((r) => r.cells.slug).filter((s) => s && s !== "blog-article" && s !== "404");
const articles = JSON.parse(fs.readFileSync(path.join(HERE, "..", "blog", "cms-rows.json"), "utf8")).map((r) => `blog/${r.slug ?? r.cells?.slug}`);
const urls = [...slugs.map((s) => (s === "index" ? "/" : `/${s}`)), ...articles.map((s) => `/${s}`)];
const norm = (s) => s
  .replace(/\/_instatic\/assets\/[A-Za-z0-9_-]+\//g, "/_instatic/assets/BUILD/")
  .replace(/(\/_instatic\/module-js\/[^"?]+)\?v=\d+/g, "$1?v=N")
  .replace(/email-protection#[0-9a-f]+/g, "email-protection#X")
  .replace(/data-cfemail="[0-9a-f]+"/g, 'data-cfemail="X"');
const file = (u) => (u === "/" ? "_index" : u.slice(1).replaceAll("/", "__")) + ".html";
const LINK = /( · | \| )<a href="\/hipaa-disclosure" target="_self">HIPAA Disclosure<\/a>/g;

fs.mkdirSync(dir, { recursive: true });
const status = {};
const queue = [...urls];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const u = queue.shift();
    const res = await fetch(BASE + u, { headers: { "cache-control": "no-cache", "user-agent": "Mozilla/5.0 snapshot-site" }, redirect: "manual" });
    status[u] = res.status;
    fs.writeFileSync(path.join(dir, file(u)), norm(await res.text()));
  }
}));
const bad = Object.entries(status).filter(([, s]) => s !== 200);
console.log(`${BASE}: ${urls.length} URLs, ${urls.length - bad.length} x 200${bad.length ? `; not 200: ${bad.map(([u, s]) => `${u} ${s}`).join(", ")}` : ""}`);
if (!old) process.exit(0);

let same = 0, withLink = 0, noFooter = 0;
const diffs = [], missing = [];
for (const u of urls) {
  const now = fs.readFileSync(path.join(dir, file(u)), "utf8");
  const was = fs.existsSync(path.join(old, file(u))) ? fs.readFileSync(path.join(old, file(u)), "utf8") : null;
  const links = (now.match(LINK) ?? []).length;
  const hasFooter = now.includes('class="footer_legal"');
  if (links === 1) withLink++;
  else if (!hasFooter && links === 0) noFooter++;
  else missing.push(`${u} (${links} links)`);
  if (was !== null && now.replace(LINK, "") === was) same++;
  else diffs.push(u);
}
console.log(`footer link present on ${withLink}; no footer row (expected none) ${noFooter}; wrong count: ${missing.join(", ") || "none"}`);
console.log(`identical apart from the link: ${same}/${urls.length}; differ: ${diffs.join(", ") || "none"}`);
process.exitCode = missing.length || diffs.length || bad.length ? 1 : 0;
