// Moves the current keyframes into keys/<round>/ and records them as rejects, so --stage keys renders afresh.
// Usage: node keep-round.cjs <round-name> "<why>"
const fs = require('fs');
const [round, why] = process.argv.slice(2);
const st = JSON.parse(fs.readFileSync('hero-film-state.json', 'utf8'));
fs.mkdirSync(`keys/${round}`, { recursive: true });
for (const f of fs.readdirSync('keys').filter((f) => f.endsWith('.jpg'))) {
  fs.renameSync(`keys/${f}`, `keys/${round}/${f}`);
  const name = f.replace(/(\.raw)?\.jpg$/, '');
  if (!f.includes('.raw.')) { st.rejected.push({ kind: 'key', name, why, file: `keys/${round}/${f}`, at: new Date().toISOString() }); delete st.keys[name]; }
}
fs.writeFileSync('hero-film-state.json', JSON.stringify(st, null, 2) + '\n');
console.log('kept', round);
