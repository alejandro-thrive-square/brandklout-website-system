// Staging's SEO layer points at staging, never at production (process 21, "Keeping staging out of Google").
//   INSTATIC_BASE_URL=https://staging.masonparkpediatricdental.com node staging-seo.mjs [--dry-run]
// Open Graph: siteUrl -> staging, emitCanonical false. AEO Schema: siteUrl -> staging, and every
// production URL inside its settings rehosted. Per-page Open Graph overrides: host rewritten.
// Refuses to run against anything but the staging host.
import { api, BASE } from './insta.mjs';
if (!/^https:\/\/staging\.masonparkpediatricdental\.com$/.test(BASE)) throw new Error('staging only: ' + BASE);
const PROD = 'https://masonparkpediatricdental.com', DRY = process.argv.includes('--dry-run');
const swapHost = (v) => JSON.parse(JSON.stringify(v).split(PROD).join(BASE));
for (const id of ['brandklout.open-graph', 'brandklout.aeo-schema']) {
  const cur = await api('GET', `/admin/api/cms/plugins/${id}/settings`);
  const s = swapHost(cur.settings ?? cur);
  if ('siteUrl' in s) s.siteUrl = BASE;
  if (id === 'brandklout.open-graph') s.emitCanonical = false;
  console.log(id, 'siteUrl', s.siteUrl, 'emitCanonical', s.emitCanonical, 'prod refs left', JSON.stringify(s).split(PROD).length - 1);
  if (!DRY) await api('PUT', `/admin/api/cms/plugins/${id}/settings`, { settings: s });
}
// The overrides do not travel in the bundle: og-export.mjs dumps production's, and they are
// written here with the host rewritten.
const fs = await import('node:fs');
const rows = JSON.parse(fs.readFileSync('og-overrides.json', 'utf8')).overrides.map(o => ({ override: o }));
const have = new Set(((await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages')).pages || []).filter(x => x.override).map(x => x.key));
let n = 0;
for (const row of rows) {
  const o = row.override;
  if (have.has(o.key)) continue;
  const next = swapHost(o); delete next.id; delete next.createdAt; delete next.updatedAt;
  n++;
  for (let t = 1; !DRY; t++) {
    try { await api('POST', '/admin/api/cms/plugins/brandklout.open-graph/runtime/override', next); break; }
    catch (e) { if (t >= 4) throw e; await new Promise(r => setTimeout(r, 3000 * t)); }
  }
}
console.log(`${rows.length} pages, ${n} override(s) ${DRY ? 'would be ' : ''}rehosted to ${BASE}`);
