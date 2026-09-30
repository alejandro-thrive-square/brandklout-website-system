// Client workaround, 2026-09-30. Run between build-import-input.mjs and ship.sh.
//
// place-embeds.mjs needs every `data-embed` marker to reach Instatic EMPTY (it swaps the emptied
// node for the Embed block and reads the vendor snippet back out of the built page). The step that
// empties them ("0c" in bk-stone's build-import-input.mjs) did not make it into the promoted
// tools/instatic-site/push/build-import-input.mjs, so the marker arrives holding the dead div the
// importer makes of the iframe and place-embeds refuses. This does that one step on the payload.
// Remove once main's build-import-input.mjs empties markers itself.
//
// Usage (from the step folder): node output/code/empty-embed-markers.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const out = path.join(process.cwd(), 'output');
const gz = path.join(out, 'import-input.json.gz');
const input = JSON.parse(zlib.gunzipSync(fs.readFileSync(gz)).toString('utf8'));
let emptied = 0;
// A marker is emptied up to the </div> that BALANCES it, not the first </div>: vendor snippets
// carry divs of their own (Elfsight's `<div class="elfsight-app-…"></div>`), and a non-greedy match
// left the marker's own </div> behind, closing the marker's parent early (2026-09-30).
function emptyMarkers(html) {
  const open = /<div[^>]*\sdata-embed="[^"]*"[^>]*>/g;
  const tag = /<\/?div\b[^>]*>/g;
  let out = '';
  let cursor = 0;
  let m;
  while ((m = open.exec(html))) {
    const innerStart = m.index + m[0].length;
    tag.lastIndex = innerStart;
    let depth = 1;
    let t;
    let innerEnd = -1;
    while ((t = tag.exec(html))) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { innerEnd = t.index; break; }
    }
    if (innerEnd < 0) throw new Error(`unbalanced embed marker at ${m.index}`);
    if (html.slice(innerStart, innerEnd).trim()) emptied++;
    out += html.slice(cursor, innerStart);
    cursor = innerEnd;
    open.lastIndex = innerEnd;
  }
  return out + html.slice(cursor);
}
for (const page of input.pages) {
  page.html = emptyMarkers(page.html);
  if (/<iframe/i.test(page.html)) throw new Error(`${page.slug}: an <iframe> outside an embed marker cannot survive importHtml`);
}
const packed = zlib.gzipSync(Buffer.from(JSON.stringify(input)), { level: 9 });
fs.writeFileSync(gz, packed);
fs.writeFileSync(path.join(out, 'import-input.b64'), packed.toString('base64'));
console.log(`emptied ${emptied} embed marker(s); payload ${(packed.length / 1024).toFixed(1)}KB gz`);
