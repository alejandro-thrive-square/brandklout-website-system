// Dump an Instatic instance to one local file, before anything destroys it.
//
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node backup-site.mjs
//
// `GET /pages` already returns each row's FULL `cells.body.nodes`, so one call
// is the whole content backup -- no per-row fetch needed. The shell (style
// rules, code assets, breakpoints, settings) comes from `GET /site`.
//
// Restoring is `PUT /site-document` with these rows as `changedPages` and the
// saved shell as `site`; see import-pages.mjs for the exact envelope. The seqs
// in here are the ones read at backup time, so a restore onto a site that has
// moved on needs fresh seqs -- read them again rather than replaying these.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, IS_STAGING, getSite, getPages, listMedia, publishStatus } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const host = BASE.replace(/^https?:\/\//, "").replace(/[^a-z0-9.-]/gi, "_");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const out = path.join(HERE, `backup-${host}-${stamp}.json`);

const site = await getSite();
const pages = (await getPages()).rows ?? [];
const media = await listMedia();
const status = await publishStatus();

const doc = {
  takenAt: new Date().toISOString(),
  base: BASE,
  isStaging: IS_STAGING,
  publishStatus: status,
  shellSeq: site.seq,
  site: site.site,
  pages,
  media: media.assets ?? media,
};

fs.writeFileSync(out, JSON.stringify(doc, null, 1), "utf8");
const mb = (fs.statSync(out).size / 1048576).toFixed(1);
console.log(`${BASE}  (${IS_STAGING ? "staging" : "PRODUCTION"})`);
console.log(`  ${pages.length} pages, ${(doc.media || []).length} media records, shell seq ${site.seq}`);
console.log(`  -> ${path.basename(out)}  (${mb} MB)`);
console.log(`  publish: ${JSON.stringify(status)}`);
