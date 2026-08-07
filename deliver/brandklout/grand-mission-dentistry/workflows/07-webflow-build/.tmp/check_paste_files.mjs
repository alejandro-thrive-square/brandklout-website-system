/**
 * check_paste_files.mjs — read every paste page the way the BROWSER will:
 * pull the application/json block out of the HTML, parse it, and confirm the
 * payload matches the page's final.json. A silently-truncated or mis-encoded
 * block copies garbage to the clipboard and the Designer rejects the paste
 * with no error, which looks exactly like "the paste didn't work".
 */
import fs from 'node:fs';

const FILES = {
  implant: ['PASTE-THESE/implant-FULL-PAGE.html', 'implant/final.json'],
  cosmetic: ['PASTE-THESE/cosmetic-FULL-PAGE.html', 'cosmetic/final.json'],
  'thank-you': ['PASTE-THESE/thank-you-FULL-PAGE.html', 'thank-you/final.json'],
};

for (const [name, [pastePath, finalPath]] of Object.entries(FILES)) {
  const html = fs.readFileSync(pastePath, 'utf8');
  const expect = JSON.parse(fs.readFileSync(finalPath, 'utf8')).payload;

  const bom = html.charCodeAt(0) === 0xfeff;
  const m = html.match(/<script type="application\/json" id="payload">([\s\S]*?)<\/script>/);
  if (!m) { console.log(`${name}: FAIL — no payload block`); continue; }

  let doc;
  try { doc = JSON.parse(m[1]); }
  catch (e) { console.log(`${name}: FAIL — payload does not parse: ${e.message}`); continue; }

  const p = doc.payload;
  const referenced = new Set();
  for (const n of p.nodes) for (const c of n.children || []) referenced.add(c);
  const roots = p.nodes.filter((n) => !referenced.has(n._id)).length;

  const okNodes = p.nodes.length === expect.nodes.length;
  const okStyles = p.styles.length === expect.styles.length;
  const hasCopy = html.includes("setData('application/json'");
  const pass = okNodes && okStyles && roots === 1 && hasCopy && !bom;

  console.log(
    `${name.padEnd(10)} ${pass ? 'OK  ' : 'FAIL'} ` +
    `nodes ${p.nodes.length}/${expect.nodes.length} styles ${p.styles.length}/${expect.styles.length} ` +
    `roots ${roots} type=${doc.type} copyPath=${hasCopy} bom=${bom} bytes=${html.length}`,
  );
}
