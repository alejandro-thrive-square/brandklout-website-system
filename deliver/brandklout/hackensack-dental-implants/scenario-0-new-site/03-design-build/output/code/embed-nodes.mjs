// Client workaround, 2026-10-09. Run after ship.sh (which fetches output/import-out.json) and before
// push-site.mjs. Turns every embed MARKER the converter carried (an emptied
// `<div data-embed="<kind>">`) into the brandklout.embed-origins Embed block, IN the converted payload,
// so push-site writes it with the page through site-document.
//
// Why not place-embeds.mjs: it writes through PATCH /data/rows, which flattens a nested slug (a/b
// serves at /a-b), so it SKIPS every nested page, and it allows one page per embed key. This site
// carries the consultation survey on ~30 pages, most of them nested (/services/*, /blog/*). Same
// node shape as place-embeds.mjs (module id, props + snippet, the marker's id, parent and author
// classes minus wz-embed); the snippet is read back out of the BUILT page, so the page source stays
// the only copy. Fix on main: place-embeds through site-document, keys by kind not by page.
//
// Usage (from the step folder): node output/code/embed-nodes.mjs [--config output/code/embeds.json]
//   embeds.json: { "<kind>": { "props": { source, url, title, fit, height, ratio, lazy, allowFullscreen, allow } } }
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'output');
const cfgIx = process.argv.indexOf('--config');
const CONFIG = path.resolve(cfgIx >= 0 ? process.argv[cfgIx + 1] : path.join(OUT, 'code', 'embeds.json'));
const EMBEDS = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
const DIST = path.join(OUT, 'code', 'site-src', 'dist');
const MODULE_ID = 'brandklout.embed-origins.embed';
const file = path.join(OUT, 'import-out.json');
const converted = JSON.parse(fs.readFileSync(file, 'utf8'));
const nameById = new Map(Object.entries(converted.styleRules).map(([id, r]) => [id, String(r.name ?? '').replace(/^\./, '')]));

/* the marker's contents in the built page: from the opening <div …data-embed="kind"…> to the </div>
   that balances it (vendor snippets carry divs of their own) */
function snippets(slug, kind) {
  const html = fs.readFileSync(path.join(DIST, `${slug}.html`), 'utf8');
  const out = [];
  const open = new RegExp('<div[^>]*\\sdata-embed="' + kind + '"[^>]*>', 'g');
  let m;
  while ((m = open.exec(html))) {
    const tag = /<\/?div\b[^>]*>/g;
    tag.lastIndex = m.index + m[0].length;
    let depth = 1;
    let t;
    while ((t = tag.exec(html))) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { out.push(html.slice(m.index + m[0].length, t.index).trim()); break; }
    }
  }
  return out;
}

let placed = 0;
const perPage = [];
for (const p of converted.pages) {
  const markers = Object.values(p.nodes).filter((n) => n.props?.htmlAttributes?.['data-embed']);
  if (!markers.length) continue;
  const seen = {};
  for (const n of markers) {
    const kind = n.props.htmlAttributes['data-embed'];
    const cfg = EMBEDS[kind];
    if (!cfg) throw new Error(`${p.slug}: data-embed="${kind}" is not in ${CONFIG}`);
    if (n.children?.length) throw new Error(`${p.slug}: the ${kind} marker has ${n.children.length} child node(s); run empty-embed-markers.mjs before ship.sh`);
    const i = (seen[kind] = (seen[kind] ?? -1) + 1);
    const snippet = snippets(p.slug, kind)[i];
    if (!snippet) throw new Error(`${p.slug}: no built ${kind} marker #${i + 1} with contents in dist/${p.slug}.html`);
    p.nodes[n.id] = {
      id: n.id,
      moduleId: MODULE_ID,
      props: { ...cfg.props, snippet },
      breakpointOverrides: n.breakpointOverrides ?? {},
      children: [],
      classIds: (n.classIds ?? []).filter((id) => nameById.get(id) !== 'wz-embed'),
      parentId: n.parentId ?? null,
    };
    placed++;
  }
  perPage.push(`${p.slug.padEnd(48)} ${markers.map((n) => n.props?.htmlAttributes?.['data-embed'] ?? '').join(', ')}`);
}
fs.writeFileSync(file, JSON.stringify(converted));
for (const l of perPage) console.log(l);
console.log(`${placed} marker(s) -> ${MODULE_ID} across ${perPage.length} page(s) in import-out.json`);
