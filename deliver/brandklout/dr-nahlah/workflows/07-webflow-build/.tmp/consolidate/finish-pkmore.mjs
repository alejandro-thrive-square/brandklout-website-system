// Finish the merge: the footer links ended up on the COMBO object still named
// "pk-more 7" (renaming the global did not rename combo objects). Recreate the
// combo chains under the canonical name, move the elements, drop the leftovers.
import fs from 'node:fs';
import { callTool } from './wfmcp.mjs';
const SITE='6a6b84cc7fe55ddeabc0b314', HOME='6a6b84cf7fe55ddeabc0b3bf';
const CONTACT='6a719510e5ce71dc7be8d079', BN='c6f4637a-2156-868a-ee78-ae6fdd2987ad';
const CTX='Completing the package-link merge so the footer directions links share the same class as every other instance.';
const gap=()=>new Promise(r=>setTimeout(r,3000));
const say=(l,a)=>console.log(l,'::',(a.text||JSON.stringify(a.raw)).slice(0,200));

// 1. combo chains under the canonical name
for(const c of [{n:'pk-more',p:['contact-a-9']},{n:'of-dirs',p:['contact-a-9','pk-more']},{n:'pk-more',p:['contact-a-10']}]){
  await gap();
  say(c.p.join(' > ')+' > '+c.n, await callTool('data_style_tool',{siteId:SITE,pageId:HOME,context:CTX,
    actions:[{label:'c',create_style:{name:c.n,parent_style_names:c.p,properties:[{property_name:'box-sizing',property_value:'border-box'}]}}]}));
}
// 2. move the five elements
const els=[
 {pid:CONTACT,el:'219a2cc6-2592-8842-b6b2-dc9fe31a5d08',comp:CONTACT,after:['contact-a-9','pk-more','of-dirs']},
 {pid:CONTACT,el:'219a2cc6-2592-8842-b6b2-dc9fe31a5d1c',comp:CONTACT,after:['contact-a-9','pk-more','of-dirs']},
 {pid:CONTACT,el:'219a2cc6-2592-8842-b6b2-dc9fe31a5d5d',comp:CONTACT,after:['contact-a-10','pk-more']},
 {pid:HOME,el:'c6f4637a-2156-868a-ee78-ae6fdd2987be',comp:BN,scope:BN,after:['contact-a-9','pk-more','of-dirs']},
 {pid:HOME,el:'c6f4637a-2156-868a-ee78-ae6fdd2987d7',comp:BN,scope:BN,after:['contact-a-9','pk-more','of-dirs']},
];
for(const e of els){
  await gap();
  const set={id:{component:e.comp,element:e.el},style_names:e.after,return_element_info:true};
  if(e.scope) set.scope_component_id=e.scope;
  say('set '+e.el.slice(0,10), await callTool('data_element_tool',{siteId:SITE,pageId:e.pid,context:CTX,actions:[{label:'s',set_style:set}]}));
}
// 3. drop the leftover combo objects
for(const p of ['contact-a-9','contact-a-10']){
  await gap();
  say('rm .'+p+'.pk-more-7', await callTool('data_style_tool',{siteId:SITE,pageId:HOME,context:CTX,
    actions:[{label:'r',remove_style:{style_name:'pk-more 7',parent_style_names:[p]}}]}));
}
