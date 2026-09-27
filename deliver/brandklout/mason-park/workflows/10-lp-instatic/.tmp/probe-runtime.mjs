/**
 * Where does the published page's CSP come from?
 *
 * It is not in the site document's style/page data, so the candidates are
 * `settings` and `runtime`. Dr Nahlah's instance publishes a permissive policy
 * AND ships an importmap; Mason Park publishes `script-src 'none'` and ships
 * no scripts at all. If the policy tracks the runtime dependency set, enabling
 * scripts is a runtime change rather than a header setting.
 *
 * Read-only. `node probe-runtime.mjs`
 */
import { getSite } from "../../09-static-rebuild/.tmp/insta.mjs";

const { site } = await getSite();
for (const key of ["settings", "runtime", "packageJson", "breakpoints"]) {
  console.log(`\n=== site.${key} ===`);
  console.log(JSON.stringify(site[key], null, 2).slice(0, 3000));
}

console.log(`\n=== site.files (${(site.files ?? []).length}) ===`);
for (const f of site.files ?? []) {
  console.log(`${(f.path ?? f.name ?? "?").padEnd(48)} ${f.kind ?? f.type ?? ""} ${String(f.content ?? "").length}b`);
}
