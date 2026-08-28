// Pull the practice's SERVICE pages out of the recovered database dump.
//
//   node db-pages.mjs [--inventory]
//
// WHY THIS EXISTS. The live pediatric WordPress install (table prefix `wp_`,
// theme tooth-fairy) publishes 40 pages and NONE of them is a service page —
// yet its own main menu links to 24 URLs under /services/. Those links were
// dead on the live site.
//
// The pages they point at do exist: the same database also carries a SECOND,
// abandoned WordPress install under the prefix `hni_` (blogname "Mason Park
// Dental for kids", admin social@identitydental.com — the previous agency).
// That install holds 69 published pages, including every /services/ URL the
// current menu names, written as clean paragraph HTML rather than Elementor
// soup. It is the practice's own copy about the practice's own services.
//
// So the rebuild takes core pages from the live install's rendered snapshots
// (extract.mjs) and service pages from here. Nothing is retyped either way.
//
// SAFETY: the dump comes off a compromised host. Nothing here is executed — the
// file is streamed, tokenised as SQL string literals, and only wp_posts-shaped
// columns are read. HTML is stored, never evaluated; build.mjs sanitises it.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { DB_SERVICE_PAGES, DB_CORE_PAGES } from "./pages.config.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DUMP = path.resolve(HERE, "../../01-site-recovery/.tmp/recovered/db.sql.gz");
const OUT = path.join(HERE, "content-db");
const INVENTORY = process.argv.includes("--inventory");

if (!fs.existsSync(DUMP)) {
  console.error(`no dump at ${DUMP} — run workflow 01 first`);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

// wp_posts column order, WordPress 4.x-6.x. Only these five are read.
const COL = { id: 0, content: 4, title: 5, excerpt: 6, status: 7, name: 11, parent: 17, type: 20 };

/** Tokenise `(a,'b',NULL),(...)` into arrays of raw column strings. */
function* tuples(s) {
  let i = 0;
  while (i < s.length) {
    if (s[i] !== "(") { i++; continue; }
    i++;
    const vals = [];
    let cur = "", quoted = false, done = false;
    while (i < s.length) {
      const c = s[i];
      if (quoted) {
        if (c === "\\") { cur += c + s[i + 1]; i += 2; continue; }
        if (c === "'") { quoted = false; i++; continue; }
        cur += c; i++; continue;
      }
      if (c === "'") { quoted = true; i++; continue; }
      if (c === ",") { vals.push(cur); cur = ""; i++; continue; }
      if (c === ")") { vals.push(cur); i++; done = true; break; }
      cur += c; i++;
    }
    if (done) yield vals; else return;
  }
}

// mysqldump escapes for a single-quoted literal. Undo exactly those.
const unesc = (s) => String(s)
  .replace(/\\([nrt0Z'"\\])/g, (_, c) =>
    ({ n: "\n", r: "\r", t: "\t", 0: "", Z: "", "'": "'", '"': '"', "\\": "\\" }[c]));

const rows = [];
await new Promise((resolve, reject) => {
  const stream = fs.createReadStream(DUMP).pipe(zlib.createGunzip());
  stream.setEncoding("utf8");
  let buf = "";
  const KEY = "INSERT INTO `hni_posts` VALUES ";
  stream.on("data", (chunk) => {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf(");\n")) !== -1) {
      const stmt = buf.slice(0, idx + 2);
      buf = buf.slice(idx + 3);
      const p = stmt.indexOf(KEY);
      if (p === -1) continue;
      for (const v of tuples(stmt.slice(p + KEY.length))) {
        if (v[COL.type] !== "page" || v[COL.status] !== "publish") continue;
        rows.push({
          id: Number(v[COL.id]),
          slug: unesc(v[COL.name]),
          title: unesc(v[COL.title]),
          html: unesc(v[COL.content]),
          excerpt: unesc(v[COL.excerpt]),
        });
      }
    }
  });
  stream.on("end", resolve);
  stream.on("error", reject);
});

if (INVENTORY) {
  console.log(`hni_ published pages: ${rows.length}\n`);
  for (const r of rows.sort((a, b) => b.html.length - a.html.length)) {
    console.log(String(r.id).padStart(5), String(r.html.length).padStart(6), r.slug.padEnd(36), r.title);
  }
  process.exit(0);
}

// Rows are addressed by id where the config pins one (several slugs appear
// twice — the install was rebuilt in place). Otherwise the longest body wins.
const byId = new Map(rows.map((r) => [r.id, r]));
const bySlug = new Map();
for (const r of rows) {
  const prev = bySlug.get(r.slug);
  if (!prev || r.html.length > prev.html.length) bySlug.set(r.slug, r);
}

const wordsOf = (html) => html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;

const written = [];
const missing = [];
const emit = (slug, cfg, kind) => {
  const r = cfg.dbId ? byId.get(cfg.dbId) : bySlug.get(cfg.dbSlug || slug);
  if (!r) { missing.push(slug); return; }
  const words = wordsOf(r.html);
  fs.writeFileSync(path.join(OUT, slug + ".json"), JSON.stringify({
    slug, kind,
    source: "hni_posts#" + r.id,
    dbSlug: r.slug,
    title: cfg.title || r.title,
    html: r.html,
    words,
  }, null, 1));
  written.push({ slug, kind, id: r.id, words });
};

for (const [slug, cfg] of Object.entries(DB_SERVICE_PAGES)) emit(slug, cfg, "service");
for (const [slug, cfg] of Object.entries(DB_CORE_PAGES)) emit(slug, cfg, "article");

fs.writeFileSync(path.join(OUT, "_index.json"), JSON.stringify(written, null, 1));
console.log(`${written.length} pages -> content-db/`);
for (const w of written) console.log(`  ${w.kind.padEnd(8)} ${w.slug.padEnd(34)} #${String(w.id).padEnd(4)} ${w.words}w`);
if (missing.length) console.log(`
  ! not in the dump: ${missing.join(", ")}`);
