// Add /terms-of-service as ONE new page row, give it its meta description, and publish - only if
// that publish ships nothing but this page.
//
//   node .tmp/terms/inject-terms.mjs [--dry-run]                         # staging
//   PROMOTE=production INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app node .tmp/terms/inject-terms.mjs
//   node .tmp/terms/inject-terms.mjs --update     # the row exists: rewrite ITS body (same id, baseSeqs = its seq)
//
// Instatic's publish is site-wide: it ships every draft. So this refuses to run unless the draft
// matches what is published (nobody else has unpublished work), and refuses to publish if any
// other row's seq moved between the snapshot and the publish.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { api, getPages, getSite, publish, publishStatus, BASE } from "../insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry-run");
const UPDATE = process.argv.includes("--update");
const SLUG = "terms-of-service";
const SITE = /\/\/staging\./.test(BASE) ? "https://staging.masonparkpediatricdental.com" : "https://masonparkpediatricdental.com";
const c = JSON.parse(fs.readFileSync(path.join(HERE, "converted.json"), "utf8"));
const die = (m) => { console.error(`STOP: ${m}`); process.exit(1); };

console.log(`site: ${BASE}`);
const st0 = await publishStatus();
console.log(`status before: ${JSON.stringify(st0)}`);
if (!st0.draftMatchesPublished) die("the draft differs from what is published - someone has unpublished work; publishing would ship it");

const rows0 = (await getPages()).rows ?? [];
const old = rows0.find((r) => r.slug === SLUG);
if (old && !UPDATE) die(`a ${SLUG} row already exists (use --update to rewrite it)`);
if (!old && UPDATE) die(`--update but there is no ${SLUG} row`);
const seq0 = new Map(rows0.map((r) => [r.id, r.seq]));
console.log(`${rows0.length} rows, ${old ? `${SLUG} is ${old.id} seq ${old.seq}` : `none is ${SLUG}`}`);
if (DRY) { console.log("dry run - nothing written"); process.exit(0); }

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const id = old ? old.id : Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");
const site = await getSite();
const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental", site: site.site,
  changedPages: [{
    id, tableId: "pages", slug: SLUG, title: c.title,
    nodes: c.body.nodes, rootNodeId: c.body.rootNodeId, status: "published",
    cells: { title: c.title, slug: SLUG, body: c.body },
  }],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: old ? { [old.id]: old.seq ?? 0 } : {}, shellBaseSeq: site.seq,
});
console.log(`saved: ${JSON.stringify(res).slice(0, 200)}`);

await api("POST", "/admin/api/cms/plugins/brandklout.open-graph/runtime/override", {
  key: SLUG, description: c.description, url: `${SITE}/${SLUG}/`, enabled: true,
});
console.log(`open-graph override: ${c.description}`);

const rows1 = (await getPages()).rows ?? [];
const mine = rows1.find((r) => r.slug === SLUG);
if (!mine || Object.keys(mine.cells?.body?.nodes ?? {}).length !== Object.keys(c.body.nodes).length) die("the new row did not read back intact");
const moved = rows1.filter((r) => r.slug !== SLUG && seq0.get(r.id) !== r.seq).map((r) => r.slug);
const gone = rows0.filter((r) => !rows1.some((x) => x.id === r.id)).map((r) => r.slug);
if (moved.length || gone.length || rows1.length !== rows0.length + (old ? 0 : 1)) {
  die(`other rows changed since the snapshot (moved: ${moved.join(", ") || "-"}; gone: ${gone.join(", ") || "-"}). The draft row stays; NOT publishing.`);
}
console.log(`read back: ${rows1.length} rows, only ${SLUG} is new, no other seq moved`);

const pub = await publish();
console.log(`publish: ${JSON.stringify(pub).slice(0, 200)}`);
const st1 = await publishStatus();
console.log(`status after: ${JSON.stringify(st1)}`);
if (!st1.draftMatchesPublished || st1.publishedPages !== st0.publishedPages + (old ? 0 : 1)) die("unexpected status after publish");
