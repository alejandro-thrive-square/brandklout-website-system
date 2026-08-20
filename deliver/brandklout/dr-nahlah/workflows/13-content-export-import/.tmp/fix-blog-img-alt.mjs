/**
 * fix-blog-img-alt.mjs — alt text for the two blog documents.
 *
 * `restore-img-attrs.mjs` sources every attribute from the LOCAL built page and
 * skips anything with no local counterpart, so `post` and `posts` (both authored
 * natively on Instatic) printed "no local page" and kept the importer's empty
 * alts. The images on them are the shell's, so the shell's own alt text applies:
 * the nav logo names the practice in full, the footer logo is the short form.
 */
import { callJson, callWrite } from './instatic-mcp.mjs';

const NAV_ALT = 'Dr. Nahlah, Implants and Prosthodontics Specialists';
const FOOT_ALT = 'Dr. Nahlah';

const docs = await callJson('site_list_documents', {});
for (const slug of ['post', 'posts']) {
  const d = (docs.documents || []).find((x) => x.slug === slug);
  if (!d) { console.log(`  ${slug}: no such document`); continue; }

  let html = '', part = 1;
  for (;;) {
    const r = await callJson('site_read_document', { document: d.document, part });
    html += r.html || '';
    const n = r.pageInfo?.nextPart;
    if (!n) break;
    part = n;
  }

  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  let n = 0;
  for (const tag of imgs) {
    if (/alt="[^"]+"/.test(tag)) continue;
    const uid = (/uid="([^"]+)"/.exec(tag) || [])[1];
    if (!uid) continue;
    if (!/logo/i.test(tag)) { console.log(`  ${slug}: skipping a non-logo image with no alt: ${tag.slice(0, 90)}`); continue; }
    // The nav logo comes first in document order; everything after it is the footer.
    const alt = n === 0 ? NAV_ALT : FOOT_ALT;
    // htmlAttributes is replaced wholesale, so write the bag complete.
    await callWrite('site_update_node_props', { nodeId: uid, patch: { htmlAttributes: { alt } } });
    n++;
  }

  let back = '', p2 = 1;
  for (;;) {
    const r = await callJson('site_read_document', { document: d.document, part: p2 });
    back += r.html || '';
    const nx = r.pageInfo?.nextPart;
    if (!nx) break;
    p2 = nx;
  }
  const all = (back.match(/<img\b[^>]*>/g) || []);
  console.log(`  ${slug}: wrote ${n}, now ${all.filter((t) => /alt="[^"]+"/.test(t)).length}/${all.length} images carry alt text`);
}
