// Read-only: publish status, page rows and their draft/published markers on one instance.
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node probe-publish-state.mjs
import { getSite, getPages, publishStatus, BASE, IS_STAGING } from "./insta.mjs";

console.log(`${BASE}  (${IS_STAGING ? "staging" : "PRODUCTION"})`);
const site = await getSite();
console.log("shell seq", site.seq, "site keys", Object.keys(site).join(","));
console.log("status", JSON.stringify(await publishStatus()).slice(0, 1500));
const { rows, ...rest } = await getPages();
console.log("pages resp keys", Object.keys(rest).join(","), "rows", rows.length);
const r0 = rows[0];
console.log("row keys", Object.keys(r0).join(","), "cells keys", Object.keys(r0.cells).join(","));
const pp = rows.find((r) => (r.cells?.slug ?? r.slug) === "privacy-policy");
console.log("privacy row", JSON.stringify({ ...pp, cells: { ...pp.cells, body: `[${Object.keys(pp.cells.body.nodes).length} nodes]` } }).slice(0, 2000));
console.log("hipaa row?", rows.some((r) => /hipaa/.test(r.cells?.slug ?? r.slug)));
