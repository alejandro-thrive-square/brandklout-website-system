// Installed plugins and their versions on the instance INSTATIC_BASE_URL names.
//   INSTATIC_BASE_URL=... node list-plugins.mjs > log
import { api, BASE } from "../insta.mjs";
const r = await api("GET", "/admin/api/cms/plugins");
const list = r.plugins ?? r.items ?? r;
console.log(BASE);
for (const p of list) console.log(`  ${p.id} ${p.version} enabled=${p.enabled ?? p.active}`);
