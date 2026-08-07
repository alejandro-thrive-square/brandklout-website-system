import { liveStyles } from './wfstyles.mjs';
const want = new Set(['grid','grid--2','grid--3','foot-grid']);
const list = await liveStyles('read grid ladders');
console.log('total live style records:', list.length);
const seen = new Map();
for (const s of list) {
  if (!want.has(s.name)) continue;
  const key = s.id || s.styleId || s.selector;
  if (seen.has(key)) continue;
  seen.set(key, 1);
  const P = s.properties || {};
  const base = P.base?.properties?.['grid-template-columns'];
  const rows = {};
  for (const [bp, v] of Object.entries(P.breakpoints || {})) {
    if (v?.properties?.['grid-template-columns']) rows[bp] = v.properties['grid-template-columns'];
  }
  console.log(String(s.name).padEnd(10), '|', String(key).slice(0,12), '| base:', base, '|', JSON.stringify(rows));
}
