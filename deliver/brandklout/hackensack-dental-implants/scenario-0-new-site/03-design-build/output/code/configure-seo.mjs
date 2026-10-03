// Client script, 2026-09-30. Per-site settings of the Open Graph plugin on the instance
// INSTATIC_BASE_URL names (each site keeps its own: a share image, a site address, a favicon and a
// practice name belong to one client). Idempotent; prints the diff; writes only with --apply.
//
// On a staging host: siteUrl is the STAGING host and emitCanonical is off, so nothing on staging
// points Google at production (tools/instatic-site/staging-clone/staging-clone.md, "Keeping staging
// out of Google"). On production it is the public address with the canonical on.
//
// Usage (from the step folder):
//   INSTATIC_BASE_URL=https://<staging host> node output/code/configure-seo.mjs [--apply]
// AEO Schema (the JSON-LD graph) is not configured here yet: that belongs to the launch step.
import fs from 'node:fs';
import path from 'node:path';
import { api, BASE } from '../../../../tools/instatic-site/lib/site.mjs';

const apply = process.argv.includes('--apply');
const staging = /(^|[-.])staging[.-]/.test(new URL(BASE).hostname) || /^staging\./.test(new URL(BASE).hostname);
const map = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'output', 'media-map.json'), 'utf8')).map;
const media = (name) => { const hit = map[`media/img/${name}`]; if (!hit) throw new Error(`${name} is not in media-map.json`); return hit.url; };

const want = {
  enabled: true,
  siteUrl: BASE.replace(/\/$/, ''),
  siteName: 'Hackensack Center for Dental Implants',
  defaultImage: media('hero.webp'),
  defaultImageAlt: 'A patient smiles at her reflection in a hand mirror, seated in the treatment chair',
  deriveFromPage: true,
  syncMetaDescription: true,
  emitCanonical: !staging,
  favicon: media('logo-icon-dark.png'),
  appleTouchIcon: media('logo-icon-dark.png'),
};

const id = 'brandklout.open-graph';
const current = (await api('GET', `/admin/api/cms/plugins/${id}/settings`)).settings ?? {};
const diff = Object.fromEntries(Object.entries(want).filter(([k, v]) => current[k] !== v));
console.log(`${id} on ${BASE} (${staging ? 'staging' : 'production'})`);
for (const [k, v] of Object.entries(diff)) console.log(`  ${k}: ${JSON.stringify(current[k])} -> ${JSON.stringify(v)}`);
// No process.exit(): on Node 24 for Windows it trips a libuv assertion while fetch handles close,
// and the script then reports failure after doing its work.
if (!Object.keys(diff).length) console.log('  nothing to change');
else if (!apply) console.log('dry run; re-run with --apply');
else {
  await api('PUT', `/admin/api/cms/plugins/${id}/settings`, { settings: { ...current, ...diff } });
  const after = (await api('GET', `/admin/api/cms/plugins/${id}/settings`)).settings ?? {};
  const bad = Object.entries(want).filter(([k, v]) => after[k] !== v).map(([k]) => k);
  console.log(bad.length ? `NOT saved: ${bad.join(', ')}` : `saved ${Object.keys(diff).length} setting(s); they reach pages at the next publish`);
  if (bad.length) process.exitCode = 1;
}
