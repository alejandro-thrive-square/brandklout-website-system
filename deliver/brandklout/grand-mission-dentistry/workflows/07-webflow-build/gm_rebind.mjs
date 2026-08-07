/**
 * gm_rebind.mjs — Grand Mission variant of rebind_assets.mjs.
 *
 * Differences from the Dr. Nahlah original it was adapted from:
 *   - reads `.tmp/asset-map.json` ({file: {assetId, hostedUrl}}), the record of
 *     the 31 assets ALREADY uploaded to site 698111847e9608eb30ee21c6 by the
 *     previous build session — no upload step; hostedUrl is taken verbatim
 *     because at least one asset (consult.webp) is stored under a different
 *     filename than `${id}_${file}`;
 *   - also rewrites `data.xattr` entries (Webflow stores custom attributes like
 *     the work chapter's `data-icon` there, not in `data.attr`);
 *   - the embed-markup rewrite covers data-lightbox / data-icon, which this
 *     design reads at runtime (lightbox images, service stage icon).
 *
 * Usage: node gm_rebind.mjs <resolved.json> <asset-map.json> <out final.json>
 */
import fs from "node:fs";
import path from "node:path";

const [payloadPath, mapPath, outPath] = process.argv.slice(2);
const doc = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const SITE = "698111847e9608eb30ee21c6";

const MIME = {
  ".webp": "image/webp", ".png": "image/png", ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".gif": "image/gif",
};

const byFile = new Map(
  Object.entries(map).map(([file, a]) => [
    file,
    { id: a.assetId, url: a.hostedUrl, ct: MIME[path.extname(file).toLowerCase()] || "application/octet-stream" },
  ]),
);

const p = doc.payload;
p.assets ||= [];
const usedAssets = new Map();
const unmatched = new Set();
let images = 0, attrs = 0, xattrs = 0, embedRewrites = 0;

const lookup = (ref) => {
  const a = byFile.get(path.basename(ref));
  if (!a) unmatched.add(ref);
  return a;
};

const noteAsset = (a, base) => {
  usedAssets.set(a.id, {
    cid: a.id, _id: a.id, fileName: base, origFileName: base,
    createdOn: new Date(0).toISOString(), siteId: SITE, variants: [],
    mimeType: a.ct, s3Url: a.url, increment: 0,
  });
};

for (const n of p.nodes) {
  const attr = n.data?.attr;
  if (attr) {
    for (const [k, v] of Object.entries(attr)) {
      if (typeof v !== "string" || !v.startsWith("assets/")) continue;
      const a = lookup(v);
      if (!a) continue;
      attr[k] = a.url;
      if (n.type === "Image" && k === "src") {
        attr.loading ||= "lazy";
        // The Designer reads the asset binding from data.img.id; without it
        // the node renders the URL but is not linked to the asset library.
        n.data.img = { id: a.id };
        noteAsset(a, path.basename(v));
        images++;
      } else attrs++;
    }
  }
  const xattr = n.data?.xattr;
  if (Array.isArray(xattr)) {
    for (const x of xattr) {
      if (typeof x.value !== "string" || !x.value.startsWith("assets/")) continue;
      const a = lookup(x.value);
      if (!a) continue;
      x.value = a.url;
      xattrs++;
    }
  }
}

/* HtmlEmbed nodes carry raw markup the converter never touched. The markup
   exists at BOTH node.v and data.embed.meta.html — rewrite both. */
const rewrite = (html) => html.replace(
  /(src|href|poster|data-lightbox|data-icon)=(["'])assets\/([^"']+)\2/g,
  (whole, attrName, q, file) => {
    const a = lookup("assets/" + file);
    if (!a) return whole;
    embedRewrites++;
    return `${attrName}=${q}${a.url}${q}`;
  });

for (const n of p.nodes) {
  if (n.type !== "HtmlEmbed") continue;
  if (n.v) n.v = rewrite(n.v);
  const meta = n.data?.embed?.meta;
  if (meta?.html) meta.html = rewrite(meta.html);
}

for (const a of usedAssets.values()) {
  if (!p.assets.some((x) => x._id === a._id)) p.assets.push(a);
}

fs.writeFileSync(outPath, JSON.stringify(doc), "utf8");
console.log(
  `rebound ${images} Image nodes (${usedAssets.size} assets), ` +
  `${attrs} attr refs, ${xattrs} xattr refs, ${embedRewrites} embed-markup refs`,
);

const leftovers = (JSON.stringify(doc).match(/assets\//g) || []).length;
if (leftovers) console.log(`WARNING: ${leftovers} 'assets/' strings remain in the payload`);
if (unmatched.size) {
  console.log("UNMATCHED (still relative/broken):");
  for (const u of unmatched) console.log("  " + u);
  process.exit(1);
}
if (leftovers) process.exit(1);
