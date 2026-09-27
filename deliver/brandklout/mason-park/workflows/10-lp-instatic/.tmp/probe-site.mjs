/**
 * Read-only probe of the Mason Park Instatic instance.
 *
 * Answers three questions before anything is written:
 *   1. Where does the published pages' Content-Security-Policy come from?
 *      Dr Nahlah's instance serves a permissive policy (scripts + iframes);
 *      Mason Park serves `script-src 'none'; frame-src 'none'`, which would
 *      silently kill the GHL lead form and the call-tracking number pool on
 *      any landing page we import. It has to be a stored setting, not a
 *      platform constant.
 *   2. What slugs already exist, so the six landing-page slugs do not collide.
 *   3. What the site document's shape is, so the import can extend it.
 *
 * Writes nothing. `node probe-site.mjs`
 */
import { api, getSite, getPages, whoami, BASE } from "../../09-static-rebuild/.tmp/insta.mjs";

const show = (label, v) => console.log(`\n=== ${label} ===\n${v}`);

console.log(`base: ${BASE}`);
console.log(`me:   ${JSON.stringify(await whoami())}`);

const site = await getSite();
show("site: top-level keys", Object.keys(site).join(", "));

// The site document is where a per-site header/security setting would live.
const doc = site.site ?? site.document ?? site;
show("site document keys", Object.keys(doc).join(", "));

// Hunt for anything policy-shaped anywhere in the tree, by key name and by value.
const hits = [];
const walk = (node, path) => {
  if (node === null || typeof node !== "object") {
    if (typeof node === "string" && /script-src|default-src|frame-src/i.test(node)) {
      hits.push([path, node.slice(0, 300)]);
    }
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (/csp|security|policy|header|embed|sanitiz|allowScript|trusted/i.test(k)) {
      hits.push([`${path}.${k}`, JSON.stringify(v).slice(0, 300)]);
    }
    walk(v, `${path}.${k}`);
  }
};
walk(site, "site");
show("policy-shaped keys/values", hits.length ? hits.map(([p, v]) => `${p}\n    ${v}`).join("\n") : "(none found in the site document)");

const pages = await getPages();
const rows = pages.rows ?? pages.pages ?? [];
show(`pages (${rows.length})`, rows.map((r) => r.slug).sort().join("\n"));

const LP = [
  "invisalign", "new-patient-special", "invisalign-consultation",
  "new-patient-special-consultation", "invisalign-thank-you", "new-patient-thank-you",
];
const existing = new Set(rows.map((r) => r.slug));
show("landing-page slug collisions", LP.map((s) => `${existing.has(s) ? "TAKEN  " : "free   "} ${s}`).join("\n"));

// Settings often live off the site document entirely.
for (const p of ["/admin/api/cms/settings", "/admin/api/cms/site/settings", "/admin/api/cms/config"]) {
  try {
    const out = await api("GET", p);
    show(`GET ${p}`, JSON.stringify(out).slice(0, 1500));
  } catch (e) {
    console.log(`\nGET ${p} -> ${String(e.message).slice(0, 120)}`);
  }
}
