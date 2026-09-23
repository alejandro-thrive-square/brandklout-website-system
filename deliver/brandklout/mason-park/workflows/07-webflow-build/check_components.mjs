/**
 * check_components.mjs — structural gate for every extracted component:
 *   - exactly ONE root node (multi-root payloads crash the Designer);
 *   - every node class reference resolves inside the component (closure);
 *   - every HtmlEmbed under 10,000 chars (the Designer slot/paste limit —
 *     the API takes 50k but manual paste does not);
 *   - zero relative asset refs (../shared, ../_vendor, non-CDN src),
 *     including INSIDE embed html (both node.v and data.embed.meta.html);
 *   - every Image node carries a CDN hostedUrl + asset id + assets[] entry;
 *   - PASTE.html exists and its payload block round-trips.
 *
 * Usage: node check_components.mjs .tmp/components
 */
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] || ".tmp/components";
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
let fails = 0;
const fail = (dir, msg) => { fails++; console.log(`FAIL  ${dir}: ${msg}`); };

for (const e of manifest) {
  const dir = path.join(root, e.dir);
  const p = JSON.parse(fs.readFileSync(path.join(dir, "final.json"), "utf8")).payload;

  const referenced = new Set();
  for (const n of p.nodes) for (const c of n.children || []) referenced.add(c);
  const roots = p.nodes.filter((n) => !referenced.has(n._id));
  if (roots.length !== 1) fail(e.dir, `${roots.length} roots`);

  const styleIds = new Set(p.styles.map((s) => s._id));
  for (const n of p.nodes)
    for (const c of n.classes || [])
      if (!styleIds.has(c)) fail(e.dir, `node ${n._id} references missing style ${c}`);
  for (const s of p.styles)
    for (const kid of s.children || [])
      if (!styleIds.has(kid)) fail(e.dir, `style ${s.name} references missing combo ${kid}`);

  for (const n of p.nodes) {
    if (n.type !== "HtmlEmbed") continue;
    const v = n.v || "";
    if (v.length >= 10000) fail(e.dir, `embed ${v.length} chars (>= 10k Designer limit)`);
    const meta = n.data?.embed?.meta?.html || "";
    for (const [where, s] of [["v", v], ["meta.html", meta]]) {
      if (/(\.\.\/shared|\.\.\/_vendor|src="(?!https?:|data:)[^"]+")/.test(s))
        fail(e.dir, `relative ref inside embed ${where}`);
    }
  }

  const assetIds = new Set((p.assets || []).map((a) => a._id));
  for (const n of p.nodes) {
    if (n.type !== "Image") continue;
    const src = n.data?.attr?.src || "";
    const imgId = n.data?.img?.id;
    if (!/^https:\/\/cdn\.prod\.website-files\.com\//.test(src))
      fail(e.dir, `Image src not CDN: ${src.slice(0, 60)}`);
    if (!imgId) fail(e.dir, "Image node missing data.img.id");
    else if (!assetIds.has(imgId)) fail(e.dir, `Image asset ${imgId} not in payload.assets[]`);
  }

  const pastePage = path.join(dir, "PASTE.html");
  if (!fs.existsSync(pastePage)) fail(e.dir, "PASTE.html missing");
  else {
    const h = fs.readFileSync(pastePage, "utf8");
    const m = h.match(/<script type="application\/json" id="payload">([\s\S]*?)<\/script>/);
    if (!m) fail(e.dir, "PASTE.html payload block missing");
    else {
      try {
        const rt = JSON.parse(m[1]);
        if (rt.payload.nodes.length !== p.nodes.length)
          fail(e.dir, "PASTE.html payload node count differs from final.json");
      } catch { fail(e.dir, "PASTE.html payload does not parse"); }
    }
  }
  if (!fs.existsSync(path.join(dir, "README.md"))) fail(e.dir, "README.md missing");
}

console.log(fails
  ? `\n${fails} failure(s) across ${manifest.length} components`
  : `ALL CLEAN — ${manifest.length} components: 1 root each, closures complete, embeds <10k, 0 relative refs, assets CDN-bound, paste pages round-trip`);
process.exit(fails ? 1 : 0);
