/* Vendor-prefixed declarations (-webkit-font-smoothing, -webkit-backdrop-filter)
   are refused by data_style_tool, so they live in the site head block — the same
   place every other rule Webflow classes cannot express already lives.
   font-smoothing inherits, so one body rule covers all eight selectors. */
import { callTool as call } from './wfmcp.mjs';
import { SITE } from './wfstyles.mjs';
const ctx='Adding vendor-prefixed declarations the style API refuses, into the site head custom code block.';
const MARK='/* vendor-prefixed: refused by data_style_tool */';
const ADD=`
${MARK}
body{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.site-head,.sticky-bar{-webkit-backdrop-filter:blur(14px)}`;
const cur=await call('data_scripts_tool',{context:ctx,
  actions:[{label:'read', get_site_freeform_code:{site_id:SITE, location:'head'}}]});
const t=cur.text||JSON.stringify(cur);
const d=JSON.parse(t);
// returns an OBJECT when location is given, an ARRAY when it is omitted
const block=d.result?.content ?? d.result?.[0]?.content ?? '';
console.log('current head block:', block.length, 'chars | already patched:', block.includes(MARK));
if (!block.length) throw new Error('head block read as empty — refusing to overwrite');
if (block.includes(MARK)) { console.log('nothing to do'); process.exit(0); }
const next=block.replace('</style>', ADD+'\n</style>');
if (next===block) throw new Error('no </style> found to append before');
console.log('new length:', next.length, next.length<10000?'(fits the 10k slot)':'*** OVER LIMIT ***');
const w=await call('data_scripts_tool',{context:ctx,
  actions:[{label:'write', set_site_freeform_code:{site_id:SITE, location:'head', content:next}}]});
const back=await call('data_scripts_tool',{context:ctx,
  actions:[{label:'verify', get_site_freeform_code:{site_id:SITE, location:'head'}}]});
const bd=JSON.parse(back.text||JSON.stringify(back));
const nb=bd.result?.content ?? bd.result?.[0]?.content ?? '';
console.log('read back:', nb.length, 'chars | patch present:', nb.includes(MARK));
