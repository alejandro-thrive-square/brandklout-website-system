/* base.video has no htmlAttributes bag, so `id` and `aria-label` cannot be put
   back (site.js resolves the films by class instead). It DOES have a `poster`
   prop, and the importer dropped the poster, so the hero sat black until the
   film decoded. That one is fixable. */
import { callJson, callWrite } from './instatic-mcp.mjs';
const POSTER = '/uploads/W3aKqUZ5lahV5yudqU8XO-hero-poster.jpg';
const docs = await callJson('site_list_documents', {});
const home = (docs.documents || []).find((d) => d.isHomepage || d.slug === 'index');
const r = await callJson('site_read_document', { document: home.document });
const vids = [...(r.html || '').matchAll(/<video\b[^>]*>/g)];
console.log('videos on home:', vids.length);
for (const v of vids) {
  const uid = (/uid="([^"]+)"/.exec(v[0]) || [])[1];
  const isHero = /ar-film/.test(v[0]);
  if (!isHero) { console.log('  skip (not the hero film):', v[0].replace(/\suid="[^"]*"/, '').slice(0, 80)); continue; }
  const res = await callWrite('site_update_node_props', { nodeId: uid, patch: { poster: POSTER } });
  console.log('  poster ->', JSON.stringify(res).slice(0, 120));
}
const back = await callJson('site_read_document', { document: home.document });
for (const m of (back.html || '').matchAll(/<video[^>]*>/g)) console.log('  now:', m[0].replace(/\suid="[^"]*"/, '').slice(0, 200));
