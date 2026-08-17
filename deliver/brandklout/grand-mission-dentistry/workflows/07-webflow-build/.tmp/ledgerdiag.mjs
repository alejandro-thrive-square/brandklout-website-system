import fs from 'node:fs';
const k = JSON.parse(fs.readFileSync('whtml-known.json', 'utf8'));
const keys = Object.keys(k);
console.log('ledger entries:', keys.length);
const show = (needle, n = 3) => {
  const hits = keys.filter((x) => x.includes(needle));
  console.log(`\nkeys containing ${needle}: ${hits.length}`);
  for (const h of hits.slice(0, n)) console.log('  KEY', h, '\n     VAL', JSON.stringify(k[h]).slice(0, 160));
};
show('ty-i');
show('gm-header');
show('mpd-box');
