// BugHerd #11 (2026-09-16): "its not a hospital setting". Strip the claim everywhere.
const fs = require('fs'), path = require('path');
const R = [
  ['Done in a hospital setting at HCA West Houston. The strongest level', 'Your child is fully asleep. The strongest level'],
  ['Four levels, from a mask to a hospital.', 'Four levels, from a mask to deep sleep.'],
  ['general anesthesia in a hospital setting at HCA West Houston.', 'general anesthesia.'],
  ['general anesthesia in a hospital setting, ', 'general anesthesia, '],
  ['general anesthesia in a hospital setting.', 'general anesthesia.'],
  ['general anesthesia in a hospital setting<', 'general anesthesia<'],
];
const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'assets') walk(p); } else if (e.name === 'index.html') files.push(p); } };
walk(path.resolve(__dirname, '..', 'home'));
for (const f of fs.readdirSync(path.join(__dirname, 'recipes'))) files.push(path.join(__dirname, 'recipes', f));
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8'); const o = s;
  for (const [a, b] of R) s = s.split(a).join(b);
  if (s !== o) { fs.writeFileSync(f, s); console.log('changed', path.relative(path.resolve(__dirname, '..'), f)); }
}
