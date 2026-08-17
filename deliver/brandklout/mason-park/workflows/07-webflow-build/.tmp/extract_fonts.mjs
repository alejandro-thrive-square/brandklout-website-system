/* Enumerate every (class-chain, breakpoint, font-family) the payloads expect.
   Webflow stores ONE family, not a stack — send the first name only. */
import fs from 'node:fs';
const PAGES=['invisalign','new-patient-special','thank-you'];
const first=(v)=>v.split(',')[0].trim().replace(/^["']|["']$/g,'');
const out=new Map();
for (const pg of PAGES) {
  const p=JSON.parse(fs.readFileSync(`.tmp/pc/${pg}/final.json`,'utf8')).payload;
  const byId=new Map(p.styles.map(s=>[s._id,s]));
  const parentsOf=new Map();
  for (const s of p.styles) for (const k of s.children||[]) {
    if(!parentsOf.has(k)) parentsOf.set(k,[]); parentsOf.get(k).push(s);
  }
  const chains=(s)=>{
    if (s.comb!=='&') return [[s.name]];
    const ps=parentsOf.get(s._id)||[];
    if(!ps.length) return [[s.name]];
    return ps.flatMap(par=>chains(par).map(c=>[...c,s.name]));
  };
  for (const s of p.styles) {
    const grab=(less,bp)=>{
      const m=(less||'').match(/font-family:\s*([^;]+)/);
      if(!m) return;
      const fam=first(m[1]);
      for (const chain of chains(s)) {
        const key=JSON.stringify([chain,bp,fam]);
        if(!out.has(key)) out.set(key,{chain,bp,fam,pages:new Set()});
        out.get(key).pages.add(pg);
      }
    };
    grab(s.styleLess,'main');
    for (const [bp,v] of Object.entries(s.variants||{})) grab(v.styleLess,bp);
  }
}
const rows=[...out.values()];
const byFam={}; for(const r of rows) byFam[r.fam]=(byFam[r.fam]||0)+1;
console.log('font-family declarations expected:',rows.length, JSON.stringify(byFam));
console.log('breakpoints:', JSON.stringify(rows.reduce((a,r)=>(a[r.bp]=(a[r.bp]||0)+1,a),{})));
console.log('combo depth:', JSON.stringify(rows.reduce((a,r)=>(a[r.chain.length]=(a[r.chain.length]||0)+1,a),{})));
fs.writeFileSync('.tmp/font-actions.json', JSON.stringify(rows.map(r=>({chain:r.chain,bp:r.bp,fam:r.fam})),null,1));
console.log('-> .tmp/font-actions.json');
