import fs from 'node:fs';
const page = process.argv[2] || 'thank-you';
const doc = JSON.parse(fs.readFileSync(`${page}/final.json`, 'utf8'));
const p = doc.payload;
const byId = new Map(p.nodes.map((n) => [n._id, n]));
const styles = new Map(p.styles.map((s) => [s._id, s]));
const cls = (n) => (n.classes || []).map((c) => styles.get(c)?.name ?? c).join('.');
const parentOf = new Map();
for (const n of p.nodes) for (const c of n.children || []) parentOf.set(c, n._id);

for (const n of p.nodes) {
  if (n.type !== 'List') continue;
  const bad = (n.children || []).map((c) => byId.get(c)).filter((k) => k && k.type !== 'ListItem' && !k.text);
  if (!bad.length) continue;
  const par = byId.get(parentOf.get(n._id));
  console.log(`List <${n.tag}> [${cls(n)}]  parent=<${par?.tag}> [${par ? cls(par) : '?'}]`);
  for (const b of bad) {
    console.log(`   BAD CHILD: type=${b.type} tag=${b.tag} classes=[${cls(b)}] children=${(b.children || []).length}`);
    console.log(`     data.attr=${JSON.stringify(b.data?.attr)} text=${b.data?.text}`);
    for (const g of b.children || []) {
      const gk = byId.get(g);
      console.log(`       grandchild: ${gk?.text ? 'TEXT ' + JSON.stringify(gk.v).slice(0, 60) : `${gk?.type} <${gk?.tag}> [${gk ? cls(gk) : ''}]`}`);
    }
    const st = styles.get((b.classes || [])[0]);
    if (st) console.log(`     style .${st.name} = ${(st.styleLess || '').slice(0, 200)}`);
  }
}
