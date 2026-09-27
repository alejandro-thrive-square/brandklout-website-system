// Read-only inventory of the instance: who we are, what is published, which
// pages, code assets, runtime scripts, fonts and plugins are there.
//
//   node list-site.mjs [--fonts Fraunces,Nunito]
//
// Run it before anything writes, and again after, so the delta is on record.
import { whoami, getSite, getPages, listMedia, publishStatus, api, BASE } from "./insta.mjs";

const argv = process.argv.slice(2);
const fontQuery = argv.includes("--fonts") ? argv[argv.indexOf("--fonts") + 1].split(",") : null;

console.log(`site: ${BASE}`);
const me = await whoami();
console.log(`as:   ${me.email ?? me.user?.email ?? JSON.stringify(me).slice(0, 80)}`);

const { site, seq } = await getSite();
console.log(`shell seq ${seq}, name ${site.settings?.name ?? site.name ?? "?"}`);
console.log(`styleRules: ${Object.keys(site.styleRules ?? {}).length}`);
console.log("files:");
for (const f of site.files ?? []) console.log(`  ${f.type.padEnd(7)} ${f.path.padEnd(40)} ${(f.content ?? "").length} chars  id ${f.id}`);
console.log("runtime.scripts:");
for (const [id, s] of Object.entries(site.runtime?.scripts ?? {})) console.log(`  ${id}: ${JSON.stringify(s)}`);
console.log(`fonts: ${(site.settings?.fonts?.items ?? []).map((f) => `${f.family} [${(f.variants ?? []).join(",")}] ${(f.files ?? []).length} files`).join(" | ") || "(none)"}`);
console.log(`favicon: ${site.settings?.faviconUrl ?? "(none)"}`);
console.log(`plugins: ${JSON.stringify(site.plugins ?? site.settings?.plugins ?? "(no plugins key on the shell)").slice(0, 300)}`);

const pages = (await getPages()).rows ?? [];
console.log(`\npages: ${pages.length}`);
for (const p of pages) {
  const n = Object.keys(p.cells?.body?.nodes ?? {}).length;
  console.log(`  ${String(p.slug).padEnd(48)} seq ${String(p.seq ?? "").padEnd(4)} ${n} nodes  ${p.cells?.title ?? p.title ?? ""}`);
}

const media = await listMedia();
const assets = media.assets ?? media.rows ?? [];
console.log(`\nmedia: ${assets.length} asset(s)`);

console.log(`\npublish: ${JSON.stringify(await publishStatus())}`);

try {
  const plugins = await api("GET", "/admin/api/cms/plugins");
  console.log(`plugins endpoint: ${JSON.stringify(plugins).slice(0, 400)}`);
} catch (e) { console.log(`plugins endpoint: ${e.message.slice(0, 120)}`); }

if (fontQuery) {
  const cat = await api("GET", "/admin/api/cms/fonts/google");
  const items = cat.items ?? cat.fonts ?? cat;
  for (const q of fontQuery) {
    const hit = (Array.isArray(items) ? items : []).find((f) => (f.family ?? f.name) === q);
    console.log(`\ncatalogue ${q}: ${hit ? JSON.stringify(hit).slice(0, 400) : "NOT FOUND"}`);
  }
  if (!Array.isArray(items)) console.log(`catalogue shape: ${JSON.stringify(cat).slice(0, 300)}`);
}
