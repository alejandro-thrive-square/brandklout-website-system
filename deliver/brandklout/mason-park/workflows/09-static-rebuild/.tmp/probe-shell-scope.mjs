// Read-only: which runtime scripts/styles are scoped to a page list, and does it cover every page?
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node probe-shell-scope.mjs
import { getSite, getPages, BASE } from "./insta.mjs";

const { site, seq } = await getSite();
const ids = new Set(((await getPages()).rows ?? []).map((r) => r.id));
console.log(BASE, "shell seq", seq, "pages", ids.size);
console.log("shell keys", Object.keys(site).join(","));
console.log("runtime keys", Object.keys(site.runtime ?? {}).join(","));
for (const [kind, entries] of Object.entries(site.runtime ?? {})) {
  if (!entries || typeof entries !== "object") { console.log(kind, JSON.stringify(entries).slice(0, 200)); continue; }
  for (const [id, e] of Object.entries(entries)) {
    const file = (site.files ?? []).find((f) => f.id === id);
    const sc = e?.scope;
    const covered = sc?.type === "pages" ? `${sc.pageIds.filter((p) => ids.has(p)).length}/${ids.size} pages` : JSON.stringify(sc);
    console.log(`${kind}  ${file?.path ?? id}  scope ${sc?.type ?? "-"}  ${covered}`);
  }
}
console.log("settings keys", Object.keys(site.settings ?? {}).join(","));
