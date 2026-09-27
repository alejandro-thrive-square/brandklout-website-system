// What shape does GET /admin/api/cms/pages actually return, and which pages
// already carry a seoDescription? populate-seo.mjs is written against this.
import { getPages } from "./insta.mjs";

const r = await getPages();
console.log("top-level keys:", Object.keys(r).join(", "));
const list = Array.isArray(r) ? r : r.pages ?? r.rows ?? r.items ?? [];
const arr = Array.isArray(list) ? list : Object.values(list);
console.log("count:", arr.length);
if (arr.length) {
  console.log("page keys:", Object.keys(arr[0]).join(", "));
  const seoKey = Object.keys(arr[0]).find((k) => /seo/i.test(k));
  console.log("seo-ish key:", seoKey, "=>", JSON.stringify(arr[0][seoKey]));
  let have = 0;
  for (const p of arr) {
    const d = p.seoDescription ?? p.seo?.description ?? "";
    if (d) have++;
  }
  console.log(`with a description: ${have} / ${arr.length}`);
  console.log("cell keys:", Object.keys(arr[0].cells ?? {}).join(", "));
  console.log(JSON.stringify(arr.slice(0, 2).map((p) => ({ id: p.id, slug: p.slug, cells: Object.fromEntries(Object.entries(p.cells ?? {}).map(([k, v]) => [k, typeof v === "string" ? v.slice(0, 90) : v])) })), null, 1));
}
