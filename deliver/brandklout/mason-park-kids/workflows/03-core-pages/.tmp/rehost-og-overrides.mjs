// The production launch (2026-09-24): every brandklout.open-graph per-page override carried a
// canonical on https://pediatricdentistkatytx.com. Rewrite ONLY the host of each stored url and
// write the override back with every other field as it was (populate-seo.mjs would regenerate the
// descriptions too, which is not wanted here). Then publish.mjs - the plugin bakes at publish.
//   node rehost-og-overrides.mjs [--dry-run]
import { api } from './insta.mjs';
const FROM = 'https://pediatricdentistkatytx.com', TO = 'https://masonparkpediatricdental.com';
const DRY = process.argv.includes('--dry-run');
const r = await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages');
const rows = (r.pages || r.data?.pages || []);
let n = 0, other = 0;
for (const row of rows) {
  const o = row.override;
  if (!o) continue;
  const hits = Object.entries(o).filter(([, v]) => typeof v === 'string' && v.includes(FROM));
  if (!hits.length) { other++; continue; }
  const next = { ...o };
  for (const [k, v] of hits) next[k] = v.split(FROM).join(TO);
  delete next.id; delete next.createdAt; delete next.updatedAt;
  n++;
  if (n <= 3) console.log(' ', row.key, hits.map(([k]) => k).join(','), '->', next.url);
  if (!DRY) await api('POST', '/admin/api/cms/plugins/brandklout.open-graph/runtime/override', next);
}
console.log(`${rows.length} pages, ${n} override(s) ${DRY ? 'would be ' : ''}rehosted, ${other} already clean`);
