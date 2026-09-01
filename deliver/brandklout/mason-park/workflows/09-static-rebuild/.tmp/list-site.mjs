// Read-only inventory of an Instatic instance: who we are, which site, what
// pages and media it holds, and whether the draft matches what is published.
//
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node list-site.mjs
//
// ALWAYS PASS THE URL EXPLICITLY. The repo `.env` sets INSTATIC_BASE_URL to
// https://www.masonparkdental.com -- PRODUCTION, which carries six paid-traffic
// landing pages (see workflows/10-lp-instatic). Nothing in this folder should
// default to it.
import { BASE, IS_STAGING, whoami, getSite, getPages, listMedia, publishStatus } from "./insta.mjs";

const j = (v) => JSON.stringify(v);

console.log("BASE      " + BASE);
console.log("instance  " + (IS_STAGING ? "STAGING" : "*** PRODUCTION ***"));

const me = await whoami().catch((e) => ({ error: String(e) }));
console.log("me        " + j(me).slice(0, 200));

const site = await getSite().catch((e) => ({ error: String(e) }));
const s = site?.site ?? site;
console.log("site      " + j({ id: s?.id, name: s?.name, host: s?.host, domain: s?.domain }).slice(0, 300));

const pagesRes = await getPages().catch((e) => ({ error: String(e) }));
const pages = pagesRes?.pages ?? pagesRes ?? [];
console.log("\npages: " + (Array.isArray(pages) ? pages.length : "?"));
if (Array.isArray(pages)) {
  console.log("  " + "id".padEnd(26) + "slug".padEnd(34) + "title");
  for (const p of pages) {
    const tmpl = p.template?.target?.kind ? "  [template:" + p.template.target.kind + "]" : "";
    console.log("  " + String(p.id).padEnd(26) + String(p.slug).padEnd(34) + String(p.title || "").slice(0, 46) + tmpl);
  }
}

const media = await listMedia().catch((e) => ({ error: String(e) }));
const items = media?.media ?? media?.items ?? media ?? [];
console.log("\nmedia: " + (Array.isArray(items) ? items.length + " files" : j(media).slice(0, 200)));

const st = await publishStatus().catch((e) => ({ error: String(e) }));
console.log("publish   " + j(st).slice(0, 300));
