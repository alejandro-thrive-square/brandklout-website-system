/**
 * rebind_assets.mjs — point a payload's Image nodes at uploaded Webflow assets.
 *
 * The converter emits whatever `src` the design used (`assets/case1-before.jpg`).
 * Relative paths obviously break once pasted, but a plain external URL is not
 * the fix either: Webflow drops images it does not recognise as its own assets.
 * Each Image node needs the Webflow CDN `hostedUrl` AND the asset `id`, and the
 * payload needs a matching `assets[]` entry — that is what makes the image land
 * in the Designer as a real, re-selectable asset rather than a broken box.
 *
 * Usage: node rebind_assets.mjs <payload.json> <asset-uploads.json> <out.json>
 */
import fs from "node:fs";
import path from "node:path";

const [payloadPath, manifestPath, outPath] = process.argv.slice(2);
const doc = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const uploads = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const SITE = "6a6b84cc7fe55ddeabc0b314";

const byFile = new Map(
  uploads.map((u) => [
    u.file,
    {
      id: u.id,
      ct: u.ct,
      // cdn.prod.website-files.com is the URL the Designer itself serves
      // assets from; the s3.amazonaws.com form redirects but is not what
      // Webflow stores.
      url: `https://cdn.prod.website-files.com/${SITE}/${u.id}_${u.file}`,
    },
  ]),
);

const p = doc.payload;
p.assets ||= [];
const usedAssets = new Map();
let rebound = 0;
const unmatched = new Set();

for (const n of p.nodes) {
  if (n.type !== "Image") continue;
  const attr = n.data?.attr;
  if (!attr?.src) continue;
  const base = path.basename(attr.src);
  const a = byFile.get(base);
  if (!a) {
    unmatched.add(attr.src);
    continue;
  }
  attr.src = a.url;
  attr.loading ||= "lazy";
  // The Designer reads the asset binding from data.img.id; without it the
  // node renders the URL but is not linked to the asset library.
  n.data.img = { id: a.id };
  usedAssets.set(a.id, {
    cid: a.id,
    _id: a.id,
    fileName: base,
    origFileName: base,
    createdOn: new Date(0).toISOString(),
    siteId: SITE,
    variants: [],
    mimeType: a.ct,
    s3Url: a.url,
    increment: 0,
  });
  rebound++;
}

/* HtmlEmbed nodes carry raw markup the converter never touched, so any
   relative src inside one survives into the paste and breaks exactly like an
   Image node would — the proof chapter's `<video src="assets/broll.mp4">`
   sits in an embed and was missed on the first pass. Embeds take a plain URL
   (there is no asset binding to set), so a straight rewrite is enough. */
let embedRewrites = 0;
const rewrite = (html) => html.replace(
  /(src|href|poster)=(["'])assets\/([^"']+)\2/g,
  (whole, attrName, q, file) => {
    const a = byFile.get(path.basename(file));
    if (!a) { unmatched.add("assets/" + file); return whole; }
    embedRewrites++;
    return `${attrName}=${q}${a.url}${q}`;
  });

for (const n of p.nodes) {
  if (n.type !== "HtmlEmbed") continue;
  if (n.v) n.v = rewrite(n.v);
  // The converter keeps a SECOND copy of the embed markup at
  // data.embed.meta.html. Rewriting only `v` leaves the relative path alive in
  // the payload, and which copy the Designer reads is not worth betting on.
  const meta = n.data?.embed?.meta;
  if (meta?.html) meta.html = rewrite(meta.html);
}

for (const a of usedAssets.values()) {
  if (!p.assets.some((x) => x._id === a._id)) p.assets.push(a);
}
if (embedRewrites) console.log(`rewrote ${embedRewrites} relative src in HtmlEmbeds`);

fs.writeFileSync(outPath, JSON.stringify(doc, null, 2), "utf8");
console.log(`rebound ${rebound} Image nodes to ${usedAssets.size} assets`);
if (unmatched.size) {
  console.log("UNMATCHED (still relative/broken):");
  for (const u of unmatched) console.log("  " + u);
  process.exit(1);
}
