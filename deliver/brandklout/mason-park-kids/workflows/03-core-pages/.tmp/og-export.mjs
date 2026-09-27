// Dump the Open Graph per-page overrides of INSTATIC_BASE_URL to og-overrides.json.
// They are plugin runtime data and do NOT travel in an export bundle (found 2026-09-27).
import fs from 'node:fs';
import { api, BASE } from './insta.mjs';
const r = await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages');
const out = (r.pages || r.data?.pages || []).filter(x => x.override).map(x => x.override);
fs.writeFileSync('og-overrides.json', JSON.stringify({ from: BASE, overrides: out }, null, 1));
console.log(BASE, out.length, 'overrides -> og-overrides.json');
