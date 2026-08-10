import fs from 'node:fs';
const page = process.argv[2] || 'thank-you';
const chunks = JSON.parse(fs.readFileSync(`${page}/whtml/chunks.json`, 'utf8'));
const re = /<(ul|ol|dl)\b[^>]*>([\s\S]*?)<\/\1>/g;
for (const c of chunks) {
  let m;
  while ((m = re.exec(c.html))) {
    const inner = m[2];
    // direct children tags of the list
    const kids = [...inner.matchAll(/<([a-z]+)\b/g)].map((k) => k[1]);
    const bad = [...new Set(kids)].filter((t) => !['li', 'dt', 'dd'].includes(t));
    console.log(`${c.key} <${m[1]}> children: ${[...new Set(kids)].join(',')}${bad.length ? `   <-- NON-ITEM: ${bad.join(',')}` : ''}`);
    console.log('   ', m[0].slice(0, 220).replace(/\s+/g, ' '));
  }
}
// also: payload node types, to see what became a List
const doc = JSON.parse(fs.readFileSync(`${page}/final.json`, 'utf8'));
const byId = new Map(doc.payload.nodes.map((n) => [n._id, n]));
for (const n of doc.payload.nodes) {
  if (n.type !== 'List') continue;
  const kidTypes = (n.children || []).map((c) => byId.get(c)?.type || '?');
  const bad = kidTypes.filter((t) => t !== 'ListItem' && t !== 'String');
  console.log(`payload List <${n.tag}> children=[${kidTypes.join(',')}]${bad.length ? '  <-- BAD' : ''}`);
}
