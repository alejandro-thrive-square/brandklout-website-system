// Search Magnific and write the first twelve candidates per slot, with their
// preview URLs, so a contact sheet can be LOOKED AT before a credit is spent.
//   node probe-stock.mjs terms.json candidates.json
// terms.json: { "<key>": { "term": "...", "orientation": "horizontal", "people": false } }
// The 2026-09-09 evening pass chose every new frame this way and pinned the
// chosen id in get-stock.mjs; one search result titled "mouthguard" was a
// boy in a face mask, which is the whole reason this file exists.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
function apiKey(){ let dir=HERE; for(let i=0;i<12;i++){ const c=path.join(dir,".env"); if(fs.existsSync(c)){ const l=fs.readFileSync(c,"utf8").split("\n").find(l=>l.startsWith("MAGNIFIC=")); if(l) return l.slice(9).trim().replace(/^["']|["']$/g,""); } const up=path.dirname(dir); if(up===dir) break; dir=up; } throw new Error("no key"); }
const KEY=apiKey();
const api=async(u)=>{const r=await fetch(u,{headers:{"x-freepik-api-key":KEY}});const t=await r.text(); if(!r.ok) throw new Error(r.status+" "+t.slice(0,200)); return JSON.parse(t);};
const terms = JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
const out = {};
for (const [key, {term, orientation, people}] of Object.entries(terms)) {
  let url=`https://api.freepik.com/v1/resources?term=${encodeURIComponent(term)}&limit=12&order=relevance&filters[content_type][photo]=1&filters[orientation][${orientation}]=1`;
  if(!people) url+=`&filters[people][exclude]=1`;
  try { const {data}=await api(url); out[key]=(data||[]).map(d=>({id:d.id,title:String(d.title||"").slice(0,90),preview:d.image?.source?.url||d.preview?.url||null})); console.log(key, out[key].length); }
  catch(e){ console.log(key,"FAIL",e.message); }
}
fs.writeFileSync(process.argv[3], JSON.stringify(out,null,1));
