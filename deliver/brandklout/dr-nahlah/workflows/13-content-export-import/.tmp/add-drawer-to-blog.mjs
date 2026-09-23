/**
 * add-drawer-to-blog.mjs — put the mobile drawer back on the two blog documents.
 *
 * `build-post-template.mjs` extracted the drawer out of thank-you.json into a
 * variable and then never inserted it, and `build-blog-index.mjs` never had one
 * at all. Both documents therefore ship a `.burger` whose `aria-controls` points
 * at an element that does not exist, so on all 43 posts and on /posts:
 *   - the menu button does nothing on a phone, and
 *   - `drawer.querySelectorAll('a')` throws in site.js, which also took the
 *     Escape handler and both `ScrollTrigger.refresh()` calls down with it.
 * (site.js now guards that block, but the drawer is the actual fix -- a guard
 * gives you a page with no mobile navigation, which is not the design.)
 *
 * The extraction here is a balanced-tag scan. The original line,
 *   src.indexOf('</div>', src.indexOf('id="drawer"'))
 * finds the FIRST closing div after the id, which lands four levels inside the
 * drawer, so even the dead variable held broken markup.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson, callWrite } from './instatic-mcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VOID = new Set(['img', 'br', 'input', 'meta', 'link', 'hr', 'source', 'wbr', 'col', 'area']);

/** The complete outerHTML of the element whose start tag contains `needle`. */
function extract(html, needle) {
  const at = html.indexOf(needle);
  if (at < 0) throw new Error('not found: ' + needle);
  const start = html.lastIndexOf('<', at);
  let depth = 0;
  const re = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
  re.lastIndex = start;
  for (let m; (m = re.exec(html));) {
    const [, close, name, , selfClose] = m;
    if (VOID.has(name.toLowerCase()) || selfClose === '/') continue;
    depth += close ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  throw new Error('unbalanced markup around ' + needle);
}

const source = JSON.parse(fs.readFileSync(path.join(HERE, '.instatic2/thank-you.json'), 'utf8')).html
  .replace(/\suid="[^"]*"/g, '');
const drawer = extract(source, 'id="drawer"');
console.log(`drawer: ${drawer.length} chars, ${(drawer.match(/<a\b/g) || []).length} links`);

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
  if (/id="drawer"/.test(html)) { console.log(`  ${slug}: drawer already present`); continue; }

  // Directly after the header, which is where every other page holds it.
  await callWrite('site_insert_html', { parentId: d.rootNodeId, html: drawer, index: 1 });

  let back = '', p2 = 1;
  for (;;) {
    const r = await callJson('site_read_document', { document: d.document, part: p2 });
    back += r.html || '';
    const n = r.pageInfo?.nextPart;
    if (!n) break;
    p2 = n;
  }
  const links = (extract(back.replace(/\suid="[^"]*"/g, ''), 'id="drawer"').match(/<a\b/g) || []).length;
  console.log(`  ${slug}: drawer inserted, reads back with ${links} links`);
}
