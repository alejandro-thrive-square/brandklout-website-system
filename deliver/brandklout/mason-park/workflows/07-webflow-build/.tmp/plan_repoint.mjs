/* Build the re-pointing plan. Webflow reports a forked class by its DISPLAY
   name — "skip-link 2", with a space — while the published CSS calls it
   .skip-link-2. Matching on the CSS form finds nothing, which reads as "no
   forks" on a page that is full of them. */
import fs from 'node:fs';
const PAGES=['invisalign','new-patient-special','thank-you'];
const want=new Set();
for (const pg of PAGES) {
  const p=JSON.parse(fs.readFileSync(`.tmp/pc/${pg}/final.json`,'utf8')).payload;
  for (const s of p.styles) want.add(s.name);
}
const canonical=(n)=>{
  const m=n.match(/^(.*) (\d+)$/);
  if (m && want.has(m[1])) return m[1];
  return null;
};
const plan={};
for (const pg of PAGES) {
  const d=JSON.parse(fs.readFileSync(`.tmp/live/${pg}.tree.json`,'utf8'));
  const root=d.result[0].data;
  const items=[];
  (function walk(n){
    const sn=n.styleNames||[];
    if (sn.some(canonical)) {
      const next=sn.map(x=>canonical(x)||x);
      items.push({id:n.id, from:sn, to:next});
    }
    for (const c of n.children||[]) walk(c);
  })(root);
  plan[pg]=items;
  const forked=new Set(items.flatMap(i=>i.from.filter(canonical)));
  console.log(`${pg.padEnd(20)} elements to re-point: ${String(items.length).padStart(3)} | distinct forks: ${forked.size}`);
  if (forked.size) console.log('    '+[...forked].slice(0,8).join(', '));
}
fs.writeFileSync('.tmp/repoint-plan.json', JSON.stringify(plan,null,1));
const unknown=new Set();
for (const pg of PAGES) {
  const d=JSON.parse(fs.readFileSync(`.tmp/live/${pg}.tree.json`,'utf8'));
  (function walk(n){ for (const s of n.styleNames||[]) if(!want.has(s)&&!canonical(s)) unknown.add(s);
    for (const c of n.children||[]) walk(c); })(d.result[0].data);
}
console.log('style names that are neither payload nor a resolvable fork:', unknown.size, [...unknown].slice(0,10).join(', '));
