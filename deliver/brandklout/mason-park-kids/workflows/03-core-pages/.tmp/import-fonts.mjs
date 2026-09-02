/**
 * Install the two type families on Instatic, self-hosted.
 *
 *   node import-fonts.mjs [--publish]
 *
 * The pages load Fraunces and Nunito with a <link> in the <head>, and
 * to-instatic.mjs ships a BODY, so the families never reach Instatic on their
 * own; and the published-page CSP blocks fonts.googleapis.com anyway. The
 * platform's own mechanism is used instead, the one DM Sans and Figtree
 * already use on this site: `POST /admin/api/cms/fonts/install` fetches and
 * stores the woff2 files, and the family is then REGISTERED by saving the
 * shell with it in `settings.fonts.items`. Installing is not registering.
 *
 * Instatic installs static instances, not the variable font, so Fraunces'
 * SOFT and WONK axes do not travel: the local page's soft, wonky italics
 * render as the plain italic instance live. The weights and the design do.
 */
import { api, getSite, publish as doPublish, publishStatus, BASE } from "./insta.mjs";

const PUBLISH = process.argv.includes("--publish");
const WANT = [
  { family: "Fraunces", variants: ["400", "500", "600", "400italic", "500italic"] },
  { family: "Nunito", variants: ["400", "700", "800", "400italic"] },
];
const SUBSETS = ["latin"];

console.log(BASE);
const catalogue = (await api("GET", "/admin/api/cms/fonts/google")).families ?? [];
for (const w of WANT) {
  const c = catalogue.find((f) => f.family === w.family);
  if (!c) { console.error(`${w.family} is not in the catalogue`); process.exit(1); }
  const missing = w.variants.filter((v) => !(c.variants ?? []).includes(v));
  if (missing.length) { console.error(`${w.family} has no variant(s) ${missing.join(", ")}; catalogue offers ${(c.variants ?? []).join(", ")}`); process.exit(1); }
}

const before = (await getSite()).site.settings?.fonts?.items ?? [];
console.log(`fonts already installed: ${before.map((f) => f.family).join(", ") || "(none)"}`);
const installed = [];
for (const w of WANT) {
  const have = before.find((f) => f.family === w.family);
  if (have && w.variants.every((v) => (have.variants ?? []).includes(v)) && (have.files ?? []).length) {
    console.log(`  ${w.family}: already installed with the right variants`);
    continue;
  }
  process.stdout.write(`  ${w.family}: installing ${w.variants.join(",")} ... `);
  const res = await api("POST", "/admin/api/cms/fonts/install", { source: "google", family: w.family, variants: w.variants, subsets: SUBSETS });
  const f = res.font ?? res.entry ?? res;
  installed.push(f);
  console.log(`${(f.files ?? []).length} file(s)`);
}

if (installed.length) {
  const site = await getSite();
  const shell = site.site;
  const items = [...(shell.settings?.fonts?.items ?? [])];
  for (const f of installed) { const at = items.findIndex((x) => x.family === f.family); if (at >= 0) items[at] = f; else items.push(f); }
  const res = await api("PUT", "/admin/api/cms/site-document", {
    mode: "incremental",
    site: { ...shell, settings: { ...(shell.settings ?? {}), fonts: { ...(shell.settings?.fonts ?? {}), items } } },
    changedPages: [], deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: {}, shellBaseSeq: site.seq,
  });
  console.log(`registered on the shell: ${JSON.stringify(res).slice(0, 120)}`);
}

const after = (await getSite()).site.settings?.fonts?.items ?? [];
let bad = 0;
console.log("installed now:");
for (const f of after) {
  const n = (f.files ?? []).length;
  console.log(`  ${String(f.family).padEnd(12)} [${(f.variants ?? []).join(",")}] ${n} file(s)  ${(f.files ?? [])[0]?.path ?? ""}`);
  if (!n) bad++;
}
for (const w of WANT) if (!after.some((f) => f.family === w.family)) { console.log(`  MISSING: ${w.family}`); bad++; }
if (bad) process.exit(1);

if (PUBLISH) {
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 200)}`);
  console.log(`status : ${JSON.stringify(await publishStatus())}`);
}
